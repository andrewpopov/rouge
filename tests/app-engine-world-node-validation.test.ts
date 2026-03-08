export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("world-node validation fails clearly when quest follow-up data is missing", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  delete catalog.quests[1].choices[0].followUp;

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.quests\.1\.choices\[0\] is missing follow-up event content\./);
});

test("world-node validation fails clearly when an opportunity choice is missing quest consequence data", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[1].variants[0].choices[0].effects = catalog.opportunities[1].variants[0].choices[0].effects.filter((effect) => {
    return effect.kind !== "record_quest_consequence";
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.1\.variants\[0\]\.choices\[0\] is missing a valid record_quest_consequence effect\./);
});

test("world-node validation fails clearly when an opportunity variant requires an unknown flag", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[1].variants[0].requiresFlagIds = ["missing_flag"];

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.1\.variants\[0\]\.requiresFlagIds\[0\] references unknown flag "missing_flag"\./);
});

test("world-node validation fails clearly when an opportunity variant requires an unknown mercenary contract", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[1].variants[1].requiresMercenaryIds = ["missing_contract"];

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.1\.variants\[1\]\.requiresMercenaryIds\[0\] references unknown mercenary contract "missing_contract"\./);
});

test("world-node validation fails clearly when a shrine opportunity variant requires an unknown shrine outcome", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.shrineOpportunities[1].variants[0].requiresShrineOutcomeIds = ["missing_shrine_outcome"];

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.shrineOpportunities\.1\.variants\[0\]\.requiresShrineOutcomeIds\[0\] references unknown shrine outcome "missing_shrine_outcome"\./);
});

test("world-node validation fails clearly when shrine opportunity variants reuse the same requirement signature", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  const scoutScreenVariant = catalog.shrineOpportunities[1].variants.find((variant: { id: string }) => variant.id === "scout_screen");
  assert.ok(scoutScreenVariant);
  catalog.shrineOpportunities[1].variants.push({
    ...scoutScreenVariant,
    id: "duplicate_scout_screen_signature",
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.shrineOpportunities\.1\.variants\[\d+\] reuses requirement signature with variant "scout_screen"\./);
});

test("runtime content validation fails clearly when a mercenary route perk requires an unknown world flag", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk, index) => {
          return index === 0
            ? {
                ...routePerk,
                requiredFlagIds: ["missing_flag"],
              }
            : routePerk;
        }),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout\.routePerks\[0\]\.requiredFlagIds\[0\] references unknown world flag "missing_flag"\./);
});

test("runtime content validation fails clearly when a mercenary has too few route perks", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.slice(0, 5),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 12 route perks\./);
});

test("runtime content validation fails clearly when a mercenary loses its reserve-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_reserve_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 reserve-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its culmination-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_culmination_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 culmination-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its compound route perks", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.slice(0, 1),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 2 compound route perks with multiple required world flags\./);
});

test("runtime content validation fails clearly when a mercenary loses per-act route perk scaling", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          attackBonusPerAct: 0,
          behaviorBonusPerAct: 0,
          startGuardPerAct: 0,
          heroDamageBonusPerAct: 0,
          heroStartGuardPerAct: 0,
          openingDrawPerAct: 0,
          scalingStartAct: undefined,
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 route perk with per-act scaling\./);
});

test("runtime content validation fails clearly when mercenary route perks expose too few bonus families", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: Object.fromEntries(
      Object.entries(content.mercenaryCatalog).map(([mercenaryId, mercenary]) => {
        return [
          mercenaryId,
          {
            ...mercenary,
            routePerks: mercenary.routePerks.map((routePerk, index) => ({
              id: routePerk.id,
              title: routePerk.title,
              requiredFlagIds: [...routePerk.requiredFlagIds],
              attackBonus: 1,
              attackBonusPerAct: index === 0 ? 1 : 0,
              scalingStartAct: index === 0 ? 1 : undefined,
            })),
          },
        ];
      })
    ),
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog must expose at least 5 route perk bonus families\./);
});

