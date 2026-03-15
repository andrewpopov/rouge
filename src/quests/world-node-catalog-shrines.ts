(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    nodeOutcomeEffect,
  } = runtimeWindow.__ROUGE_WNC_QUESTS;

  const { questsB: QUEST_DEFINITIONS_B } = runtimeWindow.__ROUGE_WNC_SHRINES_QUESTS;

  const SHRINE_DEFINITIONS: Record<number, ShrineNodeDefinition> = {
    1: {
      kind: "shrine",
      id: "rogue_vigil_shrine",
      title: "Rogue Vigil Shrine",
      zoneTitle: "Vigil Shrine",
      description: "A rogue shrine offers a clean one-node blessing instead of another skirmish.",
      summary: "A roadside shrine offers a brief but meaningful blessing.",
      grants: { gold: 4, xp: 6, potions: 0 },
      choices: [
        {
          id: "blessing_of_grit",
          title: "Blessing of Grit",
          subtitle: "Shrine Blessing",
          description: "Take the camp's endurance rite and steady the hero for a longer act.",
          effects: [
            nodeOutcomeEffect("shrine", "rogue_vigil_shrine", "blessing_of_grit", "Blessing of Grit", ["rogue_vigil_grit"]),
            { kind: "hero_max_life", value: 4 },
            { kind: "refill_potions", value: 1 },
          ],
        },
        {
          id: "blessing_of_volley",
          title: "Blessing of Volley",
          subtitle: "Shrine Blessing",
          description: "Lean into the ranged line and keep the escort dangerous.",
          effects: [
            nodeOutcomeEffect("shrine", "rogue_vigil_shrine", "blessing_of_volley", "Blessing of Volley", ["rogue_vigil_volley"]),
            { kind: "mercenary_attack", value: 1 },
            { kind: "gold_bonus", value: 8 },
          ],
        },
      ],
    },
    2: {
      kind: "shrine",
      id: "sunwell_shrine",
      title: "Sunwell Shrine",
      zoneTitle: "Sunwell Shrine",
      description: "A desert shrine offers either cleaner reserves or harder caravan discipline.",
      summary: "A desert shrine lets you convert route time into a focused blessing.",
      grants: { gold: 6, xp: 8, potions: 0 },
      choices: [
        {
          id: "blessing_of_the_sun",
          title: "Blessing of the Sun",
          subtitle: "Shrine Blessing",
          description: "Use the shrine to reclaim some focus and carry better recovery into the tombs.",
          effects: [
            nodeOutcomeEffect("shrine", "sunwell_shrine", "blessing_of_the_sun", "Blessing of the Sun", ["sunwell_focus"]),
            { kind: "hero_max_energy", value: 1 },
            { kind: "hero_potion_heal", value: 1 },
          ],
        },
        {
          id: "blessing_of_the_march",
          title: "Blessing of the March",
          subtitle: "Shrine Blessing",
          description: "Put the blessing into caravan discipline and a sturdier escort line.",
          effects: [
            nodeOutcomeEffect("shrine", "sunwell_shrine", "blessing_of_the_march", "Blessing of the March", ["sunwell_march"]),
            { kind: "mercenary_max_life", value: 4 },
            { kind: "refill_potions", value: 1 },
          ],
        },
      ],
    },
    3: {
      kind: "shrine",
      id: "jade_shrine",
      title: "Jade Shrine",
      zoneTitle: "Jade Shrine",
      description: "A jungle shrine offers either disciplined reserves or a better-fed route cache.",
      summary: "A Kurast shrine trades a short detour for a permanent run edge.",
      grants: { gold: 8, xp: 10, potions: 0 },
      choices: [
        {
          id: "blessing_of_tides",
          title: "Blessing of Tides",
          subtitle: "Shrine Blessing",
          description: "Smooth the hero's reserves and keep the route cleaner under curse-heavy pressure.",
          effects: [
            nodeOutcomeEffect("shrine", "jade_shrine", "blessing_of_tides", "Blessing of Tides", ["jade_shrine_tides"]),
            { kind: "hero_max_energy", value: 1 },
            { kind: "gold_bonus", value: 10 },
          ],
        },
        {
          id: "blessing_of_the_storehouse",
          title: "Blessing of the Storehouse",
          subtitle: "Shrine Blessing",
          description: "Anchor the shrine's favor into the route supply chain instead of the hero directly.",
          effects: [
            nodeOutcomeEffect("shrine", "jade_shrine", "blessing_of_the_storehouse", "Blessing of the Storehouse", ["jade_shrine_storehouse"]),
            { kind: "belt_capacity", value: 1 },
            { kind: "refill_potions", value: 1 },
          ],
        },
      ],
    },
    4: {
      kind: "shrine",
      id: "infernal_altar",
      title: "Infernal Altar",
      zoneTitle: "Infernal Altar",
      description: "An infernal altar offers either raw staying power or an aggressively armed line.",
      summary: "A hellish shrine turns one route stop into a durable blessing.",
      grants: { gold: 10, xp: 12, potions: 0 },
      choices: [
        {
          id: "blessing_of_iron",
          title: "Blessing of Iron",
          subtitle: "Shrine Blessing",
          description: "Take the altar's protection and harden your body before the sanctuary climb.",
          effects: [
            nodeOutcomeEffect("shrine", "infernal_altar", "blessing_of_iron", "Blessing of Iron", ["infernal_altar_iron"]),
            { kind: "hero_max_life", value: 5 },
            { kind: "hero_potion_heal", value: 1 },
          ],
        },
        {
          id: "blessing_of_warfire",
          title: "Blessing of Warfire",
          subtitle: "Shrine Blessing",
          description: "Turn the altar outward and let the whole line hit harder on the next stretch.",
          effects: [
            nodeOutcomeEffect("shrine", "infernal_altar", "blessing_of_warfire", "Blessing of Warfire", ["infernal_altar_warfire"]),
            { kind: "mercenary_attack", value: 1 },
            { kind: "gold_bonus", value: 12 },
          ],
        },
      ],
    },
    5: {
      kind: "shrine",
      id: "ancients_way_shrine",
      title: "Ancients' Way Shrine",
      zoneTitle: "Ancients' Way Shrine",
      description: "A mountain shrine offers either personal endurance or broader warband readiness.",
      summary: "A summit shrine converts route time into a final act blessing.",
      grants: { gold: 12, xp: 14, potions: 0 },
      choices: [
        {
          id: "blessing_of_the_summit",
          title: "Blessing of the Summit",
          subtitle: "Shrine Blessing",
          description: "Take the shrine directly and climb with a larger personal buffer.",
          effects: [
            nodeOutcomeEffect("shrine", "ancients_way_shrine", "blessing_of_the_summit", "Blessing of the Summit", [
              "ancients_way_summit",
            ]),
            { kind: "hero_max_life", value: 6 },
            { kind: "hero_max_energy", value: 1 },
          ],
        },
        {
          id: "blessing_of_the_warband",
          title: "Blessing of the Warband",
          subtitle: "Shrine Blessing",
          description: "Spread the shrine across the whole line and make the final march steadier.",
          effects: [
            nodeOutcomeEffect("shrine", "ancients_way_shrine", "blessing_of_the_warband", "Blessing of the Warband", [
              "ancients_way_warband",
            ]),
            { kind: "mercenary_attack", value: 1 },
            { kind: "refill_potions", value: 2 },
          ],
        },
      ],
    },
  };

  const EVENT_DEFINITIONS: Record<number, EventNodeDefinition> = {
    2: {
      kind: "event",
      id: "lost_reliquary_aftermath",
      title: "Reliquary Aftermath",
      zoneTitle: "Reliquary Aftermath",
      description: "Whatever you did with the reliquary now generates a second route consequence.",
      summary: "The reliquary path pays off again based on your first choice.",
      grants: { gold: 8, xp: 10, potions: 0 },
      requiresQuestId: "lost_reliquary",
    },
    3: {
      kind: "event",
      id: "smugglers_wake_aftermath",
      title: "Dockside Aftermath",
      zoneTitle: "Dockside Aftermath",
      description: "The Kurast deal continues to echo through the route after the first transaction settles.",
      summary: "Your dockside choice opens a second, outcome-specific event.",
      grants: { gold: 10, xp: 10, potions: 0 },
      requiresQuestId: "smugglers_wake",
    },
    4: {
      kind: "event",
      id: "hellforge_claim_aftermath",
      title: "Hellforge Aftermath",
      zoneTitle: "Hellforge Aftermath",
      description: "The Hellforge claim does not settle cleanly; the route gets one more follow-up choice.",
      summary: "The Hellforge route now includes an explicit consequence node.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
    },
    5: {
      kind: "event",
      id: "harrogath_rescue_aftermath",
      title: "Harrogath Aftermath",
      zoneTitle: "Harrogath Aftermath",
      description: "The rescue decision feeds directly into one more war-camp or supply-line consequence.",
      summary: "Your final act quest now opens a second route-side choice.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
    },
  };

  runtimeWindow.__ROUGE_WNC_SHRINES = {
    questsB: QUEST_DEFINITIONS_B,
    SHRINE_DEFINITIONS,
    EVENT_DEFINITIONS,
  };
})();
