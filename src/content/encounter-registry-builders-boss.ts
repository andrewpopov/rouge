(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function buildCovenantBossConfig(actNumber, templateIds) {
    const bossScreenValue = Math.max(2, Math.min(4, actNumber));
    if (actNumber === 2) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.brute, templateIds.support],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "phalanx_march", value: Math.max(3, actNumber) },
          { kind: "linebreaker_charge", value: Math.max(1, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    if (actNumber === 3) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.eliteC, templateIds.support],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "triage_screen", value: Math.max(2, Math.min(4, actNumber + 1)) },
          { kind: "ritual_cadence", value: Math.max(1, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    if (actNumber === 4) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteC, templateIds.eliteD],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "elite_onslaught", value: 1 },
          { kind: "war_drums", value: 1 },
          { kind: "linebreaker_charge", value: Math.max(1, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    if (actNumber >= 5) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "phalanx_march", value: Math.max(3, actNumber) },
          { kind: "ritual_cadence", value: Math.max(1, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    return {
      enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteB, templateIds.ranged],
      modifiers: [
        { kind: "boss_screen", value: bossScreenValue },
        { kind: "sniper_nest", value: Math.max(2, actNumber) },
      ],
    };
  }

  function buildAftermathBossConfig(actNumber, templateIds) {
    const bossScreenValue = Math.max(3, Math.min(5, actNumber + 1));
    if (actNumber === 2) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteC, templateIds.brute],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "linebreaker_charge", value: Math.max(2, Math.min(3, actNumber)) },
          { kind: "phalanx_march", value: Math.max(3, actNumber + 1) },
        ],
      };
    }
    if (actNumber === 3) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.eliteD, templateIds.support],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "ritual_cadence", value: Math.max(2, Math.min(3, actNumber - 1)) },
          { kind: "triage_screen", value: Math.max(2, Math.min(4, actNumber + 1)) },
        ],
      };
    }
    if (actNumber === 4) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteC, templateIds.eliteD],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "elite_onslaught", value: 1 },
          { kind: "linebreaker_charge", value: Math.max(2, Math.min(3, actNumber - 1)) },
          { kind: "war_drums", value: 1 },
        ],
      };
    }
    if (actNumber >= 5) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "phalanx_march", value: Math.max(4, actNumber) },
          { kind: "ritual_cadence", value: Math.max(2, Math.min(3, actNumber - 1)) },
          { kind: "linebreaker_charge", value: Math.max(2, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    return {
      enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteB, templateIds.ranged],
      modifiers: [
        { kind: "boss_screen", value: bossScreenValue },
        { kind: "sniper_nest", value: Math.max(3, actNumber + 1) },
        { kind: "linebreaker_charge", value: 1 },
      ],
    };
  }

  function buildDrilledAftermathBossConfig(actNumber, templateIds) {
    const bossScreenValue = Math.max(3, Math.min(5, actNumber + 1));
    const escortBulwarkValue = Math.max(4, actNumber + 1);
    const escortRotationValue = Math.max(2, Math.min(4, actNumber + 1));
    const bossOnslaughtValue = Math.max(2, Math.min(4, actNumber + 1));
    if (actNumber === 2) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.brute, templateIds.support],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "escort_bulwark", value: escortBulwarkValue },
          { kind: "escort_rotation", value: escortRotationValue },
          { kind: "boss_onslaught", value: bossOnslaughtValue },
          { kind: "phalanx_march", value: Math.max(3, actNumber) },
          { kind: "war_drums", value: 1 },
        ],
      };
    }
    if (actNumber === 3) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.ranged, templateIds.support],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "escort_bulwark", value: escortBulwarkValue },
          { kind: "escort_rotation", value: escortRotationValue },
          { kind: "boss_onslaught", value: bossOnslaughtValue },
          { kind: "sniper_nest", value: Math.max(3, actNumber) },
          { kind: "ritual_cadence", value: Math.max(2, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    if (actNumber === 4) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "escort_bulwark", value: escortBulwarkValue },
          { kind: "escort_rotation", value: escortRotationValue },
          { kind: "boss_onslaught", value: bossOnslaughtValue },
          { kind: "phalanx_march", value: Math.max(4, actNumber) },
          { kind: "war_drums", value: 1 },
        ],
      };
    }
    if (actNumber >= 5) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "escort_bulwark", value: escortBulwarkValue },
          { kind: "escort_rotation", value: escortRotationValue },
          { kind: "boss_onslaught", value: bossOnslaughtValue },
          { kind: "phalanx_march", value: Math.max(4, actNumber) },
          { kind: "war_drums", value: 1 },
        ],
      };
    }
    return {
      enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.brute, templateIds.support],
      modifiers: [
        { kind: "boss_screen", value: bossScreenValue },
        { kind: "escort_bulwark", value: escortBulwarkValue },
        { kind: "escort_rotation", value: escortRotationValue },
        { kind: "boss_onslaught", value: bossOnslaughtValue },
        { kind: "phalanx_march", value: Math.max(3, actNumber) },
      ],
    };
  }

  function buildMobilizedAftermathBossConfig(actNumber, templateIds) {
    const drilledConfig = buildDrilledAftermathBossConfig(actNumber, templateIds);
    return {
      enemyTemplateIds: [...drilledConfig.enemyTemplateIds],
      modifiers: [
        ...drilledConfig.modifiers,
        { kind: "court_reserves", value: Math.max(2, Math.min(4, actNumber + 1)) },
        { kind: "boss_salvo", value: Math.max(2, Math.min(4, actNumber + 1)) },
      ],
    };
  }

  function buildPostedAftermathBossConfig(actNumber, templateIds) {
    const bossScreenValue = Math.max(3, Math.min(5, actNumber + 1));
    const escortRotationValue = Math.max(2, Math.min(4, actNumber + 1));
    const bossOnslaughtValue = Math.max(2, Math.min(4, actNumber + 1));
    if (actNumber === 2) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.brute, templateIds.support],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "escort_rotation", value: escortRotationValue },
          { kind: "triage_screen", value: Math.max(2, Math.min(4, actNumber + 1)) },
          { kind: "boss_onslaught", value: bossOnslaughtValue },
          { kind: "phalanx_march", value: Math.max(3, actNumber) },
        ],
      };
    }
    if (actNumber === 3) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteB, templateIds.ranged, templateIds.support],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "escort_rotation", value: escortRotationValue },
          { kind: "triage_screen", value: Math.max(2, Math.min(4, actNumber + 1)) },
          { kind: "boss_onslaught", value: bossOnslaughtValue },
          { kind: "ritual_cadence", value: Math.max(2, Math.min(3, actNumber - 1)) },
        ],
      };
    }
    if (actNumber === 4) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "escort_bulwark", value: Math.max(4, actNumber + 1) },
          { kind: "escort_rotation", value: escortRotationValue },
          { kind: "boss_onslaught", value: bossOnslaughtValue },
          { kind: "war_drums", value: 1 },
        ],
      };
    }
    if (actNumber >= 5) {
      return {
        enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.eliteD, templateIds.brute],
        modifiers: [
          { kind: "boss_screen", value: bossScreenValue },
          { kind: "escort_bulwark", value: Math.max(4, actNumber + 1) },
          { kind: "escort_rotation", value: escortRotationValue },
          { kind: "boss_onslaught", value: bossOnslaughtValue },
          { kind: "phalanx_march", value: Math.max(4, actNumber) },
        ],
      };
    }
    return {
      enemyTemplateIds: [templateIds.boss, templateIds.eliteA, templateIds.brute, templateIds.support],
      modifiers: [
        { kind: "boss_screen", value: bossScreenValue },
        { kind: "escort_rotation", value: escortRotationValue },
        { kind: "triage_screen", value: Math.max(2, Math.min(4, actNumber + 1)) },
        { kind: "boss_onslaught", value: bossOnslaughtValue },
      ],
    };
  }

  runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_BUILDERS_BOSS = {
    buildCovenantBossConfig,
    buildAftermathBossConfig,
    buildDrilledAftermathBossConfig,
    buildMobilizedAftermathBossConfig,
    buildPostedAftermathBossConfig,
  };
})();
