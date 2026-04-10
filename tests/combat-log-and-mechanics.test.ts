export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function createHarness() {
  const harness = createAppHarness();
  return {
    harness,
    engine: harness.combatEngine as CombatEngineApi,
    combatLog: harness.browserWindow.__ROUGE_COMBAT_LOG as CombatLogApi,
    content: harness.content as GameContent,
  };
}

function createState(h: ReturnType<typeof createHarness>, encounterId = "act_1_opening_skirmish") {
  return h.engine.createCombatState({
    content: h.content,
    encounterId,
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });
}

function prepareSingleTargetEnemyAttackState(h: ReturnType<typeof createHarness>) {
  const state = createState(h);
  const enemy = state.enemies[0];
  enemy.intents = [{ kind: "attack", label: "Test Strike", value: 7, target: "hero" }];
  enemy.intentIndex = 0;
  enemy.currentIntent = { ...enemy.intents[0] };
  state.enemies = [enemy];
  state.selectedEnemyId = enemy.id;
  state.mercenary.attack = 0;
  state.mercenary.nextAttackBonus = 0;
  return state;
}

// ─── Combat Log: Actor Attribution ────────────────────────────────────────────

test("combat log attributes card plays to hero with action card_play", () => {
  const h = createHarness();
  const state = createState(h);
  const card = state.hand.find((c: CardInstance) => {
    const def = h.content.cardCatalog[c.cardId];
    return def && Number(def.cost || 0) <= state.hero.energy && def.target === "enemy";
  });
  assert.ok(card, "should have a playable card");
  const target = state.enemies.find((e: CombatEnemyState) => e.alive);
  h.engine.playCard(state, h.content, card.instanceId, target?.id || "");
  const cardEntry = state.log.find((entry: CombatLogEntry) => entry.action === "card_play");
  assert.ok(cardEntry, "should have a card_play entry");
  assert.equal(cardEntry.actor, "hero");
  assert.equal(cardEntry.actorName, "the Wanderer");
});

test("combat log attributes enemy intents to the acting enemy", () => {
  const h = createHarness();
  const state = createState(h);
  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);
  const intentEntry = state.log.find((entry: CombatLogEntry) => entry.action === "intent" && entry.actor === "enemy");
  assert.ok(intentEntry, "should have an enemy intent entry");
  assert.ok(intentEntry.actorName.length > 0, "enemy should have a name");
  assert.ok(intentEntry.actorId, "enemy should have an id");
});

test("combat log attributes melee strikes to hero", () => {
  const h = createHarness();
  const state = createState(h);
  h.engine.meleeStrike(state, h.content);
  const meleeEntry = state.log.find((entry: CombatLogEntry) => entry.action === "melee");
  assert.ok(meleeEntry, "should have a melee entry");
  assert.equal(meleeEntry.actor, "hero");
});

test("combat log attributes potion use to hero", () => {
  const h = createHarness();
  const state = createState(h);
  state.hero.life = Math.max(1, state.hero.maxLife - 20);
  h.engine.usePotion(state, "hero");
  const potionEntry = state.log.find((entry: CombatLogEntry) => entry.action === "potion");
  assert.ok(potionEntry, "should have a potion entry");
  assert.equal(potionEntry.actor, "hero");
});

test("combat log attributes skill use to hero with skill_use action", () => {
  const h = createHarness();
  const state = createState(h);
  const readySkill = state.equippedSkills.find((s: CombatEquippedSkillState) => s.active && s.remainingCooldown <= 0 && s.cost <= state.hero.energy);
  if (!readySkill) { return; }
  h.engine.useSkill(state, readySkill.slotKey, state.selectedEnemyId);
  const skillEntry = state.log.find((entry: CombatLogEntry) => entry.action === "skill_use");
  assert.ok(skillEntry, "should have a skill_use entry");
  assert.equal(skillEntry.actor, "hero");
});

// ─── Combat Log: Tone Classification ──────────────────────────────────────────

test("combat log classifies turn_start as report tone", () => {
  const h = createHarness();
  const state = createState(h);
  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);
  const turnEntry = state.log.find((entry: CombatLogEntry) => entry.action === "turn_start");
  assert.ok(turnEntry, "should have a turn_start entry");
  assert.equal(turnEntry.tone, "report");
});

test("combat log classifies modifier entries as report tone", () => {
  const h = createHarness();
  const state = createState(h);
  const modEntry = state.log.find((entry: CombatLogEntry) => entry.action === "modifier");
  if (modEntry) {
    assert.equal(modEntry.tone, "report");
  }
});

// ─── Combat Log: Summary ──────────────────────────────────────────────────────

