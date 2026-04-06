export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function createRunState() {
  const harness = createAppHarness();
  const { appEngine, content, combatEngine, seedBundle, browserWindow } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  const deckServices = browserWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES;
  return { state, content, deckServices, browserWindow };
}

function cloneRun(run: RunState): RunState {
  return JSON.parse(JSON.stringify(run)) as RunState;
}

function findGamblerOutcome(options: {
  actionId: string;
  gold: number;
  mutateRun?: (run: RunState) => void;
  predicate: (result: ActionResult, run: RunState, baseDeckSize: number) => boolean;
  maxSeed?: number;
}) {
  const { state, content, deckServices } = createRunState();
  const baseRun = cloneRun(state.run);
  const maxSeed = options.maxSeed || 5000;

  for (let seed = 1; seed <= maxSeed; seed += 1) {
    const run = cloneRun(baseRun);
    run.seed = seed;
    run.gold = options.gold;
    options.mutateRun?.(run);
    const baseDeckSize = run.deck.length;
    const result = deckServices.applyGamblerAction(run, content, options.actionId);
    if (options.predicate(result, run, baseDeckSize)) {
      return { result, run, baseDeckSize, seed };
    }
  }

  assert.fail(`No matching gambler outcome found for ${options.actionId} within ${maxSeed} seeds.`);
}

// ── Blacksmith ──

test("buildBlacksmithActions returns at least one action", () => {
  const { state, content, deckServices } = createRunState();
  const actions = deckServices.buildBlacksmithActions(state.run, content);
  assert.ok(Array.isArray(actions));
  assert.ok(actions.length >= 1);
  for (const action of actions) {
    assert.equal(action.category, "blacksmith");
    assert.ok(action.id);
    assert.ok(action.title);
  }
});

test("buildBlacksmithActions shows no-forge-work placeholder when none available", () => {
  const { state, content, deckServices } = createRunState();
  // Wipe deck to something non-evolvable
  state.run.deck = ["nonexistent_card"];
  const actions = deckServices.buildBlacksmithActions(state.run, content);
  assert.ok(actions.length >= 1);
  const placeholder = actions.find((a: TownAction) => a.id === "blacksmith_no_forge_work");
  assert.ok(placeholder);
  assert.equal(placeholder.disabled, true);
});

test("applyBlacksmithAction rejects when card has no evolution path", () => {
  const { state, content, deckServices } = createRunState();
  const result = deckServices.applyBlacksmithAction(state.run, content, "blacksmith_evolve_nonexistent");
  assert.equal(result.ok, false);
});

test("applyBlacksmithAction rejects when gold is insufficient", () => {
  const { state, content, deckServices, browserWindow } = createRunState();
  const evo = browserWindow.__ROUGE_SKILL_EVOLUTION;
  const evolvable = evo.listEvolvableCards(state.run);
  if (evolvable.length > 0) {
    state.run.gold = 0;
    const result = deckServices.applyBlacksmithAction(state.run, content, `blacksmith_evolve_${evolvable[0].cardId}`);
    assert.equal(result.ok, false);
    assert.ok(result.message.includes("gold"));
  }
});

test("applyBlacksmithAction refine replaces a card with its plus version", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 999;
  state.run.deck.unshift("quick_slash");
  const quickSlashCountBefore = state.run.deck.filter((cardId) => cardId === "quick_slash").length;
  const result = deckServices.applyBlacksmithAction(state.run, content, "blacksmith_refine_quick_slash");
  assert.equal(result.ok, true);
  assert.ok(state.run.deck.includes("quick_slash_plus"));
  assert.equal(state.run.deck.filter((cardId) => cardId === "quick_slash").length, quickSlashCountBefore - 1);
});

