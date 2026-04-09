(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { parseInteger } = runtimeWindow.ROUGE_UTILS;
  const { isTrapTemplate, isSupportTemplate, isDeviceTemplate } = runtimeWindow.__ROUGE_COMBAT_UTILS;

  const MAX_ACTIVE_CREATURES = 3;   // Targetable summons (stacking armies count as 1)
  const MAX_ACTIVE_TRAPS = 3;       // Invulnerable devices (sentries, wakes)
  const MAX_ACTIVE_MINIONS = MAX_ACTIVE_CREATURES + MAX_ACTIVE_TRAPS;
  const DEFAULT_TEMPORARY_MINION_DURATION = 3;

  type MinionTemplateDefinition = {
    id: string;
    name: string;
    skillLabel: string;
    actionKind: CombatMinionActionKind;
    targetRule: CombatMinionTargetRule;
    persistent: boolean;
    stackGroup?: string;  // Templates in same group stack into one entity
    stackAbility?: string;  // Ability added when this template stacks onto an existing group member
    stackCap?: number;  // Optional gameplay stack cap for repeated summons of this template
  };

  const MINION_TEMPLATES: Record<string, MinionTemplateDefinition> = {
    necromancer_skeleton: {
      id: "necromancer_skeleton",
      name: "Skeleton Army",
      skillLabel: "Bone Rush",
      actionKind: "attack",
      targetRule: "selected_enemy",
      persistent: true,
      stackGroup: "necro_army",
    },
    necromancer_servant: {
      id: "necromancer_servant",
      name: "Skeleton Army",
      skillLabel: "Bone Rush",
      actionKind: "attack",
      targetRule: "selected_enemy",
      persistent: false,
      stackGroup: "necro_army",
    },
    necromancer_clay_golem: {
      id: "necromancer_clay_golem",
      name: "Clay Golem",
      skillLabel: "Mud Guard",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      persistent: true,
      stackGroup: "necro_golem",
    },
    necromancer_skeletal_mage: {
      id: "necromancer_skeletal_mage",
      name: "Skeletal Mage",
      skillLabel: "Toxic Bolt",
      actionKind: "attack_poison",
      targetRule: "lowest_life",
      persistent: true,
      stackGroup: "necro_army",
      stackAbility: "poison",
    },
    necromancer_blood_golem: {
      id: "necromancer_blood_golem",
      name: "Blood Golem",
      skillLabel: "Siphon Maw",
      actionKind: "attack_heal_hero",
      targetRule: "selected_enemy",
      persistent: true,
      stackGroup: "necro_golem",
    },
    necromancer_revive: {
      id: "necromancer_revive",
      name: "Revived Horror",
      skillLabel: "Grave Pummel",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      persistent: true,
    },
    amazon_valkyrie: {
      id: "amazon_valkyrie",
      name: "Valkyrie",
      skillLabel: "Spear Ward",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      persistent: true,
    },
    amazon_decoy: {
      id: "amazon_decoy",
      name: "Decoy",
      skillLabel: "Distracting Feint",
      actionKind: "buff_mercenary_guard_party",
      targetRule: "all_enemies",
      persistent: true,
    },
    druid_raven: {
      id: "druid_raven",
      name: "Raven",
      skillLabel: "Pecking Mark",
      actionKind: "attack_mark",
      targetRule: "lowest_life",
      persistent: true,
    },
    druid_poison_creeper: {
      id: "druid_poison_creeper",
      name: "Poison Creeper",
      skillLabel: "Venom Lash",
      actionKind: "attack_poison",
      targetRule: "lowest_life",
      persistent: true,
    },
    druid_oak_sage: {
      id: "druid_oak_sage",
      name: "Oak Sage",
      skillLabel: "Vital Bloom",
      actionKind: "heal_party",
      targetRule: "all_enemies",
      persistent: true,
    },
    druid_spirit_wolf: {
      id: "druid_spirit_wolf",
      name: "Wolf Pack",
      skillLabel: "Pack Strike",
      actionKind: "attack",
      targetRule: "selected_enemy",
      persistent: true,
      stackGroup: "druid_pack",
    },
    druid_spirit_wolf_2: {
      id: "druid_spirit_wolf_2",
      name: "Wolf Pack",
      skillLabel: "Pack Strike",
      actionKind: "attack",
      targetRule: "selected_enemy",
      persistent: true,
      stackGroup: "druid_pack",
    },
    druid_dire_wolf: {
      id: "druid_dire_wolf",
      name: "Wolf Pack",
      skillLabel: "Pack Strike",
      actionKind: "attack",
      targetRule: "selected_enemy",
      persistent: true,
      stackGroup: "druid_pack",
      stackAbility: "guard_party",
    },
    druid_heart_of_wolverine: {
      id: "druid_heart_of_wolverine",
      name: "Heart of Wolverine",
      skillLabel: "Predator's Mark",
      actionKind: "attack_mark",
      targetRule: "lowest_life",
      persistent: true,
    },
    druid_grizzly: {
      id: "druid_grizzly",
      name: "Grizzly",
      skillLabel: "Mauling Swipe",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      persistent: true,
    },
    assassin_wake_of_fire: {
      id: "assassin_wake_of_fire",
      name: "Wake of Fire",
      skillLabel: "Flame Sweep",
      actionKind: "attack_all_burn",
      targetRule: "all_enemies",
      persistent: false,
      stackCap: 3,
    },
    assassin_lightning_sentry: {
      id: "assassin_lightning_sentry",
      name: "Lightning Sentry",
      skillLabel: "Static Volley",
      actionKind: "attack_all_paralyze",
      targetRule: "all_enemies",
      persistent: false,
      stackCap: 3,
    },
    assassin_death_sentry: {
      id: "assassin_death_sentry",
      name: "Death Sentry",
      skillLabel: "Death Pulse",
      actionKind: "attack_all_paralyze",
      targetRule: "all_enemies",
      persistent: false,
      stackCap: 3,
    },
    assassin_blade_sentinel: {
      id: "assassin_blade_sentinel",
      name: "Blade Sentinel",
      skillLabel: "Blade Sweep",
      actionKind: "attack_all",
      targetRule: "all_enemies",
      persistent: false,
      stackCap: 3,
    },
    assassin_charged_bolt_sentry: {
      id: "assassin_charged_bolt_sentry",
      name: "Charged Bolt Sentry",
      skillLabel: "Charged Volley",
      actionKind: "attack_all_paralyze",
      targetRule: "all_enemies",
      persistent: false,
      stackCap: 3,
    },
    assassin_shadow_trap: {
      id: "assassin_shadow_trap",
      name: "Shadow Trap",
      skillLabel: "Umbral Pulse",
      actionKind: "attack_all",
      targetRule: "all_enemies",
      persistent: false,
      stackCap: 3,
    },
    assassin_wake_of_inferno: {
      id: "assassin_wake_of_inferno",
      name: "Wake of Inferno",
      skillLabel: "Inferno Sweep",
      actionKind: "attack_all_burn",
      targetRule: "all_enemies",
      persistent: false,
      stackCap: 3,
    },
    assassin_shadow_master: {
      id: "assassin_shadow_master",
      name: "Shadow Master",
      skillLabel: "Mirrored Ambush",
      actionKind: "attack_mark",
      targetRule: "selected_enemy",
      persistent: true,
    },
    druid_solar_creeper: {
      id: "druid_solar_creeper",
      name: "Solar Creeper",
      skillLabel: "Sunlash Vines",
      actionKind: "attack_all_burn",
      targetRule: "all_enemies",
      persistent: true,
    },
    druid_spirit_of_barbs: {
      id: "druid_spirit_of_barbs",
      name: "Spirit of Barbs",
      skillLabel: "Barbed Howl",
      actionKind: "buff_mercenary_guard_party",
      targetRule: "all_enemies",
      persistent: true,
    },
    necromancer_iron_golem: {
      id: "necromancer_iron_golem",
      name: "Iron Golem",
      skillLabel: "Iron Bulwark",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      persistent: true,
      stackGroup: "necro_golem",
    },
    necromancer_fire_golem: {
      id: "necromancer_fire_golem",
      name: "Fire Golem",
      skillLabel: "Hellflame Pulse",
      actionKind: "attack_all_burn",
      targetRule: "all_enemies",
      persistent: true,
      stackGroup: "necro_golem",
      stackAbility: "burn",
    },
    druid_carrion_vine: {
      id: "druid_carrion_vine",
      name: "Carrion Vine",
      skillLabel: "Death Bloom",
      actionKind: "heal_party",
      targetRule: "all_enemies",
      persistent: true,
    },
    druid_treant: {
      id: "druid_treant",
      name: "Treant",
      skillLabel: "Root Guard",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      persistent: true,
    },
    sorceress_hydra: {
      id: "sorceress_hydra",
      name: "Hydra",
      skillLabel: "Hydra Breath",
      actionKind: "attack_all_burn",
      targetRule: "all_enemies",
      persistent: true,
    },
  };

  function getActiveMinions(state: CombatState) {
    return Array.isArray(state.minions) ? state.minions : [];
  }

  function getMinionTemplate(templateId: string) {
    return MINION_TEMPLATES[templateId] || null;
  }

  function getMinionDuration(effect: CardEffect, template: MinionTemplateDefinition) {
    if (template.persistent) {
      return 0;
    }
    return Math.max(1, parseInteger(effect.duration, DEFAULT_TEMPORARY_MINION_DURATION));
  }

  function getMinionPrimaryValue(effect: CardEffect) {
    return Math.max(0, parseInteger(effect.value, 0));
  }

  function getMinionSecondaryValue(effect: CardEffect) {
    return Math.max(0, parseInteger(effect.secondaryValue, 0));
  }

  function getMinionReinforcementValue(amount: number) {
    return Math.max(1, Math.ceil(Math.max(1, amount) / 2));
  }

  function getMinionStackCount(minion: CombatMinionState | null | undefined) {
    return Math.max(1, parseInteger((minion as { stackCount?: number } | null | undefined)?.stackCount, 1));
  }

  function getMinionArtTier(minion: CombatMinionState | null | undefined, maxTier = 5) {
    const tierCap = Math.max(1, Number(maxTier) || 5);
    return Math.min(tierCap, getMinionStackCount(minion));
  }

  function buildMinionActionSummary(actionKind: CombatMinionActionKind, power: number, secondaryValue: number) {
    if (actionKind === "attack") {
      return `${power} strike/phase`;
    }
    if (actionKind === "attack_all") {
      return `${power} line strike`;
    }
    if (actionKind === "attack_mark") {
      return `${power} strike + Mark ${secondaryValue}`;
    }
    if (actionKind === "attack_poison") {
      return `${power} strike + Poison ${secondaryValue}`;
    }
    if (actionKind === "attack_guard_party") {
      return `${power} strike + Guard ${secondaryValue}`;
    }
    if (actionKind === "attack_heal_hero") {
      return `${power} strike + Heal ${secondaryValue}`;
    }
    if (actionKind === "heal_party") {
      return `Heal party ${power}`;
    }
    if (actionKind === "buff_mercenary_guard_party") {
      return `Merc +${power} + Guard ${secondaryValue}`;
    }
    if (actionKind === "attack_all_burn") {
      return `${power} line + Burn ${secondaryValue}`;
    }
    if (actionKind === "attack_all_paralyze") {
      return `${power} line + Paralyze ${secondaryValue}`;
    }
    return `${power} skill`;
  }

  function getMinionSkillSummary(minion: CombatMinionState) {
    return buildMinionActionSummary(minion.actionKind, minion.power, minion.secondaryValue);
  }

  function getSummonPreview(state: CombatState | null, effect: CardEffect) {
    const template = getMinionTemplate(String(effect.minionId || ""));
    if (!template) {
      return "Summon";
    }
    const power = getMinionPrimaryValue(effect);
    const secondaryValue = getMinionSecondaryValue(effect);
    const existing = state ? getActiveMinions(state).find((minion) => {
      if (minion.templateId === template.id) {
        return true;
      }
      if (!template.stackGroup) {
        return false;
      }
      const minionTemplate = getMinionTemplate(minion.templateId);
      return Boolean(minionTemplate && minionTemplate.stackGroup === template.stackGroup);
    }) : null;
    const stackCap = Math.max(0, parseInteger((template as { stackCap?: number }).stackCap, 0));
    const currentStackCount = existing ? getMinionStackCount(existing) : 0;
    const nextStackCount = existing
      ? (stackCap > 0 ? Math.min(stackCap, currentStackCount + 1) : currentStackCount + 1)
      : 1;
    const isTrap = isTrapTemplate(template);
    const isSupport = isSupportTemplate(template);
    const isDevice = isDeviceTemplate(template);
    const activeMinions = state ? getActiveMinions(state) : [];
    const relevantCount = isDevice
      ? activeMinions.filter((m) => (m as { invulnerable?: boolean }).invulnerable).length
      : activeMinions.filter((m) => !(m as { invulnerable?: boolean }).invulnerable).length;
    const relevantCap = isDevice ? MAX_ACTIVE_TRAPS : MAX_ACTIVE_CREATURES;
    const hasOpenSlot = !state || existing || relevantCount < relevantCap;
    const lead = existing && stackCap > 0 && currentStackCount >= stackCap
      ? `Refresh ${template.name}`
      : existing ? `Reinforce ${template.name}` : `Summon ${template.name}`;
    const stackSegment = stackCap > 0 ? ` · Stack ${nextStackCount}/${stackCap}` : "";
    const durationSegment = template.persistent ? "Persistent" : `${getMinionDuration(effect, template)} turns`;
    const actionSegment = buildMinionActionSummary(template.actionKind, power, secondaryValue);
    if (!hasOpenSlot) {
      return `${lead}${stackSegment} · limit ${relevantCap}/${relevantCap}`;
    }
    return `${lead}${stackSegment} · ${actionSegment}${durationSegment ? ` · ${durationSegment}` : ""}`;
  }

  runtimeWindow.__ROUGE_COMBAT_MINIONS = {
    MAX_ACTIVE_MINIONS,
    MAX_ACTIVE_CREATURES,
    MAX_ACTIVE_TRAPS,
    getActiveMinions,
    getMinionTemplate,
    getMinionDuration,
    getMinionPrimaryValue,
    getMinionSecondaryValue,
    getMinionReinforcementValue,
    getMinionStackCount,
    getMinionArtTier,
    buildMinionActionSummary,
    getMinionSkillSummary,
    getSummonPreview,
  };
})();
