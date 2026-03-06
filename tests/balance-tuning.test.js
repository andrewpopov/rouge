const assert = require("node:assert/strict");
const { before, after, test } = require("node:test");
const { launchBrowser, closeBrowser, openGamePage } = require("./helpers/playwright-game");

let browser;

before(async () => {
  browser = await launchBrowser();
});

after(async () => {
  await closeBrowser(browser);
});

test("enemy balance override changes spawned enemy stats", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.enemies.rail_hound.maxHp = 41;
      window.BRASSLINE_BALANCE.enemies.rail_hound.intents[0].value = 9;
      window.BRASSLINE_BALANCE.progression.sectors = [
        {
          name: "Rail Hound Test",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
      ];
      dbg.initGame();

      const hound = dbg.game.enemies.find((enemy) => enemy.key === "rail_hound");
      return {
        maxHp: hound?.maxHp ?? null,
        hp: hound?.hp ?? null,
        intent0: hound?.intents?.[0]?.value ?? null,
      };
    });

    assert.equal(result.maxHp, 41);
    assert.equal(result.hp, 41);
    assert.equal(result.intent0, 9);
  } finally {
    await page.close();
  }
});

test("card balance override changes live card effect values", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.cards.turret_burst.baseDamage = 1;
      dbg.initGame();

      const g = dbg.game;
      const aliveIds = g.enemies.filter((enemy) => enemy.alive).map((enemy) => enemy.id);
      const before = aliveIds.map((id) => {
        const enemy = g.enemies.find((entry) => entry.id === id);
        return enemy?.hp ?? 0;
      });

      g.player.energy = 3;
      g.hand = [{ cardId: "turret_burst", instanceId: "c_test_turret" }];
      g.drawPile = [];
      g.discardPile = [];
      g.exhaustPile = [];
      g.selectedEnemyId = aliveIds[0] || null;
      dbg.renderCards();

      const cardNode = document.querySelector("#cardRow .card");
      cardNode?.click();

      const after = aliveIds.map((id) => {
        const enemy = g.enemies.find((entry) => entry.id === id);
        return enemy?.hp ?? 0;
      });

      return before.map((hp, index) => hp - after[index]);
    });

    assert.ok(result.length > 0);
    assert.ok(result.every((delta) => delta === 1));
  } finally {
    await page.close();
  }
});

test("progression balance override changes sector roster and starter deck", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.progression.sectors = [
        {
          name: "Test Loop",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
      ];
      window.BRASSLINE_BALANCE.progression.starterDeck = ["pressure_vent", "pressure_vent", "pressure_vent"];
      dbg.initGame();

      return {
        sectorLabel: document.getElementById("sectorLabel")?.textContent || "",
        enemyCount: dbg.game.enemies.length,
        enemyKey: dbg.game.enemies[0]?.key ?? "",
        handCards: dbg.game.hand.map((card) => card.cardId),
      };
    });

    assert.match(result.sectorLabel, /Sector 1\/1/i);
    assert.equal(result.enemyCount, 1);
    assert.equal(result.enemyKey, "rail_hound");
    const ventCards = result.handCards.filter((id) => id === "pressure_vent");
    assert.equal(ventCards.length, 3);
  } finally {
    await page.close();
  }
});

test("weighted sector pools pick deterministic encounter subsets per run seed", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const progression = window.BRASSLINE_BALANCE.progression;
      progression.sectors = [
        {
          name: "Seed Setup",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
        {
          name: "Weighted Probe",
          encounterSize: 2,
          enemies: [
            { key: "ash_gunner", power: 1, weight: 5 },
            { key: "rail_sentry", power: 1, weight: 1 },
            { key: "mortar_engineer", power: 1, weight: 1 },
            { key: "arc_lancer", power: 1, weight: 1 },
          ],
        },
      ];

      function runToSecondSector(seed) {
        dbg.initGame();
        const g = dbg.game;
        g.runSeed = seed;
        g.enemies.forEach((enemy) => {
          enemy.alive = false;
          enemy.hp = 0;
        });
        dbg.checkEndStates();
        dbg.applyRewardAndAdvance(null);
        return g.enemies.map((enemy) => enemy.key);
      }

      const seedA = runToSecondSector(1337);
      const seedB = runToSecondSector(1337);

      return {
        seedA,
        seedB,
      };
    });

    assert.equal(result.seedA.length, 2);
    assert.deepEqual(result.seedA, result.seedB);
    assert.equal(new Set(result.seedA).size, 2);
    assert.ok(result.seedA.includes("ash_gunner"));
  } finally {
    await page.close();
  }
});