test("applyBlacksmithAction refine keeps class cards on their evolution path", () => {
  const { state, content, deckServices, browserWindow } = createRunState();
  state.run.gold = 999;
  state.run.actNumber = 2;
  const evo = browserWindow.__ROUGE_SKILL_EVOLUTION;

  assert.ok(content.cardCatalog.barbarian_bash_plus, "barbarian_bash should have a generated plus variant");

  const refineResult = deckServices.applyBlacksmithAction(state.run, content, "blacksmith_refine_barbarian_bash");
  assert.equal(refineResult.ok, true);
  assert.ok(state.run.deck.includes("barbarian_bash_plus"));

  const evolvable = evo.listEvolvableCards(state.run);
  const refinedEvolution = evolvable.find((entry: { cardId: string; targetId: string; cost: number }) => entry.cardId === "barbarian_bash_plus");
  assert.ok(refinedEvolution, "refined class cards should still be evolvable");
  assert.equal(refinedEvolution?.targetId, "barbarian_stun_plus");

  const evolveResult = deckServices.applyBlacksmithAction(state.run, content, "blacksmith_evolve_barbarian_bash_plus");
  assert.equal(evolveResult.ok, true);
  assert.ok(state.run.deck.includes("barbarian_stun_plus"));
});

test("skill evolution terminal helper follows a card to its capstone, including refined chains", () => {
  const { browserWindow } = createRunState();
  const evo = browserWindow.__ROUGE_SKILL_EVOLUTION;

  assert.equal(evo.getEvolutionTerminalCardId("assassin_claw_mastery"), "assassin_shadow_warrior");
  assert.equal(evo.getEvolutionTerminalCardId("paladin_holy_fire_plus"), "paladin_conviction_plus");
});

// ── Sage ──

test("buildSageActions includes identify, purge, and transform actions", () => {
  const { state, content, deckServices } = createRunState();
  const actions = deckServices.buildSageActions(state.run, content);
  assert.ok(actions.length >= 2);
  const identify = actions.find((a: TownAction) => a.id === "sage_identify");
  assert.ok(identify, "should include identify action");
  assert.equal(identify.disabled, false);
  assert.equal(identify.cost, 0);

  // There should be purge and transform actions for deck cards
  const purges = actions.filter((a: TownAction) => a.id.startsWith("sage_purge_") && a.id !== "sage_purge_none");
  const transforms = actions.filter((a: TownAction) => a.id.startsWith("sage_transform_"));
  assert.ok(purges.length > 0 || transforms.length > 0, "should have purge or transform actions");
});

test("applySageAction identify returns success", () => {
  const { state, content, deckServices } = createRunState();
  const result = deckServices.applySageAction(state.run, content, "sage_identify");
  assert.equal(result.ok, true);
});

test("applySageAction purge removes a card from deck", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 999;
  const deckBefore = state.run.deck.length;
  const cardToPurge = state.run.deck[0];
  const result = deckServices.applySageAction(state.run, content, `sage_purge_${cardToPurge}`);
  assert.equal(result.ok, true);
  assert.equal(state.run.deck.length, deckBefore - 1);
  assert.ok(state.run.gold < 999, "gold should be spent");
});

test("applySageAction purge fails when deck is at minimum size", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 999;
  state.run.deck = state.run.deck.slice(0, 5);
  const result = deckServices.applySageAction(state.run, content, `sage_purge_${state.run.deck[0]}`);
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("minimum"));
});

test("applySageAction purge fails when gold is insufficient", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 0;
  const result = deckServices.applySageAction(state.run, content, `sage_purge_${state.run.deck[0]}`);
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("gold"));
});

test("applySageAction purge increments sagePurgeCount", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 999;
  const before = state.run.town.sagePurgeCount || 0;
  const cardToPurge = state.run.deck[0];
  deckServices.applySageAction(state.run, content, `sage_purge_${cardToPurge}`);
  assert.equal(state.run.town.sagePurgeCount, before + 1);
});

