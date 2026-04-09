export {};

import {
  applyClassStrategy,
  getPolicyDefinitions,
  hashString,
} from "./run-progression-simulator-core";
import {
  createQuietAppHarness,
  createSimulationState,
  runProgressionPolicyFromState,
} from "./run-progression-simulator";
import {
  createBalanceSnapshotTokenFromState,
  restoreBalanceSnapshotToken,
} from "./balance-orchestration";
import {
  chooseBestAction,
  executeAction,
} from "./combat-simulator";
import {
  getIncomingThreat,
  getThreatShortfall,
} from "./run-progression-simulator-combat";

export interface BuildSnapshot {
  classId: string;
  className: string;
  actNumber: number;
  level: number;
  deck: string[];
  hero: {
    maxLife: number;
    maxEnergy: number;
    handSize: number;
    potionHeal: number;
    damageBonus: number;
    guardBonus: number;
    burnBonus: number;
  };
  mercenary: {
    name: string;
    maxLife: number;
    attack: number;
  };
  weapon: { itemId: string; name: string; family: string } | null;
  armor: { itemId: string; name: string } | null;
  potions: number;
  gold: number;
  skills: {
    slot1: string;
    slot2: string;
    slot3: string;
  };
  favoredTree: string;
  treeRanks: Record<string, number>;
  token: string;
}

export interface CombatTestResult {
  encounterId: string;
  encounterName: string;
  outcome: string;
  turns: number;
  heroLifePct: number;
  mercAlive: boolean;
  defeatCause: string | null;
  decisions: Array<{
    turn: number;
    action: string;
    score: number;
    heroHp: number;
    heroGuard: number;
    incoming: number;
  }>;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function generateBuildSnapshots(options: {
  classId: string;
  policyId?: string;
  seedOffset?: number;
  throughActNumber?: number;
}): BuildSnapshot[] {
  const classId = options.classId;
  const throughActNumber = clamp(options.throughActNumber || 5, 1, 5);
  const seedOffset = Math.max(0, options.seedOffset || 0);
  const basePolicy = getPolicyDefinitions([options.policyId || "aggressive"])[0];
  const policy = applyClassStrategy(basePolicy, classId);
  const seed = hashString([classId, policy.id, String(throughActNumber), String(seedOffset)].join("|"));

  const harness = createQuietAppHarness();
  const state = createSimulationState(harness, classId, seed);
  const snapshots: BuildSnapshot[] = [];

  const report = runProgressionPolicyFromState(
    harness, state, classId, policy, throughActNumber, 0, 36, seedOffset, undefined,
    {
      autoWinCombat: true,
      onCheckpoint: (payload) => {
        const run = payload.state.run;
        if (!run) { return; }

        const tokenRef = createBalanceSnapshotTokenFromState(payload.harness, payload.state, {
          captureKind: "checkpoint",
          label: `${classId} act ${run.actNumber} checkpoint`,
          checkpointId: `act_${run.actNumber}_safe_zone`,
          policyId: policy.id,
          throughActNumber,
          maxCombatTurns: 36,
          seedOffset,
        });

        const overrides = harness.runFactory.createCombatOverrides(run, harness.content, null);
        const weaponEquip = run.loadout.weapon;
        const weaponItem = weaponEquip ? harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, weaponEquip.itemId) : null;
        const armorEquip = run.loadout.armor;
        const armorItem = armorEquip ? harness.browserWindow.ROUGE_ITEM_CATALOG.getItemDefinition(harness.content, armorEquip.itemId) : null;

        snapshots.push({
          classId,
          className: run.className,
          actNumber: run.actNumber,
          level: run.level,
          deck: [...run.deck],
          hero: {
            maxLife: overrides.heroState.maxLife,
            maxEnergy: overrides.heroState.maxEnergy,
            handSize: overrides.heroState.handSize,
            potionHeal: overrides.heroState.potionHeal,
            damageBonus: Number(overrides.heroState.damageBonus || 0),
            guardBonus: Number(overrides.heroState.guardBonus || 0),
            burnBonus: Number(overrides.heroState.burnBonus || 0),
          },
          mercenary: {
            name: overrides.mercenaryState.name,
            maxLife: overrides.mercenaryState.maxLife,
            attack: overrides.mercenaryState.attack,
          },
          weapon: weaponItem ? { itemId: weaponEquip!.itemId, name: weaponItem.name, family: weaponItem.family || "" } : null,
          armor: armorItem ? { itemId: armorEquip!.itemId, name: armorItem.name } : null,
          potions: run.belt.current,
          gold: run.gold,
          skills: {
            slot1: run.progression?.classProgression?.equippedSkillBar?.slot1SkillId || "",
            slot2: run.progression?.classProgression?.equippedSkillBar?.slot2SkillId || "",
            slot3: run.progression?.classProgression?.equippedSkillBar?.slot3SkillId || "",
          },
          favoredTree: run.progression?.classProgression?.favoredTreeId || "",
          treeRanks: { ...(run.progression?.classProgression?.treeRanks || {}) },
          token: tokenRef.token,
        });
      },
    }
  );

