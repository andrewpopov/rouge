(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Modifier part descriptors for getExactSkillModifierPreviewParts ────────
  // Each entry maps a skillId to an array of modifier descriptors.
  // At runtime, each descriptor is rendered with the skill's tier scale.

  type ModPart =
    | { mod: "damage" | "guard" | "burn" | "poison" | "freeze" | "slow" | "paralyze"; offset: number }
    | { mod: "cost" }
    | { mod: "draw" };

  const MOD_LABELS: Record<string, string> = {
    damage: "+{V} damage",
    guard: "Guard {V}",
    burn: "Burn {V}",
    poison: "Poison {V}",
    freeze: "Freeze {V}",
    slow: "Slow {V}",
    paralyze: "Paralyze {V}",
  };

  function renderModPart(part: ModPart, scale: number): string {
    if (part.mod === "cost") { return "Next card cost -1"; }
    if (part.mod === "draw") { return "Next card Draw 1"; }
    const value = scale + part.offset;
    return `Next card ${MOD_LABELS[part.mod].replace("{V}", String(value))}`;
  }

  // Skill modifier data: skillId → parts array
  const SKILL_MODIFIER_MAP: Record<string, ModPart[]> = {
    amazon_call_the_shot: [{ mod: "damage", offset: 1 }],
    assassin_shadow_feint: [{ mod: "cost" }, { mod: "damage", offset: 1 }, { mod: "guard", offset: 1 }],
    amazon_critical_strike: [{ mod: "damage", offset: 1 }],
    amazon_dodge: [{ mod: "guard", offset: 1 }, { mod: "cost" }],
    amazon_evade: [{ mod: "guard", offset: 1 }, { mod: "draw" }],
    sorceress_warmth: [{ mod: "cost" }, { mod: "burn", offset: 0 }],
    sorceress_fire_mastery: [{ mod: "burn", offset: 2 }, { mod: "damage", offset: 0 }],
    sorceress_cold_mastery: [{ mod: "freeze", offset: 1 }, { mod: "slow", offset: 1 }],
    sorceress_lightning_mastery: [{ mod: "paralyze", offset: 1 }, { mod: "damage", offset: 0 }],
    amazon_pierce: [{ mod: "cost" }, { mod: "damage", offset: 2 }],
    assassin_claw_mastery: [{ mod: "cost" }, { mod: "damage", offset: 0 }],
    druid_lycanthropy: [{ mod: "damage", offset: 1 }],
    druid_primal_attunement: [{ mod: "damage", offset: 1 }],
    barbarian_increased_speed: [{ mod: "cost" }, { mod: "draw" }, { mod: "damage", offset: 0 }],
    barbarian_natural_resistance: [{ mod: "guard", offset: 1 }],
    necromancer_skeleton_mastery: [{ mod: "guard", offset: 0 }],
    necromancer_summon_resist: [{ mod: "guard", offset: 1 }],
    amazon_decoy: [{ mod: "guard", offset: 0 }],
    amazon_lightning_fury: [{ mod: "paralyze", offset: 1 }],
    amazon_lightning_strike: [{ mod: "damage", offset: 1 }],
    amazon_freezing_arrow: [{ mod: "freeze", offset: 1 }],
    assassin_shadow_master: [{ mod: "cost" }],
    assassin_wake_of_inferno: [{ mod: "burn", offset: 0 }],
    assassin_phoenix_strike: [{ mod: "burn", offset: 2 }, { mod: "damage", offset: 0 }],
    barbarian_whirlwind: [{ mod: "damage", offset: 0 }],
    barbarian_grim_ward: [{ mod: "damage", offset: 0 }],
    barbarian_war_cry: [{ mod: "damage", offset: 0 }],
    barbarian_battle_command: [{ mod: "cost" }, { mod: "damage", offset: 1 }],
    druid_shock_wave: [{ mod: "guard", offset: 0 }],
    druid_volcano: [{ mod: "burn", offset: 1 }],
    druid_armageddon: [{ mod: "burn", offset: 2 }],
    druid_hurricane: [{ mod: "freeze", offset: 1 }],
    necromancer_decrepify: [{ mod: "cost" }],
    necromancer_lower_resist: [{ mod: "damage", offset: 2 }],
    necromancer_bone_prison: [{ mod: "guard", offset: 1 }],
    necromancer_poison_nova: [{ mod: "poison", offset: 2 }],
    necromancer_fire_golem: [{ mod: "burn", offset: 1 }],
    paladin_meditation: [{ mod: "cost" }],
    paladin_sanctify: [{ mod: "damage", offset: 1 }, { mod: "guard", offset: 1 }],
    paladin_redemption: [{ mod: "guard", offset: 1 }],
    paladin_salvation: [{ mod: "guard", offset: 1 }],
    paladin_sanctuary: [{ mod: "guard", offset: 0 }],
    paladin_conviction: [{ mod: "damage", offset: 2 }],
    paladin_fanaticism: [{ mod: "cost" }, { mod: "damage", offset: 2 }],
    paladin_holy_shock: [{ mod: "paralyze", offset: 1 }],
    paladin_fist_of_the_heavens: [{ mod: "paralyze", offset: 1 }],
    sorceress_blizzard: [{ mod: "freeze", offset: 1 }],
    sorceress_core_fire_bolt: [{ mod: "cost" }],
    sorceress_frozen_orb: [{ mod: "freeze", offset: 1 }, { mod: "damage", offset: 0 }],
    sorceress_meteor: [{ mod: "burn", offset: 2 }],
    sorceress_hydra: [{ mod: "burn", offset: 1 }],
    sorceress_chilling_armor: [{ mod: "guard", offset: 1 }, { mod: "freeze", offset: 1 }],
    sorceress_energy_shield: [{ mod: "guard", offset: 2 }],
    sorceress_thunder_storm: [{ mod: "paralyze", offset: 2 }, { mod: "damage", offset: 0 }],
  };

  // ── Passive skill opening preview data ────────────────────────────────────
  // Each entry describes what a passive skill contributes to hero/merc/deck on activation.

  type PassivePart =
    | { target: "hero" | "deck"; stat: string; offset: number; base?: number }
    | { target: "mercenary"; stat: string; offset: number; base?: number };

  const SKILL_PASSIVE_MAP: Record<string, PassivePart[]> = {
    amazon_critical_strike: [{ target: "hero", stat: "Damage", offset: 1, base: 0 }],
    amazon_dodge: [
      { target: "hero", stat: "Guard", offset: 0, base: 3 },
      { target: "mercenary", stat: "Guard", offset: 0, base: 2 },
    ],
    amazon_evade: [
      { target: "hero", stat: "Guard", offset: 0, base: 4 },
      { target: "mercenary", stat: "Guard", offset: 0, base: 3 },
    ],
    amazon_pierce: [{ target: "hero", stat: "Damage", offset: 2, base: 0 }],
    assassin_claw_mastery: [{ target: "hero", stat: "Damage", offset: 1, base: 0 }],
    druid_lycanthropy: [
      { target: "hero", stat: "Damage", offset: 1, base: 0 },
      { target: "hero", stat: "Guard", offset: 0, base: 2 },
    ],
    barbarian_natural_resistance: [
      { target: "hero", stat: "Guard", offset: 0, base: 4 },
      { target: "hero", stat: "Heal", offset: 0, base: 1 },
      { target: "mercenary", stat: "Guard", offset: 0, base: 3 },
    ],
    necromancer_skeleton_mastery: [
      { target: "deck", stat: "Summon power", offset: 1, base: 0 },
      { target: "deck", stat: "Summon riders", offset: 0, base: 1 },
    ],
    necromancer_summon_resist: [
      { target: "hero", stat: "Guard", offset: 0, base: 3 },
      { target: "mercenary", stat: "Guard", offset: 0, base: 2 },
      { target: "deck", stat: "Summon power", offset: 1, base: 0 },
      { target: "deck", stat: "Summon riders", offset: 0, base: 0 },
    ],
    sorceress_warmth: [
      { target: "hero", stat: "Heal", offset: 0, base: 2 },
      { target: "hero", stat: "Burn", offset: 1, base: 0 },
    ],
    sorceress_cold_mastery: [{ target: "hero", stat: "Damage", offset: 1, base: 0 }],
    sorceress_fire_mastery: [{ target: "hero", stat: "Burn", offset: 2, base: 0 }],
    sorceress_lightning_mastery: [{ target: "hero", stat: "Damage", offset: 1, base: 0 }],
  };

  function renderPassivePart(part: PassivePart, scale: number): string {
    const value = (part.base || 0) + scale + part.offset;
    if (part.stat === "Damage") { return `Damage +${value}`; }
    return `${part.stat} ${value}`;
  }

  runtimeWindow.__ROUGE_SKILL_PREVIEW_DATA = {
    SKILL_MODIFIER_MAP,
    SKILL_PASSIVE_MAP,
    renderModPart,
    renderPassivePart,
  };
})();
