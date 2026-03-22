(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ENEMY_ROLE } = runtimeWindow.ROUGE_CONSTANTS;

  function chooseMercenaryTarget(state: CombatState) {
    const livingEnemies = state.enemies.filter((enemy: CombatEnemyState) => enemy.alive);
    const marked = livingEnemies.find((enemy: CombatEnemyState) => enemy.id === state.mercenary.markedEnemyId);
    if (marked) {
      return marked;
    }

    if (state.mercenary.behavior === "backline_hunter") {
      const backlineTarget =
        livingEnemies.find((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.SUPPORT) ||
        livingEnemies.find((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.RANGED) ||
        null;
      if (backlineTarget) {
        return backlineTarget;
      }
    }

    if (state.mercenary.behavior === "guard_breaker") {
      const guardedTarget =
        livingEnemies
          .slice()
          .sort((left: CombatEnemyState, right: CombatEnemyState) => right.guard - left.guard)[0] || null;
      if (guardedTarget?.guard > 0) {
        return guardedTarget;
      }
    }

    if (state.mercenary.behavior === "boss_hunter") {
      const priorityTarget =
        livingEnemies.find((enemy: CombatEnemyState) => enemy.templateId.endsWith("_boss")) ||
        livingEnemies.find((enemy: CombatEnemyState) => enemy.templateId.includes("_elite")) ||
        null;
      if (priorityTarget) {
        return priorityTarget;
      }
    }

    if (state.mercenary.behavior === "wounded_hunter") {
      const woundedTarget =
        livingEnemies
          .slice()
          .sort((left: CombatEnemyState, right: CombatEnemyState) => {
            const leftRatio = left.maxLife > 0 ? left.life / left.maxLife : 1;
            const rightRatio = right.maxLife > 0 ? right.life / right.maxLife : 1;
            if (leftRatio !== rightRatio) {
              return leftRatio - rightRatio;
            }
            return left.life - right.life;
          })[0] || null;
      if (woundedTarget) {
        return woundedTarget;
      }
    }

    const selected = livingEnemies.find((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId);
    if (selected) {
      return selected;
    }

    return livingEnemies.slice().sort((left: CombatEnemyState, right: CombatEnemyState) => left.life - right.life)[0] || null;
  }

  function resolveMercenaryAction(
    state: CombatState,
    appendLog: (state: CombatState, message: string) => void,
    dealDamage: (state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number,
    applyGuard: (entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number,
    getFirstLivingEnemyId: (state: CombatState) => string,
  ) {
    if (!state.mercenary.alive) {
      return;
    }

    const target = chooseMercenaryTarget(state);
    if (!target) {
      return;
    }

    let damage = state.mercenary.attack + state.mercenary.nextAttackBonus + state.mercenary.contractAttackBonus;
    if (state.mercenary.behavior === "mark_hunter" && target.id === state.mercenary.markedEnemyId) {
      damage += state.mercenary.markBonus + state.mercenary.contractBehaviorBonus;
    }
    if (state.mercenary.behavior === "burn_finisher" && target.burn > 0) {
      damage += 2 + state.mercenary.contractBehaviorBonus;
    }
    if (state.mercenary.behavior === "guard_breaker" && target.guard > 0) {
      const removedGuard = target.guard;
      target.guard = 0;
      damage += 2 + state.mercenary.contractBehaviorBonus;
      appendLog(state, `${state.mercenary.name} shatters ${target.name}'s Guard (${removedGuard}).`);
    }
    if (state.mercenary.behavior === "boss_hunter" && (target.templateId.endsWith("_boss") || target.templateId.includes("_elite"))) {
      damage += 3 + state.mercenary.contractBehaviorBonus;
    }
    if (state.mercenary.behavior === "backline_hunter" && (target.role === ENEMY_ROLE.SUPPORT || target.role === ENEMY_ROLE.RANGED)) {
      damage += 2 + state.mercenary.contractBehaviorBonus;
    }
    if (state.mercenary.behavior === "wounded_hunter" && target.life <= Math.ceil(target.maxLife / 2)) {
      damage += 3 + state.mercenary.contractBehaviorBonus;
    }

    const dealt = dealDamage(state, target, damage);
    appendLog(state, `${state.mercenary.name} hits ${target.name} for ${dealt}.`);

    if (state.mercenary.behavior === "guard_after_attack") {
      const guardGained = 2 + state.mercenary.contractBehaviorBonus;
      applyGuard(state.mercenary, guardGained);
      appendLog(state, `${state.mercenary.name} gains ${guardGained} Guard.`);
    }

    state.mercenary.nextAttackBonus = 0;
    state.mercenary.markedEnemyId = "";
    state.mercenary.markBonus = 0;
    state.selectedEnemyId = getFirstLivingEnemyId(state);
  }

  runtimeWindow.__ROUGE_COMBAT_MERCENARY = {
    chooseMercenaryTarget,
    resolveMercenaryAction,
  };
})();