test("progression reward pool override controls offered card rewards", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const progression = window.BRASSLINE_BALANCE.progression;
      progression.sectors = [
        {
          name: "Reward Test",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
        {
          name: "Reward Test 2",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
      ];
      progression.rewardPool = ["rail_cannon"];
      dbg.initGame();

      const g = dbg.game;
      g.upgrades.condenser_bank = 3;
      g.upgrades.coolant_loop = 3;
      g.upgrades.hull_plating = 3;
      g.upgrades.guard_protocol = 3;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });

      dbg.checkEndStates();
      dbg.updateHud();

      return {
        phase: g.phase,
        choices: g.rewardChoices.map((choice) => ({
          type: choice?.type ?? "",
          cardId: choice?.cardId ?? "",
        })),
      };
    });

    assert.equal(result.phase, "reward");
    assert.ok(result.choices.length > 0);
    const cardChoices = result.choices.filter((choice) => choice.type === "card");
    assert.ok(cardChoices.length >= 1);
    const invalidCardChoices = cardChoices.filter(
      (choice) => choice.cardId !== "rail_cannon" && !/_spell$/.test(choice.cardId)
    );
    assert.equal(invalidCardChoices.length, 0);
  } finally {
    await page.close();
  }
});

test("upgrade path override updates labels and total possible levels", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.upgradePaths.condenser_bank.title = "Pressure Cells";
      window.BRASSLINE_BALANCE.upgradePaths.condenser_bank.maxLevel = 2;
      dbg.initGame();

      const g = dbg.game;
      g.upgrades.condenser_bank = 1;
      g.phase = "reward";
      g.rewardChoices = [{ type: "upgrade", upgradeId: "condenser_bank" }];
      dbg.updateHud();

      return {
        rewardText: document.getElementById("rewardChoices")?.textContent || "",
        metaText: document.getElementById("rewardMeta")?.textContent || "",
      };
    });

    assert.match(result.rewardText, /pressure cells/i);
    assert.match(result.rewardText, /Lv 1\/2 -> Lv 2\/2/i);
    assert.match(result.metaText, /1\/11 levels installed/i);
  } finally {
    await page.close();
  }
});

test("upgrade path max level override clamps stored meta progress", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.upgradePaths.condenser_bank.maxLevel = 2;
      window.localStorage.setItem(
        "brassline_meta_v1",
        JSON.stringify({
          upgrades: {
            condenser_bank: 9,
            coolant_loop: 0,
            hull_plating: 0,
            guard_protocol: 0,
          },
        })
      );
      dbg.initGame();
      return {
        condenserLevel: dbg.game.upgrades.condenser_bank,
      };
    });

    assert.equal(result.condenserLevel, 2);
  } finally {
    await page.close();
  }
});

test("invalid progression sectors fall back to default roster", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.progression.sectors = [
        {
          name: "Broken Sector",
          enemies: [{ key: "unknown_enemy_key", power: 1 }],
        },
      ];
      dbg.initGame();
      return {
        sectorLabel: document.getElementById("sectorLabel")?.textContent || "",
        enemyKeys: dbg.game.enemies.map((enemy) => enemy.key),
      };
    });

    assert.match(result.sectorLabel, /sector 1\//i);
    assert.doesNotMatch(result.sectorLabel, /broken sector/i);
    assert.ok(result.enemyKeys.length > 0);
    assert.ok(result.enemyKeys.every((key) => key !== "unknown_enemy_key"));
  } finally {
    await page.close();
  }
});

test("invalid starter deck falls back to default cards", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.progression.starterDeck = ["not_a_real_card"];
      dbg.initGame();
      return {
        handCards: dbg.game.hand.map((card) => card.cardId),
      };
    });

    assert.ok(result.handCards.length > 0);
    assert.ok(!result.handCards.includes("not_a_real_card"));
  } finally {
    await page.close();
  }
});

