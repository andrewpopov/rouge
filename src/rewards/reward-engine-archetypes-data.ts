(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;

  type BuildPathDefinition = {
    label: string;
    primaryTrees: string[];
    supportTrees: string[];
    targetBand: "flagship" | "secondary";
    behaviorTags: CardBehaviorTag[];
    counterTags: CounterTag[];
    splashRole: CardSplashRole;
  };

  const CARD_ROLE_LABELS: Record<CardRewardRole, string> = {
    foundation: "Foundation",
    engine: "Engine",
    support: "Support",
    tech: "Tech",
  };
  const CARD_ROLE_SCORE_WEIGHTS: Record<CardRewardRole, number> = {
    foundation: 1,
    engine: 4,
    support: 2,
    tech: 2,
  };
  const SUPPORT_ROLE_PRIORITY: Record<CardRewardRole, number> = {
    support: 4,
    tech: 3,
    foundation: 2,
    engine: 1,
  };

  const BUILD_PATHS: Record<string, Record<string, BuildPathDefinition>> = {
    amazon: {
      amazon_bow_and_crossbow: {
        label: "Bow Volley",
        primaryTrees: ["bow"],
        supportTrees: ["passive"],
        targetBand: "flagship",
        behaviorTags: ["pressure", "setup", "payoff"],
        counterTags: ["anti_backline", "anti_summon", "telegraph_respect"],
        splashRole: "utility_splash_ok",
      },
      amazon_javelin_and_spear: {
        label: "Javelin Storm",
        primaryTrees: ["javelin"],
        supportTrees: ["passive"],
        targetBand: "secondary",
        behaviorTags: ["pressure", "payoff", "scaling"],
        counterTags: ["anti_summon", "anti_guard_break"],
        splashRole: "utility_splash_ok",
      },
      amazon_passive_and_magic: {
        label: "Passive Tempo",
        primaryTrees: ["passive"],
        supportTrees: [],
        targetBand: "secondary",
        behaviorTags: ["salvage", "mitigation", "scaling", "protection"],
        counterTags: ["anti_attrition", "anti_backline", "anti_fire_pressure", "telegraph_respect"],
        splashRole: "utility_splash_ok",
      },
    },
    assassin: {
      assassin_martial_arts: {
        label: "Martial Burst",
        primaryTrees: ["martial_arts"],
        supportTrees: ["shadow"],
        targetBand: "flagship",
        behaviorTags: ["pressure", "payoff", "conversion"],
        counterTags: ["anti_guard_break", "telegraph_respect", "anti_fire_pressure"],
        splashRole: "utility_splash_ok",
      },
      assassin_shadow_disciplines: {
        label: "Shadow Tempo",
        primaryTrees: ["shadow"],
        supportTrees: [],
        targetBand: "secondary",
        behaviorTags: ["mitigation", "salvage", "disruption", "protection", "payoff"],
        counterTags: ["anti_control", "anti_tax", "anti_attrition", "telegraph_respect", "anti_fire_pressure"],
        splashRole: "hybrid_only",
      },
      assassin_traps: {
        label: "Trap Field",
        primaryTrees: ["traps"],
        supportTrees: ["shadow"],
        targetBand: "flagship",
        behaviorTags: ["setup", "payoff", "scaling", "tax"],
        counterTags: ["anti_summon", "anti_backline", "anti_support_disruption", "anti_fire_pressure", "telegraph_respect"],
        splashRole: "utility_splash_ok",
      },
    },
    barbarian: {
      barbarian_combat_skills: {
        label: "Combat Pressure",
        primaryTrees: ["combat_skills"],
        supportTrees: ["warcries", "masteries"],
        targetBand: "flagship",
        behaviorTags: ["pressure", "payoff", "conversion"],
        counterTags: ["anti_guard_break", "telegraph_respect"],
        splashRole: "utility_splash_ok",
      },
      barbarian_combat_masteries: {
        label: "Mastery Frontline",
        primaryTrees: ["masteries"],
        supportTrees: ["warcries"],
        targetBand: "secondary",
        behaviorTags: ["mitigation", "scaling", "support"],
        counterTags: ["anti_attrition", "anti_control", "anti_fire_pressure", "telegraph_respect"],
        splashRole: "utility_splash_ok",
      },
      barbarian_warcries: {
        label: "Warcry Tempo",
        primaryTrees: ["warcries"],
        supportTrees: ["combat_skills", "masteries"],
        targetBand: "secondary",
        behaviorTags: ["tax", "disruption", "salvage", "protection"],
        counterTags: ["anti_summon", "anti_support_disruption", "anti_control"],
        splashRole: "utility_splash_ok",
      },
    },
    druid: {
      druid_elemental: {
        label: "Elemental Storm",
        primaryTrees: ["elemental"],
        supportTrees: ["summoning"],
        targetBand: "flagship",
        behaviorTags: ["setup", "payoff", "pressure", "scaling"],
        counterTags: ["anti_summon", "anti_backline"],
        splashRole: "utility_splash_ok",
      },
      druid_shape_shifting: {
        label: "Shifter Bruiser",
        primaryTrees: ["shape_shifting"],
        supportTrees: ["summoning"],
        targetBand: "secondary",
        behaviorTags: ["pressure", "mitigation", "conversion"],
        counterTags: ["anti_attrition", "anti_guard_break", "anti_fire_pressure", "telegraph_respect"],
        splashRole: "utility_splash_ok",
      },
      druid_summoning: {
        label: "Summoner Engine",
        primaryTrees: ["summoning"],
        supportTrees: ["elemental"],
        targetBand: "secondary",
        behaviorTags: ["setup", "protection", "scaling", "salvage"],
        counterTags: ["anti_attrition", "anti_control", "anti_backline"],
        splashRole: "utility_splash_ok",
      },
    },
    necromancer: {
      necromancer_curses: {
        label: "Curse Control",
        primaryTrees: ["curses"],
        supportTrees: ["poison_bone", "summoning"],
        targetBand: "secondary",
        behaviorTags: ["tax", "disruption", "support", "conversion"],
        counterTags: ["anti_support_disruption", "anti_attrition", "anti_guard_break"],
        splashRole: "hybrid_only",
      },
      necromancer_poison_and_bone: {
        label: "Bone Burst",
        primaryTrees: ["poison_bone"],
        supportTrees: ["curses"],
        targetBand: "flagship",
        behaviorTags: ["pressure", "payoff", "setup"],
        counterTags: ["anti_backline", "anti_attrition"],
        splashRole: "utility_splash_ok",
      },
      necromancer_summoning: {
        label: "Summon Swarm",
        primaryTrees: ["summoning"],
        supportTrees: ["curses", "poison_bone"],
        targetBand: "secondary",
        behaviorTags: ["setup", "protection", "scaling"],
        counterTags: ["anti_attrition", "anti_control", "anti_summon"],
        splashRole: "utility_splash_ok",
      },
    },
    paladin: {
      paladin_combat_skills: {
        label: "Combat Zeal",
        primaryTrees: ["combat"],
        supportTrees: ["offensive_auras", "defensive_auras"],
        targetBand: "flagship",
        behaviorTags: ["pressure", "mitigation", "payoff"],
        counterTags: ["anti_guard_break", "telegraph_respect"],
        splashRole: "utility_splash_ok",
      },
      paladin_defensive_auras: {
        label: "Sanctuary Anchor",
        primaryTrees: ["defensive_auras"],
        supportTrees: ["combat", "offensive_auras"],
        targetBand: "secondary",
        behaviorTags: ["mitigation", "protection", "support", "conversion"],
        counterTags: ["anti_attrition", "anti_fire_pressure", "anti_control"],
        splashRole: "hybrid_only",
      },
      paladin_offensive_auras: {
        label: "Aura Judgment",
        primaryTrees: ["offensive_auras"],
        supportTrees: ["defensive_auras"],
        targetBand: "secondary",
        behaviorTags: ["support", "setup", "payoff", "scaling", "mitigation"],
        counterTags: ["anti_summon", "anti_fire_pressure"],
        splashRole: "hybrid_only",
      },
    },
    sorceress: {
      sorceress_cold: {
        label: "Cold Control",
        primaryTrees: ["cold"],
        supportTrees: ["lightning"],
        targetBand: "secondary",
        behaviorTags: ["setup", "disruption", "mitigation", "payoff"],
        counterTags: ["telegraph_respect", "anti_backline", "anti_fire_pressure"],
        splashRole: "hybrid_only",
      },
      sorceress_fire: {
        label: "Fire Burst",
        primaryTrees: ["fire"],
        supportTrees: [],
        targetBand: "flagship",
        behaviorTags: ["pressure", "payoff", "scaling"],
        counterTags: ["anti_summon", "anti_guard_break", "anti_fire_pressure"],
        splashRole: "utility_splash_ok",
      },
      sorceress_lightning: {
        label: "Lightning Tempo",
        primaryTrees: ["lightning"],
        supportTrees: ["cold"],
        targetBand: "secondary",
        behaviorTags: ["pressure", "salvage", "disruption", "payoff"],
        counterTags: ["anti_backline", "anti_support_disruption", "anti_lightning_pressure"],
        splashRole: "hybrid_only",
      },
    },
  };

  const ARCHETYPE_WEAPON_FAMILIES: Record<string, string[]> = {
    amazon_bow_and_crossbow: ["Bows", "Crossbows"],
    amazon_javelin_and_spear: ["Javelins", "Spears"],
    amazon_passive_and_magic: ["Bows", "Javelins", "Spears"],
    assassin_martial_arts: ["Swords"],
    assassin_shadow_disciplines: ["Swords"],
    assassin_traps: ["Swords"],
    barbarian_combat_skills: ["Swords", "Maces"],
    barbarian_combat_masteries: ["Swords", "Maces"],
    barbarian_warcries: ["Maces", "Swords"],
    druid_elemental: ["Staves", "Maces"],
    druid_shape_shifting: ["Maces", "Polearms"],
    druid_summoning: ["Staves", "Maces"],
    necromancer_curses: ["Wands"],
    necromancer_poison_and_bone: ["Wands"],
    necromancer_summoning: ["Wands"],
    paladin_combat_skills: ["Maces", "Swords"],
    paladin_defensive_auras: ["Maces", "Swords"],
    paladin_offensive_auras: ["Maces", "Swords"],
    sorceress_cold: ["Staves"],
    sorceress_fire: ["Staves"],
    sorceress_lightning: ["Staves"],
  };

  registryWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES_DATA = {
    CARD_ROLE_LABELS,
    CARD_ROLE_SCORE_WEIGHTS,
    SUPPORT_ROLE_PRIORITY,
    TREE_RANK_SCORE_WEIGHT: 12,
    FAVORED_TREE_SCORE_BONUS: 2,
    PRIMARY_TREE_CARD_SCORE_MULTIPLIER: 1,
    SUPPORT_TREE_CARD_SCORE_MULTIPLIER: 0.45,
    SECONDARY_WEAPON_FAMILY_THRESHOLD: 0.7,
    BUILD_PATHS,
    ARCHETYPE_WEAPON_FAMILIES,
  };
})();
