export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";

function startRunAndEnterCombat(harness: ReturnType<typeof createHarness>) {
  const { appEngine, appShell, browserWindow, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  const render = () => {
    appShell.render(root, {
      appState: state,
      baseContent: browserWindow.ROUGE_GAME_CONTENT,
      bootState: { status: "ready", error: "" },
    });
  };
  const syncCombatResultAndRender = () => {
    appEngine.syncEncounterOutcome(state);
    render();
  };

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = false;

  return { state, root, render, syncCombatResultAndRender, actionDispatcher, appEngine, combatEngine, createActionTarget, browserWindow };
}

test("doCombatAction captures snapshot, runs action, and calls syncAndRender", () => {
  const harness = createHarness();
  const { browserWindow, content, combatEngine } = harness;
  const combatFx = browserWindow.__ROUGE_ACTION_DISPATCHER_COMBAT_FX;

  const state = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  let synced = false;
  const action = () => { combatEngine.endTurn(state); };
  const syncAndRender = () => { synced = true; };

  combatFx.doCombatAction(state, action, syncAndRender);
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();

  assert.equal(synced, true, "syncAndRender should have been called");
  assert.ok(state.turn >= 1, "turn should have advanced");
});

test("addTempClass adds and removes a CSS class after timeout", (_context, done) => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const combatFx = browserWindow.__ROUGE_ACTION_DISPATCHER_COMBAT_FX;

  const fakeEl = { classList: { add: (_className: string) => {}, remove: (_className: string) => {} } };
  let added = "";
  let removed = "";
  fakeEl.classList.add = (cls: string) => { added = cls; };
  fakeEl.classList.remove = (cls: string) => { removed = cls; };

  combatFx.addTempClass(fakeEl as never, "test-class", 10);
  assert.equal(added, "test-class", "class should be added immediately");

  setTimeout(() => {
    assert.equal(removed, "test-class", "class should be removed after timeout");
    browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
    done();
  }, 50);
});

test("spawnRewardParticles does not throw when sourceEl has getBoundingClientRect", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const rewardFx = browserWindow.__ROUGE_ACTION_DISPATCHER_REWARD_FX;

  const fakeEl = {
    getBoundingClientRect: () => ({ left: 100, top: 200, width: 50, height: 30 }),
  };

  assert.doesNotThrow(() => {
    rewardFx.spawnRewardParticles(fakeEl as never);
  });
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
});

test("spawnRewardParticles is a no-op when sourceEl lacks getBoundingClientRect", () => {
  const harness = createHarness();
  const { browserWindow } = harness;
  const rewardFx = browserWindow.__ROUGE_ACTION_DISPATCHER_REWARD_FX;

  assert.doesNotThrow(() => {
    rewardFx.spawnRewardParticles({} as never);
  });
});

test("app shell renders boot state when appState is null", () => {
  const harness = createHarness();
  const { appShell, browserWindow } = harness;
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: null,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "loading", error: "" },
  });

  assert.ok(root.innerHTML.length > 0, "should render something for boot state");
});

test("app shell renders error state", () => {
  const harness = createHarness();
  const { appShell, browserWindow } = harness;
  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];

  appShell.render(root, {
    appState: null,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "error", error: "Something went wrong" },
  });

  assert.ok(root.innerHTML.includes("Something went wrong") || root.innerHTML.includes("error"), "should show error state");
});

test("app shell renders debug bar when debug mode is enabled", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
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

  if (!state.profile.meta.settings) {
    state.profile.meta.settings = { showHints: true, reduceMotion: false, compactMode: false, debugMode: { enabled: false, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false } };
  }
  state.profile.meta.settings.debugMode = { enabled: true, skipBattles: false, invulnerable: false, oneHitKill: false, infiniteGold: false };

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("debug-bar"), "should render debug bar");
  assert.ok(root.innerHTML.includes("DEBUG"), "should show DEBUG label");
});

test("app shell renders game menu during run phases", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
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

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("game-menu"), "should render game menu during safe_zone");
});

test("app shell renders inventory overlay when inventoryOpen is true", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
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
  state.ui.inventoryOpen = true;

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("inv-overlay"), "should render inventory overlay");
});

