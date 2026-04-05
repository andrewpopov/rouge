export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { getThreatShortfall } from "./helpers/run-progression-simulator-combat";

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
