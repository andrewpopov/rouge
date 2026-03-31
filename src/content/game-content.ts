/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const { hero, mercenaryCatalog } = runtimeWindow.__ROUGE_GC_MERCENARIES;
  const { consequenceEncounterPackages } = runtimeWindow.__ROUGE_GC_ENCOUNTERS;
  const { consequenceRewardPackages } = runtimeWindow.__ROUGE_GC_REWARDS;
  const { classCardCatalog, classStarterDecks, classRewardPools } = runtimeWindow.__ROUGE_CLASS_CARDS;

  const cardCatalog: Record<string, CardDefinition> = {
    quick_slash: {
      id: "quick_slash",
      title: "Quick Slash",
      cost: 1,
      target: "enemy",
      text: "Deal 7 damage.",
      effects: [{ kind: "damage", value: 7 }],
    },
    shield_slam: {
      id: "shield_slam",
      title: "Shield Slam",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Gain 4 Guard.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "gain_guard_self", value: 4 },
      ],
    },
    focus_fire: {
      id: "focus_fire",
      title: "Focus Fire",
      cost: 1,
      target: "enemy",
      text: "Deal 4 damage. Your mercenary deals +4 to this target.",
      effects: [
        { kind: "damage", value: 4 },
        { kind: "mark_enemy_for_mercenary", value: 4 },
      ],
    },
    fire_bolt: {
      id: "fire_bolt",
      title: "Fire Bolt",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Apply 2 Burn.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "apply_burn", value: 2 },
      ],
    },
    battle_orders: {
      id: "battle_orders",
      title: "Battle Orders",
      cost: 2,
      target: "none",
      text: "You and your mercenary gain 6 Guard. Mercenary next attack +3.",
      effects: [
        { kind: "gain_guard_party", value: 6 },
        { kind: "buff_mercenary_next_attack", value: 3 },
      ],
    },
    multishot: {
      id: "multishot",
      title: "Multishot",
      cost: 2,
      target: "none",
      text: "Deal 4 damage to all enemies.",
      effects: [{ kind: "damage_all", value: 4 }],
    },
    rally_mercenary: {
      id: "rally_mercenary",
      title: "Rally Mercenary",
      cost: 1,
      target: "none",
      text: "Heal your mercenary 5. Draw 1 card.",
      effects: [
        { kind: "heal_mercenary", value: 5 },
        { kind: "draw", value: 1 },
      ],
    },
    second_wind: {
      id: "second_wind",
      title: "Second Wind",
      cost: 1,
      target: "none",
      text: "Heal 6. Gain 3 Guard.",
      effects: [
        { kind: "heal_hero", value: 6 },
        { kind: "gain_guard_self", value: 3 },
      ],
    },
    quick_slash_plus: {
      id: "quick_slash_plus",
      title: "Quick Slash+",
      cost: 1,
      target: "enemy",
      text: "Deal 10 damage.",
      effects: [{ kind: "damage", value: 10 }],
    },
    shield_slam_plus: {
      id: "shield_slam_plus",
      title: "Shield Slam+",
      cost: 1,
      target: "enemy",
      text: "Deal 7 damage. Gain 6 Guard.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "gain_guard_self", value: 6 },
      ],
    },
    focus_fire_plus: {
      id: "focus_fire_plus",
      title: "Focus Fire+",
      cost: 1,
      target: "enemy",
      text: "Deal 6 damage. Your mercenary deals +6 to this target.",
      effects: [
        { kind: "damage", value: 6 },
        { kind: "mark_enemy_for_mercenary", value: 6 },
      ],
    },
    fire_bolt_plus: {
      id: "fire_bolt_plus",
      title: "Fire Bolt+",
      cost: 1,
      target: "enemy",
      text: "Deal 7 damage. Apply 3 Burn.",
      effects: [
        { kind: "damage", value: 7 },
        { kind: "apply_burn", value: 3 },
      ],
    },
    battle_orders_plus: {
      id: "battle_orders_plus",
      title: "Battle Orders+",
      cost: 2,
      target: "none",
      text: "You and your mercenary gain 8 Guard. Mercenary next attack +4.",
      effects: [
        { kind: "gain_guard_party", value: 8 },
        { kind: "buff_mercenary_next_attack", value: 4 },
      ],
    },
    multishot_plus: {
      id: "multishot_plus",
      title: "Multishot+",
      cost: 2,
      target: "none",
      text: "Deal 6 damage to all enemies.",
      effects: [{ kind: "damage_all", value: 6 }],
    },
    rally_mercenary_plus: {
      id: "rally_mercenary_plus",
      title: "Rally Mercenary+",
      cost: 1,
      target: "none",
      text: "Heal your mercenary 8. Draw 1 card.",
      effects: [
        { kind: "heal_mercenary", value: 8 },
        { kind: "draw", value: 1 },
      ],
    },
    second_wind_plus: {
      id: "second_wind_plus",
      title: "Second Wind+",
      cost: 1,
      target: "none",
      text: "Heal 9. Gain 5 Guard.",
      effects: [
        { kind: "heal_hero", value: 9 },
        { kind: "gain_guard_self", value: 5 },
      ],
    },
    guard_stance: {
      id: "guard_stance",
      title: "Guard Stance",
      cost: 1,
      target: "none",
      text: "Gain 8 Guard. Draw 1 card.",
      effects: [
        { kind: "gain_guard_self", value: 8 },
        { kind: "draw", value: 1 },
      ],
    },
    sweeping_strike: {
      id: "sweeping_strike",
      title: "Sweeping Strike",
      cost: 2,
      target: "none",
      text: "Deal 6 damage to all enemies.",
      effects: [{ kind: "damage_all", value: 6 }],
    },
    execution_blow: {
      id: "execution_blow",
      title: "Execution Blow",
      cost: 2,
      target: "enemy",
      text: "Deal 12 damage.",
      effects: [{ kind: "damage", value: 12 }],
    },
    merciless_command: {
      id: "merciless_command",
      title: "Merciless Command",
      cost: 1,
      target: "enemy",
      text: "Deal 5 damage. Your mercenary deals +8 to this target.",
      effects: [
        { kind: "damage", value: 5 },
        { kind: "mark_enemy_for_mercenary", value: 8 },
      ],
    },
    volley_fire: {
      id: "volley_fire",
      title: "Volley Fire",
      cost: 2,
      target: "none",
      text: "Deal 5 damage to all enemies.",
      effects: [{ kind: "damage_all", value: 5 }],
    },
    ashen_orb: {
      id: "ashen_orb",
      title: "Ashen Orb",
      cost: 2,
      target: "enemy",
      text: "Deal 8 damage. Apply 3 Burn.",
      effects: [
        { kind: "damage", value: 8 },
        { kind: "apply_burn", value: 3 },
      ],
    },
    emberstorm: {
      id: "emberstorm",
      title: "Emberstorm",
      cost: 2,
      target: "none",
      text: "Deal 5 damage to all enemies. Draw 1 card.",
      effects: [
        { kind: "damage_all", value: 5 },
        { kind: "draw", value: 1 },
      ],
    },
    war_cry: {
      id: "war_cry",
      title: "War Cry",
      cost: 1,
      target: "none",
      text: "You and your mercenary gain 5 Guard. Draw 1 card.",
      effects: [
        { kind: "gain_guard_party", value: 5 },
        { kind: "draw", value: 1 },
      ],
    },
    triage: {
      id: "triage",
      title: "Triage",
      cost: 1,
      target: "none",
      text: "Heal 5. Heal your mercenary 5.",
      effects: [
        { kind: "heal_hero", value: 5 },
        { kind: "heal_mercenary", value: 5 },
      ],
    },
  };

  function formatMinionName(minionId: string | undefined): string {
    const parts = String(minionId || "")
      .split("_")
      .slice(1)
      .filter(Boolean);
    return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  function describeCardEffect(effect: CardEffect): string {
    switch (effect.kind) {
      case "damage":
        return `Deal ${effect.value} damage`;
      case "damage_all":
        return `Deal ${effect.value} damage to all enemies`;
      case "summon_minion": {
        const minionName = formatMinionName(effect.minionId) || "Minion";
        return `Summon ${minionName}`;
      }
      case "gain_guard_self":
        return `Gain ${effect.value} Guard`;
      case "gain_guard_party":
        return `You and your mercenary gain ${effect.value} Guard`;
      case "heal_hero":
        return `Heal ${effect.value}`;
      case "heal_mercenary":
        return `Heal your mercenary ${effect.value}`;
      case "draw":
        return `Draw ${effect.value} card${effect.value === 1 ? "" : "s"}`;
      case "mark_enemy_for_mercenary":
        return `Your mercenary deals +${effect.value} to this target`;
      case "buff_mercenary_next_attack":
        return `Mercenary next attack +${effect.value}`;
      case "apply_burn":
        return `Apply ${effect.value} Burn`;
      case "apply_burn_all":
        return `Apply ${effect.value} Burn to all enemies`;
      case "apply_poison":
        return `Apply ${effect.value} Poison`;
      case "apply_poison_all":
        return `Apply ${effect.value} Poison to all enemies`;
      case "apply_slow":
        return `Apply ${effect.value} Slow`;
      case "apply_slow_all":
        return `Apply ${effect.value} Slow to all enemies`;
      case "apply_freeze":
        return `Apply ${effect.value} Freeze`;
      case "apply_freeze_all":
        return `Apply ${effect.value} Freeze to all enemies`;
      case "apply_stun":
        return `Apply ${effect.value} Stun`;
      case "apply_stun_all":
        return `Apply ${effect.value} Stun to all enemies`;
      case "apply_paralyze":
        return `Apply ${effect.value} Paralyze`;
      case "apply_paralyze_all":
        return `Apply ${effect.value} Paralyze to all enemies`;
      default:
        return "";
    }
  }

  function boostRefinedEffectValue(effect: CardEffect): CardEffect {
    const upgraded = { ...effect };
    switch (effect.kind) {
      case "damage":
      case "damage_all":
      case "gain_guard_self":
      case "gain_guard_party":
      case "heal_hero":
      case "heal_mercenary":
      case "mark_enemy_for_mercenary":
      case "buff_mercenary_next_attack":
        upgraded.value = effect.value + Math.max(2, Math.round(effect.value * 0.3));
        break;
      case "summon_minion":
        upgraded.value = effect.value + 1;
        if (typeof effect.secondaryValue === "number") {
          upgraded.secondaryValue = effect.secondaryValue + 1;
        }
        break;
      case "draw":
      case "apply_burn":
      case "apply_burn_all":
      case "apply_poison":
      case "apply_poison_all":
      case "apply_slow":
      case "apply_slow_all":
      case "apply_freeze":
      case "apply_freeze_all":
      case "apply_stun":
      case "apply_stun_all":
      case "apply_paralyze":
      case "apply_paralyze_all":
        upgraded.value = effect.value + 1;
        break;
      default:
        break;
    }
    return upgraded;
  }

  function buildCardText(effects: CardEffect[]): string {
    return effects
      .map((effect) => describeCardEffect(effect))
      .filter(Boolean)
      .join(". ")
      .concat(".");
  }

  function createGeneratedPlusVariant(card: CardDefinition): CardDefinition {
    const upgradedEffects = (Array.isArray(card.effects) ? card.effects : []).map((effect) => boostRefinedEffectValue(effect));
    return {
      ...card,
      id: `${card.id}_plus`,
      title: card.title.endsWith("+") ? card.title : `${card.title}+`,
      text: buildCardText(upgradedEffects),
      effects: upgradedEffects,
    };
  }

  function addGeneratedPlusVariants(catalog: Record<string, CardDefinition>) {
    const baseCards = Object.values(catalog).filter((card) => card && !card.id.endsWith("_plus"));
    for (const card of baseCards) {
      const plusId = `${card.id}_plus`;
      if (catalog[plusId]) {
        continue;
      }
      catalog[plusId] = createGeneratedPlusVariant(card);
    }
  }

  // Merge class-specific skill cards into the card catalog
  Object.assign(cardCatalog, classCardCatalog);
  addGeneratedPlusVariants(cardCatalog);

  const starterDeck = [
    "quick_slash",
    "quick_slash",
    "quick_slash",
    "shield_slam",
    "shield_slam",
    "focus_fire",
    "focus_fire",
    "fire_bolt",
    "fire_bolt",
    "battle_orders",
    "multishot",
    "rally_mercenary",
    "second_wind",
  ];

  const starterDeckProfiles = {
    warrior: [
      "quick_slash",
      "quick_slash",
      "quick_slash",
      "shield_slam",
      "shield_slam",
      "shield_slam",
      "battle_orders",
      "battle_orders",
      "focus_fire",
      "multishot",
      "rally_mercenary",
      "second_wind",
      "second_wind",
    ],
    hunter: [
      "quick_slash",
      "quick_slash",
      "quick_slash",
      "focus_fire",
      "focus_fire",
      "focus_fire",
      "shield_slam",
      "fire_bolt",
      "multishot",
      "multishot",
      "rally_mercenary",
      "second_wind",
      "battle_orders",
    ],
    caster: [
      "quick_slash",
      "quick_slash",
      "shield_slam",
      "focus_fire",
      "fire_bolt",
      "fire_bolt",
      "fire_bolt",
      "multishot",
      "multishot",
      "rally_mercenary",
      "rally_mercenary",
      "second_wind",
      "battle_orders",
    ],
  };

  const classDeckProfiles = {
    amazon: "hunter",
    assassin: "hunter",
    barbarian: "warrior",
    druid: "warrior",
    necromancer: "caster",
    paladin: "warrior",
    sorceress: "caster",
  };

  const rewardPools = {
    profileCards: {
      warrior: [
        "guard_stance",
        "sweeping_strike",
        "execution_blow",
        "shield_slam_plus",
        "battle_orders_plus",
      ],
      hunter: [
        "merciless_command",
        "volley_fire",
        "quick_slash_plus",
        "focus_fire_plus",
        "triage",
      ],
      caster: [
        "ashen_orb",
        "emberstorm",
        "fire_bolt_plus",
        "second_wind_plus",
        "war_cry",
      ],
    },
    zoneRoleCards: {
      opening: [
        "guard_stance",
        "triage",
        "quick_slash_plus",
      ],
      branchBattle: [
        "sweeping_strike",
        "war_cry",
        "merciless_command",
      ],
      branchMiniboss: [
        "execution_blow",
        "ashen_orb",
        "battle_orders_plus",
      ],
      boss: [
        "multishot_plus",
        "battle_orders_plus",
        "second_wind_plus",
      ],
    },
    bossCards: [
      "execution_blow",
      "battle_orders_plus",
      "multishot_plus",
      "emberstorm",
      "rally_mercenary_plus",
    ],
  };

  const enemyCatalog: Record<string, EnemyTemplate> = {
    fallen_cutthroat: {
      templateId: "fallen_cutthroat",
      name: "Fallen Cutthroat",
      maxLife: 16,
      intents: [
        { kind: "attack", label: "Rust Knife", value: 5, target: "hero" },
        { kind: "guard", label: "Scramble", value: 3 },
      ],
    },
    fallen_shaman: {
      templateId: "fallen_shaman",
      name: "Fallen Shaman",
      maxLife: 20,
      intents: [
        { kind: "heal_ally", label: "Dark Prayer", value: 5 },
        { kind: "attack", label: "Cinder Hex", value: 4, target: "hero" },
      ],
    },
    bone_archer: {
      templateId: "bone_archer",
      name: "Bone Archer",
      maxLife: 15,
      intents: [
        { kind: "attack", label: "Aimed Shot", value: 6, target: "lowest_life" },
        { kind: "attack", label: "Barbed Arrow", value: 4, target: "hero" },
      ],
    },
    grave_brute: {
      templateId: "grave_brute",
      name: "Grave Brute",
      maxLife: 28,
      intents: [
        { kind: "guard", label: "Brace", value: 4 },
        { kind: "attack", label: "Maul", value: 8, target: "hero" },
      ],
    },
    corrupted_knight: {
      templateId: "corrupted_knight",
      name: "Corrupted Knight",
      maxLife: 22,
      intents: [
        { kind: "attack", label: "Cleaving Blow", value: 7, target: "hero" },
        { kind: "attack", label: "Shield Rush", value: 5, target: "lowest_life" },
      ],
    },
  };

  const encounterCatalog = {
    blood_moor_raiders: {
      id: "blood_moor_raiders",
      name: "Blighted Moor Raiders",
      description: "Two Fallen cutthroats rush the line while a shaman keeps them in the fight.",
      enemies: [
        { id: "fallen_a", templateId: "fallen_cutthroat" },
        { id: "fallen_b", templateId: "fallen_cutthroat" },
        { id: "shaman", templateId: "fallen_shaman" },
      ],
    },
    burial_grounds: {
      id: "burial_grounds",
      name: "Graveyard Ridge",
      description: "A brute anchors the front while skeletal ranged pressure picks at weak targets.",
      enemies: [
        { id: "grave_brute", templateId: "grave_brute" },
        { id: "bone_archer", templateId: "bone_archer" },
        { id: "fallen_shaman", templateId: "fallen_shaman" },
      ],
    },
    catacombs_gate: {
      id: "catacombs_gate",
      name: "Abbey Vault Gate",
      description: "A larger pack shows the target state: hero and mercenary against a mixed encounter group.",
      enemies: [
        { id: "knight", templateId: "corrupted_knight" },
        { id: "archer_a", templateId: "bone_archer" },
        { id: "archer_b", templateId: "bone_archer" },
        { id: "fallen", templateId: "fallen_cutthroat" },
      ],
    },
  };

  runtimeWindow.ROUGE_GAME_CONTENT = {
    hero,
    mercenaryCatalog,
    cardCatalog,
    starterDeck,
    starterDeckProfiles,
    classDeckProfiles,
    classStarterDecks,
    classRewardPools,
    rewardPools,
    consequenceEncounterPackages,
    consequenceRewardPackages,
    enemyCatalog,
    encounterCatalog,
  };
})();
