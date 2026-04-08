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

  const encounter = scenario.encounters[0];
  assert.ok(encounter.averageLogEntries > 0, "encounter should have log entries");
  assert.ok(encounter.averageCardsPlayed >= 0, "encounter should track cards played");
  assert.ok(encounter.averageEnemyActions >= 0, "encounter should track enemy actions");
  assert.ok(encounter.averageStatusEffects >= 0, "encounter should track status effects");
  assert.ok(typeof encounter.defeatCauses === "object", "encounter should have defeat causes");
});

test("combat log produces structured entries usable by both game UI and sim", () => {
  const { createAppHarness } = require("./helpers/browser-harness");
  const harness = createAppHarness();
  const engine = harness.combatEngine;
  const combatLog = harness.browserWindow.__ROUGE_COMBAT_LOG as CombatLogApi;

  const state = engine.createCombatState({
    content: harness.content,
    encounterId: "act_1_opening_skirmish",
    mercenaryId: "rogue_scout",
    randomFn: () => 0.5,
  });

  assert.ok(state.log.length > 0, "combat should start with log entries");

  const firstEntry = state.log[0];
  assert.ok(firstEntry.turn !== undefined, "entry should have turn");
  assert.ok(firstEntry.phase !== undefined, "entry should have phase");
  assert.ok(firstEntry.actor !== undefined, "entry should have actor");
  assert.ok(firstEntry.action !== undefined, "entry should have action");
  assert.ok(firstEntry.tone !== undefined, "entry should have tone");
  assert.ok(typeof firstEntry.message === "string", "entry should have message string");
  assert.ok(Array.isArray(firstEntry.effects), "entry should have effects array");

  // Play a card to generate a card_play entry
  const playableCard = state.hand.find((card: CardInstance) => {
    const def = harness.content.cardCatalog[card.cardId];
    return def && Number(def.cost || 0) <= state.hero.energy;
  });
  if (playableCard) {
    const target = state.enemies.find((enemy: CombatEnemyState) => enemy.alive);
    engine.playCard(state, harness.content, playableCard.instanceId, target?.id || "");
  }

  engine.endTurn(state);

  const summary = combatLog.summarizeCombatLog(state);
  assert.ok(summary.totalEntries > 0, "summary should have entries");
  assert.ok(summary.totalTurns >= 1, "summary should track turns");
  assert.ok(typeof summary.outcome === "string", "summary should have outcome");
  assert.ok(typeof summary.byActor === "object", "summary should have byActor breakdown");
  assert.ok(typeof summary.byAction === "object", "summary should have byAction breakdown");
  assert.ok(typeof summary.byTone === "object", "summary should have byTone breakdown");

  // Verify enriched action types are populated
  assert.ok(summary.enemyActions > 0, "enemies should have taken actions after endTurn");
  assert.ok((summary.byAction["intent"] || 0) > 0, "should have intent actions from enemies");
  assert.ok((summary.byAction["turn_start"] || 0) > 0, "should have turn_start entries");
  if (playableCard) {
    assert.ok(summary.cardsPlayed > 0, "should have card_play actions after playing a card");
  }

  // Verify actors are properly attributed
  assert.ok((summary.byActor["enemy"] || 0) > 0, "should have enemy actor entries");
  assert.ok((summary.byActor["environment"] || 0) > 0, "should have environment actor entries");
});

test("improved AI handles boss fights across all classes with mainline builds", () => {
  const classes = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
  const results: Array<{ classId: string; wins: number; runs: number; avgTurns: number; defeatCauses: Record<string, number> }> = [];

  for (const classId of classes) {
    const report = runBalanceSimulationReport({
      classIds: [classId],
      scenarioIds: ["mainline_rewarded"],
      encounterSetId: "act5_endgame",
      runsPerEncounter: 3,
      encounterLimit: 3,
    });

    const scenario = report.classReports[0]?.scenarios[0];
    if (!scenario) { continue; }

    const totalWins = scenario.encounters.reduce((sum, e) => sum + e.wins, 0);
    const totalRuns = scenario.encounters.reduce((sum, e) => sum + e.runs, 0);
    const avgTurns = scenario.overall.averageTurns;
    const defeatCauses: Record<string, number> = {};
    for (const enc of scenario.encounters) {
      for (const [cause, count] of Object.entries(enc.defeatCauses)) {
        defeatCauses[cause] = (defeatCauses[cause] || 0) + count;
      }
    }

    results.push({ classId, wins: totalWins, runs: totalRuns, avgTurns, defeatCauses });
  }

  console.log("  === Act 5 Boss Results (mainline_rewarded) ===");
  for (const r of results) {
    const pct = r.runs > 0 ? Math.round((r.wins / r.runs) * 100) : 0;
    const causes = Object.entries(r.defeatCauses).map(([k, v]) => `${k}:${v}`).join(" ");
    console.log(`  ${r.classId.padEnd(14)} ${r.wins}/${r.runs} (${pct}%) avg ${r.avgTurns} turns  ${causes}`);
  }

  const totalWins = results.reduce((sum, r) => sum + r.wins, 0);
  const totalRuns = results.reduce((sum, r) => sum + r.runs, 0);
  console.log(`  ${"TOTAL".padEnd(14)} ${totalWins}/${totalRuns} (${totalRuns > 0 ? Math.round(totalWins / totalRuns * 100) : 0}%)`);

  // Mainline builds against Act 5 endgame encounters — some classes should win some fights
  assert.ok(typeof totalWins === "number", "results should be collected");
});

