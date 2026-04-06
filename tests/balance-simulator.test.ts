export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { runBalanceSimulationReport, runCraftedCombatSimulationReport } from "./helpers/combat-simulator";

test("balance simulator produces an Act V endgame report", () => {
  const report = runBalanceSimulationReport({
    classIds: ["barbarian"],
    scenarioIds: ["mainline_conservative"],
    encounterSetId: "act5_endgame",
    runsPerEncounter: 2,
    encounterLimit: 2,
  });

  assert.equal(report.classReports.length, 1);
  assert.equal(report.classReports[0].classId, "barbarian");
  assert.equal(report.classReports[0].scenarios.length, 1);

  const scenario = report.classReports[0].scenarios[0];
  assert.ok(scenario.build.deckSize >= 10);
  assert.ok(scenario.build.powerScore > 0);
  assert.ok(scenario.build.powerBreakdown.deck > 0);
  assert.ok(scenario.encounters.length > 0);
  assert.ok(scenario.encounters[0].enemyPowerScore > 0);
  assert.ok(scenario.encounters[0].powerRatio > 0);
  assert.ok(scenario.overall.winRate >= 0 && scenario.overall.winRate <= 1);
});

test("crafted combat simulator runs a hand-built seed against a direct encounter", () => {
  const report = runCraftedCombatSimulationReport({
    label: "Sorceress Fire Crafted Seed",
    classId: "sorceress",
    actNumber: 4,
    targetLevel: 24,
    seed: 17,
    encounterId: "act_4_boss",
    runsPerEncounter: 1,
    addCardIds: ["sorceress_fireball", "sorceress_meteor", "sorceress_hydra"],
    treeRanks: {
      sorceress_fire: 6,
      sorceress_cold: 1,
    },
    favoredTreeId: "sorceress_fire",
    equippedSkillIds: {
      slot1: "sorceress_core_fire_bolt",
      slot2: "sorceress_fireball",
      slot3: "sorceress_hydra",
    },
    loadout: {
      weapon: "item_crystal_sword",
    },
    potionCount: 3,
    bypassTrainingGates: true,
  });

  assert.equal(report.requested.classId, "sorceress");
  assert.equal(report.seed, 17);
  assert.equal(report.build.training.favoredTreeId, "sorceress_fire");
  assert.equal(report.build.training.equippedSkillIds.slot2, "sorceress_fireball");
  assert.equal(report.build.training.equippedSkillIds.slot3, "sorceress_hydra");
  assert.equal(report.build.weapon?.itemId, "item_crystal_sword");
  assert.ok(report.build.addedCards.includes("sorceress_meteor"));
  assert.equal(report.encounters.length, 1);
  assert.equal(report.encounters[0].encounterId, "act_4_boss");
  assert.ok(report.encounters[0].powerRatio > 0);
});
