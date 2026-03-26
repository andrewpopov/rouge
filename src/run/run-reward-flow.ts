(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;
  const { getLevelForXp, toBonusValue } = runtimeWindow.ROUGE_RUN_STATE;
  const { getCurrentAct, getZoneById, recomputeZoneStatuses, syncCurrentActFields } = runtimeWindow.ROUGE_RUN_ROUTE_BUILDER;
  const { syncLevelProgression } = runtimeWindow.ROUGE_RUN_PROGRESSION;

  // --- Encounter reward scaling ---
  const BATTLE_BASE_GOLD = 10;
  const BATTLE_GOLD_PER_ACT = 4;
  const BATTLE_BASE_XP = 5;
  const BATTLE_XP_PER_ACT = 2;

  const MINIBOSS_BASE_GOLD = 16;
  const MINIBOSS_GOLD_PER_ACT = 6;
  const MINIBOSS_BASE_XP = 8;
  const MINIBOSS_XP_PER_ACT = 3;
  const MINIBOSS_POTION_CHARGES = 1;

  const BOSS_BASE_GOLD = 28;
  const BOSS_GOLD_PER_ACT = 10;
  const BOSS_BASE_XP = 14;
  const BOSS_XP_PER_ACT = 4;
  const BOSS_POTION_CHARGES = 1;

  const ECONOMY_LEDGER_GOLD_MULTIPLIER = 1.25;

  const { hasTownFeature, toNumber } = runtimeWindow.ROUGE_UTILS;

  function scaleEncounterRewardGrants(grants: RewardGrants, profile: ProfileState | null | undefined) {
    if (!hasTownFeature(profile, "economy_ledger")) {
      return { ...grants };
    }

    return {
      ...grants,
      gold: Math.max(0, Math.ceil(toNumber(grants?.gold, 0) * ECONOMY_LEDGER_GOLD_MULTIPLIER)),
    };
  }

  function buildEncounterReward({ run, zone, combatState, content, profile = null }: { run: RunState; zone: ZoneState; combatState: CombatState; content: GameContent; profile?: ProfileState | null }) {
    const currentAct = getCurrentAct(run);
    const nextEncounterNumber = zone.encountersCleared + 1;
    const clearsZone = nextEncounterNumber >= zone.encounterTotal;
    const actScale = currentAct?.actNumber || 1;
    const rewardEngine = runtimeWindow.ROUGE_REWARD_ENGINE;

    const rewardByKind = {
      battle: { gold: BATTLE_BASE_GOLD + actScale * BATTLE_GOLD_PER_ACT, xp: BATTLE_BASE_XP + actScale * BATTLE_XP_PER_ACT, potions: 0 },
      miniboss: { gold: MINIBOSS_BASE_GOLD + actScale * MINIBOSS_GOLD_PER_ACT, xp: MINIBOSS_BASE_XP + actScale * MINIBOSS_XP_PER_ACT, potions: MINIBOSS_POTION_CHARGES },
      boss: { gold: BOSS_BASE_GOLD + actScale * BOSS_GOLD_PER_ACT, xp: BOSS_BASE_XP + actScale * BOSS_XP_PER_ACT, potions: BOSS_POTION_CHARGES },
    };

    const grants = scaleEncounterRewardGrants((rewardByKind as Record<string, RewardGrants>)[zone.kind] || rewardByKind.battle, profile);
    const lines = [`+${grants.gold} gold`, `+${grants.xp} experience`];

    if (grants.potions > 0) {
      lines.push(`+${grants.potions} potion charge`);
    }
    if (hasTownFeature(profile, "economy_ledger")) {
      lines.push("Economy Ledger dividend is active on this encounter payout.");
    }
    lines.push("Choose one reward to shape the run.");
    if (clearsZone) {
      lines.push(`${zone.title} is now clear.`);
    } else {
      lines.push(`${zone.title} progress: ${nextEncounterNumber}/${zone.encounterTotal} encounters cleared.`);
    }
    if (zone.kind === ZONE_KIND.BOSS) {
      lines.push(`${currentAct.title} is complete.`);
      if (run.currentActIndex < run.acts.length - 1) {
        const nextAct = run.acts[run.currentActIndex + 1];
        lines.push(`Next stop: ${nextAct.town}.`);
      } else {
        lines.push("The final act boss is down. The run is complete.");
      }
    }

    return {
      zoneId: zone.id,
      zoneTitle: zone.title,
      kind: zone.kind,
      title: zone.kind === ZONE_KIND.BOSS ? `${currentAct.boss.name} Defeated` : `${zone.title} Cleared`,
      lines,
      grants,
      choices: rewardEngine.buildRewardChoices({
        content,
        run,
        zone,
        actNumber: actScale,
        encounterNumber: nextEncounterNumber,
        profile,
      }),
      encounterNumber: nextEncounterNumber,
      clearsZone,
      endsAct: zone.kind === ZONE_KIND.BOSS,
      endsRun: zone.kind === ZONE_KIND.BOSS && run.currentActIndex >= run.acts.length - 1,
      heroLifeAfterFight: combatState.hero.life,
      mercenaryLifeAfterFight: combatState.mercenary.life,
    };
  }

  function applyReward(run: RunState, reward: RunReward, choiceId: string, content: GameContent) {
    const zone = getZoneById(run, reward.zoneId);
    if (!zone) {
      return { ok: false, message: "Reward zone no longer exists." };
    }

    const rewardEngine = runtimeWindow.ROUGE_REWARD_ENGINE;
    const choice = reward.choices.find((entry: RewardChoice) => entry.id === choiceId) || reward.choices[0] || null;
    if (!choice) {
      return { ok: false, message: "Reward choice is missing." };
    }

    if (runtimeWindow.ROUGE_WORLD_NODES?.isWorldNodeZone(zone)) {
      const nodeResult = runtimeWindow.ROUGE_WORLD_NODES.applyChoice(run, reward, choice);
      if (!nodeResult.ok) {
        return nodeResult;
      }
    }

    const choiceResult = rewardEngine.applyChoice(run, choice, content);
    if (!choiceResult.ok) {
      return choiceResult;
    }

    const goldGain = toNumber(reward.grants?.gold, 0);
    const xpGain = toNumber(reward.grants?.xp, 0);
    const potionGain = toNumber(reward.grants?.potions, 0);
    const previousLevel = run.level;
    run.gold += goldGain;
    run.xp += xpGain;
    run.level = getLevelForXp(run.xp);
    run.summary.goldGained += goldGain;
    run.summary.xpGained += xpGain;
    run.summary.levelsGained += Math.max(0, run.level - previousLevel);
    syncLevelProgression(run);
    if (!runtimeWindow.ROUGE_WORLD_NODES?.isWorldNodeZone(zone)) {
      run.summary.encountersCleared += 1;
    }

    run.belt.current = Math.min(run.belt.max, run.belt.current + potionGain);

    zone.encountersCleared += 1;
    if (zone.encountersCleared >= zone.encounterTotal) {
      zone.cleared = true;
      run.summary.zonesCleared += 1;
      if (zone.kind === ZONE_KIND.BOSS) {
        const currentAct = getCurrentAct(run);
        if (currentAct && !currentAct.complete) {
          currentAct.complete = true;
          run.summary.actsCleared += 1;
          run.summary.bossesDefeated += 1;
          if (currentAct.boss?.id && !run.progression.bossTrophies.includes(currentAct.boss.id)) {
            run.progression.bossTrophies.push(currentAct.boss.id);
          }
        }
      }
    }

    run.activeZoneId = "";
    run.activeEncounterId = "";
    recomputeZoneStatuses(run);
    return { ok: true };
  }

  function actIsComplete(run: RunState) {
    return Boolean(getCurrentAct(run)?.complete);
  }

  function runIsComplete(run: RunState) {
    return actIsComplete(run) && run.currentActIndex >= run.acts.length - 1;
  }

  function advanceToNextAct(run: RunState, content: GameContent) {
    if (!actIsComplete(run) || run.currentActIndex >= run.acts.length - 1) {
      return false;
    }

    const bonuses = runtimeWindow.ROUGE_RUN_FACTORY?.buildCombatBonuses?.(run, content) || {};
    run.currentActIndex += 1;
    syncCurrentActFields(run);
    run.hero.currentLife = run.hero.maxLife + toBonusValue(bonuses.heroMaxLife);
    run.mercenary.currentLife = run.mercenary.maxLife + toBonusValue(bonuses.mercenaryMaxLife);
    run.belt.current = run.belt.max;
    run.activeZoneId = "";
    run.activeEncounterId = "";
    recomputeZoneStatuses(run);
    return true;
  }

  runtimeWindow.ROUGE_RUN_REWARD_FLOW = {
    buildEncounterReward,
    applyReward,
    actIsComplete,
    runIsComplete,
    advanceToNextAct,
  };
})();
