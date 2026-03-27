(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  function getWorldNodeCatalogApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_CATALOG) {
      throw new Error("World-node catalog helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_CATALOG;
  }

  function getCatalog() {
    return getWorldNodeCatalogApi().getCatalog();
  }

  let catalogValidated = false;

  function ensureValidCatalog() {
    if (!catalogValidated) {
      getWorldNodeCatalogApi().assertValidCatalog();
      catalogValidated = true;
    }
  }

  const { slugify } = runtimeWindow.ROUGE_UTILS;

  function describeEffect(effect: RewardChoiceEffect) {
    const content = runtimeWindow.ROUGE_GAME_CONTENT || null;
    const item = effect.itemId ? content?.itemCatalog?.[effect.itemId] || null : null;
    const rune = effect.runeId ? content?.runeCatalog?.[effect.runeId] || null : null;
    const slotLabel = effect.slot
      ? runtimeWindow.ROUGE_ITEM_LOADOUT?.EQUIPMENT_SLOT_LABELS?.[effect.slot] || effect.slot
      : "";

    if (effect.kind === "hero_max_life") {
      return `Hero max Life +${effect.value}.`;
    }
    if (effect.kind === "hero_max_energy") {
      return `Hero max Energy +${effect.value}.`;
    }
    if (effect.kind === "hero_potion_heal") {
      return `Potion healing +${effect.value}.`;
    }
    if (effect.kind === "mercenary_attack") {
      return `Mercenary attack +${effect.value}.`;
    }
    if (effect.kind === "mercenary_max_life") {
      return `Mercenary max Life +${effect.value}.`;
    }
    if (effect.kind === "belt_capacity") {
      return `Belt capacity +${effect.value}.`;
    }
    if (effect.kind === "refill_potions") {
      return `Refill ${effect.value} potion charge${effect.value === 1 ? "" : "s"}.`;
    }
    if (effect.kind === "gold_bonus") {
      return `Gain ${effect.value} extra gold.`;
    }
    if (effect.kind === "equip_item") {
      return `Equip ${item?.name || effect.itemId || "item"}.`;
    }
    if (effect.kind === "grant_item") {
      return `Carry ${item?.name || effect.itemId || "item"}.`;
    }
    if (effect.kind === "grant_rune") {
      return `Carry ${rune?.name || effect.runeId || "rune"}.`;
    }
    if (effect.kind === "add_socket") {
      return `Add 1 socket to ${slotLabel || "gear"}.`;
    }
    if (effect.kind === "socket_rune") {
      return `Socket ${rune?.name || effect.runeId || "rune"} into ${slotLabel || "gear"}.`;
    }
    return "";
  }

  function buildChoice(kind: string, choiceDefinition: WorldNodeChoiceDefinition) {
    const previewLines = choiceDefinition.effects.map((effect: RewardChoiceEffect) => describeEffect(effect)).filter(Boolean);

    return {
      id: `world_node_${kind}_${choiceDefinition.id}`,
      kind,
      title: choiceDefinition.title,
      subtitle: choiceDefinition.subtitle,
      description: choiceDefinition.description,
      previewLines,
      effects: choiceDefinition.effects.map((effect: RewardChoiceEffect) => ({ ...effect })),
    };
  }

  function buildNodeZone(kind: ZoneKind, nodeDefinition: { zoneTitle: string; description: string; id: string }, actSeed: ActSeed, prerequisites: string[], nodeType: string = kind): ZoneState {
    const status: ZoneState["status"] = Array.isArray(prerequisites) && prerequisites.length === 0 ? "available" : "locked";
    return {
      id: `act_${actSeed.act}_${slugify(nodeDefinition.zoneTitle)}`,
      actNumber: actSeed.act,
      title: nodeDefinition.zoneTitle,
      kind,
      zoneRole: kind,
      description: nodeDefinition.description,
      encounterIds: [] as string[],
      encounterTotal: 1,
      encountersCleared: 0,
      visited: false,
      cleared: false,
      status,
      prerequisites: [...prerequisites],
      nodeId: nodeDefinition.id,
      nodeType,
    };
  }

  function getCatalogEntry<K extends keyof WorldNodeCatalog>(key: K, actNumber: number): WorldNodeCatalog[K][number] {
    const catalog = getCatalog();
    const entries = catalog[key];
    if (entries[actNumber]) {
      return entries[actNumber];
    }
    const keys = Object.keys(entries).map(Number).sort((a: number, b: number) => a - b);
    return entries[keys[0]];
  }

  function isShrineOpportunityNodeId(nodeId: string) {
    return Object.values(getCatalog().shrineOpportunities).some((definition: ShrineOpportunityDefinition) => definition.id === nodeId);
  }

  function createQuestZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.QUEST, getCatalogEntry("quests", actSeed.act), actSeed, prerequisites);
  }

  function createShrineZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.SHRINE, getCatalogEntry("shrines", actSeed.act), actSeed, prerequisites);
  }

  function createEventZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.EVENT, getCatalogEntry("events", actSeed.act), actSeed, prerequisites);
  }

  function createOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("opportunities", actSeed.act), actSeed, prerequisites);
  }

  function createCrossroadOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("crossroadOpportunities", actSeed.act), actSeed, prerequisites, "crossroad_opportunity");
  }

  function createShrineOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("shrineOpportunities", actSeed.act), actSeed, prerequisites, "shrine_opportunity");
  }

  function createReserveOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("reserveOpportunities", actSeed.act), actSeed, prerequisites, "reserve_opportunity");
  }

  function createRelayOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("relayOpportunities", actSeed.act), actSeed, prerequisites, "relay_opportunity");
  }

  function createCulminationOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("culminationOpportunities", actSeed.act), actSeed, prerequisites, "culmination_opportunity");
  }

  function createLegacyOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("legacyOpportunities", actSeed.act), actSeed, prerequisites, "legacy_opportunity");
  }

  function createReckoningOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("reckoningOpportunities", actSeed.act), actSeed, prerequisites, "reckoning_opportunity");
  }

  function createRecoveryOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("recoveryOpportunities", actSeed.act), actSeed, prerequisites, "recovery_opportunity");
  }

  function createAccordOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("accordOpportunities", actSeed.act), actSeed, prerequisites, "accord_opportunity");
  }

  function createCovenantOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("covenantOpportunities", actSeed.act), actSeed, prerequisites, "covenant_opportunity");
  }

  function createDetourOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("detourOpportunities", actSeed.act), actSeed, prerequisites, "detour_opportunity");
  }

  function createEscalationOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone(ZONE_KIND.OPPORTUNITY, getCatalogEntry("escalationOpportunities", actSeed.act), actSeed, prerequisites, "escalation_opportunity");
  }

  function createActWorldNodes({
    actSeed,
    openingZoneId,
  }: {
    actSeed: ActSeed;
    openingZoneId: string;
  }): ZoneState[] {
    ensureValidCatalog();
    const questZone = createQuestZone({
      actSeed,
      prerequisites: [openingZoneId],
    });
    const shrineZone = createShrineZone({
      actSeed,
      prerequisites: [openingZoneId],
    });
    const eventZone = createEventZone({
      actSeed,
      prerequisites: [questZone.id],
    });
    const opportunityZone = createOpportunityZone({
      actSeed,
      prerequisites: [eventZone.id],
    });
    const shrineOpportunityZone = createShrineOpportunityZone({
      actSeed,
      prerequisites: [shrineZone.id],
    });
    const crossroadOpportunityZone = createCrossroadOpportunityZone({
      actSeed,
      prerequisites: [eventZone.id, shrineZone.id],
    });
    const reserveOpportunityZone = createReserveOpportunityZone({
      actSeed,
      prerequisites: [opportunityZone.id, shrineOpportunityZone.id, crossroadOpportunityZone.id],
    });
    const relayOpportunityZone = createRelayOpportunityZone({
      actSeed,
      prerequisites: [reserveOpportunityZone.id],
    });
    const culminationOpportunityZone = createCulminationOpportunityZone({
      actSeed,
      prerequisites: [relayOpportunityZone.id],
    });
    const legacyOpportunityZone = createLegacyOpportunityZone({
      actSeed,
      prerequisites: [culminationOpportunityZone.id],
    });
    const reckoningOpportunityZone = createReckoningOpportunityZone({
      actSeed,
      prerequisites: [culminationOpportunityZone.id],
    });
    const recoveryOpportunityZone = createRecoveryOpportunityZone({
      actSeed,
      prerequisites: [culminationOpportunityZone.id],
    });
    const accordOpportunityZone = createAccordOpportunityZone({
      actSeed,
      prerequisites: [culminationOpportunityZone.id],
    });
    const covenantOpportunityZone = createCovenantOpportunityZone({
      actSeed,
      prerequisites: [legacyOpportunityZone.id, reckoningOpportunityZone.id, recoveryOpportunityZone.id, accordOpportunityZone.id],
    });
    const detourOpportunityZone = createDetourOpportunityZone({
      actSeed,
      prerequisites: [covenantOpportunityZone.id],
    });
    const escalationOpportunityZone = createEscalationOpportunityZone({
      actSeed,
      prerequisites: [covenantOpportunityZone.id],
    });
    return [
      questZone,
      shrineZone,
      eventZone,
      opportunityZone,
      shrineOpportunityZone,
      crossroadOpportunityZone,
      reserveOpportunityZone,
      relayOpportunityZone,
      culminationOpportunityZone,
      legacyOpportunityZone,
      reckoningOpportunityZone,
      recoveryOpportunityZone,
      accordOpportunityZone,
      covenantOpportunityZone,
      detourOpportunityZone,
      escalationOpportunityZone,
    ];
  }

  function isWorldNodeZone(zone: ZoneState) {
    return zone?.kind === ZONE_KIND.QUEST || zone?.kind === ZONE_KIND.SHRINE || zone?.kind === ZONE_KIND.EVENT || zone?.kind === ZONE_KIND.OPPORTUNITY;
  }

  runtimeWindow.ROUGE_WORLD_NODE_ZONES = {
    buildChoice,
    getCatalogEntry,
    getQuestDefinition: (actNumber: number) => getCatalogEntry("quests", actNumber),
    getShrineDefinition: (actNumber: number) => getCatalogEntry("shrines", actNumber),
    getEventDefinition: (actNumber: number) => getCatalogEntry("events", actNumber),
    getOpportunityDefinition: (actNumber: number) => getCatalogEntry("opportunities", actNumber),
    getCrossroadOpportunityDefinition: (actNumber: number) => getCatalogEntry("crossroadOpportunities", actNumber),
    getShrineOpportunityDefinition: (actNumber: number) => getCatalogEntry("shrineOpportunities", actNumber),
    getReserveOpportunityDefinition: (actNumber: number) => getCatalogEntry("reserveOpportunities", actNumber),
    getRelayOpportunityDefinition: (actNumber: number) => getCatalogEntry("relayOpportunities", actNumber),
    getCulminationOpportunityDefinition: (actNumber: number) => getCatalogEntry("culminationOpportunities", actNumber),
    getLegacyOpportunityDefinition: (actNumber: number) => getCatalogEntry("legacyOpportunities", actNumber),
    getReckoningOpportunityDefinition: (actNumber: number) => getCatalogEntry("reckoningOpportunities", actNumber),
    getRecoveryOpportunityDefinition: (actNumber: number) => getCatalogEntry("recoveryOpportunities", actNumber),
    getAccordOpportunityDefinition: (actNumber: number) => getCatalogEntry("accordOpportunities", actNumber),
    getCovenantOpportunityDefinition: (actNumber: number) => getCatalogEntry("covenantOpportunities", actNumber),
    getDetourOpportunityDefinition: (actNumber: number) => getCatalogEntry("detourOpportunities", actNumber),
    getEscalationOpportunityDefinition: (actNumber: number) => getCatalogEntry("escalationOpportunities", actNumber),
    isShrineOpportunityNodeId,
    createQuestZone,
    createShrineZone,
    createEventZone,
    createOpportunityZone,
    createCrossroadOpportunityZone,
    createShrineOpportunityZone,
    createReserveOpportunityZone,
    createRelayOpportunityZone,
    createCulminationOpportunityZone,
    createLegacyOpportunityZone,
    createReckoningOpportunityZone,
    createRecoveryOpportunityZone,
    createAccordOpportunityZone,
    createCovenantOpportunityZone,
    createDetourOpportunityZone,
    createEscalationOpportunityZone,
    createActWorldNodes,
    isWorldNodeZone,
  };
})();