test("runtime content validation fails clearly when an act lacks branch miniboss consequence encounter coverage", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    consequenceEncounterPackages: {
      ...content.consequenceEncounterPackages,
      1: content.consequenceEncounterPackages[1].filter((encounterPackage) => encounterPackage.zoneRole !== "branchMiniboss"),
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceEncounterPackages\.1 must include at least 1 package for zoneRole "branchMiniboss"\./);
});

test("runtime content validation fails clearly when an act lacks boss consequence encounter coverage", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    consequenceEncounterPackages: {
      ...content.consequenceEncounterPackages,
      1: content.consequenceEncounterPackages[1].filter((encounterPackage) => encounterPackage.zoneRole !== "boss"),
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceEncounterPackages\.1 must include at least 1 package for zoneRole "boss"\./);
});

test("runtime content validation fails clearly when consequence encounter packages reuse the same signature", () => {
  const { browserWindow, content } = createHarness();
  const duplicatePackage = content.consequenceEncounterPackages[1][0];
  const brokenContent = {
    ...content,
    consequenceEncounterPackages: {
      ...content.consequenceEncounterPackages,
      1: [
        ...content.consequenceEncounterPackages[1],
        {
          ...duplicatePackage,
          id: "duplicate_recovery_counterline",
        },
      ],
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceEncounterPackages\.1\[\d+\] reuses requirement signature with package "rogue_recovery_counterline"\./);
});

test("runtime content validation fails clearly when an act lacks boss consequence reward coverage", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    consequenceRewardPackages: {
      ...content.consequenceRewardPackages,
      1: content.consequenceRewardPackages[1].filter((rewardPackage) => rewardPackage.zoneRole !== "boss"),
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceRewardPackages\.1 must include at least 1 package for zoneRole "boss"\./);
});

test("runtime content validation fails clearly when consequence reward packages reuse the same signature", () => {
  const { browserWindow, content } = createHarness();
  const duplicatePackage = content.consequenceRewardPackages[1][0];
  const brokenContent = {
    ...content,
    consequenceRewardPackages: {
      ...content.consequenceRewardPackages,
      1: [
        ...content.consequenceRewardPackages[1],
        {
          ...duplicatePackage,
          id: "duplicate_lantern_dividend",
        },
      ],
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceRewardPackages\.1\[\d+\] reuses requirement signature with package "rogue_recovery_lantern_dividend"\./);
});

test("runtime content validation fails clearly when a mercenary loses its legacy-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_legacy_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 legacy-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its reckoning-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_reckoning_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 reckoning-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its recovery-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_recovery_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 recovery-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its accord-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_accord_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 accord-linked route perk\./);
});

test("runtime content validation fails clearly when a mercenary loses its covenant-linked route perk", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: {
        ...content.mercenaryCatalog.rogue_scout,
        routePerks: content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
          ...routePerk,
          requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_covenant_")),
        })),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout must define at least 1 covenant-linked route perk\./);
});

test("world-node validation fails clearly when opportunity variants reuse the same requirement signature", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[1].variants.push({
    ...catalog.opportunities[1].variants[2],
    id: "duplicate_refugee_signature",
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.1\.variants\[\d+\] reuses requirement signature with variant "refugee_muster"\./);
});

