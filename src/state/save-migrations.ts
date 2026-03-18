/* eslint-disable @typescript-eslint/no-explicit-any -- migration code transforms arbitrary legacy data */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { deepClone, toNumber, clamp, isObject } = runtimeWindow.ROUGE_UTILS;
  const {
    createDefaultTraining,
    createDefaultAttributes,
    createDefaultClassProgression,
    getLevelForXp,
    getTrainingTrackForLevel,
    getTrainingRankCount,
  } = runtimeWindow.ROUGE_RUN_STATE;

  const CURRENT_SCHEMA_VERSION = 5;

  function ensureStringArray(value: unknown) {
    return Array.isArray(value) ? value.filter((entry: unknown) => typeof entry === "string") : [];
  }

  function ensureObjectRecord(value: unknown): Record<string, any> {
    return isObject(value) ? value as Record<string, any> : {};
  }

  function looksLikeRunState(value: unknown) {
    return isObject(value) && Array.isArray((value as Record<string, unknown>).acts) && Array.isArray((value as Record<string, unknown>).deck) && isObject((value as Record<string, unknown>).hero) && isObject((value as Record<string, unknown>).mercenary);
  }

  function normalizeSnapshotEnvelope(snapshot: unknown) {
    if (looksLikeRunState(snapshot)) {
      const snap = snapshot as Record<string, unknown>;
      return {
        schemaVersion: 1,
        savedAt: new Date(0).toISOString(),
        phase: "safe_zone",
        selectedClassId: (snap as Record<string, unknown>).classId || "",
        selectedMercenaryId: ((snap as Record<string, unknown>).mercenary as Record<string, unknown>)?.id || "",
        run: snapshot,
      };
    }

    if (!isObject(snapshot) || !looksLikeRunState((snapshot as Record<string, unknown>).run)) {
      return null;
    }

    const snap = snapshot as Record<string, unknown>;
    const run = snap.run as Record<string, unknown>;
    return {
      schemaVersion: toNumber(snap.schemaVersion, 1),
      savedAt: typeof snap.savedAt === "string" ? snap.savedAt : new Date(0).toISOString(),
      phase: typeof snap.phase === "string" ? snap.phase : "safe_zone",
      selectedClassId: typeof snap.selectedClassId === "string" ? snap.selectedClassId : run.classId || "",
      selectedMercenaryId:
        typeof snap.selectedMercenaryId === "string" ? snap.selectedMercenaryId : (run.mercenary as Record<string, unknown>)?.id || "",
      run: snap.run,
    };
  }

  function buildLegacyEquipmentState(itemId: string, slot: string, runeId: string) {
    if (!itemId) {
      return null;
    }

    return {
      itemId,
      slot,
      socketsUnlocked: runeId ? 1 : 0,
      insertedRunes: runeId ? [runeId] : [],
      runewordId: "",
    };
  }

  function ensureTraining(training: unknown) {
    const source = ensureObjectRecord(training);
    return {
      vitality: toNumber(source.vitality, 0),
      focus: toNumber(source.focus, 0),
      command: toNumber(source.command, 0),
    };
  }

  function ensureAttributes(attributes: unknown) {
    const source = ensureObjectRecord(attributes);
    return {
      strength: toNumber(source.strength, 0),
      dexterity: toNumber(source.dexterity, 0),
      vitality: toNumber(source.vitality, 0),
      energy: toNumber(source.energy, 0),
    };
  }

  function ensureClassProgression(classProgression: unknown) {
    const source = ensureObjectRecord(classProgression);
    const treeRanks = ensureObjectRecord(source.treeRanks);
    return {
      favoredTreeId: typeof source.favoredTreeId === "string" ? source.favoredTreeId : "",
      treeRanks: Object.fromEntries(
        Object.entries(treeRanks)
          .filter(([treeId]) => typeof treeId === "string" && treeId)
          .map(([treeId, rank]) => [treeId, toNumber(rank, 0)])
      ),
      unlockedSkillIds: ensureStringArray(source.unlockedSkillIds),
    };
  }


  function applyTrainingRank(run: Record<string, any>, track: string) {
    if (track === "vitality") {
      run.hero.maxLife = toNumber(run.hero?.maxLife, 1) + 4;
      run.hero.currentLife = Math.min(run.hero.maxLife, toNumber(run.hero?.currentLife, run.hero.maxLife) + 4);
      return;
    }

    if (track === "focus") {
      run.hero.maxEnergy = clamp(toNumber(run.hero?.maxEnergy, 1) + 1, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_ENERGY);
      run.hero.potionHeal = clamp(toNumber(run.hero?.potionHeal, 1) + 1, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_POTION_HEAL);
      return;
    }

    run.mercenary.attack = toNumber(run.mercenary?.attack, 0) + 1;
    run.mercenary.maxLife = toNumber(run.mercenary?.maxLife, 1) + 3;
    run.mercenary.currentLife = Math.min(run.mercenary.maxLife, toNumber(run.mercenary?.currentLife, run.mercenary.maxLife) + 3);
  }

  function ensureSummary(summary: unknown) {
    const source = ensureObjectRecord(summary);
    return {
      encountersCleared: toNumber(source.encountersCleared, 0),
      zonesCleared: toNumber(source.zonesCleared, 0),
      actsCleared: toNumber(source.actsCleared, 0),
      goldGained: toNumber(source.goldGained, 0),
      xpGained: toNumber(source.xpGained, 0),
      levelsGained: toNumber(source.levelsGained, 0),
      skillPointsEarned: toNumber(source.skillPointsEarned, 0),
      classPointsEarned: toNumber(source.classPointsEarned, 0),
      attributePointsEarned: toNumber(source.attributePointsEarned, 0),
      trainingRanksGained: toNumber(source.trainingRanksGained, 0),
      bossesDefeated: toNumber(source.bossesDefeated, 0),
      runewordsForged: toNumber(source.runewordsForged, 0),
    };
  }

  function ensureQuestOutcomeRecord(record: unknown) {
    const source = ensureObjectRecord(record);
    let status = "primary_resolved";
    if (source.status === "chain_resolved") {
      status = "chain_resolved";
    } else if (source.status === "follow_up_resolved") {
      status = "follow_up_resolved";
    }
    return {
      questId: typeof source.questId === "string" ? source.questId : "",
      zoneId: typeof source.zoneId === "string" ? source.zoneId : "",
      actNumber: toNumber(source.actNumber, 0),
      title: typeof source.title === "string" ? source.title : "",
      outcomeId: typeof source.outcomeId === "string" ? source.outcomeId : "",
      outcomeTitle: typeof source.outcomeTitle === "string" ? source.outcomeTitle : "",
      status,
      followUpNodeId: typeof source.followUpNodeId === "string" ? source.followUpNodeId : "",
      followUpOutcomeId: typeof source.followUpOutcomeId === "string" ? source.followUpOutcomeId : "",
      followUpOutcomeTitle: typeof source.followUpOutcomeTitle === "string" ? source.followUpOutcomeTitle : "",
      consequenceIds: ensureStringArray(source.consequenceIds),
      flags: ensureStringArray(source.flags),
    };
  }

  function ensureWorldNodeOutcomeRecord(record: unknown) {
    const source = ensureObjectRecord(record);
    return {
      nodeId: typeof source.nodeId === "string" ? source.nodeId : "",
      zoneId: typeof source.zoneId === "string" ? source.zoneId : "",
      actNumber: toNumber(source.actNumber, 0),
      title: typeof source.title === "string" ? source.title : "",
      outcomeId: typeof source.outcomeId === "string" ? source.outcomeId : "",
      outcomeTitle: typeof source.outcomeTitle === "string" ? source.outcomeTitle : "",
      linkedQuestId: typeof source.linkedQuestId === "string" ? source.linkedQuestId : "",
      flagIds: ensureStringArray(source.flagIds),
    };
  }

  function ensureOutcomeRecordMap(value: unknown, recordBuilder: (record: unknown) => Record<string, unknown>) {
    const source = ensureObjectRecord(value);
    return Object.fromEntries(
      Object.entries(source)
        .filter(([, record]) => isObject(record))
        .map(([recordId, record]) => [recordId, recordBuilder(record)])
    );
  }

  function ensureWorld(world: unknown) {
    const source = ensureObjectRecord(world);
    return {
      resolvedNodeIds: ensureStringArray(source.resolvedNodeIds),
      questOutcomes: ensureOutcomeRecordMap(source.questOutcomes, ensureQuestOutcomeRecord),
      shrineOutcomes: ensureOutcomeRecordMap(source.shrineOutcomes, ensureWorldNodeOutcomeRecord),
      eventOutcomes: ensureOutcomeRecordMap(source.eventOutcomes, ensureWorldNodeOutcomeRecord),
      opportunityOutcomes: ensureOutcomeRecordMap(source.opportunityOutcomes, ensureWorldNodeOutcomeRecord),
      worldFlags: ensureStringArray(source.worldFlags),
    };
  }

  function ensureInventory(run: Record<string, any>, inventory: unknown) {
    const source = ensureObjectRecord(inventory);
    const carried = Array.isArray(source.carried)
      ? source.carried
          .filter((entry: unknown) => isObject(entry))
          .map((entry: Record<string, unknown>, index: number) => {
            if (entry.kind === "rune" || typeof entry.runeId === "string") {
              return {
                entryId: typeof entry.entryId === "string" && entry.entryId ? entry.entryId : `${run?.id || "run"}_inv_${index + 1}`,
                kind: "rune",
                runeId: typeof entry.runeId === "string" ? entry.runeId : "",
              };
            }

            const equipment = ensureObjectRecord(entry.equipment || entry);
            let entryId = `${run?.id || "run"}_inv_${index + 1}`;
            if (typeof equipment.entryId === "string" && equipment.entryId) {
              entryId = equipment.entryId;
            } else if (typeof entry.entryId === "string" && entry.entryId) {
              entryId = entry.entryId;
            }

            return {
              entryId: typeof entry.entryId === "string" && entry.entryId ? entry.entryId : `${run?.id || "run"}_inv_${index + 1}`,
              kind: "equipment",
              equipment: {
                entryId,
                itemId: typeof equipment.itemId === "string" ? equipment.itemId : "",
                slot: typeof equipment.slot === "string" ? equipment.slot : "weapon",
                socketsUnlocked: toNumber(equipment.socketsUnlocked, 0),
                insertedRunes: ensureStringArray(equipment.insertedRunes),
                runewordId: typeof equipment.runewordId === "string" ? equipment.runewordId : "",
              },
            };
          })
      : [];

    return {
      nextEntryId: Math.max(toNumber(source.nextEntryId, carried.length + 1), carried.length + 1),
      carried,
    };
  }

  function ensureTown(town: unknown) {
    const source = ensureObjectRecord(town);
    const vendor = ensureObjectRecord(source.vendor);
    return {
      vendor: {
        refreshCount: toNumber(vendor.refreshCount, 0),
        stock: Array.isArray(vendor.stock) ? vendor.stock.filter((entry: unknown) => isObject(entry)).map((entry: unknown) => deepClone(entry)) : [],
      },
    };
  }

  function ensureLoadoutEntryIds(run: Record<string, any>) {
    const loadout = run.loadout as Record<string, any> | undefined;
    ["weapon", "armor"].forEach((slot: string) => {
      const equipment = ensureObjectRecord(loadout?.[slot]);
      if (!equipment.itemId) {
        return;
      }
      equipment.entryId = typeof equipment.entryId === "string" && equipment.entryId ? equipment.entryId : `${run.id || "run"}_${slot}`;
      equipment.slot = slot;
      equipment.socketsUnlocked = toNumber(equipment.socketsUnlocked, 0);
      equipment.insertedRunes = ensureStringArray(equipment.insertedRunes);
      equipment.runewordId = typeof equipment.runewordId === "string" ? equipment.runewordId : "";
      (run.loadout as Record<string, any>)[slot] = equipment;
    });
  }

  function ensureProgression(run: Record<string, any>, progression: unknown) {
    const source = ensureObjectRecord(progression);
    const derivedBossTrophies = Array.isArray(run?.acts)
      ? (run.acts as Record<string, unknown>[]).filter((act: Record<string, unknown>) => act?.complete && (act?.boss as Record<string, unknown>)?.id).map((act: Record<string, unknown>) => (act.boss as Record<string, unknown>).id)
      : [];

    return {
      bossTrophies: ensureStringArray(source.bossTrophies).length > 0 ? ensureStringArray(source.bossTrophies) : derivedBossTrophies,
      activatedRunewords: ensureStringArray(source.activatedRunewords),
      skillPointsAvailable: toNumber(source.skillPointsAvailable, 0),
      trainingPointsSpent: toNumber(source.trainingPointsSpent, 0),
      classPointsAvailable: toNumber(source.classPointsAvailable, 0),
      classPointsSpent: toNumber(source.classPointsSpent, 0),
      attributePointsAvailable: toNumber(source.attributePointsAvailable, 0),
      attributePointsSpent: toNumber(source.attributePointsSpent, 0),
      attributes: ensureAttributes(source.attributes || createDefaultAttributes()),
      classProgression: ensureClassProgression(source.classProgression || createDefaultClassProgression()),
      training: ensureTraining(source.training || createDefaultTraining()),
    };
  }

  function syncLevelProgression(run: Record<string, any>) {
    run.level = Math.max(toNumber(run.level, 1), getLevelForXp(run.xp));
    const targetRanks = Math.max(0, toNumber(run.level, 1) - 1);
    const existingRanks = getTrainingRankCount(run.progression?.training);

    for (let rankIndex = existingRanks; rankIndex < targetRanks; rankIndex += 1) {
      const nextLevel = rankIndex + 2;
      const track = getTrainingTrackForLevel(nextLevel);
      run.progression.training[track] += 1;
      run.progression.skillPointsAvailable += 1;
      run.summary.skillPointsEarned += 1;
      run.summary.trainingRanksGained += 1;
      applyTrainingRank(run, track);
    }

    const inferredTrainingSpent = Math.max(0, getTrainingRankCount(run.progression?.training) - targetRanks);
    const earnedSkillPoints = Math.max(
      toNumber(run.summary.skillPointsEarned, 0),
      targetRanks,
      inferredTrainingSpent + toNumber(run.progression.skillPointsAvailable, 0)
    );
    const trainingPointsSpent = clamp(Math.max(toNumber(run.progression.trainingPointsSpent, inferredTrainingSpent), inferredTrainingSpent), 0, earnedSkillPoints);
    const earnedClassPoints = Math.max(
      toNumber(run.summary.classPointsEarned, 0),
      targetRanks,
      toNumber(run.progression.classPointsSpent, 0) + toNumber(run.progression.classPointsAvailable, 0)
    );
    const classPointsSpent = clamp(toNumber(run.progression.classPointsSpent, 0), 0, earnedClassPoints);
    const earnedAttributePoints = Math.max(
      toNumber(run.summary.attributePointsEarned, 0),
      targetRanks,
      toNumber(run.progression.attributePointsSpent, 0) + toNumber(run.progression.attributePointsAvailable, 0)
    );
    const attributePointsSpent = clamp(toNumber(run.progression.attributePointsSpent, 0), 0, earnedAttributePoints);

    run.progression.trainingPointsSpent = trainingPointsSpent;
    run.progression.classPointsSpent = classPointsSpent;
    run.progression.attributePointsSpent = attributePointsSpent;
    run.progression.skillPointsAvailable = Math.max(0, earnedSkillPoints - trainingPointsSpent);
    run.progression.classPointsAvailable = Math.max(0, earnedClassPoints - classPointsSpent);
    run.progression.attributePointsAvailable = Math.max(0, earnedAttributePoints - attributePointsSpent);
    run.summary.levelsGained = Math.max(toNumber(run.summary.levelsGained, 0), targetRanks);
    run.summary.skillPointsEarned = earnedSkillPoints;
    run.summary.classPointsEarned = earnedClassPoints;
    run.summary.attributePointsEarned = earnedAttributePoints;
    run.summary.trainingRanksGained = Math.max(toNumber(run.summary.trainingRanksGained, 0), targetRanks);
  }

  function migrateV1ToV2(envelope: Record<string, any>) {
    const run: Record<string, any> = deepClone(envelope.run);
    const legacyLoadout = ensureObjectRecord(run.loadout);

    run.loadout = {
      weapon: buildLegacyEquipmentState(legacyLoadout.weapon || "", "weapon", legacyLoadout.weaponRune || ""),
      armor: buildLegacyEquipmentState(legacyLoadout.armor || "", "armor", legacyLoadout.armorRune || ""),
    };
    run.world = ensureWorld(run.world);
    run.progression = ensureProgression(run, run.progression);
    run.summary = ensureSummary(run.summary);

    return {
      schemaVersion: 2,
      savedAt: envelope.savedAt,
      phase: envelope.phase,
      selectedClassId: envelope.selectedClassId,
      selectedMercenaryId: envelope.selectedMercenaryId,
      run,
    };
  }

  function migrateV2ToV3(envelope: Record<string, any>) {
    const run: Record<string, any> = deepClone(envelope.run);
    run.world = ensureWorld(run.world);
    run.progression = ensureProgression(run, run.progression);
    run.summary = ensureSummary(run.summary);
    syncLevelProgression(run);

    return {
      schemaVersion: 3,
      savedAt: envelope.savedAt,
      phase: envelope.phase,
      selectedClassId: envelope.selectedClassId,
      selectedMercenaryId: envelope.selectedMercenaryId,
      run,
    };
  }

  function migrateV3ToV4(envelope: Record<string, any>) {
    const run: Record<string, any> = deepClone(envelope.run);
    run.world = ensureWorld(run.world);
    run.progression = ensureProgression(run, run.progression);
    run.summary = ensureSummary(run.summary);
    run.inventory = ensureInventory(run, run.inventory);
    run.town = ensureTown(run.town);
    run.loadout = ensureObjectRecord(run.loadout);
    ensureLoadoutEntryIds(run);
    syncLevelProgression(run);

    return {
      schemaVersion: 4,
      savedAt: envelope.savedAt,
      phase: envelope.phase,
      selectedClassId: envelope.selectedClassId,
      selectedMercenaryId: envelope.selectedMercenaryId,
      run,
    };
  }

  function migrateV4ToV5(envelope: Record<string, any>) {
    const run: Record<string, any> = deepClone(envelope.run);
    run.world = ensureWorld(run.world);
    run.progression = ensureProgression(run, run.progression);
    run.summary = ensureSummary(run.summary);
    run.inventory = ensureInventory(run, run.inventory);
    run.town = ensureTown(run.town);
    run.loadout = ensureObjectRecord(run.loadout);
    ensureLoadoutEntryIds(run);
    syncLevelProgression(run);

    return {
      schemaVersion: 5,
      savedAt: envelope.savedAt,
      phase: envelope.phase,
      selectedClassId: envelope.selectedClassId,
      selectedMercenaryId: envelope.selectedMercenaryId,
      run,
    };
  }

  function migrateSnapshot(snapshot: unknown): RunSnapshotEnvelope | null {
    const normalized = normalizeSnapshotEnvelope(snapshot);
    if (!normalized) {
      return null;
    }

    let envelope: Record<string, any> = deepClone(normalized);

    while (envelope.schemaVersion < CURRENT_SCHEMA_VERSION) {
      if (envelope.schemaVersion === 1) {
        envelope = migrateV1ToV2(envelope);
        continue;
      }
      if (envelope.schemaVersion === 2) {
        envelope = migrateV2ToV3(envelope);
        continue;
      }
      if (envelope.schemaVersion === 3) {
        envelope = migrateV3ToV4(envelope);
        continue;
      }
      if (envelope.schemaVersion === 4) {
        envelope = migrateV4ToV5(envelope);
        continue;
      }
      return null;
    }

    if (envelope.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return null;
    }

    envelope.run.world = ensureWorld(envelope.run.world);
    envelope.run.progression = ensureProgression(envelope.run, envelope.run.progression);
    envelope.run.summary = ensureSummary(envelope.run.summary);
    envelope.run.inventory = ensureInventory(envelope.run, envelope.run.inventory);
    envelope.run.town = ensureTown(envelope.run.town);
    envelope.run.loadout = ensureObjectRecord(envelope.run.loadout);
    ensureLoadoutEntryIds(envelope.run);
    syncLevelProgression(envelope.run);
    return envelope as unknown as RunSnapshotEnvelope;
  }

  runtimeWindow.ROUGE_SAVE_MIGRATIONS = {
    CURRENT_SCHEMA_VERSION,
    migrateSnapshot,
  };
})();