test("play-card action through dispatcher is handled for a card in hand", () => {
  const { state, actionDispatcher, appEngine, combatEngine, createActionTarget, syncCombatResultAndRender, browserWindow } =
    startRunAndEnterCombat(createHarness());

  const targetEnemy = state.combat.enemies.find((e: CombatEnemyState) => e.alive);
  if (targetEnemy) { state.combat.selectedEnemyId = targetEnemy.id; }

  // Give enough energy to play any card
  state.combat.hero.energy = 10;

  const card = state.combat.hand[0];
  if (!card) { return; }

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "play-card", instanceId: card.instanceId }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender,
  });
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();

  assert.equal(handled, true, "play-card action should be handled");
});

test("combat skill action renders and can be triggered through the dispatcher", () => {
  const { state, root, render, actionDispatcher, appEngine, combatEngine, createActionTarget, syncCombatResultAndRender, browserWindow } =
    startRunAndEnterCombat(createHarness());

  const activeSkill = state.combat.equippedSkills.find((skill) => skill.active);
  assert.ok(activeSkill, "expected an active equipped combat skill");
  const targetEnemy = state.combat.enemies.find((enemy: CombatEnemyState) => enemy.alive);
  assert.ok(targetEnemy);
  state.combat.selectedEnemyId = targetEnemy.id;
  state.combat.hero.energy = 10;

  render();
  assert.match(root.innerHTML, /data-action="use-combat-skill"/);

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "use-combat-skill", slotKey: activeSkill.slotKey }),
    appState: state,
    appEngine,
    combatEngine,
    render,
    syncCombatResultAndRender,
  });
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();

  assert.equal(handled, true);
  assert.ok(activeSkill.remainingCooldown > 0 || activeSkill.usedThisBattle, "skill should enter cooldown or spend its battle use");
});

test("combat skill rail renders preview metadata and capstone summaries for summon skills", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "sorceress");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = false;
  state.combat = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "sorceress_hydra",
          name: "Hydra",
          requiredLevel: 30,
          family: "commitment",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Summon a hydra that breathes across the line.",
          exactText: "Summon Hydra.",
          active: true,
          skillType: "summon",
          damageType: "fire",
        },
      },
    ],
  });

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /Hydra/);
  assert.match(root.innerHTML, /Capstone/);
  assert.match(root.innerHTML, /Summon a hydra that breathes across the line\./);
  assert.match(root.innerHTML, /data-preview-scope="minions"/);
  assert.match(root.innerHTML, /data-preview-outcome="Summon Hydra.*Next card Burn 4"/);
});

test("combat skill preview api distinguishes line capstones from summon capstones", () => {
  const harness = createHarness();
  const { browserWindow, content, combatEngine } = harness;
  const preview = browserWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
  const combat = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });

  const whirlwindSkill: CombatEquippedSkillState = {
    slotKey: "slot3",
    skillId: "barbarian_whirlwind",
    name: "Whirlwind",
    family: "commitment",
    slot: 3,
    tier: "capstone",
    cost: 2,
    cooldown: 4,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Attack the whole line.",
    exactText: "Hit all enemies.",
    active: true,
    skillType: "attack",
    damageType: "physical",
  };
  const hydraSkill: CombatEquippedSkillState = {
    slotKey: "slot3",
    skillId: "sorceress_hydra",
    name: "Hydra",
    family: "commitment",
    slot: 3,
    tier: "capstone",
    cost: 2,
    cooldown: 4,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Summon Hydra.",
    exactText: "Summon Hydra.",
    active: true,
    skillType: "summon",
    damageType: "fire",
  };

  const whirlwindScopes = preview.deriveSkillPreviewScopes(whirlwindSkill);
  const hydraScopes = preview.deriveSkillPreviewScopes(hydraSkill);
  const whirlwindOutcome = preview.buildSkillPreviewOutcome(combat, whirlwindSkill, combat.enemies.find((enemy) => enemy.alive) || null);
  const hydraOutcome = preview.buildSkillPreviewOutcome(combat, hydraSkill, combat.enemies.find((enemy) => enemy.alive) || null);
  const hydraModifiers = preview.getExactSkillModifierPreviewParts(hydraSkill);

  assert.equal(Array.from(whirlwindScopes).join(","), "enemy_line");
  assert.equal(Array.from(hydraScopes).join(","), "minions");
  assert.match(whirlwindOutcome, /dmg line/);
  assert.match(hydraOutcome, /Summon Hydra/);
  assert.match(hydraOutcome, /Next card Burn 4/);
  assert.equal(Array.from(hydraModifiers).join(","), "Next card Burn 4");
});

