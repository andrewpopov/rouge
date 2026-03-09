(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

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

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function describeEffect(effect) {
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
    return "";
  }

  function buildChoice(kind, choiceDefinition) {
    const previewLines = choiceDefinition.effects.map((effect) => describeEffect(effect)).filter(Boolean);

    return {
      id: `world_node_${kind}_${choiceDefinition.id}`,
      kind,
      title: choiceDefinition.title,
      subtitle: choiceDefinition.subtitle,
      description: choiceDefinition.description,
      previewLines,
      effects: choiceDefinition.effects.map((effect) => ({ ...effect })),
    };
  }

  function buildNodeZone(kind, nodeDefinition, actSeed, prerequisites, nodeType = kind) {
    const status: ZoneState["status"] = Array.isArray(prerequisites) && prerequisites.length === 0 ? "available" : "locked";
    return {
      id: `act_${actSeed.act}_${slugify(nodeDefinition.zoneTitle)}`,
      actNumber: actSeed.act,
      title: nodeDefinition.zoneTitle,
      kind,
      zoneRole: kind,
      description: nodeDefinition.description,
      encounterIds: [],
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

  function getQuestDefinition(actNumber) {
    const quests = getCatalog().quests;
    return quests[actNumber] || quests[1];
  }

  function getShrineDefinition(actNumber) {
    const shrines = getCatalog().shrines;
    return shrines[actNumber] || shrines[1];
  }

  function getEventDefinition(actNumber) {
    const events = getCatalog().events;
    return events[actNumber] || events[1];
  }

  function getOpportunityDefinition(actNumber) {
    const opportunities = getCatalog().opportunities;
    return opportunities[actNumber] || opportunities[1];
  }

  function getCrossroadOpportunityDefinition(actNumber) {
    const crossroadOpportunities = getCatalog().crossroadOpportunities;
    return crossroadOpportunities[actNumber] || crossroadOpportunities[1];
  }

  function getShrineOpportunityDefinition(actNumber) {
    const shrineOpportunities = getCatalog().shrineOpportunities;
    return shrineOpportunities[actNumber] || shrineOpportunities[1];
  }

  function getReserveOpportunityDefinition(actNumber) {
    const reserveOpportunities = getCatalog().reserveOpportunities;
    return reserveOpportunities[actNumber] || reserveOpportunities[1];
  }

  function getRelayOpportunityDefinition(actNumber) {
    const relayOpportunities = getCatalog().relayOpportunities;
    return relayOpportunities[actNumber] || relayOpportunities[1];
  }

  function getCulminationOpportunityDefinition(actNumber) {
    const culminationOpportunities = getCatalog().culminationOpportunities;
    return culminationOpportunities[actNumber] || culminationOpportunities[1];
  }

  function getLegacyOpportunityDefinition(actNumber) {
    const legacyOpportunities = getCatalog().legacyOpportunities;
    return legacyOpportunities[actNumber] || legacyOpportunities[1];
  }

  function getReckoningOpportunityDefinition(actNumber) {
    const reckoningOpportunities = getCatalog().reckoningOpportunities;
    return reckoningOpportunities[actNumber] || reckoningOpportunities[1];
  }

  function getRecoveryOpportunityDefinition(actNumber) {
    const recoveryOpportunities = getCatalog().recoveryOpportunities;
    return recoveryOpportunities[actNumber] || recoveryOpportunities[1];
  }

  function getAccordOpportunityDefinition(actNumber) {
    const accordOpportunities = getCatalog().accordOpportunities;
    return accordOpportunities[actNumber] || accordOpportunities[1];
  }

  function getCovenantOpportunityDefinition(actNumber) {
    const covenantOpportunities = getCatalog().covenantOpportunities;
    return covenantOpportunities[actNumber] || covenantOpportunities[1];
  }

  function getDetourOpportunityDefinition(actNumber) {
    const detourOpportunities = getCatalog().detourOpportunities;
    return detourOpportunities[actNumber] || detourOpportunities[1];
  }

  function getEscalationOpportunityDefinition(actNumber) {
    const escalationOpportunities = getCatalog().escalationOpportunities;
    return escalationOpportunities[actNumber] || escalationOpportunities[1];
  }

  function isShrineOpportunityNodeId(nodeId) {
    return Object.values(getCatalog().shrineOpportunities).some((definition) => definition.id === nodeId);
  }

  function createQuestZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("quest", getQuestDefinition(actSeed.act), actSeed, prerequisites);
  }

  function createShrineZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("shrine", getShrineDefinition(actSeed.act), actSeed, prerequisites);
  }

  function createEventZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("event", getEventDefinition(actSeed.act), actSeed, prerequisites);
  }

  function createOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getOpportunityDefinition(actSeed.act), actSeed, prerequisites);
  }

  function createCrossroadOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getCrossroadOpportunityDefinition(actSeed.act), actSeed, prerequisites, "crossroad_opportunity");
  }

  function createShrineOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getShrineOpportunityDefinition(actSeed.act), actSeed, prerequisites, "shrine_opportunity");
  }

  function createReserveOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getReserveOpportunityDefinition(actSeed.act), actSeed, prerequisites, "reserve_opportunity");
  }

  function createRelayOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getRelayOpportunityDefinition(actSeed.act), actSeed, prerequisites, "relay_opportunity");
  }

  function createCulminationOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getCulminationOpportunityDefinition(actSeed.act), actSeed, prerequisites, "culmination_opportunity");
  }

  function createLegacyOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getLegacyOpportunityDefinition(actSeed.act), actSeed, prerequisites, "legacy_opportunity");
  }

  function createReckoningOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getReckoningOpportunityDefinition(actSeed.act), actSeed, prerequisites, "reckoning_opportunity");
  }

  function createRecoveryOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getRecoveryOpportunityDefinition(actSeed.act), actSeed, prerequisites, "recovery_opportunity");
  }

  function createAccordOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getAccordOpportunityDefinition(actSeed.act), actSeed, prerequisites, "accord_opportunity");
  }

  function createCovenantOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getCovenantOpportunityDefinition(actSeed.act), actSeed, prerequisites, "covenant_opportunity");
  }

  function createDetourOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getDetourOpportunityDefinition(actSeed.act), actSeed, prerequisites, "detour_opportunity");
  }

  function createEscalationOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getEscalationOpportunityDefinition(actSeed.act), actSeed, prerequisites, "escalation_opportunity");
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

  function isWorldNodeZone(zone) {
    return zone?.kind === "quest" || zone?.kind === "shrine" || zone?.kind === "event" || zone?.kind === "opportunity";
  }

  runtimeWindow.ROUGE_WORLD_NODE_ZONES = {
    buildChoice,
    getQuestDefinition,
    getShrineDefinition,
    getEventDefinition,
    getOpportunityDefinition,
    getCrossroadOpportunityDefinition,
    getShrineOpportunityDefinition,
    getReserveOpportunityDefinition,
    getRelayOpportunityDefinition,
    getCulminationOpportunityDefinition,
    getLegacyOpportunityDefinition,
    getReckoningOpportunityDefinition,
    getRecoveryOpportunityDefinition,
    getAccordOpportunityDefinition,
    getCovenantOpportunityDefinition,
    getDetourOpportunityDefinition,
    getEscalationOpportunityDefinition,
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