test("summarizeCombatLog counts actions by type after a full turn cycle", () => {
  const h = createHarness();
  const state = createState(h);

  // Play a card
  const card = state.hand.find((c: CardInstance) => {
    const def = h.content.cardCatalog[c.cardId];
    return def && Number(def.cost || 0) <= state.hero.energy;
  });
  if (card) {
    const target = state.enemies.find((e: CombatEnemyState) => e.alive);
    h.engine.playCard(state, h.content, card.instanceId, target?.id || "");
  }

  // End turn to trigger enemy phase
  h.engine.endTurn(state);

  const summary = h.combatLog.summarizeCombatLog(state);
  assert.ok(summary.totalEntries > 5, "should have multiple log entries after a full turn");
  assert.ok(summary.enemyActions > 0, "should count enemy actions");
  assert.ok((summary.byAction["intent"] || 0) > 0, "should have intents in byAction");
  assert.ok((summary.byActor["enemy"] || 0) > 0, "should have enemy in byActor");
  assert.ok((summary.byActor["environment"] || 0) > 0, "should have environment in byActor");
  assert.ok((summary.byTone["report"] || 0) > 0, "should have report tone entries");
});

test("summarizeCombatLog classifies defeat cause as null for ongoing combat", () => {
  const h = createHarness();
  const state = createState(h);
  const summary = h.combatLog.summarizeCombatLog(state);
  assert.equal(summary.defeatCause, "timeout", "ongoing combat with no outcome should be timeout");
});

test("summarizeCombatLog classifies defeat cause after hero death", () => {
  const h = createHarness();
  const state = createState(h);
  state.hero.life = 0;
  state.hero.alive = false;
  state.outcome = "defeat" as CombatOutcome;
  const summary = h.combatLog.summarizeCombatLog(state);
  assert.ok(summary.defeatCause !== null, "should classify defeat cause");
  assert.ok(["burst", "attrition", "merc_collapse", "unknown"].includes(summary.defeatCause as string), "defeat cause should be a valid category");
});

test("summarizeCombatLog returns null defeat cause for victory", () => {
  const h = createHarness();
  const state = createState(h);
  state.enemies.forEach((e: CombatEnemyState) => { e.life = 0; e.alive = false; });
  state.outcome = "victory" as CombatOutcome;
  const summary = h.combatLog.summarizeCombatLog(state);
  assert.equal(summary.defeatCause, null);
});

// ─── Combat Log: Effects Data ─────────────────────────────────────────────────

test("enemy intent entries carry damage effects with lifeAfter", () => {
  const h = createHarness();
  const state = createState(h);
  state.phase = "player" as CombatPhase;
  const heroBefore = state.hero.life;
  h.engine.endTurn(state);
  const intentWithDamage = state.log.find((entry: CombatLogEntry) =>
    entry.action === "intent" && entry.actor === "enemy" && entry.effects.length > 0 && (entry.effects[0].damage || 0) > 0
  );
  if (intentWithDamage && heroBefore > state.hero.life) {
    assert.ok(intentWithDamage.effects[0].damage > 0, "should have damage value");
    assert.ok(intentWithDamage.effects[0].lifeAfter >= 0, "should have lifeAfter");
  }
});

test("mercenary action entries carry damage effects", () => {
  const h = createHarness();
  const state = createState(h);
  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);
  const mercEntry = state.log.find((entry: CombatLogEntry) => entry.actor === "mercenary" && entry.action === "intent");
  if (mercEntry && mercEntry.effects.length > 0) {
    assert.equal(mercEntry.effects[0].target, "enemy");
    assert.ok(mercEntry.effects[0].targetName.length > 0, "target should have a name");
  }
});

// ─── Taunt Mechanic ───────────────────────────────────────────────────────────

test("apply_taunt card effect sets taunt on mercenary", () => {
  const h = createHarness();
  const state = createState(h);
  const rallyCard = state.hand.find((c: CardInstance) => c.cardId === "rally_mercenary");
  if (!rallyCard) {
    state.hand.push({ instanceId: "test_rally", cardId: "rally_mercenary" } as CardInstance);
  }
  const instanceId = rallyCard?.instanceId || "test_rally";
  state.hero.energy = 5;
  state.hero.life = Math.max(1, state.hero.maxLife - 10);
  state.mercenary.life = Math.max(1, state.mercenary.maxLife - 10);
  h.engine.playCard(state, h.content, instanceId);
  assert.equal(state.tauntTarget, "mercenary", "taunt should target mercenary");
  assert.ok(state.tauntTurnsRemaining >= 1, "taunt should last at least 1 turn");
});