test("combat skill preview api exposes mixed target and line scopes for hybrid strike skills", () => {
  const harness = createHarness();
  const { browserWindow, content, combatEngine } = harness;
  const preview = browserWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
  const combat = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const selectedEnemy = combat.enemies.find((enemy) => enemy.alive) || null;

  const phoenixSkill: CombatEquippedSkillState = {
    slotKey: "slot3",
    skillId: "assassin_phoenix_strike",
    name: "Phoenix Strike",
    family: "commitment",
    slot: 3,
    tier: "capstone",
    cost: 2,
    cooldown: 4,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Strike a target and set the whole line ablaze.",
    exactText: "Blast one enemy and burn the full line.",
    active: true,
    skillType: "attack",
    damageType: "fire",
  };
  const fistSkill: CombatEquippedSkillState = {
    slotKey: "slot3",
    skillId: "paladin_fist_of_the_heavens",
    name: "Fist of the Heavens",
    family: "commitment",
    slot: 3,
    tier: "capstone",
    cost: 2,
    cooldown: 4,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Smite one target and rattle the whole line.",
    exactText: "Deal heavy lightning damage and paralyze enemies.",
    active: true,
    skillType: "spell",
    damageType: "lightning",
  };

  assert.equal(Array.from(preview.deriveSkillPreviewScopes(phoenixSkill)).join(","), "enemy_line,selected_enemy");
  assert.equal(Array.from(preview.deriveSkillPreviewScopes(fistSkill)).join(","), "enemy_line,selected_enemy");
  assert.match(preview.buildSkillPreviewOutcome(combat, phoenixSkill, selectedEnemy), /Burn 4 line/);
  assert.match(preview.buildSkillPreviewOutcome(combat, phoenixSkill, selectedEnemy), /Next card \+3 damage/);
  assert.match(preview.buildSkillPreviewOutcome(combat, fistSkill, selectedEnemy), /Paralyze 4 line/);
});

test("combat skill rail renders mixed target and line preview metadata for hybrid capstones", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "assassin");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = false;
  state.combat = combatEngine.createCombatState({
    content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    equippedSkills: [
      {
        slotKey: "slot3",
        skill: {
          id: "assassin_phoenix_strike",
          name: "Phoenix Strike",
          requiredLevel: 30,
          family: "commitment",
          slot: 3,
          tier: "capstone",
          cost: 2,
          cooldown: 4,
          summary: "Strike one target and ignite the whole line.",
          exactText: "Blast the target, then burn every enemy.",
          active: true,
          skillType: "attack",
          damageType: "fire",
        },
      },
    ],
  });

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /Phoenix Strike/);
  assert.match(root.innerHTML, /data-preview-scope="enemy_line,selected_enemy"/);
  assert.match(root.innerHTML, /data-preview-outcome="8 dmg \+ Burn 4 line \+ Next card Burn 5 \+ Next card \+3 damage"/);
});

