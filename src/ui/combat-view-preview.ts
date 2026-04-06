(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getEffectiveCardCost(
    combat: CombatState,
    content: GameContent,
    instance: { cardId: string },
    card: CardDefinition
  ): number {
    const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
    const reduction = evo ? evo.getTreeCostReduction(instance.cardId, combat.deckCardIds, content.cardCatalog) : 0;
    const skillReduction = Math.max(0, combat.skillModifiers?.nextCardCostReduction || 0);
    return Math.max(0, card.cost - reduction - skillReduction);
  }

  function getCardPreviewAttackValue(combat: CombatState, instance: { cardId: string }, effectValue: number): number {
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
    const synergy = evo ? evo.getSynergyDamageBonus(instance.cardId, combat.deckCardIds) : 0;
    const weaponBonus = turns?.getWeaponAttackBonus?.(combat, instance.cardId) || 0;
    const skillBonus = Math.max(0, combat.skillModifiers?.nextCardDamageBonus || 0);
    let amount = Math.max(0, effectValue + combat.hero.damageBonus + synergy + weaponBonus + skillBonus);
    if (combat.hero.weaken > 0) {
      amount = Math.max(1, Math.floor(amount * 0.7));
    }
    return amount;
  }

  function getCardPreviewSupportValue(combat: CombatState, instance: { cardId: string }, effect: CardEffect): number {
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const weaponBonus = turns?.getWeaponSupportBonus?.(combat, instance.cardId) || 0;
    const guardBonus = effect.kind === "gain_guard_self" || effect.kind === "gain_guard_party"
      ? Math.max(0, combat.skillModifiers?.nextCardGuard || 0)
      : 0;
    return Math.max(0, effect.value + weaponBonus + guardBonus);
  }

  function applyPreviewEnemyDamage(enemy: { guard: number; life: number }, damage: number): { life: number; guard: number } {
    const blocked = Math.min(enemy.guard, damage);
    enemy.guard = Math.max(0, enemy.guard - blocked);
    const dealt = Math.max(0, damage - blocked);
    enemy.life = Math.max(0, enemy.life - dealt);
    return { life: dealt, guard: blocked };
  }

  function buildCardPreviewOutcome(
    combat: CombatState,
    instance: { cardId: string },
    card: CardDefinition,
    selectedEnemy: CombatEnemyState | null
  ): string {
    const targetPreview = selectedEnemy ? { guard: selectedEnemy.guard, life: selectedEnemy.life } : null;
    const linePreview = combat.enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => ({ id: enemy.id, guard: enemy.guard, life: enemy.life }));

    let singleDamage = 0;
    let singleGuardDamage = 0;
    let lineDamage = 0;
    let lineGuardDamage = 0;
    let selfGuard = 0;
    let partyGuard = 0;
    let heroHeal = 0;
    let mercHeal = 0;
    let drawCount = 0;
    let markBonus = 0;
    let mercBuff = 0;
    let burn = 0;
    let burnAll = 0;
    let poison = 0;
    let poisonAll = 0;
    let slow = 0;
    let slowAll = 0;
    let freeze = 0;
    let freezeAll = 0;
    let stun = 0;
    let stunAll = 0;
    let paralyze = 0;
    let paralyzeAll = 0;
    const summonSegments: string[] = [];

    let heroLife = combat.hero.life;
    let mercLife = combat.mercenary.life;

    card.effects.forEach((effect) => {
      switch (effect.kind) {
        case "damage": {
          const amount = getCardPreviewAttackValue(combat, instance, effect.value);
          if (targetPreview) {
            const resolved = applyPreviewEnemyDamage(targetPreview, amount);
            singleDamage += resolved.life;
            singleGuardDamage += resolved.guard;
          } else {
            singleDamage += amount;
          }
          break;
        }
        case "damage_all": {
          const amount = getCardPreviewAttackValue(combat, instance, effect.value);
          linePreview.forEach((enemy) => {
            const resolved = applyPreviewEnemyDamage(enemy, amount);
            lineDamage += resolved.life;
            lineGuardDamage += resolved.guard;
          });
          break;
        }
        case "gain_guard_self":
          selfGuard += getCardPreviewSupportValue(combat, instance, effect) + combat.hero.guardBonus;
          break;
        case "gain_guard_party":
          partyGuard += getCardPreviewSupportValue(combat, instance, effect) + combat.hero.guardBonus;
          break;
        case "heal_hero": {
          const amount = getCardPreviewSupportValue(combat, instance, effect);
          const healed = Math.min(combat.hero.maxLife - heroLife, amount);
          heroHeal += Math.max(0, healed);
          heroLife = Math.min(combat.hero.maxLife, heroLife + amount);
          break;
        }
        case "heal_mercenary": {
          if (!combat.mercenary.alive) { break; }
          const amount = getCardPreviewSupportValue(combat, instance, effect);
          const healed = Math.min(combat.mercenary.maxLife - mercLife, amount);
          mercHeal += Math.max(0, healed);
          mercLife = Math.min(combat.mercenary.maxLife, mercLife + amount);
          break;
        }
        case "draw":
          drawCount += effect.value + Math.max(0, combat.skillModifiers?.nextCardDraw || 0);
          break;
        case "summon_minion": {
          const summonPreview = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS?.getSummonPreview?.(combat, effect) || "Summon";
          if (summonPreview) {
            summonSegments.push(summonPreview);
          }
          break;
        }
        case "mark_enemy_for_mercenary":
          markBonus += getCardPreviewSupportValue(combat, instance, effect);
          break;
        case "buff_mercenary_next_attack":
          mercBuff += getCardPreviewSupportValue(combat, instance, effect);
          break;
        case "apply_burn":
          burn += Math.max(0, effect.value + combat.hero.burnBonus + (combat.skillModifiers?.nextCardBurn || 0));
          break;
        case "apply_burn_all":
          burnAll += Math.max(0, effect.value + combat.hero.burnBonus + (combat.skillModifiers?.nextCardBurn || 0));
          break;
        case "apply_poison":
          poison += Math.max(0, effect.value + (combat.skillModifiers?.nextCardPoison || 0));
          break;
        case "apply_poison_all":
          poisonAll += Math.max(0, effect.value + (combat.skillModifiers?.nextCardPoison || 0));
          break;
        case "apply_slow":
          slow += Math.max(0, effect.value + (combat.skillModifiers?.nextCardSlow || 0));
          break;
        case "apply_slow_all":
          slowAll += Math.max(0, effect.value + (combat.skillModifiers?.nextCardSlow || 0));
          break;
        case "apply_freeze":
          freeze += Math.max(0, effect.value + (combat.skillModifiers?.nextCardFreeze || 0));
          break;
        case "apply_freeze_all":
          freezeAll += Math.max(0, effect.value + (combat.skillModifiers?.nextCardFreeze || 0));
          break;
        case "apply_stun":
          stun = 1;
          break;
        case "apply_stun_all":
          stunAll = 1;
          break;
        case "apply_paralyze":
          paralyze += Math.max(0, effect.value + (combat.skillModifiers?.nextCardParalyze || 0));
          break;
        case "apply_paralyze_all":
          paralyzeAll += Math.max(0, effect.value + (combat.skillModifiers?.nextCardParalyze || 0));
          break;
        default:
          break;
      }
    });

    const parts: string[] = [];
    if (summonSegments.length > 0) { parts.push(...summonSegments); }
    if (singleDamage > 0) { parts.push(`${singleDamage} dmg`); }
    if (singleGuardDamage > 0) { parts.push(`${singleGuardDamage} guard`); }
    if (lineDamage > 0) { parts.push(`${lineDamage} dmg line`); }
    if (lineGuardDamage > 0) { parts.push(`${lineGuardDamage} guard line`); }
    if (selfGuard > 0) { parts.push(`Guard ${selfGuard}`); }
    if (partyGuard > 0) { parts.push(`Guard ${partyGuard} party`); }
    if (heroHeal > 0) { parts.push(`Heal ${heroHeal}`); }
    if (mercHeal > 0) { parts.push(`Merc heal ${mercHeal}`); }
    if (drawCount > 0) { parts.push(`Draw ${drawCount}`); }
    if (markBonus > 0) { parts.push(`Mark +${markBonus}`); }
    if (mercBuff > 0) { parts.push(`Merc +${mercBuff}`); }
    if (burn > 0) { parts.push(`Burn ${burn}`); }
    if (burnAll > 0) { parts.push(`Burn ${burnAll} line`); }
    if (poison > 0) { parts.push(`Poison ${poison}`); }
    if (poisonAll > 0) { parts.push(`Poison ${poisonAll} line`); }
    if (slow > 0) { parts.push(`Slow ${slow}`); }
    if (slowAll > 0) { parts.push(`Slow ${slowAll} line`); }
    if (freeze > 0) { parts.push(`Freeze ${freeze}`); }
    if (freezeAll > 0) { parts.push(`Freeze ${freezeAll} line`); }
    if (stun > 0) { parts.push("Stun"); }
    if (stunAll > 0) { parts.push("Stun line"); }
    if (paralyze > 0) { parts.push(`Paralyze ${paralyze}`); }
    if (paralyzeAll > 0) { parts.push(`Paralyze ${paralyzeAll} line`); }
    if (card.effects.some((effect) => effect.kind === "damage" || effect.kind === "damage_all")) {
      if ((combat.skillModifiers?.nextCardBurn || 0) > 0 && burn === 0 && burnAll === 0) {
        parts.push(`Burn ${combat.skillModifiers.nextCardBurn}`);
      }
      if ((combat.skillModifiers?.nextCardPoison || 0) > 0 && poison === 0 && poisonAll === 0) {
        parts.push(`Poison ${combat.skillModifiers.nextCardPoison}`);
      }
      if ((combat.skillModifiers?.nextCardSlow || 0) > 0 && slow === 0 && slowAll === 0) {
        parts.push(`Slow ${combat.skillModifiers.nextCardSlow}`);
      }
      if ((combat.skillModifiers?.nextCardFreeze || 0) > 0 && freeze === 0 && freezeAll === 0) {
        parts.push(`Freeze ${combat.skillModifiers.nextCardFreeze}`);
      }
      if ((combat.skillModifiers?.nextCardParalyze || 0) > 0 && paralyze === 0 && paralyzeAll === 0) {
        parts.push(`Paralyze ${combat.skillModifiers.nextCardParalyze}`);
      }
    }

    return parts.join(" + ") || "Resolve";
  }

  function buildMeleePreviewOutcome(combat: CombatState, selectedEnemy: CombatEnemyState | null): string {
    if (!combat.weaponDamageBonus) {
      return "No strike";
    }

    const damage = runtimeWindow.__ROUGE_COMBAT_WEAPON_SCALING?.getMeleeDamage?.(combat) || Math.max(1, combat.weaponDamageBonus || 0);
    if (!selectedEnemy) {
      return `${damage} strike`;
    }

    const blocked = Math.min(selectedEnemy.guard, damage);
    const dealt = Math.max(0, damage - blocked);
    return [dealt > 0 ? `${dealt} strike` : "", blocked > 0 ? `${blocked} guard` : ""].filter(Boolean).join(" + ");
  }

  function getSkillTierScale(skill: CombatEquippedSkillState): number {
    if (skill.slot === 3 || skill.tier === "capstone") {
      return 3;
    }
    if (skill.slot === 2 || skill.tier === "bridge") {
      return 2;
    }
    return 1;
  }

  function _createSkillSummonEffect(combat: CombatState, skill: CombatEquippedSkillState): CardEffect | null {
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
      case "amazon_decoy":
        return build("amazon_decoy", 2 + scale, 2 + scale);
      case "amazon_valkyrie":
        return build("amazon_valkyrie", 3 + scale, 2 + scale);
      case "assassin_shadow_master":
        return build("assassin_shadow_master", 3 + scale, 1 + scale);
      case "assassin_lightning_sentry":
        return build("assassin_lightning_sentry", 2 + scale, 1 + scale, 4);
      case "assassin_wake_of_inferno":
        return build("assassin_wake_of_fire", 2 + scale, 1 + scale, 4);
      case "assassin_death_sentry":
        return build("assassin_death_sentry", 3 + scale, 1 + scale, 4);
      case "druid_raven":
        return build("druid_raven", 2 + scale, 1 + scale);
      case "druid_poison_creeper":
        return build("druid_poison_creeper", 2 + scale, 1 + scale);
      case "druid_oak_sage":
        return build("druid_oak_sage", 2 + scale);
      case "druid_solar_creeper":
        return build("druid_solar_creeper", 2 + scale, 1 + scale);
      case "druid_spirit_of_barbs":
        return build("druid_spirit_of_barbs", 2 + scale, 2 + scale);
      case "druid_summon_grizzly":
        return build("druid_grizzly", 3 + scale, 2 + scale);
      case "necromancer_raise_skeleton":
        return build("necromancer_skeleton", 2 + scale);
      case "necromancer_clay_golem":
        return build("necromancer_clay_golem", 2 + scale, 1 + scale);
      case "necromancer_iron_golem":
        return build("necromancer_iron_golem", 3 + scale, 2 + scale);
      case "necromancer_fire_golem":
        return build("necromancer_fire_golem", 3 + scale, 2 + scale);
      case "necromancer_revive":
        return build("necromancer_revive", 3 + scale, 2 + scale);
      case "sorceress_hydra":
        return build("sorceress_hydra", 3 + scale, 2 + scale);
      default:
        return null;
    }
  }

  function deriveSkillPreviewScopes(skill: CombatEquippedSkillState): string[] {
    const scopes = new Set<string>();
    if (skill.skillType === "summon") {
      scopes.add("minions");
    }
    if (!skill.active) {
      if (skill.skillId === "necromancer_skeleton_mastery" || skill.skillId === "necromancer_summon_resist") {
        scopes.add("minions");
      }
      if (skill.skillId === "amazon_evade" || skill.skillId === "barbarian_natural_resistance") {
        scopes.add("party");
      } else {
        scopes.add("hero");
      }
      return Array.from(scopes);
    }

    const mixedTargetLineSkillIds = new Set([
      "amazon_freezing_arrow",
      "amazon_lightning_strike",
      "assassin_phoenix_strike",
      "druid_shock_wave",
      "druid_volcano",
      "paladin_fist_of_the_heavens",
      "sorceress_meteor",
    ]);
    const enemyLineSkillIds = new Set([
      "amazon_strafe",
      "amazon_lightning_fury",
      "assassin_shock_web",
      "barbarian_whirlwind",
      "barbarian_war_cry",
      "barbarian_grim_ward",
      "druid_firestorm",
      "druid_armageddon",
      "druid_hurricane",
      "necromancer_corpse_explosion",
      "necromancer_decrepify",
      "necromancer_lower_resist",
      "necromancer_poison_nova",
      "paladin_conviction",
      "paladin_holy_shock",
      "paladin_fist_of_the_heavens",
      "sorceress_frost_nova",
      "sorceress_blizzard",
      "sorceress_frozen_orb",
      "sorceress_inferno",
      "sorceress_thunder_storm",
      "sorceress_static_field",
    ]);
    const partySkillIds = new Set([
      "amazon_decoy",
      "barbarian_shout",
      "barbarian_battle_orders",
      "barbarian_natural_resistance",
      "necromancer_bone_armor",
      "necromancer_summon_resist",
      "paladin_meditation",
      "paladin_prayer",
      "paladin_resist_fire",
      "paladin_resist_cold",
      "paladin_defiance",
      "paladin_holy_shield",
      "paladin_redemption",
      "paladin_salvation",
      "paladin_sanctuary",
    ]);
    const mercenarySkillIds = new Set([
      "amazon_inner_sight",
      "amazon_jab",
      "barbarian_battle_command",
      "paladin_might",
      "paladin_fanaticism",
      "necromancer_amplify_damage",
      "necromancer_attract",
    ]);
    const activeHeroSkillIds = new Set([
      "barbarian_grim_ward",
      "druid_shock_wave",
      "necromancer_bone_prison",
      "sorceress_chilling_armor",
      "sorceress_energy_shield",
    ]);

    if (enemyLineSkillIds.has(skill.skillId) || mixedTargetLineSkillIds.has(skill.skillId)) {
      scopes.add("enemy_line");
    }
    if (partySkillIds.has(skill.skillId)) {
      scopes.add("party");
    } else {
      if (mercenarySkillIds.has(skill.skillId)) {
        scopes.add("mercenary");
      }
      if (skill.skillType === "buff" || skill.skillType === "aura" || activeHeroSkillIds.has(skill.skillId)) {
        scopes.add("hero");
      }
    }
    if (skill.skillType === "attack" || skill.skillType === "spell" || skill.skillType === "debuff") {
      if (!enemyLineSkillIds.has(skill.skillId) || mixedTargetLineSkillIds.has(skill.skillId)) {
        scopes.add("selected_enemy");
      }
    }
    if (skill.skillType === "summon") {
      scopes.add("minions");
    }
    if (scopes.size === 0) {
      if (skill.family === "command" || skill.family === "recovery") {
        scopes.add("party");
      } else if (skill.family === "state") {
        scopes.add("hero");
      } else {
        scopes.add("selected_enemy");
      }
    }
    return Array.from(scopes);
  }

  function buildSkillPreviewOutcome(
    combat: CombatState,
    skill: CombatEquippedSkillState,
    _selectedEnemy: CombatEnemyState | null
  ): string {
    return runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW_SKILLS.buildSkillPreviewOutcome(combat, skill, _selectedEnemy);
  }

  function derivePreviewScopes(card: CardDefinition): string[] {
    const scopes = new Set<string>();
    if (card.target === "enemy") {
      scopes.add("selected_enemy");
    }

    card.effects.forEach((effect) => {
      switch (effect.kind) {
        case "damage_all":
        case "apply_burn_all":
        case "apply_poison_all":
        case "apply_slow_all":
        case "apply_freeze_all":
        case "apply_stun_all":
        case "apply_paralyze_all":
          scopes.add("enemy_line");
          break;
        case "summon_minion":
          scopes.add("minions");
          break;
        case "gain_guard_self":
        case "heal_hero":
        case "draw":
          scopes.add("hero");
          break;
        case "heal_mercenary":
        case "buff_mercenary_next_attack":
          scopes.add("mercenary");
          break;
        case "gain_guard_party":
          scopes.add("party");
          break;
        default:
          break;
      }
    });

    return Array.from(scopes);
  }

  function describePreviewScopes(scopes: string[]): string {
    const normalized = new Set(scopes);
    if (normalized.has("party")) {
      normalized.delete("hero");
      normalized.delete("mercenary");
    }

    const labels = Array.from(normalized).map((scope) => {
      switch (scope) {
        case "selected_enemy": return "Target";
        case "enemy_line": return "Enemy Line";
        case "minions": return "Minion";
        case "hero": return "Self";
        case "mercenary": return "Mercenary";
        case "party": return "Party";
        default: return scope;
      }
    });

    return labels.join(" + ") || "Effect";
  }

  function summarizePreviewOutcome(previewOutcome: string): string {
    const parts = previewOutcome
      .split(" + ")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return "Resolve";
    }

    const summary = parts.slice(0, 2).join(" · ");
    return parts.length > 2 ? `${summary} +` : summary;
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW = {
    getEffectiveCardCost,
    buildCardPreviewOutcome,
    buildMeleePreviewOutcome,
    derivePreviewScopes,
    deriveSkillPreviewScopes,
    getExactSkillModifierPreviewParts: (skill: CombatEquippedSkillState, combat?: CombatState | null) =>
      runtimeWindow.__ROUGE_COMBAT_VIEW_PREVIEW_SKILLS?.getExactSkillModifierPreviewParts?.(skill, combat) || [],
    describePreviewScopes,
    buildSkillPreviewOutcome,
    summarizePreviewOutcome,
  };
})();