test("invalid reward pool falls back to default reward cards", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const progression = window.BRASSLINE_BALANCE.progression;
      progression.sectors = [
        {
          name: "Fallback Reward A",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
        {
          name: "Fallback Reward B",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
      ];
      progression.rewardPool = ["not_a_real_card"];
      dbg.initGame();

      const g = dbg.game;
      g.upgrades.condenser_bank = 3;
      g.upgrades.coolant_loop = 3;
      g.upgrades.hull_plating = 3;
      g.upgrades.guard_protocol = 3;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();

      return {
        phase: g.phase,
        choices: g.rewardChoices.map((choice) => ({
          type: choice?.type ?? "",
          cardId: choice?.cardId ?? "",
        })),
      };
    });

    assert.equal(result.phase, "reward");
    assert.ok(result.choices.length > 0);
    const cardChoices = result.choices.filter((choice) => choice.type === "card");
    assert.ok(cardChoices.length >= 1);
    assert.ok(cardChoices.every((choice) => choice.cardId !== "not_a_real_card"));
  } finally {
    await page.close();
  }
});

test("non-string upgrade path title falls back to default title", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.upgradePaths.condenser_bank.title = 999;
      dbg.initGame();

      const g = dbg.game;
      g.phase = "reward";
      g.rewardChoices = [{ type: "upgrade", upgradeId: "condenser_bank" }];
      dbg.updateHud();

      return {
        rewardText: document.getElementById("rewardChoices")?.textContent || "",
      };
    });

    assert.match(result.rewardText, /condenser bank/i);
  } finally {
    await page.close();
  }
});

test("upgrade path max level is clamped to upper bound", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.upgradePaths.condenser_bank.maxLevel = 99;
      dbg.initGame();

      const g = dbg.game;
      g.upgrades.condenser_bank = 8;
      g.phase = "reward";
      g.rewardChoices = [{ type: "upgrade", upgradeId: "condenser_bank" }];
      dbg.updateHud();

      return {
        rewardText: document.getElementById("rewardChoices")?.textContent || "",
      };
    });

    assert.match(result.rewardText, /Lv 8\/9 -> Lv 9\/9/i);
  } finally {
    await page.close();
  }
});

test("steam barrier cools, blocks, and draws when heat is low enough", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      g.player.heat = 30;
      g.player.block = 0;
      g.player.energy = 3;
      g.hand = [{ cardId: "steam_barrier", instanceId: "c_test_steam_barrier" }];
      g.drawPile = [{ cardId: "stoke_burners", instanceId: "c_draw_after_barrier" }];
      g.discardPile = [];
      g.exhaustPile = [];
      g.selectedEnemyId = g.enemies.find((enemy) => enemy.alive)?.id || null;
      dbg.renderCards();

      document.querySelector("#cardRow .card")?.click();

      return {
        heat: g.player.heat,
        block: g.player.block,
        handCards: g.hand.map((entry) => entry.cardId),
      };
    });

    assert.equal(result.heat, 20);
    assert.equal(result.block, 11);
    assert.equal(result.handCards.length, 1);
    assert.equal(result.handCards[0], "stoke_burners");
  } finally {
    await page.close();
  }
});

test("boiler spike applies high-heat bonus damage", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      const target = g.enemies.find((enemy) => enemy.alive);
      if (!target) {
        return { damage: 0 };
      }

      target.hp = 99;
      target.maxHp = 99;
      target.block = 0;
      g.selectedEnemyId = target.id;
      g.player.heat = 79;
      g.player.energy = 3;
      g.hand = [{ cardId: "boiler_spike", instanceId: "c_test_boiler_spike" }];
      g.drawPile = [];
      g.discardPile = [];
      g.exhaustPile = [];
      dbg.renderCards();

      const before = target.hp;
      document.querySelector("#cardRow .card")?.click();
      const after = target.hp;

      return {
        damage: before - after,
      };
    });

    assert.equal(result.damage, 18);
  } finally {
    await page.close();
  }
});