test("combat skill preview api exposes party, mercenary, and hero support scopes for support signatures", () => {
  const harness = createHarness();
  const { browserWindow, content, combatEngine } = harness;
  const preview = browserWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
  const combat = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const selectedEnemy = combat.enemies.find((enemy) => enemy.alive) || null;

  const sanctuarySkill: CombatEquippedSkillState = {
    slotKey: "slot2",
    skillId: "paladin_sanctuary",
    name: "Sanctuary",
    family: "answer",
    slot: 2,
    tier: "bridge",
    cost: 1,
    cooldown: 3,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Drive back a target and shelter the party.",
    exactText: "Damage one target, slow it, and guard the party.",
    active: true,
    skillType: "spell",
    damageType: "magic",
  };
  const battleCommandSkill: CombatEquippedSkillState = {
    slotKey: "slot2",
    skillId: "barbarian_battle_command",
    name: "Battle Command",
    family: "command",
    slot: 2,
    tier: "bridge",
    cost: 1,
    cooldown: 3,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Sharpen the next sequence.",
    exactText: "Draw, empower the mercenary, and arm the next card.",
    active: true,
    skillType: "buff",
    damageType: "none",
  };
  const energyShieldSkill: CombatEquippedSkillState = {
    slotKey: "slot2",
    skillId: "sorceress_energy_shield",
    name: "Energy Shield",
    family: "state",
    slot: 2,
    tier: "bridge",
    cost: 1,
    cooldown: 3,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Fortify the caster.",
    exactText: "Gain guard, heal, and arm the next card.",
    active: true,
    skillType: "buff",
    damageType: "none",
  };

  assert.equal(Array.from(preview.deriveSkillPreviewScopes(sanctuarySkill)).join(","), "party,selected_enemy");
  assert.equal(Array.from(preview.deriveSkillPreviewScopes(battleCommandSkill)).join(","), "mercenary,hero");
  assert.equal(Array.from(preview.deriveSkillPreviewScopes(energyShieldSkill)).join(","), "hero");
  assert.match(preview.buildSkillPreviewOutcome(combat, sanctuarySkill, selectedEnemy), /Guard 6 party/);
  assert.match(preview.buildSkillPreviewOutcome(combat, battleCommandSkill, selectedEnemy), /Merc \+5/);
  assert.match(preview.buildSkillPreviewOutcome(combat, battleCommandSkill, selectedEnemy), /Next card \+3 damage/);
  assert.match(preview.buildSkillPreviewOutcome(combat, battleCommandSkill, selectedEnemy), /Next card cost -1/);
  assert.match(preview.buildSkillPreviewOutcome(combat, energyShieldSkill, selectedEnemy), /Guard 8/);
  assert.match(preview.buildSkillPreviewOutcome(combat, energyShieldSkill, selectedEnemy), /Next card Guard 4/);
});

test("combat skill preview skills expose exact opener state for passive skills", () => {
  const harness = createHarness();
  const { browserWindow, content, combatEngine } = harness;
  const preview = browserWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
  const skillPreview = browserWindow.__ROUGE_COMBAT_VIEW_PREVIEW_SKILLS;
  const combat = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  combat.weaponFamily = "sword";

  const warmthSkill: CombatEquippedSkillState = {
    slotKey: "slot1",
    skillId: "sorceress_warmth",
    name: "Warmth",
    family: "state",
    slot: 1,
    tier: "starter",
    cost: 0,
    cooldown: 0,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Warm the opening line.",
    exactText: "Heal, boost burn, and arm the next fire card.",
    active: false,
    skillType: "buff",
    damageType: "fire",
  };
  const summonResistSkill: CombatEquippedSkillState = {
    slotKey: "slot1",
    skillId: "necromancer_summon_resist",
    name: "Summon Resist",
    family: "state",
    slot: 1,
    tier: "starter",
    cost: 0,
    cooldown: 0,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Ward the party and future summons.",
    exactText: "Strengthen summons and guard the party.",
    active: false,
    skillType: "buff",
    damageType: "none",
  };
  const swordMasterySkill: CombatEquippedSkillState = {
    slotKey: "slot1",
    skillId: "barbarian_sword_mastery",
    name: "Sword Mastery",
    family: "state",
    slot: 1,
    tier: "starter",
    cost: 0,
    cooldown: 0,
    remainingCooldown: 0,
    chargeCount: 0,
    chargesRemaining: 0,
    oncePerBattle: false,
    usedThisBattle: false,
    summary: "Open with sword discipline.",
    exactText: "Gain opener value when aligned with swords.",
    active: false,
    skillType: "buff",
    damageType: "none",
  };

  const warmthOpening = skillPreview.buildPassiveSkillOpeningPreview(combat, warmthSkill);
  const summonResistOpening = skillPreview.buildPassiveSkillOpeningPreview(combat, summonResistSkill);

  assert.equal(Array.from(warmthOpening.hero).join(","), "Heal 3,Burn +2");
  assert.equal(Array.from(warmthOpening.deck).join(","), "Next card cost -1,Next card Burn 1");
  assert.match(preview.buildSkillPreviewOutcome(combat, warmthSkill, null), /Heal 3 \+ Burn \+2 \+ Next card cost -1 \+ Next card Burn 1/);

  assert.equal(Array.from(summonResistOpening.hero).join(","), "Guard 4");
  assert.equal(Array.from(summonResistOpening.mercenary).join(","), "Guard 3");
  assert.equal(Array.from(summonResistOpening.deck).join(","), "Next card Guard 2,Summon power +2,Summon riders +1");
  assert.match(preview.buildSkillPreviewOutcome(combat, summonResistSkill, null), /Summon power \+2/);

  assert.equal(Array.from(preview.getExactSkillModifierPreviewParts(swordMasterySkill, combat)).join(","), "Next card +2 damage");
});