test("world-node validation fails clearly when opportunity paths have multiple equally specific matches", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[1].variants.push({
    id: "ambiguous_scout_command",
    title: "Ambiguous Scout Command",
    description: "Conflicts with the mercenary-specific scout path.",
    summary: "This variant should fail because it overlaps with the same authored path at equal specificity.",
    grants: { gold: 1, xp: 1, potions: 0 },
    requiresPrimaryOutcomeIds: ["take_scout_report"],
    requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
    requiresFlagIds: ["rogue_vigil_volley"],
    choices: [
      {
        id: "issue_duplicate_orders",
        title: "Issue Duplicate Orders",
        subtitle: "Route Opportunity",
        description: "This path intentionally collides with another top-specificity match.",
        effects: [
          {
            kind: "record_node_outcome",
            nodeType: "opportunity",
            nodeId: "rogue_route_opportunity",
            outcomeId: "issue_duplicate_orders",
            outcomeTitle: "Issue Duplicate Orders",
            flagIds: ["rogue_route_duplicate_orders"],
          },
          {
            kind: "record_quest_consequence",
            questId: "tristram_relief",
            outcomeId: "issue_duplicate_orders",
            outcomeTitle: "Issue Duplicate Orders",
            consequenceId: "duplicate_orders_issued",
            flagIds: ["rogue_route_duplicate_orders"],
          },
          { kind: "gold_bonus", value: 1 },
        ],
      },
    ],
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.1 has ambiguous variants for authored path "take_scout_report -> mark_the_paths \+ shrine:blessing_of_volley \+ merc:rogue_scout"/);
});

test("world-node validation fails clearly when an opportunity variant is unreachable from any authored path", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[1].variants.push({
    id: "impossible_cross_branch_variant",
    title: "Impossible Cross-Branch Variant",
    description: "This should never resolve.",
    summary: "Broken authoring.",
    grants: { gold: 0, xp: 0, potions: 0 },
    requiresPrimaryOutcomeIds: ["escort_survivors"],
    requiresFollowUpOutcomeIds: ["train_the_watch"],
    requiresConsequenceIds: ["caravan_secured"],
    choices: [
      {
        id: "broken_choice",
        title: "Broken Choice",
        subtitle: "Route Opportunity",
        description: "Broken choice.",
        effects: [
          {
            kind: "record_node_outcome",
            nodeType: "opportunity",
            nodeId: "rogue_route_opportunity",
            outcomeId: "broken_choice",
            outcomeTitle: "Broken Choice",
            flagIds: ["broken_flag"],
          },
          {
            kind: "record_quest_consequence",
            questId: "tristram_relief",
            outcomeId: "broken_choice",
            outcomeTitle: "Broken Choice",
            consequenceId: "broken_consequence",
            flagIds: ["broken_flag"],
          },
        ],
      },
    ],
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.1\.variants\[\d+\] is unreachable from any authored quest\/event\/shrine path\./);
});

test("world-node validation fails clearly when a crossroad opportunity requires the wrong shrine", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.crossroadOpportunities[1].requiresShrineId = "missing_shrine";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.crossroadOpportunities\.1 requires shrine "missing_shrine" but act shrine is "rogue_vigil_shrine"\./);
});

test("world-node validation fails clearly when a reserve opportunity requires the wrong crossroad node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.reserveOpportunities[1].requiresCrossroadOpportunityId = "missing_crossroad";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.reserveOpportunities\.1 requires crossroad opportunity "missing_crossroad" but act crossroad opportunity is "rogue_crossroads_opportunity"\./);
});

test("world-node validation fails clearly when a relay opportunity requires the wrong reserve node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.relayOpportunities[1].requiresReserveOpportunityId = "missing_reserve";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.relayOpportunities\.1 requires reserve opportunity "missing_reserve" but act reserve opportunity is "rogue_reserve_opportunity"\./);
});

test("world-node validation fails clearly when a culmination opportunity requires the wrong relay node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.culminationOpportunities[1].requiresRelayOpportunityId = "missing_relay";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.culminationOpportunities\.1 requires relay opportunity "missing_relay" but act relay opportunity is "rogue_relay_opportunity"\./);
});

test("world-node validation fails clearly when a legacy opportunity requires the wrong culmination node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.legacyOpportunities[1].requiresCulminationOpportunityId = "missing_culmination";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.legacyOpportunities\.1 requires culmination opportunity "missing_culmination" but act culmination opportunity is "rogue_culmination_opportunity"\./);
});

test("world-node validation fails clearly when a reckoning opportunity requires the wrong reserve node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.reckoningOpportunities[1].requiresReserveOpportunityId = "missing_reserve";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.reckoningOpportunities\.1 requires reserve opportunity "missing_reserve" but act reserve opportunity is "rogue_reserve_opportunity"\./);
});

