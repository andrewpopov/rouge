(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Assassin Cards ────────────────────────────────────────────────────
  // Martial Arts: combo hits that build up damage
  // Shadow Disciplines: buffs, evasion, shadow clones
  // Traps: fire/lightning AoE and burn effects

  const ASSASSIN_CARDS: Record<string, ClassCardDefinition> = {
    // ── Tier 1 ──
    assassin_tiger_strike: {
      id: "assassin_tiger_strike",
      title: "Tiger Strike",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Deal 4 damage.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "damage", value: 4 },
      ],
      skillRef: "assassin_tiger_strike",
      tier: 1,
    },
    assassin_fire_blast: {
      id: "assassin_fire_blast",
      title: "Fire Blast",
      cost: 1,
      target: "enemy",
      text: "Deal 5 fire damage. Apply 2 Burn.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "apply_burn", value: 2 },
      ],
      skillRef: "assassin_fire_blast",
      tier: 1,
    },
    assassin_claw_mastery: {
      id: "assassin_claw_mastery",
      title: "Claw Mastery",
      cost: 1,
      target: "enemy",
      text: "Deal 8 damage.",
      effects: [{ kind: "damage", value: 8 }],
      skillRef: "assassin_claw_mastery",
      tier: 1,
    },
    assassin_psychic_hammer: {
      id: "assassin_psychic_hammer",
      title: "Psychic Hammer",
      cost: 1,
      target: "enemy",
      text: "Deal 4 damage. Gain 4 Guard.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "gain_guard_self", value: 4 },
      ],
      skillRef: "assassin_psychic_hammer",
      tier: 1,
    },
    assassin_blade_shield: {
      id: "assassin_blade_shield",
      title: "Blade Shield",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Gain 4 Guard.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "gain_guard_self", value: 4 },
      ],
      skillRef: "assassin_blade_shield",
      tier: 1,
    },
    assassin_cloak_of_shadows: {
      id: "assassin_cloak_of_shadows",
      title: "Cloak of Shadows",
      cost: 1,
      target: "none",
      text: "Heal 6. Gain 3 Guard.",
      effects: [
        { kind: "heal_hero", value: 6 },
        { kind: "gain_guard_self", value: 3 },
      ],
      skillRef: "assassin_cloak_of_shadows",
      tier: 1,
    },

    // ── Tier 2 ──
    assassin_fists_of_fire: {
      id: "assassin_fists_of_fire",
      title: "Fists of Fire",
      cost: 1,
      target: "enemy",
      text: "Deal 7 fire damage. Apply 2 Burn.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "apply_burn", value: 2 },
      ],
      skillRef: "assassin_fists_of_fire",
      tier: 2,
    },
    assassin_burst_of_speed: {
      id: "assassin_burst_of_speed",
      title: "Burst of Speed",
      cost: 1,
      target: "none",
      text: "Gain 6 Guard. Draw 2 cards.",
      effects: [
        { kind: "gain_guard_self", value: 6 },
        { kind: "draw", value: 2 },
      ],
      skillRef: "assassin_burst_of_speed",
      tier: 2,
    },
    assassin_wake_of_fire: {
      id: "assassin_wake_of_fire",
      title: "Wake of Fire",
      cost: 2,
      target: "none",
      text: "Deal 4 fire damage to all enemies. Apply 2 Burn to all.",
      effects: [
        { kind: "damage_all", value: 4 },
        { kind: "apply_burn_all", value: 2 },
      ],
      skillRef: "assassin_wake_of_fire",
      tier: 2,
    },
    assassin_cobra_strike: {
      id: "assassin_cobra_strike",
      title: "Cobra Strike",
      cost: 1,
      target: "enemy",
      text: "Deal 9 damage. Heal 5.",
      effects: [
        { kind: "damage", value: 9 },
        { kind: "heal_hero", value: 5 },
      ],
      skillRef: "assassin_cobra_strike",
      tier: 2,
    },

    // ── Tier 3 ──
    assassin_claws_of_thunder: {
      id: "assassin_claws_of_thunder",
      title: "Claws of Thunder",
      cost: 2,
      target: "enemy",
      text: "Deal 16 lightning damage.",
      effects: [{ kind: "damage", value: 16 }],
      skillRef: "assassin_claws_of_thunder",
      tier: 3,
    },
    assassin_fade: {
      id: "assassin_fade",
      title: "Fade",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 14 Guard.",
      effects: [{ kind: "gain_guard_party", value: 14 }],
      skillRef: "assassin_fade",
      tier: 3,
    },
    assassin_lightning_sentry: {
      id: "assassin_lightning_sentry",
      title: "Lightning Sentry",
      cost: 2,
      target: "none",
      text: "Deal 7 lightning damage to all enemies. Apply 1 Paralyze to all.",
      effects: [
        { kind: "damage_all", value: 7 },
        { kind: "apply_paralyze_all", value: 1 },
      ],
      skillRef: "assassin_lightning_sentry",
      tier: 3,
    },
    assassin_shadow_warrior: {
      id: "assassin_shadow_warrior",
      title: "Shadow Warrior",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 5 Guard. Heal your mercenary 10. Mercenary next attack +7.",
      effects: [
        { kind: "gain_guard_party", value: 5 },
        { kind: "heal_mercenary", value: 10 },
        { kind: "buff_mercenary_next_attack", value: 7 },
      ],
      skillRef: "assassin_shadow_warrior",
      tier: 3,
    },

    // ── Tier 4 ──
    assassin_phoenix_strike: {
      id: "assassin_phoenix_strike",
      title: "Phoenix Strike",
      cost: 2,
      target: "enemy",
      text: "Deal 18 damage. Apply 4 Burn. Gain 8 Guard. Draw 1 card.",
      effects: [
        { kind: "damage", value: 18 },
        { kind: "apply_burn", value: 4 },
        { kind: "gain_guard_self", value: 8 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "assassin_phoenix_strike",
      tier: 4,
    },
    assassin_death_sentry: {
      id: "assassin_death_sentry",
      title: "Death Sentry",
      cost: 2,
      target: "none",
      text: "Deal 12 lightning damage to all enemies. Apply 2 Paralyze to all. Gain 5 Guard.",
      effects: [
        { kind: "damage_all", value: 12 },
        { kind: "apply_paralyze_all", value: 2 },
        { kind: "gain_guard_self", value: 5 },
      ],
      skillRef: "assassin_death_sentry",
      tier: 4,
    },
  };

  const ASSASSIN_STARTER_DECK = [
    "assassin_tiger_strike", "assassin_tiger_strike", "assassin_tiger_strike",
    "assassin_fire_blast", "assassin_fire_blast",
    "assassin_claw_mastery", "assassin_claw_mastery",
    "assassin_psychic_hammer", "assassin_psychic_hammer",
    "rally_mercenary",
    "assassin_cloak_of_shadows",
    "assassin_blade_shield",
    "assassin_blade_shield",
  ];

  function getCardIdsByTier(cards: Record<string, { id: string; tier: number }>, tier: number): string[] {
    return Object.values(cards)
      .filter((card) => card.tier === tier)
      .map((card) => card.id);
  }

  const ASSASSIN_REWARD_POOL = {
    early: getCardIdsByTier(ASSASSIN_CARDS, 2),
    mid: getCardIdsByTier(ASSASSIN_CARDS, 3),
    late: getCardIdsByTier(ASSASSIN_CARDS, 4),
  };

  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING = runtimeWindow.__ROUGE_CLASS_CARDS_STAGING || {};
  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING.assassin = {
    cards: ASSASSIN_CARDS,
    starterDeck: ASSASSIN_STARTER_DECK,
    rewardPool: ASSASSIN_REWARD_POOL,
  };
})();