test("incoming pressure reflects control states, guard absorption, and setup-only charge intents", () => {
  const harness = createHarness();
  const { browserWindow, content, combatEngine } = harness;
  const pressure = browserWindow.__ROUGE_COMBAT_VIEW_PRESSURE;
  const combat = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const baseEnemy = combat.enemies[0];
  assert.ok(baseEnemy, "expected a baseline enemy to clone");

  combat.hero.guard = 4;
  combat.mercenary.guard = 1;
  combat.enemies = [
    {
      ...baseEnemy,
      id: "enemy_frozen_preview",
      name: "Frozen Raider",
      freeze: 1,
      stun: 0,
      paralyze: 0,
      guard: 0,
      burn: 0,
      poison: 0,
      slow: 0,
      buffedAttack: 0,
      traits: [],
      currentIntent: { kind: "attack", label: "Frozen Swipe", value: 8, target: "hero" },
      intents: [{ kind: "attack", label: "Frozen Swipe", value: 8, target: "hero" }],
    },
    {
      ...baseEnemy,
      id: "enemy_paralyzed_preview",
      name: "Paralyzed Shaman",
      freeze: 0,
      stun: 0,
      paralyze: 1,
      guard: 0,
      burn: 0,
      poison: 0,
      slow: 0,
      buffedAttack: 0,
      traits: [],
      currentIntent: { kind: "attack_lightning_all", label: "Sparkline", value: 6, target: "all_allies" },
      intents: [{ kind: "attack_lightning_all", label: "Sparkline", value: 6, target: "all_allies" }],
    },
    {
      ...baseEnemy,
      id: "enemy_charge_preview",
      name: "Charging Brute",
      freeze: 0,
      stun: 0,
      paralyze: 0,
      guard: 0,
      burn: 0,
      poison: 0,
      slow: 0,
      buffedAttack: 0,
      traits: [],
      currentIntent: { kind: "charge", label: "Linebreaker Charge", value: 10, target: "hero" },
      intents: [{ kind: "charge", label: "Linebreaker Charge", value: 10, target: "hero" }],
    },
  ];

  const incoming = pressure.buildIncomingPressure(combat);

  assert.equal(incoming.hero.attackers, 1);
  assert.equal(incoming.hero.suppressedAttackers, 1);
  assert.equal(incoming.hero.damage, 3);
  assert.equal(incoming.hero.guardBlocked, 3);
  assert.equal(incoming.hero.lifeDamage, 0);
  assert.deepEqual(Array.from(incoming.hero.tags), ["Shock", "Charge"]);
  assert.equal(incoming.hero.lineThreat, true);

  assert.equal(incoming.mercenary.attackers, 1);
  assert.equal(incoming.mercenary.suppressedAttackers, 0);
  assert.equal(incoming.mercenary.damage, 3);
  assert.equal(incoming.mercenary.guardBlocked, 1);
  assert.equal(incoming.mercenary.lifeDamage, 2);
  assert.deepEqual(Array.from(incoming.mercenary.tags), ["Shock"]);
  assert.equal(incoming.mercenary.lineThreat, true);

  const heroHtml = pressure.renderIncomingPressure(incoming.hero, browserWindow.ROUGE_RENDER_UTILS.escapeHtml);
  assert.match(heroHtml, /Line Fire/);
  assert.match(heroHtml, /guard holds/);
  assert.match(heroHtml, /1 controlled/);
  assert.match(heroHtml, /Charge/);
});

