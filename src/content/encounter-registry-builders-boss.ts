(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { MODIFIER_KIND } = runtimeWindow.ROUGE_COMBAT_MODIFIERS;

  function buildCovenantBossConfig(actNumber: number, templateIds: Record<string, string>) {
    const bossScreenValue = Math.max(2, Math.min(4, actNumber));
    if (actNumber === 2) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.brute, templateIds.support],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.PHALANX_MARCH, value: Math.max(3, actNumber) },
          { kind: MODIFIER_KIND.LINEBREAKER_CHARGE, value: Math.max(1, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    if (actNumber === 3) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.eliteC, templateIds.support],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.TRIAGE_SCREEN, value: Math.max(2, Math.min(4, actNumber + 1)) },
          { kind: MODIFIER_KIND.RITUAL_CADENCE, value: Math.max(1, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    if (actNumber === 4) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.ESCORT_BULWARK, value: 1 },
          { kind: MODIFIER_KIND.WAR_DRUMS, value: 1 },
        ],
      };
    }
    if (actNumber >= 5) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.PHALANX_MARCH, value: Math.max(3, actNumber) },
          { kind: MODIFIER_KIND.RITUAL_CADENCE, value: Math.max(1, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    return {
      enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteB, templateIds.ranged],
      modifiers: [
        { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
        { kind: MODIFIER_KIND.SNIPER_NEST, value: Math.max(2, actNumber) },
      ],
    };
  }

  function buildAftermathBossConfig(actNumber: number, templateIds: Record<string, string>) {
    const bossScreenValue = Math.max(4, Math.min(6, actNumber + 2));
    if (actNumber === 2) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteC, templateIds.brute],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.LINEBREAKER_CHARGE, value: Math.max(2, Math.min(3, actNumber)) },
          { kind: MODIFIER_KIND.PHALANX_MARCH, value: Math.max(3, actNumber + 1) },
        ],
      };
    }
    if (actNumber === 3) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.eliteD, templateIds.support],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.RITUAL_CADENCE, value: Math.max(2, Math.min(3, actNumber - 1)) },
          { kind: MODIFIER_KIND.TRIAGE_SCREEN, value: Math.max(2, Math.min(4, actNumber + 1)) },
        ],
      };
    }
    if (actNumber === 4) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: 5 },
          { kind: MODIFIER_KIND.ESCORT_ROTATION, value: 1 },
        ],
      };
    }
    if (actNumber >= 5) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.PHALANX_MARCH, value: Math.max(4, actNumber) },
          { kind: MODIFIER_KIND.RITUAL_CADENCE, value: Math.max(2, Math.min(3, actNumber - 1)) },
          { kind: MODIFIER_KIND.LINEBREAKER_CHARGE, value: Math.max(2, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    return {
      enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteB, templateIds.ranged],
      modifiers: [
        { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
        { kind: MODIFIER_KIND.SNIPER_NEST, value: Math.max(3, actNumber + 1) },
        { kind: MODIFIER_KIND.LINEBREAKER_CHARGE, value: 1 },
      ],
    };
  }

  function buildDrilledAftermathBossConfig(actNumber: number, templateIds: Record<string, string>) {
    const bossScreenValue = Math.max(4, Math.min(6, actNumber + 2));
    const escortBulwarkValue = actNumber === 4 ? Math.max(4, actNumber) : Math.max(4, actNumber + 1);
    const escortRotationValue = actNumber === 4 ? Math.max(2, Math.min(3, actNumber)) : Math.max(2, Math.min(4, actNumber + 1));
    const bossOnslaughtValue = actNumber === 4 ? Math.max(2, Math.min(3, actNumber)) : Math.max(2, Math.min(4, actNumber + 1));
    if (actNumber === 2) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.brute, templateIds.support],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.ESCORT_BULWARK, value: escortBulwarkValue },
          { kind: MODIFIER_KIND.ESCORT_ROTATION, value: escortRotationValue },
          { kind: MODIFIER_KIND.BOSS_ONSLAUGHT, value: bossOnslaughtValue },
          { kind: MODIFIER_KIND.PHALANX_MARCH, value: Math.max(3, actNumber) },
          { kind: MODIFIER_KIND.WAR_DRUMS, value: 1 },
        ],
      };
    }
    if (actNumber === 3) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.ranged, templateIds.support],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.ESCORT_BULWARK, value: escortBulwarkValue },
          { kind: MODIFIER_KIND.ESCORT_ROTATION, value: escortRotationValue },
          { kind: MODIFIER_KIND.BOSS_ONSLAUGHT, value: bossOnslaughtValue },
          { kind: MODIFIER_KIND.SNIPER_NEST, value: Math.max(3, actNumber) },
          { kind: MODIFIER_KIND.RITUAL_CADENCE, value: Math.max(2, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    if (actNumber === 4) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: 5 },
          { kind: MODIFIER_KIND.ESCORT_BULWARK, value: 1 },
          { kind: MODIFIER_KIND.ESCORT_ROTATION, value: 1 },
        ],
      };
    }
    if (actNumber >= 5) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.ESCORT_BULWARK, value: escortBulwarkValue },
          { kind: MODIFIER_KIND.ESCORT_ROTATION, value: escortRotationValue },
          { kind: MODIFIER_KIND.BOSS_ONSLAUGHT, value: bossOnslaughtValue },
          { kind: MODIFIER_KIND.PHALANX_MARCH, value: Math.max(4, actNumber) },
          { kind: MODIFIER_KIND.WAR_DRUMS, value: 1 },
        ],
      };
    }
    return {
      enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.brute, templateIds.support],
      modifiers: [
        { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
        { kind: MODIFIER_KIND.ESCORT_BULWARK, value: escortBulwarkValue },
        { kind: MODIFIER_KIND.ESCORT_ROTATION, value: escortRotationValue },
        { kind: MODIFIER_KIND.BOSS_ONSLAUGHT, value: bossOnslaughtValue },
        { kind: MODIFIER_KIND.PHALANX_MARCH, value: Math.max(3, actNumber) },
      ],
    };
  }

  function buildMobilizedAftermathBossConfig(actNumber: number, templateIds: Record<string, string>) {
    const drilledConfig = buildDrilledAftermathBossConfig(actNumber, templateIds);
    if (actNumber === 4) {
      return {
        enemyTemplateIds: [...drilledConfig.enemyTemplateIds],
        modifiers: [
          ...drilledConfig.modifiers,
          { kind: MODIFIER_KIND.COURT_RESERVES, value: 2 },
        ],
      };
    }
    return {
      enemyTemplateIds: [...drilledConfig.enemyTemplateIds],
      modifiers: [
        ...drilledConfig.modifiers,
        { kind: MODIFIER_KIND.COURT_RESERVES, value: Math.max(2, Math.min(4, actNumber + 1)) },
        { kind: MODIFIER_KIND.BOSS_SALVO, value: Math.max(2, Math.min(4, actNumber + 1)) },
      ],
    };
  }

  function buildPostedAftermathBossConfig(actNumber: number, templateIds: Record<string, string>) {
    const bossScreenValue = Math.max(4, Math.min(6, actNumber + 2));
    const escortRotationValue = actNumber === 4 ? Math.max(2, Math.min(3, actNumber)) : Math.max(2, Math.min(4, actNumber + 1));
    const bossOnslaughtValue = actNumber === 4 ? Math.max(2, Math.min(3, actNumber)) : Math.max(2, Math.min(4, actNumber + 1));
    if (actNumber === 2) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.brute, templateIds.support],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.ESCORT_ROTATION, value: escortRotationValue },
          { kind: MODIFIER_KIND.TRIAGE_SCREEN, value: Math.max(2, Math.min(4, actNumber + 1)) },
          { kind: MODIFIER_KIND.BOSS_ONSLAUGHT, value: bossOnslaughtValue },
          { kind: MODIFIER_KIND.PHALANX_MARCH, value: Math.max(3, actNumber) },
        ],
      };
    }
    if (actNumber === 3) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.ranged, templateIds.support],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.ESCORT_ROTATION, value: escortRotationValue },
          { kind: MODIFIER_KIND.TRIAGE_SCREEN, value: Math.max(2, Math.min(4, actNumber + 1)) },
          { kind: MODIFIER_KIND.BOSS_ONSLAUGHT, value: bossOnslaughtValue },
          { kind: MODIFIER_KIND.RITUAL_CADENCE, value: Math.max(2, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    if (actNumber === 4) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: 5 },
          { kind: MODIFIER_KIND.ESCORT_BULWARK, value: 2 },
          { kind: MODIFIER_KIND.ESCORT_ROTATION, value: 1 },
        ],
      };
    }
    if (actNumber >= 5) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
          { kind: MODIFIER_KIND.ESCORT_BULWARK, value: Math.max(4, actNumber + 1) },
          { kind: MODIFIER_KIND.ESCORT_ROTATION, value: escortRotationValue },
          { kind: MODIFIER_KIND.BOSS_ONSLAUGHT, value: bossOnslaughtValue },
          { kind: MODIFIER_KIND.PHALANX_MARCH, value: Math.max(4, actNumber) },
        ],
      };
    }
    return {
      enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.brute, templateIds.support],
      modifiers: [
        { kind: MODIFIER_KIND.BOSS_SCREEN, value: bossScreenValue },
        { kind: MODIFIER_KIND.ESCORT_ROTATION, value: escortRotationValue },
        { kind: MODIFIER_KIND.TRIAGE_SCREEN, value: Math.max(2, Math.min(4, actNumber + 1)) },
        { kind: MODIFIER_KIND.BOSS_ONSLAUGHT, value: bossOnslaughtValue },
      ],
    };
  }

  runtimeWindow.__ROUGE_ENCOUNTER_REGISTRY_BUILDERS_BOSS = {
    buildCovenantBossConfig,
    buildAftermathBossConfig,
    buildDrilledAftermathBossConfig,
    buildMobilizedAftermathBossConfig,
    buildPostedAftermathBossConfig,
  };
})();