test("fume bomber spawns with lob, stoke, and attack intents", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.progression.sectors = [
        {
          name: "Fume Test",
          enemies: [{ key: "fume_bomber", power: 1 }],
        },
      ];
      dbg.initGame();

      const enemy = dbg.game.enemies[0];
      return {
        key: enemy?.key ?? "",
        intents: (enemy?.intents || []).map((intent) => intent.kind),
      };
    });

    assert.equal(result.key, "fume_bomber");
    assert.deepEqual(result.intents, ["lob", "stoke", "attack"]);
  } finally {
    await page.close();
  }
});

test("circuit break lowers heat and restores steam", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      g.player.heat = 50;
      g.player.energy = 1;
      g.hand = [{ cardId: "circuit_break", instanceId: "c_test_circuit_break" }];
      g.drawPile = [];
      g.discardPile = [];
      g.exhaustPile = [];
      g.selectedEnemyId = g.enemies.find((enemy) => enemy.alive)?.id || null;
      dbg.renderCards();

      document.querySelector("#cardRow .card")?.click();

      return {
        heat: g.player.heat,
        energy: g.player.energy,
      };
    });

    assert.equal(result.heat, 36);
    assert.equal(result.energy, 1);
  } finally {
    await page.close();
  }
});

test("slag round gains bonus damage against charged targets", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      const target = g.enemies.find((enemy) => enemy.alive);
      if (!target) {
        return { damage: 0 };
      }

      target.hp = 99;
      target.maxHp = 99;
      target.block = 0;
      target.attackBuff = 2;
      g.selectedEnemyId = target.id;
      g.player.heat = 30;
      g.player.energy = 3;
      g.hand = [{ cardId: "slag_round", instanceId: "c_test_slag_round" }];
      g.drawPile = [];
      g.discardPile = [];
      g.exhaustPile = [];
      dbg.renderCards();

      const before = target.hp;
      document.querySelector("#cardRow .card")?.click();
      const after = target.hp;

      return {
        damage: before - after,
      };
    });

    assert.equal(result.damage, 16);
  } finally {
    await page.close();
  }
});

test("combo keyword grants bonus when another card was played first", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      const target = g.enemies.find((enemy) => enemy.alive);
      if (!target) {
        return { damage: 0, energy: 0, turnCardsPlayed: 0 };
      }

      target.hp = 99;
      target.maxHp = 99;
      target.block = 0;
      g.selectedEnemyId = target.id;
      g.player.energy = 3;
      g.player.heat = 10;
      g.turnCardsPlayed = 0;
      g.hand = [
        { cardId: "relay_tap", instanceId: "c_test_relay_tap" },
        { cardId: "combo_strike", instanceId: "c_test_combo_strike" },
      ];
      g.drawPile = [];
      g.discardPile = [];
      g.exhaustPile = [];
      dbg.renderCards();

      const before = target.hp;
      const cards = document.querySelectorAll("#cardRow .card");
      cards[0]?.click();
      document.querySelector("#cardRow .card")?.click();
      const after = target.hp;

      return {
        damage: before - after,
        energy: g.player.energy,
        turnCardsPlayed: g.turnCardsPlayed,
        log: g.log,
      };
    });

    assert.equal(result.damage, 9);
    assert.equal(result.energy, 3);
    assert.equal(result.turnCardsPlayed, 2);
    assert.match(result.log, /combo strike/i);
  } finally {
    await page.close();
  }
});

test("firstfire keyword only triggers on the first card of a turn", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      const target = g.enemies.find((enemy) => enemy.alive);
      if (!target) {
        return { energy: 0, turnCardsPlayed: 0, log: "" };
      }

      target.hp = 99;
      target.maxHp = 99;
      target.block = 0;
      g.selectedEnemyId = target.id;
      g.player.energy = 3;
      g.player.heat = 20;
      g.turnCardsPlayed = 0;
      g.hand = [
        { cardId: "ignition_jab", instanceId: "c_test_ignition_jab_1" },
        { cardId: "ignition_jab", instanceId: "c_test_ignition_jab_2" },
      ];
      g.drawPile = [];
      g.discardPile = [];
      g.exhaustPile = [];
      dbg.renderCards();

      const firstCard = document.querySelectorAll("#cardRow .card")[0];
      firstCard?.click();
      const afterFirstEnergy = g.player.energy;

      document.querySelector("#cardRow .card")?.click();
      const afterSecondEnergy = g.player.energy;

      return {
        afterFirstEnergy,
        afterSecondEnergy,
        turnCardsPlayed: g.turnCardsPlayed,
        log: g.log,
      };
    });

    assert.equal(result.afterFirstEnergy, 3);
    assert.equal(result.afterSecondEnergy, 2);
    assert.equal(result.turnCardsPlayed, 2);
    assert.match(result.log, /ignition jab/i);
  } finally {
    await page.close();
  }
});

