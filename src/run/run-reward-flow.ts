(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { getLevelForXp, toBonusValue } = runtimeWindow.ROUGE_RUN_STATE;
  const { getCurrentAct, getZoneById, recomputeZoneStatuses, syncCurrentActFields } = runtimeWindow.ROUGE_RUN_ROUTE_BUILDER;
  const { syncLevelProgression } = runtimeWindow.ROUGE_RUN_PROGRESSION;

  function hasTownFeature(profile, featureId) {
    return Array.isArray(profile?.meta?.unlocks?.townFeatureIds) && profile.meta.unlocks.townFeatureIds.includes(featureId);
  }

  function scaleEncounterRewardGrants(grants, profile) {
    if (!hasTownFeature(profile, "economy_ledger")) {
      return { ...grants };
    }

    return {
      ...grants,
      gold: Math.max(0, Math.ceil((Number.parseInt(String(grants?.gold || 0), 10) || 0) * 1.25)),
    };
  }

  function buildEncounterReward({ run, zone, combatState, content, profile = null }) {
    const currentAct = getCurrentAct(run);
    const nextEncounterNumber = zone.encountersCleared + 1;
    const clearsZone = nextEncounterNumber >= zone.encounterTotal;
    const actScale = currentAct?.actNumber || 1;
    const rewardEngine = runtimeWindow.ROUGE_REWARD_ENGINE;

    const rewardByKind = {
      battle: { gold: 10 + actScale * 4, xp: 6 + actScale * 3, potions: 0 },
      miniboss: { gold: 16 + actScale * 6, xp: 10 + actScale * 4, potions: 1 },
      boss: { gold: 28 + actScale * 10, xp: 18 + actScale * 6, potions: 1 },
    };

    const grants = scaleEncounterRewardGrants(rewardByKind[zone.kind] || rewardByKind.battle, profile);
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
    if (zone.kind === "boss") {
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
      title: zone.kind === "boss" ? `${currentAct.boss.name} Defeated` : `${zone.title} Cleared`,
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
      endsAct: zone.kind === "boss",
      endsRun: zone.kind === "boss" && run.currentActIndex >= run.acts.length - 1,
      heroLifeAfterFight: combatState.hero.life,
      mercenaryLifeAfterFight: combatState.mercenary.life,
    };
  }

  function applyReward(run, reward, choiceId, content) {
    const zone = getZoneById(run, reward.zoneId);
    if (!zone) {
      return { ok: false, message: "Reward zone no longer exists." };
    }

    const rewardEngine = runtimeWindow.ROUGE_REWARD_ENGINE;
    const choice = reward.choices.find((entry) => entry.id === choiceId) || reward.choices[0] || null;
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

    const goldGain = Number.parseInt(reward.grants?.gold, 10) || 0;
    const xpGain = Number.parseInt(reward.grants?.xp, 10) || 0;
    const potionGain = Number.parseInt(reward.grants?.potions, 10) || 0;
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
      if (zone.kind === "boss") {
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

  function actIsComplete(run) {
    return Boolean(getCurrentAct(run)?.complete);
  }

  function runIsComplete(run) {
    return actIsComplete(run) && run.currentActIndex >= run.acts.length - 1;
  }

  function advanceToNextAct(run, content) {
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