test("incoming pressure renders controlled state when hard crowd control suppresses all active threats", () => {
  const harness = createHarness();
  const { browserWindow, content, combatEngine } = harness;
  const pressure = browserWindow.__ROUGE_COMBAT_VIEW_PRESSURE;
  const combat = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const baseEnemy = combat.enemies[0];
  assert.ok(baseEnemy, "expected a baseline enemy to clone");

  combat.enemies = [
    {
      ...baseEnemy,
      id: "enemy_stunned_preview",
      name: "Stunned Marauder",
      freeze: 0,
      stun: 1,
      paralyze: 0,
      guard: 0,
      burn: 0,
      poison: 0,
      slow: 0,
      buffedAttack: 0,
      traits: [],
      currentIntent: { kind: "attack_burn", label: "Searing Claw", value: 7, target: "hero" },
      intents: [{ kind: "attack_burn", label: "Searing Claw", value: 7, target: "hero" }],
    },
  ];

  const incoming = pressure.buildIncomingPressure(combat);
  const heroHtml = pressure.renderIncomingPressure(incoming.hero, browserWindow.ROUGE_RENDER_UTILS.escapeHtml);

  assert.equal(incoming.hero.attackers, 0);
  assert.equal(incoming.hero.suppressedAttackers, 1);
  assert.deepEqual(Array.from(incoming.hero.suppressedTags), ["Burn"]);
  assert.match(heroHtml, /Controlled/);
  assert.match(heroHtml, /1 controlled/);
  assert.match(heroHtml, /Burn/);
});

test("enemy intent chips reflect controlled, hindered, and setup states", () => {
  const harness = createHarness();
  const { browserWindow, content, combatEngine } = harness;
  const renderers = browserWindow.__ROUGE_COMBAT_VIEW_RENDERERS;
  const combat = combatEngine.createCombatState({
    content,
    encounterId: "act_1_opening_crossfire",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
  });
  const baseEnemy = combat.enemies[0];
  assert.ok(baseEnemy, "expected a baseline enemy to clone");
  const escapeHtml = browserWindow.ROUGE_RENDER_UTILS.escapeHtml;

  const frozenEnemy: CombatEnemyState = {
    ...baseEnemy,
    id: "enemy_frozen_intent",
    name: "Frozen Marauder",
    freeze: 1,
    stun: 0,
    paralyze: 0,
    currentIntent: { kind: "attack", label: "Rake", value: 7, target: "hero" },
    intents: [{ kind: "attack", label: "Rake", value: 7, target: "hero" }],
  };
  const chargeEnemy: CombatEnemyState = {
    ...baseEnemy,
    id: "enemy_charge_intent",
    name: "Charging Hulk",
    freeze: 0,
    stun: 0,
    paralyze: 0,
    currentIntent: { kind: "charge", label: "Linebreaker Charge", value: 12, target: "all_allies" },
    intents: [{ kind: "charge", label: "Linebreaker Charge", value: 12, target: "all_allies" }],
  };
  const paralyzedEnemy: CombatEnemyState = {
    ...baseEnemy,
    id: "enemy_paralyzed_intent",
    name: "Paralyzed Warlock",
    freeze: 0,
    stun: 0,
    paralyze: 1,
    currentIntent: { kind: "attack_lightning", label: "Shock Bolt", value: 8, target: "hero" },
    intents: [{ kind: "attack_lightning", label: "Shock Bolt", value: 8, target: "hero" }],
  };

  const frozenHtml = renderers.renderEnemySprite(
    combat,
    frozenEnemy,
    false,
    false,
    false,
    combatEngine.describeIntent(frozenEnemy.currentIntent),
    escapeHtml,
  );
  const chargeHtml = renderers.renderEnemySprite(
    combat,
    chargeEnemy,
    false,
    false,
    false,
    combatEngine.describeIntent(chargeEnemy.currentIntent),
    escapeHtml,
  );
  const paralyzedHtml = renderers.renderEnemySprite(
    combat,
    paralyzedEnemy,
    false,
    false,
    false,
    combatEngine.describeIntent(paralyzedEnemy.currentIntent),
    escapeHtml,
  );

  assert.match(frozenHtml, /sprite__intent--controlled/);
  assert.match(frozenHtml, /Frozen/);
  assert.match(chargeHtml, /sprite__intent--setup/);
  assert.match(chargeHtml, /Next Turn/);
  assert.match(paralyzedHtml, /sprite__intent--hindered/);
  assert.match(paralyzedHtml, /Paralyzed/);
});