test("siphon bolt steals target block before damage", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      dbg.initGame();

      const g = dbg.game;
      const target = g.enemies.find((enemy) => enemy.alive);
      if (!target) {
        return { playerBlock: 0, targetBlock: 0, damage: 0 };
      }

      target.hp = 99;
      target.maxHp = 99;
      target.block = 5;
      g.player.block = 0;
      g.selectedEnemyId = target.id;
      g.player.energy = 3;
      g.hand = [{ cardId: "siphon_bolt", instanceId: "c_test_siphon_bolt" }];
      g.drawPile = [];
      g.discardPile = [];
      g.exhaustPile = [];
      dbg.renderCards();

      const before = target.hp;
      document.querySelector("#cardRow .card")?.click();
      const after = target.hp;

      return {
        playerBlock: g.player.block,
        targetBlock: target.block,
        damage: before - after,
      };
    });

    assert.equal(result.playerBlock, 4);
    assert.equal(result.targetBlock, 0);
    assert.equal(result.damage, 7);
  } finally {
    await page.close();
  }
});

test("new enemy roster entries spawn with expected intent families", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.progression.sectors = [
        {
          name: "Roster Probe",
          enemies: [
            { key: "coil_priest", power: 1 },
            { key: "orbital_miner", power: 1 },
          ],
        },
      ];
      dbg.initGame();

      const enemies = dbg.game.enemies.map((enemy) => ({
        key: enemy.key,
        intents: enemy.intents.map((intent) => intent.kind),
      }));
      return { enemies };
    });

    const coilPriest = result.enemies.find((enemy) => enemy.key === "coil_priest");
    const orbitalMiner = result.enemies.find((enemy) => enemy.key === "orbital_miner");
    assert.ok(coilPriest);
    assert.ok(orbitalMiner);
    assert.deepEqual(coilPriest.intents, ["charge", "attack", "stoke"]);
    assert.deepEqual(orbitalMiner.intents, ["sweep", "guard", "attack"]);
  } finally {
    await page.close();
  }
});

test("signal jammer and rivet brute spawn with expected intent families", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      window.BRASSLINE_BALANCE.progression.sectors = [
        {
          name: "New Roster Probe",
          enemies: [
            { key: "signal_jammer", power: 1 },
            { key: "rivet_brute", power: 1 },
          ],
        },
      ];
      dbg.initGame();

      const enemies = dbg.game.enemies.map((enemy) => ({
        key: enemy.key,
        intents: enemy.intents.map((intent) => intent.kind),
      }));
      return { enemies };
    });

    const signalJammer = result.enemies.find((enemy) => enemy.key === "signal_jammer");
    const rivetBrute = result.enemies.find((enemy) => enemy.key === "rivet_brute");
    assert.ok(signalJammer);
    assert.ok(rivetBrute);
    assert.deepEqual(signalJammer.intents, ["aim", "stoke", "attack"]);
    assert.deepEqual(rivetBrute.intents, ["guard", "attack", "sweep"]);
  } finally {
    await page.close();
  }
});

