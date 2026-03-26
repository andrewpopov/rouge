export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { runBalanceSimulationReport } from "./helpers/combat-simulator";

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
