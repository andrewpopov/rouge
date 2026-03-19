(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Sorceress Cards ───────────────────────────────────────────────────
  // Cold: freeze + defense, AoE cold damage
  // Fire: high single-target and AoE burn damage
  // Lightning: burst damage and utility (teleport = draw)

  const SORCERESS_CARDS: Record<string, ClassCardDefinition> = {
    // ── Tier 1 ──
    sorceress_ice_bolt: {
      id: "sorceress_ice_bolt",
      title: "Ice Bolt",
      cost: 1,
      target: "enemy",
      text: "Deal 5 cold damage. Apply 1 Slow.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "apply_slow", value: 1 },
      ],
      skillRef: "sorceress_ice_bolt",
      tier: 1,
    },
    sorceress_fire_bolt: {
      id: "sorceress_fire_bolt",
      title: "Fire Bolt",
      cost: 1,
      target: "enemy",
      text: "Deal 6 fire damage. Apply 2 Burn.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "apply_burn", value: 2 },
      ],
      skillRef: "sorceress_fire_bolt",
      tier: 1,
    },
    sorceress_charged_bolt: {
      id: "sorceress_charged_bolt",
      title: "Charged Bolt",
      cost: 1,
      target: "enemy",
      text: "Deal 7 lightning damage. Apply 1 Paralyze.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "apply_paralyze", value: 1 },
      ],
      skillRef: "sorceress_charged_bolt",
      tier: 1,
    },
    sorceress_warmth: {
      id: "sorceress_warmth",
      title: "Warmth",
      cost: 1,
      target: "none",
      text: "Gain 5 Guard. Draw 2 cards.",
      effects: [
        { kind: "gain_guard_self", value: 5 },
        { kind: "draw", value: 2 },
      ],
      skillRef: "sorceress_warmth",
      tier: 1,
    },
    sorceress_energy_shield: {
      id: "sorceress_energy_shield",
      title: "Energy Shield",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Gain 4 Guard.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "gain_guard_self", value: 4 },
      ],
      skillRef: "sorceress_energy_shield",
      tier: 1,
    },
    sorceress_frozen_armor: {
      id: "sorceress_frozen_armor",
      title: "Frozen Armor",
      cost: 1,
      target: "none",
      text: "Heal 6. Gain 3 Guard.",
      effects: [
        { kind: "heal_hero", value: 6 },
        { kind: "gain_guard_self", value: 3 },
      ],
      skillRef: "sorceress_frozen_armor",
      tier: 1,
    },

    // ── Tier 2 ──
    sorceress_frost_nova: {
      id: "sorceress_frost_nova",
      title: "Frost Nova",
      cost: 2,
      target: "none",
      text: "Deal 4 cold damage to all enemies. Apply 1 Freeze to all.",
      effects: [
        { kind: "damage_all", value: 4 },
        { kind: "apply_freeze_all", value: 1 },
      ],
      skillRef: "sorceress_frost_nova",
      tier: 2,
    },
    sorceress_fireball: {
      id: "sorceress_fireball",
      title: "Fireball",
      cost: 2,
      target: "enemy",
      text: "Deal 10 fire damage. Apply 3 Burn.",
      effects: [
        { kind: "damage", value: 10 },
        { kind: "apply_burn", value: 3 },
      ],
      skillRef: "sorceress_fireball",
      tier: 2,
    },
    sorceress_static_field: {
      id: "sorceress_static_field",
      title: "Static Field",
      cost: 1,
      target: "none",
      text: "Deal 4 lightning damage to all enemies. Apply 1 Paralyze to all.",
      effects: [
        { kind: "damage_all", value: 4 },
        { kind: "apply_paralyze_all", value: 1 },
      ],
      skillRef: "sorceress_static_field",
      tier: 2,
    },
    sorceress_inferno: {
      id: "sorceress_inferno",
      title: "Inferno",
      cost: 1,
      target: "enemy",
      text: "Deal 5 fire damage. Apply 4 Burn.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "apply_burn", value: 4 },
      ],
      skillRef: "sorceress_inferno",
      tier: 2,
    },

    // ── Tier 3 ──
    sorceress_blizzard: {
      id: "sorceress_blizzard",
      title: "Blizzard",
      cost: 2,
      target: "none",
      text: "Deal 6 cold damage to all enemies. Apply 1 Freeze to all.",
      effects: [
        { kind: "damage_all", value: 6 },
        { kind: "apply_freeze_all", value: 1 },
      ],
      skillRef: "sorceress_blizzard",
      tier: 3,
    },
    sorceress_meteor: {
      id: "sorceress_meteor",
      title: "Meteor",
      cost: 2,
      target: "none",
      text: "Deal 9 fire damage to all enemies. Apply 3 Burn to all.",
      effects: [
        { kind: "damage_all", value: 9 },
        { kind: "apply_burn_all", value: 3 },
      ],
      skillRef: "sorceress_meteor",
      tier: 3,
    },
    sorceress_chain_lightning: {
      id: "sorceress_chain_lightning",
      title: "Chain Lightning",
      cost: 2,
      target: "none",
      text: "Deal 7 lightning damage to all enemies. Apply 1 Paralyze to all.",
      effects: [
        { kind: "damage_all", value: 7 },
        { kind: "apply_paralyze_all", value: 1 },
      ],
      skillRef: "sorceress_chain_lightning",
      tier: 3,
    },
    sorceress_teleport: {
      id: "sorceress_teleport",
      title: "Teleport",
      cost: 1,
      target: "none",
      text: "Gain 8 Guard. Draw 2 cards.",
      effects: [
        { kind: "gain_guard_self", value: 8 },
        { kind: "draw", value: 2 },
      ],
      skillRef: "sorceress_teleport",
      tier: 3,
    },

    // ── Tier 4 ──
    sorceress_frozen_orb: {
      id: "sorceress_frozen_orb",
      title: "Frozen Orb",
      cost: 2,
      target: "none",
      text: "Deal 8 cold damage to all enemies. Apply 2 Freeze to all.",
      effects: [
        { kind: "damage_all", value: 8 },
        { kind: "apply_freeze_all", value: 2 },
      ],
      skillRef: "sorceress_frozen_orb",
      tier: 4,
    },
    sorceress_hydra: {
      id: "sorceress_hydra",
      title: "Hydra",
      cost: 2,
      target: "none",
      text: "Deal 8 fire damage to all enemies. Apply 5 Burn to all.",
      effects: [
        { kind: "damage_all", value: 8 },
        { kind: "apply_burn_all", value: 5 },
      ],
      skillRef: "sorceress_hydra",
      tier: 4,
    },
    sorceress_lightning_mastery: {
      id: "sorceress_lightning_mastery",
      title: "Lightning Mastery",
      cost: 2,
      target: "none",
      text: "Deal 10 lightning damage to all enemies. Apply 2 Paralyze to all.",
      effects: [
        { kind: "damage_all", value: 10 },
        { kind: "apply_paralyze_all", value: 2 },
      ],
      skillRef: "sorceress_lightning_mastery",
      tier: 4,
    },
  };

  const SORCERESS_STARTER_DECK = [
    "sorceress_fire_bolt", "sorceress_fire_bolt", "sorceress_fire_bolt",
    "sorceress_ice_bolt", "sorceress_ice_bolt",
    "sorceress_charged_bolt", "sorceress_charged_bolt",
    "sorceress_warmth", "sorceress_warmth",
    "rally_mercenary",
    "sorceress_frozen_armor",
    "sorceress_energy_shield",
    "sorceress_energy_shield",
  ];

  function getCardIdsByTier(cards: Record<string, { id: string; tier: number }>, tier: number): string[] {
    return Object.values(cards)
      .filter((card) => card.tier === tier)
      .map((card) => card.id);
  }

  const SORCERESS_REWARD_POOL = {
    early: getCardIdsByTier(SORCERESS_CARDS, 2),
    mid: getCardIdsByTier(SORCERESS_CARDS, 3),
    late: getCardIdsByTier(SORCERESS_CARDS, 4),
  };

  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING = runtimeWindow.__ROUGE_CLASS_CARDS_STAGING || {};
  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING.sorceress = {
    cards: SORCERESS_CARDS,
    starterDeck: SORCERESS_STARTER_DECK,
    rewardPool: SORCERESS_REWARD_POOL,
  };
})();
