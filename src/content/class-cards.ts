(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Amazon Cards ──────────────────────────────────────────────────────
  // Bow & Crossbow: ranged single-target and AoE arrow attacks
  // Javelin & Spear: lightning/poison melee-range damage
  // Passive & Magic: evasion, utility, and summoned support

  const amazonCards = {
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

  // ── Assassin Cards ────────────────────────────────────────────────────
  // Martial Arts: combo hits that build up damage
  // Shadow Disciplines: buffs, evasion, shadow clones
  // Traps: fire/lightning AoE and burn effects

  const assassinCards = {
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
        { kind: "apply_burn", value: 2 },
      ],
      skillRef: "assassin_wake_of_fire",
      tier: 2,
    },
    assassin_cobra_strike: {
      id: "assassin_cobra_strike",
      title: "Cobra Strike",
      cost: 1,
      target: "enemy",
      text: "Deal 8 damage. Heal 4.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "heal_hero", value: 4 },
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
      text: "Deal 14 lightning damage.",
      effects: [{ kind: "damage", value: 14 }],
      skillRef: "assassin_claws_of_thunder",
      tier: 3,
    },
    assassin_fade: {
      id: "assassin_fade",
      title: "Fade",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 7 Guard.",
      effects: [{ kind: "gain_guard_party", value: 7 }],
      skillRef: "assassin_fade",
      tier: 3,
    },
    assassin_lightning_sentry: {
      id: "assassin_lightning_sentry",
      title: "Lightning Sentry",
      cost: 2,
      target: "none",
      text: "Deal 6 lightning damage to all enemies. Apply 2 Burn to all.",
      effects: [
        { kind: "damage_all", value: 6 },
        { kind: "apply_burn", value: 2 },
      ],
      skillRef: "assassin_lightning_sentry",
      tier: 3,
    },
    assassin_shadow_warrior: {
      id: "assassin_shadow_warrior",
      title: "Shadow Warrior",
      cost: 1,
      target: "none",
      text: "Heal your mercenary 6. Mercenary next attack +5.",
      effects: [
        { kind: "heal_mercenary", value: 6 },
        { kind: "buff_mercenary_next_attack", value: 5 },
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
      text: "Deal 12 damage. Apply 4 Burn. Draw 1 card.",
      effects: [
        { kind: "damage", value: 12 },
        { kind: "apply_burn", value: 4 },
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
      text: "Deal 8 damage to all enemies. Apply 3 Burn to all.",
      effects: [
        { kind: "damage_all", value: 8 },
        { kind: "apply_burn", value: 3 },
      ],
      skillRef: "assassin_death_sentry",
      tier: 4,
    },
  };

  // ── Barbarian Cards ───────────────────────────────────────────────────
  // Combat: heavy melee damage, multi-hit, AoE
  // Masteries: passive weapon bonuses (guard, toughness)
  // Warcries: party-wide buffs and debuffs

  const barbarianCards = {
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

  // ── Druid Cards ───────────────────────────────────────────────────────
  // Elemental: fire/wind AoE spells
  // Shape Shifting: melee damage + self-healing + guard
  // Summoning: companion support and nature spirits

  const druidCards = {
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
      text: "Deal 3 poison damage. Apply 3 Burn.",
      effects: [
        { kind: "damage", value: 3 },
        { kind: "apply_burn", value: 3 },
      ],
      skillRef: "druid_poison_creeper",
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
      text: "Heal 6. Heal your mercenary 6.",
      effects: [
        { kind: "heal_hero", value: 6 },
        { kind: "heal_mercenary", value: 6 },
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
        { kind: "apply_burn", value: 2 },
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
        { kind: "apply_burn", value: 3 },
      ],
      skillRef: "druid_volcano",
      tier: 3,
    },
    druid_fury: {
      id: "druid_fury",
      title: "Fury",
      cost: 2,
      target: "enemy",
      text: "Deal 7 damage. Deal 6 damage. Deal 5 damage.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "damage", value: 6 },
        { kind: "damage", value: 5 },
      ],
      skillRef: "druid_fury",
      tier: 3,
    },
    druid_heart_of_wolverine: {
      id: "druid_heart_of_wolverine",
      title: "Heart of Wolverine",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 6 Guard. Mercenary next attack +5.",
      effects: [
        { kind: "gain_guard_party", value: 6 },
        { kind: "buff_mercenary_next_attack", value: 5 },
      ],
      skillRef: "druid_heart_of_wolverine",
      tier: 3,
    },
    druid_tornado: {
      id: "druid_tornado",
      title: "Tornado",
      cost: 2,
      target: "none",
      text: "Deal 9 damage to all enemies.",
      effects: [{ kind: "damage_all", value: 9 }],
      skillRef: "druid_tornado",
      tier: 3,
    },

    // ── Tier 4 ──
    druid_hurricane: {
      id: "druid_hurricane",
      title: "Hurricane",
      cost: 2,
      target: "none",
      text: "Deal 8 cold damage to all enemies. Gain 6 Guard.",
      effects: [
        { kind: "damage_all", value: 8 },
        { kind: "gain_guard_self", value: 6 },
      ],
      skillRef: "druid_hurricane",
      tier: 4,
    },
    druid_armageddon: {
      id: "druid_armageddon",
      title: "Armageddon",
      cost: 2,
      target: "none",
      text: "Deal 9 fire damage to all enemies. Apply 4 Burn to all.",
      effects: [
        { kind: "damage_all", value: 9 },
        { kind: "apply_burn", value: 4 },
      ],
      skillRef: "druid_armageddon",
      tier: 4,
    },
    druid_summon_grizzly: {
      id: "druid_summon_grizzly",
      title: "Summon Grizzly",
      cost: 2,
      target: "none",
      text: "You and your mercenary gain 10 Guard. Mercenary next attack +5.",
      effects: [
        { kind: "gain_guard_party", value: 10 },
        { kind: "buff_mercenary_next_attack", value: 5 },
      ],
      skillRef: "druid_summon_grizzly",
      tier: 4,
    },
  };

  // ── Necromancer Cards ─────────────────────────────────────────────────
  // Curses: debuffs that mark enemies and weaken them
  // Poison and Bone: direct damage spells and bone barriers
  // Summoning: raise minions for sustained mercenary-like pressure

  const necromancerCards = {
    // ── Tier 1 ──
    necromancer_teeth: {
      id: "necromancer_teeth",
      title: "Teeth",
      cost: 1,
      target: "enemy",
      text: "Deal 7 magic damage.",
      effects: [{ kind: "damage", value: 7 }],
      skillRef: "necromancer_teeth",
      tier: 1,
    },
    necromancer_bone_armor: {
      id: "necromancer_bone_armor",
      title: "Bone Armor",
      cost: 1,
      target: "none",
      text: "Gain 8 Guard.",
      effects: [{ kind: "gain_guard_self", value: 8 }],
      skillRef: "necromancer_bone_armor",
      tier: 1,
    },
    necromancer_amplify_damage: {
      id: "necromancer_amplify_damage",
      title: "Amplify Damage",
      cost: 1,
      target: "enemy",
      text: "Deal 3 damage. Your mercenary deals +6 to this target.",
      effects: [
        { kind: "damage", value: 3 },
        { kind: "mark_enemy_for_mercenary", value: 6 },
      ],
      skillRef: "necromancer_amplify_damage",
      tier: 1,
    },
    necromancer_raise_skeleton: {
      id: "necromancer_raise_skeleton",
      title: "Raise Skeleton",
      cost: 1,
      target: "none",
      text: "Heal your mercenary 5. Mercenary next attack +3. Draw 1 card.",
      effects: [
        { kind: "heal_mercenary", value: 5 },
        { kind: "buff_mercenary_next_attack", value: 3 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "necromancer_raise_skeleton",
      tier: 1,
    },

    // ── Tier 2 ──
    necromancer_corpse_explosion: {
      id: "necromancer_corpse_explosion",
      title: "Corpse Explosion",
      cost: 2,
      target: "none",
      text: "Deal 6 fire damage to all enemies.",
      effects: [{ kind: "damage_all", value: 6 }],
      skillRef: "necromancer_corpse_explosion",
      tier: 2,
    },
    necromancer_clay_golem: {
      id: "necromancer_clay_golem",
      title: "Clay Golem",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 6 Guard. Mercenary next attack +3.",
      effects: [
        { kind: "gain_guard_party", value: 6 },
        { kind: "buff_mercenary_next_attack", value: 3 },
      ],
      skillRef: "necromancer_clay_golem",
      tier: 2,
    },
    necromancer_iron_maiden: {
      id: "necromancer_iron_maiden",
      title: "Iron Maiden",
      cost: 1,
      target: "enemy",
      text: "Deal 4 damage. Your mercenary deals +7 to this target.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "mark_enemy_for_mercenary", value: 7 },
      ],
      skillRef: "necromancer_iron_maiden",
      tier: 2,
    },
    necromancer_poison_dagger: {
      id: "necromancer_poison_dagger",
      title: "Poison Dagger",
      cost: 1,
      target: "enemy",
      text: "Deal 5 poison damage. Apply 3 Burn.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "apply_burn", value: 3 },
      ],
      skillRef: "necromancer_poison_dagger",
      tier: 2,
    },

    // ── Tier 3 ──
    necromancer_bone_spear: {
      id: "necromancer_bone_spear",
      title: "Bone Spear",
      cost: 2,
      target: "enemy",
      text: "Deal 14 magic damage.",
      effects: [{ kind: "damage", value: 14 }],
      skillRef: "necromancer_bone_spear",
      tier: 3,
    },
    necromancer_blood_golem: {
      id: "necromancer_blood_golem",
      title: "Blood Golem",
      cost: 2,
      target: "none",
      text: "Heal 8. You and your mercenary gain 6 Guard.",
      effects: [
        { kind: "heal_hero", value: 8 },
        { kind: "gain_guard_party", value: 6 },
      ],
      skillRef: "necromancer_blood_golem",
      tier: 3,
    },
    necromancer_decrepify: {
      id: "necromancer_decrepify",
      title: "Decrepify",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Your mercenary deals +8 to this target. Draw 1 card.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "mark_enemy_for_mercenary", value: 8 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "necromancer_decrepify",
      tier: 3,
    },
    necromancer_skeletal_mage: {
      id: "necromancer_skeletal_mage",
      title: "Skeletal Mage",
      cost: 1,
      target: "enemy",
      text: "Deal 6 damage. Apply 3 Burn. Mercenary next attack +3.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "apply_burn", value: 3 },
        { kind: "buff_mercenary_next_attack", value: 3 },
      ],
      skillRef: "necromancer_skeletal_mage",
      tier: 3,
    },

    // ── Tier 4 ──
    necromancer_bone_spirit: {
      id: "necromancer_bone_spirit",
      title: "Bone Spirit",
      cost: 2,
      target: "enemy",
      text: "Deal 16 magic damage. Draw 1 card.",
      effects: [
        { kind: "damage", value: 16 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "necromancer_bone_spirit",
      tier: 4,
    },
    necromancer_poison_nova: {
      id: "necromancer_poison_nova",
      title: "Poison Nova",
      cost: 2,
      target: "none",
      text: "Deal 7 poison damage to all enemies. Apply 4 Burn to all.",
      effects: [
        { kind: "damage_all", value: 7 },
        { kind: "apply_burn", value: 4 },
      ],
      skillRef: "necromancer_poison_nova",
      tier: 4,
    },
    necromancer_revive: {
      id: "necromancer_revive",
      title: "Revive",
      cost: 2,
      target: "none",
      text: "Heal your mercenary 10. You and your mercenary gain 8 Guard. Mercenary next attack +5.",
      effects: [
        { kind: "heal_mercenary", value: 10 },
        { kind: "gain_guard_party", value: 8 },
        { kind: "buff_mercenary_next_attack", value: 5 },
      ],
      skillRef: "necromancer_revive",
      tier: 4,
    },
  };

  // ── Paladin Cards ─────────────────────────────────────────────────────
  // Combat: holy damage and smiting strikes
  // Defensive Auras: party guard and healing
  // Offensive Auras: damage amplification and elemental strikes

  const paladinCards = {
    // ── Tier 1 ──
    paladin_sacrifice: {
      id: "paladin_sacrifice",
      title: "Sacrifice",
      cost: 1,
      target: "enemy",
      text: "Deal 10 damage.",
      effects: [{ kind: "damage", value: 10 }],
      skillRef: "paladin_sacrifice",
      tier: 1,
    },
    paladin_might: {
      id: "paladin_might",
      title: "Might",
      cost: 1,
      target: "none",
      text: "Mercenary next attack +5. Draw 1 card.",
      effects: [
        { kind: "buff_mercenary_next_attack", value: 5 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "paladin_might",
      tier: 1,
    },
    paladin_prayer: {
      id: "paladin_prayer",
      title: "Prayer",
      cost: 1,
      target: "none",
      text: "Heal 5. Heal your mercenary 5.",
      effects: [
        { kind: "heal_hero", value: 5 },
        { kind: "heal_mercenary", value: 5 },
      ],
      skillRef: "paladin_prayer",
      tier: 1,
    },
    paladin_smite: {
      id: "paladin_smite",
      title: "Smite",
      cost: 1,
      target: "enemy",
      text: "Deal 6 damage. Gain 4 Guard.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "gain_guard_self", value: 4 },
      ],
      skillRef: "paladin_smite",
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
      text: "Deal 5 damage. Deal 4 damage. Deal 3 damage.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "damage", value: 4 },
        { kind: "damage", value: 3 },
      ],
      skillRef: "paladin_zeal",
      tier: 2,
    },

    // ── Tier 3 ──
    paladin_vengeance: {
      id: "paladin_vengeance",
      title: "Vengeance",
      cost: 2,
      target: "enemy",
      text: "Deal 10 damage. Apply 3 Burn.",
      effects: [
        { kind: "damage", value: 10 },
        { kind: "apply_burn", value: 3 },
      ],
      skillRef: "paladin_vengeance",
      tier: 3,
    },
    paladin_blessed_hammer: {
      id: "paladin_blessed_hammer",
      title: "Blessed Hammer",
      cost: 2,
      target: "none",
      text: "Deal 8 magic damage to all enemies.",
      effects: [{ kind: "damage_all", value: 8 }],
      skillRef: "paladin_blessed_hammer",
      tier: 3,
    },
    paladin_holy_freeze: {
      id: "paladin_holy_freeze",
      title: "Holy Freeze",
      cost: 2,
      target: "none",
      text: "Deal 6 cold damage to all enemies. You and your mercenary gain 6 Guard.",
      effects: [
        { kind: "damage_all", value: 6 },
        { kind: "gain_guard_party", value: 6 },
      ],
      skillRef: "paladin_holy_freeze",
      tier: 3,
    },
    paladin_holy_shield: {
      id: "paladin_holy_shield",
      title: "Holy Shield",
      cost: 1,
      target: "none",
      text: "Gain 10 Guard. Draw 1 card.",
      effects: [
        { kind: "gain_guard_self", value: 10 },
        { kind: "draw", value: 1 },
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
      text: "Deal 16 magic damage. Heal 5.",
      effects: [
        { kind: "damage", value: 16 },
        { kind: "heal_hero", value: 5 },
      ],
      skillRef: "paladin_fist_of_the_heavens",
      tier: 4,
    },
    paladin_fanaticism: {
      id: "paladin_fanaticism",
      title: "Fanaticism",
      cost: 2,
      target: "none",
      text: "You and your mercenary gain 6 Guard. Mercenary next attack +8.",
      effects: [
        { kind: "gain_guard_party", value: 6 },
        { kind: "buff_mercenary_next_attack", value: 8 },
      ],
      skillRef: "paladin_fanaticism",
      tier: 4,
    },
    paladin_conviction: {
      id: "paladin_conviction",
      title: "Conviction",
      cost: 2,
      target: "none",
      text: "Deal 7 damage to all enemies. Your mercenary deals +6 to all targets.",
      effects: [
        { kind: "damage_all", value: 7 },
        { kind: "buff_mercenary_next_attack", value: 6 },
      ],
      skillRef: "paladin_conviction",
      tier: 4,
    },
  };

  // ── Sorceress Cards ───────────────────────────────────────────────────
  // Cold: freeze + defense, AoE cold damage
  // Fire: high single-target and AoE burn damage
  // Lightning: burst damage and utility (teleport = draw)

  const sorceressCards = {
    // ── Tier 1 ──
    sorceress_ice_bolt: {
      id: "sorceress_ice_bolt",
      title: "Ice Bolt",
      cost: 1,
      target: "enemy",
      text: "Deal 6 cold damage. Gain 3 Guard.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "gain_guard_self", value: 3 },
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
      text: "Deal 8 lightning damage.",
      effects: [{ kind: "damage", value: 8 }],
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

    // ── Tier 2 ──
    sorceress_frost_nova: {
      id: "sorceress_frost_nova",
      title: "Frost Nova",
      cost: 2,
      target: "none",
      text: "Deal 5 cold damage to all enemies. Gain 4 Guard.",
      effects: [
        { kind: "damage_all", value: 5 },
        { kind: "gain_guard_self", value: 4 },
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
      text: "Deal 4 lightning damage to all enemies. Draw 1 card.",
      effects: [
        { kind: "damage_all", value: 4 },
        { kind: "draw", value: 1 },
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
      text: "Deal 8 cold damage to all enemies. Gain 5 Guard.",
      effects: [
        { kind: "damage_all", value: 8 },
        { kind: "gain_guard_self", value: 5 },
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
        { kind: "apply_burn", value: 3 },
      ],
      skillRef: "sorceress_meteor",
      tier: 3,
    },
    sorceress_chain_lightning: {
      id: "sorceress_chain_lightning",
      title: "Chain Lightning",
      cost: 2,
      target: "none",
      text: "Deal 7 lightning damage to all enemies. Draw 1 card.",
      effects: [
        { kind: "damage_all", value: 7 },
        { kind: "draw", value: 1 },
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
      text: "Deal 10 cold damage to all enemies. Gain 6 Guard.",
      effects: [
        { kind: "damage_all", value: 10 },
        { kind: "gain_guard_self", value: 6 },
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
        { kind: "apply_burn", value: 5 },
      ],
      skillRef: "sorceress_hydra",
      tier: 4,
    },
    sorceress_lightning_mastery: {
      id: "sorceress_lightning_mastery",
      title: "Lightning Mastery",
      cost: 2,
      target: "none",
      text: "Deal 10 lightning damage to all enemies. Draw 1 card.",
      effects: [
        { kind: "damage_all", value: 10 },
        { kind: "draw", value: 1 },
      ],
      skillRef: "sorceress_lightning_mastery",
      tier: 4,
    },
  };

  // ── Merge all class cards into a single catalog ──

  const classCardCatalog = {
    ...amazonCards,
    ...assassinCards,
    ...barbarianCards,
    ...druidCards,
    ...necromancerCards,
    ...paladinCards,
    ...sorceressCards,
  };

  // ── Per-class starter decks ── (13 cards each, built from Tier 1 skills)

  const classStarterDecks = {
    amazon: [
      "amazon_magic_arrow", "amazon_magic_arrow", "amazon_magic_arrow",
      "amazon_jab", "amazon_jab",
      "amazon_fire_arrow", "amazon_fire_arrow",
      "amazon_inner_sight", "amazon_inner_sight",
      "rally_mercenary",
      "second_wind",
      "shield_slam",
      "shield_slam",
    ],
    assassin: [
      "assassin_tiger_strike", "assassin_tiger_strike", "assassin_tiger_strike",
      "assassin_fire_blast", "assassin_fire_blast",
      "assassin_claw_mastery", "assassin_claw_mastery",
      "assassin_psychic_hammer", "assassin_psychic_hammer",
      "rally_mercenary",
      "second_wind",
      "shield_slam",
      "shield_slam",
    ],
    barbarian: [
      "barbarian_bash", "barbarian_bash", "barbarian_bash",
      "barbarian_sword_mastery", "barbarian_sword_mastery",
      "barbarian_howl", "barbarian_howl",
      "barbarian_find_potion", "barbarian_find_potion",
      "rally_mercenary",
      "second_wind",
      "shield_slam",
      "shield_slam",
    ],
    druid: [
      "druid_firestorm", "druid_firestorm", "druid_firestorm",
      "druid_werewolf", "druid_werewolf",
      "druid_raven", "druid_raven",
      "druid_poison_creeper",
      "rally_mercenary",
      "second_wind",
      "shield_slam",
      "shield_slam",
      "shield_slam",
    ],
    necromancer: [
      "necromancer_teeth", "necromancer_teeth", "necromancer_teeth",
      "necromancer_amplify_damage", "necromancer_amplify_damage",
      "necromancer_bone_armor", "necromancer_bone_armor",
      "necromancer_raise_skeleton", "necromancer_raise_skeleton",
      "rally_mercenary",
      "second_wind",
      "shield_slam",
      "shield_slam",
    ],
    paladin: [
      "paladin_sacrifice", "paladin_sacrifice", "paladin_sacrifice",
      "paladin_smite", "paladin_smite",
      "paladin_might", "paladin_might",
      "paladin_prayer", "paladin_prayer",
      "rally_mercenary",
      "second_wind",
      "shield_slam",
      "shield_slam",
    ],
    sorceress: [
      "sorceress_fire_bolt", "sorceress_fire_bolt", "sorceress_fire_bolt",
      "sorceress_ice_bolt", "sorceress_ice_bolt",
      "sorceress_charged_bolt", "sorceress_charged_bolt",
      "sorceress_warmth", "sorceress_warmth",
      "rally_mercenary",
      "second_wind",
      "shield_slam",
      "shield_slam",
    ],
  };

  // ── Per-class reward pools organized by tier ──
  // Tier 2 cards appear as early rewards, Tier 3 in mid-game, Tier 4 in late/boss

  interface ClassCardEntry {
    id: string;
    title: string;
    cost: number;
    target: string;
    text: string;
    effects: { kind: string; value: number }[];
    skillRef: string;
    tier: number;
  }

  function getCardIdsByTier(cards: Record<string, ClassCardEntry>, tier: number): string[] {
    return Object.values(cards)
      .filter((card) => card.tier === tier)
      .map((card) => card.id);
  }

  const classRewardPools = {
    amazon: {
      early: getCardIdsByTier(amazonCards, 2),
      mid: getCardIdsByTier(amazonCards, 3),
      late: getCardIdsByTier(amazonCards, 4),
    },
    assassin: {
      early: getCardIdsByTier(assassinCards, 2),
      mid: getCardIdsByTier(assassinCards, 3),
      late: getCardIdsByTier(assassinCards, 4),
    },
    barbarian: {
      early: getCardIdsByTier(barbarianCards, 2),
      mid: getCardIdsByTier(barbarianCards, 3),
      late: getCardIdsByTier(barbarianCards, 4),
    },
    druid: {
      early: getCardIdsByTier(druidCards, 2),
      mid: getCardIdsByTier(druidCards, 3),
      late: getCardIdsByTier(druidCards, 4),
    },
    necromancer: {
      early: getCardIdsByTier(necromancerCards, 2),
      mid: getCardIdsByTier(necromancerCards, 3),
      late: getCardIdsByTier(necromancerCards, 4),
    },
    paladin: {
      early: getCardIdsByTier(paladinCards, 2),
      mid: getCardIdsByTier(paladinCards, 3),
      late: getCardIdsByTier(paladinCards, 4),
    },
    sorceress: {
      early: getCardIdsByTier(sorceressCards, 2),
      mid: getCardIdsByTier(sorceressCards, 3),
      late: getCardIdsByTier(sorceressCards, 4),
    },
  };

  runtimeWindow.__ROUGE_CLASS_CARDS = {
    classCardCatalog,
    classStarterDecks,
    classRewardPools,
  };
})();
