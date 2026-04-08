export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { runCampaignSim, runRewardDistributionSim } from "./helpers/piecemeal-sim";

test("campaign sim runs a single class through Act 5 and reports build", () => {
  const result = runCampaignSim({ classId: "paladin", seedOffset: 0 });

  console.log(`  ${result.classId} seed:${result.seed} → ${result.outcome} act:${result.finalActNumber} lv:${result.finalLevel}`);
  console.log(`  power:${result.finalPowerScore} deck:${result.finalDeckSize} encounters:${result.encounterCount} bosses:${result.bossesDefeated}`);
  if (result.outcome === "run_failed") {
    console.log(`  failed at: ${result.failureZone} / ${result.failureEncounter}`);
  }
  console.log(`  power curve: ${result.powerCurve.map((s) => `act${s.actNumber}=${s.powerScore}`).join(" → ")}`);
  console.log(`  duration: ${result.durationMs}ms`);

  assert.ok(result.finalActNumber >= 1, "should reach at least Act 1");
  assert.ok(result.powerCurve.length >= 1, "should have at least one power snapshot");
  assert.ok(result.encounterCount >= 1, "should fight at least one encounter");
});

test("reward distribution sim shows power variance across seeds", () => {
  const dist = runRewardDistributionSim("sorceress", 3, "aggressive");

  console.log(`  === Sorceress Reward Distribution (${dist.runs} seeds) ===`);
  console.log(`  clear rate: ${Math.round(dist.clearRate * 100)}%`);
  console.log(`  final power: avg ${dist.avgFinalPower}, min ${dist.minFinalPower}, max ${dist.maxFinalPower}`);
  console.log(`  avg deck: ${dist.avgDeckSize}, avg level: ${dist.avgLevel}`);
  for (const [act, data] of Object.entries(dist.powerByAct).sort(([a], [b]) => Number(a) - Number(b))) {
    console.log(`  act ${act}: power avg ${data.avg}, min ${data.min}, max ${data.max} (${data.count} snapshots)`);
  }
  if (Object.keys(dist.failureActs).length > 0) {
    console.log(`  failures by act: ${Object.entries(dist.failureActs).map(([a, c]) => `act${a}:${c}`).join(", ")}`);
  }

  assert.ok(dist.runs === 3, "should have 3 runs");
  assert.ok(dist.avgFinalPower > 0, "should have positive power scores");
});

test("all classes campaign comparison shows class strategy differences", () => {
  const classes = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
  console.log("  === Campaign Comparison (aggressive + class strategy, seed 0) ===");
  console.log(`  ${"CLASS".padEnd(14)} ${"OUTCOME".padEnd(16)} ${"LV".padEnd(5)} ${"POWER".padEnd(7)} ${"DECK".padEnd(6)} ${"BOSSES".padEnd(8)} DURATION`);

  for (const classId of classes) {
    const result = runCampaignSim({ classId, seedOffset: 0 });
    const outcome = result.outcome === "run_complete" ? "CLEARED" : `FAILED A${result.finalActNumber}`;
    console.log(`  ${classId.padEnd(14)} ${outcome.padEnd(16)} ${String(result.finalLevel).padEnd(5)} ${String(result.finalPowerScore).padEnd(7)} ${String(result.finalDeckSize).padEnd(6)} ${String(result.bossesDefeated).padEnd(8)} ${result.durationMs}ms`);
  }

  assert.ok(true);
});
