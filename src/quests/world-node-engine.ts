(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;

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

  function buildChoice(kind: string, choiceDefinition: WorldNodeChoiceDefinition) {
    return getWorldNodeZonesApi().buildChoice(kind, choiceDefinition);
  }

  function getQuestDefinition(actNumber: number) {
    return getWorldNodeZonesApi().getQuestDefinition(actNumber);
  }

  function getShrineDefinition(actNumber: number) {
    return getWorldNodeZonesApi().getShrineDefinition(actNumber);
  }

  function isShrineOpportunityNodeId(nodeId: string) {
    return getWorldNodeZonesApi().isShrineOpportunityNodeId(nodeId);
  }

  function getWorldNodeVariantsApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_VARIANTS) {
      throw new Error("World-node variant helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_VARIANTS;
  }

  function buildNodeReward(run: RunState, zone: ZoneState, definition: { title: string; summary: string; grants: RewardGrants }, variant: WorldNodeRewardDefinition, choiceKind: string, contextLines: string[]) {
    return {
      zoneId: zone.id,
      zoneTitle: zone.title,
      kind: zone.kind,
      title: variant.title || definition.title,
      lines: [
        definition.summary,
        ...contextLines,
        variant.summary,
        `${zone.title} is now clear.`,
      ],
      grants: { ...definition.grants, ...(variant.grants || {}) },
      choices: variant.choices.map((choiceDefinition: WorldNodeChoiceDefinition) => buildChoice(choiceKind, choiceDefinition)),
      encounterNumber: 1,
      clearsZone: true,
      endsAct: false,
      endsRun: false,
      heroLifeAfterFight: run.hero.currentLife,
      mercenaryLifeAfterFight: run.mercenary.currentLife,
    };
  }

  const opportunityResolvers = {
    shrine_opportunity(run: RunState, actNumber: number) {
      const { shrineOpportunityDefinition, shrineRecord, variant } =
        getWorldNodeVariantsApi().resolveShrineOpportunityVariant(run, actNumber);
      return {
        definition: shrineOpportunityDefinition,
        variant,
        contextLines: [`Earlier shrine result: ${shrineRecord.outcomeTitle}.`],
      };
    },
    crossroad_opportunity(run: RunState, actNumber: number) {
      const { crossroadOpportunityDefinition, questRecord, shrineRecord, variant } =
        getWorldNodeVariantsApi().resolveCrossroadOpportunityVariant(run, actNumber);
      return {
        definition: crossroadOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine result: ${shrineRecord.outcomeTitle}.`,
        ],
      };
    },
    reserve_opportunity(run: RunState, actNumber: number) {
      const { reserveOpportunityDefinition, opportunityRecord, shrineOpportunityRecord, crossroadOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveReserveOpportunityVariant(run, actNumber);
      return {
        definition: reserveOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier route lane: ${opportunityRecord.outcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    relay_opportunity(run: RunState, actNumber: number) {
      const { relayOpportunityDefinition, reserveOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveRelayOpportunityVariant(run, actNumber);
      return {
        definition: relayOpportunityDefinition,
        variant,
        contextLines: [`Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`],
      };
    },
    culmination_opportunity(run: RunState, actNumber: number) {
      const { culminationOpportunityDefinition, questRecord, relayOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveCulminationOpportunityVariant(run, actNumber);
      return {
        definition: culminationOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier relay lane: ${relayOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    legacy_opportunity(run: RunState, actNumber: number) {
      const { legacyOpportunityDefinition, questRecord, culminationOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveLegacyOpportunityVariant(run, actNumber);
      return {
        definition: legacyOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    reckoning_opportunity(run: RunState, actNumber: number) {
      const { reckoningOpportunityDefinition, questRecord, reserveOpportunityRecord, culminationOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveReckoningOpportunityVariant(run, actNumber);
      return {
        definition: reckoningOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    recovery_opportunity(run: RunState, actNumber: number) {
      const { recoveryOpportunityDefinition, questRecord, shrineOpportunityRecord, culminationOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveRecoveryOpportunityVariant(run, actNumber);
      return {
        definition: recoveryOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    accord_opportunity(run: RunState, actNumber: number) {
      const {
        accordOpportunityDefinition,
        questRecord,
        shrineOpportunityRecord,
        crossroadOpportunityRecord,
        culminationOpportunityRecord,
        variant,
      } = getWorldNodeVariantsApi().resolveAccordOpportunityVariant(run, actNumber);
      return {
        definition: accordOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    covenant_opportunity(run: RunState, actNumber: number) {
      const {
        covenantOpportunityDefinition,
        questRecord,
        legacyOpportunityRecord,
        reckoningOpportunityRecord,
        recoveryOpportunityRecord,
        accordOpportunityRecord,
        variant,
      } = getWorldNodeVariantsApi().resolveCovenantOpportunityVariant(run, actNumber);
      return {
        definition: covenantOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    detour_opportunity(run: RunState, actNumber: number) {
      const {
        accordOpportunityRecord,
        covenantOpportunityRecord,
        detourOpportunityDefinition,
        questRecord,
        recoveryOpportunityRecord,
        variant,
      } = getWorldNodeVariantsApi().resolveDetourOpportunityVariant(run, actNumber);
      return {
        definition: detourOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    escalation_opportunity(run: RunState, actNumber: number) {
      const {
        covenantOpportunityRecord,
        escalationOpportunityDefinition,
        legacyOpportunityRecord,
        questRecord,
        reckoningOpportunityRecord,
        variant,
      } = getWorldNodeVariantsApi().resolveEscalationOpportunityVariant(run, actNumber);
      return {
        definition: escalationOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
  };

  function buildZoneReward({ run, zone }: { run: RunState; zone: ZoneState }) {
    const actNumber = zone?.actNumber || run?.actNumber || 1;

    if (zone.kind === ZONE_KIND.QUEST) {
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
        choices: definition.choices.map((choiceDefinition: WorldNodeChoiceDefinition) => buildChoice("quest", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === ZONE_KIND.SHRINE) {
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
        choices: definition.choices.map((choiceDefinition: WorldNodeChoiceDefinition) => buildChoice("shrine", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === ZONE_KIND.EVENT) {
      const { eventDefinition, questRecord, followUp } = getWorldNodeVariantsApi().resolveEventFollowUp(run, actNumber);
      return buildNodeReward(run, zone, eventDefinition, followUp, "event", [
        `Earlier quest result: ${questRecord.outcomeTitle}.`,
      ]);
    }

    if (zone.kind === ZONE_KIND.OPPORTUNITY) {
      const resolver = (opportunityResolvers as Record<string, (typeof opportunityResolvers)[keyof typeof opportunityResolvers]>)[zone.nodeType as string];
      if (resolver) {
        const { definition, variant, contextLines } = resolver(run, actNumber);
        return buildNodeReward(run, zone, definition, variant, "opportunity", contextLines);
      }
    }

    const { opportunityDefinition, questRecord, variant } =
      getWorldNodeVariantsApi().resolveOpportunityVariant(run, actNumber);
    return buildNodeReward(run, zone, opportunityDefinition, variant, "opportunity", [
      `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
    ]);
  }

  function applyChoice(run: RunState, reward: RunReward, choice: RewardChoice) {
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
