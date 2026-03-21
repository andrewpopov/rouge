(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const CHARM_CATALOG: Record<string, CharmDefinition> = {
    small_charm_vita: {
      id: "small_charm_vita",
      name: "Small Charm of Vita",
      size: "small",
      slotCost: 1,
      bonuses: { heroMaxLife: 2 },
      source: "Clear Act 1",
    },
    small_charm_might: {
      id: "small_charm_might",
      name: "Small Charm of Might",
      size: "small",
      slotCost: 1,
      bonuses: { heroDamageBonus: 1 },
      source: "Clear Act 2",
    },
    small_charm_warding: {
      id: "small_charm_warding",
      name: "Small Charm of Warding",
      size: "small",
      slotCost: 1,
      bonuses: { heroGuardBonus: 1 },
      source: "Clear Act 3",
    },
    small_charm_focus: {
      id: "small_charm_focus",
      name: "Small Charm of Focus",
      size: "small",
      slotCost: 1,
      bonuses: { heroMaxEnergy: 1 },
      source: "Clear Act 4",
    },
    small_charm_remedy: {
      id: "small_charm_remedy",
      name: "Small Charm of Remedy",
      size: "small",
      slotCost: 1,
      bonuses: { heroPotionHeal: 1 },
      source: "Defeat 5 bosses",
    },
    small_charm_vigor: {
      id: "small_charm_vigor",
      name: "Small Charm of Vigor",
      size: "small",
      slotCost: 1,
      bonuses: { heroMaxLife: 1, heroMaxEnergy: 1 },
      source: "Defeat 3 bosses",
    },
    small_charm_spite: {
      id: "small_charm_spite",
      name: "Small Charm of Spite",
      size: "small",
      slotCost: 1,
      bonuses: { heroBurnBonus: 1 },
      source: "Clear Act 5",
    },
    small_charm_loyalty: {
      id: "small_charm_loyalty",
      name: "Small Charm of Loyalty",
      size: "small",
      slotCost: 1,
      bonuses: { mercenaryAttack: 1 },
      source: "Play 2 different classes",
    },
    large_charm_fortitude: {
      id: "large_charm_fortitude",
      name: "Large Charm of Fortitude",
      size: "large",
      slotCost: 2,
      bonuses: { heroMaxLife: 4, heroGuardBonus: 1 },
      source: "Complete Act 5",
    },
    large_charm_prowess: {
      id: "large_charm_prowess",
      name: "Large Charm of Prowess",
      size: "large",
      slotCost: 2,
      bonuses: { heroDamageBonus: 2, heroBurnBonus: 1 },
      source: "Defeat 10 bosses",
    },
    large_charm_command: {
      id: "large_charm_command",
      name: "Large Charm of Command",
      size: "large",
      slotCost: 2,
      bonuses: { mercenaryAttack: 2, mercenaryMaxLife: 4 },
      source: "Play 3 different classes",
    },
    large_charm_resilience: {
      id: "large_charm_resilience",
      name: "Large Charm of Resilience",
      size: "large",
      slotCost: 2,
      bonuses: { heroMaxLife: 3, heroPotionHeal: 1 },
      source: "Defeat 8 bosses",
    },
    grand_charm_sorceress: {
      id: "grand_charm_sorceress",
      name: "Grand Charm: Sorceress Skiller",
      size: "grand",
      slotCost: 3,
      bonuses: { heroBurnBonus: 2, heroMaxEnergy: 1 },
      source: "Play Sorceress and clear Act 3",
      classId: "sorceress",
    },
    grand_charm_barbarian: {
      id: "grand_charm_barbarian",
      name: "Grand Charm: Barbarian Skiller",
      size: "grand",
      slotCost: 3,
      bonuses: { heroDamageBonus: 2, heroMaxLife: 1 },
      source: "Play Barbarian and clear Act 3",
      classId: "barbarian",
    },
    grand_charm_amazon: {
      id: "grand_charm_amazon",
      name: "Grand Charm: Amazon Skiller",
      size: "grand",
      slotCost: 3,
      bonuses: { heroDamageBonus: 1, heroGuardBonus: 1, heroMaxLife: 1 },
      source: "Play Amazon and clear Act 3",
      classId: "amazon",
    },
    grand_charm_paladin: {
      id: "grand_charm_paladin",
      name: "Grand Charm: Paladin Skiller",
      size: "grand",
      slotCost: 3,
      bonuses: { heroGuardBonus: 2, heroMaxLife: 1 },
      source: "Play Paladin and clear Act 3",
      classId: "paladin",
    },
    grand_charm_necromancer: {
      id: "grand_charm_necromancer",
      name: "Grand Charm: Necromancer Skiller",
      size: "grand",
      slotCost: 3,
      bonuses: { heroBurnBonus: 1, heroDamageBonus: 1, mercenaryMaxLife: 2 },
      source: "Play Necromancer and clear Act 3",
      classId: "necromancer",
    },
    grand_charm_assassin: {
      id: "grand_charm_assassin",
      name: "Grand Charm: Assassin Skiller",
      size: "grand",
      slotCost: 3,
      bonuses: { heroDamageBonus: 2, heroMaxEnergy: 1 },
      source: "Play Assassin and clear Act 3",
      classId: "assassin",
    },
    grand_charm_druid: {
      id: "grand_charm_druid",
      name: "Grand Charm: Druid Skiller",
      size: "grand",
      slotCost: 3,
      bonuses: { heroMaxLife: 2, mercenaryAttack: 1 },
      source: "Play Druid and clear Act 3",
      classId: "druid",
    },
  };

  function getCharmDefinition(charmId: string): CharmDefinition | null {
    return CHARM_CATALOG[charmId] || null;
  }

  function listAllCharms(): CharmDefinition[] {
    return Object.values(CHARM_CATALOG);
  }

  runtimeWindow.ROUGE_CHARM_DATA = {
    CHARM_CATALOG,
    getCharmDefinition,
    listAllCharms,
  };
})();