test("elite enemy entries use elite patterns and render elite UI markers", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const progression = window.BRASSLINE_BALANCE.progression;
      progression.sectors = [
        {
          name: "Elite Probe",
          enemies: [
            { key: "rail_sentry", power: 1, elite: true },
            { key: "mortar_engineer", power: 1, elite: true },
          ],
        },
      ];
      dbg.initGame();
      dbg.renderEnemies();

      document.querySelector("#enemyRow .enemy .enemy-tooltip-toggle")?.click();

      return {
        enemies: dbg.game.enemies.map((enemy) => ({
          key: enemy.key,
          elite: enemy.elite,
          maxHp: enemy.maxHp,
          block: enemy.block,
          intentKinds: enemy.intents.map((intent) => intent.kind),
        })),
        eliteBadges: Array.from(document.querySelectorAll("#enemyRow .enemy .enemy-badge-elite")).map((node) =>
          node.textContent?.trim() || ""
        ),
        tooltipText: document.querySelector("#enemyRow .enemy .enemy-tooltip")?.textContent || "",
      };
    });

    const eliteSentry = result.enemies.find((enemy) => enemy.key === "rail_sentry");
    const eliteMortar = result.enemies.find((enemy) => enemy.key === "mortar_engineer");
    assert.ok(eliteSentry);
    assert.ok(eliteMortar);
    assert.equal(eliteSentry.elite, true);
    assert.equal(eliteMortar.elite, true);
    assert.deepEqual(eliteSentry.intentKinds, ["aim", "attack", "sweep"]);
    assert.deepEqual(eliteMortar.intentKinds, ["lob", "stoke", "attack"]);
    assert.ok(eliteSentry.maxHp > 29);
    assert.ok(eliteMortar.maxHp > 33);
    assert.ok(eliteSentry.block > 0);
    assert.ok(eliteMortar.block > 0);
    assert.ok(result.eliteBadges.length >= 2);
    assert.ok(result.eliteBadges.every((label) => /elite/i.test(label)));
    assert.match(result.tooltipText, /elite/i);
  } finally {
    await page.close();
  }
});

test("encounter modifier overrides apply effects at sector start", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const progression = window.BRASSLINE_BALANCE.progression;
      progression.sectors = [
        {
          name: "Modifier Probe",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
      ];
      progression.encounterModifiers = {
        fortified_patrol: { enabled: true, value: 7, title: "Fortified Patrol" },
        pressure_front: { enabled: false },
        steam_surge: { enabled: false },
      };
      dbg.initGame();

      const g = dbg.game;
      return {
        enemyBlocks: g.enemies.map((enemy) => enemy.block),
        modifierTitle: g.encounterModifier?.title || "",
        log: g.log,
        sectorLabel: document.getElementById("sectorLabel")?.textContent || "",
      };
    });

    assert.ok(result.enemyBlocks.length > 0);
    assert.ok(result.enemyBlocks.every((value) => value === 7));
    assert.match(result.modifierTitle, /fortified patrol/i);
    assert.match(result.log, /fortified patrol/i);
    assert.match(result.sectorLabel, /fortified patrol/i);
  } finally {
    await page.close();
  }
});

test("configured event interlude appears after reward and applies option effects", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const progression = window.BRASSLINE_BALANCE.progression;
      progression.sectors = [
        {
          name: "Interlude A",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
        {
          name: "Interlude B",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
      ];
      progression.interludes = [
        {
          afterSector: 1,
          type: "event",
          title: "Pressure Leak",
          description: "Patch exposed conduits.",
          options: [{ label: "Patch Hull", hull: 6, heat: -4 }],
        },
      ];
      dbg.initGame();

      const g = dbg.game;
      g.player.hull = 30;
      g.player.heat = 40;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();
      dbg.applyRewardAndAdvance(null);
      const phaseAtInterlude = g.phase;
      const interludeTitle = document.getElementById("interludeTitle")?.textContent || "";

      dbg.resolveInterludeOption(0);
      const phaseAfterChoice = g.phase;

      return {
        phaseAtInterlude,
        interludeTitle,
        phaseAfterChoice,
        hull: g.player.hull,
        sectorLabel: document.getElementById("sectorLabel")?.textContent || "",
      };
    });

    assert.equal(result.phaseAtInterlude, "world_map");
    assert.match(result.interludeTitle, /pressure leak/i);
    assert.equal(result.phaseAfterChoice, "encounter");
    assert.ok(result.hull >= 40);
    assert.match(result.sectorLabel, /sector 2\/2/i);
  } finally {
    await page.close();
  }
});

