(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // Skill resolution extracted from combat-engine.ts
  // Handles per-skill-ID active skill logic for summon, area, hybrid, and support skills.

  function getSkillTierScale(skill: CombatEquippedSkillState): number {
    if (skill.slot === 3 || skill.tier === "capstone") { return 3; }
    if (skill.slot === 2 || skill.tier === "bridge") { return 2; }
    return 1;
  }

  function buildSummonEffect(
    state: CombatState,
    skill: CombatEquippedSkillState
  ): CardEffect | null {
    const scale = getSkillTierScale(skill);
    const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    const build = (minionId: string, value: number, secondaryValue = 0, duration = 3): CardEffect =>
      h.createSummonSkillEffect(state, minionId, value, secondaryValue, duration);

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

  function resolveSummonSkill(state: CombatState, skill: CombatEquippedSkillState): boolean {
    const effect = buildSummonEffect(state, skill);
    if (!effect) { return false; }
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    const result = turns.summonMinion(state, effect);
    h.appendLog(state, `${skill.name}: ${result}`);
    turns.checkOutcome(state);
    return true;
  }

  function resolveAreaAttackSkill(
    state: CombatState,
    skill: CombatEquippedSkillState,
    targetEnemy: CombatEnemyState | null
  ): boolean {
    const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const scale = getSkillTierScale(skill);
    const modifiers: Partial<CombatSkillModifierState> = {};
    const segments: string[] = [];

    switch (skill.skillId) {
      case "sorceress_frost_nova": {
        const dmg = 2 + scale * 2;
        h.dealDamageToAllEnemies(state, dmg, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        segments.push(`blasts the line for ${dmg} cold`);
        modifiers.nextCardFreeze = scale + 1;
        modifiers.nextCardSlow = scale + 1;
        break;
      }
      case "sorceress_blizzard": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        segments.push(`rains ice across the line for ${dmg}`);
        modifiers.nextCardFreeze = scale + 1;
        break;
      }
      case "sorceress_frozen_orb": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        segments.push(`shatters across the line for ${dmg}`);
        modifiers.nextCardFreeze = scale;
        break;
      }
      case "sorceress_inferno": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", scale + 1);
        segments.push(`scorches the line for ${dmg}`);
        modifiers.nextCardBurn = scale + 1;
        break;
      }
      case "sorceress_static_field": {
        h.dealDamageToAllEnemies(state, 2 + scale, "lightning" as DamageType);
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push("destabilizes the whole line");
        modifiers.nextCardParalyze = scale + 1;
        break;
      }
      case "sorceress_thunder_storm": {
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push("rattles the line with thunder");
        modifiers.nextCardParalyze = scale + 2;
        modifiers.nextCardDamageBonus = scale;
        break;
      }
      case "sorceress_meteor": {
        const dmg = 6 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 3 + scale);
        }
        h.applyStatusToAllEnemies(state, "burn", scale);
        segments.push(`smashes ${targetEnemy?.name || "the line"} for ${dmg} and splashes fire`);
        modifiers.nextCardBurn = scale + 1;
        break;
      }
      case "barbarian_whirlwind": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "physical" as DamageType);
        segments.push(`cleaves the line for ${dmg}`);
        modifiers.nextCardDamageBonus = scale + 1;
        break;
      }
      case "barbarian_war_cry": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "physical" as DamageType);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        h.applyStatusToAllEnemies(state, "stun", 1);
        segments.push(`shakes the line for ${dmg}`);
        modifiers.nextCardDamageBonus = scale;
        break;
      }
      case "barbarian_grim_ward": {
        h.applyStatusToAllEnemies(state, "slow", scale + 2);
        h.applyStatusToAllEnemies(state, "stun", 1);
        h.applyGuard(state.hero, 3 + scale);
        segments.push("wards the field");
        modifiers.nextCardDamageBonus = scale;
        break;
      }
      case "barbarian_battle_command": {
        h.drawCards(state, 1);
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 3);
        segments.push("rallies the mercenary");
        modifiers.nextCardDamageBonus = scale + 1;
        modifiers.nextCardCostReduction = 1;
        break;
      }
      case "amazon_strafe": {
        const enemies = turns.getLivingEnemies(state);
        const dmg = 2 + scale;
        enemies.forEach((enemy: CombatEnemyState) => {
          h.dealDamage(state, enemy, dmg, "physical" as DamageType);
        });
        h.drawCards(state, 1);
        segments.push(`peppers ${enemies.length} targets for ${dmg} each`);
        break;
      }
      case "amazon_lightning_fury": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "lightning" as DamageType);
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push(`jolts the line for ${dmg}`);
        modifiers.nextCardParalyze = scale;
        break;
      }
      case "amazon_lightning_strike": {
        const dmg = 6 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "lightning" as DamageType);
          h.applyEnemyStatus(targetEnemy, "paralyze", scale + 2);
        }
        const secondary = h.getOtherLivingEnemy(state, targetEnemy?.id || "");
        if (secondary) {
          h.dealDamage(state, secondary, 2 + scale, "lightning" as DamageType);
          h.applyEnemyStatus(secondary, "paralyze", scale);
        }
        segments.push(`strikes ${targetEnemy?.name || "a target"} and arcs`);
        modifiers.nextCardParalyze = scale + 1;
        break;
      }
      case "amazon_freezing_arrow": {
        const dmg = 4 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "cold" as DamageType);
        }
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        segments.push(`pierces ${targetEnemy?.name || "a target"} and freezes the line`);
        modifiers.nextCardFreeze = scale;
        break;
      }
      case "assassin_phoenix_strike": {
        const dmg = 5 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "fire" as DamageType);
        }
        h.applyStatusToAllEnemies(state, "burn", scale + 1);
        segments.push(`ignites ${targetEnemy?.name || "a target"} and sets the line ablaze`);
        modifiers.nextCardBurn = scale + 2;
        break;
      }
      case "assassin_shock_web": {
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        h.applyStatusToAllEnemies(state, "paralyze", scale);
        segments.push("webs the entire line");
        modifiers.nextCardParalyze = scale;
        break;
      }
      case "druid_firestorm": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", scale + 1);
        segments.push(`rains fire across the line for ${dmg}`);
        modifiers.nextCardBurn = scale;
        break;
      }
      case "druid_armageddon": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", scale + 2);
        segments.push(`rains destruction for ${dmg}`);
        modifiers.nextCardBurn = scale + 1;
        break;
      }
      case "druid_hurricane": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        segments.push(`batters the line for ${dmg}`);
        modifiers.nextCardFreeze = scale;
        break;
      }
      case "druid_shock_wave": {
        const dmg = 4 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "physical" as DamageType);
        }
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        h.applyStatusToAllEnemies(state, "stun", 1);
        h.applyGuard(state.hero, scale);
        segments.push(`shakes ${targetEnemy?.name || "the field"}`);
        modifiers.nextCardDamageBonus = scale;
        break;
      }
      case "druid_volcano": {
        const dmg = 5 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 2 + scale);
          h.applyEnemyStatus(targetEnemy, "slow", scale + 1);
        }
        h.applyStatusToAllEnemies(state, "burn", scale);
        segments.push(`erupts on ${targetEnemy?.name || "the field"}`);
        modifiers.nextCardBurn = scale + 1;
        break;
      }
      case "necromancer_corpse_explosion": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", scale);
        segments.push(`detonates for ${dmg} across the line`);
        break;
      }
      case "necromancer_decrepify": {
        h.applyStatusToAllEnemies(state, "slow", scale + 2);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        segments.push("curses the whole enemy line");
        modifiers.nextCardCostReduction = 1;
        break;
      }
      case "necromancer_lower_resist": {
        h.applyStatusToAllEnemies(state, "burn", scale);
        h.applyStatusToAllEnemies(state, "poison", scale);
        h.applyStatusToAllEnemies(state, "paralyze", scale);
        segments.push("strips resistances");
        modifiers.nextCardDamageBonus = scale + 2;
        break;
      }
      case "necromancer_poison_nova": {
        const dmg = 1 + scale;
        h.dealDamageToAllEnemies(state, dmg, "poison" as DamageType);
        h.applyStatusToAllEnemies(state, "poison", scale + 2);
        segments.push(`poisons the line for ${dmg}`);
        modifiers.nextCardPoison = scale + 1;
        break;
      }
      case "necromancer_bone_prison": {
        if (targetEnemy) {
          h.applyEnemyStatus(targetEnemy, "freeze", scale + 2);
          h.applyEnemyStatus(targetEnemy, "slow", scale + 2);
        }
        h.applyGuard(state.hero, 4 + scale);
        segments.push("imprisons the target");
        modifiers.nextCardGuard = scale + 1;
        break;
      }
      case "paladin_conviction": {
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        h.applyStatusToAllEnemies(state, "paralyze", scale);
        segments.push("exposes the enemy line");
        modifiers.nextCardDamageBonus = scale + 2;
        break;
      }
      case "paladin_fist_of_the_heavens": {
        const dmg = 6 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "lightning" as DamageType);
        }
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push(`smites ${targetEnemy?.name || "a target"} and shocks the line`);
        modifiers.nextCardParalyze = scale;
        break;
      }
      case "paladin_holy_shock": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "lightning" as DamageType);
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push(`jolts the line for ${dmg}`);
        modifiers.nextCardParalyze = scale;
        break;
      }
      case "paladin_meditation": {
        const healed = h.healParty(state, 3 + scale);
        h.drawCards(state, 1);
        segments.push(`heals ${healed.heroHealed + healed.mercenaryHealed} and draws 1`);
        modifiers.nextCardCostReduction = 1;
        break;
      }
      case "paladin_redemption": {
        h.healParty(state, 4 + scale);
        h.applyGuardToParty(state, 3 + scale);
        segments.push("redeems the party");
        modifiers.nextCardGuard = scale + 1;
        break;
      }
      case "paladin_salvation": {
        h.applyGuardToParty(state, 5 + scale);
        h.drawCards(state, 1);
        segments.push("fortifies the party");
        modifiers.nextCardGuard = scale + 1;
        break;
      }
      case "paladin_sanctuary": {
        const dmg = 4 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "magic" as DamageType);
          h.applyEnemyStatus(targetEnemy, "slow", scale + 1);
        }
        h.applyGuardToParty(state, 4 + scale);
        segments.push(`drives back ${targetEnemy?.name || "a foe"} and shelters the party`);
        modifiers.nextCardGuard = scale;
        break;
      }
      case "paladin_fanaticism": {
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 3);
        segments.push("inspires fanatical zeal");
        modifiers.nextCardDamageBonus = scale + 2;
        modifiers.nextCardCostReduction = 1;
        break;
      }
      case "sorceress_chilling_armor": {
        h.applyGuard(state.hero, 5 + scale);
        if (targetEnemy) {
          h.applyEnemyStatus(targetEnemy, "freeze", scale + 1);
        }
        segments.push("encases the caster in frost");
        modifiers.nextCardGuard = scale + 1;
        break;
      }
      case "sorceress_energy_shield": {
        h.applyGuard(state.hero, 6 + scale);
        h.healEntity(state.hero, 2 + scale);
        segments.push("raises an energy barrier");
        modifiers.nextCardGuard = scale + 2;
        break;
      }
      default:
        return false;
    }

    h.addSkillModifiers(state, modifiers);
    const prep = h.getSkillPreparationSummary(state.skillModifiers);
    h.appendLog(
      state,
      `${skill.name}: ${segments.join(", ")}${prep ? ` (${prep}).` : "."}`
    );
    if (targetEnemy?.id) {
      state.selectedEnemyId = targetEnemy.id;
    }
    turns.checkOutcome(state);
    return true;
  }

  function useSpecificActiveSkill(
    state: CombatState,
    skill: CombatEquippedSkillState,
    targetEnemy: CombatEnemyState | null
  ): { ok: boolean; message: string } | null {
    // Handle summon skills via the summon effect builder
    if (skill.skillType === "summon") {
      if (resolveSummonSkill(state, skill)) {
        return { ok: true, message: "Skill used." };
      }
      return null;
    }

    // Handle area / hybrid / support skills
    if (resolveAreaAttackSkill(state, skill, targetEnemy)) {
      return { ok: true, message: "Skill used." };
    }

    return null;
  }

  runtimeWindow.__ROUGE_COMBAT_ENGINE_SKILLS = {
    useSpecificActiveSkill,
  };
})();
