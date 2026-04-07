export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness } from "./helpers/browser-harness";

function normalize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertNormalizedEqual(actual: unknown, expected: unknown) {
  assert.equal(JSON.stringify(normalize(actual)), JSON.stringify(expected));
}

test("encounter registry keeps the generated act encounter lane counts stable", () => {
  const { content } = createAppHarness();

  assertNormalizedEqual(
    Object.fromEntries(
      Object.entries(content.generatedActEncounterIds).map(([actNumber, encounterIds]) => [
        actNumber,
        {
          opening: encounterIds.opening.length,
          branchBattle: encounterIds.branchBattle.length,
          branchMiniboss: encounterIds.branchMiniboss.length,
          boss: encounterIds.boss.length,
        },
      ])
    ),
    {
      1: { opening: 7, branchBattle: 6, branchMiniboss: 6, boss: 1 },
      2: { opening: 7, branchBattle: 6, branchMiniboss: 6, boss: 1 },
      3: { opening: 7, branchBattle: 6, branchMiniboss: 6, boss: 1 },
      4: { opening: 7, branchBattle: 6, branchMiniboss: 6, boss: 1 },
      5: { opening: 7, branchBattle: 6, branchMiniboss: 6, boss: 1 },
    }
  );
});

test("encounter registry keeps representative encounter definitions stable", () => {
  const { content } = createAppHarness();

  assertNormalizedEqual(
    {
      id: "act_1_opening_skirmish",
      name: content.encounterCatalog.act_1_opening_skirmish.name,
      enemyCount: content.encounterCatalog.act_1_opening_skirmish.enemies.length,
      modifiers: content.encounterCatalog.act_1_opening_skirmish.modifiers || [],
      askTags: content.encounterCatalog.act_1_opening_skirmish.askTags,
    },
    {
      id: "act_1_opening_skirmish",
      name: "Wilderness Skirmish",
      enemyCount: 3,
      modifiers: [],
      askTags: [],
    }
  );

  assertNormalizedEqual(
    {
      id: "act_2_branch_bulwark",
      name: content.encounterCatalog.act_2_branch_bulwark.name,
      enemyCount: content.encounterCatalog.act_2_branch_bulwark.enemies.length,
      modifiers: (content.encounterCatalog.act_2_branch_bulwark.modifiers || []).map((modifier) => `${modifier.kind}:${modifier.value}`),
      askTags: content.encounterCatalog.act_2_branch_bulwark.askTags,
    },
    {
      id: "act_2_branch_bulwark",
      name: "Tomb Bulwark",
      enemyCount: 3,
      modifiers: ["triage_screen:3", "boss_onslaught:1", "boss_salvo:1"],
      askTags: [],
    }
  );

  assertNormalizedEqual(
    {
      id: "act_3_branch_sanctum",
      name: content.encounterCatalog.act_3_branch_sanctum.name,
      enemyCount: content.encounterCatalog.act_3_branch_sanctum.enemies.length,
      modifiers: (content.encounterCatalog.act_3_branch_sanctum.modifiers || []).map((modifier) => `${modifier.kind}:${modifier.value}`),
      askTags: content.encounterCatalog.act_3_branch_sanctum.askTags,
    },
    {
      id: "act_3_branch_sanctum",
      name: "Idol Reach Sanctum",
      enemyCount: 4,
      modifiers: ["escort_bulwark:3", "escort_command:1", "triage_screen:3"],
      askTags: ["telegraph_respect", "anti_backline", "anti_lightning_pressure"],
    }
  );

  assertNormalizedEqual(
    {
      id: "act_4_boss",
      name: content.encounterCatalog.act_4_boss.name,
      enemyCount: content.encounterCatalog.act_4_boss.enemies.length,
      modifiers: (content.encounterCatalog.act_4_boss.modifiers || []).map((modifier) => `${modifier.kind}:${modifier.value}`),
      askTags: content.encounterCatalog.act_4_boss.askTags,
    },
    {
      id: "act_4_boss",
      name: "Diablo",
      enemyCount: 4,
      modifiers: ["boss_screen:6", "escort_bulwark:3"],
      askTags: ["anti_fire_pressure", "telegraph_respect"],
    }
  );

  assertNormalizedEqual(
    {
      id: "act_5_boss_aftermath",
      name: content.encounterCatalog.act_5_boss_aftermath.name,
      enemyCount: content.encounterCatalog.act_5_boss_aftermath.enemies.length,
      modifiers: (content.encounterCatalog.act_5_boss_aftermath.modifiers || []).map((modifier) => `${modifier.kind}:${modifier.value}`),
      askTags: content.encounterCatalog.act_5_boss_aftermath.askTags,
    },
    {
      id: "act_5_boss_aftermath",
      name: "Crown Of Ruin Aftermath",
      enemyCount: 4,
      modifiers: ["boss_screen:6", "phalanx_march:5", "ritual_cadence:3", "linebreaker_charge:3"],
      askTags: ["anti_summon", "anti_control"],
    }
  );
});
