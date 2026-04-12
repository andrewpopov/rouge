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

function assertIncludesTags(actual: CounterTag[] | undefined, expected: CounterTag[], label: string) {
  const tagSet = new Set(actual || []);
  expected.forEach((tag) => {
    assert.ok(tagSet.has(tag), `${label} should include ${tag}`);
  });
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
    },
    {
      id: "act_1_opening_skirmish",
      name: "Wilderness Skirmish",
      enemyCount: 3,
      modifiers: [],
    }
  );

  assertNormalizedEqual(
    {
      id: "act_2_branch_bulwark",
      name: content.encounterCatalog.act_2_branch_bulwark.name,
      enemyCount: content.encounterCatalog.act_2_branch_bulwark.enemies.length,
      modifiers: (content.encounterCatalog.act_2_branch_bulwark.modifiers || []).map((modifier) => `${modifier.kind}:${modifier.value}`),
    },
    {
      id: "act_2_branch_bulwark",
      name: "Tomb Bulwark",
      enemyCount: 3,
      modifiers: ["triage_screen:3", "boss_onslaught:1", "boss_salvo:1"],
    }
  );

  assertNormalizedEqual(
    {
      id: "act_3_branch_sanctum",
      name: content.encounterCatalog.act_3_branch_sanctum.name,
      enemyCount: content.encounterCatalog.act_3_branch_sanctum.enemies.length,
      modifiers: (content.encounterCatalog.act_3_branch_sanctum.modifiers || []).map((modifier) => `${modifier.kind}:${modifier.value}`),
    },
    {
      id: "act_3_branch_sanctum",
      name: "Idol Reach Sanctum",
      enemyCount: 4,
      modifiers: ["escort_bulwark:3", "escort_command:1", "triage_screen:3"],
    }
  );

  assertNormalizedEqual(
    {
      id: "act_4_boss",
      name: content.encounterCatalog.act_4_boss.name,
      enemyCount: content.encounterCatalog.act_4_boss.enemies.length,
      modifiers: (content.encounterCatalog.act_4_boss.modifiers || []).map((modifier) => `${modifier.kind}:${modifier.value}`),
    },
    {
      id: "act_4_boss",
      name: "Diablo",
      enemyCount: 4,
      modifiers: ["boss_screen:6", "escort_bulwark:3"],
    }
  );

  assertNormalizedEqual(
    {
      id: "act_5_boss_aftermath",
      name: content.encounterCatalog.act_5_boss_aftermath.name,
      enemyCount: content.encounterCatalog.act_5_boss_aftermath.enemies.length,
      modifiers: (content.encounterCatalog.act_5_boss_aftermath.modifiers || []).map((modifier) => `${modifier.kind}:${modifier.value}`),
    },
    {
      id: "act_5_boss_aftermath",
      name: "Crown Of Ruin Aftermath",
      enemyCount: 4,
      modifiers: ["boss_screen:6", "phalanx_march:5", "ritual_cadence:3", "linebreaker_charge:3"],
    }
  );
});

test("branch battle, miniboss, and boss encounters all surface gameplay ask tags", () => {
  const { content } = createAppHarness();

  for (let actNumber = 1; actNumber <= 5; actNumber += 1) {
    const generatedIds = content.generatedActEncounterIds[actNumber];
    ["branchBattle", "branchMiniboss", "boss"].forEach((kind) => {
      generatedIds[kind as keyof typeof generatedIds].forEach((encounterId) => {
        const askTags = content.encounterCatalog[encounterId]?.askTags || [];
        assert.ok(askTags.length > 0, `${encounterId} should surface at least one ask tag`);
      });
    });
  }
});

test("act branch miniboss packages preview the core asks of the act boss", () => {
  const { content } = createAppHarness();

  for (let actNumber = 1; actNumber <= 5; actNumber += 1) {
    const bossEncounterId = content.generatedActEncounterIds[actNumber].boss[0];
    const bossAskTags = new Set(content.encounterCatalog[bossEncounterId]?.askTags || []);
    const branchMinibossUnion = new Set<CounterTag>();
    let overlappingPackages = 0;

    content.generatedActEncounterIds[actNumber].branchMiniboss.forEach((encounterId) => {
      const askTags = content.encounterCatalog[encounterId]?.askTags || [];
      askTags.forEach((tag) => branchMinibossUnion.add(tag));
      if (askTags.some((tag) => bossAskTags.has(tag))) {
        overlappingPackages += 1;
      }
    });

    bossAskTags.forEach((tag) => {
      assert.ok(branchMinibossUnion.has(tag), `Act ${actNumber} branch elites should collectively preview ${tag}`);
    });
    assert.ok(
      overlappingPackages >= Math.ceil(content.generatedActEncounterIds[actNumber].branchMiniboss.length * 0.66),
      `Act ${actNumber} should have most branch elite packages preview the boss asks`
    );
  }
});

test("act bosses keep distinct core ask profiles by act theme", () => {
  const { content } = createAppHarness();
  const profiles = [];

  for (let actNumber = 1; actNumber <= 5; actNumber += 1) {
    const bossEncounterId = content.generatedActEncounterIds[actNumber].boss[0];
    const askTags = [...(content.encounterCatalog[bossEncounterId]?.askTags || [])].sort();
    profiles.push({ actNumber, askTags });
  }

  for (let index = 1; index < profiles.length; index += 1) {
    const previous = profiles[index - 1];
    const current = profiles[index];
    assert.notEqual(
      JSON.stringify(previous.askTags),
      JSON.stringify(current.askTags),
      `Act ${current.actNumber} boss should not reuse Act ${previous.actNumber}'s core ask profile`
    );
  }

  assertIncludesTags(content.encounterCatalog.act_1_boss.askTags, ["anti_attrition"], "act_1_boss");
  assertIncludesTags(content.encounterCatalog.act_2_boss.askTags, ["anti_guard_break"], "act_2_boss");
  assertIncludesTags(content.encounterCatalog.act_3_boss.askTags, ["anti_backline", "anti_lightning_pressure"], "act_3_boss");
  assertIncludesTags(content.encounterCatalog.act_4_boss.askTags, ["anti_fire_pressure", "telegraph_respect"], "act_4_boss");
  assertIncludesTags(content.encounterCatalog.act_5_boss.askTags, ["anti_summon", "anti_control"], "act_5_boss");
});
