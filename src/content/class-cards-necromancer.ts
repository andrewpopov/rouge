(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Necromancer Cards ─────────────────────────────────────────────────
  // Curses: debuffs that mark enemies and weaken them
  // Poison and Bone: direct damage spells and bone barriers
  // Summoning: raise minions for sustained mercenary-like pressure

  const NECROMANCER_CARDS: Record<string, ClassCardDefinition> = {
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
      text: "Gain 9 Guard.",
      effects: [{ kind: "gain_guard_self", value: 9 }],
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
    necromancer_bone_wall: {
      id: "necromancer_bone_wall",
      title: "Bone Wall",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Gain 4 Guard.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "gain_guard_self", value: 4 },
      ],
      skillRef: "necromancer_bone_wall",
      tier: 1,
    },
    necromancer_life_tap: {
      id: "necromancer_life_tap",
      title: "Life Tap",
      cost: 1,
      target: "none",
      text: "Heal 6. Gain 3 Guard.",
      effects: [
        { kind: "heal_hero", value: 6 },
        { kind: "gain_guard_self", value: 3 },
      ],
      skillRef: "necromancer_life_tap",
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
      text: "You and your mercenary gain 7 Guard. Mercenary next attack +4.",
      effects: [
        { kind: "gain_guard_party", value: 7 },
        { kind: "buff_mercenary_next_attack", value: 4 },
      ],
      skillRef: "necromancer_clay_golem",
      tier: 2,
    },
    necromancer_iron_maiden: {
      id: "necromancer_iron_maiden",
      title: "Iron Maiden",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Your mercenary deals +8 to this target.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "mark_enemy_for_mercenary", value: 8 },
      ],
      skillRef: "necromancer_iron_maiden",
      tier: 2,
    },
    necromancer_poison_dagger: {
      id: "necromancer_poison_dagger",
      title: "Poison Dagger",
      cost: 1,
      target: "enemy",
      text: "Deal 6 poison damage. Apply 4 Poison.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "apply_poison", value: 4 },
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
      text: "Deal 16 magic damage.",
      effects: [{ kind: "damage", value: 16 }],
      skillRef: "necromancer_bone_spear",
      tier: 3,
    },
    necromancer_blood_golem: {
      id: "necromancer_blood_golem",
      title: "Blood Golem",
      cost: 2,
      target: "none",
      text: "Heal 12. You and your mercenary gain 10 Guard.",
      effects: [
        { kind: "heal_hero", value: 12 },
        { kind: "gain_guard_party", value: 10 },
      ],
      skillRef: "necromancer_blood_golem",
      tier: 3,
    },
    necromancer_decrepify: {
      id: "necromancer_decrepify",
      title: "Decrepify",
      cost: 1,
      target: "enemy",
      text: "Deal 9 damage. Your mercenary deals +12 to this target. Gain 4 Guard. Draw 1 card.",
      effects: [
        { kind: "damage", value: 9 },
        { kind: "mark_enemy_for_mercenary", value: 12 },
        { kind: "gain_guard_self", value: 4 },
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
      text: "Deal 8 damage. Apply 4 Poison. Mercenary next attack +4.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "apply_poison", value: 4 },
        { kind: "buff_mercenary_next_attack", value: 4 },
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
      text: "Deal 21 magic damage. Gain 4 Guard. Draw 1 card.",
      effects: [
        { kind: "damage", value: 21 },
        { kind: "gain_guard_self", value: 4 },
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
      text: "Deal 8 poison damage to all enemies. Apply 5 Poison to all.",
      effects: [
        { kind: "damage_all", value: 8 },
        { kind: "apply_poison_all", value: 5 },
      ],
      skillRef: "necromancer_poison_nova",
      tier: 4,
    },
    necromancer_revive: {
      id: "necromancer_revive",
      title: "Revive",
      cost: 2,
      target: "none",
      text: "Heal 8. Heal your mercenary 12. You and your mercenary gain 12 Guard. Mercenary next attack +8.",
      effects: [
        { kind: "heal_hero", value: 8 },
        { kind: "heal_mercenary", value: 12 },
        { kind: "gain_guard_party", value: 12 },
        { kind: "buff_mercenary_next_attack", value: 8 },
      ],
      skillRef: "necromancer_revive",
      tier: 4,
    },
  };

  const NECROMANCER_STARTER_DECK = [
    "necromancer_teeth", "necromancer_teeth", "necromancer_teeth",
    "necromancer_amplify_damage", "necromancer_amplify_damage",
    "necromancer_bone_armor", "necromancer_bone_armor",
    "necromancer_raise_skeleton", "necromancer_raise_skeleton",
    "rally_mercenary",
    "necromancer_life_tap",
    "necromancer_bone_wall",
    "necromancer_bone_wall",
  ];

  function getCardIdsByTier(cards: Record<string, { id: string; tier: number }>, tier: number): string[] {
    return Object.values(cards)
      .filter((card) => card.tier === tier)
      .map((card) => card.id);
  }

  const NECROMANCER_REWARD_POOL = {
    early: getCardIdsByTier(NECROMANCER_CARDS, 2),
    mid: getCardIdsByTier(NECROMANCER_CARDS, 3),
    late: getCardIdsByTier(NECROMANCER_CARDS, 4),
  };

  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING = runtimeWindow.__ROUGE_CLASS_CARDS_STAGING || {};
  runtimeWindow.__ROUGE_CLASS_CARDS_STAGING.necromancer = {
    cards: NECROMANCER_CARDS,
    starterDeck: NECROMANCER_STARTER_DECK,
    rewardPool: NECROMANCER_REWARD_POOL,
  };
})();
