(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Barbarian Cards ───────────────────────────────────────────────────
  // Combat: heavy melee damage, multi-hit, AoE
  // Masteries: passive weapon bonuses (guard, toughness)
  // Warcries: party-wide buffs and debuffs

  const BARBARIAN_CARDS: Record<string, ClassCardDefinition> = {
    // ── Tier 1 ──
    barbarian_bash: {
      id: "barbarian_bash",
      title: "Bash",
      cost: 1,
      target: "enemy",
      text: "Deal 9 damage.",
      effects: [{ kind: "damage", value: 9 }],
      skillRef: "barbarian_bash",
      tier: 1,
    },
    barbarian_howl: {
      id: "barbarian_howl",
      title: "Howl",
      cost: 1,
      target: "none",
      text: "Gain 6 Guard. Draw 1 card.",
      effects: [
        { kind: "gain_guard_self", value: 6 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "barbarian_howl",
      tier: 1,
    },
    barbarian_sword_mastery: {
      id: "barbarian_sword_mastery",
      title: "Sword Mastery",
      cost: 1,
      target: "enemy",
      text: "Deal 7 damage. Gain 3 Guard.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "gain_guard_self", value: 3 },
      ],
      skillRef: "barbarian_sword_mastery",
      tier: 1,
    },
    barbarian_find_potion: {
      id: "barbarian_find_potion",
      title: "Find Potion",
      cost: 1,
      target: "none",
      text: "Heal 6. Gain 4 Guard.",
      effects: [
        { kind: "heal_hero", value: 6 },
        { kind: "gain_guard_self", value: 4 },
      ],
      skillRef: "barbarian_find_potion",
      tier: 1,
    },
    barbarian_iron_skin: {
      id: "barbarian_iron_skin",
      title: "Iron Skin",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Gain 4 Guard.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "gain_guard_self", value: 4 },
      ],
      skillRef: "barbarian_iron_skin",
      tier: 1,
    },
    barbarian_battle_recovery: {
      id: "barbarian_battle_recovery",
      title: "Battle Recovery",
      cost: 1,
      target: "none",
      text: "Heal 6. Gain 3 Guard.",
      effects: [
        { kind: "heal_hero", value: 6 },
        { kind: "gain_guard_self", value: 3 },
      ],
      skillRef: "barbarian_battle_recovery",
      tier: 1,
    },

    // ── Tier 2 ──
    barbarian_double_swing: {
      id: "barbarian_double_swing",
      title: "Double Swing",
      cost: 1,
      target: "enemy",
      text: "Deal 6 damage. Deal 5 damage.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "damage", value: 5 },
      ],
      skillRef: "barbarian_double_swing",
      tier: 2,
    },
    barbarian_leap: {
      id: "barbarian_leap",
      title: "Leap",
      cost: 1,
      target: "enemy",
      text: "Deal 8 damage. Gain 4 Guard.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "gain_guard_self", value: 4 },
      ],
      skillRef: "barbarian_leap",
      tier: 2,
    },
    barbarian_shout: {
      id: "barbarian_shout",
      title: "Shout",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 7 Guard.",
      effects: [{ kind: "gain_guard_party", value: 7 }],
      skillRef: "barbarian_shout",
      tier: 2,
    },
    barbarian_stun: {
      id: "barbarian_stun",
      title: "Stun",
      cost: 1,
      target: "enemy",
      text: "Deal 10 damage.",
      effects: [{ kind: "damage", value: 10 }],
      skillRef: "barbarian_stun",
      tier: 2,
    },

    // ── Tier 3 ──
    barbarian_concentrate: {
      id: "barbarian_concentrate",
      title: "Concentrate",
      cost: 1,
      target: "enemy",
      text: "Deal 10 damage. Gain 6 Guard.",
      effects: [
        { kind: "damage", value: 10 },
        { kind: "gain_guard_self", value: 6 },
      ],
      skillRef: "barbarian_concentrate",
      tier: 3,
    },
    barbarian_frenzy: {
      id: "barbarian_frenzy",
      title: "Frenzy",
      cost: 2,
      target: "enemy",
      text: "Deal 8 damage. Deal 7 damage. Draw 1 card.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "damage", value: 7 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "barbarian_frenzy",
      tier: 3,
    },
    barbarian_battle_orders: {
      id: "barbarian_battle_orders",
      title: "Battle Orders",
      cost: 2,
      target: "none",
      text: "You and your mercenary gain 10 Guard. Mercenary next attack +4.",
      effects: [
        { kind: "gain_guard_party", value: 10 },
        { kind: "buff_mercenary_next_attack", value: 4 },
      ],
      skillRef: "barbarian_battle_orders",
      tier: 3,
    },
    barbarian_leap_attack: {
      id: "barbarian_leap_attack",
      title: "Leap Attack",
      cost: 2,
      target: "none",
      text: "Deal 8 damage to all enemies.",
      effects: [{ kind: "damage_all", value: 8 }],
      skillRef: "barbarian_leap_attack",
      tier: 3,
    },

    // ── Tier 4 ──
    barbarian_whirlwind: {
      id: "barbarian_whirlwind",
      title: "Whirlwind",
      cost: 2,
      target: "none",
      text: "Deal 10 damage to all enemies. Gain 5 Guard.",
      effects: [
        { kind: "damage_all", value: 10 },
        { kind: "gain_guard_self", value: 5 },
      ],
      skillRef: "barbarian_whirlwind",
      tier: 4,
    },
    barbarian_berserk: {
      id: "barbarian_berserk",
      title: "Berserk",
      cost: 2,
      target: "enemy",
      text: "Deal 18 magic damage.",
      effects: [{ kind: "damage", value: 18 }],
      skillRef: "barbarian_berserk",
      tier: 4,
    },
    barbarian_war_cry: {
      id: "barbarian_war_cry",
      title: "War Cry",
      cost: 2,
      target: "none",
      text: "Deal 6 damage to all enemies. You and your mercenary gain 8 Guard.",
      effects: [
        { kind: "damage_all", value: 6 },
        { kind: "gain_guard_party", value: 8 },
      ],
      skillRef: "barbarian_war_cry",
      tier: 4,
    },
  };

  const BARBARIAN_STARTER_DECK = [
    "barbarian_bash", "barbarian_bash", "barbarian_bash",
    "barbarian_sword_mastery", "barbarian_sword_mastery",
    "barbarian_howl", "barbarian_howl",
    "barbarian_find_potion", "barbarian_find_potion",
    "rally_mercenary",
    "barbarian_battle_recovery",
    "barbarian_iron_skin",
    "barbarian_iron_skin",
  ];

  function getCardIdsByTier(cards: Record<string, { id: string; tier: number }>, tier: number): string[] {
    return Object.values(cards)
      .filter((card) => card.tier === tier)
      .map((card) => card.id);
  }

  const BARBARIAN_REWARD_POOL = {
    early: getCardIdsByTier(BARBARIAN_CARDS, 2),
    mid: getCardIdsByTier(BARBARIAN_CARDS, 3),
    late: getCardIdsByTier(BARBARIAN_CARDS, 4),
  };

  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING = runtimeWindow.__ROUGE_CLASS_CARDS_STAGING || {};
  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING.barbarian = {
    cards: BARBARIAN_CARDS,
    starterDeck: BARBARIAN_STARTER_DECK,
    rewardPool: BARBARIAN_REWARD_POOL,
  };
})();
