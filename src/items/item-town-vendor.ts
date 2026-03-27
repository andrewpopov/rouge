(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    buildHydratedLoadout,


    toNumber,
    uniquePush,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const {
    createDefaultTownState,
    hydrateProfileStash,
    normalizeInventoryEntry,
  } = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const {
    getAccountEconomyFeatures,

    getPlannedRunewordTargets,
    getPlannedRunewordArchiveState,
    hasOpenPlanningCharter,
    getPlanningSummary,
    getTargetRunewordForEquipment,
    getStashPlanningPressure,
  } = runtimeWindow.__ROUGE_ITEM_TOWN_PRICING;
  const {
    pickVendorEquipmentOffers,
    fillDefinitionSelection,
  } = runtimeWindow.__ROUGE_ITEM_TOWN_VENDOR_OFFERS;
  const { ENTRY_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  function buildVendorEntryId(run: RunState, index: number) {
    return `vendor_${run.actNumber}_${toNumber(run.town?.vendor?.refreshCount, 0)}_${index}`;
  }

  function getVendorTierAllowance(run: RunState, profile: ProfileState | null = null) {
    const features = getAccountEconomyFeatures(profile);
    const chroniclePressure = features.chronicleExchange;
    return (
      Math.min(2, Math.floor(Math.max(0, toNumber(run.level, 1) - 1) / 3)) +
      Math.min(1, toNumber(run.progression?.bossTrophies?.length, 0)) +
      Math.min(1, Math.floor(Math.max(0, toNumber(run.town?.vendor?.refreshCount, 0)) / 2)) +
      Number(features.advancedVendorStock) +
      Number(features.brokerageCharter && run.actNumber >= 4) +
      Number(features.artisanStock && run.actNumber >= 5) +
      Number(features.merchantPrincipate && run.actNumber >= 5) +
      Number(features.tradeHegemony && run.actNumber >= 5) +
      Number(chroniclePressure && run.actNumber >= 4) +
      Number(features.sovereignExchange && run.actNumber >= 4) +
      Number(features.paragonExchange && run.actNumber >= 5) +
      Number(features.ascendantExchange && run.actNumber >= 5) +
      Number(features.imperialExchange && run.actNumber >= 5) +
      Number(features.mythicExchange && run.actNumber >= 5) +
      Number(features.treasuryExchange && run.actNumber >= 5)
    );
  }

  function pickVendorRuneOffers(run: RunState, runeOptions: RuntimeRuneDefinition[], desiredCount: number, seed: number, content: GameContent, profile: ProfileState | null = null) {
    if (runeOptions.length === 0 || desiredCount <= 0) {
      return [];
    }

    const features = getAccountEconomyFeatures(profile);
    const loadout = buildHydratedLoadout(run, content);
    const targetRuneIds: string[] = [];
    (["weapon", "armor"] as const).forEach((slot) => {
      const equipment = loadout[slot];
      const runeword = getTargetRunewordForEquipment(equipment, run, content, profile);
      if (!equipment || !runeword || equipment.insertedRunes.length >= runeword.requiredRunes.length) {
        return;
      }
      const targetCount = features.runewordCodex ? 2 : 1 + Number(run.actNumber >= 3);
      const codexTargets = runeword.requiredRunes.slice(equipment.insertedRunes.length, equipment.insertedRunes.length + targetCount);
      codexTargets.forEach((runeId: string) => uniquePush(targetRuneIds, runeId));
    });
    if (features.treasuryExchange) {
      const stashEquipment = (Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [])
        .filter((entry: InventoryEntry) => entry?.kind === ENTRY_KIND.EQUIPMENT)
        .map((entry: InventoryEntry) => (entry as InventoryEquipmentEntry).equipment)
        .filter(Boolean);
      stashEquipment.forEach((equipment: RunEquipmentState) => {
        const runeword = getTargetRunewordForEquipment(equipment, run, content, profile);
        if (!equipment || !runeword || equipment.insertedRunes.length >= runeword.requiredRunes.length) {
          return;
        }
        runeword.requiredRunes
          .slice(equipment.insertedRunes.length, equipment.insertedRunes.length + 2)
          .forEach((runeId: string) => uniquePush(targetRuneIds, runeId));
      });
    }
    if (features.runewordCodex || features.treasuryExchange) {
      const planning = getPlanningSummary(profile, content);
      getPlannedRunewordTargets(profile, content).forEach((runeword: RuntimeRunewordDefinition) => {
        const archiveState = getPlannedRunewordArchiveState(profile, runeword.slot, content);
        const planningCharter = runeword.slot === "weapon" ? planning.weaponCharter : planning.armorCharter;
        const planningTargetCount =
          2 +
          Number(archiveState.unfulfilled && (features.treasuryExchange || features.economyFocus)) +
          Number(archiveState.unfulfilled && features.chronicleExchange) +
          Number(toNumber(archiveState.completedRunCount, 0) > 0 && planningCharter?.hasReadyBase) +
          Number(run.actNumber >= 5 && features.paragonExchange) +
          Number(run.actNumber >= 5 && features.merchantPrincipate) +
          Number(run.actNumber >= 5 && features.tradeHegemony) +
          Number(archiveState.unfulfilled && features.sovereignExchange) +
          Number(run.actNumber >= 5 && features.ascendantExchange) +
          Number(archiveState.unfulfilled && features.imperialExchange) +
          Number(run.actNumber >= 5 && features.mythicExchange);
        runeword.requiredRunes.slice(0, planningTargetCount).forEach((runeId: string) => uniquePush(targetRuneIds, runeId));
      });
    }

    const targetRunes = targetRuneIds
      .map((runeId: string) => runeOptions.find((rune: RuntimeRuneDefinition) => rune.id === runeId) || null)
      .filter(Boolean);
    const premiumRune = runeOptions[Math.max(0, runeOptions.length - 1)] || null;
    const supportRune = runeOptions[Math.max(0, runeOptions.length - 2)] || null;
    const codexRune = features.runewordCodex ? runeOptions[Math.max(0, runeOptions.length - 3)] || null : null;
    const artisanRune = features.artisanStock && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 4)] || null : null;
    const treasuryRune = features.treasuryExchange && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 5)] || null : null;
    const merchantRune = features.merchantPrincipate && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 6)] || null : null;
    const sovereignRune = features.sovereignExchange && run.actNumber >= 4 ? runeOptions[Math.max(0, runeOptions.length - 7)] || null : null;
    const ascendantRune = features.ascendantExchange && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 8)] || null : null;
    const hegemonyRune = features.tradeHegemony && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 9)] || null : null;
    const imperialRune = features.imperialExchange && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 10)] || null : null;
    const mythicRune = features.mythicExchange && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 11)] || null : null;
    const seededRune = runeOptions[seed % runeOptions.length] || null;

    const { pickUniqueDefinitions } = runtimeWindow.__ROUGE_ITEM_TOWN_VENDOR_OFFERS;
    return pickUniqueDefinitions(
      [...(targetRunes || []), premiumRune, supportRune, codexRune, artisanRune, treasuryRune, merchantRune, sovereignRune, ascendantRune, hegemonyRune, imperialRune, mythicRune, seededRune],
      runeOptions,
      desiredCount,
      seed
    );
  }

  function generateVendorStock(run: RunState, content: GameContent, profile: ProfileState | null = null) {
    if (profile) {
      hydrateProfileStash(profile, content);
    }
    const features = getAccountEconomyFeatures(profile);
    const tierAllowance = getVendorTierAllowance(run, profile);
    const maxTier = Math.max(1, run.actNumber + tierAllowance);
    const itemSeed = run.actNumber * 13 + toNumber(run.town?.vendor?.refreshCount, 0) * 7 + run.level * 3 + run.summary.zonesCleared;
    const runeSeed = run.actNumber * 11 + toNumber(run.town?.vendor?.refreshCount, 0) * 5 + run.summary.encountersCleared;
    const weaponOptions = (Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[])
      .filter((item: RuntimeItemDefinition) => item.slot === "weapon" && item.progressionTier <= maxTier)
      .sort((left: RuntimeItemDefinition, right: RuntimeItemDefinition) => left.progressionTier - right.progressionTier);
    const armorOptions = (Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[])
      .filter((item: RuntimeItemDefinition) => item.slot === "armor" && item.progressionTier <= maxTier)
      .sort((left: RuntimeItemDefinition, right: RuntimeItemDefinition) => left.progressionTier - right.progressionTier);
    const runeOptions = (Object.values(content.runeCatalog || {}) as RuntimeRuneDefinition[])
      .filter((rune: RuntimeRuneDefinition) => rune.progressionTier <= maxTier + 1 + Number(features.runewordCodex))
      .sort((left: RuntimeRuneDefinition, right: RuntimeRuneDefinition) => left.progressionTier - right.progressionTier);

    const stock: InventoryEntry[] = [];
    const loadout = buildHydratedLoadout(run, content);
    const focusOfferBonus = Number(features.economyFocus && (features.advancedVendorStock || features.salvageTithes));
    const artisanOfferBonus = Number(features.artisanStock && run.actNumber >= 5);
    const brokerageOfferBonus = Number(features.brokerageCharter && run.actNumber >= 4);
    const merchantOfferBonus = Number(features.merchantPrincipate && run.actNumber >= 5);
    const hegemonyOfferBonus = Number(features.tradeHegemony && run.actNumber >= 5);
    const chronicleOfferBonus =
      Number(features.chronicleExchange && run.actNumber >= 4) +
      Number(features.chronicleExchange && (hasOpenPlanningCharter(profile, content) || getStashPlanningPressure(profile).stashEntries > 0));
    const sovereignOfferBonus =
      Number(features.sovereignExchange && run.actNumber >= 4) +
      Number(features.sovereignExchange && (hasOpenPlanningCharter(profile, content) || getStashPlanningPressure(profile).socketReadyEntries > 0));
    const paragonOfferBonus = Number(features.paragonExchange && run.actNumber >= 5);
    const ascendantOfferBonus = Number(features.ascendantExchange && run.actNumber >= 5);
    const imperialOfferBonus =
      Number(features.imperialExchange && run.actNumber >= 5) +
      Number(features.imperialExchange && (hasOpenPlanningCharter(profile, content) || getStashPlanningPressure(profile).socketReadyEntries > 0));
    const mythicOfferBonus = Number(features.mythicExchange && run.actNumber >= 5);
    const treasuryOfferBonus = Number(features.treasuryExchange && run.actNumber >= 5);
    const sharedOfferBonus =
      focusOfferBonus + artisanOfferBonus + brokerageOfferBonus + merchantOfferBonus +
      hegemonyOfferBonus + chronicleOfferBonus + sovereignOfferBonus + paragonOfferBonus +
      ascendantOfferBonus + imperialOfferBonus + mythicOfferBonus + treasuryOfferBonus;
    const weaponOfferCount =
      (run.actNumber >= 5 ? 3 : 1 + Number(run.actNumber >= 4)) +
      Number(features.advancedVendorStock) + sharedOfferBonus;
    const armorOfferCount =
      (run.actNumber >= 5 ? 3 : 1 + Number(run.actNumber >= 3)) +
      Number(features.advancedVendorStock) + sharedOfferBonus;
    const runeOfferCount =
      (run.actNumber >= 5 ? 5 : 3 + Number(run.actNumber >= 3)) +
      Number(features.advancedVendorStock) + Number(features.runewordCodex) + sharedOfferBonus;
    const selectedWeapons = fillDefinitionSelection(
      pickVendorEquipmentOffers(
      "weapon",
      run,
      loadout.weapon,
      weaponOptions,
      weaponOfferCount,
      itemSeed,
      content,
      profile
      ),
      weaponOptions,
      weaponOfferCount
    );
    const selectedArmor = fillDefinitionSelection(
      pickVendorEquipmentOffers(
      "armor",
      run,
      loadout.armor,
      armorOptions,
      armorOfferCount,
      itemSeed + 3,
      content,
      profile
      ),
      armorOptions,
      armorOfferCount
    );
    const selectedRunes = fillDefinitionSelection(
      pickVendorRuneOffers(run, runeOptions, runeOfferCount, runeSeed, content, profile),
      runeOptions,
      runeOfferCount
    );

    [...selectedWeapons, ...selectedArmor].filter(Boolean).forEach((item: RuntimeItemDefinition, index: number) => {
      stock.push({
        entryId: buildVendorEntryId(run, index),
        kind: ENTRY_KIND.EQUIPMENT,
        equipment: {
          entryId: "",
          itemId: item.id,
          slot: item.slot,
          socketsUnlocked: 0,
          insertedRunes: [],
          runewordId: "",
        },
      });
    });

    selectedRunes.filter(Boolean).forEach((rune: RuntimeRuneDefinition, index: number) => {
      stock.push({
        entryId: buildVendorEntryId(run, index + selectedWeapons.length + selectedArmor.length),
        kind: ENTRY_KIND.RUNE,
        runeId: rune.id,
      });
    });

    return stock;
  }

  function normalizeVendorStock(run: RunState, content: GameContent, profile: ProfileState | null = null) {
    run.town = {
      ...createDefaultTownState(),
      ...(run.town || {}),
      vendor: {
        ...createDefaultTownState().vendor,
        ...(run.town?.vendor || {}),
      },
    };

    const stock = Array.isArray(run.town.vendor.stock) ? run.town.vendor.stock : [];
    const normalized = stock
      .map((entry: unknown, index: number) => normalizeInventoryEntry(entry, run, content, buildVendorEntryId(run, index)))
      .filter(Boolean);

    run.town.vendor.stock = normalized.length > 0 ? normalized : generateVendorStock(run, content, profile);
  }

  runtimeWindow.__ROUGE_ITEM_TOWN_VENDOR = {
    generateVendorStock,
    normalizeVendorStock,
  };
})();