  return snapshots;
}

export function editBuildSnapshot(snapshot: BuildSnapshot, edits: {
  addCards?: string[];
  removeCards?: string[];
  setWeapon?: string;
  setArmor?: string;
  setHero?: Partial<BuildSnapshot["hero"]>;
  setMercenary?: Partial<BuildSnapshot["mercenary"]>;
  setPotions?: number;
  setSkills?: Partial<BuildSnapshot["skills"]>;
}): BuildSnapshot {
  const edited = { ...snapshot, deck: [...snapshot.deck], hero: { ...snapshot.hero }, mercenary: { ...snapshot.mercenary }, skills: { ...snapshot.skills } };

  if (edits.removeCards) {
    for (const cardId of edits.removeCards) {
      const idx = edited.deck.indexOf(cardId);
      if (idx >= 0) { edited.deck.splice(idx, 1); }
    }
  }
  if (edits.addCards) {
    edited.deck.push(...edits.addCards);
  }
  if (edits.setHero) {
    Object.assign(edited.hero, edits.setHero);
  }
  if (edits.setMercenary) {
    Object.assign(edited.mercenary, edits.setMercenary);
  }
  if (edits.setPotions !== undefined) {
    edited.potions = edits.setPotions;
  }
  if (edits.setSkills) {
    Object.assign(edited.skills, edits.setSkills);
  }
  return edited;
}

