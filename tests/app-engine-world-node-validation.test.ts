export {};

import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppHarness as createHarness } from "./helpers/browser-harness";
test("world-node validation fails clearly when quest follow-up data is missing", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  delete catalog.quests[2].choices[0].followUp;

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.quests\.2\.choices\[0\] is missing follow-up event content\./);
});

test("world-node validation fails clearly when an opportunity choice is missing quest consequence data", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[2].variants[0].choices[0].effects = catalog.opportunities[2].variants[0].choices[0].effects.filter((effect: RewardChoiceEffect) => {
    return effect.kind !== "record_quest_consequence";
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.2\.variants\[0\]\.choices\[0\] is missing a valid record_quest_consequence effect\./);
});

test("world-node validation fails clearly when an opportunity variant requires an unknown flag", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[2].variants[0].requiresFlagIds = ["missing_flag"];

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.2\.variants\[0\]\.requiresFlagIds\[0\] references unknown flag "missing_flag"\./);
});

test("world-node validation fails clearly when an opportunity variant requires an unknown mercenary contract", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[2].variants[1].requiresMercenaryIds = ["missing_contract"];

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.2\.variants\[1\]\.requiresMercenaryIds\[0\] references unknown mercenary contract "missing_contract"\./);
});

test("world-node validation fails clearly when a shrine opportunity variant requires an unknown shrine outcome", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.shrineOpportunities[2].variants[0].requiresShrineOutcomeIds = ["missing_shrine_outcome"];

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.shrineOpportunities\.2\.variants\[0\]\.requiresShrineOutcomeIds\[0\] references unknown shrine outcome "missing_shrine_outcome"\./);
});

test("world-node validation fails clearly when shrine opportunity variants reuse the same requirement signature", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  const firstVariant = catalog.shrineOpportunities[2].variants[0];
  assert.ok(firstVariant);
  catalog.shrineOpportunities[2].variants.push({
    ...firstVariant,
    id: "duplicate_variant_signature",
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.shrineOpportunities\.2\.variants\[\d+\] reuses requirement signature with variant/);
});

test("runtime content validation fails clearly when a mercenary route perk requires no world flags", () => {
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
                requiredFlagIds: [],
              }
            : routePerk;
        }),
      },
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /mercenaryCatalog\.rogue_scout\.routePerks\[0\] must require at least one world flag\./);
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

test("runtime content validation accepts mercenary content when reserve-linked route perks are absent from the world catalog match set", () => {
  const { browserWindow, content } = createHarness();
  const filteredPerks = content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
    ...routePerk,
    requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_reserve_")),
  }));
  const adjustedContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: { ...content.mercenaryCatalog.rogue_scout, routePerks: filteredPerks },
    },
  };
  browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(adjustedContent);
});

test("runtime content validation accepts mercenary content when culmination-linked route perks are absent from the world catalog match set", () => {
  const { browserWindow, content } = createHarness();
  const filteredPerks = content.mercenaryCatalog.rogue_scout.routePerks.map((routePerk) => ({
    ...routePerk,
    requiredFlagIds: routePerk.requiredFlagIds.filter((flagId) => !flagId.startsWith("rogue_culmination_")),
  }));
  const adjustedContent = {
    ...content,
    mercenaryCatalog: {
      ...content.mercenaryCatalog,
      rogue_scout: { ...content.mercenaryCatalog.rogue_scout, routePerks: filteredPerks },
    },
  };
  browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(adjustedContent);
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
          scalingStartAct: undefined as number | undefined,
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

test("runtime content validation fails clearly when an act lacks branch battle consequence encounter coverage", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    consequenceEncounterPackages: {
      ...content.consequenceEncounterPackages,
      2: content.consequenceEncounterPackages[2].filter((encounterPackage) => encounterPackage.zoneRole !== "branchBattle"),
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceEncounterPackages\.2 must include at least 5 packages for zoneRole "branchBattle"\./);
});

test("runtime content validation fails clearly when an act lacks branch miniboss consequence encounter coverage", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    consequenceEncounterPackages: {
      ...content.consequenceEncounterPackages,
      2: content.consequenceEncounterPackages[2].filter((encounterPackage) => encounterPackage.zoneRole !== "branchMiniboss"),
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceEncounterPackages\.2 must include at least 5 packages for zoneRole "branchMiniboss"\./);
});

test("runtime content validation fails clearly when an act lacks boss consequence encounter coverage", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    consequenceEncounterPackages: {
      ...content.consequenceEncounterPackages,
      2: content.consequenceEncounterPackages[2].filter((encounterPackage) => encounterPackage.zoneRole !== "boss"),
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceEncounterPackages\.2 must include at least 7 packages for zoneRole "boss"\./);
});

