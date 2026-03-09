(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getWorldNodeCatalogApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_CATALOG) {
      throw new Error("World-node catalog helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_CATALOG;
  }

  function getCatalog(): WorldNodeCatalog {
    return getWorldNodeCatalogApi().getCatalog();
  }

  function assertValidCatalog() {
    getWorldNodeCatalogApi().assertValidCatalog();
  }

  function getWorldNodeZonesApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_ZONES) {
      throw new Error("World-node zones helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_ZONES;
  }

  function buildChoice(kind, choiceDefinition) {
    return getWorldNodeZonesApi().buildChoice(kind, choiceDefinition);
  }

  function getQuestDefinition(actNumber) {
    return getWorldNodeZonesApi().getQuestDefinition(actNumber);
  }

  function getShrineDefinition(actNumber) {
    return getWorldNodeZonesApi().getShrineDefinition(actNumber);
  }

  function isShrineOpportunityNodeId(nodeId) {
    return getWorldNodeZonesApi().isShrineOpportunityNodeId(nodeId);
  }

  function getWorldNodeVariantsApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_VARIANTS) {
      throw new Error("World-node variant helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_VARIANTS;
  }

  function resolveEventFollowUp(run, actNumber) {
    return getWorldNodeVariantsApi().resolveEventFollowUp(run, actNumber);
  }

  function resolveOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveOpportunityVariant(run, actNumber);
  }

  function resolveCrossroadOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveCrossroadOpportunityVariant(run, actNumber);
  }

  function resolveShrineOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveShrineOpportunityVariant(run, actNumber);
  }

  function resolveReserveOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveReserveOpportunityVariant(run, actNumber);
  }

  function resolveRelayOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveRelayOpportunityVariant(run, actNumber);
  }

  function resolveCulminationOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveCulminationOpportunityVariant(run, actNumber);
  }

  function resolveLegacyOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveLegacyOpportunityVariant(run, actNumber);
  }

  function resolveReckoningOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveReckoningOpportunityVariant(run, actNumber);
  }

  function resolveRecoveryOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveRecoveryOpportunityVariant(run, actNumber);
  }

  function resolveAccordOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveAccordOpportunityVariant(run, actNumber);
  }

  function resolveCovenantOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveCovenantOpportunityVariant(run, actNumber);
  }

  function resolveDetourOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveDetourOpportunityVariant(run, actNumber);
  }

  function resolveEscalationOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveEscalationOpportunityVariant(run, actNumber);
  }

  function buildZoneReward({ run, zone }) {
    const actNumber = zone?.actNumber || run?.actNumber || 1;

    if (zone.kind === "quest") {
      const definition = getQuestDefinition(actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: definition.title,
        lines: [
          definition.summary,
          "This node resolves immediately and clears the route once you choose an outcome.",
          `${zone.title} is now clear.`,
        ],
        grants: { ...definition.grants },
        choices: definition.choices.map((choiceDefinition) => buildChoice("quest", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "shrine") {
      const definition = getShrineDefinition(actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: definition.title,
        lines: [
          definition.summary,
          "Shrines resolve immediately and apply their blessing through the normal reward seam.",
          `${zone.title} is now clear.`,
        ],
        grants: { ...definition.grants },
        choices: definition.choices.map((choiceDefinition) => buildChoice("shrine", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "event") {
      const { eventDefinition, questRecord, followUp } = resolveEventFollowUp(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: followUp.title || eventDefinition.title,
        lines: [
          eventDefinition.summary,
          `Earlier quest result: ${questRecord.outcomeTitle}.`,
          followUp.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...eventDefinition.grants, ...(followUp.grants || {}) },
        choices: followUp.choices.map((choiceDefinition) => buildChoice("event", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "shrine_opportunity") {
      const { shrineOpportunityDefinition, shrineRecord, variant } = resolveShrineOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || shrineOpportunityDefinition.title,
        lines: [
          shrineOpportunityDefinition.summary,
          `Earlier shrine result: ${shrineRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...shrineOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "crossroad_opportunity") {
      const { crossroadOpportunityDefinition, questRecord, shrineRecord, variant } = resolveCrossroadOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || crossroadOpportunityDefinition.title,
        lines: [
          crossroadOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine result: ${shrineRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...crossroadOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "reserve_opportunity") {
      const { reserveOpportunityDefinition, opportunityRecord, shrineOpportunityRecord, crossroadOpportunityRecord, variant } =
        resolveReserveOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || reserveOpportunityDefinition.title,
        lines: [
          reserveOpportunityDefinition.summary,
          `Earlier route lane: ${opportunityRecord.outcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...reserveOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "relay_opportunity") {
      const { relayOpportunityDefinition, reserveOpportunityRecord, variant } = resolveRelayOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || relayOpportunityDefinition.title,
        lines: [
          relayOpportunityDefinition.summary,
          `Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...relayOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "culmination_opportunity") {
      const { culminationOpportunityDefinition, questRecord, relayOpportunityRecord, variant } = resolveCulminationOpportunityVariant(
        run,
        actNumber
      );
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || culminationOpportunityDefinition.title,
        lines: [
          culminationOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier relay lane: ${relayOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...culminationOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "legacy_opportunity") {
      const { legacyOpportunityDefinition, questRecord, culminationOpportunityRecord, variant } = resolveLegacyOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || legacyOpportunityDefinition.title,
        lines: [
          legacyOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...legacyOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "reckoning_opportunity") {
      const { reckoningOpportunityDefinition, questRecord, reserveOpportunityRecord, culminationOpportunityRecord, variant } =
        resolveReckoningOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || reckoningOpportunityDefinition.title,
        lines: [
          reckoningOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...reckoningOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "recovery_opportunity") {
      const { recoveryOpportunityDefinition, questRecord, shrineOpportunityRecord, culminationOpportunityRecord, variant } =
        resolveRecoveryOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || recoveryOpportunityDefinition.title,
        lines: [
          recoveryOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...recoveryOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "accord_opportunity") {
      const {
        accordOpportunityDefinition,
        questRecord,
        shrineOpportunityRecord,
        crossroadOpportunityRecord,
        culminationOpportunityRecord,
        variant,
      } = resolveAccordOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || accordOpportunityDefinition.title,
        lines: [
          accordOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...accordOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "covenant_opportunity") {
      const {
        covenantOpportunityDefinition,
        questRecord,
        legacyOpportunityRecord,
        reckoningOpportunityRecord,
        recoveryOpportunityRecord,
        accordOpportunityRecord,
        variant,
      } = resolveCovenantOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || covenantOpportunityDefinition.title,
        lines: [
          covenantOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...covenantOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "detour_opportunity") {
      const {
        accordOpportunityRecord,
        covenantOpportunityRecord,
        detourOpportunityDefinition,
        questRecord,
        recoveryOpportunityRecord,
        variant,
      } = resolveDetourOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || detourOpportunityDefinition.title,
        lines: [
          detourOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...detourOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "escalation_opportunity") {
      const {
        covenantOpportunityRecord,
        escalationOpportunityDefinition,
        legacyOpportunityRecord,
        questRecord,
        reckoningOpportunityRecord,
        variant,
      } = resolveEscalationOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || escalationOpportunityDefinition.title,
        lines: [
          escalationOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...escalationOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    const { opportunityDefinition, questRecord, variant } = resolveOpportunityVariant(run, actNumber);
    return {
      zoneId: zone.id,
      zoneTitle: zone.title,
      kind: zone.kind,
      title: variant.title || opportunityDefinition.title,
      lines: [
        opportunityDefinition.summary,
        `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
        variant.summary,
        `${zone.title} is now clear.`,
      ],
      grants: { ...opportunityDefinition.grants, ...(variant.grants || {}) },
      choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
      encounterNumber: 1,
      clearsZone: true,
      endsAct: false,
      endsRun: false,
      heroLifeAfterFight: run.hero.currentLife,
      mercenaryLifeAfterFight: run.mercenary.currentLife,
    };
  }

  function applyChoice(run, reward, choice) {
    if (!runtimeWindow.ROUGE_WORLD_NODE_OUTCOMES) {
      return { ok: false, message: "World-node outcome helper is unavailable." };
    }
    return runtimeWindow.ROUGE_WORLD_NODE_OUTCOMES.applyChoice(run, reward, choice, {
      isShrineOpportunityNodeId,
    });
  }

  assertValidCatalog();
  const worldNodeZones = getWorldNodeZonesApi();

  runtimeWindow.ROUGE_WORLD_NODES = {
    getCatalog,
    assertValidCatalog,
    createQuestZone: worldNodeZones.createQuestZone,
    createShrineZone: worldNodeZones.createShrineZone,
    createEventZone: worldNodeZones.createEventZone,
    createOpportunityZone: worldNodeZones.createOpportunityZone,
    createCrossroadOpportunityZone: worldNodeZones.createCrossroadOpportunityZone,
    createShrineOpportunityZone: worldNodeZones.createShrineOpportunityZone,
    createReserveOpportunityZone: worldNodeZones.createReserveOpportunityZone,
    createRelayOpportunityZone: worldNodeZones.createRelayOpportunityZone,
    createCulminationOpportunityZone: worldNodeZones.createCulminationOpportunityZone,
    createLegacyOpportunityZone: worldNodeZones.createLegacyOpportunityZone,
    createReckoningOpportunityZone: worldNodeZones.createReckoningOpportunityZone,
    createRecoveryOpportunityZone: worldNodeZones.createRecoveryOpportunityZone,
    createAccordOpportunityZone: worldNodeZones.createAccordOpportunityZone,
    createCovenantOpportunityZone: worldNodeZones.createCovenantOpportunityZone,
    createDetourOpportunityZone: worldNodeZones.createDetourOpportunityZone,
    createEscalationOpportunityZone: worldNodeZones.createEscalationOpportunityZone,
    createActWorldNodes: worldNodeZones.createActWorldNodes,
    isWorldNodeZone: worldNodeZones.isWorldNodeZone,
    buildZoneReward,
    applyChoice,
  };
})();
