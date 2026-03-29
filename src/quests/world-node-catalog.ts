(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    questsA,
    nodeOutcomeEffect,
    getWorldNodeCatalogOpportunitiesApi,
  } = runtimeWindow.__ROUGE_WNC_QUESTS;
  const { questsB, SHRINE_DEFINITIONS, EVENT_DEFINITIONS } = runtimeWindow.__ROUGE_WNC_SHRINES;
  const { opportunitiesA } = runtimeWindow.__ROUGE_WNC_OPPS_A;
  const { opportunitiesB } = runtimeWindow.__ROUGE_WNC_OPPS_B;
  const { cOpportunityDefinitions: OPPORTUNITY_DEFINITIONS_C } = runtimeWindow.__ROUGE_OPP_STAGING;

  const QUEST_DEFINITIONS: Record<number, QuestNodeDefinition> = { ...questsA, ...questsB };

  const ADDITIONAL_SHRINE_CHOICES: Record<number, WorldNodeChoiceDefinition[]> = {
    1: [
      {
        id: "blessing_of_beacons",
        title: "Blessing of Beacons",
        subtitle: "Shrine Blessing",
        description: "Raise signal fires along the route and keep the rogue line coordinated under pressure.",
        effects: [
          nodeOutcomeEffect("shrine", "rogue_vigil_shrine", "blessing_of_beacons", "Blessing of Beacons", ["rogue_vigil_beacons"]),
          { kind: "hero_max_energy", value: 1 },
          { kind: "gold_bonus", value: 10 },
        ],
      },
    ],
    2: [
      {
        id: "blessing_of_the_welltrain",
        title: "Blessing of the Welltrain",
        subtitle: "Shrine Blessing",
        description: "Put the shrine into the water line and make the whole desert push steadier.",
        effects: [
          nodeOutcomeEffect("shrine", "sunwell_shrine", "blessing_of_the_welltrain", "Blessing of the Welltrain", [
            "sunwell_welltrain",
          ]),
          { kind: "belt_capacity", value: 1 },
          { kind: "hero_potion_heal", value: 1 },
        ],
      },
    ],
    3: [
      {
        id: "blessing_of_trade_winds",
        title: "Blessing of Trade Winds",
        subtitle: "Shrine Blessing",
        description: "Turn the shrine toward the harbor routes and keep your dockside line profitable and fast.",
        effects: [
          nodeOutcomeEffect("shrine", "jade_shrine", "blessing_of_trade_winds", "Blessing of Trade Winds", [
            "jade_shrine_trade_winds",
          ]),
          { kind: "mercenary_attack", value: 1 },
          { kind: "gold_bonus", value: 12 },
        ],
      },
    ],
    4: [
      {
        id: "blessing_of_cinder_screen",
        title: "Blessing of Cinder Screen",
        subtitle: "Shrine Blessing",
        description: "Pull a shield of hot ash across the route and keep the infernal push under tighter control.",
        effects: [
          nodeOutcomeEffect("shrine", "infernal_altar", "blessing_of_cinder_screen", "Blessing of Cinder Screen", [
            "infernal_altar_cinder_screen",
          ]),
          { kind: "hero_max_energy", value: 1 },
          { kind: "mercenary_max_life", value: 4 },
        ],
      },
    ],
    5: [
      {
        id: "blessing_of_watchfires",
        title: "Blessing of Watchfires",
        subtitle: "Shrine Blessing",
        description: "Carry the shrine into the climb posts and keep the summit march supplied through the cold.",
        effects: [
          nodeOutcomeEffect("shrine", "ancients_way_shrine", "blessing_of_watchfires", "Blessing of Watchfires", [
            "ancients_way_watchfires",
          ]),
          { kind: "attribute_point", value: 1 },
          { kind: "mercenary_attack", value: 1 },
        ],
      },
    ],
  };

  const OPPORTUNITY_DEFINITIONS: Record<number, OpportunityNodeDefinition> = {
    ...opportunitiesA,
    ...opportunitiesB,
    ...OPPORTUNITY_DEFINITIONS_C,
  };

  function buildExpandedShrineDefinitions() {
    return Object.keys(SHRINE_DEFINITIONS).reduce((definitions, actKey) => {
      const actNumber = Number(actKey);
      definitions[actNumber] = {
        ...SHRINE_DEFINITIONS[actNumber],
        choices: [
          ...SHRINE_DEFINITIONS[actNumber].choices,
          ...(ADDITIONAL_SHRINE_CHOICES[actNumber] || []),
        ],
      };
      return definitions;
    }, {} as Record<number, ShrineNodeDefinition>);
  }

  function buildExpandedOpportunityDefinitions() {
    const opportunityCatalog = getWorldNodeCatalogOpportunitiesApi();
    return Object.keys(OPPORTUNITY_DEFINITIONS).reduce((definitions, actKey) => {
      const actNumber = Number(actKey);
      definitions[actNumber] = {
        ...OPPORTUNITY_DEFINITIONS[actNumber],
        variants: [
          ...OPPORTUNITY_DEFINITIONS[actNumber].variants,
          ...(opportunityCatalog.additionalOpportunityVariants[actNumber] || []),
        ],
      };
      return definitions;
    }, {} as Record<number, OpportunityNodeDefinition>);
  }

  // Keep the authored base literals readable, then enrich them in one place for the live catalog.
  const EXPANDED_SHRINE_DEFINITIONS = buildExpandedShrineDefinitions();
  const EXPANDED_OPPORTUNITY_DEFINITIONS = buildExpandedOpportunityDefinitions();

  function getCatalog(): WorldNodeCatalog {
    const opportunityCatalog = getWorldNodeCatalogOpportunitiesApi();
    return {
      quests: QUEST_DEFINITIONS,
      shrines: EXPANDED_SHRINE_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      opportunities: EXPANDED_OPPORTUNITY_DEFINITIONS,
      crossroadOpportunities: opportunityCatalog.crossroadOpportunityDefinitions,
      shrineOpportunities: opportunityCatalog.shrineOpportunityDefinitions,
      reserveOpportunities: opportunityCatalog.reserveOpportunityDefinitions,
      relayOpportunities: opportunityCatalog.relayOpportunityDefinitions,
      culminationOpportunities: opportunityCatalog.culminationOpportunityDefinitions,
      legacyOpportunities: opportunityCatalog.legacyOpportunityDefinitions,
      reckoningOpportunities: opportunityCatalog.reckoningOpportunityDefinitions,
      recoveryOpportunities: opportunityCatalog.recoveryOpportunityDefinitions,
      accordOpportunities: opportunityCatalog.accordOpportunityDefinitions,
      covenantOpportunities: opportunityCatalog.covenantOpportunityDefinitions,
      detourOpportunities: opportunityCatalog.detourOpportunityDefinitions,
      escalationOpportunities: opportunityCatalog.escalationOpportunityDefinitions,
    };
  }

  function assertValidCatalog() {
    const validator = runtimeWindow.ROUGE_CONTENT_VALIDATOR;
    if (!validator) {
      return;
    }
    validator.assertValidWorldNodeCatalog(getCatalog());
  }

  runtimeWindow.ROUGE_WORLD_NODE_CATALOG = {
    getCatalog,
    assertValidCatalog,
  };
})();
