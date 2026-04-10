(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Modifier part descriptors for getExactSkillModifierPreviewParts ────────
  // Each entry maps a skillId to an array of modifier descriptors.
  // At runtime, each descriptor is rendered with the skill's tier scale.

  type ModPart =
    | { mod: "damage" | "guard" | "burn" | "poison" | "freeze" | "slow" | "paralyze" | "ignoreGuard"; offset: number }
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
    ignoreGuard: "ignore {V} guard",
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
    amazon_avoid: [{ mod: "guard", offset: 0 }, { mod: "damage", offset: 1 }],
    amazon_evade: [{ mod: "guard", offset: 1 }, { mod: "draw" }],
    amazon_penetrate: [{ mod: "damage", offset: 1 }, { mod: "ignoreGuard", offset: 2 }],
    sorceress_warmth: [{ mod: "cost" }, { mod: "burn", offset: 0 }],
    sorceress_fire_mastery: [{ mod: "burn", offset: 2 }, { mod: "damage", offset: 0 }],
    sorceress_cold_mastery: [{ mod: "freeze", offset: 1 }, { mod: "slow", offset: 1 }],
    sorceress_lightning_mastery: [{ mod: "paralyze", offset: 1 }, { mod: "damage", offset: 0 }],
    amazon_pierce: [{ mod: "cost" }, { mod: "damage", offset: 2 }],
    assassin_claw_mastery: [{ mod: "cost" }, { mod: "damage", offset: 0 }],
    assassin_weapon_block: [{ mod: "guard", offset: 1 }, { mod: "damage", offset: 0 }],
    druid_lycanthropy: [{ mod: "damage", offset: 1 }],
    druid_primal_attunement: [{ mod: "damage", offset: 1 }],
    barbarian_increased_speed: [{ mod: "cost" }, { mod: "draw" }, { mod: "damage", offset: 0 }],
    barbarian_increased_stamina: [{ mod: "guard", offset: 0 }, { mod: "draw" }],
    barbarian_iron_skin: [{ mod: "guard", offset: 1 }],
    barbarian_natural_resistance: [{ mod: "guard", offset: 1 }],
    necromancer_skeleton_mastery: [{ mod: "guard", offset: 0 }],
    necromancer_golem_mastery: [{ mod: "guard", offset: 0 }],
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
    amazon_avoid: [{ target: "hero", stat: "Guard", offset: 0, base: 4 }],
    amazon_evade: [
      { target: "hero", stat: "Guard", offset: 0, base: 4 },
      { target: "mercenary", stat: "Guard", offset: 0, base: 3 },
    ],
    amazon_penetrate: [{ target: "hero", stat: "Damage", offset: 1, base: 0 }],
    amazon_pierce: [{ target: "hero", stat: "Damage", offset: 2, base: 0 }],
    assassin_claw_mastery: [{ target: "hero", stat: "Damage", offset: 1, base: 0 }],
    assassin_weapon_block: [{ target: "hero", stat: "Guard", offset: 0, base: 4 }],
    druid_lycanthropy: [
      { target: "hero", stat: "Damage", offset: 1, base: 0 },
      { target: "hero", stat: "Guard", offset: 0, base: 2 },
    ],
    barbarian_increased_stamina: [{ target: "hero", stat: "Guard", offset: 0, base: 3 }],
    barbarian_iron_skin: [{ target: "hero", stat: "Guard", offset: 0, base: 5 }],
    barbarian_natural_resistance: [
      { target: "hero", stat: "Guard", offset: 0, base: 4 },
      { target: "hero", stat: "Heal", offset: 0, base: 1 },
      { target: "mercenary", stat: "Guard", offset: 0, base: 3 },
    ],
    necromancer_skeleton_mastery: [
      { target: "deck", stat: "Summon power", offset: 1, base: 0 },
      { target: "deck", stat: "Summon riders", offset: 0, base: 1 },
    ],
    necromancer_golem_mastery: [
      { target: "deck", stat: "Summon power", offset: 0, base: 2 },
      { target: "deck", stat: "Summon riders", offset: 0, base: 0 },
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
    if (["Damage", "Burn", "Summon power", "Summon riders"].includes(part.stat)) { return `${part.stat} +${value}`; }
    return `${part.stat} ${value}`;
  }

  function getStaticActiveSkillPreview(skillId: string, combat: CombatState): string | null {
    switch (skillId) {
      case "amazon_serrated_volley": return "Next 2 ranged cards +3 + Slow 2 on same enemy";
      case "amazon_pinning_fire": return "6 dmg + If target is attacking, next attack -6 + Slow 1";
      case "amazon_kill_zone": return "Next 3 ranged hits vs target +6 + Merc +6 vs target + next attack -8";
      case "amazon_spear_break": return "7 dmg + If target is attacking, next attack -6 + Merc +4 vs target";
      case "amazon_storm_step": return "Guard 5 + Next Attack +5";
      case "amazon_storm_spear": return "10 dmg line + Next Attack +8";
      case "amazon_evasive_step": return "Guard 7 + Next enemy attack -6";
      case "amazon_hunters_focus": return "Next single-target hit vs target Draw 1 + Merc Draw 1 vs target";
      case "amazon_predators_calm": return "Guard 10 + Next 3 damaging cards +5 + Draw 1 on single-target hit";
      case "assassin_marked_opening": return "Next Attack vs target +5 + Merc +5 vs target";
      case "assassin_flash_step": return "Guard 7 + Next Assassin damage card cost -1";
      case "assassin_death_blossom": return "Next 2 Assassin damage cards +8 cost -1 + Energy next turn 1 on same-enemy combo";
      case "assassin_execution_window": return "Next 2 Assassin damage cards +6 vs statused enemies";
      case "assassin_veil_step": return "Guard 6 + Next shadow card cost -1 + Draw 1";
      case "assassin_living_shade": return "Guard 6 + Assassin damage cards +5 vs statused enemies this turn";
      case "assassin_prepared_ground": return "Next Trap/field card +5 + Slow 1";
      case "assassin_wire_snare": return "Slow 1 line + Next enemy attack -6";
      case "assassin_night_maze": return "Slow 1 line + Next trap/shadow setup triggers twice";
      case "paladin_sacrifice": return "15 dmg + Lose 3 Life";
      case "paladin_smite": return "6 dmg + ignore 3 guard + Stun 1";
      case "paladin_holy_bolt": return "8 magic dmg + Heal party 3";
      case "paladin_charge": return "12 dmg + Next Attack +3";
      case "paladin_zeal": return "12 dmg split";
      case "paladin_blessed_hammer": return "9 magic dmg line";
      case "paladin_vengeance": return "13 elemental dmg + Burn 3 + Slow 1 + Paralyze 1";
      case "paladin_conversion": return "10 dmg + Heal 5 + Guard 8 + 5 more if attacking";
      case "paladin_holy_shield": return "Guard 18 party + 8 magic dmg line + Draw 2";
      case "paladin_prayer": return "Heal party 5 + Guard 4 + Draw 1";
      case "paladin_resist_fire": return "Guard 10 + Next enemy attack -3 + Draw 1";
      case "paladin_defiance": return "Guard 12 party + Draw 1";
      case "paladin_resist_cold": return "Guard 12 + Next enemy attack -5 + Draw 1";
      case "paladin_cleansing": return "Cleanse 1 debuff + Heal 5 + Guard 6 + Draw 1";
      case "paladin_resist_lightning": return "Guard 10 + Next enemy attack -4 + Draw 1";
      case "paladin_vigor": return "Guard 4 + Draw 1 + Next card cost -1";
      case "paladin_might": return "6 dmg + Slow 1 + Merc +8 + Draw 1";
      case "paladin_holy_fire": return "9 fire dmg + Burn 4 + Merc +6 + Draw 1";
      case "paladin_thorns": return "5 dmg + Burn 2 + Next enemy attack -2";
      case "paladin_blessed_aim": return "Guard 6 + Draw 1 + Next 2 Attacks +4";
      case "paladin_concentration": return "Guard 6 + Draw 1 + Next Aura/Attack +5";
      case "paladin_holy_freeze": return "8 cold dmg line + Freeze 1 line + Merc +6";
      case "paladin_zealous_chorus": return "Guard 5 + Damaging cards +3 this turn + Merc +3";
      case "paladin_crusaders_step": return "Next Attack +6 + Guard 6 if target is attacking";
      case "paladin_judgment_march": return "Merc +5 + Next 2 Attack/Aura cards +4 damage/guard";
      case "paladin_aegis_prayer": return "Cleanse 1 debuff + Guard 8 + Next enemy attack -5";
      case "paladin_shield_of_grace": return "Heal 4 + Guard 5 party";
      case "paladin_bulwark_of_faith": return "Cleanse 1 debuff + Guard 12 party + Next enemy attack -10";
      case "paladin_righteous_verdict": return "Next 2 hits vs target +4 + next attack -5 on hit";
      case "paladin_aura_surge": return "Draw 1 + Next Aura/Attack +5 damage/guard";
      case "paladin_fanatic_decree": return "Attack/Aura cards +5 this turn + Next 2 enemies hit deal 6 less";
      case "barbarian_bash": return "14 dmg";
      case "barbarian_double_swing": return "11 dmg split";
      case "barbarian_leap": return "8 dmg + Guard 6";
      case "barbarian_double_throw": return "7 dmg + 7 dmg another enemy";
      case "barbarian_stun": return "10 dmg + Stun 1";
      case "barbarian_concentrate": return "14 dmg + Heal 4 + Guard 12";
      case "barbarian_leap_attack": return "9 dmg line";
      case "barbarian_frenzy": return "19 dmg split + Draw 1";
      case "barbarian_berserk": return "28 magic dmg";
      case "barbarian_find_potion": return "Heal 5 + Guard 4 + Draw 1";
      case "barbarian_howl": return "Slow 1 line + Guard 5 + Draw 1";
      case "barbarian_shout": return "Slow 1 line + Guard 10 party + Draw 1";
      case "barbarian_taunt": return "Next Attack vs target +6 + Merc +6 + Draw 1";
      case "barbarian_find_item": return "Heal 6 + Guard 6 + Draw 2";
      case "barbarian_battle_cry": return "Enemies -3 next turn + Guard 5 + Draw 1 + Next Attack +4";
      case "barbarian_battle_orders": return "Heal 6 + Slow 1 line + Guard 22 party + Merc +16 + Draw 1";
      case "barbarian_bar_double_swing": return "10 dmg";
      case "barbarian_bar_leap": return "Guard 8 + Next Attack +5";
      case "barbarian_relentless_assault": return "10 dmg + Next 2 Attacks +6 + Guard 6 on same-enemy combo";
      case "barbarian_iron_discipline": return "Guard 7 + Next 2 Attacks ignore 3 Guard";
      case "barbarian_measured_blow": return "8 dmg + 4 more if you gained Guard this turn";
      case "barbarian_perfect_form": return "Guard 8 + Attacks cost -1 +4 dmg + ignore 5 this turn";
      case "barbarian_bar_howl": return "Non-boss enemies -4 next turn";
      case "barbarian_bar_battle_cry": return "Next Attack vs target +5 + next attack -6 + Merc +5 vs target";
      case "barbarian_warlords_command": return "Damaging cards +5 this turn + Merc +5 + Enemies -4 next turn + Draw 1";
      case "sorceress_frozen_armor": return "Guard 8 + next attacker Freeze 1 + Slow 1";
      case "sorceress_ice_bolt": return "6 cold dmg + Slow 2";
      case "sorceress_crippling_frost": return "Next Spell + Slow 1 + Freeze 1";
      case "sorceress_bar_frozen_armor": return "Guard 10 + next attacker Freeze 1 + Slow 1";
      case "sorceress_ice_blast": return "12 cold dmg + Freeze 1 + Slow 2 + 6 more vs Slowed";
      case "sorceress_absolute_zero": return "Guard 10 + Slow 1 line + Freeze 1 line + Next Spell Draw 1";
      case "sorceress_shiver_armor": return "Guard 10 + Draw 1 + next attacker Freeze 1 + Slow 2";
      case "sorceress_glacial_spike": return "9 cold dmg + 4 cold dmg line + Freeze 1 line + Slow 1 line";
      case "sorceress_fire_bolt": return "8 fire dmg + Burn 2";
      case "sorceress_bar_fire_ball": return "13 fire dmg + Burn 2";
      case "sorceress_kindle": return "Energy next turn 1 + Next Spell +6";
      case "sorceress_blaze": return "4 fire dmg line + Burn 3 line + Next card Burn 1";
      case "sorceress_fireball": return "10 fire dmg + Burn 2 line";
      case "sorceress_meteor_rain": return "9 fire dmg line + Burn 2 line + Next Spell +8";
      case "sorceress_enchant": return "Guard 4 + Merc +6 + Next 2 damage cards +4 + Burn 1";
      case "sorceress_charged_bolt": return "9 lightning dmg random split";
      case "sorceress_bar_charged_bolt": return "12 lightning dmg random split";
      case "sorceress_static_flow": return "Energy 1 now + Next Spell Draw 1 if it hits multiple enemies";
      case "sorceress_telekinesis": return "4 magic dmg + next enemy attack -5 + Draw 1";
      case "sorceress_nova": return "5 lightning dmg line + Paralyze 1 line + Draw 1 if you played a Spell earlier";
      case "sorceress_storm_rhythm": return "Energy 1 now + Next 3 Spells +4 + Draw 1 on multi-hit";
      case "sorceress_lightning": return "14 lightning dmg + Paralyze 2 + Draw 1";
      case "sorceress_chain_lightning": return "8 lightning dmg + 4 lightning dmg to up to 2 others + Paralyze 1 on hit + Draw 1 if it chains";
      case "sorceress_teleport": return "Guard 8 party + Draw 1 + Next Spell cost -1";
      case "necromancer_amplify_damage": return "2 magic dmg + Merc +8 + Next 2 attacks vs target +4 + Draw 1";
      case "necromancer_dim_vision": return "next enemy attack -5 + Slow 1 + Guard 6";
      case "necromancer_weaken": return "Enemies -3 next turn + Guard 5 + Draw 1";
      case "necromancer_iron_maiden": return "5 magic dmg + Merc +8 + next enemy attack -2";
      case "necromancer_terror": return "Non-boss enemies -4 next turn + Guard 7 + Draw 1";
      case "necromancer_confuse": return "Confuse target + Guard 6 + Draw 1";
      case "necromancer_life_tap": return "Heal 6 + Guard 5 + Draw 1";
      case "necromancer_attract": return "Slow 1 + Guard 5 + Merc +4 vs target + Summons +4 vs target";
      case "necromancer_bone_armor": return "Guard 12 + next enemy attack -4 vs you + Draw 1";
      case "necromancer_teeth": return "9 magic dmg random split";
      case "necromancer_poison_dagger": return "6 poison dmg + Poison 4 + Draw 1";
      case "necromancer_bone_wall": return "4 magic dmg + next enemy attack -5 + Guard 6";
      case "necromancer_poison_explosion": return "4 poison dmg line + Poison 3 line";
      case "necromancer_bone_spear": return "10 magic dmg + 4 magic dmg line + 6 more vs Poisoned";
      case "necromancer_bone_spirit": return "18 magic dmg + ignore 4 guard + Draw 1";
      case "necromancer_grave_mend": return "Heal 5 + active summon +2 power +1 turn";
      case "necromancer_hex_pulse": return "Next curse/control +1 extra status + Draw 1";
      case "necromancer_black_benediction": return "Enemies -4 next turn + Next 2 curse/control cards +4 or +1 status + Draw 1";
      case "necromancer_unholy_order": return "Merc +4 vs target + Summons +4 vs target";
      case "necromancer_bone_ward": return "Guard 7 + Draw 1 if an enemy dies this turn";
      case "necromancer_grave_rupture": return "12 magic dmg + 8 magic dmg line + Poison 2 line if an enemy died this turn";
      case "necromancer_corpse_pact": return "9 magic dmg line + Heal 4 if an enemy or summon died this turn";
      case "necromancer_mass_reassembly": return combat.minions.length > 0 ? "All summons +1 power" : "Summon Skeleton";
      case "necromancer_army_of_dust": return combat.minions.length > 0 ? "All summons +2 power" : "Summon 2 Skeletons";
      case "druid_arctic_blast": return "6 cold dmg line + Slow 1 line + Next card Slow 1";
      case "druid_firestorm": return "3 fire dmg line + Burn 2 line + Next card Burn 1";
      case "druid_molten_boulder": return "11 fire dmg + Burn 3 + next enemy attack -4";
      case "druid_tempest_channel": return "Next 2 elemental cards +1 Burn or +1 Slow";
      case "druid_arc_root": return "Guard 6 + Next elemental damage card +5";
      case "druid_cataclysm": return "8 dmg line + Next 2 elemental cards +4 + Burn 2 + Slow 2";
      case "druid_cyclone_armor": return "Guard 8 + Draw 1 + next enemy attack -4";
      case "druid_fissure": return "6 fire dmg line + Burn 2 line + Next card Burn 1";
      case "druid_twister": return "5 dmg line + Slow 1 line + Draw 1 + Next card Slow 1";
      case "druid_tornado": return "12 dmg line + 4 more vs Slowed + Next card +1 damage";
      case "druid_werewolf": return "11 dmg + Heal 5";
      case "druid_predatory_lunge": return "Next Shapeshift/melee +6 + Draw 1 vs Slowed";
      case "druid_stonebark": return "Guard 6 party + next attacker Slow 1";
      case "druid_werebear": return "9 dmg + Slow 1 + Guard 6 party + Draw 1";
      case "druid_elder_shape": return "Guard 10 + Next 2 Shapeshift/melee +6 + Slow 1";
      case "druid_feral_rage": return "8 dmg + Heal 4 + Next Shapeshift/melee +3";
      case "druid_maul": return "16 dmg + Stun 1 + Guard 6";
      case "druid_fire_claws": return "9 fire dmg + Burn 3 + Guard 5";
      case "druid_rabies": return "7 poison dmg + Poison 5 + Poison 5 others";
      case "druid_hunger": return "18 dmg + Heal 10 + 6 more vs Slowed";
      case "druid_fury": return "33 dmg split + Slow 1 + Draw 1";
      default: return null;
    }
  }

  runtimeWindow.__ROUGE_SKILL_PREVIEW_DATA = {
    SKILL_MODIFIER_MAP,
    SKILL_PASSIVE_MAP,
    getStaticActiveSkillPreview,
    renderModPart,
    renderPassivePart,
  };
})();
