(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    normalizeActPool,
    groupByRole,
    getElitePackages,
    getEliteAffixProfile,
    buildEnemyTemplate,
    buildEliteTemplate,
    buildBossTemplate,
  } = runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS;
  const ACT_FLAVOR = {
    1: {
      openingLabel: "Wilderness",
      branchBattleLabel: "Monastery",
      branchMinibossLabel: "Burial Grounds",
      bossLabel: "Catacomb",
      openingDescription: "Rogue-outskirts skirmishes with shamans, raiders, and first ranged pressure.",
      branchBattleDescription: "Disciplined cult and monastery pressure with tougher fronts and ranged cover.",
      branchMinibossDescription: "Elite graveyard pressure led by a champion and support backline.",
      bossDescription: "Andariel's guard line and poison-heavy boss pressure.",
      bossAdds: ["brute", "support"],
    },
    2: {
      openingLabel: "Desert",
      branchBattleLabel: "Tomb",
      branchMinibossLabel: "Palace",
      bossLabel: "Duriel Chamber",
      openingDescription: "Open-desert swarms and ranged harassment with faster battlefield pressure.",
      branchBattleDescription: "Crypt and tomb pressure with mummies, brood enemies, and ranged chip damage.",
      branchMinibossDescription: "Palace-adjacent elite defenders backed by reviver-style support.",
      bossDescription: "Duriel's chamber closes around heavy bruisers and relentless boss hits.",
      bossAdds: ["support", "ranged"],
    },
    3: {
      openingLabel: "Jungle",
      branchBattleLabel: "Temple",
      branchMinibossLabel: "Kurast",
      bossLabel: "Durance",
      openingDescription: "Jungle packs swarm with quick attackers, priests, and irregular ranged fire.",
      branchBattleDescription: "Temple and causeway fights lean into cultists, priests, and bruiser escorts.",
      branchMinibossDescription: "Kurast branch encounters feature stronger elites with priest support.",
      bossDescription: "Mephisto's court mixes spell pressure and disciplined support around the act boss.",
      bossAdds: ["support", "ranged"],
    },
    4: {
      openingLabel: "Outer Hell",
      branchBattleLabel: "Infernal Route",
      branchMinibossLabel: "Citadel",
      bossLabel: "Chaos Sanctuary",
      openingDescription: "Hellfield skirmishes escalate immediately into harder-hitting demonic packs.",
      branchBattleDescription: "Infernal route battles favor durable demons, ranged punishment, and attrition.",
      branchMinibossDescription: "Citadel defenders revolve around elite bruisers and spell-support backlines.",
      bossDescription: "Chaos Sanctuary battles center on Diablo's escort pressure and brutal follow-up hits.",
      bossAdds: ["brute", "support"],
    },
    5: {
      openingLabel: "Siege Front",
      branchBattleLabel: "Frozen Pass",
      branchMinibossLabel: "Worldstone Approach",
      bossLabel: "Worldstone",
      openingDescription: "Act V opens with siege pressure, ranged volleys, and heavier frontline enemies.",
      branchBattleDescription: "Frozen routes mix durable beasts, ranged chip, and attrition pressure.",
      branchMinibossDescription: "Worldstone approach encounters feature elite guardians and layered support.",
      bossDescription: "Baal's throne and chamber battles build around escorts, ranged punishment, and boss spike turns.",
      bossAdds: ["brute", "ranged"],
    },
  };

  function getFlavor(actNumber) {
    return ACT_FLAVOR[actNumber] || ACT_FLAVOR[1];
  }

  function pickEntry(entries, index, fallback) {
    if (Array.isArray(entries) && entries.length > 0) {
      return entries[index % entries.length];
    }
    return fallback;
  }

  function pickEscortTemplate(role, rangedTemplateId, supportTemplateId, bruteTemplateId) {
    if (role === "ranged") {
      return rangedTemplateId;
    }
    if (role === "support") {
      return supportTemplateId;
    }
    return bruteTemplateId;
  }

  function makeEncounter(id, name, description, enemyTemplateIds, modifiers = []) {
    return {
      id,
      name,
      description,
      enemies: enemyTemplateIds.map((templateId, index) => ({
        id: `${id}_enemy_${index + 1}`,
        templateId,
      })),
      modifiers: modifiers.map((modifier) => ({ ...modifier })),
    };
  }

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

  function buildActEncounterSet({ actSeed, bossEntry, groupedEntries }) {
    const actNumber = actSeed.act;
    const flavor = getFlavor(actNumber);
    const raiderA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.raider, 0, groupedEntries.raider[0]), role: "raider" });
    const raiderB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.raider, 1, groupedEntries.raider[0]),
      role: "raider",
      variant: "alt",
    });
    const rangedA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.ranged, 0, groupedEntries.ranged[0]), role: "ranged" });
    const rangedB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.ranged, 1, groupedEntries.ranged[0]),
      role: "ranged",
      variant: "alt",
    });
    const supportA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.support, 0, groupedEntries.support[0]), role: "support" });
    const supportB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.support, 1, groupedEntries.support[0]),
      role: "support",
      variant: "alt",
    });
    const bruteA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.brute, 0, groupedEntries.brute[0]), role: "brute" });
    const bruteB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.brute, 1, groupedEntries.brute[0]),
      role: "brute",
      variant: "alt",
    });
    const [elitePackageA, elitePackageB, elitePackageC, elitePackageD] = getElitePackages(actNumber);
    const eliteA = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntries[elitePackageA.role], elitePackageA.entryIndex, groupedEntries[elitePackageA.role][0]),
      role: elitePackageA.role,
      profile: getEliteAffixProfile(elitePackageA.profileId),
      templateIdSuffix: elitePackageA.templateIdSuffix,
    });
    const eliteB = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntries[elitePackageB.role], elitePackageB.entryIndex, groupedEntries[elitePackageB.role][0]),
      role: elitePackageB.role,
      profile: getEliteAffixProfile(elitePackageB.profileId),
      templateIdSuffix: elitePackageB.templateIdSuffix,
    });
    const eliteC = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntries[elitePackageC.role], elitePackageC.entryIndex, groupedEntries[elitePackageC.role][0]),
      role: elitePackageC.role,
      profile: getEliteAffixProfile(elitePackageC.profileId),
      templateIdSuffix: elitePackageC.templateIdSuffix,
    });
    const eliteD = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntries[elitePackageD.role], elitePackageD.entryIndex, groupedEntries[elitePackageD.role][0]),
      role: elitePackageD.role,
      profile: getEliteAffixProfile(elitePackageD.profileId),
      templateIdSuffix: elitePackageD.templateIdSuffix,
    });
    const bossA = buildBossTemplate({ actNumber, actSeed, bossEntry });

    const enemyTemplates = [raiderA, raiderB, rangedA, rangedB, supportA, supportB, bruteA, bruteB, eliteA, eliteB, eliteC, eliteD, bossA];
    const enemyCatalog = Object.fromEntries(enemyTemplates.map((template) => [template.templateId, template]));

    const openingIds = [
      `act_${actNumber}_opening_skirmish`,
      `act_${actNumber}_opening_pressure`,
      `act_${actNumber}_opening_horde`,
      `act_${actNumber}_opening_crossfire`,
      `act_${actNumber}_opening_screen`,
      `act_${actNumber}_opening_raid`,
      `act_${actNumber}_opening_nest`,
    ];
    const branchBattleIds = [
      `act_${actNumber}_branch_battle`,
      `act_${actNumber}_branch_ambush`,
      `act_${actNumber}_branch_bulwark`,
      `act_${actNumber}_branch_counterpush`,
      `act_${actNumber}_branch_siege`,
      `act_${actNumber}_branch_breach`,
    ];
    const branchMinibossIds = [
      `act_${actNumber}_branch_miniboss`,
      `act_${actNumber}_branch_retinue`,
      `act_${actNumber}_branch_sanctum`,
      `act_${actNumber}_branch_warhost`,
      `act_${actNumber}_branch_phalanx`,
      `act_${actNumber}_branch_conclave`,
    ];
    const consequenceBranchBattleId = `act_${actNumber}_branch_recovery`;
    const consequenceBranchMinibossId = `act_${actNumber}_miniboss_accord`;
    const consequenceBossId = `act_${actNumber}_boss_covenant`;
    const consequenceDetourBranchBattleId = `act_${actNumber}_branch_detour`;
    const consequenceGuidedDetourBranchBattleId = `act_${actNumber}_branch_detour_guided`;
    const consequenceSignalDetourBranchBattleId = `act_${actNumber}_branch_detour_signal`;
    const consequenceMobilizedDetourBranchBattleId = `act_${actNumber}_branch_detour_mobilized`;
    const consequenceEscalationMinibossId = `act_${actNumber}_miniboss_escalation`;
    const consequenceBreachEscalationMinibossId = `act_${actNumber}_miniboss_escalation_breach`;
    const consequenceDirectedEscalationMinibossId = `act_${actNumber}_miniboss_escalation_directed`;
    const consequenceMobilizedEscalationMinibossId = `act_${actNumber}_miniboss_escalation_mobilized`;
    const consequenceAftermathBossId = `act_${actNumber}_boss_aftermath`;
    const consequenceDirectedAftermathBossId = `act_${actNumber}_boss_aftermath_directed`;
    const consequenceSignaledAftermathBossId = `act_${actNumber}_boss_aftermath_signaled`;
    const consequenceDrilledAftermathBossId = `act_${actNumber}_boss_aftermath_drilled`;
    const consequenceMobilizedAftermathBossId = `act_${actNumber}_boss_aftermath_mobilized`;
    const consequencePostedAftermathBossId = `act_${actNumber}_boss_aftermath_posted`;
    const bossId = `act_${actNumber}_boss`;
    const bossAddIds = flavor.bossAdds || ["brute", "support"];
    const bossEscortOne = pickEscortTemplate(bossAddIds[0], rangedA.templateId, supportA.templateId, bruteA.templateId);
    const bossEnemyTemplateIds =
      actNumber >= 4
        ? [bossA.templateId, eliteA.templateId, eliteC.templateId, eliteD.templateId]
        : [bossA.templateId, bossEscortOne, eliteB.templateId, eliteD.templateId];
    const covenantBossConfig = buildCovenantBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteC: eliteC.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });
    const aftermathBossConfig = buildAftermathBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteC: eliteC.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });
    const drilledAftermathBossConfig = buildDrilledAftermathBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });
    const mobilizedAftermathBossConfig = buildMobilizedAftermathBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });
    const postedAftermathBossConfig = buildPostedAftermathBossConfig(actNumber, {
      boss: bossA.templateId,
      eliteA: eliteA.templateId,
      eliteB: eliteB.templateId,
      eliteD: eliteD.templateId,
      ranged: rangedA.templateId,
      support: supportA.templateId,
      brute: bruteA.templateId,
    });

    const encounterCatalog = {
      [openingIds[0]]: makeEncounter(
        openingIds[0],
        `${flavor.openingLabel} Skirmish`,
        flavor.openingDescription,
        [raiderA.templateId, raiderB.templateId, supportA.templateId]
      ),
      [openingIds[1]]: makeEncounter(
        openingIds[1],
        `${flavor.openingLabel} Pressure Pack`,
        `${flavor.openingDescription} The ranged line forces tighter target priority.`,
        [raiderA.templateId, rangedA.templateId, supportA.templateId],
        [{ kind: "backline_screen", value: Math.max(2, actNumber) }]
      ),
      [openingIds[2]]: makeEncounter(
        openingIds[2],
        `${flavor.openingLabel} Horde`,
        `${flavor.openingDescription} The pack density is higher, so area zones take more repeated clears.`,
        [raiderA.templateId, raiderB.templateId, rangedA.templateId, supportA.templateId],
        [{ kind: "vanguard_rush", value: 1 }]
      ),
      [openingIds[3]]: makeEncounter(
        openingIds[3],
        `${flavor.openingLabel} Crossfire`,
        `${flavor.openingDescription} This route angle leans on layered ranged fire and awkward target priority.`,
        [rangedA.templateId, rangedB.templateId, raiderA.templateId],
        [{ kind: "crossfire_lanes", value: 1 }]
      ),
      [openingIds[4]]: makeEncounter(
        openingIds[4],
        `${flavor.openingLabel} Screen`,
        `${flavor.openingDescription} A tougher screen forces you through a guarded front before the backline breaks.`,
        [supportA.templateId, bruteA.templateId, rangedB.templateId],
        [{ kind: "fortified_line", value: Math.max(2, actNumber) }]
      ),
      [openingIds[5]]: makeEncounter(
        openingIds[5],
        `${flavor.openingLabel} Raid`,
        `${flavor.openingDescription} A larger raiding party mixes brute pressure with a live backline immediately.`,
        [raiderA.templateId, bruteA.templateId, rangedA.templateId, supportB.templateId],
        [{ kind: "ambush_opening", value: 1 }]
      ),
      [openingIds[6]]: makeEncounter(
        openingIds[6],
        `${flavor.openingLabel} Sniper Nest`,
        `${flavor.openingDescription} Elevated lanes and clear sightlines turn the opener into a ranged damage check.`,
        [rangedA.templateId, rangedB.templateId, raiderA.templateId],
        [{ kind: "sniper_nest", value: Math.max(2, actNumber) }]
      ),
      [branchBattleIds[0]]: makeEncounter(
        branchBattleIds[0],
        `${flavor.branchBattleLabel} Hold`,
        flavor.branchBattleDescription,
        [bruteA.templateId, rangedA.templateId, supportA.templateId],
        [{ kind: "war_drums", value: 1 }]
      ),
      [branchBattleIds[1]]: makeEncounter(
        branchBattleIds[1],
        `${flavor.branchBattleLabel} Ambush`,
        `${flavor.branchBattleDescription} This branch leans harder on ranged pressure and guarded fronts.`,
        [eliteB.templateId, rangedA.templateId, rangedB.templateId],
        [{ kind: "ambush_opening", value: 1 }]
      ),
      [branchBattleIds[2]]: makeEncounter(
        branchBattleIds[2],
        `${flavor.branchBattleLabel} Bulwark`,
        `${flavor.branchBattleDescription} Durable fronts and recovery support drag the branch into attrition.`,
        [bruteA.templateId, bruteB.templateId, supportB.templateId],
        [{ kind: "triage_screen", value: Math.max(2, Math.min(4, actNumber + 1)) }]
      ),
      [branchBattleIds[3]]: makeEncounter(
        branchBattleIds[3],
        `${flavor.branchBattleLabel} Counterpush`,
        `${flavor.branchBattleDescription} An elite support package turns the branch into a live counterattack.`,
        [eliteC.templateId, supportA.templateId, raiderA.templateId],
        [{ kind: "triage_command", value: 1 }]
      ),
      [branchBattleIds[4]]: makeEncounter(
        branchBattleIds[4],
        `${flavor.branchBattleLabel} Siege`,
        `${flavor.branchBattleDescription} A fourth elite package keeps the branch identity from collapsing into one repeated escort script.`,
        [eliteD.templateId, bruteA.templateId, supportA.templateId],
        [{ kind: "fortified_line", value: Math.max(3, actNumber + 1) }]
      ),
      [branchBattleIds[5]]: makeEncounter(
        branchBattleIds[5],
        `${flavor.branchBattleLabel} Breach`,
        `${flavor.branchBattleDescription} A drilled breach team opens on line-breaking charges instead of another slower front-line trade.`,
        [eliteA.templateId, bruteA.templateId, bruteB.templateId, supportA.templateId],
        [{ kind: "linebreaker_charge", value: Math.max(1, Math.min(3, Math.ceil(actNumber / 2))) }]
      ),
      [branchMinibossIds[0]]: makeEncounter(
        branchMinibossIds[0],
        `${flavor.branchMinibossLabel} Champion`,
        flavor.branchMinibossDescription,
        actNumber >= 3 ? [eliteA.templateId, eliteB.templateId, supportB.templateId] : [eliteA.templateId, supportB.templateId, bruteA.templateId]
      ),
      [branchMinibossIds[1]]: makeEncounter(
        branchMinibossIds[1],
        `${flavor.branchMinibossLabel} Retinue`,
        `${flavor.branchMinibossDescription} A second elite escort package keeps the branch from collapsing into one repeated script.`,
        [eliteB.templateId, eliteC.templateId, bruteA.templateId],
        [{ kind: "escort_bulwark", value: Math.max(3, actNumber) }]
      ),
      [branchMinibossIds[2]]: makeEncounter(
        branchMinibossIds[2],
        `${flavor.branchMinibossLabel} Sanctum`,
        `${flavor.branchMinibossDescription} The sanctum package doubles down on elite layering and a live backline.`,
        [eliteA.templateId, eliteC.templateId, supportA.templateId, rangedA.templateId],
        [
          { kind: "escort_bulwark", value: Math.max(3, actNumber) },
          { kind: "escort_command", value: 1 },
        ]
      ),
      [branchMinibossIds[3]]: makeEncounter(
        branchMinibossIds[3],
        `${flavor.branchMinibossLabel} War Host`,
        `${flavor.branchMinibossDescription} A larger war host pushes multiple elite identities into the same branch fight.`,
        [eliteB.templateId, eliteC.templateId, eliteD.templateId, bruteB.templateId],
        [
          { kind: "escort_bulwark", value: Math.max(4, actNumber + 1) },
          { kind: "elite_onslaught", value: 1 },
        ]
      ),
      [branchMinibossIds[4]]: makeEncounter(
        branchMinibossIds[4],
        `${flavor.branchMinibossLabel} Phalanx`,
        `${flavor.branchMinibossDescription} A drilled elite front advances with brute escorts instead of leaning on another support pocket.`,
        [eliteA.templateId, bruteA.templateId, bruteB.templateId, supportA.templateId],
        [{ kind: "phalanx_march", value: Math.max(3, actNumber) }]
      ),
      [branchMinibossIds[5]]: makeEncounter(
        branchMinibossIds[5],
        `${flavor.branchMinibossLabel} Conclave`,
        `${flavor.branchMinibossDescription} A warding conclave opens on recovery rites and shield calls instead of another straight escort rush.`,
        [eliteA.templateId, supportA.templateId, supportB.templateId, rangedA.templateId],
        [{ kind: "ritual_cadence", value: Math.max(1, Math.min(3, Math.ceil(actNumber / 2))) }]
      ),
      [consequenceBranchBattleId]: makeEncounter(
        consequenceBranchBattleId,
        `${flavor.branchBattleLabel} Recovery Line`,
        `${flavor.branchBattleDescription} Route-side recovery efforts change the next branch fight into a screened counterline instead of the default patrol mix.`,
        [eliteA.templateId, rangedA.templateId, supportB.templateId, bruteA.templateId],
        [
          { kind: "backline_screen", value: Math.max(2, actNumber) },
          { kind: "triage_command", value: 1 },
        ]
      ),
      [consequenceDetourBranchBattleId]: makeEncounter(
        consequenceDetourBranchBattleId,
        `${flavor.branchBattleLabel} Detour Line`,
        `${flavor.branchBattleDescription} A hidden post-covenant detour turns the next branch into a screened supply run instead of a direct hold.`,
        [supportA.templateId, bruteA.templateId, rangedA.templateId, bruteB.templateId],
        [
          { kind: "fortified_line", value: Math.max(3, actNumber + 1) },
          { kind: "backline_screen", value: Math.max(2, actNumber) },
        ]
      ),
      [consequenceGuidedDetourBranchBattleId]: makeEncounter(
        consequenceGuidedDetourBranchBattleId,
        `${flavor.branchBattleLabel} Guarded Detour`,
        `${flavor.branchBattleDescription} A guided sidepass from the detour lane turns the next branch into a guarded flank instead of another default counterline.`,
        [eliteA.templateId, supportA.templateId, rangedA.templateId, bruteA.templateId],
        [
          { kind: "fortified_line", value: Math.max(2, actNumber) },
          { kind: "triage_screen", value: Math.max(2, Math.min(4, actNumber + 1)) },
        ]
      ),
      [consequenceSignalDetourBranchBattleId]: makeEncounter(
        consequenceSignalDetourBranchBattleId,
        `${flavor.branchBattleLabel} Signal Detour`,
        `${flavor.branchBattleDescription} Earlier shrine signals carry through the full detour and turn the next branch into a screened beacon line instead of a plain convoy flank.`,
        [rangedA.templateId, rangedB.templateId, supportA.templateId, bruteA.templateId],
        [
          { kind: "backline_screen", value: Math.max(2, actNumber) },
          { kind: "sniper_nest", value: Math.max(2, actNumber) },
        ]
      ),
      [consequenceMobilizedDetourBranchBattleId]: makeEncounter(
        consequenceMobilizedDetourBranchBattleId,
        `${flavor.branchBattleLabel} Mobilized Detour`,
        `${flavor.branchBattleDescription} Earlier accord musters now carry through the full signaled detour and turn the next branch into a reserve-backed beacon line instead of a looser routed flank.`,
        [eliteA.templateId, rangedA.templateId, rangedB.templateId, supportA.templateId],
        [
          { kind: "backline_screen", value: Math.max(2, actNumber) },
          { kind: "sniper_nest", value: Math.max(2, actNumber) },
          { kind: "court_reserves", value: 1 },
        ]
      ),
      [consequenceBranchMinibossId]: makeEncounter(
        consequenceBranchMinibossId,
        `${flavor.branchMinibossLabel} Accord Host`,
        `${flavor.branchMinibossDescription} A full accord lane turns the next elite branch into a coordinated host with scripted escort pressure.`,
        [eliteA.templateId, eliteC.templateId, rangedA.templateId, supportA.templateId],
        [
          { kind: "escort_command", value: 1 },
          { kind: "elite_onslaught", value: 1 },
        ]
      ),
      [consequenceEscalationMinibossId]: makeEncounter(
        consequenceEscalationMinibossId,
        `${flavor.branchMinibossLabel} Escalation Host`,
        `${flavor.branchMinibossDescription} A post-covenant escalation turns the next elite branch into a direct strike package instead of a steadier escort shell.`,
        [eliteB.templateId, eliteD.templateId, bruteA.templateId, supportA.templateId],
        [
          { kind: "linebreaker_charge", value: Math.max(1, Math.min(3, Math.ceil(actNumber / 2))) },
          { kind: "elite_onslaught", value: 1 },
        ]
      ),
      [consequenceBreachEscalationMinibossId]: makeEncounter(
        consequenceBreachEscalationMinibossId,
        `${flavor.branchMinibossLabel} Breach Host`,
        `${flavor.branchMinibossDescription} A guided escalation breach turns the next elite branch into a drilled pressure push instead of the default accord host.`,
        [eliteA.templateId, eliteB.templateId, bruteA.templateId, rangedA.templateId],
        [
          { kind: "linebreaker_charge", value: Math.max(1, Math.min(3, Math.ceil(actNumber / 2))) },
          { kind: "war_drums", value: 1 },
        ]
      ),
      [consequenceDirectedEscalationMinibossId]: makeEncounter(
        consequenceDirectedEscalationMinibossId,
        `${flavor.branchMinibossLabel} Directed Surge`,
        `${flavor.branchMinibossDescription} Earlier crossroads guidance carries through the full escalation and turns the next elite branch into a routed strike package instead of a generic late surge.`,
        [eliteA.templateId, eliteD.templateId, rangedA.templateId, supportA.templateId],
        [
          { kind: "linebreaker_charge", value: Math.max(1, Math.min(3, Math.ceil(actNumber / 2))) },
          { kind: "escort_command", value: 1 },
        ]
      ),
      [consequenceMobilizedEscalationMinibossId]: makeEncounter(
        consequenceMobilizedEscalationMinibossId,
        `${flavor.branchMinibossLabel} Mobilized Surge`,
        `${flavor.branchMinibossDescription} Earlier accord musters now carry through the full directed escalation and turn the next elite branch into a reserve-backed strike package instead of a looser late surge.`,
        [eliteA.templateId, eliteD.templateId, supportA.templateId, supportB.templateId],
        [
          { kind: "linebreaker_charge", value: Math.max(1, Math.min(3, Math.ceil(actNumber / 2))) },
          { kind: "escort_command", value: 1 },
          { kind: "court_reserves", value: 1 },
        ]
      ),
      [bossId]: makeEncounter(
        bossId,
        actSeed.boss.name,
        flavor.bossDescription,
        bossEnemyTemplateIds,
        [
          { kind: "escort_bulwark", value: Math.max(4, actNumber + 1) },
          { kind: "escort_command", value: 1 },
        ]
      ),
      [consequenceBossId]: makeEncounter(
        consequenceBossId,
        `${flavor.bossLabel} Covenant`,
        `${flavor.bossDescription} A resolved covenant route turns the act boss into a coordinated closing court instead of the default escort line.`,
        covenantBossConfig.enemyTemplateIds,
        covenantBossConfig.modifiers
      ),
      [consequenceAftermathBossId]: makeEncounter(
        consequenceAftermathBossId,
        `${flavor.bossLabel} Aftermath`,
        `${flavor.bossDescription} A full post-covenant detour and escalation turns the boss into a harsher aftermath fight instead of the default closing court.`,
        aftermathBossConfig.enemyTemplateIds,
        aftermathBossConfig.modifiers
      ),
      [consequenceDirectedAftermathBossId]: makeEncounter(
        consequenceDirectedAftermathBossId,
        `${flavor.bossLabel} Directed Aftermath`,
        `${flavor.bossDescription} Earlier route guidance carries through the full aftermath and turns the boss into a directed closing court instead of a generic late-route collapse.`,
        aftermathBossConfig.enemyTemplateIds,
        [...aftermathBossConfig.modifiers, { kind: "escort_command", value: 1 }]
      ),
      [consequenceSignaledAftermathBossId]: makeEncounter(
        consequenceSignaledAftermathBossId,
        `${flavor.bossLabel} Signaled Aftermath`,
        `${flavor.bossDescription} Earlier shrine signals and crossroads guidance both carry through the full aftermath and turn the boss into a fully signaled closing court instead of a looser routed collapse.`,
        aftermathBossConfig.enemyTemplateIds,
        [...aftermathBossConfig.modifiers, { kind: "escort_command", value: 1 }, { kind: "triage_command", value: 1 }]
      ),
      [consequenceDrilledAftermathBossId]: makeEncounter(
        consequenceDrilledAftermathBossId,
        `${flavor.bossLabel} Drilled Aftermath`,
        `${flavor.bossDescription} Earlier route drilling and an alternate crossroads court both carry through the full aftermath and harden the escort screen into a more martial closing court.`,
        drilledAftermathBossConfig.enemyTemplateIds,
        drilledAftermathBossConfig.modifiers
      ),
      [consequenceMobilizedAftermathBossId]: makeEncounter(
        consequenceMobilizedAftermathBossId,
        `${flavor.bossLabel} Mobilized Aftermath`,
        `${flavor.bossDescription} Earlier accord musters, route drilling, and alternate crossroads pressure all carry through the full aftermath and mobilize the boss court into a reserve-backed closing assault.`,
        mobilizedAftermathBossConfig.enemyTemplateIds,
        mobilizedAftermathBossConfig.modifiers
      ),
      [consequencePostedAftermathBossId]: makeEncounter(
        consequencePostedAftermathBossId,
        `${flavor.bossLabel} Posted Aftermath`,
        `${flavor.bossDescription} The alternate sidepass and breach route now settle behind bell or banner posts, turning the boss court into a steadier escort-led aftermath instead of the sharper convoy collapse.`,
        postedAftermathBossConfig.enemyTemplateIds,
        postedAftermathBossConfig.modifiers
      ),
    };

    return {
      enemyCatalog,
      encounterCatalog,
      encounterIdsByKind: {
        opening: openingIds,
        branchBattle: branchBattleIds,
        branchMiniboss: branchMinibossIds,
        boss: [bossId],
      },
    };
  }

  function slugifyZone(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function monsterNameToEntry(name, zoneSlug) {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return { id: `z_${zoneSlug}_${baseId}`, name };
  }

  function spreadAcrossRoles(entries) {
    const grouped = groupByRole(entries);
    const usedIds = new Set();
    const result = { raider: null, ranged: null, support: null, brute: null };
    const roles = ["support", "ranged", "brute", "raider"];

    roles.forEach((role) => {
      const candidate = grouped[role].find((e) => !usedIds.has(e.id));
      if (candidate) {
        result[role] = candidate;
        usedIds.add(candidate.id);
      }
    });

    const unused = entries.filter((e) => !usedIds.has(e.id));
    roles.forEach((role) => {
      if (!result[role]) {
        result[role] = unused.shift() || grouped[role][0] || entries[0];
      }
    });
    return result;
  }

  function buildZoneEncounterSet({ actNumber, zoneName, monsterNames }) {
    if (!Array.isArray(monsterNames) || monsterNames.length === 0) {
      return null;
    }

    const zoneSlug = slugifyZone(zoneName);
    const entries = monsterNames.map((n) => monsterNameToEntry(n, zoneSlug));
    const spread = spreadAcrossRoles(entries);

    const raiderA = buildEnemyTemplate({ actNumber, entry: spread.raider, role: "raider" });
    const raiderB = buildEnemyTemplate({
      actNumber,
      entry: entries.length > 1 ? entries.find((e) => e.id !== spread.raider.id) || spread.raider : spread.raider,
      role: "raider",
      variant: "alt",
    });
    const rangedA = buildEnemyTemplate({ actNumber, entry: spread.ranged, role: "ranged" });
    const supportA = buildEnemyTemplate({ actNumber, entry: spread.support, role: "support" });
    const bruteA = buildEnemyTemplate({ actNumber, entry: spread.brute, role: "brute" });

    const prefix = `act_${actNumber}_zone_${zoneSlug}`;
    const enemyTemplates = [raiderA, raiderB, rangedA, supportA, bruteA];
    const enemyCatalog = Object.fromEntries(enemyTemplates.map((t) => [t.templateId, t]));

    const encounterIds = [
      `${prefix}_patrol`,
      `${prefix}_ambush`,
      `${prefix}_swarm`,
    ];

    const encounterCatalog = {
      [encounterIds[0]]: makeEncounter(
        encounterIds[0],
        `${zoneName} Patrol`,
        `A pack of ${zoneName} denizens blocks the path.`,
        [raiderA.templateId, raiderB.templateId, supportA.templateId]
      ),
      [encounterIds[1]]: makeEncounter(
        encounterIds[1],
        `${zoneName} Ambush`,
        `${zoneName} creatures emerge from the shadows with ranged support.`,
        [raiderA.templateId, rangedA.templateId, supportA.templateId],
        [{ kind: "ambush_opening", value: 1 }]
      ),
      [encounterIds[2]]: makeEncounter(
        encounterIds[2],
        `${zoneName} Swarm`,
        `A larger group of ${zoneName} inhabitants surges forward with brute force.`,
        [raiderA.templateId, bruteA.templateId, rangedA.templateId, supportA.templateId],
        [{ kind: "vanguard_rush", value: 1 }]
      ),
    };

    return { enemyCatalog, encounterCatalog, encounterIds };
  }

  runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_BUILDERS = {
    normalizeActPool,
    groupByRole,
    buildActEncounterSet,
    buildZoneEncounterSet,
  };
})();
