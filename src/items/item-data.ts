(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { RUNE_TEMPLATES, RUNEWORD_TEMPLATES, RUNE_REWARD_POOLS } = runtimeWindow.__ROUGE_ITEM_DATA_RUNES;

  const ITEM_TEMPLATES = {
    item_short_sword: {
      sourceId: "short_sword",
      slot: "weapon",
      actRequirement: 1,
      progressionTier: 1,
      bonuses: {
        heroDamageBonus: 1,
        mercenaryAttack: 1,
      },
    },
    item_scimitar: {
      sourceId: "scimitar",
      slot: "weapon",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroDamageBonus: 2,
        heroGuardBonus: 1,
      },
    },
    item_sabre: {
      sourceId: "sabre",
      slot: "weapon",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroDamageBonus: 2,
        heroBurnBonus: 1,
      },
    },
    item_long_sword: {
      sourceId: "long_sword",
      slot: "weapon",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroDamageBonus: 3,
        heroGuardBonus: 1,
      },
    },
    item_falchion: {
      sourceId: "falchion",
      slot: "weapon",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroDamageBonus: 3,
        heroGuardBonus: 1,
      },
    },
    item_crystal_sword: {
      sourceId: "crystal_sword",
      slot: "weapon",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroDamageBonus: 3,
        heroMaxEnergy: 1,
      },
    },
    item_bastard_sword: {
      sourceId: "bastard_sword",
      slot: "weapon",
      actRequirement: 4,
      progressionTier: 5,
      bonuses: {
        heroDamageBonus: 4,
        heroGuardBonus: 1,
      },
    },
    item_broad_sword: {
      sourceId: "broad_sword",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 5,
      bonuses: {
        heroDamageBonus: 4,
        heroGuardBonus: 2,
      },
    },
    item_war_sword: {
      sourceId: "war_sword",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 6,
      bonuses: {
        heroDamageBonus: 4,
        heroBurnBonus: 2,
      },
    },
    item_rune_sword: {
      sourceId: "rune_sword",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 7,
      bonuses: {
        heroDamageBonus: 5,
        heroGuardBonus: 2,
        heroMaxEnergy: 1,
      },
    },
    item_legend_sword: {
      sourceId: "legend_sword",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 7,
      bonuses: {
        heroDamageBonus: 6,
        heroGuardBonus: 2,
      },
    },
    item_zweihander: {
      sourceId: "zweihander",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 6,
      bonuses: {
        heroDamageBonus: 5,
        heroGuardBonus: 2,
      },
    },
    item_balrog_blade: {
      sourceId: "balrog_blade",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 8,
      bonuses: {
        heroDamageBonus: 7,
        heroGuardBonus: 2,
        mercenaryAttack: 1,
      },
    },
    item_colossus_blade: {
      sourceId: "colossus_blade",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 8,
      bonuses: {
        heroDamageBonus: 8,
        heroGuardBonus: 2,
      },
    },
    item_mace: {
      sourceId: "mace",
      slot: "weapon",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroDamageBonus: 2,
        mercenaryAttack: 1,
      },
    },
    item_war_hammer: {
      sourceId: "war_hammer",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 6,
      bonuses: {
        heroDamageBonus: 5,
        heroMaxLife: 4,
      },
    },
    item_partizan: {
      sourceId: "partizan",
      slot: "weapon",
      actRequirement: 4,
      progressionTier: 5,
      bonuses: {
        heroDamageBonus: 4,
        mercenaryAttack: 2,
      },
    },
    item_grim_scythe: {
      sourceId: "grim_scythe",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 7,
      bonuses: {
        heroDamageBonus: 6,
        heroGuardBonus: 1,
        mercenaryAttack: 2,
      },
    },
    item_wand: {
      sourceId: "wand",
      slot: "weapon",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroMaxEnergy: 1,
        heroBurnBonus: 2,
      },
    },
    item_yew_wand: {
      sourceId: "yew_wand",
      slot: "weapon",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroMaxEnergy: 1,
        heroBurnBonus: 1,
      },
    },
    item_bone_wand: {
      sourceId: "bone_wand",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 5,
      bonuses: {
        heroMaxEnergy: 2,
        heroBurnBonus: 2,
      },
    },
    item_lich_wand: {
      sourceId: "lich_wand",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 7,
      bonuses: {
        heroMaxEnergy: 3,
        heroBurnBonus: 4,
      },
    },
    item_battle_staff: {
      sourceId: "battle_staff",
      slot: "weapon",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroMaxEnergy: 1,
        heroBurnBonus: 2,
      },
    },
    item_gnarled_staff: {
      sourceId: "gnarled_staff",
      slot: "weapon",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroMaxEnergy: 1,
        heroGuardBonus: 1,
      },
    },
    item_war_staff: {
      sourceId: "war_staff",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 5,
      bonuses: {
        heroMaxEnergy: 2,
        heroBurnBonus: 3,
      },
    },
    item_quilted_armor: {
      sourceId: "quilted_armor",
      slot: "armor",
      actRequirement: 1,
      progressionTier: 1,
      bonuses: {
        heroMaxLife: 6,
        heroGuardBonus: 1,
      },
    },
    item_breast_plate: {
      sourceId: "breast_plate",
      slot: "armor",
      actRequirement: 1,
      progressionTier: 1,
      bonuses: {
        heroMaxLife: 7,
        heroPotionHeal: 1,
      },
    },
    item_leather_armor: {
      sourceId: "leather_armor",
      slot: "armor",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroMaxLife: 8,
        heroPotionHeal: 2,
      },
    },
    item_scale_mail: {
      sourceId: "scale_mail",
      slot: "armor",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroMaxLife: 8,
        mercenaryMaxLife: 4,
      },
    },
    item_chain_mail: {
      sourceId: "chain_mail",
      slot: "armor",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroMaxLife: 9,
        heroGuardBonus: 1,
      },
    },
    item_ring_mail: {
      sourceId: "ring_mail",
      slot: "armor",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroMaxLife: 10,
        mercenaryMaxLife: 6,
      },
    },
    item_splint_mail: {
      sourceId: "splint_mail",
      slot: "armor",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroMaxLife: 11,
        heroGuardBonus: 1,
      },
    },
    item_plate_mail: {
      sourceId: "plate_mail",
      slot: "armor",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroMaxLife: 13,
        mercenaryMaxLife: 6,
      },
    },
    item_field_plate: {
      sourceId: "field_plate",
      slot: "armor",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroMaxLife: 14,
        mercenaryMaxLife: 6,
      },
    },
    item_gothic_plate: {
      sourceId: "gothic_plate",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 5,
      bonuses: {
        heroMaxLife: 15,
        heroGuardBonus: 2,
      },
    },
    item_light_plate: {
      sourceId: "light_plate",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 4,
      bonuses: {
        heroMaxLife: 12,
        heroGuardBonus: 2,
      },
    },
    item_ghost_armor: {
      sourceId: "ghost_armor",
      slot: "armor",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroMaxLife: 12,
        heroMaxEnergy: 1,
        heroGuardBonus: 1,
      },
    },
    item_mage_plate: {
      sourceId: "mage_plate",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 5,
      bonuses: {
        heroMaxLife: 14,
        heroMaxEnergy: 2,
      },
    },
    item_ancient_armor: {
      sourceId: "ancient_armor",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 6,
      bonuses: {
        heroMaxLife: 20,
        heroGuardBonus: 2,
        mercenaryMaxLife: 6,
      },
    },
    item_ornate_plate: {
      sourceId: "ornate_plate",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 6,
      bonuses: {
        heroMaxLife: 21,
        heroGuardBonus: 2,
      },
    },
    item_boneweave: {
      sourceId: "boneweave",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 7,
      bonuses: {
        heroMaxLife: 22,
        heroGuardBonus: 2,
        mercenaryMaxLife: 8,
      },
    },
    item_chaos_armor: {
      sourceId: "chaos_armor",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 7,
      bonuses: {
        heroMaxLife: 22,
        heroGuardBonus: 3,
      },
    },
    item_hellforge_plate: {
      sourceId: "hellforge_plate",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 7,
      bonuses: {
        heroMaxLife: 23,
        heroGuardBonus: 3,
        heroPotionHeal: 2,
      },
    },
    item_archon_plate: {
      sourceId: "archon_plate",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 8,
      bonuses: {
        heroMaxLife: 24,
        heroGuardBonus: 3,
        heroMaxEnergy: 1,
      },
    },
    item_full_plate_mail: {
      sourceId: "full_plate_mail",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 6,
      bonuses: {
        heroMaxLife: 18,
        heroGuardBonus: 2,
        heroPotionHeal: 2,
      },
    },
  };

  runtimeWindow.ROUGE_ITEM_DATA = {
    ITEM_TEMPLATES,
    RUNE_TEMPLATES,
    RUNEWORD_TEMPLATES,
    RUNE_REWARD_POOLS,
  };
})();
