(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getSkillTierScale(skill: CombatEquippedSkillState): number {
    if (skill.slot === 3 || skill.tier === "capstone") { return 3; }
    if (skill.slot === 2 || skill.tier === "bridge") { return 2; }
    return 1;
  }

  function createSkillSummonEffect(combat: CombatState, skill: CombatEquippedSkillState): CardEffect | null {
    if (skill.skillType !== "summon") { return null; }
    const scale = getSkillTierScale(skill);
    const powerBonus = Math.max(0, combat.summonPowerBonus || 0);
    const secondaryBonus = Math.max(0, combat.summonSecondaryBonus || 0);
    const build = (minionId: string, value: number, secondaryValue = 0, duration = 3): CardEffect => ({
      kind: "summon_minion",
      minionId,
      value: Math.max(1, value + powerBonus),
      secondaryValue: Math.max(0, secondaryValue + secondaryBonus),
      duration,
    });
    switch (skill.skillId) {
      case "amazon_decoy": return build("amazon_decoy", 2 + scale, 2 + scale);
      case "amazon_valkyrie": return build("amazon_valkyrie", 3 + scale, 2 + scale);
      case "assassin_shadow_master": return build("assassin_shadow_master", 3 + scale, 1 + scale);
      case "assassin_lightning_sentry": return build("assassin_lightning_sentry", 2 + scale, 1 + scale, 4);
      case "assassin_wake_of_inferno": return build("assassin_wake_of_fire", 2 + scale, 1 + scale, 4);
      case "assassin_death_sentry": return build("assassin_death_sentry", 3 + scale, 1 + scale, 4);
      case "druid_raven": return build("druid_raven", 2 + scale, 1 + scale);
      case "druid_poison_creeper": return build("druid_poison_creeper", 2 + scale, 1 + scale);
      case "druid_oak_sage": return build("druid_oak_sage", 2 + scale);
      case "druid_solar_creeper": return build("druid_solar_creeper", 2 + scale, 1 + scale);
      case "druid_spirit_of_barbs": return build("druid_spirit_of_barbs", 2 + scale, 2 + scale);
      case "druid_summon_grizzly": return build("druid_grizzly", 3 + scale, 2 + scale);
      case "necromancer_raise_skeleton": return build("necromancer_skeleton", 2 + scale);
      case "necromancer_clay_golem": return build("necromancer_clay_golem", 2 + scale, 1 + scale);
      case "necromancer_iron_golem": return build("necromancer_iron_golem", 3 + scale, 2 + scale);
      case "necromancer_fire_golem": return build("necromancer_fire_golem", 3 + scale, 2 + scale);
      case "necromancer_revive": return build("necromancer_revive", 3 + scale, 2 + scale);
      case "sorceress_hydra": return build("sorceress_hydra", 3 + scale, 2 + scale);
      default: return null;
    }
  }

  function buildSkillPreviewOutcome(
    combat: CombatState,
    skill: CombatEquippedSkillState,
    _selectedEnemy: CombatEnemyState | null
  ): string {
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const summonEffect = createSkillSummonEffect(combat, skill);
    if (summonEffect) {
      return turns?.getSummonPreview?.(combat, summonEffect) || "Summon";
    }

    const scale = getSkillTierScale(skill);
    if (!skill.active) {
      switch (skill.skillId) {
        case "sorceress_warmth":
          return `Heal ${2 + scale} + Burn +${scale + 1} + Next card cost -1`;
        case "sorceress_fire_mastery":
          return `Burn +${scale + 2} + Next card Burn ${scale + 2}`;
        case "sorceress_cold_mastery":
          return `Next card Freeze ${scale + 1} + Slow ${scale + 1}`;
        case "sorceress_lightning_mastery":
          return `Next card Paralyze ${scale + 1} + Damage +${scale}`;
        case "necromancer_skeleton_mastery":
        case "necromancer_summon_resist":
          return `Summons +${scale + 1} power + Guard prep`;
        case "amazon_evade":
          return `Guard ${4 + scale} party + Draw 1`;
        case "amazon_pierce":
          return `Damage +${scale + 2} + Next card cost -1`;
        case "barbarian_natural_resistance":
          return `Guard ${4 + scale} party + Heal ${1 + scale}`;
        default:
          return skill.summary || "Opening passive";
      }
    }

    switch (skill.skillId) {
      case "amazon_strafe":
        return `${(2 + scale) * Math.max(1, combat.enemies.filter((enemy) => enemy.alive).length)} dmg line + Draw 1`;
      case "amazon_lightning_fury":
        return `${3 + scale} dmg line + Paralyze ${scale + 1} line`;
      case "amazon_lightning_strike":
        return `${6 + scale} dmg + Paralyze ${scale + 2} + arc ${2 + scale} + Paralyze ${scale}`;
      case "amazon_freezing_arrow":
        return `${4 + scale} dmg + Freeze ${scale + 1} line + Slow ${scale + 1} line`;
      case "assassin_phoenix_strike":
        return `${5 + scale} dmg + Burn ${scale + 1} line + Next card Burn ${scale + 2}`;
      case "assassin_shock_web":
        return `Slow ${scale + 1} line + Paralyze ${scale} line`;
      case "barbarian_whirlwind":
        return `${3 + scale} dmg line`;
      case "barbarian_war_cry":
        return `${2 + scale} dmg line + Slow ${scale + 1} line + Stun line`;
      case "barbarian_grim_ward":
        return `Slow ${scale + 2} line + Stun line + Guard ${3 + scale} + Next card +${scale} damage`;
      case "barbarian_battle_command":
        return `Draw 1 + Merc +${scale + 3} + Next card +${scale + 1} damage + cost -1`;
      case "druid_shock_wave":
        return `${4 + scale} dmg + Slow ${scale + 1} line + Stun line + Guard ${scale}`;
      case "druid_volcano":
        return `${5 + scale} dmg + Burn ${2 + scale} + Slow ${scale + 1} + Burn ${scale} line`;
      case "druid_armageddon":
        return `${3 + scale} dmg line + Burn ${scale + 2} line`;
      case "druid_hurricane":
        return `${2 + scale} dmg line + Freeze ${scale + 1} line + Slow ${scale + 1} line`;
      case "necromancer_decrepify":
        return `Slow ${scale + 2} line + Freeze ${scale + 1} line + Next card cost -1`;
      case "necromancer_poison_nova":
        return `${1 + scale} dmg line + Poison ${scale + 2} line`;
      case "necromancer_lower_resist":
        return `Burn ${scale} line + Poison ${scale} line + Paralyze ${scale} line + Damage +${scale + 2}`;
      case "necromancer_bone_prison":
        return `Freeze ${scale + 2} + Slow ${scale + 2} + Guard ${4 + scale} + Next card Guard ${scale + 1}`;
      case "paladin_conviction":
        return `Slow ${scale + 1} line + Paralyze ${scale} line + Next card +${scale + 2} damage`;
      case "paladin_fist_of_the_heavens":
        return `${6 + scale} dmg + Paralyze ${scale + 1} line`;
      case "paladin_holy_shock":
        return `${2 + scale} dmg line + Paralyze ${scale + 1} line`;
      case "paladin_meditation":
        return `Heal ${3 + scale} party + Draw 1 + Next card cost -1`;
      case "paladin_redemption":
        return `Heal ${4 + scale} party + Guard ${3 + scale} party + Next card Guard ${scale + 1}`;
      case "paladin_salvation":
        return `Guard ${5 + scale} party + Draw 1 + Next card Guard ${scale + 1}`;
      case "paladin_sanctuary":
        return `${4 + scale} dmg + Slow ${scale + 1} + Guard ${4 + scale} party + Next card Guard ${scale}`;
      case "paladin_fanaticism":
        return `Merc +${scale + 3} + Next card +${scale + 2} damage + cost -1`;
      case "sorceress_blizzard":
        return `${3 + scale} dmg line + Freeze ${scale + 1} line + Slow ${scale + 1} line`;
      case "sorceress_frozen_orb":
        return `${3 + scale} dmg line + Freeze ${scale + 1} line`;
      case "sorceress_meteor":
        return `${6 + scale} dmg + Burn ${3 + scale} + splash fire`;
      case "sorceress_chilling_armor":
        return `Guard ${5 + scale} + Next card Guard ${scale + 1} + Freeze ${scale + 1}`;
      case "sorceress_energy_shield":
        return `Guard ${6 + scale} + Heal ${2 + scale} + Next card Guard ${scale + 2}`;
      case "sorceress_thunder_storm":
        return `Paralyze ${scale + 1} line + Next card Paralyze ${scale + 2} + Damage +${scale}`;
      default:
        break;
    }

    const preview = runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW;
    const scopes = preview.deriveSkillPreviewScopes(skill);
    const parts: string[] = [];
    if (scopes.includes("enemy_line")) {
      if (skill.skillType === "attack" || skill.skillType === "spell") {
        parts.push(`${2 + scale} dmg line`);
      }
      if (skill.damageType === "fire") { parts.push(`Burn ${scale + 1} line`); }
      if (skill.damageType === "cold") { parts.push(`Freeze ${scale + 1} line`); }
      if (skill.damageType === "lightning") { parts.push(`Paralyze ${scale + 1} line`); }
      if (skill.damageType === "poison") { parts.push(`Poison ${scale + 1} line`); }
    }
    if (scopes.includes("selected_enemy")) {
      if (skill.skillType === "attack" || skill.skillType === "spell" || skill.skillType === "debuff") {
        parts.push(`${skill.skillType === "spell" ? 2 + scale * 2 : 3 + scale * 2} dmg`);
      }
      if (skill.damageType === "fire") { parts.push(`Burn ${scale + 1}`); }
      if (skill.damageType === "cold") { parts.push(`Freeze ${scale + 1}`); }
      if (skill.damageType === "lightning") { parts.push(`Paralyze ${scale + 1}`); }
      if (skill.damageType === "poison") { parts.push(`Poison ${scale + 1}`); }
    }
    if (scopes.includes("party")) {
      parts.push(`Guard ${3 + scale} party`);
    } else {
      if (scopes.includes("hero")) { parts.push(`Guard ${3 + scale}`); }
      if (scopes.includes("mercenary")) { parts.push(`Merc +${scale + 2}`); }
    }
    if (skill.family === "trigger_arming" || skill.family === "state" || skill.family === "commitment") {
      if (skill.skillType === "spell" || skill.skillType === "buff" || skill.skillType === "aura") {
        parts.push("Next card cost -1");
      }
      if (skill.damageType !== "none") {
        parts.push(`Next card +${scale} damage`);
      }
    }
    return parts.join(" + ") || skill.summary || "Resolve";
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW_SKILLS = {
    buildSkillPreviewOutcome,
  };
})();
