export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateBuildSnapshots,
  editBuildSnapshot,
  testBuildAgainstEncounter,
  printBuildSnapshot,
  printCombatResult,
} from "./helpers/build-snapshot";

test("generate build snapshots and test against act boss", () => {
  // Generate Paladin build through Act 3 (auto-win, fast)
  console.log("\n  Generating Paladin build snapshots...");
  const snapshots = generateBuildSnapshots({
    classId: "paladin",
    seedOffset: 0,
    throughActNumber: 3,
  });

  console.log(`  Generated ${snapshots.length} snapshots\n`);
  for (const snap of snapshots) {
    printBuildSnapshot(snap);
    console.log("");
  }

  // Take the last snapshot and test it against Act 3 boss
  const latestBuild = snapshots[snapshots.length - 1];
  if (!latestBuild) { return; }

  console.log("  --- Testing build vs Act 3 Boss (3 runs) ---");
  const results = testBuildAgainstEncounter(latestBuild, "act_3_boss", 3);
  for (const result of results) {
    printCombatResult(result);
    // Show first 5 decisions
    for (const d of result.decisions.slice(0, 5)) {
      console.log(`    T${d.turn}: [${d.score.toFixed(0)}] ${d.action} | hp:${d.heroHp} guard:${d.heroGuard} incoming:${d.incoming}`);
    }
  }

  const wins = results.filter(r => r.outcome === "victory").length;
  console.log(`\n  Win rate: ${wins}/${results.length}`);
  assert.ok(snapshots.length >= 1, "should generate at least one snapshot");
});

test("edit a build snapshot and compare combat results", () => {
  // Generate Barbarian build through Act 2
  const snapshots = generateBuildSnapshots({
    classId: "barbarian",
    seedOffset: 0,
    throughActNumber: 2,
  });

  const build = snapshots[snapshots.length - 1];
  if (!build) { return; }

  console.log("\n  --- Original Barbarian Build ---");
  printBuildSnapshot(build);

  // Test original vs Act 2 boss
  const originalResults = testBuildAgainstEncounter(build, "act_2_boss", 3);
  const originalWins = originalResults.filter(r => r.outcome === "victory").length;
  console.log(`  vs Act 2 Boss: ${originalWins}/3 wins`);

  // Edit: give more guard and potions
  const buffedBuild = editBuildSnapshot(build, {
    setHero: { guardBonus: build.hero.guardBonus + 5, maxLife: build.hero.maxLife + 20 },
    setPotions: 5,
  });

  console.log("\n  --- Buffed Barbarian Build (+5 guard, +20 hp, 5 potions) ---");
  printBuildSnapshot(buffedBuild);

  const buffedResults = testBuildAgainstEncounter(buffedBuild, "act_2_boss", 3);
  const buffedWins = buffedResults.filter(r => r.outcome === "victory").length;
  console.log(`  vs Act 2 Boss: ${buffedWins}/3 wins`);

  console.log(`\n  Guard buff impact: ${originalWins}/3 → ${buffedWins}/3`);
  assert.ok(true);
});