test("configured shop interlude can add a card to deck", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const progression = window.BRASSLINE_BALANCE.progression;
      progression.sectors = [
        {
          name: "Shop A",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
        {
          name: "Shop B",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
      ];
      progression.interludes = [
        {
          afterSector: 1,
          type: "shop",
          title: "Track Depot",
          description: "Swap and stock parts.",
          options: [{ label: "Buy Circuit Break", addCard: "circuit_break" }],
        },
      ];
      dbg.initGame();

      const g = dbg.game;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();
      dbg.applyRewardAndAdvance(null);
      const phaseAtInterlude = g.phase;

      dbg.resolveInterludeOption(0);
      const phaseAfterChoice = g.phase;
      const deckInstances = [...g.hand, ...g.drawPile, ...g.discardPile, ...g.exhaustPile];
      const circuitBreakCount = deckInstances.filter((instance) => instance.cardId === "circuit_break").length;

      return {
        phaseAtInterlude,
        phaseAfterChoice,
        circuitBreakCount,
      };
    });

    assert.equal(result.phaseAtInterlude, "world_map");
    assert.equal(result.phaseAfterChoice, "encounter");
    assert.ok(result.circuitBreakCount >= 1);
  } finally {
    await page.close();
  }
});

test("configured interlude can remove a targeted card for deck thinning", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const progression = window.BRASSLINE_BALANCE.progression;
      progression.sectors = [
        {
          name: "Trim A",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
        {
          name: "Trim B",
          enemies: [{ key: "rail_hound", power: 1 }],
        },
      ];
      progression.interludes = [
        {
          afterSector: 1,
          type: "shop",
          title: "Scrap Yard",
          options: [{ label: "Trim Vent", removeCard: "pressure_vent" }],
        },
      ];
      dbg.initGame();

      const g = dbg.game;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();
      dbg.applyRewardAndAdvance(null);

      const beforeDeck = [...g.interludeDeck];
      const beforeCount = beforeDeck.length;
      const beforeVentCount = beforeDeck.filter((instance) => instance.cardId === "pressure_vent").length;

      dbg.resolveInterludeOption(0);
      const afterDeck = [...g.hand, ...g.drawPile, ...g.discardPile, ...g.exhaustPile];
      const afterCount = afterDeck.length;
      const afterVentCount = afterDeck.filter((instance) => instance.cardId === "pressure_vent").length;

      return {
        phase: g.phase,
        beforeCount,
        afterCount,
        beforeVentCount,
        afterVentCount,
      };
    });

    assert.equal(result.phase, "encounter");
    assert.ok(result.beforeVentCount > 0);
    assert.equal(result.afterCount, result.beforeCount - 1);
    assert.equal(result.afterVentCount, result.beforeVentCount - 1);
  } finally {
    await page.close();
  }
});

test("interlude route choices can branch to an alternate sector", { concurrency: false }, async () => {
  const page = await openGamePage(browser);
  try {
    const result = await page.evaluate(() => {
      const dbg = window.__brasslineDebug;
      const progression = window.BRASSLINE_BALANCE.progression;
      progression.sectors = [
        { name: "Route A", enemies: [{ key: "rail_hound", power: 1 }] },
        { name: "Route B", enemies: [{ key: "rail_hound", power: 1 }] },
        { name: "Route C", enemies: [{ key: "rail_hound", power: 1 }] },
        { name: "Route D", enemies: [{ key: "rail_hound", power: 1 }] },
      ];
      progression.interludes = [
        {
          afterSector: 1,
          type: "event",
          title: "Switch Junction",
          description: "Choose which rail to take.",
          options: [
            { label: "Mainline", targetSector: 2 },
            { label: "Bypass", targetSector: 3 },
          ],
        },
      ];
      dbg.initGame();

      const g = dbg.game;
      g.enemies.forEach((enemy) => {
        enemy.alive = false;
        enemy.hp = 0;
      });
      dbg.checkEndStates();
      dbg.applyRewardAndAdvance(null);

      const phaseAtInterlude = g.phase;
      dbg.resolveInterludeOption(1);

      return {
        phaseAtInterlude,
        phaseAfterChoice: g.phase,
        sectorIndex: g.sectorIndex,
        sectorLabel: document.getElementById("sectorLabel")?.textContent || "",
      };
    });

    assert.equal(result.phaseAtInterlude, "world_map");
    assert.equal(result.phaseAfterChoice, "encounter");
    assert.equal(result.sectorIndex, 2);
    assert.match(result.sectorLabel, /sector 3\/4/i);
  } finally {
    await page.close();
  }
});
