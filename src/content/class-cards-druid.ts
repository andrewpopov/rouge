(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Druid Cards ───────────────────────────────────────────────────────
  // Elemental: fire/wind AoE spells
  // Shape Shifting: melee damage + self-healing + guard
  // Summoning: companion support and nature spirits

  const DRUID_CARDS: Record<string, ClassCardDefinition> = {
    // ── Tier 1 ──
    druid_firestorm: {
      id: "druid_firestorm",
      title: "Firestorm",
      cost: 1,
      target: "enemy",
      text: "Deal 5 fire damage. Apply 2 Burn.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "apply_burn", value: 2 },
      ],
      skillRef: "druid_firestorm",
      tier: 1,
    },
    druid_werewolf: {
      id: "druid_werewolf",
      title: "Werewolf",
      cost: 1,
      target: "enemy",
      text: "Deal 8 damage. Gain 2 Guard.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "gain_guard_self", value: 2 },
      ],
      skillRef: "druid_werewolf",
      tier: 1,
    },
    druid_raven: {
      id: "druid_raven",
      title: "Raven",
      cost: 1,
      target: "enemy",
      text: "Deal 4 damage. Your mercenary deals +4 to this target.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "mark_enemy_for_mercenary", value: 4 },
      ],
      skillRef: "druid_raven",
      tier: 1,
    },
    druid_poison_creeper: {
      id: "druid_poison_creeper",
      title: "Poison Creeper",
      cost: 1,
      target: "enemy",
      text: "Deal 4 poison damage. Apply 4 Poison.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "apply_poison", value: 4 },
      ],
      skillRef: "druid_poison_creeper",
      tier: 1,
    },
    druid_cyclone_armor: {
      id: "druid_cyclone_armor",
      title: "Cyclone Armor",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Gain 3 Guard.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "gain_guard_self", value: 3 },
      ],
      skillRef: "druid_cyclone_armor",
      tier: 1,
    },
    druid_lycanthropy: {
      id: "druid_lycanthropy",
      title: "Lycanthropy",
      cost: 1,
      target: "none",
      text: "Heal 4. Gain 1 Guard.",
      effects: [
        { kind: "heal_hero", value: 4 },
        { kind: "gain_guard_self", value: 1 },
      ],
      skillRef: "druid_lycanthropy",
      tier: 1,
    },

    // ── Tier 2 ──
    druid_molten_boulder: {
      id: "druid_molten_boulder",
      title: "Molten Boulder",
      cost: 2,
      target: "enemy",
      text: "Deal 10 fire damage. Apply 2 Burn.",
      effects: [
        { kind: "damage", value: 10 },
        { kind: "apply_burn", value: 2 },
      ],
      skillRef: "druid_molten_boulder",
      tier: 2,
    },
    druid_werebear: {
      id: "druid_werebear",
      title: "Werebear",
      cost: 1,
      target: "enemy",
      text: "Deal 7 damage. Gain 5 Guard.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "gain_guard_self", value: 5 },
      ],
      skillRef: "druid_werebear",
      tier: 2,
    },
    druid_oak_sage: {
      id: "druid_oak_sage",
      title: "Oak Sage",
      cost: 1,
      target: "none",
      text: "Heal 7. Heal your mercenary 7.",
      effects: [
        { kind: "heal_hero", value: 7 },
        { kind: "heal_mercenary", value: 7 },
      ],
      skillRef: "druid_oak_sage",
      tier: 2,
    },
    druid_fissure: {
      id: "druid_fissure",
      title: "Fissure",
      cost: 2,
      target: "none",
      text: "Deal 5 fire damage to all enemies. Apply 2 Burn to all.",
      effects: [
        { kind: "damage_all", value: 5 },
        { kind: "apply_burn_all", value: 2 },
      ],
      skillRef: "druid_fissure",
      tier: 2,
    },

    // ── Tier 3 ──
    druid_volcano: {
      id: "druid_volcano",
      title: "Volcano",
      cost: 2,
      target: "none",
      text: "Deal 7 fire damage to all enemies. Apply 3 Burn to all.",
      effects: [
        { kind: "damage_all", value: 7 },
        { kind: "apply_burn_all", value: 3 },
      ],
      skillRef: "druid_volcano",
      tier: 3,
    },
    druid_fury: {
      id: "druid_fury",
      title: "Fury",
      cost: 2,
      target: "enemy",
      text: "Deal 12 damage. Deal 11 damage. Deal 10 damage. Gain 16 Guard.",
      effects: [
        { kind: "damage", value: 12 },
        { kind: "damage", value: 11 },
        { kind: "damage", value: 10 },
        { kind: "gain_guard_self", value: 16 },
      ],
      skillRef: "druid_fury",
      tier: 3,
    },
    druid_heart_of_wolverine: {
      id: "druid_heart_of_wolverine",
      title: "Heart of Wolverine",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 16 Guard. Mercenary next attack +14.",
      effects: [
        { kind: "gain_guard_party", value: 16 },
        { kind: "buff_mercenary_next_attack", value: 14 },
      ],
      skillRef: "druid_heart_of_wolverine",
      tier: 3,
    },
    druid_tornado: {
      id: "druid_tornado",
      title: "Tornado",
      cost: 2,
      target: "none",
      text: "Deal 11 damage to all enemies.",
      effects: [{ kind: "damage_all", value: 11 }],
      skillRef: "druid_tornado",
      tier: 3,
    },

    // ── Tier 4 ──
    druid_hurricane: {
      id: "druid_hurricane",
      title: "Hurricane",
      cost: 2,
      target: "none",
      text: "Deal 15 cold damage to all enemies. Gain 18 Guard.",
      effects: [
        { kind: "damage_all", value: 15 },
        { kind: "gain_guard_self", value: 18 },
      ],
      skillRef: "druid_hurricane",
      tier: 4,
    },
    druid_armageddon: {
      id: "druid_armageddon",
      title: "Armageddon",
      cost: 2,
      target: "none",
      text: "Deal 19 fire damage to all enemies. Apply 12 Burn to all. Gain 20 Guard.",
      effects: [
        { kind: "damage_all", value: 19 },
        { kind: "apply_burn_all", value: 12 },
        { kind: "gain_guard_self", value: 20 },
      ],
      skillRef: "druid_armageddon",
      tier: 4,
    },
    druid_summon_grizzly: {
      id: "druid_summon_grizzly",
      title: "Summon Grizzly",
      cost: 2,
      target: "none",
      text: "Heal 10. Heal your mercenary 14. You and your mercenary gain 36 Guard. Mercenary next attack +20.",
      effects: [
        { kind: "heal_hero", value: 10 },
        { kind: "heal_mercenary", value: 14 },
        { kind: "gain_guard_party", value: 36 },
        { kind: "buff_mercenary_next_attack", value: 20 },
      ],
      skillRef: "druid_summon_grizzly",
      tier: 4,
    },
  };

  const DRUID_STARTER_DECK = [
    "druid_firestorm", "druid_firestorm", "druid_firestorm",
    "druid_werewolf", "druid_werewolf",
    "druid_raven", "druid_raven",
    "druid_poison_creeper",
    "rally_mercenary",
    "druid_lycanthropy",
    "druid_cyclone_armor",
    "druid_cyclone_armor",
    "druid_cyclone_armor",
  ];

  function getCardIdsByTier(cards: Record<string, { id: string; tier: number }>, tier: number): string[] {
    return Object.values(cards)
      .filter((card) => card.tier === tier)
      .map((card) => card.id);
  }

  const DRUID_REWARD_POOL = {
    early: getCardIdsByTier(DRUID_CARDS, 2),
    mid: getCardIdsByTier(DRUID_CARDS, 3),
    late: getCardIdsByTier(DRUID_CARDS, 4),
  };

  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING = runtimeWindow.__ROUGE_CLASS_CARDS_STAGING || {};
  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING.druid = {
    cards: DRUID_CARDS,
    starterDeck: DRUID_STARTER_DECK,
    rewardPool: DRUID_REWARD_POOL,
  };
})();