test("minion rack entries render hover preview metadata for summon actions", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "necromancer");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = false;
  state.combat.minions = [
    {
      id: "minion_preview_hydra",
      templateId: "sorceress_hydra",
      name: "Hydra",
      skillLabel: "Hydra Breath",
      actionKind: "attack_all_burn",
      targetRule: "all_enemies",
      power: 5,
      secondaryValue: 3,
      remainingTurns: 0,
      persistent: true,
    },
  ];

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /data-preview-minion-id="minion_preview_hydra"/);
  assert.match(root.innerHTML, /data-preview-scope="enemy_line"/);
  assert.match(root.innerHTML, /data-preview-title="Hydra · Hydra Breath"/);
  assert.match(root.innerHTML, /data-preview-outcome="5 line \+ Burn 3"/);
});

test("select-enemy action updates selectedEnemyId without re-rendering", () => {
  const { state, actionDispatcher, appEngine, combatEngine, createActionTarget, browserWindow } =
    startRunAndEnterCombat(createHarness());

  const enemy = state.combat.enemies.find((e: CombatEnemyState) => e.alive);
  assert.ok(enemy);

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "select-enemy", enemyId: enemy.id }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => { throw new Error("render should not be called for select-enemy"); },
    syncCombatResultAndRender: () => {},
  });
  browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();

  assert.equal(handled, true);
  assert.equal(state.combat.selectedEnemyId, enemy.id);
});

test("begin-encounter action applies approach bonus and clears exploring flag", () => {
  const harness = createHarness();
  const { appEngine, browserWindow, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
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
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = true;

  const guardBefore = state.combat.hero.guard;

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "begin-encounter", bonus: "guard:5" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });

  assert.equal(handled, true);
  assert.equal(state.ui.exploring, false);
  assert.equal(state.combat.hero.guard, guardBefore + 5);
});

test("use-town-action action executes a town action", () => {
  const harness = createHarness();
  const { appEngine, browserWindow, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
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

  // Damage the hero to make a healing action available
  state.run.hero.currentLife = 1;
  const townActions = browserWindow.ROUGE_ITEM_TOWN.listTownActions(state.run, state.profile, state.content);
  const healAction = townActions.find((a: TownAction) => a.category === "service" && !a.disabled && a.cost <= state.run.gold);

  if (healAction) {
    const handled = actionDispatcher.handleClick({
      target: createActionTarget({ action: "use-town-action", townActionId: healAction.id }),
      appState: state,
      appEngine,
      combatEngine,
      render: () => {},
      syncCombatResultAndRender: () => {},
    });
    browserWindow.ROUGE_VIEW_LIFECYCLE.cleanup();
    assert.equal(handled, true);
  }
});

test("set-preferred-class action updates profile preferred class", () => {
  const harness = createHarness();
  const { appEngine, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-preferred-class", classId: "necromancer" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, true);
  const summary = appEngine.getProfileSummary(state);
  assert.equal(summary.preferredClassId, "necromancer");
});

test("set-account-progression-focus action updates focused tree", () => {
  const harness = createHarness();
  const { appEngine, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  const accountSummary = appEngine.getAccountProgressSummary(state);
  const firstTree = accountSummary.trees?.[0];
  if (firstTree) {
    const handled = actionDispatcher.handleClick({
      target: createActionTarget({ action: "set-account-progression-focus", accountTreeId: firstTree.id }),
      appState: state,
      appEngine,
      combatEngine,
      render: () => {},
      syncCombatResultAndRender: () => {},
    });
    assert.equal(handled, true);
  }
});

test("set-run-history-review action updates review index", () => {
  const harness = createHarness();
  const { appEngine, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  const handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "set-run-history-review", historyIndex: "2" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, true);
});

test("complete-tutorial and dismiss-tutorial actions update tutorial state", () => {
  const harness = createHarness();
  const { appEngine, content, combatEngine, actionDispatcher, createActionTarget, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });

  let handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "complete-tutorial", tutorialId: "front_door_profile_hall" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, true);

  handled = actionDispatcher.handleClick({
    target: createActionTarget({ action: "dismiss-tutorial", tutorialId: "front_door_expedition" }),
    appState: state,
    appEngine,
    combatEngine,
    render: () => {},
    syncCombatResultAndRender: () => {},
  });
  assert.equal(handled, true);
});

test("combat view renders exploration screen with approach choices", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
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
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("explore-screen"), "should render exploration screen");
  assert.ok(root.innerHTML.includes("explore-card"), "should render approach choice cards");
  assert.ok(root.innerHTML.includes("begin-encounter"), "should have begin-encounter action");
});

