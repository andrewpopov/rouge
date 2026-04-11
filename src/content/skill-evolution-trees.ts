(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Skill tree assignment: which class tree does each card belong to? ──
  // This also seeds explicit card proficiencies used by weapon scaling.

  const CARD_TREE_MAP: Record<string, string> = {
    // Sorceress
    sorceress_ice_bolt: "cold",
    sorceress_frost_nova: "cold",
    sorceress_blizzard: "cold",
    sorceress_frozen_orb: "cold",
    sorceress_frozen_armor: "cold",
    sorceress_fire_bolt: "fire",
    sorceress_fireball: "fire",
    sorceress_meteor: "fire",
    sorceress_inferno: "fire",
    sorceress_hydra: "fire",
    sorceress_warmth: "fire",
    sorceress_charged_bolt: "lightning",
    sorceress_static_field: "lightning",
    sorceress_chain_lightning: "lightning",
    sorceress_lightning_mastery: "lightning",
    sorceress_energy_shield: "lightning",
    sorceress_teleport: "lightning",

    // Barbarian
    barbarian_bash: "combat_skills",
    barbarian_stun: "combat_skills",
    barbarian_double_swing: "combat_skills",
    barbarian_leap: "combat_skills",
    barbarian_concentrate: "combat_skills",
    barbarian_frenzy: "combat_skills",
    barbarian_leap_attack: "combat_skills",
    barbarian_whirlwind: "combat_skills",
    barbarian_berserk: "combat_skills",
    barbarian_howl: "warcries",
    barbarian_find_potion: "warcries",
    barbarian_shout: "warcries",
    barbarian_battle_orders: "warcries",
    barbarian_war_cry: "warcries",
    barbarian_sword_mastery: "masteries",
    barbarian_weapon_mastery: "masteries",
    barbarian_iron_skin: "masteries",
    barbarian_natural_resistance: "masteries",
    barbarian_steel_skin: "masteries",
    barbarian_battle_instinct: "masteries",
    barbarian_unyielding: "masteries",

    // Necromancer
    necromancer_teeth: "poison_bone",
    necromancer_bone_armor: "poison_bone",
    necromancer_corpse_explosion: "poison_bone",
    necromancer_bone_spear: "poison_bone",
    necromancer_bone_spirit: "poison_bone",
    necromancer_bone_wall: "poison_bone",
    necromancer_poison_dagger: "poison_bone",
    necromancer_skeletal_mage: "summoning",
    necromancer_poison_nova: "poison_bone",
    necromancer_amplify_damage: "curses",
    necromancer_iron_maiden: "curses",
    necromancer_life_tap: "curses",
    necromancer_decrepify: "curses",
    necromancer_raise_skeleton: "summoning",
    necromancer_clay_golem: "summoning",
    necromancer_blood_golem: "summoning",
    necromancer_revive: "summoning",
    necromancer_skeleton_mastery: "summoning",
    necromancer_golem_mastery: "summoning",

    // Amazon
    amazon_magic_arrow: "bow",
    amazon_cold_arrow: "bow",
    amazon_guided_arrow: "bow",
    amazon_freezing_arrow: "bow",
    amazon_fire_arrow: "bow",
    amazon_exploding_arrow: "bow",
    amazon_multiple_shot: "bow",
    amazon_strafe: "bow",
    amazon_jab: "javelin",
    amazon_power_strike: "javelin",
    amazon_charged_strike: "javelin",
    amazon_lightning_fury: "javelin",
    amazon_slow_missiles: "passive",
    amazon_avoid: "passive",
    amazon_decoy: "passive",
    amazon_evade: "passive",
    amazon_deadly_strike: "passive",
    amazon_penetrate: "passive",
    amazon_inner_sight: "passive",
    amazon_dodge: "passive",
    amazon_critical_strike: "passive",
    amazon_valkyrie: "passive",
    amazon_pierce: "passive",

    // Assassin
    assassin_tiger_strike: "martial_arts",
    assassin_cobra_strike: "martial_arts",
    assassin_fists_of_fire: "martial_arts",
    assassin_claws_of_thunder: "martial_arts",
    assassin_blades_of_ice: "martial_arts",
    assassin_phoenix_strike: "martial_arts",
    assassin_fire_blast: "traps",
    assassin_wake_of_fire: "traps",
    assassin_lightning_sentry: "traps",
    assassin_death_sentry: "traps",
    assassin_psychic_hammer: "shadow",
    assassin_cloak_of_shadows: "shadow",
    assassin_burst_of_speed: "shadow",
    assassin_fade: "shadow",
    assassin_claw_mastery: "shadow",
    assassin_blade_shield: "shadow",
    assassin_shadow_warrior: "shadow",

    // Druid
    druid_firestorm: "elemental",
    druid_molten_boulder: "elemental",
    druid_fissure: "elemental",
    druid_cyclone_armor: "elemental",
    druid_volcano: "elemental",
    druid_tornado: "elemental",
    druid_armageddon: "elemental",
    druid_hurricane: "elemental",
    druid_werewolf: "shape_shifting",
    druid_lycanthropy: "shape_shifting",
    druid_werebear: "shape_shifting",
    druid_fury: "shape_shifting",
    druid_raven: "summoning",
    druid_poison_creeper: "summoning",
    druid_oak_sage: "summoning",
    druid_heart_of_wolverine: "summoning",
    druid_summon_grizzly: "summoning",
    druid_spirit_wolf: "summoning",
    druid_dire_wolf: "summoning",
    druid_pack_howl: "summoning",
    druid_natures_wrath: "summoning",
    druid_natures_balance: "summoning",
    druid_carrion_vine: "summoning",
    druid_solar_creeper: "summoning",
    druid_wild_stampede: "summoning",
    druid_force_of_nature: "summoning",

    // Paladin
    paladin_sacrifice: "combat",
    paladin_zeal: "combat",
    paladin_blessed_hammer: "combat",
    paladin_fist_of_the_heavens: "combat",
    paladin_smite: "combat",
    paladin_holy_bolt: "combat",
    paladin_vengeance: "combat",
    paladin_prayer: "defensive_auras",
    paladin_defiance: "defensive_auras",
    paladin_cleansing: "defensive_auras",
    paladin_holy_freeze: "defensive_auras",
    paladin_holy_shield: "defensive_auras",
    paladin_might: "offensive_auras",
    paladin_holy_fire: "offensive_auras",
    paladin_fanaticism: "offensive_auras",
    paladin_thorns: "offensive_auras",
    paladin_conviction: "offensive_auras",
  };

  const CARD_PROFICIENCY_MAP: Record<string, string> = { ...CARD_TREE_MAP };

  // ── Evolution chains: source card -> target card ──

  interface EvolutionEntry {
    targetId: string;
    requiredTier: number;    // tier of the target card (determines cost)
    requiredActMin: number;  // minimum act number OR tree rank
  }

  const EVOLUTION_CHAINS: Record<string, EvolutionEntry> = {
    // Sorceress Cold
    sorceress_ice_bolt:    { targetId: "sorceress_frost_nova",       requiredTier: 2, requiredActMin: 2 },
    sorceress_frost_nova:  { targetId: "sorceress_blizzard",         requiredTier: 3, requiredActMin: 3 },
    sorceress_blizzard:    { targetId: "sorceress_frozen_orb",       requiredTier: 4, requiredActMin: 4 },
    // Sorceress Fire (burst path)
    sorceress_fire_bolt:   { targetId: "sorceress_fireball",         requiredTier: 2, requiredActMin: 2 },
    sorceress_fireball:    { targetId: "sorceress_meteor",           requiredTier: 3, requiredActMin: 3 },
    // Sorceress Fire (DoT path)
    sorceress_inferno:     { targetId: "sorceress_meteor",           requiredTier: 3, requiredActMin: 3 },
    sorceress_meteor:      { targetId: "sorceress_hydra",            requiredTier: 4, requiredActMin: 4 },
    // Sorceress Lightning
    sorceress_charged_bolt: { targetId: "sorceress_static_field",    requiredTier: 2, requiredActMin: 2 },
    sorceress_static_field: { targetId: "sorceress_chain_lightning", requiredTier: 3, requiredActMin: 3 },
    sorceress_chain_lightning: { targetId: "sorceress_lightning_mastery", requiredTier: 4, requiredActMin: 4 },

    // Barbarian Combat Skills
    barbarian_bash:         { targetId: "barbarian_stun",            requiredTier: 2, requiredActMin: 2 },
    barbarian_stun:         { targetId: "barbarian_concentrate",     requiredTier: 3, requiredActMin: 3 },
    barbarian_concentrate:  { targetId: "barbarian_berserk",         requiredTier: 4, requiredActMin: 4 },
    barbarian_double_swing: { targetId: "barbarian_frenzy",          requiredTier: 3, requiredActMin: 3 },
    barbarian_leap:         { targetId: "barbarian_leap_attack",     requiredTier: 3, requiredActMin: 3 },
    barbarian_leap_attack:  { targetId: "barbarian_whirlwind",       requiredTier: 4, requiredActMin: 4 },
    // Barbarian Warcries
    barbarian_howl:          { targetId: "barbarian_shout",          requiredTier: 2, requiredActMin: 2 },
    barbarian_shout:         { targetId: "barbarian_battle_orders",  requiredTier: 3, requiredActMin: 3 },
    barbarian_battle_orders: { targetId: "barbarian_war_cry",        requiredTier: 4, requiredActMin: 4 },
    // Barbarian Masteries
    barbarian_sword_mastery:      { targetId: "barbarian_weapon_mastery",   requiredTier: 2, requiredActMin: 2 },
    barbarian_weapon_mastery:     { targetId: "barbarian_battle_instinct",  requiredTier: 4, requiredActMin: 4 },
    barbarian_iron_skin:          { targetId: "barbarian_steel_skin",       requiredTier: 3, requiredActMin: 3 },
    barbarian_natural_resistance: { targetId: "barbarian_unyielding",       requiredTier: 4, requiredActMin: 4 },

    // Necromancer Poison & Bone (burst path)
    necromancer_teeth:            { targetId: "necromancer_corpse_explosion", requiredTier: 2, requiredActMin: 2 },
    necromancer_corpse_explosion: { targetId: "necromancer_bone_spear",      requiredTier: 3, requiredActMin: 3 },
    necromancer_bone_spear:       { targetId: "necromancer_bone_spirit",     requiredTier: 4, requiredActMin: 4 },
    // Necromancer Poison & Bone (poison path)
    necromancer_bone_wall:      { targetId: "necromancer_poison_dagger",   requiredTier: 2, requiredActMin: 2 },
    necromancer_poison_dagger:  { targetId: "necromancer_poison_nova",     requiredTier: 4, requiredActMin: 4 },
    necromancer_skeletal_mage:  { targetId: "necromancer_revive",          requiredTier: 4, requiredActMin: 4 },
    // Necromancer Curses
    necromancer_amplify_damage: { targetId: "necromancer_iron_maiden",     requiredTier: 2, requiredActMin: 2 },
    necromancer_iron_maiden:    { targetId: "necromancer_decrepify",       requiredTier: 3, requiredActMin: 3 },
    // Necromancer Summoning
    necromancer_raise_skeleton: { targetId: "necromancer_skeletal_mage",   requiredTier: 2, requiredActMin: 2 },
    necromancer_clay_golem:     { targetId: "necromancer_blood_golem",     requiredTier: 3, requiredActMin: 3 },
    necromancer_blood_golem:    { targetId: "necromancer_revive",          requiredTier: 4, requiredActMin: 4 },

    // Amazon Bow (precision path)
    amazon_magic_arrow:  { targetId: "amazon_cold_arrow",      requiredTier: 2, requiredActMin: 2 },
    amazon_cold_arrow:   { targetId: "amazon_guided_arrow",    requiredTier: 3, requiredActMin: 3 },
    amazon_guided_arrow: { targetId: "amazon_freezing_arrow",  requiredTier: 4, requiredActMin: 4 },
    // Amazon Bow (fire path)
    amazon_fire_arrow:      { targetId: "amazon_exploding_arrow", requiredTier: 2, requiredActMin: 2 },
    amazon_exploding_arrow: { targetId: "amazon_strafe",          requiredTier: 3, requiredActMin: 3 },
    // Amazon Javelin
    amazon_jab:            { targetId: "amazon_power_strike",    requiredTier: 2, requiredActMin: 2 },
    amazon_power_strike:   { targetId: "amazon_charged_strike",  requiredTier: 3, requiredActMin: 3 },
    amazon_charged_strike: { targetId: "amazon_lightning_fury",  requiredTier: 4, requiredActMin: 4 },
    // Amazon Passive
    amazon_inner_sight:     { targetId: "amazon_penetrate",      requiredTier: 2, requiredActMin: 2 },
    amazon_critical_strike: { targetId: "amazon_deadly_strike",  requiredTier: 3, requiredActMin: 3 },
    amazon_dodge:           { targetId: "amazon_avoid",          requiredTier: 2, requiredActMin: 2 },
    amazon_avoid:           { targetId: "amazon_evade",          requiredTier: 3, requiredActMin: 3 },
    amazon_penetrate:       { targetId: "amazon_valkyrie",       requiredTier: 3, requiredActMin: 3 },
    amazon_deadly_strike:   { targetId: "amazon_pierce",         requiredTier: 4, requiredActMin: 4 },

    // Assassin Martial Arts
    assassin_tiger_strike:    { targetId: "assassin_cobra_strike",      requiredTier: 2, requiredActMin: 2 },
    assassin_cobra_strike:    { targetId: "assassin_claws_of_thunder",  requiredTier: 3, requiredActMin: 3 },
    assassin_fists_of_fire:   { targetId: "assassin_blades_of_ice",     requiredTier: 3, requiredActMin: 3 },
    assassin_blades_of_ice:   { targetId: "assassin_phoenix_strike",    requiredTier: 4, requiredActMin: 4 },
    // Assassin Traps
    assassin_fire_blast:       { targetId: "assassin_wake_of_fire",     requiredTier: 2, requiredActMin: 2 },
    assassin_wake_of_fire:     { targetId: "assassin_lightning_sentry", requiredTier: 3, requiredActMin: 3 },
    assassin_lightning_sentry: { targetId: "assassin_death_sentry",     requiredTier: 4, requiredActMin: 4 },
    // Assassin Shadow
    assassin_psychic_hammer: { targetId: "assassin_burst_of_speed",     requiredTier: 2, requiredActMin: 2 },
    assassin_burst_of_speed: { targetId: "assassin_fade",               requiredTier: 3, requiredActMin: 3 },
    assassin_claw_mastery:   { targetId: "assassin_blade_shield",       requiredTier: 2, requiredActMin: 2 },
    assassin_blade_shield:   { targetId: "assassin_shadow_warrior",     requiredTier: 4, requiredActMin: 4 },

    // Druid Elemental (fire path)
    druid_firestorm:      { targetId: "druid_molten_boulder", requiredTier: 2, requiredActMin: 2 },
    druid_molten_boulder: { targetId: "druid_volcano",        requiredTier: 3, requiredActMin: 3 },
    druid_volcano:        { targetId: "druid_armageddon",     requiredTier: 4, requiredActMin: 4 },
    // Druid Elemental (wind path)
    druid_fissure: { targetId: "druid_tornado",  requiredTier: 3, requiredActMin: 3 },
    druid_tornado: { targetId: "druid_hurricane", requiredTier: 4, requiredActMin: 4 },
    // Druid Shape Shifting
    druid_werewolf: { targetId: "druid_werebear", requiredTier: 2, requiredActMin: 2 },
    druid_werebear: { targetId: "druid_fury",     requiredTier: 3, requiredActMin: 3 },
    // Druid Summoning
    druid_raven:             { targetId: "druid_oak_sage",          requiredTier: 2, requiredActMin: 2 },
    druid_oak_sage:          { targetId: "druid_heart_of_wolverine", requiredTier: 3, requiredActMin: 3 },
    druid_heart_of_wolverine: { targetId: "druid_summon_grizzly",   requiredTier: 4, requiredActMin: 4 },

    // Paladin Combat (burst path)
    paladin_sacrifice:      { targetId: "paladin_zeal",               requiredTier: 2, requiredActMin: 2 },
    paladin_zeal:           { targetId: "paladin_blessed_hammer",     requiredTier: 3, requiredActMin: 3 },
    paladin_blessed_hammer: { targetId: "paladin_fist_of_the_heavens", requiredTier: 4, requiredActMin: 4 },
    // Paladin Combat (sustain path)
    paladin_smite:     { targetId: "paladin_holy_bolt",  requiredTier: 2, requiredActMin: 2 },
    paladin_holy_bolt: { targetId: "paladin_vengeance",  requiredTier: 3, requiredActMin: 3 },
    // Paladin Defensive Auras
    paladin_prayer:   { targetId: "paladin_defiance",    requiredTier: 2, requiredActMin: 2 },
    paladin_defiance: { targetId: "paladin_holy_freeze", requiredTier: 3, requiredActMin: 3 },
    // Paladin Offensive Auras
    paladin_might:      { targetId: "paladin_holy_fire",   requiredTier: 2, requiredActMin: 2 },
    paladin_holy_fire:  { targetId: "paladin_fanaticism",  requiredTier: 3, requiredActMin: 3 },
    paladin_thorns:     { targetId: "paladin_fanaticism",  requiredTier: 3, requiredActMin: 3 },
    paladin_fanaticism: { targetId: "paladin_conviction",  requiredTier: 4, requiredActMin: 4 },
  };

  // ── Evolution cost by target tier ──

  const EVOLUTION_COST: Record<number, number> = {
    2: 60,
    3: 100,
    4: 150,
  };

  // ── Generic upgrade definitions ──

  interface GenericUpgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
  }

  const GENERIC_UPGRADES: GenericUpgrade[] = [
    { id: "sharpen",  name: "Sharpen",  description: "+3 damage to all damage effects", cost: 50 },
    { id: "fortify",  name: "Fortify",  description: "+3 Guard to all Guard effects",   cost: 50 },
    { id: "temper",   name: "Temper",   description: "Card costs 1 less Energy (min 0)", cost: 90 },
    { id: "hone",     name: "Hone",     description: "Card gains Draw 1",               cost: 70 },
  ];

  const MAX_UPGRADE_SLOTS = 2;

  // ── Sage costs ──

  const SAGE_PURGE_BASE_COST = 50;
  const SAGE_PURGE_ESCALATION = 25;
  const SAGE_TRANSFORM_COST = 40;

  // ── Public API ──

  function normalizeCardId(cardId: string): string {
    return String(cardId || "").replace(/_plus$/, "");
  }

  function getCardTree(cardId: string): string {
    return CARD_TREE_MAP[normalizeCardId(cardId)] || "";
  }

  function getCardProficiency(cardId: string): string {
    const card =
      runtimeWindow.ROUGE_GAME_CONTENT?.cardCatalog?.[cardId] ||
      runtimeWindow.__ROUGE_CLASS_CARDS?.classCardCatalog?.[cardId];
    if (card?.proficiency) {
      return card.proficiency;
    }
    const baseCardId = normalizeCardId(cardId);
    return CARD_PROFICIENCY_MAP[baseCardId] || getCardTree(baseCardId) || "";
  }

  function applyCardProficiencies(cardCatalog: Record<string, CardDefinition> | null | undefined) {
    if (!cardCatalog) {
      return;
    }
    Object.values(cardCatalog).forEach((card) => {
      if (!card || card.proficiency) {
        return;
      }
      const proficiency = CARD_PROFICIENCY_MAP[normalizeCardId(card.id)] || getCardTree(card.id);
      if (proficiency) {
        card.proficiency = proficiency;
      }
    });
  }

  function getEvolution(cardId: string): EvolutionEntry | null {
    const baseCardId = normalizeCardId(cardId);
    const evolution = EVOLUTION_CHAINS[baseCardId];
    if (!evolution) {
      return null;
    }
    const refinedTargetId = `${evolution.targetId}_plus`;
    const refinedCard = baseCardId !== cardId;
    const targetId =
      refinedCard && runtimeWindow.ROUGE_GAME_CONTENT?.cardCatalog?.[refinedTargetId]
        ? refinedTargetId
        : evolution.targetId;
    return { ...evolution, targetId };
  }

  function getEvolutionTerminalCardId(cardId: string): string {
    const refinedCard = normalizeCardId(cardId) !== cardId;
    let currentCardId = normalizeCardId(cardId);
    const seen = new Set<string>();
    while (EVOLUTION_CHAINS[currentCardId] && !seen.has(currentCardId)) {
      seen.add(currentCardId);
      currentCardId = normalizeCardId(EVOLUTION_CHAINS[currentCardId].targetId);
    }

    const refinedTerminalId = `${currentCardId}_plus`;
    const terminalExists =
      Boolean(runtimeWindow.ROUGE_GAME_CONTENT?.cardCatalog?.[refinedTerminalId]) ||
      Boolean(runtimeWindow.__ROUGE_CLASS_CARDS?.classCardCatalog?.[refinedTerminalId]);
    if (refinedCard && terminalExists) {
      return refinedTerminalId;
    }
    return currentCardId;
  }

  function getEvolutionCost(targetTier: number): number {
    return EVOLUTION_COST[targetTier] || 0;
  }

  function getGenericUpgrades(): GenericUpgrade[] {
    return GENERIC_UPGRADES;
  }

  function getMaxUpgradeSlots(): number {
    return MAX_UPGRADE_SLOTS;
  }

  function getSagePurgeCost(purgeCount: number): number {
    return SAGE_PURGE_BASE_COST + purgeCount * SAGE_PURGE_ESCALATION;
  }

  function getSageTransformCost(): number {
    return SAGE_TRANSFORM_COST;
  }

  /**
   * Calculate synergy bonus damage for a given card based on how many
   * same-tree cards are in the deck.
   *
   * 2 same-tree cards: +1 damage each
   * 3 same-tree cards: +2 damage each
   * 4+ same-tree cards: +2 damage each
   */
  function getSynergyDamageBonus(cardId: string, deck: string[]): number {
    const tree = getCardTree(cardId);
    if (!tree) {
      return 0;
    }
    const sameTreeCount = deck.filter((id) => getCardTree(id) === tree).length;
    if (sameTreeCount >= 3) {
      return 2;
    }
    if (sameTreeCount >= 2) {
      return 1;
    }
    return 0;
  }

  /**
   * Check if 4+ cards from the same tree exist in the deck,
   * granting a cost reduction to the cheapest card in that tree.
   */
  function getTreeCostReduction(cardId: string, deck: string[], cardCatalog: Record<string, CardDefinition>): number {
    const tree = getCardTree(cardId);
    if (!tree) {
      return 0;
    }
    const sameTreeCards = deck.filter((id) => getCardTree(id) === tree);
    if (sameTreeCards.length < 4) {
      return 0;
    }
    // Find the cheapest card in this tree
    let cheapestCost = Infinity;
    let cheapestId = "";
    for (const id of sameTreeCards) {
      const card = cardCatalog[id];
      if (card && card.cost < cheapestCost) {
        cheapestCost = card.cost;
        cheapestId = id;
      }
    }
    // Only the cheapest card gets the reduction
    if (cardId === cheapestId && cheapestCost > 0) {
      return 1;
    }
    return 0;
  }

  /**
   * Check if a card is eligible for evolution given the current run state.
   */
  function canEvolve(cardId: string, run: RunState): boolean {
    const evolution = getEvolution(cardId);
    if (!evolution) {
      return false;
    }
    if (run.gold < getEvolutionCost(evolution.requiredTier)) {
      return false;
    }
    // Check act requirement
    if (run.actNumber >= evolution.requiredActMin) {
      return true;
    }
    // Check tree rank requirement (tree rank >= target tier)
    const tree = getCardTree(cardId);
    if (tree && run.progression?.classProgression?.treeRanks) {
      const treeRanks = run.progression.classProgression.treeRanks;
      for (const treeId of Object.keys(treeRanks)) {
        if (treeId.includes(tree) || tree.includes(treeId)) {
          if (treeRanks[treeId] >= evolution.requiredTier) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * List all deck cards eligible for evolution.
   */
  function listEvolvableCards(run: RunState): Array<{ cardId: string; targetId: string; cost: number }> {
    const seen = new Set<string>();
    const results: Array<{ cardId: string; targetId: string; cost: number }> = [];
    for (const cardId of run.deck) {
      if (seen.has(cardId)) {
        continue;
      }
      seen.add(cardId);
      const evolution = getEvolution(cardId);
      if (evolution && canEvolve(cardId, run)) {
        results.push({
          cardId,
          targetId: evolution.targetId,
          cost: getEvolutionCost(evolution.requiredTier),
        });
      }
    }
    return results;
  }

  applyCardProficiencies(runtimeWindow.__ROUGE_CLASS_CARDS?.classCardCatalog);

  runtimeWindow.__ROUGE_SKILL_EVOLUTION = {
    CARD_TREE_MAP,
    CARD_PROFICIENCY_MAP,
    EVOLUTION_CHAINS,
    EVOLUTION_COST,
    GENERIC_UPGRADES,
    MAX_UPGRADE_SLOTS,
    getCardProficiency,
    getCardTree,
    getEvolution,
    getEvolutionTerminalCardId,
    getEvolutionCost,
    getGenericUpgrades,
    getMaxUpgradeSlots,
    getSagePurgeCost,
    getSageTransformCost,
    getSynergyDamageBonus,
    getTreeCostReduction,
    canEvolve,
    listEvolvableCards,
  };
})();
