export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
import { getPolicyDefinitions } from "./helpers/run-progression-simulator-core";
import {
  buildCombatStateForEncounter,
  getThreatShortfall,
  playStateCombat,
  simulateEncounterWithRun,
  traceCombatStateWithPolicy,
} from "./helpers/run-progression-simulator-combat";

test("bypass-guard death bursts are evaluated against life, not guard", () => {
  const state = {
    hero: { life: 100, guard: 200 },
    enemies: [
      {
        alive: true,
        currentIntent: { kind: "attack", value: 0, target: "hero" },
        burn: 100,
        poison: 0,
        life: 100,
        maxLife: 400,
        traits: ["fire_enchanted"],
      },
    ],
  } as unknown as Parameters<typeof getThreatShortfall>[0];

  assert.equal(getThreatShortfall(state), 1);
});

test("guard still absorbs non-bypass threat after projected death bursts", () => {
  const state = {
    hero: { life: 100, guard: 40 },
    enemies: [
      {
        alive: true,
        currentIntent: { kind: "attack", value: 100, target: "hero" },
        burn: 100,
        poison: 0,
        life: 100,
        maxLife: 200,
        traits: ["fire_enchanted"],
      },
    ],
  } as unknown as Parameters<typeof getThreatShortfall>[0];

  assert.equal(getThreatShortfall(state), 10);
});

test("campaign combat states inherit the equipped training skill bar", () => {
  const { content, combatEngine, appEngine, seedBundle, ...harness } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "amazon");
  appEngine.startRun(state);

  state.run.progression.classProgression.equippedSkillBar.slot2SkillId = "amazon_magic_arrow";
  state.run.progression.classProgression.equippedSkillBar.slot3SkillId = "amazon_immolation_arrow";

  const combatState = buildCombatStateForEncounter(
    { content, combatEngine, appEngine, seedBundle, ...harness },
    state.run,
    state.profile,
    "act_1_boss",
    1,
    () => 0
  );

  assert.deepEqual(
    combatState.equippedSkills.map((skill) => `${skill.slotKey}:${skill.skillId}`),
    [
      "slot1:amazon_call_the_shot",
      "slot2:amazon_magic_arrow",
      "slot3:amazon_immolation_arrow",
    ]
  );
});

test("combat trace can choose an active skill when it is the best available action", () => {
  const harness = createHarness();
  const combatState = harness.combatEngine.createCombatState({
    content: harness.content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: [],
    initialPotions: 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "paladin_meditation",
          name: "Meditation",
          requiredLevel: 1,
          family: "recovery",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Recover and set up the next card.",
          exactText: "Heal the party, draw, and prep the next card.",
          active: true,
          skillType: "spell",
          damageType: "magic",
        },
      },
    ],
  });

  combatState.hand = [];
  combatState.hero.energy = 1;
  combatState.potions = 0;
  combatState.meleeUsed = true;
  combatState.hero.life = Math.max(1, combatState.hero.life - 8);

  const trace = traceCombatStateWithPolicy(harness, combatState, "balanced", 2);
  const firstTurn = trace.turns[0] as { actions?: string[] } | undefined;
  const firstAction = firstTurn?.actions?.[0] || "";

  assert.match(firstAction, /^Skill: Meditation/);
});

test("combat result reports skill usage telemetry when a skill is used", () => {
  const harness = createHarness();
  const combatState = harness.combatEngine.createCombatState({
    content: harness.content,
    encounterId: "act_1_boss",
    mercenaryId: "rogue_scout",
    randomFn: () => 0,
    starterDeck: [],
    initialPotions: 0,
    equippedSkills: [
      {
        slotKey: "slot2",
        skill: {
          id: "paladin_meditation",
          name: "Meditation",
          requiredLevel: 1,
          family: "recovery",
          slot: 2,
          tier: "bridge",
          cost: 1,
          cooldown: 2,
          summary: "Recover and set up the next card.",
          exactText: "Heal the party, draw, and prep the next card.",
          active: true,
          skillType: "spell",
          damageType: "magic",
        },
      },
    ],
  });

  combatState.hand = [];
  combatState.hero.energy = 1;
  combatState.potions = 0;
  combatState.meleeUsed = true;
  combatState.hero.life = Math.max(1, combatState.hero.life - 8);

  const result = playStateCombat(
    harness,
    { combat: combatState } as Parameters<typeof playStateCombat>[1],
    getPolicyDefinitions(["balanced"])[0],
    2
  );

  assert.ok(result);
  assert.ok(result!.skillActionRate > 0);
  assert.ok(result!.skillUseTurnRate > 0);
  assert.ok(result!.slot2UseRate > 0);
  assert.ok(result!.readySkillUnusedTurnRate >= 0);
});

test("boss encounters report beam search telemetry", () => {
  const { content, combatEngine, appEngine, seedBundle, ...harness } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "barbarian");
  appEngine.startRun(state);

  const result = simulateEncounterWithRun(
    { content, combatEngine, appEngine, seedBundle, ...harness },
    state.run,
    state.profile,
    "act_1_boss",
    getPolicyDefinitions(["balanced"])[0],
    24,
    1
  );

  assert.ok(result.beamDecisionRate > 0);
  assert.ok(result.averageBeamDepth > 0);
  assert.ok(result.beamOverrideRate >= 0);
});