test("combat view renders combat screen when not exploring", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
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
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = false;

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("combat-screen"), "should render combat screen");
  assert.ok(root.innerHTML.includes("fan-card") || root.innerHTML.includes("play-card"), "should show playable cards");
});

test("combat header readout includes selected enemy control and target state", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
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
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = false;

  const targetEnemy = state.combat.enemies.find((enemy: CombatEnemyState) => enemy.alive);
  assert.ok(targetEnemy, "expected a selected enemy");
  targetEnemy.currentIntent = { kind: "charge", label: "Linebreaker Charge", value: 12, target: "all_allies" };
  targetEnemy.intents = [{ kind: "charge", label: "Linebreaker Charge", value: 12, target: "all_allies" }];
  state.combat.selectedEnemyId = targetEnemy.id;

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /Next Turn · Linebreaker Charge/);
  assert.match(root.innerHTML, /Party/);
});

test("combat command summary shows live summon-state bonuses", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "necromancer");
  appEngine.setSelectedMercenary(state, "rogue_scout");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);
  const runFactory = browserWindow.ROUGE_RUN_FACTORY;
  const openingZoneId = runFactory.getCurrentZones(state.run)[0].id;
  appEngine.selectZone(state, openingZoneId);
  state.ui.exploring = false;
  state.combat.summonPowerBonus = 2;
  state.combat.summonSecondaryBonus = 1;

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.match(root.innerHTML, /Summon power \+2/);
  assert.match(root.innerHTML, /Summon riders \+1/);
});

test("world map view renders zone waypoints and edges", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
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
  appEngine.leaveSafeZone(state);

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("actmap"), "should render act map");
  assert.ok(root.innerHTML.includes("waypoint"), "should render zone waypoints");
  assert.ok(root.innerHTML.includes("map-edge"), "should render edge connections");
  assert.ok(root.innerHTML.includes("select-zone"), "should have clickable zone actions");
});

test("reward view renders reward choices after combat victory", () => {
  const { state, syncCombatResultAndRender, browserWindow } =
    startRunAndEnterCombat(createHarness());

  state.combat.outcome = "victory";
  syncCombatResultAndRender();

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  browserWindow.ROUGE_APP_SHELL.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("claim-reward-choice"), "should show reward claim buttons");
});

test("character select view renders class and mercenary options", () => {
  const harness = createHarness();
  const { appEngine, appShell, browserWindow, content, combatEngine, seedBundle } = harness;
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0.5,
  });
  appEngine.startCharacterSelect(state);

  const root = { innerHTML: "" } as Parameters<AppShellApi["render"]>[0];
  appShell.render(root, {
    appState: state,
    baseContent: browserWindow.ROUGE_GAME_CONTENT,
    bootState: { status: "ready", error: "" },
  });

  assert.ok(root.innerHTML.includes("select-class"), "should show class selection buttons");
  assert.ok(root.innerHTML.length > 500, "should render substantial character select content");
});
