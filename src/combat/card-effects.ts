(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    healEntity,
    applyGuard,
    dealDamage,
    getLivingEnemies,
    drawCards,
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

  function resolveCardEffect(state: CombatState, effect: CardEffect, targetEnemy: CombatEnemyState | null, cardId: string) {
    if (effect.kind === "damage") {
      const synergy = getSynergyBonus(state, cardId);
      const weaponBonus = getWeaponAttackBonus(state, cardId);
      const damage = applyWeaken(state, Math.max(0, effect.value + state.hero.damageBonus + synergy + weaponBonus));
      const dealt = dealDamage(state, targetEnemy, damage);
      const weaponSegments = [
        ...applyWeaponTypedDamage(state, targetEnemy?.alive ? [targetEnemy] : [], cardId),
        ...applyWeaponEffects(state, targetEnemy?.alive ? [targetEnemy] : [], cardId),
      ];
      return `dealt ${dealt} to ${targetEnemy.name}.${weaponSegments.length > 0 ? ` ${weaponSegments.join(" ")}` : ""}`;
    }
    if (effect.kind === "gain_guard_self") {
      const guardValue = Math.max(0, getWeaponScaledSupportValue(state, effect, cardId) + state.hero.guardBonus);
      applyGuard(state.hero, guardValue);
      return `gained ${guardValue} Guard.`;
    }
    if (effect.kind === "mark_enemy_for_mercenary") {
      state.mercenary.markedEnemyId = targetEnemy?.alive ? targetEnemy.id : "";
      state.mercenary.markBonus = getWeaponScaledSupportValue(state, effect, cardId);
      return `marked ${targetEnemy.name} for +${state.mercenary.markBonus} mercenary damage.`;
    }
    if (effect.kind === "apply_burn") {
      if (targetEnemy && targetEnemy.alive) {
        const burnValue = Math.max(0, effect.value + state.hero.burnBonus);
        targetEnemy.burn = Math.max(0, targetEnemy.burn + burnValue);
        return `applied ${burnValue} Burn.`;
      }
      return "";
    }
    if (effect.kind === "apply_poison") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.poison = Math.max(0, targetEnemy.poison + effect.value);
        return `applied ${effect.value} Poison.`;
      }
      return "";
    }
    if (effect.kind === "apply_slow") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.slow = Math.max(0, targetEnemy.slow + effect.value);
        return `applied ${effect.value} Slow.`;
      }
      return "";
    }
    if (effect.kind === "apply_freeze") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.freeze = Math.max(0, targetEnemy.freeze + effect.value);
        return `applied ${effect.value} Freeze.`;
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
        targetEnemy.paralyze = Math.max(0, targetEnemy.paralyze + effect.value);
        return `applied ${effect.value} Paralyze.`;
      }
      return "";
    }
    if (effect.kind === "apply_burn_all") {
      const living = getLivingEnemies(state);
      const burnValue = Math.max(0, effect.value + state.hero.burnBonus);
      living.forEach((enemy: CombatEnemyState) => { enemy.burn = Math.max(0, enemy.burn + burnValue); });
      return `applied ${burnValue} Burn to all enemies.`;
    }
    if (effect.kind === "apply_poison_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.poison = Math.max(0, enemy.poison + effect.value); });
      return `applied ${effect.value} Poison to all enemies.`;
    }
    if (effect.kind === "apply_slow_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.slow = Math.max(0, enemy.slow + effect.value); });
      return `applied ${effect.value} Slow to all enemies.`;
    }
    if (effect.kind === "apply_freeze_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.freeze = Math.max(0, enemy.freeze + effect.value); });
      return `applied ${effect.value} Freeze to all enemies.`;
    }
    if (effect.kind === "apply_stun_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.stun = 1; });
      return `stunned all enemies.`;
    }
    if (effect.kind === "apply_paralyze_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.paralyze = Math.max(0, enemy.paralyze + effect.value); });
      return `applied ${effect.value} Paralyze to all enemies.`;
    }
    if (effect.kind === "gain_guard_party") {
      const guardValue = Math.max(0, getWeaponScaledSupportValue(state, effect, cardId) + state.hero.guardBonus);
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
      const damage = applyWeaken(state, Math.max(0, effect.value + state.hero.damageBonus + synergy + weaponBonus));
      const targets = getLivingEnemies(state);
      const total = targets.reduce((sum: number, enemy: CombatEnemyState) => sum + dealDamage(state, enemy, damage), 0);
      const aliveTargets = targets.filter((enemy: CombatEnemyState) => enemy.alive);
      const weaponSegments = [
        ...applyWeaponTypedDamage(state, aliveTargets, cardId),
        ...applyWeaponEffects(state, aliveTargets, cardId),
      ];
      return `dealt ${total} total damage.${weaponSegments.length > 0 ? ` ${weaponSegments.join(" ")}` : ""}`;
    }
    if (effect.kind === "heal_mercenary") {
      const healed = healEntity(state.mercenary, getWeaponScaledSupportValue(state, effect, cardId));
      return `healed the mercenary for ${healed}.`;
    }
    if (effect.kind === "draw") {
      const drew = drawCards(state, effect.value);
      return `drew ${drew} card${drew === 1 ? "" : "s"}.`;
    }
    if (effect.kind === "heal_hero") {
      const healed = healEntity(state.hero, getWeaponScaledSupportValue(state, effect, cardId));
      return `healed for ${healed}.`;
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