test("runtime content validation fails clearly when consequence encounter packages reuse the same signature", () => {
  const { browserWindow, content } = createHarness();
  const duplicatePackage = content.consequenceEncounterPackages[2][0];
  const brokenContent = {
    ...content,
    consequenceEncounterPackages: {
      ...content.consequenceEncounterPackages,
      2: [
        ...content.consequenceEncounterPackages[2],
        {
          ...duplicatePackage,
          id: "duplicate_encounter_package",
        },
      ],
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceEncounterPackages\.2\[\d+\] reuses requirement signature with package "sunwell_recovery_ward_line"\./);
});

test("runtime content validation fails clearly when an act lacks boss consequence reward coverage", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    consequenceRewardPackages: {
      ...content.consequenceRewardPackages,
      2: content.consequenceRewardPackages[2].filter((rewardPackage) => rewardPackage.zoneRole !== "boss"),
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceRewardPackages\.2 must include at least 7 packages for zoneRole "boss"\./);
});

test("runtime content validation fails clearly when an act lacks branch miniboss consequence reward coverage", () => {
  const { browserWindow, content } = createHarness();
  const brokenContent = {
    ...content,
    consequenceRewardPackages: {
      ...content.consequenceRewardPackages,
      2: content.consequenceRewardPackages[2].filter((rewardPackage) => rewardPackage.zoneRole !== "branchMiniboss"),
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceRewardPackages\.2 must include at least 5 packages for zoneRole "branchMiniboss"\./);
});

test("runtime content validation fails clearly when consequence reward packages reuse the same signature", () => {
  const { browserWindow, content } = createHarness();
  const duplicatePackage = content.consequenceRewardPackages[2][0];
  const brokenContent = {
    ...content,
    consequenceRewardPackages: {
      ...content.consequenceRewardPackages,
      2: [
        ...content.consequenceRewardPackages[2],
        {
          ...duplicatePackage,
          id: "duplicate_reward_package",
        },
      ],
    },
  };

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
  }, /consequenceRewardPackages\.2\[\d+\] reuses requirement signature with package "sunwell_recovery_ward_dividend"\./);
});

test("runtime content validation accepts mercenary content when legacy-linked route perks are absent from the world catalog match set", () => {
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

  browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
});

test("runtime content validation accepts mercenary content when reckoning-linked route perks are absent from the world catalog match set", () => {
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

  browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
});

test("runtime content validation accepts mercenary content when recovery-linked route perks are absent from the world catalog match set", () => {
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

  browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
});

test("runtime content validation accepts mercenary content when accord-linked route perks are absent from the world catalog match set", () => {
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

  browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
});

test("runtime content validation accepts mercenary content when covenant-linked route perks are absent from the world catalog match set", () => {
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

  browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidRuntimeContent(brokenContent);
});

test("world-node validation fails clearly when opportunity variants reuse the same requirement signature", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[2].variants.push({
    ...catalog.opportunities[2].variants[2],
    id: "duplicate_variant_signature",
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.2\.variants\[\d+\] reuses requirement signature with variant/);
});

test("world-node validation fails clearly when opportunity paths have multiple equally specific matches", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  const existingVariant = catalog.opportunities[2].variants[1];
  catalog.opportunities[2].variants.push({
    ...existingVariant,
    id: "ambiguous_spearwall_duplicate",
    title: "Ambiguous Spearwall Duplicate",
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
            nodeId: "sunwell_route_opportunity",
            outcomeId: "issue_duplicate_orders",
            outcomeTitle: "Issue Duplicate Orders",
            flagIds: ["sunwell_duplicate_orders"],
          },
          {
            kind: "record_quest_consequence",
            questId: "lost_reliquary",
            outcomeId: "issue_duplicate_orders",
            outcomeTitle: "Issue Duplicate Orders",
            consequenceId: "duplicate_orders_issued",
            flagIds: ["sunwell_duplicate_orders"],
          },
          { kind: "gold_bonus", value: 1 },
        ],
      },
    ],
  });

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.opportunities\.2 has ambiguous variants for authored path/);
});

test("world-node validation fails clearly when an opportunity variant is unreachable from any authored path", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.opportunities[2].variants.push({
    id: "impossible_cross_branch_variant",
    title: "Impossible Cross-Branch Variant",
    description: "This should never resolve.",
    summary: "Broken authoring.",
    grants: { gold: 0, xp: 0, potions: 0 },
    requiresPrimaryOutcomeIds: ["harvest_the_relics"],
    requiresFollowUpOutcomeIds: ["relay_to_the_caravan"],
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
            nodeId: "sunwell_route_opportunity",
            outcomeId: "broken_choice",
            outcomeTitle: "Broken Choice",
            flagIds: ["broken_flag"],
          },
          {
            kind: "record_quest_consequence",
            questId: "lost_reliquary",
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
  }, /worldNodes\.opportunities\.2\.variants\[\d+\] is unreachable from any authored quest\/event\/shrine path\./);
});

