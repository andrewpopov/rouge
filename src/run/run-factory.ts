/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const MAX_ZONE_ENCOUNTERS = 5;
  const MAX_HERO_ENERGY = 6;
  const MAX_HERO_POTION_HEAL = 24;
  const LEVEL_TRAINING_ORDER = ["vitality", "focus", "command"];

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toBonusValue(value, fallback = 0) {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function uniquePush(list, value) {
    if (value && !list.includes(value)) {
      list.push(value);
    }
  }

  function createDefaultProgression() {
    return {
      bossTrophies: [],
      activatedRunewords: [],
      skillPointsAvailable: 0,
      trainingPointsSpent: 0,
      classPointsAvailable: 0,
      classPointsSpent: 0,
      attributePointsAvailable: 0,
      attributePointsSpent: 0,
      attributes: createDefaultAttributes(),
      classProgression: createDefaultClassProgression(),
      training: createDefaultTraining(),
    };
  }

  function createDefaultTraining() {
    return {
      vitality: 0,
      focus: 0,
      command: 0,
    };
  }

  function createDefaultAttributes() {
    return {
      strength: 0,
      dexterity: 0,
      vitality: 0,
      energy: 0,
    };
  }

  function createDefaultClassProgression() {
    return {
      favoredTreeId: "",
      treeRanks: {},
      unlockedSkillIds: [],
    };
  }

  function createDefaultWorldState() {
    return {
      resolvedNodeIds: [],
      questOutcomes: {},
      shrineOutcomes: {},
      eventOutcomes: {},
      opportunityOutcomes: {},
      worldFlags: [],
    };
  }

  function createDefaultInventory() {
    return {
      nextEntryId: 1,
      carried: [],
    };
  }

  function createDefaultTownState() {
    return {
      vendor: {
        refreshCount: 0,
        stock: [],
      },
    };
  }

  function createDefaultSummary() {
    return {
      encountersCleared: 0,
      zonesCleared: 0,
      actsCleared: 0,
      goldGained: 0,
      xpGained: 0,
      levelsGained: 0,
      skillPointsEarned: 0,
      classPointsEarned: 0,
      attributePointsEarned: 0,
      trainingRanksGained: 0,
      bossesDefeated: 0,
      runewordsForged: 0,
    };
  }

  function getLevelForXp(xp) {
    return Math.max(1, 1 + Math.floor((Number.parseInt(String(xp || 0), 10) || 0) / 50));
  }

  function getTrainingTrackForLevel(level) {
    return LEVEL_TRAINING_ORDER[Math.max(0, (Number.parseInt(String(level || 2), 10) || 2) - 2) % LEVEL_TRAINING_ORDER.length];
  }

  function getTrainingRankCount(training) {
    return toBonusValue(training?.vitality) + toBonusValue(training?.focus) + toBonusValue(training?.command);
  }

  function addBonusSet(total: ItemBonusSet, bonuses: ItemBonusSet | undefined, multiplier = 1): ItemBonusSet {
    Object.entries(bonuses || {}).forEach(([key, value]) => {
      total[key] = (total[key] || 0) + toBonusValue(value) * multiplier;
    });
    return total;
  }

  function getClassProgression(content, classId) {
    return runtimeWindow.ROUGE_CLASS_REGISTRY?.getClassProgression?.(content, classId) || null;
  }

  // Reserved for the progression pass that syncs unlocked class skills into the run snapshot.
  function syncUnlockedClassSkills(run, content) {
    const definition = getClassProgression(content, run.classId);
    if (!definition) {
      run.progression.classProgression.unlockedSkillIds = [];
      run.progression.classProgression.favoredTreeId = "";
      run.progression.classProgression.treeRanks = {};
      return;
    }

    const unlocked = [];
    definition.trees.forEach((tree) => {
      const treeRank = Math.max(0, toBonusValue(run.progression.classProgression.treeRanks?.[tree.id]));
      if (treeRank <= 0) {
        return;
      }

      const eligibleSkills = tree.skills.filter((skill) => toBonusValue(skill.requiredLevel, 1) <= run.level).slice(0, treeRank);
      eligibleSkills.forEach((skill) => {
        if (!unlocked.includes(skill.id)) {
          unlocked.push(skill.id);
        }
      });
    });

    run.progression.classProgression.unlockedSkillIds = unlocked;
    if (
      run.progression.classProgression.favoredTreeId &&
      !definition.trees.some((tree) => tree.id === run.progression.classProgression.favoredTreeId)
    ) {
      run.progression.classProgression.favoredTreeId = "";
    }
  }

  // Reserved for applying class progression bonuses once those combat hooks are wired.
  function buildProgressionBonuses(run, content): ItemBonusSet {
    const total: ItemBonusSet = {};
    const attributes = run.progression?.attributes || createDefaultAttributes();
    const definition = getClassProgression(content, run.classId);

    addBonusSet(total, {
      heroDamageBonus: toBonusValue(attributes.strength),
      heroGuardBonus: toBonusValue(attributes.dexterity),
      heroMaxLife: toBonusValue(attributes.vitality) * 3,
      heroMaxEnergy: Math.ceil(toBonusValue(attributes.energy) / 2),
      heroBurnBonus: Math.floor(toBonusValue(attributes.energy) / 2),
    });

    (definition?.trees || []).forEach((tree) => {
      const rankCount = Math.max(0, toBonusValue(run.progression?.classProgression?.treeRanks?.[tree.id]));
      if (rankCount > 0) {
        addBonusSet(total, tree.bonusPerRank, rankCount);
      }
    });

    return total;
  }

  function applyTrainingRank(run, track) {
    if (track === "vitality") {
      run.hero.maxLife += 4;
      run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + 4);
      return;
    }

    if (track === "focus") {
      run.hero.maxEnergy = clamp(run.hero.maxEnergy + 1, 1, MAX_HERO_ENERGY);
      run.hero.potionHeal = clamp(run.hero.potionHeal + 1, 1, MAX_HERO_POTION_HEAL);
      return;
    }

    run.mercenary.attack += 1;
    run.mercenary.maxLife += 3;
    run.mercenary.currentLife = Math.min(run.mercenary.maxLife, run.mercenary.currentLife + 3);
  }

  function syncLevelProgression(run) {
    const targetRanks = Math.max(0, toBonusValue(run.level) - 1);
    const currentRanks = getTrainingRankCount(run.progression?.training);

    for (let rankIndex = currentRanks; rankIndex < targetRanks; rankIndex += 1) {
      const nextLevel = rankIndex + 2;
      const track = getTrainingTrackForLevel(nextLevel);
      run.progression.training[track] += 1;
      run.progression.skillPointsAvailable += 1;
      run.summary.skillPointsEarned += 1;
      run.summary.trainingRanksGained += 1;
      applyTrainingRank(run, track);
    }

    const earnedSkillPoints = Math.max(
      toBonusValue(run.summary.skillPointsEarned),
      targetRanks,
      Math.max(0, toBonusValue(run.progression.trainingPointsSpent) + toBonusValue(run.progression.skillPointsAvailable))
    );
    const trainingPointsSpent = clamp(toBonusValue(run.progression.trainingPointsSpent), 0, earnedSkillPoints);
    const earnedClassPoints = Math.max(
      toBonusValue(run.summary.classPointsEarned),
      targetRanks,
      Math.max(0, toBonusValue(run.progression.classPointsSpent) + toBonusValue(run.progression.classPointsAvailable))
    );
    const classPointsSpent = clamp(toBonusValue(run.progression.classPointsSpent), 0, earnedClassPoints);
    const earnedAttributePoints = Math.max(
      toBonusValue(run.summary.attributePointsEarned),
      targetRanks,
      Math.max(0, toBonusValue(run.progression.attributePointsSpent) + toBonusValue(run.progression.attributePointsAvailable))
    );
    const attributePointsSpent = clamp(toBonusValue(run.progression.attributePointsSpent), 0, earnedAttributePoints);

    run.progression.trainingPointsSpent = trainingPointsSpent;
    run.progression.classPointsSpent = classPointsSpent;
    run.progression.attributePointsSpent = attributePointsSpent;
    run.progression.skillPointsAvailable = Math.max(0, earnedSkillPoints - trainingPointsSpent);
    run.progression.classPointsAvailable = Math.max(0, earnedClassPoints - classPointsSpent);
    run.progression.attributePointsAvailable = Math.max(0, earnedAttributePoints - attributePointsSpent);
    run.summary.levelsGained = Math.max(toBonusValue(run.summary.levelsGained), targetRanks);
    run.summary.skillPointsEarned = earnedSkillPoints;
    run.summary.classPointsEarned = earnedClassPoints;
    run.summary.attributePointsEarned = earnedAttributePoints;
    run.summary.trainingRanksGained = Math.max(toBonusValue(run.summary.trainingRanksGained), targetRanks);
  }

  function buildProgressionAction(run, track, title, description, previewLines) {
    const canSpend = run.progression.skillPointsAvailable > 0;
    return {
      id: `progression_spend_${track}`,
      category: "progression",
      title,
      subtitle: "Spend Skill Point",
      description,
      previewLines: [
        ...previewLines,
        canSpend ? `${run.progression.skillPointsAvailable} skill point${run.progression.skillPointsAvailable === 1 ? "" : "s"} ready.` : "Earn more levels to unlock another spend.",
      ],
      cost: 0,
      actionLabel: canSpend ? "Spend" : "Locked",
      disabled: !canSpend,
    };
  }

  function buildAttributeAction(run, attribute, title, description, previewLines) {
    const canSpend = run.progression.attributePointsAvailable > 0;
    return {
      id: `progression_attribute_${attribute}`,
      category: "progression",
      title,
      subtitle: "Allocate Attribute",
      description,
      previewLines: [
        ...previewLines,
        `${title} rank ${toBonusValue(run.progression.attributes?.[attribute])}.`,
        canSpend
          ? `${run.progression.attributePointsAvailable} attribute point${run.progression.attributePointsAvailable === 1 ? "" : "s"} ready.`
          : "Level up to unlock another attribute point.",
      ],
      cost: 0,
      actionLabel: canSpend ? "Allocate" : "Locked",
      disabled: !canSpend,
    };
  }

  function buildClassTreeAction(run, tree) {
    const canSpend = run.progression.classPointsAvailable > 0;
    const treeRank = toBonusValue(run.progression.classProgression?.treeRanks?.[tree.id]);
    const unlockedCount = (run.progression.classProgression?.unlockedSkillIds || []).filter((skillId) => {
      return tree.skills.some((skill) => skill.id === skillId);
    }).length;
    const nextSkill = tree.skills.find((skill, index) => {
      return index >= treeRank && toBonusValue(skill.requiredLevel, 1) <= run.level;
    });
    const futureSkill = tree.skills.find((skill, index) => index >= treeRank) || null;
    let nextUnlockLine = "All current skills in this tree are unlocked.";
    if (nextSkill) {
      nextUnlockLine = `Next unlock: ${nextSkill.name} (Lv ${nextSkill.requiredLevel}).`;
    } else if (futureSkill) {
      nextUnlockLine = `Next unlock waits for Lv ${futureSkill.requiredLevel}: ${futureSkill.name}.`;
    }

    return {
      id: `progression_tree_${tree.id}`,
      category: "progression",
      title: tree.name,
      subtitle: "Invest Class Point",
      description: tree.summary,
      previewLines: [
        `Tree rank ${treeRank}. Unlocked skills ${unlockedCount}/${tree.skills.length}.`,
        nextUnlockLine,
      ],
      cost: 0,
      actionLabel: canSpend ? "Invest" : "Locked",
      disabled: !canSpend,
    };
  }

  function listProgressionActions(run, content) {
    if (!run?.progression) {
      return [];
    }

    const actions = [
      buildProgressionAction(
        run,
        "vitality",
        "Vitality Drill",
        "Convert one banked skill point into permanent hero durability.",
        ["Hero max Life +4."]
      ),
      buildProgressionAction(
        run,
        "focus",
        "Focus Drill",
        "Convert one banked skill point into permanent hero casting stamina.",
        ["Hero max Energy +1.", "Potion healing +1."]
      ),
      buildProgressionAction(
        run,
        "command",
        "Command Drill",
        "Convert one banked skill point into permanent mercenary pressure.",
        ["Mercenary attack +1.", "Mercenary max Life +3."]
      ),
      buildAttributeAction(
        run,
        "strength",
        "Strength",
        "Invest in raw physical power for higher card damage.",
        ["Hero card damage +1."]
      ),
      buildAttributeAction(
        run,
        "dexterity",
        "Dexterity",
        "Invest in timing and control for stronger guard skills.",
        ["Guard skills +1."]
      ),
      buildAttributeAction(
        run,
        "vitality",
        "Vitality",
        "Invest in durability for a larger Life pool.",
        ["Hero max Life +3."]
      ),
      buildAttributeAction(
        run,
        "energy",
        "Energy",
        "Invest in spell fuel for mana growth and burn scaling.",
        ["Every 2 ranks: Hero max Energy +1.", "Every 2 ranks: Burn +1."]
      ),
    ];

    const classProgression = getClassProgression(content, run.classId);
    (classProgression?.trees || []).forEach((tree) => {
      actions.push(buildClassTreeAction(run, tree));
    });

    return actions;
  }

  function applyProgressionAction(run, actionId, content) {
    if (!actionId.startsWith("progression_spend_")) {
      if (!actionId.startsWith("progression_attribute_") && !actionId.startsWith("progression_tree_")) {
        return { ok: false, message: "Unknown progression action." };
      }
    }

    if (actionId.startsWith("progression_spend_")) {
      if (run.progression.skillPointsAvailable <= 0) {
        return { ok: false, message: "No banked skill points are available." };
      }

      const track = actionId.replace("progression_spend_", "");
      if (!Object.prototype.hasOwnProperty.call(createDefaultTraining(), track)) {
        return { ok: false, message: "Unknown progression track." };
      }

      run.progression.trainingPointsSpent += 1;
      run.progression.skillPointsAvailable = Math.max(0, run.progression.skillPointsAvailable - 1);
      run.progression.training[track] += 1;
      applyTrainingRank(run, track);
      return { ok: true, message: "Training updated." };
    }

    if (actionId.startsWith("progression_attribute_")) {
      if (run.progression.attributePointsAvailable <= 0) {
        return { ok: false, message: "No attribute points are available." };
      }

      const attribute = actionId.replace("progression_attribute_", "");
      if (!Object.prototype.hasOwnProperty.call(createDefaultAttributes(), attribute)) {
        return { ok: false, message: "Unknown attribute." };
      }

      run.progression.attributePointsSpent += 1;
      run.progression.attributePointsAvailable = Math.max(0, run.progression.attributePointsAvailable - 1);
      run.progression.attributes[attribute] += 1;
      return { ok: true, message: "Attributes updated." };
    }

    if (run.progression.classPointsAvailable <= 0) {
      return { ok: false, message: "No class points are available." };
    }

    const treeId = actionId.replace("progression_tree_", "");
    const classProgression = getClassProgression(content, run.classId);
    const tree = classProgression?.trees?.find((entry) => entry.id === treeId) || null;
    if (!tree) {
      return { ok: false, message: "Unknown class progression tree." };
    }

    run.progression.classPointsSpent += 1;
    run.progression.classPointsAvailable = Math.max(0, run.progression.classPointsAvailable - 1);
    run.progression.classProgression.treeRanks[treeId] = toBonusValue(run.progression.classProgression.treeRanks?.[treeId]) + 1;
    run.progression.classProgression.favoredTreeId = treeId;
    syncUnlockedClassSkills(run, content);
    return { ok: true, message: "Class progression updated." };
  }

  function createEncounterSequence(kind, count, actNumber, content, zoneRole) {
    const actPools = content?.generatedActEncounterIds?.[actNumber] || {};
    let sourcePool = null;

    if (typeof zoneRole === "string" && Array.isArray(actPools[zoneRole]) && actPools[zoneRole].length > 0) {
      sourcePool = actPools[zoneRole];
    } else if (kind === "boss") {
      sourcePool = actPools.boss;
    } else if (kind === "miniboss") {
      sourcePool = actPools.branchMiniboss;
    } else {
      sourcePool = actPools.opening;
    }

    let fallbackPool = ["blood_moor_raiders"];
    if (kind === "boss") {
      fallbackPool = ["catacombs_gate"];
    } else if (kind === "miniboss") {
      fallbackPool = ["burial_grounds"];
    }

    const pool = Array.isArray(sourcePool) && sourcePool.length > 0 ? sourcePool : fallbackPool;
    return Array.from({ length: clamp(count, 1, MAX_ZONE_ENCOUNTERS) }, (_, index) => pool[index % pool.length]);
  }

  function createZoneState({ actNumber, title, kind, zoneRole, description, encounterCount, prerequisites, content }) {
    const encounterIds = createEncounterSequence(kind, encounterCount, actNumber, content, zoneRole);
    const status = Array.isArray(prerequisites) && prerequisites.length === 0 ? "available" : "locked";
    return {
      id: `act_${actNumber}_${slugify(title)}`,
      actNumber,
      title,
      kind,
      zoneRole,
      description,
      encounterIds,
      encounterTotal: encounterIds.length,
      encountersCleared: 0,
      visited: false,
      cleared: false,
      status,
      prerequisites: [...prerequisites],
    };
  }

  function createActState(actSeed, bossEntry, content) {
    const campaignZones = (actSeed.mainlineZones || []).filter((zone) => zone !== actSeed.town);
    const bossZoneName = actSeed.boss.zone;
    const branchZoneCandidates = [];
    uniquePush(branchZoneCandidates, actSeed.sideZones?.[0] || "");
    uniquePush(branchZoneCandidates, campaignZones[Math.max(1, Math.floor(campaignZones.length * 0.35))] || "");
    uniquePush(branchZoneCandidates, campaignZones[Math.max(1, campaignZones.length - 3)] || "");

    const routeZoneNames = [];
    uniquePush(routeZoneNames, campaignZones[0] || `${actSeed.town} Outskirts`);
    uniquePush(routeZoneNames, branchZoneCandidates[0] || campaignZones[1] || `${actSeed.town} Wilds`);
    uniquePush(routeZoneNames, branchZoneCandidates[1] || campaignZones[Math.max(2, campaignZones.length - 2)] || `${actSeed.town} Approach`);

    const openingZone = createZoneState({
      actNumber: actSeed.act,
      title: routeZoneNames[0],
      kind: "battle",
      zoneRole: "opening",
      description: "Opening pressure zone. It establishes the act route and usually contains multiple repeated encounters.",
      encounterCount: clamp(actSeed.act + 1, 2, 5),
      prerequisites: [],
      content,
    });

    const branchZoneOne = createZoneState({
      actNumber: actSeed.act,
      title: routeZoneNames[1],
      kind: "miniboss",
      zoneRole: "branchMiniboss",
      description: "Branch combat zone with stronger resistance and a higher reward floor.",
      encounterCount: clamp(Math.floor((actSeed.act + 1) / 2) + 1, 1, 3),
      prerequisites: [openingZone.id],
      content,
    });

    const branchZoneTwo = createZoneState({
      actNumber: actSeed.act,
      title: routeZoneNames[2],
      kind: "battle",
      zoneRole: "branchBattle",
      description: "Second branch zone. It deepens the act route before the boss unlocks.",
      encounterCount: clamp(actSeed.act + 1, 2, 4),
      prerequisites: [openingZone.id],
      content,
    });

    const worldNodeZones = runtimeWindow.ROUGE_WORLD_NODES?.createActWorldNodes({
      actSeed,
      openingZoneId: openingZone.id,
    }) || [];

    const bossZone = createZoneState({
      actNumber: actSeed.act,
      title: bossZoneName,
      kind: "boss",
      zoneRole: "boss",
      description: `Boss zone for ${actSeed.boss.name}. This closes the act and opens the next safe zone.`,
      encounterCount: 1,
      prerequisites: [branchZoneOne.id, branchZoneTwo.id],
      content,
    });

    return {
      id: `act_${actSeed.act}`,
      actNumber: actSeed.act,
      title: `Act ${actSeed.act}: ${actSeed.name}`,
      town: actSeed.town,
      boss: {
        ...deepClone(actSeed.boss),
        profile: bossEntry?.bossProfile || null,
      },
      zones: [openingZone, branchZoneOne, branchZoneTwo, ...worldNodeZones, bossZone],
      complete: false,
    };
  }

  function buildActSeedFromState(act) {
    const bossZone = Array.isArray(act?.zones) ? act.zones.find((zone) => zone.kind === "boss") || null : null;
    return {
      act: act?.actNumber || 1,
      name: String(act?.title || `Act ${act?.actNumber || 1}`).replace(/^Act\s+\d+:\s*/, ""),
      town: act?.town || "Safe Zone",
      mainlineZones: [],
      sideZones: [],
      boss: {
        id: act?.boss?.id || `act_${act?.actNumber || 1}_boss`,
        name: act?.boss?.name || "Boss",
        zone: bossZone?.title || act?.boss?.zone || act?.boss?.name || "Boss",
      },
    };
  }

  function worldNodeZoneIsResolved(run, zone) {
    if (run.world?.resolvedNodeIds?.includes(zone.id)) {
      return true;
    }
    if (zone.kind === "quest") {
      return Boolean(run.world?.questOutcomes?.[zone.nodeId || ""]);
    }
    if (zone.kind === "shrine") {
      return Boolean(run.world?.shrineOutcomes?.[zone.nodeId || ""]);
    }
    if (zone.kind === "event") {
      return Boolean(run.world?.eventOutcomes?.[zone.nodeId || ""]);
    }
    if (zone.kind === "opportunity") {
      return Boolean(run.world?.opportunityOutcomes?.[zone.nodeId || ""]);
    }
    return false;
  }

  function normalizeWorldNodeZone(run, template, existingZone) {
    const resolved = worldNodeZoneIsResolved(run, template) || Boolean(existingZone?.cleared);
    if (resolved) {
      uniquePush(run.world.resolvedNodeIds, template.id);
    }

    return {
      ...template,
      ...(existingZone || {}),
      id: template.id,
      actNumber: template.actNumber,
      title: template.title,
      kind: template.kind,
      zoneRole: template.zoneRole,
      description: template.description,
      encounterIds: [],
      encounterTotal: 1,
      encountersCleared: resolved ? 1 : clamp(toBonusValue(existingZone?.encountersCleared), 0, 1),
      visited: Boolean(existingZone?.visited || resolved),
      cleared: resolved,
      status: resolved ? "cleared" : template.status,
      prerequisites:
        Array.isArray(existingZone?.prerequisites) && existingZone.prerequisites.length > 0
          ? [...existingZone.prerequisites]
          : [...template.prerequisites],
      nodeId: template.nodeId,
      nodeType: template.nodeType,
    };
  }

  function normalizeActWorldNodes(run, act) {
    if (!Array.isArray(act?.zones) || !runtimeWindow.ROUGE_WORLD_NODES?.createActWorldNodes) {
      return act;
    }

    const openingZone =
      act.zones.find((zone) => zone.zoneRole === "opening") ||
      act.zones.find((zone) => zone.kind === "battle" && (!Array.isArray(zone.prerequisites) || zone.prerequisites.length === 0)) ||
      act.zones[0] ||
      null;

    if (!openingZone) {
      return act;
    }

    const desiredWorldNodeZones = runtimeWindow.ROUGE_WORLD_NODES.createActWorldNodes({
      actSeed: buildActSeedFromState(act),
      openingZoneId: openingZone.id,
    });

    const existingWorldNodesByKind = new Map(
      act.zones
        .filter((zone) => runtimeWindow.ROUGE_WORLD_NODES?.isWorldNodeZone(zone))
        .map((zone) => [zone.kind, zone])
    );
    const normalizedWorldNodes = desiredWorldNodeZones.map((template) => {
      return normalizeWorldNodeZone(run, template, existingWorldNodesByKind.get(template.kind) || null);
    });

    const nonWorldZones = act.zones.filter((zone) => !runtimeWindow.ROUGE_WORLD_NODES?.isWorldNodeZone(zone));
    const bossIndex = nonWorldZones.findIndex((zone) => zone.kind === "boss");
    const zones =
      bossIndex >= 0
        ? [...nonWorldZones.slice(0, bossIndex), ...normalizedWorldNodes, ...nonWorldZones.slice(bossIndex)]
        : [...nonWorldZones, ...normalizedWorldNodes];

    return {
      ...act,
      zones,
    };
  }

  function normalizeRunActs(run) {
    if (!Array.isArray(run?.acts)) {
      return;
    }
    run.acts = run.acts.map((act) => normalizeActWorldNodes(run, act));
  }

  function getCurrentAct(run) {
    return Array.isArray(run?.acts) ? run.acts[run.currentActIndex] || null : null;
  }

  function syncCurrentActFields(run) {
    const currentAct = getCurrentAct(run);
    run.actNumber = currentAct?.actNumber || 1;
    run.actTitle = currentAct?.title || "Act";
    run.safeZoneName = currentAct?.town || "Safe Zone";
    run.bossName = currentAct?.boss?.name || "Boss";
  }

  function getCurrentZones(run) {
    return Array.isArray(getCurrentAct(run)?.zones) ? getCurrentAct(run).zones : [];
  }

  function getZoneById(run, zoneId) {
    return getCurrentZones(run).find((zone) => zone.id === zoneId) || null;
  }

  function zoneIsUnlocked(run, zone) {
    if (!zone) {
      return false;
    }
    if (!Array.isArray(zone.prerequisites) || zone.prerequisites.length === 0) {
      return true;
    }
    return zone.prerequisites.every((requiredZoneId) => {
      const requiredZone = getZoneById(run, requiredZoneId);
      return Boolean(requiredZone?.cleared);
    });
  }

  function recomputeZoneStatuses(run) {
    getCurrentZones(run).forEach((zone) => {
      if (zone.cleared) {
        zone.status = "cleared";
        return;
      }
      zone.status = zoneIsUnlocked(run, zone) ? "available" : "locked";
    });
  }

  function getReachableZones(run) {
    recomputeZoneStatuses(run);
    return getCurrentZones(run).filter((zone) => zone.status === "available");
  }

  function getCombatBonuses(run, content): ItemBonusSet {
    const total: ItemBonusSet = {};
    addBonusSet(total, buildProgressionBonuses(run, content));
    addBonusSet(total, runtimeWindow.ROUGE_ITEM_SYSTEM?.buildCombatBonuses(run, content) || {});
    return total;
  }

  function buildCombatBonuses(run, content): ItemBonusSet {
    return getCombatBonuses(run, content);
  }

  function hydrateRun(run, content) {
    run.world = {
      ...createDefaultWorldState(),
      ...(run.world || {}),
      resolvedNodeIds: Array.isArray(run.world?.resolvedNodeIds) ? [...run.world.resolvedNodeIds] : [],
      questOutcomes: run.world?.questOutcomes || {},
      shrineOutcomes: run.world?.shrineOutcomes || {},
      eventOutcomes: run.world?.eventOutcomes || {},
      opportunityOutcomes: run.world?.opportunityOutcomes || {},
      worldFlags: Array.isArray(run.world?.worldFlags) ? [...run.world.worldFlags] : [],
    };
    normalizeRunActs(run);
    run.progression = {
      ...createDefaultProgression(),
      ...(run.progression || {}),
      bossTrophies: Array.isArray(run.progression?.bossTrophies) ? [...run.progression.bossTrophies] : [],
      activatedRunewords: Array.isArray(run.progression?.activatedRunewords) ? [...run.progression.activatedRunewords] : [],
      skillPointsAvailable: toBonusValue(run.progression?.skillPointsAvailable),
      trainingPointsSpent: toBonusValue(run.progression?.trainingPointsSpent),
      classPointsAvailable: toBonusValue(run.progression?.classPointsAvailable),
      classPointsSpent: toBonusValue(run.progression?.classPointsSpent),
      attributePointsAvailable: toBonusValue(run.progression?.attributePointsAvailable),
      attributePointsSpent: toBonusValue(run.progression?.attributePointsSpent),
      attributes: {
        ...createDefaultAttributes(),
        ...(run.progression?.attributes || {}),
      },
      classProgression: {
        ...createDefaultClassProgression(),
        ...(run.progression?.classProgression || {}),
        treeRanks: { ...(run.progression?.classProgression?.treeRanks || {}) },
        unlockedSkillIds: Array.isArray(run.progression?.classProgression?.unlockedSkillIds)
          ? [...run.progression.classProgression.unlockedSkillIds]
          : [],
      },
      training: {
        ...createDefaultTraining(),
        ...(run.progression?.training || {}),
      },
    };
    run.summary = {
      ...createDefaultSummary(),
      ...(run.summary || {}),
    };
    run.inventory = {
      ...createDefaultInventory(),
      ...(run.inventory || {}),
      nextEntryId: Math.max(1, toBonusValue(run.inventory?.nextEntryId) || 1),
      carried: Array.isArray(run.inventory?.carried) ? [...run.inventory.carried] : [],
    };
    run.town = {
      ...createDefaultTownState(),
      ...(run.town || {}),
      vendor: {
        ...createDefaultTownState().vendor,
        ...(run.town?.vendor || {}),
        refreshCount: toBonusValue(run.town?.vendor?.refreshCount),
        stock: Array.isArray(run.town?.vendor?.stock) ? [...run.town.vendor.stock] : [],
      },
    };
    run.level = Math.max(getLevelForXp(run.xp), Math.max(1, toBonusValue(run.level)));
    if (!run.loadout || typeof run.loadout !== "object") {
      run.loadout = {
        weapon: null,
        armor: null,
      };
    }

    syncLevelProgression(run);
    syncUnlockedClassSkills(run, content);
    runtimeWindow.ROUGE_ITEM_SYSTEM?.hydrateRunLoadout(run, content);
    runtimeWindow.ROUGE_ITEM_SYSTEM?.hydrateRunInventory(run, content);
    syncCurrentActFields(run);
    recomputeZoneStatuses(run);
    return run;
  }

  function createRun({ content, seedBundle, classDefinition, heroDefinition, mercenaryId, starterDeck }) {
    const mercenaryDefinition = content.mercenaryCatalog[mercenaryId];
    const actSeeds = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const acts = actSeeds.map((actSeed) =>
      createActState(actSeed, bossEntries.find((entry) => entry.id === actSeed.boss.id) || null, content)
    );

    const run = {
      id: `run_${Date.now()}`,
      currentActIndex: 0,
      acts,
      actNumber: 1,
      actTitle: "",
      safeZoneName: "",
      bossName: "",
      classId: classDefinition.id,
      className: classDefinition.name,
      hero: {
        ...heroDefinition,
        currentLife: heroDefinition.maxLife,
      },
      mercenary: {
        ...mercenaryDefinition,
        currentLife: mercenaryDefinition.maxLife,
      },
      deck: [...starterDeck],
      gold: 0,
      xp: 0,
      level: 1,
      belt: {
        current: 2,
        max: 2,
      },
      inventory: createDefaultInventory(),
      loadout: {
        weapon: null,
        armor: null,
      },
      town: createDefaultTownState(),
      progression: createDefaultProgression(),
      activeZoneId: "",
      activeEncounterId: "",
      pendingReward: null,
      world: createDefaultWorldState(),
      summary: createDefaultSummary(),
    };

    return hydrateRun(run, content);
  }

  function beginZone(run, zoneId) {
    const zone = getZoneById(run, zoneId);
    if (!zone) {
      return { ok: false, message: "Unknown zone." };
    }
    recomputeZoneStatuses(run);
    if (zone.status !== "available") {
      return { ok: false, message: "Zone is not available." };
    }

    const previousVisited = zone.visited;
    const previousActiveZoneId = run.activeZoneId;
    const previousActiveEncounterId = run.activeEncounterId;
    zone.visited = true;
    run.activeZoneId = zone.id;

    if (runtimeWindow.ROUGE_WORLD_NODES?.isWorldNodeZone(zone)) {
      run.activeEncounterId = "";
      try {
        const reward = runtimeWindow.ROUGE_WORLD_NODES.buildZoneReward({
          run,
          zone,
        });
        return {
          ok: true,
          type: "reward",
          zone,
          reward,
        };
      } catch (error) {
        zone.visited = previousVisited;
        run.activeZoneId = previousActiveZoneId;
        run.activeEncounterId = previousActiveEncounterId;
        return {
          ok: false,
          message: error instanceof Error ? error.message : "World node resolution failed.",
        };
      }
    }

    const encounterId = zone.encounterIds[zone.encountersCleared];
    if (!encounterId) {
      return { ok: false, message: "Zone is missing an encounter definition." };
    }

    run.activeEncounterId = encounterId;
    return {
      ok: true,
      type: "encounter",
      zone,
      encounterId,
      encounterIndex: zone.encountersCleared + 1,
      encounterTotal: zone.encounterTotal,
    };
  }

  function snapshotPartyFromCombat(run, combatState, content) {
    const bonuses = getCombatBonuses(run, content);
    run.hero.currentLife = Math.max(0, combatState.hero.life);
    run.hero.maxLife = Math.max(1, combatState.hero.maxLife - toBonusValue(bonuses.heroMaxLife));
    run.hero.maxEnergy = Math.max(1, combatState.hero.maxEnergy - toBonusValue(bonuses.heroMaxEnergy));
    run.hero.potionHeal = Math.max(1, combatState.hero.potionHeal - toBonusValue(bonuses.heroPotionHeal));
    run.mercenary.currentLife = Math.max(0, combatState.mercenary.life);
    run.mercenary.maxLife = Math.max(1, combatState.mercenary.maxLife - toBonusValue(bonuses.mercenaryMaxLife));
    run.mercenary.attack = Math.max(0, combatState.mercenary.attack - toBonusValue(bonuses.mercenaryAttack));
    run.belt.current = combatState.potions;
  }

  function createCombatOverrides(run, content) {
    const bonuses = getCombatBonuses(run, content);
    const heroMaxLife = run.hero.maxLife + toBonusValue(bonuses.heroMaxLife);
    const heroMaxEnergy = run.hero.maxEnergy + toBonusValue(bonuses.heroMaxEnergy);
    const heroPotionHeal = run.hero.potionHeal + toBonusValue(bonuses.heroPotionHeal);
    const mercenaryMaxLife = run.mercenary.maxLife + toBonusValue(bonuses.mercenaryMaxLife);
    const mercenaryAttack = run.mercenary.attack + toBonusValue(bonuses.mercenaryAttack);

    return {
      heroState: {
        ...run.hero,
        maxLife: heroMaxLife,
        maxEnergy: heroMaxEnergy,
        potionHeal: heroPotionHeal,
        life: clamp(run.hero.currentLife, 0, heroMaxLife),
        damageBonus: toBonusValue(bonuses.heroDamageBonus),
        guardBonus: toBonusValue(bonuses.heroGuardBonus),
        burnBonus: toBonusValue(bonuses.heroBurnBonus),
      },
      mercenaryState: {
        ...run.mercenary,
        maxLife: mercenaryMaxLife,
        attack: mercenaryAttack,
        life: clamp(run.mercenary.currentLife, 0, mercenaryMaxLife),
      },
      starterDeck: [...run.deck],
      initialPotions: run.belt.current,
    };
  }

  function buildEncounterReward({ run, zone, combatState, content }) {
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

    const grants = rewardByKind[zone.kind] || rewardByKind.battle;
    const lines = [`+${grants.gold} gold`, `+${grants.xp} experience`];

    if (grants.potions > 0) {
      lines.push(`+${grants.potions} potion charge`);
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

    const bonuses = getCombatBonuses(run, content);
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

  runtimeWindow.ROUGE_RUN_FACTORY = {
    createRun,
    hydrateRun,
    createCombatOverrides,
    beginZone,
    getCurrentAct,
    getCurrentZones,
    getZoneById,
    getReachableZones,
    recomputeZoneStatuses,
    snapshotPartyFromCombat,
    buildEncounterReward,
    applyReward,
    buildCombatBonuses,
    listProgressionActions,
    applyProgressionAction,
    actIsComplete,
    runIsComplete,
    advanceToNextAct,
  };
})();
