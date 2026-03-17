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
      text: "Deal 7 magic damage. Ignores guard.",
      effects: [{ kind: "damage", value: 7 }],
      skillRef: "amazon_magic_arrow",
      tier: 1,
    },
    amazon_jab: {
      id: "amazon_jab",
      title: "Jab",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Deal 3 damage.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "damage", value: 3 },
      ],
      skillRef: "amazon_jab",
      tier: 1,
    },
    amazon_inner_sight: {
      id: "amazon_inner_sight",
      title: "Inner Sight",
      cost: 1,
      target: "enemy",
      text: "Deal 3 damage. Your mercenary deals +5 to this target.",
      effects: [
        { kind: "damage", value: 3 },
        { kind: "mark_enemy_for_mercenary", value: 5 },
      ],
      skillRef: "amazon_inner_sight",
      tier: 1,
    },
    amazon_fire_arrow: {
      id: "amazon_fire_arrow",
      title: "Fire Arrow",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Apply 2 Burn.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "apply_burn", value: 2 },
      ],
      skillRef: "amazon_fire_arrow",
      tier: 1,
    },

    // ── Tier 2 (Lv 6-12) ── Early rewards
    amazon_cold_arrow: {
      id: "amazon_cold_arrow",
      title: "Cold Arrow",
      cost: 1,
      target: "enemy",
      text: "Deal 8 cold damage. Gain 3 Guard.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "gain_guard_self", value: 3 },
      ],
      skillRef: "amazon_cold_arrow",
      tier: 2,
    },
    amazon_multiple_shot: {
      id: "amazon_multiple_shot",
      title: "Multiple Shot",
      cost: 2,
      target: "none",
      text: "Deal 5 damage to all enemies.",
      effects: [{ kind: "damage_all", value: 5 }],
      skillRef: "amazon_multiple_shot",
      tier: 2,
    },
    amazon_power_strike: {
      id: "amazon_power_strike",
      title: "Power Strike",
      cost: 1,
      target: "enemy",
      text: "Deal 10 lightning damage.",
      effects: [{ kind: "damage", value: 10 }],
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
      text: "Deal 12 damage. Draw 1 card.",
      effects: [
        { kind: "damage", value: 12 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "amazon_guided_arrow",
      tier: 3,
    },
    amazon_charged_strike: {
      id: "amazon_charged_strike",
      title: "Charged Strike",
      cost: 2,
      target: "enemy",
      text: "Deal 14 lightning damage.",
      effects: [{ kind: "damage", value: 14 }],
      skillRef: "amazon_charged_strike",
      tier: 3,
    },
    amazon_strafe: {
      id: "amazon_strafe",
      title: "Strafe",
      cost: 2,
      target: "none",
      text: "Deal 7 damage to all enemies. Draw 1 card.",
      effects: [
        { kind: "damage_all", value: 7 },
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
      text: "You and your mercenary gain 8 Guard. Mercenary next attack +4.",
      effects: [
        { kind: "gain_guard_party", value: 8 },
        { kind: "buff_mercenary_next_attack", value: 4 },
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
      text: "Deal 8 cold damage to all enemies. Gain 6 Guard.",
      effects: [
        { kind: "damage_all", value: 8 },
        { kind: "gain_guard_self", value: 6 },
      ],
      skillRef: "amazon_freezing_arrow",
      tier: 4,
    },
    amazon_lightning_fury: {
      id: "amazon_lightning_fury",
      title: "Lightning Fury",
      cost: 2,
      target: "none",
      text: "Deal 10 lightning damage to all enemies.",
      effects: [{ kind: "damage_all", value: 10 }],
      skillRef: "amazon_lightning_fury",
      tier: 4,
    },
  };

  const AMAZON_STARTER_DECK = [
    "amazon_magic_arrow", "amazon_magic_arrow", "amazon_magic_arrow",
    "amazon_jab", "amazon_jab",
    "amazon_fire_arrow", "amazon_fire_arrow",
    "amazon_inner_sight", "amazon_inner_sight",
    "rally_mercenary",
    "second_wind",
    "shield_slam",
    "shield_slam",
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