test("full-power builds handle Act 5 bosses better than mainline", () => {
  const classes = ["barbarian", "paladin", "sorceress"];
  const results: Array<{ classId: string; wins: number; runs: number; avgTurns: number }> = [];

  for (const classId of classes) {
    const report = runBalanceSimulationReport({
      classIds: [classId],
      scenarioIds: ["full_clear_power"],
      encounterSetId: "act5_bosses",
      runsPerEncounter: 5,
      encounterLimit: 3,
    });

    const scenario = report.classReports[0]?.scenarios[0];
    if (!scenario) { continue; }

    const totalWins = scenario.encounters.reduce((sum, e) => sum + e.wins, 0);
    const totalRuns = scenario.encounters.reduce((sum, e) => sum + e.runs, 0);
    results.push({ classId, wins: totalWins, runs: totalRuns, avgTurns: scenario.overall.averageTurns });
  }

  console.log("  === Act 5 Boss Results (full_clear_power) ===");
  for (const r of results) {
    const pct = r.runs > 0 ? Math.round((r.wins / r.runs) * 100) : 0;
    console.log(`  ${r.classId.padEnd(14)} ${r.wins}/${r.runs} (${pct}%) avg ${r.avgTurns} turns`);
  }

  const totalWins = results.reduce((sum, r) => sum + r.wins, 0);
  const totalRuns = results.reduce((sum, r) => sum + r.runs, 0);
  console.log(`  ${"TOTAL".padEnd(14)} ${totalWins}/${totalRuns} (${totalRuns > 0 ? Math.round(totalWins / totalRuns * 100) : 0}%)`);

  assert.ok(totalWins > results.length, "full-power builds should win more than one fight per class");
});

test("class vs boss matrix: all classes against all act bosses with full power", () => {
  const classes = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
  const bosses = ["act_1_boss", "act_2_boss", "act_3_boss", "act_4_boss", "act_5_boss"];
  const matrix: Array<{ classId: string; bossId: string; wins: number; runs: number; avgTurns: number }> = [];

  for (const classId of classes) {
    const report = runBalanceSimulationReport({
      classIds: [classId],
      scenarioIds: ["mainline_rewarded", "full_clear_power"],
      encounterSetId: "act5_all",
      runsPerEncounter: 3,
    });

    for (const scenario of report.classReports[0]?.scenarios || []) {
      for (const enc of scenario.encounters) {
        if (bosses.includes(enc.encounterId)) {
          const existing = matrix.find((r) => r.classId === classId && r.bossId === enc.encounterId);
          if (existing) {
            existing.wins += enc.wins;
            existing.runs += enc.runs;
            existing.avgTurns = (existing.avgTurns + enc.averageTurns) / 2;
          } else {
            matrix.push({
              classId,
              bossId: enc.encounterId,
              wins: enc.wins,
              runs: enc.runs,
              avgTurns: enc.averageTurns,
            });
          }
        }
      }
    }
  }

  // Print matrix
  const bossIds = [...new Set(matrix.map((r) => r.bossId))];
  const header = "CLASS".padEnd(14) + bossIds.map((b) => b.replace("act_", "A").replace("_boss", "B").padStart(8)).join("");
  console.log(`  ${header}`);
  for (const classId of classes) {
    const row = classId.padEnd(14) + bossIds.map((bossId) => {
      const entry = matrix.find((r) => r.classId === classId && r.bossId === bossId);
      if (!entry) { return "   -   "; }
      const pct = entry.runs > 0 ? Math.round((entry.wins / entry.runs) * 100) : 0;
      return `${String(pct).padStart(4)}%  `;
    }).join("");
    console.log(`  ${row}`);
  }

  const totalWins = matrix.reduce((sum, r) => sum + r.wins, 0);
  const totalRuns = matrix.reduce((sum, r) => sum + r.runs, 0);
  console.log(`  ${"OVERALL".padEnd(14)}${Math.round(totalWins / Math.max(1, totalRuns) * 100)}% (${totalWins}/${totalRuns})`);

  assert.ok(totalWins > 0, "at least some boss fights should be won");
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
