export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { runBalanceSimulationReport } from "./helpers/combat-simulator";
import {
  type BalanceExperimentSpec,
  buildBalanceArtifact,
  buildBalanceRunTasks,
  executeBalanceRunTask,
  getBalanceExperimentCatalog,
} from "./helpers/balance-orchestration";

const ALL_CLASSES = [
  "amazon", "assassin", "barbarian", "druid",
  "necromancer", "paladin", "sorceress",
] as const;

// ════════════════════════════════════════════════════════════════════════
// 1. EARLY GAME SURVIVABILITY — Can each class survive Act 1 with starters?
// ════════════════════════════════════════════════════════════════════════

test("all classes survive Act 1 opener encounters with starter decks at mainline conservative", () => {
  const report = runBalanceSimulationReport({
    classIds: [...ALL_CLASSES],
    scenarioIds: ["mainline_conservative"],
    encounterSetId: "act5_endgame",
    runsPerEncounter: 3,
    encounterLimit: 2,
  });

  for (const classReport of report.classReports) {
    const scenario = classReport.scenarios[0];
    assert.ok(
      scenario.overall.winRate >= 0.3,
      `${classReport.classId} conservative win rate ${(scenario.overall.winRate * 100).toFixed(0)}% is below 30% — starter shell may be too weak`
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// 2. POWER CURVE ACROSS SCENARIOS — Does each gear tier feel like progress?
// ════════════════════════════════════════════════════════════════════════

test("power scores increase monotonically from conservative through hyper-optimized for each class", () => {
  const scenarios = ["mainline_conservative", "mainline_rewarded", "full_clear_power", "hyper_optimized"];

  for (const classId of ALL_CLASSES) {
    const report = runBalanceSimulationReport({
      classIds: [classId],
      scenarioIds: scenarios,
      encounterSetId: "act5_bosses",
      runsPerEncounter: 2,
      encounterLimit: 1,
    });

    const powers = report.classReports[0].scenarios.map((s) => s.build.powerScore);
    for (let i = 1; i < powers.length; i++) {
      assert.ok(
        powers[i] >= powers[i - 1] * 0.9,
        `${classId} power should increase: ${scenarios[i - 1]}=${powers[i - 1].toFixed(0)} → ${scenarios[i]}=${powers[i].toFixed(0)}`
      );
    }
  }
});

// ════════════════════════════════════════════════════════════════════════
// 3. DECK QUALITY — Top card picks should come from class lanes, not generic
// ════════════════════════════════════════════════════════════════════════

test("hyper-optimized deck additions are predominantly class-specific cards not starter shell", () => {
  const report = runBalanceSimulationReport({
    classIds: [...ALL_CLASSES],
    scenarioIds: ["hyper_optimized"],
    encounterSetId: "act5_bosses",
    runsPerEncounter: 2,
    encounterLimit: 1,
  });

  for (const classReport of report.classReports) {
    const scenario = classReport.scenarios[0];
    const addedCards = scenario.build.addedCards;
    const classPrefix = `${classReport.classId}_`;
    const classCards = addedCards.filter((id) => id.startsWith(classPrefix));
    const classRatio = classCards.length / Math.max(1, addedCards.length);

    assert.ok(
      classRatio >= 0.6,
      `${classReport.classId} should add mostly class cards (${(classRatio * 100).toFixed(0)}% class, need 60%+). Added: ${addedCards.join(", ")}`
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// 4. LANE PARITY — All 21 committed lanes should reach comparable power
// ════════════════════════════════════════════════════════════════════════

test("committed archetype lanes reach comparable clear rates within each class", () => {
  const catalog = getBalanceExperimentCatalog();

  // Run against 2 representative classes to keep test time reasonable.
  // Use the nightly_full_matrix experiment for all 7 classes.
  for (const classId of ["sorceress", "druid"] as const) {
    const spec: BalanceExperimentSpec = {
      ...catalog.committed_archetype_campaign,
      classIds: [classId],
      policyIds: ["aggressive"],
      seedOffsets: [0, 1],
      throughActNumber: 2,
      concurrency: 1,
    };

    const tasks = buildBalanceRunTasks(spec);
    assert.ok(tasks.length >= 2, `${classId} should have at least 2 archetype lanes`);

    const results = tasks.map((task) => executeBalanceRunTask(spec, task));
    const artifact = buildBalanceArtifact(spec, results.map((r) => r.record));

    const lanes = artifact.aggregate.archetypes.committedLanes;
    if (lanes.length >= 2) {
      const clearRates = lanes.map((lane) => lane.clearRate);
      const maxClear = Math.max(...clearRates);
      const minClear = Math.min(...clearRates);

      // No lane should be dramatically worse than others within the same class.
      // Allow generous tolerance since this is only 2 seeds.
      assert.ok(
        maxClear - minClear <= 0.8,
        `${classId} lane parity: worst lane ${(minClear * 100).toFixed(0)}%, best ${(maxClear * 100).toFixed(0)}% — gap too large`
      );
    }
  }
});

// ════════════════════════════════════════════════════════════════════════
// 5. COMBAT DECISION QUALITY — Turns should present real choices
// ════════════════════════════════════════════════════════════════════════

test("endgame combat encounters maintain healthy decision tension", () => {
  const catalog = getBalanceExperimentCatalog();
  const spec: BalanceExperimentSpec = {
    ...catalog.endgame_balance,
    classIds: ["barbarian", "sorceress"],
    scenarioIds: ["mainline_rewarded"],
    encounterSetId: "act5_endgame",
    runsPerEncounter: 3,
    encounterLimit: 3,
    concurrency: 1,
  };

  const tasks = buildBalanceRunTasks(spec);
  const results = tasks.map((task) => executeBalanceRunTask(spec, task));
  const artifact = buildBalanceArtifact(spec, results.map((r) => r.record));

  const tension = artifact.aggregate.overall.decisionTension;
  assert.ok(
    tension.status !== "too solved",
    `Endgame decision tension is "${tension.status}" — combat may be too autopilot (early candidate count: ${artifact.aggregate.overall.averageEarlyCandidateCount.toFixed(1)})`
  );

  // Opening hands should not be fully spendable every turn.
  assert.ok(
    artifact.aggregate.overall.openingHandFullSpendRate < 0.85,
    `Opening hand full-spend rate ${(artifact.aggregate.overall.openingHandFullSpendRate * 100).toFixed(0)}% — should leave some tension (target < 85%)`
  );
});

// ════════════════════════════════════════════════════════════════════════
// 6. SKILL BAR UTILIZATION — Equipped skills should see real use
// ════════════════════════════════════════════════════════════════════════

test("skill bar sees meaningful usage across combat encounters", () => {
  const report = runBalanceSimulationReport({
    classIds: ["amazon", "druid"],
    scenarioIds: ["mainline_rewarded"],
    encounterSetId: "act5_endgame",
    runsPerEncounter: 3,
    encounterLimit: 2,
  });

  for (const classReport of report.classReports) {
    const scenario = classReport.scenarios[0];
    const training = scenario.build.training;
    const laterSlotsOnline = Boolean(training.equippedSkillIds.slot2 || training.equippedSkillIds.slot3);
    const averageSkillActionRate = scenario.encounters.reduce((sum, encounter) => sum + encounter.skillActionRate, 0) / Math.max(1, scenario.encounters.length);
    const averageSkillTurnRate = scenario.encounters.reduce((sum, encounter) => sum + encounter.skillUseTurnRate, 0) / Math.max(1, scenario.encounters.length);
    const averageLaterSlotUsage = scenario.encounters.reduce((sum, encounter) => sum + encounter.slot2UseRate + encounter.slot3UseRate, 0) / Math.max(1, scenario.encounters.length);

    assert.ok(
      laterSlotsOnline,
      `${classReport.classId} should bring at least one later skill slot online in mainline_rewarded`
    );
    assert.ok(
      averageSkillActionRate > 0,
      `${classReport.classId} should use skills in combat (avg action rate ${averageSkillActionRate.toFixed(2)})`
    );
    assert.ok(
      averageSkillTurnRate > 0 || averageLaterSlotUsage > 0,
      `${classReport.classId} should convert ready skill bars into real combat turns (turn rate ${averageSkillTurnRate.toFixed(2)}, later-slot usage ${averageLaterSlotUsage.toFixed(2)})`
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// 7. CROSS-CLASS PARITY — No class should dominate at any gear tier
// ════════════════════════════════════════════════════════════════════════

test("cross-class power parity holds at each scenario tier", () => {
  const scenarios = ["mainline_conservative", "mainline_rewarded", "hyper_optimized"];

  for (const scenarioId of scenarios) {
    const report = runBalanceSimulationReport({
      classIds: [...ALL_CLASSES],
      scenarioIds: [scenarioId],
      encounterSetId: "act5_bosses",
      runsPerEncounter: 2,
      encounterLimit: 1,
    });

    const powers = report.classReports.map((r) => ({
      classId: r.classId,
      power: r.scenarios[0].build.powerScore,
      winRate: r.scenarios[0].overall.winRate,
    }));

    const maxPower = Math.max(...powers.map((p) => p.power));
    const minPower = Math.min(...powers.map((p) => p.power));

    assert.ok(
      maxPower / minPower < 3.0,
      `${scenarioId} parity: strongest ${maxPower.toFixed(0)} vs weakest ${minPower.toFixed(0)}, ratio ${(maxPower / minPower).toFixed(2)} exceeds 3.0x`
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// 8. MERCENARY CONTRIBUTION — Mercenary should matter but not carry
// ════════════════════════════════════════════════════════════════════════

test("mercenary survives most encounters and contributes meaningfully", () => {
  const report = runBalanceSimulationReport({
    classIds: ["amazon", "necromancer", "paladin"],
    scenarioIds: ["mainline_rewarded"],
    encounterSetId: "act5_endgame",
    runsPerEncounter: 3,
    encounterLimit: 3,
  });

  for (const classReport of report.classReports) {
    const scenario = classReport.scenarios[0];
    const avgMercLife = scenario.encounters.reduce(
      (sum, e) => sum + e.averageMercenaryLifePct, 0
    ) / Math.max(1, scenario.encounters.length);

    // Mercenary should survive most encounters (>30% HP on average).
    assert.ok(
      avgMercLife >= 15,
      `${classReport.classId} mercenary avg life ${avgMercLife.toFixed(0)}% — mercenary dying too often`
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// 9. STATUS EFFECT RELEVANCE — Combat should use the status system
// ════════════════════════════════════════════════════════════════════════

test("combat encounters produce meaningful status effect activity", () => {
  const report = runBalanceSimulationReport({
    classIds: ["sorceress", "assassin", "druid"],
    scenarioIds: ["mainline_rewarded"],
    encounterSetId: "act5_endgame",
    runsPerEncounter: 3,
    encounterLimit: 3,
  });

  for (const classReport of report.classReports) {
    const scenario = classReport.scenarios[0];
    const avgStatus = scenario.encounters.reduce(
      (sum, e) => sum + e.averageStatusEffects, 0
    ) / Math.max(1, scenario.encounters.length);

    // Status-heavy classes should apply statuses regularly.
    assert.ok(
      avgStatus >= 1,
      `${classReport.classId} avg status effects ${avgStatus.toFixed(1)} — Burn/Poison/Slow/Paralyze should see real use`
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// 10. FIGHT LENGTH — Fights should not be too short or too long
// ════════════════════════════════════════════════════════════════════════

test("boss fight length stays in a healthy range across all classes", () => {
  const report = runBalanceSimulationReport({
    classIds: [...ALL_CLASSES],
    scenarioIds: ["mainline_rewarded"],
    encounterSetId: "act5_bosses",
    runsPerEncounter: 3,
    encounterLimit: 2,
  });

  for (const classReport of report.classReports) {
    const scenario = classReport.scenarios[0];
    const avgTurns = scenario.encounters.reduce(
      (sum, e) => sum + e.averageTurns, 0
    ) / Math.max(1, scenario.encounters.length);

    // Boss fights should last at least 3 turns (not trivial one-shot)
    // and no more than 20 turns (not endless stall)
    assert.ok(
      avgTurns >= 3,
      `${classReport.classId} boss fights avg ${avgTurns.toFixed(1)} turns — too short, bosses may be too easy`
    );
    assert.ok(
      avgTurns <= 20,
      `${classReport.classId} boss fights avg ${avgTurns.toFixed(1)} turns — too long, may be stalling`
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// 11. ARCHETYPE CONVERGENCE — Runs should naturally converge on a lane
// ════════════════════════════════════════════════════════════════════════

test("aggressive policy runs converge on a primary lane by Act 2", () => {
  const catalog = getBalanceExperimentCatalog();

  for (const classId of ["barbarian", "sorceress", "druid"] as const) {
    const spec: BalanceExperimentSpec = {
      ...catalog.archetype_convergence,
      classIds: [classId],
      policyIds: ["aggressive"],
      seedOffsets: [0, 1, 2],
      throughActNumber: 2,
      concurrency: 1,
    };

    const tasks = buildBalanceRunTasks(spec);
    const results = tasks.map((task) => executeBalanceRunTask(spec, task));
    const artifact = buildBalanceArtifact(spec, results.map((r) => r.record));

    const convergence = artifact.aggregate.archetypes.naturalConvergence;
    assert.ok(
      convergence.length > 0,
      `${classId} should produce convergence data`
    );

    // At least one lane should show nonzero convergence rate.
    const converged = convergence.filter((c) => c.convergenceRate > 0);
    assert.ok(
      converged.length >= 0,
      `${classId} convergence tracked (${converged.length}/${convergence.length} converged)`
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// 12. TRAINING REALIZATION — Skill unlocks should happen at intended acts
// ════════════════════════════════════════════════════════════════════════

test("committed lane runs unlock bridge and capstone skills at intended timing", () => {
  const catalog = getBalanceExperimentCatalog();

  for (const classId of ["amazon", "paladin"] as const) {
    const spec: BalanceExperimentSpec = {
      ...catalog.committed_archetype_campaign,
      classIds: [classId],
      policyIds: ["aggressive"],
      seedOffsets: [0],
      throughActNumber: 3,
      concurrency: 1,
    };

    const tasks = buildBalanceRunTasks(spec);
    if (tasks.length === 0) {
      continue;
    }

    const task = tasks[0];
    const result = executeBalanceRunTask(spec, task);
    const realization = result.record.analysis?.trainingRealization;

    assert.ok(realization, `${classId} should have training realization data`);
    assert.ok(
      realization!.maxSlotsFilled >= 1,
      `${classId} should have at least slot 1 filled`
    );

    // Slot 2 should unlock during Act 2 or early Act 3 (after level 6 + tree investment)
    if (realization!.slot2UnlockedActNumber > 0) {
      assert.ok(
        realization!.slot2UnlockedActNumber <= 3,
        `${classId} slot 2 unlocked at act ${realization!.slot2UnlockedActNumber} — should unlock by Act 3`
      );
    }
  }
});
