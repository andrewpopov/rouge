(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const RUNE_TEMPLATES = {
    rune_el: {
      sourceId: "el",
      progressionTier: 1,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 1,
        heroGuardBonus: 1,
      },
    },
    rune_eld: {
      sourceId: "eld",
      progressionTier: 2,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroPotionHeal: 2,
      },
    },
    rune_tir: {
      sourceId: "tir",
      progressionTier: 2,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxEnergy: 1,
      },
    },
    rune_eth: {
      sourceId: "eth",
      progressionTier: 2,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxLife: 4,
      },
    },
    rune_ith: {
      sourceId: "ith",
      progressionTier: 3,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 2,
      },
    },
    rune_nef: {
      sourceId: "nef",
      progressionTier: 3,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 1,
        mercenaryAttack: 1,
      },
    },
    rune_tal: {
      sourceId: "tal",
      progressionTier: 3,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroBurnBonus: 1,
      },
    },
    rune_ral: {
      sourceId: "ral",
      progressionTier: 4,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroBurnBonus: 2,
      },
    },
    rune_ort: {
      sourceId: "ort",
      progressionTier: 4,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroBurnBonus: 2,
        heroMaxEnergy: 1,
      },
    },
    rune_thul: {
      sourceId: "thul",
      progressionTier: 4,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroGuardBonus: 1,
        heroMaxLife: 2,
      },
    },
    rune_amn: {
      sourceId: "amn",
      progressionTier: 5,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 2,
        heroMaxLife: 2,
      },
    },
    rune_sol: {
      sourceId: "sol",
      progressionTier: 5,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroGuardBonus: 2,
        mercenaryMaxLife: 2,
      },
    },
    rune_shael: {
      sourceId: "shael",
      progressionTier: 5,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 1,
        heroGuardBonus: 2,
      },
    },
    rune_hel: {
      sourceId: "hel",
      progressionTier: 6,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxEnergy: 2,
        heroPotionHeal: 2,
      },
    },
    rune_lum: {
      sourceId: "lum",
      progressionTier: 6,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxLife: 5,
        heroGuardBonus: 1,
      },
    },
    rune_dol: {
      sourceId: "dol",
      progressionTier: 6,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxLife: 4,
        heroGuardBonus: 1,
      },
    },
    rune_io: {
      sourceId: "io",
      progressionTier: 6,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxEnergy: 1,
        mercenaryAttack: 1,
      },
    },
    rune_ko: {
      sourceId: "ko",
      progressionTier: 6,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 2,
        heroMaxEnergy: 1,
      },
    },
    rune_fal: {
      sourceId: "fal",
      progressionTier: 7,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxLife: 6,
        mercenaryAttack: 1,
      },
    },
    rune_lem: {
      sourceId: "lem",
      progressionTier: 7,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 2,
        heroPotionHeal: 2,
      },
    },
    rune_pul: {
      sourceId: "pul",
      progressionTier: 8,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 3,
        heroGuardBonus: 1,
      },
    },
    rune_um: {
      sourceId: "um",
      progressionTier: 8,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroGuardBonus: 3,
        heroMaxLife: 3,
      },
    },
    rune_mal: {
      sourceId: "mal",
      progressionTier: 8,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroBurnBonus: 2,
        heroGuardBonus: 2,
      },
    },
  };

  const RUNEWORD_TEMPLATES = {
    steel: {
      sourceId: "steel",
      slot: "weapon",
      familyAllowList: ["Swords"],
      requiredRunes: ["rune_tir", "rune_el"],
      bonuses: {
        heroDamageBonus: 3,
        mercenaryAttack: 1,
      },
    },
    stealth: {
      sourceId: "stealth",
      slot: "armor",
      familyAllowList: ["Body Armor"],
      requiredRunes: ["rune_tal", "rune_eth"],
      bonuses: {
        heroMaxLife: 6,
        heroMaxEnergy: 1,
        heroGuardBonus: 2,
      },
    },
    malice: {
      sourceId: "malice",
      slot: "weapon",
      familyAllowList: ["Swords", "Maces", "Polearms", "Scepters", "Staves"],
      requiredRunes: ["rune_ith", "rune_el", "rune_eth"],
      bonuses: {
        heroDamageBonus: 5,
        heroBurnBonus: 1,
      },
    },
    strength: {
      sourceId: "strength",
      slot: "weapon",
      familyAllowList: ["Swords", "Maces", "Polearms", "Scepters", "Staves"],
      requiredRunes: ["rune_amn", "rune_tir"],
      bonuses: {
        heroDamageBonus: 4,
        heroMaxLife: 4,
      },
    },
    smoke: {
      sourceId: "smoke",
      slot: "armor",
      familyAllowList: ["Body Armor"],
      requiredRunes: ["rune_nef", "rune_lum"],
      bonuses: {
        heroMaxLife: 10,
        heroGuardBonus: 3,
      },
    },
    myth: {
      sourceId: "myth",
      slot: "armor",
      familyAllowList: ["Body Armor"],
      requiredRunes: ["rune_hel", "rune_amn", "rune_nef"],
      bonuses: {
        heroMaxLife: 8,
        heroGuardBonus: 2,
        mercenaryAttack: 1,
      },
    },
    leaf: {
      sourceId: "leaf",
      slot: "weapon",
      familyAllowList: ["Staves"],
      requiredRunes: ["rune_tir", "rune_ral"],
      bonuses: {
        heroMaxEnergy: 2,
        heroBurnBonus: 4,
      },
    },
    white: {
      sourceId: "white",
      slot: "weapon",
      familyAllowList: ["Wands"],
      requiredRunes: ["rune_dol", "rune_io"],
      bonuses: {
        heroDamageBonus: 2,
        heroBurnBonus: 3,
      },
    },
    black: {
      sourceId: "black",
      slot: "weapon",
      familyAllowList: ["Maces", "Scepters"],
      requiredRunes: ["rune_thul", "rune_io", "rune_nef"],
      bonuses: {
        heroDamageBonus: 6,
        heroGuardBonus: 1,
      },
    },
    memory: {
      sourceId: "memory",
      slot: "weapon",
      familyAllowList: ["Staves"],
      requiredRunes: ["rune_lum", "rune_io", "rune_sol"],
      bonuses: {
        heroMaxEnergy: 3,
        heroBurnBonus: 3,
        heroGuardBonus: 2,
      },
    },
    honor: {
      sourceId: "honor",
      slot: "weapon",
      familyAllowList: ["Swords", "Maces", "Polearms", "Staves"],
      requiredRunes: ["rune_amn", "rune_el", "rune_ith"],
      bonuses: {
        heroDamageBonus: 7,
        heroGuardBonus: 2,
        mercenaryAttack: 2,
      },
    },
    lionheart: {
      sourceId: "lionheart",
      slot: "armor",
      familyAllowList: ["Body Armor"],
      requiredRunes: ["rune_hel", "rune_lum", "rune_fal"],
      bonuses: {
        heroMaxLife: 14,
        heroDamageBonus: 2,
        mercenaryMaxLife: 6,
      },
    },
    prudence: {
      sourceId: "prudence",
      slot: "armor",
      familyAllowList: ["Body Armor"],
      requiredRunes: ["rune_mal", "rune_tir"],
      bonuses: {
        heroMaxLife: 12,
        heroGuardBonus: 4,
        heroMaxEnergy: 2,
      },
    },
    stone: {
      sourceId: "stone",
      slot: "armor",
      familyAllowList: ["Body Armor"],
      requiredRunes: ["rune_shael", "rune_um", "rune_pul"],
      bonuses: {
        heroMaxLife: 16,
        heroGuardBonus: 4,
        mercenaryMaxLife: 8,
      },
    },
    passion: {
      sourceId: "passion",
      slot: "weapon",
      familyAllowList: ["Swords", "Maces", "Polearms", "Staves"],
      requiredRunes: ["rune_dol", "rune_ort", "rune_lem"],
      bonuses: {
        heroDamageBonus: 7,
        heroBurnBonus: 2,
        heroMaxEnergy: 1,
      },
    },
    crescent_moon: {
      sourceId: "crescent_moon",
      slot: "weapon",
      familyAllowList: ["Swords", "Polearms"],
      requiredRunes: ["rune_shael", "rune_um", "rune_tir"],
      bonuses: {
        heroDamageBonus: 8,
        heroBurnBonus: 3,
        heroMaxEnergy: 1,
      },
    },
  };

  const RUNE_REWARD_POOLS = {
    weapon: [
      "rune_el",
      "rune_tir",
      "rune_ith",
      "rune_nef",
      "rune_tal",
      "rune_ral",
      "rune_ort",
      "rune_amn",
      "rune_shael",
      "rune_dol",
      "rune_io",
      "rune_ko",
      "rune_fal",
      "rune_lem",
      "rune_pul",
      "rune_um",
      "rune_mal",
    ],
    armor: [
      "rune_el",
      "rune_eth",
      "rune_eld",
      "rune_tir",
      "rune_tal",
      "rune_nef",
      "rune_thul",
      "rune_sol",
      "rune_lum",
      "rune_dol",
      "rune_io",
      "rune_fal",
      "rune_pul",
      "rune_um",
      "rune_mal",
    ],
  };

  runtimeWindow.__ROUGE_ITEM_DATA_RUNES = {
    RUNE_TEMPLATES,
    RUNEWORD_TEMPLATES,
    RUNE_REWARD_POOLS,
  };
})();
