(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ITEM_TEMPLATES, RUNE_TEMPLATES, RUNEWORD_TEMPLATES } = runtimeWindow.ROUGE_ITEM_DATA;
  const { clamp, toNumber } = runtimeWindow.ROUGE_UTILS;
  const FALLBACK_ITEM_CATALOG_PROFILES: ItemCatalogProfilesApi = {
    RARITY: {
      WHITE: "white",
      MAGIC: "blue",
      RARE: "yellow",
      UNIQUE: "brown",
      SET: "green",
    },
    SLOT_FAMILY_DEFAULTS: {
      weapon: "Weapon",
      armor: "Body Armor",
      helm: "Helm",
      shield: "Shields",
      gloves: "Gloves",
      boots: "Boots",
      belt: "Belts",
      ring: "Rings",
      amulet: "Amulets",
    },
    normalizeRarity(rarity: unknown) {
      return String(rarity || "white");
    },
    getRarityKind(rarity: string | undefined) {
      return String(rarity || "white");
    },
    getRarityLabel(rarity: string | undefined) {
      return String(rarity || "white");
    },
    cloneWeaponProfile(profile: WeaponCombatProfile | null | undefined) {
      return profile ? { ...profile } : undefined;
    },
    cloneArmorProfile(profile: ArmorMitigationProfile | null | undefined) {
      return profile ? { ...profile } : undefined;
    },
    buildDefaultWeaponProfile() {
      return undefined;
    },
    buildDefaultArmorProfile() {
      return undefined;
    },
    mergeWeaponProfiles(baseProfile: WeaponCombatProfile | null | undefined, overrideProfile: WeaponCombatProfile | null | undefined) {
      return { ...(baseProfile || {}), ...(overrideProfile || {}) } as WeaponCombatProfile;
    },
    mergeArmorProfiles(baseProfile: ArmorMitigationProfile | null | undefined, overrideProfile: ArmorMitigationProfile | null | undefined) {
      return { ...(baseProfile || {}), ...(overrideProfile || {}) } as ArmorMitigationProfile;
    },
    getWeaponProfileForRarity(profile: WeaponCombatProfile | null | undefined) {
      return profile ? { ...profile } : undefined;
    },
    getArmorProfileForRarity(profile: ArmorMitigationProfile | null | undefined) {
      return profile ? { ...profile } : undefined;
    },
    buildEquipmentWeaponProfile() {
      return undefined;
    },
    buildEquipmentArmorProfile() {
      return undefined;
    },
    rollWeaponAffixes() {
      return undefined;
    },
    rollArmorAffixes() {
      return undefined;
    },
    rollItemRarity() {
      return "white";
    },
    generateRarityBonuses() {
      return {};
    },
  };
  const itemCatalogProfiles = runtimeWindow.__ROUGE_ITEM_CATALOG_PROFILES || FALLBACK_ITEM_CATALOG_PROFILES;
  const {
    SLOT_FAMILY_DEFAULTS,
    buildDefaultArmorProfile,
    buildDefaultWeaponProfile,
    mergeArmorProfiles,
    mergeWeaponProfiles,
  } = itemCatalogProfiles;

  function toItemDefinition(seedEntry: Record<string, unknown> | null, templateId: string, template: ItemTemplateDefinition) {
    const slot = template.slot as EquipmentSlot;
    const family = template.family || (seedEntry?.family as string) || (SLOT_FAMILY_DEFAULTS[slot] || "Gear");
    return {
      id: templateId,
      sourceId: template.sourceId,
      name: (seedEntry?.name as string) || template.sourceId,
      slot,
      family,
      summary: (seedEntry?.summary as string) || "A salvaged piece of gear adapted for Rogue's persistent build growth.",
      actRequirement: template.actRequirement,
      progressionTier: template.progressionTier,
      maxSockets: clamp(toNumber((seedEntry?.stats as Record<string, unknown>)?.socketsMax, 2), 0, 3),
      bonuses: { ...template.bonuses },
      weaponProfile: mergeWeaponProfiles(
        buildDefaultWeaponProfile(slot, family, template.progressionTier),
        template.weaponProfile
      ),
      armorProfile: mergeArmorProfiles(
        buildDefaultArmorProfile(slot, template.progressionTier),
        template.armorProfile
      ),
    };
  }

  function toRuneDefinition(seedEntry: Record<string, unknown> | null, templateId: string, template: RuneTemplateDefinition) {
    return {
      id: templateId,
      sourceId: template.sourceId,
      name: (seedEntry?.name as string) || template.sourceId,
      allowedSlots: [...template.allowedSlots] as Array<EquipmentSlot>,
      rank: (seedEntry?.rank as number) || 1,
      progressionTier: template.progressionTier,
      summary: (seedEntry?.summary as string) || "A socketable rune adapted for Rogue's runeword seam.",
      bonuses: { ...template.bonuses },
    };
  }

  function toRunewordDefinition(
    seedEntry: Record<string, unknown> | null,
    runewordId: string,
    template: RunewordTemplateDefinition,
    runeCatalog: Record<string, RuntimeRuneDefinition>
  ) {
    const progressionTier = template.requiredRunes.reduce((highestTier: number, runeId: string) => {
      const rune = runeCatalog?.[runeId] || null;
      return Math.max(highestTier, toNumber(rune?.progressionTier, 1));
    }, 1);
    return {
      id: runewordId,
      sourceId: template.sourceId,
      name: (seedEntry?.name as string) || runewordId,
      slot: template.slot as EquipmentSlot,
      familyAllowList: [...(template.familyAllowList || [])],
      progressionTier,
      socketCount: template.requiredRunes.length,
      requiredRunes: [...template.requiredRunes],
      summary: (seedEntry?.summary as string) || "A simplified runeword route for Rogue's progression layer.",
      bonuses: { ...template.bonuses },
    };
  }

  function createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle | null) {
    const itemEntries = Array.isArray((seedBundle?.items as Record<string, unknown>)?.entries) ? (seedBundle!.items as Record<string, unknown>).entries as Record<string, unknown>[] : [];
    const runeEntries = Array.isArray((seedBundle?.runes as Record<string, unknown>)?.entries) ? (seedBundle!.runes as Record<string, unknown>).entries as Record<string, unknown>[] : [];
    const runewordEntries = Array.isArray((seedBundle?.runewords as Record<string, unknown>)?.entries) ? (seedBundle!.runewords as Record<string, unknown>).entries as Record<string, unknown>[] : [];
    const itemCatalog: Record<string, RuntimeItemDefinition> = {};
    const runeCatalog: Record<string, RuntimeRuneDefinition> = {};
    const runewordCatalog: Record<string, RuntimeRunewordDefinition> = {};

    Object.entries(ITEM_TEMPLATES).forEach(([templateId, template]: [string, ItemTemplateDefinition]) => {
      const seedEntry = itemEntries.find((entry: Record<string, unknown>) => entry.id === template.sourceId) || null;
      itemCatalog[templateId] = toItemDefinition(seedEntry, templateId, template);
    });

    Object.entries(RUNE_TEMPLATES).forEach(([templateId, template]: [string, RuneTemplateDefinition]) => {
      const seedEntry = runeEntries.find((entry: Record<string, unknown>) => entry.id === template.sourceId) || null;
      runeCatalog[templateId] = toRuneDefinition(seedEntry, templateId, template);
    });

    Object.entries(RUNEWORD_TEMPLATES).forEach(([runewordId, template]: [string, RunewordTemplateDefinition]) => {
      const seedEntry = runewordEntries.find((entry: Record<string, unknown>) => entry.id === template.sourceId) || null;
      runewordCatalog[runewordId] = toRunewordDefinition(seedEntry, runewordId, template, runeCatalog);
    });

    return {
      ...baseContent,
      itemCatalog,
      runeCatalog,
      runewordCatalog,
    };
  }

  runtimeWindow.__ROUGE_ITEM_CATALOG_RUNTIME_CONTENT = {
    createRuntimeContent,
  };
})();