test("applySageAction transform replaces a card in deck", () => {
  const { state, content, deckServices, browserWindow } = createRunState();
  state.run.gold = 999;
  const evo = browserWindow.__ROUGE_SKILL_EVOLUTION;
  const cardToTransform = state.run.deck.find((cardId) => Boolean(evo.getCardTree(cardId))) || state.run.deck[0];
  const deckBefore = state.run.deck.length;
  const result = deckServices.applySageAction(state.run, content, `sage_transform_${cardToTransform}`);
  assert.equal(result.ok, true);
  assert.equal(state.run.deck.length, deckBefore);
  assert.ok(result.message.includes("transformed") || result.message.includes("Transform"));
});

test("applySageAction transform stays within the same class family when possible", () => {
  const { state, content, deckServices, browserWindow } = createRunState();
  state.run.gold = 999;
  const evo = browserWindow.__ROUGE_SKILL_EVOLUTION;
  const classCard = state.run.deck.find((cardId) => Boolean(evo.getCardTree(cardId)));
  assert.ok(classCard);
  const deckIndex = state.run.deck.indexOf(classCard);
  const result = deckServices.applySageAction(state.run, content, `sage_transform_${classCard}`);
  assert.equal(result.ok, true);
  const transformedCard = state.run.deck[deckIndex];
  assert.notEqual(transformedCard, classCard);
  assert.ok(transformedCard.startsWith("barbarian_"), "transform should stay within barbarian card space");
});

test("applySageAction transform is deterministic for the same run state", () => {
  const first = createRunState();
  const second = createRunState();
  first.state.run.gold = 999;
  second.state.run.gold = 999;
  const cardToTransform = first.state.run.deck[0];

  const firstResult = first.deckServices.applySageAction(first.state.run, first.content, `sage_transform_${cardToTransform}`);
  const secondResult = second.deckServices.applySageAction(second.state.run, second.content, `sage_transform_${cardToTransform}`);

  assert.equal(firstResult.ok, true);
  assert.equal(secondResult.ok, true);
  assert.equal(firstResult.message, secondResult.message);
  assert.equal(JSON.stringify(Array.from(first.state.run.deck)), JSON.stringify(Array.from(second.state.run.deck)));
  assert.equal(first.state.run.gold, second.state.run.gold);
});

test("applySageAction transform fails with insufficient gold", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 0;
  const result = deckServices.applySageAction(state.run, content, `sage_transform_${state.run.deck[0]}`);
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("gold"));
});

test("applySageAction unknown action returns error", () => {
  const { state, content, deckServices } = createRunState();
  const result = deckServices.applySageAction(state.run, content, "sage_unknown_xyz");
  assert.equal(result.ok, false);
});

test("buildSageActions shows purge-none placeholder when deck is at min size", () => {
  const { state, content, deckServices } = createRunState();
  state.run.deck = state.run.deck.slice(0, 5);
  const actions = deckServices.buildSageActions(state.run, content);
  const purgeNone = actions.find((a: TownAction) => a.id === "sage_purge_none");
  assert.ok(purgeNone);
  assert.equal(purgeNone.disabled, true);
});

// ── Gambler ──

test("buildGamblerActions returns tier-appropriate actions", () => {
  const { state, deckServices } = createRunState();
  state.run.gold = 999;
  const actions = deckServices.buildGamblerActions(state.run);
  assert.ok(actions.length >= 1);
  for (const action of actions) {
    assert.equal(action.category, "gambler");
    assert.ok(action.id.startsWith("gambler_mystery_"));
  }
});

test("buildGamblerActions respects act gating for gold tier", () => {
  const { state, deckServices } = createRunState();
  state.run.actNumber = 1;
  state.run.gold = 9999;
  const actionsAct1 = deckServices.buildGamblerActions(state.run);
  const goldAct1 = actionsAct1.find((a: TownAction) => a.id === "gambler_mystery_gold");
  // Gold tier requires act 3+
  assert.equal(goldAct1, undefined);

  state.run.actNumber = 3;
  const actionsAct3 = deckServices.buildGamblerActions(state.run);
  const goldAct3 = actionsAct3.find((a: TownAction) => a.id === "gambler_mystery_gold");
  assert.ok(goldAct3);
});

