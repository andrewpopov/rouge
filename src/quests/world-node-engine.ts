(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;
  const choiceStrategy = runtimeWindow.__ROUGE_WORLD_NODE_ENGINE_CHOICE_STRATEGY;
  const opportunityResolvers = runtimeWindow.__ROUGE_WORLD_NODE_ENGINE_OPPORTUNITY_RESOLVERS;

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

  function getQuestDefinition(actNumber: number) {
    return getWorldNodeZonesApi().getQuestDefinition(actNumber);
  }

  function getShrineDefinition(actNumber: number) {
    return getWorldNodeZonesApi().getShrineDefinition(actNumber);
  }

  function isShrineOpportunityNodeId(nodeId: string) {
    return getWorldNodeZonesApi().isShrineOpportunityNodeId(nodeId);
  }

  function buildNodeReward(
    run: RunState,
    zone: ZoneState,
    definition: { title: string; summary: string; grants: RewardGrants },
    variant: WorldNodeRewardDefinition,
    choiceKind: string,
    contextLines: string[],
    content: GameContent | null = null
  ) {
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
      choices: choiceStrategy.buildStrategicChoices(choiceKind, variant.choices, run, content),
      encounterNumber: 1,
      clearsZone: true,
      endsAct: false,
      endsRun: false,
      heroLifeAfterFight: run.hero.currentLife,
      mercenaryLifeAfterFight: run.mercenary.currentLife,
    };
  }

  function buildZoneReward({ run, zone, content = null }: { run: RunState; zone: ZoneState; content?: GameContent | null }) {
    const actNumber = zone?.actNumber || run?.actNumber || 1;

    if (zone.kind === ZONE_KIND.QUEST) {
      const definition = getQuestDefinition(actNumber);
      const { choices, extraLines } = choiceStrategy.buildQuestChoices(run, zone, actNumber, definition, content);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: definition.title,
        lines: [
          definition.summary,
          ...extraLines,
          "This node resolves immediately and clears the route once you choose an outcome.",
          `${zone.title} is now clear.`,
        ],
        grants: { ...definition.grants },
        choices,
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
        choices: choiceStrategy.buildStrategicChoices("shrine", definition.choices, run, content),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === ZONE_KIND.EVENT) {
      const { eventDefinition, questRecord, followUp } = runtimeWindow.ROUGE_WORLD_NODE_VARIANTS.resolveEventFollowUp(run, actNumber);
      return buildNodeReward(run, zone, eventDefinition, followUp, "event", [
        `Earlier quest result: ${questRecord.outcomeTitle}.`,
      ], content);
    }

    if (zone.kind === ZONE_KIND.OPPORTUNITY) {
      const resolvedOpportunity = opportunityResolvers.resolveOpportunityNode(zone.nodeType as string, run, actNumber);
      if (resolvedOpportunity) {
        return buildNodeReward(
          run,
          zone,
          resolvedOpportunity.definition,
          resolvedOpportunity.variant,
          "opportunity",
          resolvedOpportunity.contextLines,
          content
        );
      }
    }

    const { opportunityDefinition, questRecord, variant } = runtimeWindow.ROUGE_WORLD_NODE_VARIANTS.resolveOpportunityVariant(run, actNumber);
    return buildNodeReward(run, zone, opportunityDefinition, variant, "opportunity", [
      `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
    ], content);
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