test("world-node validation fails clearly when a recovery opportunity requires the wrong shrine node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.recoveryOpportunities[1].requiresShrineOpportunityId = "missing_shrine";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.recoveryOpportunities\.1 requires shrine opportunity "missing_shrine" but act shrine opportunity is "rogue_vigil_route_opportunity"\./);
});

test("world-node validation fails clearly when an accord opportunity requires the wrong crossroad node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.accordOpportunities[1].requiresCrossroadOpportunityId = "missing_crossroad";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.accordOpportunities\.1 requires crossroad opportunity "missing_crossroad" but act crossroad opportunity is "rogue_crossroads_opportunity"\./);
});

test("world-node validation fails clearly when a covenant opportunity requires the wrong accord node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.covenantOpportunities[1].requiresAccordOpportunityId = "missing_accord";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.covenantOpportunities\.1 requires accord opportunity "missing_accord" but act accord opportunity is "rogue_accord_opportunity"\./);
});

test("event nodes fail cleanly when the required quest state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  assert.ok(questZone);
  assert.ok(eventZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  questZone.encountersCleared = questZone.encounterTotal;
  questZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, eventZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved quest/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("opportunity nodes fail cleanly when the required follow-up state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  questZone.encountersCleared = questZone.encounterTotal;
  questZone.cleared = true;
  eventZone.encountersCleared = eventZone.encounterTotal;
  eventZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "primary_resolved",
    followUpNodeId: "",
    followUpOutcomeId: "",
    followUpOutcomeTitle: "",
    consequenceIds: [],
    flags: [],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, opportunityZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires a resolved follow-up outcome/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("crossroad opportunity nodes fail cleanly when the shrine state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const shrineZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "shrine");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  assert.ok(shrineZone);
  assert.ok(eventZone);
  assert.ok(crossroadZone);
  assert.ok(questZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  shrineZone.encountersCleared = shrineZone.encounterTotal;
  shrineZone.cleared = true;
  eventZone.encountersCleared = eventZone.encounterTotal;
  eventZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "mark_the_paths",
    followUpOutcomeTitle: "Mark the Paths",
    consequenceIds: ["paths_marked"],
    flags: ["tristram_paths_marked"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, crossroadZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved shrine/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("reserve opportunity nodes fail cleanly when the crossroad state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const opportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "opportunity");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const crossroadZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "crossroad_opportunity");
  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(opportunityZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(crossroadZone);
  assert.ok(reserveZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  opportunityZone.encountersCleared = opportunityZone.encounterTotal;
  opportunityZone.cleared = true;
  shrineOpportunityZone.encountersCleared = shrineOpportunityZone.encounterTotal;
  shrineOpportunityZone.cleared = true;
  crossroadZone.encountersCleared = crossroadZone.encounterTotal;
  crossroadZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "mark_the_paths",
    followUpOutcomeTitle: "Mark the Paths",
    consequenceIds: ["paths_marked"],
    flags: ["tristram_paths_marked"],
  };
  state.run.world.opportunityOutcomes.rogue_route_opportunity = {
    nodeId: "rogue_route_opportunity",
    zoneId: opportunityZone.id,
    actNumber: 1,
    title: "Rogue Route Opportunity",
    outcomeId: "raise_the_ridge_lanterns",
    outcomeTitle: "Raise the Ridge Lanterns",
    linkedQuestId: "tristram_relief",
    flagIds: ["rogue_route_ridge_lanterns"],
  };
  state.run.world.opportunityOutcomes.rogue_vigil_route_opportunity = {
    nodeId: "rogue_vigil_route_opportunity",
    zoneId: shrineOpportunityZone.id,
    actNumber: 1,
    title: "Rogue Vigil",
    outcomeId: "raise_the_signal_lanterns",
    outcomeTitle: "Raise the Signal Lanterns",
    linkedQuestId: "tristram_relief",
    flagIds: ["rogue_vigil_signal_lanterns"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, reserveZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved crossroad opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("relay opportunity nodes fail cleanly when the reserve state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const reserveZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reserve_opportunity");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  assert.ok(reserveZone);
  assert.ok(relayZone);

  reserveZone.encountersCleared = reserveZone.encounterTotal;
  reserveZone.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, relayZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved reserve opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("culmination opportunity nodes fail cleanly when the relay state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const relayZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "relay_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(relayZone);
  assert.ok(culminationZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  relayZone.encountersCleared = relayZone.encounterTotal;
  relayZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "mark_the_paths",
    followUpOutcomeTitle: "Mark the Paths",
    consequenceIds: ["paths_marked"],
    flags: ["tristram_paths_marked"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, culminationZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved relay opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("legacy opportunity nodes fail cleanly when the culmination state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(culminationZone);
  assert.ok(legacyZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  culminationZone.encountersCleared = culminationZone.encounterTotal;
  culminationZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "mark_the_paths",
    followUpOutcomeTitle: "Mark the Paths",
    consequenceIds: ["paths_marked"],
    flags: ["tristram_paths_marked"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, legacyZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved culmination opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("reckoning opportunity nodes fail cleanly when the reserve state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(culminationZone);
  assert.ok(reckoningZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  culminationZone.encountersCleared = culminationZone.encounterTotal;
  culminationZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "mark_the_paths",
    followUpOutcomeTitle: "Mark the Paths",
    consequenceIds: ["paths_marked"],
    flags: ["tristram_paths_marked"],
  };
  state.run.world.opportunityOutcomes.rogue_culmination_opportunity = {
    nodeId: "rogue_culmination_opportunity",
    zoneId: culminationZone.id,
    actNumber: 1,
    title: "Rogue Culmination",
    outcomeId: "last_wayfinders_commissioned",
    outcomeTitle: "Commission the Last Wayfinders",
    linkedQuestId: "tristram_relief",
    flagIds: ["rogue_culmination_last_wayfinders"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, reckoningZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved reserve opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("recovery opportunity nodes fail cleanly when the shrine state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(culminationZone);
  assert.ok(recoveryZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  culminationZone.encountersCleared = culminationZone.encounterTotal;
  culminationZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "mark_the_paths",
    followUpOutcomeTitle: "Mark the Paths",
    consequenceIds: ["paths_marked"],
    flags: ["tristram_paths_marked"],
  };
  state.run.world.opportunityOutcomes.rogue_culmination_opportunity = {
    nodeId: "rogue_culmination_opportunity",
    zoneId: culminationZone.id,
    actNumber: 1,
    title: "Rogue Culmination",
    outcomeId: "last_wayfinders_commissioned",
    outcomeTitle: "Commission the Last Wayfinders",
    linkedQuestId: "tristram_relief",
    flagIds: ["rogue_culmination_last_wayfinders"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, recoveryZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved shrine opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("accord opportunity nodes fail cleanly when the crossroad state is missing", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const shrineOpportunityZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "shrine_opportunity");
  const culminationZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "culmination_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(shrineOpportunityZone);
  assert.ok(culminationZone);
  assert.ok(accordZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  culminationZone.encountersCleared = culminationZone.encounterTotal;
  culminationZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "mark_the_paths",
    followUpOutcomeTitle: "Mark the Paths",
    consequenceIds: ["paths_marked"],
    flags: ["tristram_paths_marked"],
  };
  state.run.world.opportunityOutcomes.rogue_vigil_route_opportunity = {
    nodeId: "rogue_vigil_route_opportunity",
    zoneId: shrineOpportunityZone.id,
    actNumber: 1,
    title: "Rogue Vigil Route",
    outcomeId: "raise_the_signal_lanterns",
    outcomeTitle: "Raise the Signal Lanterns",
    linkedQuestId: "tristram_relief",
    flagIds: ["rogue_vigil_signal_lanterns"],
  };
  state.run.world.opportunityOutcomes.rogue_culmination_opportunity = {
    nodeId: "rogue_culmination_opportunity",
    zoneId: culminationZone.id,
    actNumber: 1,
    title: "Rogue Culmination",
    outcomeId: "last_wayfinders_commissioned",
    outcomeTitle: "Commission the Last Wayfinders",
    linkedQuestId: "tristram_relief",
    flagIds: ["rogue_culmination_last_wayfinders"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, accordZone.id);
  assert.equal(result.ok, false);
  assert.match(state.error, /requires resolved crossroad opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("covenant opportunity nodes fail cleanly when the accord state is missing", () => {
  const { browserWindow, content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone] = runFactory.getCurrentZones(state.run);
  const questZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "quest");
  const eventZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "event");
  const legacyZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "legacy_opportunity");
  const reckoningZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "reckoning_opportunity");
  const recoveryZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "recovery_opportunity");
  const accordZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "accord_opportunity");
  const covenantZone = runFactory.getCurrentZones(state.run).find((zone) => zone.nodeType === "covenant_opportunity");
  assert.ok(questZone);
  assert.ok(eventZone);
  assert.ok(legacyZone);
  assert.ok(reckoningZone);
  assert.ok(recoveryZone);
  assert.ok(accordZone);
  assert.ok(covenantZone);

  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  legacyZone.encountersCleared = legacyZone.encounterTotal;
  legacyZone.cleared = true;
  reckoningZone.encountersCleared = reckoningZone.encounterTotal;
  reckoningZone.cleared = true;
  recoveryZone.encountersCleared = recoveryZone.encounterTotal;
  recoveryZone.cleared = true;
  accordZone.encountersCleared = accordZone.encounterTotal;
  accordZone.cleared = true;
  state.run.world.questOutcomes.tristram_relief = {
    questId: "tristram_relief",
    zoneId: questZone.id,
    actNumber: 1,
    title: "Tristram Relief",
    outcomeId: "take_scout_report",
    outcomeTitle: "Take Scout Report",
    status: "follow_up_resolved",
    followUpNodeId: eventZone.id,
    followUpOutcomeId: "mark_the_paths",
    followUpOutcomeTitle: "Mark the Paths",
    consequenceIds: ["paths_marked"],
    flags: ["tristram_paths_marked"],
  };
  state.run.world.opportunityOutcomes.rogue_legacy_opportunity = {
    nodeId: "rogue_legacy_opportunity",
    zoneId: legacyZone.id,
    actNumber: 1,
    title: "Rogue Legacy",
    outcomeId: "extend_the_wayfinder_chain",
    outcomeTitle: "Extend the Wayfinder Chain",
    linkedQuestId: "tristram_relief",
    flagIds: ["rogue_legacy_wayfinder_chain"],
  };
  state.run.world.opportunityOutcomes.rogue_reckoning_opportunity = {
    nodeId: "rogue_reckoning_opportunity",
    zoneId: reckoningZone.id,
    actNumber: 1,
    title: "Rogue Reckoning",
    outcomeId: "break_the_last_chapel_ledger",
    outcomeTitle: "Break the Last Chapel Ledger",
    linkedQuestId: "tristram_relief",
    flagIds: ["rogue_reckoning_chapel_ledger"],
  };
  state.run.world.opportunityOutcomes.rogue_recovery_opportunity = {
    nodeId: "rogue_recovery_opportunity",
    zoneId: recoveryZone.id,
    actNumber: 1,
    title: "Rogue Recovery",
    outcomeId: "rehang_the_chapel_lanterns",
    outcomeTitle: "Rehang the Chapel Lanterns",
    linkedQuestId: "tristram_relief",
    flagIds: ["rogue_recovery_chapel_lanterns"],
  };
  runFactory.recomputeZoneStatuses(state.run);

  assert.throws(() => {
    browserWindow.ROUGE_WORLD_NODES.buildZoneReward({ run: state.run, zone: covenantZone });
  }, /requires resolved accord opportunity/);
  assert.equal(state.phase, appEngine.PHASES.WORLD_MAP);
});

test("boss rewards transition into the next act instead of ending the run early", () => {
  const { content, combatEngine, appEngine, runFactory, seedBundle } = createHarness();
  const state = appEngine.createAppState({
    content,
    seedBundle,
    combatEngine,
    randomFn: () => 0,
  });

  appEngine.startCharacterSelect(state);
  appEngine.setSelectedClass(state, "paladin");
  appEngine.startRun(state);
  appEngine.leaveSafeZone(state);

  const [openingZone, branchZoneOne, branchZoneTwo] = runFactory.getCurrentZones(state.run);
  const bossZone = runFactory.getCurrentZones(state.run).find((zone) => zone.kind === "boss");
  assert.ok(bossZone);
  openingZone.encountersCleared = openingZone.encounterTotal;
  openingZone.cleared = true;
  branchZoneOne.encountersCleared = branchZoneOne.encounterTotal;
  branchZoneOne.cleared = true;
  branchZoneTwo.encountersCleared = branchZoneTwo.encounterTotal;
  branchZoneTwo.cleared = true;
  runFactory.recomputeZoneStatuses(state.run);

  const result = appEngine.selectZone(state, bossZone.id);
  assert.equal(result.ok, true);
  assert.equal(state.phase, appEngine.PHASES.ENCOUNTER);

  state.combat.outcome = "victory";
  appEngine.syncEncounterOutcome(state);

  const boonChoice = state.run.pendingReward.choices.find((choice) => choice.kind === "boon");
  assert.ok(boonChoice);
  const heroLifeBeforeReward = state.run.hero.maxLife;
  const heroEnergyBeforeReward = state.run.hero.maxEnergy;
  const mercAttackBeforeReward = state.run.mercenary.attack;
  const beltMaxBeforeReward = state.run.belt.max;

  appEngine.claimRewardAndAdvance(state, boonChoice.id);

  assert.equal(state.phase, appEngine.PHASES.ACT_TRANSITION);
  assert.equal(state.run.summary.actsCleared, 1);
  assert.equal(state.run.summary.bossesDefeated, 1);
  assert.equal(state.run.progression.bossTrophies.length, 1);
  assert.equal(state.run.progression.bossTrophies[0], state.run.acts[0].boss.id);

  if (boonChoice.effects.some((effect) => effect.kind === "belt_capacity")) {
    assert.ok(state.run.belt.max > beltMaxBeforeReward);
  }
  if (boonChoice.effects.some((effect) => effect.kind === "hero_max_energy")) {
    assert.ok(state.run.hero.maxEnergy > heroEnergyBeforeReward);
  }
  if (boonChoice.effects.some((effect) => effect.kind === "hero_max_life")) {
    assert.ok(state.run.hero.maxLife > heroLifeBeforeReward);
  }
  if (boonChoice.effects.some((effect) => effect.kind === "mercenary_attack")) {
    assert.ok(state.run.mercenary.attack > mercAttackBeforeReward);
  }

  appEngine.continueActTransition(state);
  assert.equal(state.phase, appEngine.PHASES.SAFE_ZONE);
  assert.equal(state.run.currentActIndex, 1);
  assert.equal(state.run.safeZoneName, "Lut Gholein");
  assert.equal(state.run.hero.currentLife, state.run.hero.maxLife);
  assert.equal(state.run.belt.current, state.run.belt.max);

  appEngine.leaveSafeZone(state);
  const actTwoOpeningZoneId = runFactory.getCurrentZones(state.run)[0].id;
  const nextResult = appEngine.selectZone(state, actTwoOpeningZoneId);
  assert.equal(nextResult.ok, true);
  assert.match(state.run.activeEncounterId, /^act_2_/);
});
