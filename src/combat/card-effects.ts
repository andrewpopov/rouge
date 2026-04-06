(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    healEntity,
    applyGuard,
    dealDamage,
    getLivingEnemies,
    drawCards,
    summonMinion,
    getWeaponAttackBonus,
    getWeaponSupportBonus,
    applyWeaponTypedDamage,
    applyWeaponEffects,
  } = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;

  function applyWeaken(state: CombatState, amount: number) {
    if (state.hero.weaken > 0) {
      return Math.max(1, Math.floor(amount * 0.7));
    }
    return amount;
  }

  function getSynergyBonus(state: CombatState, cardId: string): number {
    const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
    if (!evo) { return 0; }
    return evo.getSynergyDamageBonus(cardId, state.deckCardIds);
  }

  function getWeaponScaledSupportValue(state: CombatState, effect: CardEffect, cardId: string): number {
    const scalesWithWeapon =
      effect.kind === "gain_guard_self" ||
      effect.kind === "gain_guard_party" ||
      effect.kind === "heal_hero" ||
      effect.kind === "heal_mercenary" ||
      effect.kind === "mark_enemy_for_mercenary" ||
      effect.kind === "buff_mercenary_next_attack";
    const weaponBonus = scalesWithWeapon ? getWeaponSupportBonus(state, cardId) : 0;
    return Math.max(0, effect.value + weaponBonus);
  }

  function getPendingSkillDamageBonus(state: CombatState): number {
    return Math.max(0, state.skillModifiers?.nextCardDamageBonus || 0);
  }

  function getPendingSkillGuardBonus(state: CombatState): number {
    return Math.max(0, state.skillModifiers?.nextCardGuard || 0);
  }

  function getPendingSkillDrawBonus(state: CombatState): number {
    return Math.max(0, state.skillModifiers?.nextCardDraw || 0);
  }

  function applyPendingSkillRider(state: CombatState, targets: CombatEnemyState[]): string[] {
    const segments: string[] = [];
    const burn = Math.max(0, state.skillModifiers?.nextCardBurn || 0);
    const poison = Math.max(0, state.skillModifiers?.nextCardPoison || 0);
    const slow = Math.max(0, state.skillModifiers?.nextCardSlow || 0);
    const freeze = Math.max(0, state.skillModifiers?.nextCardFreeze || 0);
    const paralyze = Math.max(0, state.skillModifiers?.nextCardParalyze || 0);
    const livingTargets = targets.filter((enemy) => enemy.alive);
    if (livingTargets.length === 0) {
      return segments;
    }

    livingTargets.forEach((enemy) => {
      if (burn > 0) {
        enemy.burn = Math.max(0, enemy.burn + burn);
      }
      if (poison > 0) {
        enemy.poison = Math.max(0, enemy.poison + poison);
      }
      if (slow > 0) {
        enemy.slow = Math.max(0, enemy.slow + slow);
      }
      if (freeze > 0) {
        enemy.freeze = Math.max(0, enemy.freeze + freeze);
      }
      if (paralyze > 0) {
        enemy.paralyze = Math.max(0, enemy.paralyze + paralyze);
      }
    });

    if (burn > 0) { segments.push(`Burn ${burn}${livingTargets.length > 1 ? " line" : ""}.`); }
    if (poison > 0) { segments.push(`Poison ${poison}${livingTargets.length > 1 ? " line" : ""}.`); }
    if (slow > 0) { segments.push(`Slow ${slow}${livingTargets.length > 1 ? " line" : ""}.`); }
    if (freeze > 0) { segments.push(`Freeze ${freeze}${livingTargets.length > 1 ? " line" : ""}.`); }
    if (paralyze > 0) { segments.push(`Paralyze ${paralyze}${livingTargets.length > 1 ? " line" : ""}.`); }
    return segments;
  }

  function resolveCardEffect(state: CombatState, effect: CardEffect, targetEnemy: CombatEnemyState | null, cardId: string) {
    if (effect.kind === "damage") {
      const synergy = getSynergyBonus(state, cardId);
      const weaponBonus = getWeaponAttackBonus(state, cardId);
      const damage = applyWeaken(
        state,
        Math.max(0, effect.value + state.hero.damageBonus + synergy + weaponBonus + getPendingSkillDamageBonus(state))
      );
      const dealt = dealDamage(state, targetEnemy, damage);
      const weaponSegments = [
        ...applyWeaponTypedDamage(state, targetEnemy?.alive ? [targetEnemy] : [], cardId),
        ...applyWeaponEffects(state, targetEnemy?.alive ? [targetEnemy] : [], cardId),
      ];
      const skillSegments = applyPendingSkillRider(state, targetEnemy?.alive ? [targetEnemy] : []);
      return `dealt ${dealt} to ${targetEnemy.name}.${weaponSegments.length > 0 ? ` ${weaponSegments.join(" ")}` : ""}${skillSegments.length > 0 ? ` ${skillSegments.join(" ")}` : ""}`;
    }
    if (effect.kind === "gain_guard_self") {
      const guardValue = Math.max(0, getWeaponScaledSupportValue(state, effect, cardId) + state.hero.guardBonus + getPendingSkillGuardBonus(state));
      applyGuard(state.hero, guardValue);
      return `gained ${guardValue} Guard.`;
    }
    if (effect.kind === "mark_enemy_for_mercenary") {
      if (!targetEnemy || !targetEnemy.alive) {
        return "";
      }
      state.mercenary.markedEnemyId = targetEnemy.id;
      state.mercenary.markBonus = getWeaponScaledSupportValue(state, effect, cardId);
      return `marked ${targetEnemy.name} for +${state.mercenary.markBonus} mercenary damage.`;
    }
    if (effect.kind === "apply_burn") {
      if (targetEnemy && targetEnemy.alive) {
        const burnValue = Math.max(0, effect.value + state.hero.burnBonus + (state.skillModifiers?.nextCardBurn || 0));
        targetEnemy.burn = Math.max(0, targetEnemy.burn + burnValue);
        return `applied ${burnValue} Burn.`;
      }
      return "";
    }
    if (effect.kind === "apply_poison") {
      if (targetEnemy && targetEnemy.alive) {
        const poisonValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardPoison || 0));
        targetEnemy.poison = Math.max(0, targetEnemy.poison + poisonValue);
        return `applied ${poisonValue} Poison.`;
      }
      return "";
    }
    if (effect.kind === "apply_slow") {
      if (targetEnemy && targetEnemy.alive) {
        const slowValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardSlow || 0));
        targetEnemy.slow = Math.max(0, targetEnemy.slow + slowValue);
        return `applied ${slowValue} Slow.`;
      }
      return "";
    }
    if (effect.kind === "apply_freeze") {
      if (targetEnemy && targetEnemy.alive) {
        const freezeValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardFreeze || 0));
        targetEnemy.freeze = Math.max(0, targetEnemy.freeze + freezeValue);
        return `applied ${freezeValue} Freeze.`;
      }
      return "";
    }
    if (effect.kind === "apply_stun") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.stun = 1;
        return `stunned ${targetEnemy.name}.`;
      }
      return "";
    }
    if (effect.kind === "apply_paralyze") {
      if (targetEnemy && targetEnemy.alive) {
        const paralyzeValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardParalyze || 0));
        targetEnemy.paralyze = Math.max(0, targetEnemy.paralyze + paralyzeValue);
        return `applied ${paralyzeValue} Paralyze.`;
      }
      return "";
    }
    if (effect.kind === "apply_burn_all") {
      const living = getLivingEnemies(state);
      const burnValue = Math.max(0, effect.value + state.hero.burnBonus + (state.skillModifiers?.nextCardBurn || 0));
      living.forEach((enemy: CombatEnemyState) => { enemy.burn = Math.max(0, enemy.burn + burnValue); });
      return `applied ${burnValue} Burn to all enemies.`;
    }
    if (effect.kind === "apply_poison_all") {
      const living = getLivingEnemies(state);
      const poisonValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardPoison || 0));
      living.forEach((enemy: CombatEnemyState) => { enemy.poison = Math.max(0, enemy.poison + poisonValue); });
      return `applied ${poisonValue} Poison to all enemies.`;
    }
    if (effect.kind === "apply_slow_all") {
      const living = getLivingEnemies(state);
      const slowValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardSlow || 0));
      living.forEach((enemy: CombatEnemyState) => { enemy.slow = Math.max(0, enemy.slow + slowValue); });
      return `applied ${slowValue} Slow to all enemies.`;
    }
    if (effect.kind === "apply_freeze_all") {
      const living = getLivingEnemies(state);
      const freezeValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardFreeze || 0));
      living.forEach((enemy: CombatEnemyState) => { enemy.freeze = Math.max(0, enemy.freeze + freezeValue); });
      return `applied ${freezeValue} Freeze to all enemies.`;
    }
    if (effect.kind === "apply_stun_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.stun = 1; });
      return `stunned all enemies.`;
    }
    if (effect.kind === "apply_paralyze_all") {
      const living = getLivingEnemies(state);
      const paralyzeValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardParalyze || 0));
      living.forEach((enemy: CombatEnemyState) => { enemy.paralyze = Math.max(0, enemy.paralyze + paralyzeValue); });
      return `applied ${paralyzeValue} Paralyze to all enemies.`;
    }
    if (effect.kind === "gain_guard_party") {
      const guardValue = Math.max(0, getWeaponScaledSupportValue(state, effect, cardId) + state.hero.guardBonus + getPendingSkillGuardBonus(state));
      applyGuard(state.hero, guardValue);
      applyGuard(state.mercenary, guardValue);
      return `granted ${guardValue} Guard to the party.`;
    }
    if (effect.kind === "buff_mercenary_next_attack") {
      const attackBonus = getWeaponScaledSupportValue(state, effect, cardId);
      state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + attackBonus);
      return `buffed the mercenary's next attack by ${attackBonus}.`;
    }
    if (effect.kind === "damage_all") {
      const synergy = getSynergyBonus(state, cardId);
      const weaponBonus = getWeaponAttackBonus(state, cardId);
      const damage = applyWeaken(
        state,
        Math.max(0, effect.value + state.hero.damageBonus + synergy + weaponBonus + getPendingSkillDamageBonus(state))
      );
      const targets = getLivingEnemies(state);
      const total = targets.reduce((sum: number, enemy: CombatEnemyState) => sum + dealDamage(state, enemy, damage), 0);
      const aliveTargets = targets.filter((enemy: CombatEnemyState) => enemy.alive);
      const weaponSegments = [
        ...applyWeaponTypedDamage(state, aliveTargets, cardId),
        ...applyWeaponEffects(state, aliveTargets, cardId),
      ];
      const skillSegments = applyPendingSkillRider(state, aliveTargets);
      return `dealt ${total} total damage.${weaponSegments.length > 0 ? ` ${weaponSegments.join(" ")}` : ""}${skillSegments.length > 0 ? ` ${skillSegments.join(" ")}` : ""}`;
    }
    if (effect.kind === "heal_mercenary") {
      const healed = healEntity(state.mercenary, getWeaponScaledSupportValue(state, effect, cardId));
      return `healed the mercenary for ${healed}.`;
    }
    if (effect.kind === "draw") {
      const drew = drawCards(state, effect.value + getPendingSkillDrawBonus(state));
      return `drew ${drew} card${drew === 1 ? "" : "s"}.`;
    }
    if (effect.kind === "heal_hero") {
      const healed = healEntity(state.hero, getWeaponScaledSupportValue(state, effect, cardId));
      return `healed for ${healed}.`;
    }
    if (effect.kind === "summon_minion") {
      return summonMinion(state, effect);
    }
    return "";
  }

  function summarizeCardEffect(card: CardDefinition, segments: string[]) {
    if (segments.length === 0) {
      return `${card.title} resolved.`;
    }
    return `${card.title}: ${segments.join(" ")}`;
  }

  runtimeWindow.__ROUGE_CARD_EFFECTS = {
    resolveCardEffect,
    summarizeCardEffect,
  };
})();