export function testBuildAgainstEncounter(snapshot: BuildSnapshot, encounterId: string, runs = 3): CombatTestResult[] {
  const results: CombatTestResult[] = [];

  for (let i = 0; i < runs; i++) {
    const harness = createQuietAppHarness();
    const engine = harness.combatEngine as CombatEngineApi;
    const content = harness.content as GameContent;

    const classPreferredFamilies = harness.classRegistry.getPreferredWeaponFamilies(snapshot.classId) || [];
    const weaponProfile = snapshot.weapon
      ? harness.browserWindow.ROUGE_ITEM_CATALOG.buildEquipmentWeaponProfile(
          { itemId: snapshot.weapon.itemId } as RunEquipmentState,
          content
        )
      : null;
    const armorProfile = snapshot.armor
      ? harness.itemSystem.buildCombatMitigationProfile(
          { loadout: { weapon: snapshot.weapon ? { itemId: snapshot.weapon.itemId } : null, armor: snapshot.armor ? { itemId: snapshot.armor.itemId } : null } } as unknown as RunState,
          content
        )
      : null;

    const equippedSkills: CombatSkillLoadoutEntry[] = [];
    const classProgression = harness.classRegistry.getClassProgression(content, snapshot.classId);
    if (classProgression) {
      for (const slotKey of ["slot1", "slot2", "slot3"] as const) {
        const skillId = snapshot.skills[slotKey];
        if (!skillId) { continue; }
        const trees = (classProgression as unknown as { trees?: Array<{ skills?: Array<{ id: string }> }> }).trees || [];
        const skill = trees.flatMap((t) => t.skills || []).find((s) => s.id === skillId);
        if (skill) {
          equippedSkills.push({ slotKey, skill } as CombatSkillLoadoutEntry);
        }
      }
    }

    const seed = hashString([snapshot.classId, encounterId, String(i)].join("|"));
    let rngState = (seed >>> 0) || 1;
    const randomFn = () => { rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0; return rngState / 0x100000000; };

    const state = engine.createCombatState({
      content,
      encounterId,
      mercenaryId: "rogue_scout",
      randomFn,
      heroState: {
        maxLife: snapshot.hero.maxLife,
        maxEnergy: snapshot.hero.maxEnergy,
        handSize: snapshot.hero.handSize,
        potionHeal: snapshot.hero.potionHeal,
        damageBonus: snapshot.hero.damageBonus,
        guardBonus: snapshot.hero.guardBonus,
        burnBonus: snapshot.hero.burnBonus,
      },
      mercenaryState: {
        maxLife: snapshot.mercenary.maxLife,
        attack: snapshot.mercenary.attack,
      },
      starterDeck: snapshot.deck,
      initialPotions: snapshot.potions,
      weaponFamily: snapshot.weapon?.family,
      weaponName: snapshot.weapon?.name,
      weaponDamageBonus: (weaponProfile as unknown as { meleeDamageBonus?: number })?.meleeDamageBonus || Number((weaponProfile as unknown as { damageBonus?: number })?.damageBonus || 0),
      weaponProfile: weaponProfile || null,
      armorProfile: armorProfile || null,
      classPreferredFamilies,
      equippedSkills: equippedSkills.length > 0 ? equippedSkills : null,
    });

    const encounter = content.encounterCatalog[encounterId];
    const decisions: CombatTestResult["decisions"] = [];
    const maxTurns = 36;
    const actionLimit = 12;

    while (!state.outcome && state.turn < maxTurns) {
      if (state.phase !== "player") {
        engine.endTurn(state);
        continue;
      }

      let actionsTaken = 0;
      while (state.phase === "player" && !state.outcome && actionsTaken < actionLimit) {
        const action = chooseBestAction(state, content, engine);
        const incoming = getIncomingThreat(state);

        let desc: string = action.type;
        if (action.type === "card" && action.instanceId) {
          const card = content.cardCatalog[state.hand.find((c: CardInstance) => c.instanceId === action.instanceId)?.cardId || ""];
          desc = card?.title || "card";
        } else if (action.type === "skill" && action.slotKey) {
          const skill = state.equippedSkills.find((s: CombatEquippedSkillState) => s.slotKey === action.slotKey);
          desc = skill?.name || String(action.slotKey);
        }

        decisions.push({
          turn: state.turn,
          action: desc,
          score: Number(action.score) || 0,
          heroHp: state.hero.life,
          heroGuard: state.hero.guard,
          incoming: Math.round(incoming),
        });

        const result = executeAction(action, state, content, engine);
        actionsTaken++;
        if (!result.ok || action.type === "end_turn") { break; }
      }

      if (!state.outcome && state.phase === "player") {
        engine.endTurn(state);
      }
    }

    const logSummary = harness.browserWindow.__ROUGE_COMBAT_LOG.summarizeCombatLog(state);

    results.push({
      encounterId,
      encounterName: encounter?.name || encounterId,
      outcome: state.outcome || "timeout",
      turns: state.turn,
      heroLifePct: state.hero.maxLife > 0 ? Math.round(state.hero.life / state.hero.maxLife * 100) : 0,
      mercAlive: state.mercenary.alive,
      defeatCause: logSummary.defeatCause,
      decisions,
    });
  }

  return results;
}

export function printBuildSnapshot(snapshot: BuildSnapshot) {
  console.log(`  ${snapshot.className} Act ${snapshot.actNumber} Lv${snapshot.level}`);
  console.log(`  Hero: ${snapshot.hero.maxLife}hp ${snapshot.hero.maxEnergy}e dmg+${snapshot.hero.damageBonus} guard+${snapshot.hero.guardBonus} burn+${snapshot.hero.burnBonus}`);
  console.log(`  Merc: ${snapshot.mercenary.name} ${snapshot.mercenary.maxLife}hp ${snapshot.mercenary.attack}atk`);
  console.log(`  Weapon: ${snapshot.weapon?.name || "none"} (${snapshot.weapon?.family || "-"})`);
  console.log(`  Deck (${snapshot.deck.length}): ${snapshot.deck.slice(0, 8).join(", ")}${snapshot.deck.length > 8 ? "..." : ""}`);
  console.log(`  Skills: ${snapshot.skills.slot1 || "-"} / ${snapshot.skills.slot2 || "-"} / ${snapshot.skills.slot3 || "-"}`);
  console.log(`  Tree: ${snapshot.favoredTree} ranks: ${JSON.stringify(snapshot.treeRanks)}`);
  console.log(`  Potions: ${snapshot.potions} Gold: ${snapshot.gold}`);
}

export function printCombatResult(result: CombatTestResult) {
  console.log(`  vs ${result.encounterName}: ${result.outcome} in ${result.turns}t | hero ${result.heroLifePct}% | merc ${result.mercAlive ? "alive" : "dead"}${result.defeatCause ? " | cause:" + result.defeatCause : ""}`);
}
