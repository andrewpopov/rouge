(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp, parseInteger } = runtimeWindow.ROUGE_UTILS;
  const monsterActions = runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS;

  const THORNS_DAMAGE = 2;

  const combatLog = runtimeWindow.__ROUGE_COMBAT_LOG;
  function logCombat(state: CombatState, params: {
    actor: CombatLogEntry["actor"];
    actorName: string;
    actorId?: string;
    action: CombatLogAction;
    actionId?: string;
    tone?: CombatLogTone;
    message: string;
    effects?: CombatLogEffect[];
  }) {
    combatLog.appendLogEntry(state, combatLog.createLogEntry(state, params));
  }

  function getLivingEnemies(state: CombatState) {
    return state.enemies.filter((enemy: CombatEnemyState) => enemy.alive);
  }

  function hasTrait(enemy: CombatEnemyState, trait: MonsterTraitKind) {
    return Array.isArray(enemy.traits) && enemy.traits.includes(trait);
  }

  function healEntity(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) {
    if (!entity || !entity.alive) {
      return 0;
    }
    const before = entity.life;
    entity.life = clamp(entity.life + amount, 0, entity.maxLife);
    return entity.life - before;
  }

  function applyGuard(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) {
    if (!entity || !entity.alive) {
      return 0;
    }
    entity.guard = Math.max(0, entity.guard + amount);
    return amount;
  }

  function trackLowestLife(state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState) {
    if (entity === state.hero) {
      state.lowestHeroLife = Math.min(state.lowestHeroLife, state.hero.life);
      return;
    }
    if (entity === state.mercenary) {
      state.lowestMercenaryLife = Math.min(state.lowestMercenaryLife, state.mercenary.life);
    }
  }

  function handleDefeat(state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState) {
    const isEnemy = state.enemies.includes(entity as CombatEnemyState);
    entity.alive = false;
    entity.guard = 0;
    if (entity.burn) { entity.burn = 0; }
    if ((entity as CombatEnemyState).poison) { (entity as CombatEnemyState).poison = 0; }
    if ((entity as CombatEnemyState).slow) { (entity as CombatEnemyState).slow = 0; }
    if ((entity as CombatEnemyState).freeze) { (entity as CombatEnemyState).freeze = 0; }
    if ((entity as CombatEnemyState).stun) { (entity as CombatEnemyState).stun = 0; }
    if ((entity as CombatEnemyState).paralyze) { (entity as CombatEnemyState).paralyze = 0; }
    logCombat(state, {
      actor: "environment", actorName: "",
      action: "death", tone: "loss",
      message: `${entity.name} falls.`,
    });

    // Process death traits for enemies
    if (isEnemy) {
      monsterActions.processDeathTraits(state, entity as CombatEnemyState);

      // Flee on ally death: mark Fallen-type allies to skip their next action
      const deadEnemy = entity as CombatEnemyState;
      getLivingEnemies(state).forEach((ally: CombatEnemyState) => {
        if (ally.id !== deadEnemy.id && hasTrait(ally, "flee_on_ally_death")) {
          ally.stun = Math.max(ally.stun, 1);
          logCombat(state, {
            actor: "enemy", actorName: ally.name, actorId: ally.id,
            action: "death", tone: "maneuver",
            message: `${ally.name} panics and flees!`,
          });
        }
      });
    }
  }

  function heroIsImmuneTo(state: CombatState, damageType: DamageType = "physical") {
    return Array.isArray(state.armorProfile?.immunities) && state.armorProfile.immunities.includes(damageType);
  }

  function getHeroResistance(state: CombatState, damageType: DamageType = "physical") {
    return (state.armorProfile?.resistances || [])
      .filter((entry) => entry.type === damageType)
      .reduce((total, entry) => total + parseInteger(entry.amount, 0), 0);
  }

  function getMitigatedIncomingDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType: DamageType = "physical"
  ) {
    let finalAmount = amount;
    const isHero = entity === state.hero;
    if (isHero && state.hero.amplify > 0) {
      finalAmount = Math.floor(finalAmount * 1.5);
    }
    if (!isHero) {
      return Math.max(0, Math.floor(finalAmount));
    }
    if (heroIsImmuneTo(state, damageType)) {
      return 0;
    }
    const resisted = Math.max(0, Math.floor(finalAmount) - getHeroResistance(state, damageType));
    return Math.max(0, resisted);
  }

  function dealDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType: DamageType = "physical"
  ) {
    if (!entity || !entity.alive) {
      return 0;
    }
    const debug = runtimeWindow.ROUGE_DEBUG;
    const isAlly = entity === state.hero || entity === state.mercenary;
    if (debug?.invulnerable && isAlly) {
      return 0;
    }
    if (debug?.oneHitKill && !isAlly) {
      entity.guard = 0;
      entity.life = 0;
      handleDefeat(state, entity);
      return entity.maxLife;
    }

    const damage = getMitigatedIncomingDamage(state, entity, amount, damageType);
    const blocked = Math.min(entity.guard, damage);
    entity.guard -= blocked;
    const lifeLoss = damage - blocked;
    entity.life = Math.max(0, entity.life - lifeLoss);
    trackLowestLife(state, entity);

    // Thorns / Lightning Enchanted: enemy deals damage back when hit
    if (!isAlly && (entity as CombatEnemyState).alive) {
      monsterActions.processModifierOnHit(state, entity as CombatEnemyState);
      if (hasTrait(entity as CombatEnemyState, "thorns")) {
        const thornsDamage = THORNS_DAMAGE;
        const heroLifeBefore = state.hero.life;
        const heroGuardBefore = state.hero.guard;
        dealDamage(state, state.hero, thornsDamage, "physical");
        const thornsDealt = (heroLifeBefore - state.hero.life) + (heroGuardBefore - state.hero.guard);
        if (thornsDealt > 0) {
          logCombat(state, {
            actor: "enemy", actorName: entity.name, actorId: (entity as CombatEnemyState).id,
            action: "trait", tone: "strike",
            message: `${entity.name}'s thorns deal ${thornsDealt} damage back!`,
            effects: [{ target: "hero", targetName: "the Wanderer", damage: thornsDealt, lifeAfter: state.hero.life, guardAfter: state.hero.guard }],
          });
        }
      }
    }

    if (entity.life <= 0 && entity.alive) {
      handleDefeat(state, entity);
    }
    return lifeLoss;
  }

  function dealDirectDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType: DamageType = "physical"
  ) {
    if (!entity || !entity.alive) {
      return 0;
    }
    const debug = runtimeWindow.ROUGE_DEBUG;
    const isAlly = entity === state.hero || entity === state.mercenary;
    if (debug?.invulnerable && isAlly) {
      return 0;
    }
    if (debug?.oneHitKill && !isAlly) {
      entity.life = 0;
      handleDefeat(state, entity);
      return entity.maxLife;
    }

    const damage = getMitigatedIncomingDamage(state, entity, amount, damageType);
    if (damage <= 0) {
      return 0;
    }
    const before = entity.life;
    entity.life = Math.max(0, entity.life - damage);
    trackLowestLife(state, entity);
    if (entity.life <= 0 && entity.alive) {
      handleDefeat(state, entity);
    }
    return before - entity.life;
  }

  function dealLifeDamage(state: CombatState, entity: CombatEnemyState, amount: number) {
    if (!entity || !entity.alive) {
      return 0;
    }
    const directDamage = Math.max(0, Math.floor(amount));
    if (directDamage <= 0) {
      return 0;
    }
    const before = entity.life;
    entity.life = Math.max(0, entity.life - directDamage);
    trackLowestLife(state, entity);
    if (entity.life <= 0 && entity.alive) {
      handleDefeat(state, entity);
    }
    return before - entity.life;
  }

  runtimeWindow.__ROUGE_COMBAT_ENGINE_DAMAGE = {
    hasTrait,
    healEntity,
    applyGuard,
    trackLowestLife,
    handleDefeat,
    dealDamage,
    dealDirectDamage,
    dealLifeDamage,
  };
})();