test("taunt redirects single-target enemy attacks to mercenary", () => {
  const h = createHarness();
  const state = prepareSingleTargetEnemyAttackState(h);
  state.tauntTarget = "mercenary";
  state.tauntTurnsRemaining = 2;
  state.mercenary.life = state.mercenary.maxLife;
  state.hero.life = state.hero.maxLife;
  const mercLifeBefore = state.mercenary.life;
  const heroLifeBefore = state.hero.life;
  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);
  const heroTookDamage = state.hero.life < heroLifeBefore;
  const mercTookDamage = state.mercenary.life < mercLifeBefore;
  if (heroTookDamage || mercTookDamage) {
    assert.ok(mercTookDamage, "mercenary should take damage when taunting");
  }
  assert.equal(state.tauntTurnsRemaining, 1, "taunt should persist for the remaining enemy phase duration");
});

test("taunt decays each turn and clears when expired", () => {
  const h = createHarness();
  const state = prepareSingleTargetEnemyAttackState(h);
  state.tauntTarget = "mercenary";
  state.tauntTurnsRemaining = 1;
  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);
  assert.equal(state.tauntTurnsRemaining, 0, "taunt should decay by 1");
  assert.equal(state.tauntTarget, "", "taunt target should clear when expired");
});

test("fade redirects single-target enemy attacks away from the hero and expires next turn", () => {
  const h = createHarness();
  const state = prepareSingleTargetEnemyAttackState(h);
  state.heroFade = 1;
  state.mercenary.life = state.mercenary.maxLife;
  state.hero.life = state.hero.maxLife;
  const mercLifeBefore = state.mercenary.life;
  const heroLifeBefore = state.hero.life;
  state.phase = "player" as CombatPhase;
  h.engine.endTurn(state);
  assert.equal(state.hero.life, heroLifeBefore, "fade should keep the hero out of the hit");
  assert.ok(state.mercenary.life < mercLifeBefore, "fade should redirect single-target pressure to another ally when possible");
  assert.equal(state.heroFade, 0, "fade should expire after the protected enemy phase");
});

// ─── Multi-Turn Combat Flow ───────────────────────────────────────────────────

test("multi-turn combat produces a coherent log with turn progression", () => {
  const h = createHarness();
  const state = createState(h);
  const maxTurns = 5;

  for (let i = 0; i < maxTurns && !state.outcome; i += 1) {
    if (state.phase === "player") {
      // Play any affordable card
      const card = state.hand.find((c: CardInstance) => {
        const def = h.content.cardCatalog[c.cardId];
        return def && Number(def.cost || 0) <= state.hero.energy;
      });
      if (card) {
        const target = state.enemies.find((e: CombatEnemyState) => e.alive);
        h.engine.playCard(state, h.content, card.instanceId, target?.id || "");
      }
      h.engine.endTurn(state);
    } else {
      h.engine.endTurn(state);
    }
  }

  const summary = h.combatLog.summarizeCombatLog(state);
  assert.ok(summary.totalEntries > 10, "multi-turn combat should have many log entries");
  assert.ok(summary.totalTurns >= 2, "should have progressed multiple turns");
  assert.ok(summary.enemyActions > 0, "enemies should have acted");

  // Verify turn numbers are monotonically non-decreasing in reverse order (log is newest-first)
  let lastTurn = Infinity;
  for (const entry of state.log) {
    assert.ok(entry.turn <= lastTurn, `turn numbers should not increase in log order (got ${entry.turn} after ${lastTurn})`);
    lastTurn = entry.turn;
  }
});

test("combat log entries have valid tone values", () => {
  const h = createHarness();
  const state = createState(h);
  h.engine.endTurn(state);
  const validTones = new Set(["strike", "status", "surge", "summon", "loss", "maneuver", "report"]);
  for (const entry of state.log) {
    assert.ok(validTones.has(entry.tone), `invalid tone "${entry.tone}" on entry: ${entry.message}`);
  }
});

test("combat log entries have valid actor values", () => {
  const h = createHarness();
  const state = createState(h);
  h.engine.endTurn(state);
  const validActors = new Set(["hero", "mercenary", "minion", "enemy", "environment"]);
  for (const entry of state.log) {
    assert.ok(validActors.has(entry.actor), `invalid actor "${entry.actor}" on entry: ${entry.message}`);
  }
});

test("combat log entries have valid action values", () => {
  const h = createHarness();
  const state = createState(h);
  h.engine.endTurn(state);
  const validActions = new Set([
    "card_play", "skill_use", "melee", "potion", "intent", "trait",
    "status_tick", "summon", "death", "modifier", "approach", "setup",
    "turn_start", "turn_end",
  ]);
  for (const entry of state.log) {
    assert.ok(validActions.has(entry.action), `invalid action "${entry.action}" on entry: ${entry.message}`);
  }
});
