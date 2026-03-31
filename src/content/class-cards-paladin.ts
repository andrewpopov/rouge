(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Paladin Cards ─────────────────────────────────────────────────────
  // Combat: holy damage and smiting strikes
  // Defensive Auras: party guard and healing
  // Offensive Auras: damage amplification and elemental strikes

  const PALADIN_CARDS: Record<string, ClassCardDefinition> = {
    // ── Tier 1 ──
    paladin_sacrifice: {
      id: "paladin_sacrifice",
      title: "Sacrifice",
      cost: 2,
      target: "enemy",
      text: "Deal 15 damage.",
      effects: [{ kind: "damage", value: 15 }],
      behaviorTags: ["pressure", "payoff"],
      roleTag: "payoff",
      skillRef: "paladin_sacrifice",
      tier: 1,
    },
    paladin_might: {
      id: "paladin_might",
      title: "Might",
      cost: 1,
      target: "enemy",
      text: "Deal 4 damage. Mercenary next attack +6. Draw 1 card.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "buff_mercenary_next_attack", value: 6 },
        { kind: "draw", value: 1 },
      ],
      behaviorTags: ["pressure", "setup", "support", "salvage"],
      roleTag: "setup",
      splashRole: "utility_splash_ok",
      skillRef: "paladin_might",
      tier: 1,
    },
    paladin_prayer: {
      id: "paladin_prayer",
      title: "Prayer",
      cost: 1,
      target: "none",
      text: "Heal 4. Heal your mercenary 4. Gain 2 Guard.",
      effects: [
        { kind: "heal_hero", value: 4 },
        { kind: "heal_mercenary", value: 4 },
        { kind: "gain_guard_self", value: 2 },
      ],
      skillRef: "paladin_prayer",
      tier: 1,
    },
    paladin_smite: {
      id: "paladin_smite",
      title: "Smite",
      cost: 1,
      target: "enemy",
      text: "Deal 6 damage. Gain 5 Guard.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "gain_guard_self", value: 5 },
      ],
      skillRef: "paladin_smite",
      tier: 1,
    },
    paladin_thorns: {
      id: "paladin_thorns",
      title: "Thorns",
      cost: 1,
      target: "enemy",
      text: "Deal 4 damage. You and your mercenary gain 4 Guard.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "gain_guard_party", value: 4 },
      ],
      behaviorTags: ["pressure", "mitigation", "protection", "support"],
      roleTag: "support",
      splashRole: "utility_splash_ok",
      skillRef: "paladin_thorns",
      tier: 1,
    },
    paladin_cleansing: {
      id: "paladin_cleansing",
      title: "Cleansing",
      cost: 1,
      target: "none",
      text: "Heal 4. Draw 1 card.",
      effects: [
        { kind: "heal_hero", value: 4 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "paladin_cleansing",
      tier: 1,
    },

    // ── Tier 2 ──
    paladin_holy_bolt: {
      id: "paladin_holy_bolt",
      title: "Holy Bolt",
      cost: 1,
      target: "enemy",
      text: "Deal 8 magic damage. Heal 3.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "heal_hero", value: 3 },
      ],
      skillRef: "paladin_holy_bolt",
      tier: 2,
    },
    paladin_holy_fire: {
      id: "paladin_holy_fire",
      title: "Holy Fire",
      cost: 1,
      target: "enemy",
      text: "Deal 6 fire damage. Apply 3 Burn.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "apply_burn", value: 3 },
      ],
      skillRef: "paladin_holy_fire",
      tier: 2,
    },
    paladin_defiance: {
      id: "paladin_defiance",
      title: "Defiance",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 8 Guard.",
      effects: [{ kind: "gain_guard_party", value: 8 }],
      skillRef: "paladin_defiance",
      tier: 2,
    },
    paladin_zeal: {
      id: "paladin_zeal",
      title: "Zeal",
      cost: 2,
      target: "enemy",
      text: "Deal 5 damage. Deal 4 damage. Deal 3 damage. Gain 5 Guard.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "damage", value: 4 },
        { kind: "damage", value: 3 },
        { kind: "gain_guard_self", value: 5 },
      ],
      behaviorTags: ["pressure", "payoff", "mitigation"],
      roleTag: "payoff",
      rewardRole: "engine",
      skillRef: "paladin_zeal",
      tier: 2,
    },

    // ── Tier 3 ──
    paladin_vengeance: {
      id: "paladin_vengeance",
      title: "Vengeance",
      cost: 2,
      target: "enemy",
      text: "Deal 13 damage. Apply 5 Burn. Gain 5 Guard.",
      effects: [
        { kind: "damage", value: 13 },
        { kind: "apply_burn", value: 5 },
        { kind: "gain_guard_self", value: 5 },
      ],
      skillRef: "paladin_vengeance",
      tier: 3,
    },
    paladin_blessed_hammer: {
      id: "paladin_blessed_hammer",
      title: "Blessed Hammer",
      cost: 2,
      target: "none",
      text: "Deal 9 magic damage to all enemies.",
      effects: [{ kind: "damage_all", value: 9 }],
      skillRef: "paladin_blessed_hammer",
      tier: 3,
    },
    paladin_holy_freeze: {
      id: "paladin_holy_freeze",
      title: "Holy Freeze",
      cost: 2,
      target: "none",
      text: "Deal 7 cold damage to all enemies. You and your mercenary gain 8 Guard.",
      effects: [
        { kind: "damage_all", value: 7 },
        { kind: "gain_guard_party", value: 8 },
      ],
      skillRef: "paladin_holy_freeze",
      tier: 3,
    },
    paladin_holy_shield: {
      id: "paladin_holy_shield",
      title: "Holy Shield",
      cost: 1,
      target: "none",
      text: "Gain 22 Guard. Draw 3 cards.",
      effects: [
        { kind: "gain_guard_self", value: 22 },
        { kind: "draw", value: 3 },
      ],
      skillRef: "paladin_holy_shield",
      tier: 3,
    },

    // ── Tier 4 ──
    paladin_fist_of_the_heavens: {
      id: "paladin_fist_of_the_heavens",
      title: "Fist of the Heavens",
      cost: 2,
      target: "enemy",
      text: "Deal 22 magic damage. Heal 12. Gain 6 Guard.",
      effects: [
        { kind: "damage", value: 22 },
        { kind: "heal_hero", value: 12 },
        { kind: "gain_guard_self", value: 6 },
      ],
      skillRef: "paladin_fist_of_the_heavens",
      tier: 4,
    },
    paladin_fanaticism: {
      id: "paladin_fanaticism",
      title: "Fanaticism",
      cost: 2,
      target: "none",
      text: "You and your mercenary gain 12 Guard. Mercenary next attack +10.",
      effects: [
        { kind: "gain_guard_party", value: 12 },
        { kind: "buff_mercenary_next_attack", value: 10 },
      ],
      skillRef: "paladin_fanaticism",
      tier: 4,
    },
    paladin_conviction: {
      id: "paladin_conviction",
      title: "Conviction",
      cost: 2,
      target: "none",
      text: "Deal 13 damage to all enemies. You and your mercenary gain 12 Guard. Your mercenary deals +10 to all targets.",
      effects: [
        { kind: "damage_all", value: 13 },
        { kind: "gain_guard_party", value: 12 },
        { kind: "buff_mercenary_next_attack", value: 10 },
      ],
      skillRef: "paladin_conviction",
      tier: 4,
    },
  };

  const PALADIN_STARTER_DECK = [
    "paladin_sacrifice",
    "paladin_smite", "paladin_smite",
    "paladin_might", "paladin_might",
    "paladin_prayer",
    "rally_mercenary",
    "paladin_zeal",
    "paladin_cleansing",
    "paladin_thorns",
    "paladin_holy_fire",
    "paladin_defiance", "paladin_defiance",
  ];

  function getCardIdsByTier(cards: Record<string, { id: string; tier: number }>, tier: number): string[] {
    return Object.values(cards)
      .filter((card) => card.tier === tier)
      .map((card) => card.id);
  }

  const PALADIN_REWARD_POOL = {
    early: getCardIdsByTier(PALADIN_CARDS, 2),
    mid: getCardIdsByTier(PALADIN_CARDS, 3),
    late: getCardIdsByTier(PALADIN_CARDS, 4),
  };

  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING = runtimeWindow.__ROUGE_CLASS_CARDS_STAGING || {};
  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING.paladin = {
    cards: PALADIN_CARDS,
    starterDeck: PALADIN_STARTER_DECK,
    rewardPool: PALADIN_REWARD_POOL,
  };
})();