test("applyGamblerAction bronze deducts gold and returns ok", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 999;
  const goldBefore = state.run.gold;
  const result = deckServices.applyGamblerAction(state.run, content, "gambler_mystery_bronze");
  assert.equal(result.ok, true);
  assert.ok(state.run.gold < goldBefore, "gold should be spent");
});

test("applyGamblerAction fails with insufficient gold", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 0;
  const result = deckServices.applyGamblerAction(state.run, content, "gambler_mystery_bronze");
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("gold"));
});

test("applyGamblerAction silver deducts gold and returns ok", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 999;
  const result = deckServices.applyGamblerAction(state.run, content, "gambler_mystery_silver");
  assert.equal(result.ok, true);
});

test("applyGamblerAction gold deducts gold and returns ok", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 9999;
  state.run.actNumber = 3;
  const result = deckServices.applyGamblerAction(state.run, content, "gambler_mystery_gold");
  assert.equal(result.ok, true);
});

test("applyGamblerAction unknown tier returns error", () => {
  const { state, content, deckServices } = createRunState();
  state.run.gold = 9999;
  const result = deckServices.applyGamblerAction(state.run, content, "gambler_mystery_diamond");
  assert.equal(result.ok, false);
});

test("applyGamblerAction is deterministic for the same run state", () => {
  const first = createRunState();
  const second = createRunState();
  first.state.run.gold = 999;
  second.state.run.gold = 999;

  const firstResult = first.deckServices.applyGamblerAction(first.state.run, first.content, "gambler_mystery_bronze");
  const secondResult = second.deckServices.applyGamblerAction(second.state.run, second.content, "gambler_mystery_bronze");

  assert.equal(firstResult.ok, true);
  assert.equal(secondResult.ok, true);
  assert.equal(firstResult.message, secondResult.message);
  assert.equal(first.state.run.gold, second.state.run.gold);
  assert.equal(JSON.stringify(Array.from(first.state.run.deck)), JSON.stringify(Array.from(second.state.run.deck)));
});

test("applyGamblerAction bronze can resolve to a refund without growing the deck", () => {
  const outcome = findGamblerOutcome({
    actionId: "gambler_mystery_bronze",
    gold: 999,
    predicate(result, run, baseDeckSize) {
      return result.ok && result.message.includes("pouch of") && run.deck.length === baseDeckSize;
    },
  });

  assert.ok(outcome.result.message.includes("Better luck next time."));
  assert.equal(outcome.run.deck.length, outcome.baseDeckSize);
});

test("applyGamblerAction silver can fall through to the tier-one consolation card branch", () => {
  const outcome = findGamblerOutcome({
    actionId: "gambler_mystery_silver",
    gold: 999,
    predicate(result, run, baseDeckSize) {
      return result.ok && result.message.includes("Not quite what you hoped for.") && run.deck.length === baseDeckSize + 1;
    },
  });

  assert.ok(outcome.result.message.includes("Gamble reveals:"));
  assert.equal(outcome.run.deck.length, outcome.baseDeckSize + 1);
});

test("applyGamblerAction gold can resolve to the empty-box refund branch without growing the deck", () => {
  const outcome = findGamblerOutcome({
    actionId: "gambler_mystery_gold",
    gold: 9999,
    mutateRun(run) {
      run.actNumber = 3;
    },
    predicate(result, run, baseDeckSize) {
      return result.ok && result.message.includes("empty box") && run.deck.length === baseDeckSize;
    },
  });

  assert.ok(outcome.result.message.includes("gambler smirks"));
  assert.equal(outcome.run.deck.length, outcome.baseDeckSize);
});