test("world-node validation fails clearly when a crossroad opportunity requires the wrong shrine", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.crossroadOpportunities[2].requiresShrineId = "missing_shrine";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.crossroadOpportunities\.2 requires shrine "missing_shrine" but act shrine is "sunwell_shrine"\./);
});

test("world-node validation fails clearly when a reserve opportunity requires the wrong crossroad node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.reserveOpportunities[2].requiresCrossroadOpportunityId = "missing_crossroad";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.reserveOpportunities\.2 requires crossroad opportunity "missing_crossroad" but act crossroad opportunity is "sunwell_crossroads_opportunity"\./);
});

test("world-node validation fails clearly when a relay opportunity requires the wrong reserve node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.relayOpportunities[2].requiresReserveOpportunityId = "missing_reserve";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.relayOpportunities\.2 requires reserve opportunity "missing_reserve" but act reserve opportunity is "sunwell_reserve_opportunity"\./);
});

test("world-node validation fails clearly when a culmination opportunity requires the wrong relay node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.culminationOpportunities[2].requiresRelayOpportunityId = "missing_relay";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.culminationOpportunities\.2 requires relay opportunity "missing_relay" but act relay opportunity is "sunwell_relay_opportunity"\./);
});

test("world-node validation fails clearly when a legacy opportunity requires the wrong culmination node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.legacyOpportunities[2].requiresCulminationOpportunityId = "missing_culmination";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.legacyOpportunities\.2 requires culmination opportunity "missing_culmination" but act culmination opportunity is "sunwell_culmination_opportunity"\./);
});

test("world-node validation fails clearly when a reckoning opportunity requires the wrong reserve node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.reckoningOpportunities[2].requiresReserveOpportunityId = "missing_reserve";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.reckoningOpportunities\.2 requires reserve opportunity "missing_reserve" but act reserve opportunity is "sunwell_reserve_opportunity"\./);
});

test("world-node validation fails clearly when a recovery opportunity requires the wrong shrine node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.recoveryOpportunities[2].requiresShrineOpportunityId = "missing_shrine";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.recoveryOpportunities\.2 requires shrine opportunity "missing_shrine" but act shrine opportunity is "sunwell_shrine_opportunity"\./);
});

test("world-node validation fails clearly when an accord opportunity requires the wrong crossroad node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.accordOpportunities[2].requiresCrossroadOpportunityId = "missing_crossroad";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.accordOpportunities\.2 requires crossroad opportunity "missing_crossroad" but act crossroad opportunity is "sunwell_crossroads_opportunity"\./);
});

test("world-node validation fails clearly when a covenant opportunity requires the wrong accord node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.covenantOpportunities[2].requiresAccordOpportunityId = "missing_accord";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.covenantOpportunities\.2 requires accord opportunity "missing_accord" but act accord opportunity is "sunwell_accord_opportunity"\./);
});

test("world-node validation fails clearly when a detour opportunity requires the wrong covenant node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.detourOpportunities[2].requiresCovenantOpportunityId = "missing_covenant";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.detourOpportunities\.2 requires covenant opportunity "missing_covenant" but act covenant opportunity is "sunwell_covenant_opportunity"\./);
});

test("world-node validation fails clearly when an escalation opportunity requires the wrong reckoning node", () => {
  const { browserWindow } = createHarness();
  const catalog = JSON.parse(JSON.stringify(browserWindow.ROUGE_WORLD_NODES.getCatalog()));
  catalog.escalationOpportunities[2].requiresReckoningOpportunityId = "missing_reckoning";

  assert.throws(() => {
    browserWindow.ROUGE_CONTENT_VALIDATOR.assertValidWorldNodeCatalog(catalog);
  }, /worldNodes\.escalationOpportunities\.2 requires reckoning opportunity "missing_reckoning" but act reckoning opportunity is "sunwell_reckoning_opportunity"\./);
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

  const zones = runFactory.getCurrentZones(state.run);
  const bossZone = zones.find((zone) => zone.kind === "boss");
  assert.ok(bossZone);
  // Clear all mainline zones to unlock the boss
  const mainlineZones = zones.filter(
    (z) => z.kind === "battle" && (z.zoneRole === "opening" || (z.zoneRole || "").startsWith("mainline_")) && !z.zoneRole?.startsWith("side_")
  );
  for (const z of mainlineZones) {
    z.encountersCleared = z.encounterTotal;
    z.cleared = true;
  }
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
  assert.equal(state.run.safeZoneName, "Oasis Refuge");
  assert.equal(state.run.hero.currentLife, state.run.hero.maxLife);
  assert.equal(state.run.belt.current, state.run.belt.max);

  appEngine.leaveSafeZone(state);
  const actTwoOpeningZoneId = runFactory.getCurrentZones(state.run)[0].id;
  const nextResult = appEngine.selectZone(state, actTwoOpeningZoneId);
  assert.equal(nextResult.ok, true);
  assert.match(state.run.activeEncounterId, /^act_2_/);
});
