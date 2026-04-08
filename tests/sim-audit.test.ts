export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { runCampaignSim } from "./helpers/piecemeal-sim";
import { chooseBestAction, executeAction } from "./helpers/combat-simulator";
import { getIncomingThreat, getThreatShortfall, hasChargeThreat } from "./helpers/run-progression-simulator-combat";

test("build audit: what builds does the sim produce at Act 3", () => {
  const classes = ["barbarian", "paladin", "sorceress"];

  for (const classId of classes) {
    const result = runCampaignSim({ classId, seedOffset: 0, autoWinCombat: true, throughActNumber: 3 });

    console.log(`\n  === ${classId.toUpperCase()} Build (auto-win to Act 3) ===`);
    console.log(`  Outcome: ${result.outcome} | Act ${result.finalActNumber} | Lv ${result.finalLevel} | Power ${result.finalPowerScore} | Deck ${result.finalDeckSize}`);
    for (const cp of result.powerCurve) {
      console.log(`  A${cp.actNumber}: power=${cp.powerScore} deck=${cp.deckSize} hero=${cp.heroMaxLife}hp/${cp.heroMaxEnergy}e dmg+${cp.heroDamageBonus} merc=${cp.mercAttack}atk weapon="${cp.weaponName}"`);
    }
  }
  assert.ok(true);
});

test("decision audit: AI choices turn-by-turn at Act 3 boss", () => {
  const { createAppHarness } = require("./helpers/browser-harness");

  const classes = ["barbarian", "paladin", "sorceress"];

  for (const classId of classes) {
    console.log(`\n  === ${classId.toUpperCase()} vs Act 3 Boss — Turn by Turn ===`);

    const harness = createAppHarness();
    const engine = harness.combatEngine as CombatEngineApi;
    const content = harness.content as GameContent;

    const state = engine.createCombatState({
      content,
      encounterId: "act_3_boss",
      mercenaryId: "rogue_scout",
      randomFn: () => 0.5,
    });

    const maxTurns = 6;
    const actionLimitPerTurn = 12;

    while (!state.outcome && state.turn < maxTurns) {
      if (state.phase !== "player") {
        engine.endTurn(state);
        continue;
      }

      const turnNum = state.turn;
      const incoming = getIncomingThreat(state);
      const shortfall = getThreatShortfall(state);
      const charge = hasChargeThreat(state);

      console.log(`  T${turnNum}: Hero ${state.hero.life}/${state.hero.maxLife}hp guard:${state.hero.guard} energy:${state.hero.energy} | Merc ${state.mercenary.alive ? state.mercenary.life + "hp" : "DEAD"} | Incoming:${Math.round(incoming)} shortfall:${Math.round(shortfall)}${charge ? " CHARGE" : ""}`);

      // Show hand
      const handDesc = state.hand.map((c: CardInstance) => {
        const def = content.cardCatalog[c.cardId];
        return def ? `${def.title}(${def.cost}e)` : c.cardId;
      }).join(", ");
      console.log(`    Hand: ${handDesc}`);

      // Show enemies
      for (const enemy of state.enemies.filter((e: CombatEnemyState) => e.alive)) {
        console.log(`    Enemy: ${enemy.name} ${enemy.life}/${enemy.maxLife}hp guard:${enemy.guard} [${engine.describeIntent(enemy.currentIntent)}]`);
      }

      // AI plays its turn
      let actionsTaken = 0;
      while (state.phase === "player" && !state.outcome && actionsTaken < actionLimitPerTurn) {
        const action = chooseBestAction(state, content, engine);

        // Describe the chosen action
        let desc = "";
        if (action.type === "card" && action.instanceId) {
          const card = content.cardCatalog[state.hand.find((c: CardInstance) => c.instanceId === action.instanceId)?.cardId || ""];
          desc = `CARD: ${card?.title || "?"} (${card?.cost || "?"}e)${action.targetId ? " → " + (state.enemies.find((e: CombatEnemyState) => e.id === action.targetId)?.name || action.targetId) : ""}`;
        } else if (action.type === "skill") {
          const skill = state.equippedSkills.find((s: CombatEquippedSkillState) => s.slotKey === action.slotKey);
          desc = `SKILL: ${skill?.name || action.slotKey}`;
        } else if (action.type === "melee") {
          desc = "MELEE STRIKE";
        } else if (action.type === "potion") {
          desc = `POTION → ${action.potionTarget}`;
        } else if (action.type === "end_turn") {
          desc = "END TURN";
        }
        console.log(`    → [${action.score.toFixed(1)}] ${desc}`);

        const result = executeAction(action, state, content, engine);
        actionsTaken++;
        if (!result.ok || action.type === "end_turn") {
          break;
        }
      }

      // End the turn to trigger enemy phase
      if (!state.outcome && state.phase === "player") {
        engine.endTurn(state);
      }

      // Show post-enemy-phase state
      if (!state.outcome) {
        console.log(`    After enemies: Hero ${state.hero.life}/${state.hero.maxLife}hp guard:${state.hero.guard}`);
      }
    }

    console.log(`  RESULT: ${state.outcome || "timeout"} at turn ${state.turn} | Hero ${state.hero.life}/${state.hero.maxLife}`);

    // Combat log summary
    const summary = harness.browserWindow.__ROUGE_COMBAT_LOG.summarizeCombatLog(state);
    console.log(`  Cards:${summary.cardsPlayed} Skills:${summary.skillsUsed} Potions:${summary.potionsUsed} | Defeat:${summary.defeatCause || "none"}`);
  }

  assert.ok(true);
});
