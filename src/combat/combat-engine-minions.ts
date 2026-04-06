(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { parseInteger } = runtimeWindow.ROUGE_UTILS;

  const MAX_ACTIVE_MINIONS = 3;
  const DEFAULT_TEMPORARY_MINION_DURATION = 3;

  type MinionTemplateDefinition = {
    id: string;
    name: string;
    skillLabel: string;
    actionKind: CombatMinionActionKind;
    targetRule: CombatMinionTargetRule;
    persistent: boolean;
  };

  const MINION_TEMPLATES: Record<string, MinionTemplateDefinition> = {
    necromancer_skeleton: {
      id: "necromancer_skeleton",
      name: "Skeleton",
      skillLabel: "Rusty Slash",
      actionKind: "attack",
      targetRule: "selected_enemy",
      persistent: true,
    },
    necromancer_clay_golem: {
      id: "necromancer_clay_golem",
      name: "Clay Golem",
      skillLabel: "Mud Guard",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      persistent: true,
    },
    necromancer_skeletal_mage: {
      id: "necromancer_skeletal_mage",
      name: "Skeletal Mage",
      skillLabel: "Toxic Bolt",
      actionKind: "attack_poison",
      targetRule: "lowest_life",
      persistent: true,
    },
    necromancer_blood_golem: {
      id: "necromancer_blood_golem",
      name: "Blood Golem",
      skillLabel: "Siphon Maw",
      actionKind: "attack_heal_hero",
      targetRule: "selected_enemy",
      persistent: true,
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
    },
    assassin_lightning_sentry: {
      id: "assassin_lightning_sentry",
      name: "Lightning Sentry",
      skillLabel: "Static Volley",
      actionKind: "attack_all_paralyze",
      targetRule: "all_enemies",
      persistent: false,
    },
    assassin_death_sentry: {
      id: "assassin_death_sentry",
      name: "Death Sentry",
      skillLabel: "Death Pulse",
      actionKind: "attack_all_paralyze",
      targetRule: "all_enemies",
      persistent: false,
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
    },
    necromancer_fire_golem: {
      id: "necromancer_fire_golem",
      name: "Fire Golem",
      skillLabel: "Hellflame Pulse",
      actionKind: "attack_all_burn",
      targetRule: "all_enemies",
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

  function buildMinionActionSummary(actionKind: CombatMinionActionKind, power: number, secondaryValue: number) {
    if (actionKind === "attack") {
      return `${power} strike/phase`;
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
    const existing = state ? getActiveMinions(state).find((minion) => minion.templateId === template.id) : null;
    const hasOpenSlot = !state || existing || getActiveMinions(state).length < MAX_ACTIVE_MINIONS;
    const lead = existing ? `Reinforce ${template.name}` : `Summon ${template.name}`;
    const durationSegment = template.persistent ? "Persistent" : `${getMinionDuration(effect, template)} turns`;
    const actionSegment = buildMinionActionSummary(template.actionKind, power, secondaryValue);
    if (!hasOpenSlot) {
      return `${lead} · limit ${MAX_ACTIVE_MINIONS}/${MAX_ACTIVE_MINIONS}`;
    }
    return `${lead} · ${actionSegment}${durationSegment ? ` · ${durationSegment}` : ""}`;
  }

  runtimeWindow.__ROUGE_COMBAT_MINIONS = {
    MAX_ACTIVE_MINIONS,
    getActiveMinions,
    getMinionTemplate,
    getMinionDuration,
    getMinionPrimaryValue,
    getMinionSecondaryValue,
    getMinionReinforcementValue,
    buildMinionActionSummary,
    getMinionSkillSummary,
    getSummonPreview,
  };
})();
