(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Amazon Cards ──────────────────────────────────────────────────────
  // Bow & Crossbow: ranged single-target and AoE arrow attacks
  // Javelin & Spear: lightning/poison melee-range damage
  // Passive & Magic: evasion, utility, and summoned support

  const AMAZON_CARDS: Record<string, ClassCardDefinition> = {
    // ── Tier 1 (Lv 1) ── Starter cards
    amazon_magic_arrow: {
      id: "amazon_magic_arrow",
      title: "Magic Arrow",
      cost: 1,
      target: "enemy",
      text: "Deal 7 magic damage. Draw 1 card.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "amazon_magic_arrow",
      tier: 1,
    },
    amazon_jab: {
      id: "amazon_jab",
      title: "Jab",
      cost: 2,
      target: "enemy",
      text: "Deal 7 damage. Deal 6 damage.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "damage", value: 6 },
      ],
      skillRef: "amazon_jab",
      tier: 1,
    },
    amazon_inner_sight: {
      id: "amazon_inner_sight",
      title: "Inner Sight",
      cost: 1,
      target: "enemy",
      text: "Deal 3 damage. Your mercenary deals +8 to this target. Gain 4 Guard. Draw 1 card.",
      effects: [
        { kind: "damage", value: 3 },
        { kind: "mark_enemy_for_mercenary", value: 8 },
        { kind: "gain_guard_self", value: 4 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "amazon_inner_sight",
      tier: 1,
    },
    amazon_fire_arrow: {
      id: "amazon_fire_arrow",
      title: "Fire Arrow",
      cost: 1,
      target: "enemy",
      text: "Deal 4 damage. Apply 4 Burn.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "apply_burn", value: 4 },
      ],
      skillRef: "amazon_fire_arrow",
      tier: 1,
    },
    amazon_dodge: {
      id: "amazon_dodge",
      title: "Dodge",
      cost: 1,
      target: "none",
      text: "Gain 7 Guard.",
      effects: [{ kind: "gain_guard_self", value: 7 }],
      skillRef: "amazon_dodge",
      tier: 1,
    },
    amazon_critical_strike: {
      id: "amazon_critical_strike",
      title: "Critical Strike",
      cost: 2,
      target: "enemy",
      text: "Deal 14 damage.",
      effects: [{ kind: "damage", value: 14 }],
      skillRef: "amazon_critical_strike",
      tier: 1,
    },

    // ── Tier 2 (Lv 6-12) ── Early rewards
    amazon_cold_arrow: {
      id: "amazon_cold_arrow",
      title: "Cold Arrow",
      cost: 1,
      target: "enemy",
      text: "Deal 7 cold damage. Apply 1 Slow.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "apply_slow", value: 1 },
      ],
      skillRef: "amazon_cold_arrow",
      tier: 2,
    },
    amazon_multiple_shot: {
      id: "amazon_multiple_shot",
      title: "Multiple Shot",
      cost: 2,
      target: "none",
      text: "Deal 6 damage to all enemies.",
      effects: [{ kind: "damage_all", value: 6 }],
      skillRef: "amazon_multiple_shot",
      tier: 2,
    },
    amazon_power_strike: {
      id: "amazon_power_strike",
      title: "Power Strike",
      cost: 1,
      target: "enemy",
      text: "Deal 11 lightning damage. Apply 2 Paralyze. Gain 5 Guard.",
      effects: [
        { kind: "damage", value: 11 },
        { kind: "apply_paralyze", value: 2 },
        { kind: "gain_guard_self", value: 5 },
      ],
      behaviorTags: ["pressure", "setup", "mitigation", "payoff"],
      roleTag: "payoff",
      rewardRole: "engine",
      skillRef: "amazon_power_strike",
      tier: 2,
    },
    amazon_exploding_arrow: {
      id: "amazon_exploding_arrow",
      title: "Exploding Arrow",
      cost: 2,
      target: "enemy",
      text: "Deal 8 fire damage. Apply 3 Burn.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "apply_burn", value: 3 },
      ],
      skillRef: "amazon_exploding_arrow",
      tier: 2,
    },

    // ── Tier 3 (Lv 18-24) ── Mid-game
    amazon_guided_arrow: {
      id: "amazon_guided_arrow",
      title: "Guided Arrow",
      cost: 1,
      target: "enemy",
      text: "Deal 16 damage. Draw 1 card. Gain 5 Guard.",
      effects: [
        { kind: "damage", value: 16 },
        { kind: "draw", value: 1 },
        { kind: "gain_guard_self", value: 5 },
      ],
      skillRef: "amazon_guided_arrow",
      tier: 3,
    },
    amazon_charged_strike: {
      id: "amazon_charged_strike",
      title: "Charged Strike",
      cost: 2,
      target: "enemy",
      text: "Deal 12 lightning damage. Deal 12 lightning damage. Apply 3 Paralyze. Gain 10 Guard.",
      effects: [
        { kind: "damage", value: 12 },
        { kind: "damage", value: 12 },
        { kind: "apply_paralyze", value: 3 },
        { kind: "gain_guard_self", value: 10 },
      ],
      skillRef: "amazon_charged_strike",
      tier: 3,
    },
    amazon_strafe: {
      id: "amazon_strafe",
      title: "Strafe",
      cost: 2,
      target: "none",
      text: "Deal 8 damage to all enemies. Draw 1 card.",
      effects: [
        { kind: "damage_all", value: 8 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "amazon_strafe",
      tier: 3,
    },
    amazon_valkyrie: {
      id: "amazon_valkyrie",
      title: "Valkyrie",
      cost: 2,
      target: "none",
      text: "You and your mercenary gain 16 Guard. Mercenary next attack +10.",
      effects: [
        { kind: "gain_guard_party", value: 16 },
        { kind: "buff_mercenary_next_attack", value: 10 },
      ],
      skillRef: "amazon_valkyrie",
      tier: 3,
    },

    // ── Tier 4 (Lv 30) ── Late-game power cards
    amazon_freezing_arrow: {
      id: "amazon_freezing_arrow",
      title: "Freezing Arrow",
      cost: 2,
      target: "none",
      text: "Deal 9 cold damage to all enemies. Apply 1 Freeze and 1 Slow to all. Gain 5 Guard.",
      effects: [
        { kind: "damage_all", value: 9 },
        { kind: "apply_freeze_all", value: 1 },
        { kind: "apply_slow_all", value: 1 },
        { kind: "gain_guard_self", value: 5 },
      ],
      skillRef: "amazon_freezing_arrow",
      tier: 4,
    },
    amazon_lightning_fury: {
      id: "amazon_lightning_fury",
      title: "Lightning Fury",
      cost: 2,
      target: "none",
      text: "Deal 13 lightning damage to all enemies. Apply 3 Paralyze to all. Gain 8 Guard.",
      effects: [
        { kind: "damage_all", value: 13 },
        { kind: "apply_paralyze_all", value: 3 },
        { kind: "gain_guard_self", value: 8 },
      ],
      skillRef: "amazon_lightning_fury",
      tier: 4,
    },
  };

  const AMAZON_STARTER_DECK = [
    "amazon_magic_arrow", "amazon_magic_arrow",
    "amazon_jab", "amazon_jab", "amazon_jab",
    "amazon_fire_arrow", "amazon_fire_arrow",
    "amazon_inner_sight", "amazon_inner_sight",
    "rally_mercenary",
    "amazon_critical_strike",
    "amazon_dodge",
    "amazon_power_strike",
  ];

  function getCardIdsByTier(cards: Record<string, { id: string; tier: number }>, tier: number): string[] {
    return Object.values(cards)
      .filter((card) => card.tier === tier)
      .map((card) => card.id);
  }

  const AMAZON_REWARD_POOL = {
    early: getCardIdsByTier(AMAZON_CARDS, 2),
    mid: getCardIdsByTier(AMAZON_CARDS, 3),
    late: getCardIdsByTier(AMAZON_CARDS, 4),
  };

  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING = runtimeWindow.__ROUGE_CLASS_CARDS_STAGING || {};
  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING.amazon = {
    cards: AMAZON_CARDS,
    starterDeck: AMAZON_STARTER_DECK,
    rewardPool: AMAZON_REWARD_POOL,
  };
})();
