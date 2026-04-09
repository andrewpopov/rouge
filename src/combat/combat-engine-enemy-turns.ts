(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const monsterActions = runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS;
  const { TRAIT } = monsterActions;
  const damageModule = runtimeWindow.__ROUGE_COMBAT_ENGINE_DAMAGE;
  const { hasTrait, healEntity, applyGuard, dealDamage, handleDefeat } = damageModule;

  const DEFAULT_ATTACK_INTENT_KINDS = new Set<EnemyIntentKind>([
    "attack",
    "attack_all",
    "attack_and_guard",
    "drain_attack",
    "sunder_attack",
    "attack_burn",
    "attack_burn_all",
    "attack_lightning",
    "attack_lightning_all",
    "attack_poison",
    "attack_poison_all",
    "attack_chill",
    "drain_energy",
  ]);
  const { ATTACK_INTENT_KINDS } = runtimeWindow.ROUGE_COMBAT_MODIFIERS || {
    ATTACK_INTENT_KINDS: DEFAULT_ATTACK_INTENT_KINDS,
  };

  const REGENERATION_AMOUNT = 2;

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

  function chooseEnemyTarget(state: CombatState, rule: EnemyIntentTarget | undefined) {
    if (rule === "mercenary" && state.mercenary.alive) {
      return state.mercenary;
    }
    if (rule === "lowest_life" && state.mercenary.alive && state.mercenary.life < state.hero.life) {
      return state.mercenary;
    }
    if (state.hero.alive) {
      return state.hero;
    }
    if (state.mercenary.alive) {
      return state.mercenary;
    }
    return null;
  }

  function resolveEnemyAction(state: CombatState, enemy: CombatEnemyState) {
    const intent = enemy.currentIntent;
    if (!intent || !enemy.alive) {
      return;
    }

    // -- Cooldown check: if current intent is on cooldown, use fallback attack --
    if (monsterActions.isIntentOnCooldown(enemy)) {
      const fallbackValue = Math.max(2, Math.floor(intent.value * 0.7));
      const target = chooseEnemyTarget(state, "hero");
      if (target) {
        const dealt = dealDamage(state, target, fallbackValue);
        logCombat(state, {
          actor: "enemy", actorName: enemy.name, actorId: enemy.id,
          action: "intent", tone: "strike",
          message: `${enemy.name} attacks ${target.name} for ${dealt}. (${intent.label} on cooldown)`,
          effects: [{ target: target === state.hero ? "hero" : "mercenary", targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard }],
        });
      }
      return;
    }

    // -- Passive: Regeneration --
    if (hasTrait(enemy, "regeneration")) {
      const regenAmount = REGENERATION_AMOUNT;
      const healed = healEntity(enemy, regenAmount);
      if (healed > 0) {
        logCombat(state, {
          actor: "enemy", actorName: enemy.name, actorId: enemy.id,
          action: "trait",
          message: `${enemy.name} regenerates ${healed} HP.`,
          effects: [{ target: "enemy", targetId: enemy.id, targetName: enemy.name, healing: healed, lifeAfter: enemy.life, guardAfter: enemy.guard }],
        });
      }
    }

    // -- DOT: Burn (fire) --
    if (enemy.burn > 0) {
      const burnDamage = dealDamage(state, enemy, enemy.burn);
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "status_tick",
        message: `${enemy.name} takes ${burnDamage} Burn damage.`,
        effects: [{ target: "enemy", targetId: enemy.id, targetName: enemy.name, damage: burnDamage, lifeAfter: enemy.life, guardAfter: enemy.guard }],
      });
      enemy.burn = Math.max(0, enemy.burn - 1);
      if (!enemy.alive) { return; }
    }

    // -- DOT: Poison (bypasses guard) --
    if (enemy.poison > 0) {
      const poisonDamage = Math.max(0, Math.floor(enemy.poison));
      enemy.life = Math.max(0, enemy.life - poisonDamage);
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "status_tick",
        message: `${enemy.name} takes ${poisonDamage} Poison damage.`,
        effects: [{ target: "enemy", targetId: enemy.id, targetName: enemy.name, damage: poisonDamage, lifeAfter: enemy.life, guardAfter: enemy.guard }],
      });
      enemy.poison = Math.max(0, enemy.poison - 1);
      if (enemy.life <= 0 && enemy.alive) {
        handleDefeat(state, enemy);
        return;
      }
    }

    const ignoresHardCrowdControl = intent.kind === "teleport";
    if (ignoresHardCrowdControl) {
      enemy.freeze = 0;
      enemy.stun = 0;
      enemy.slow = 0;
      enemy.paralyze = 0;
    }

    // -- CC: Freeze (skip turn) --
    if (!ignoresHardCrowdControl && enemy.freeze > 0) {
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "status_tick", tone: "status",
        message: `${enemy.name} is Frozen and cannot act.`,
      });
      enemy.freeze = Math.max(0, enemy.freeze - 1);
      return;
    }

    // -- CC: Stun (skip turn, consumed) --
    if (!ignoresHardCrowdControl && enemy.stun > 0) {
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "status_tick", tone: "status",
        message: `${enemy.name} is Stunned and cannot act.`,
      });
      enemy.stun = 0;
      return;
    }

    // -- Passive: Frenzy (below 50% HP = +50% attack) --
    const isFrenzied = hasTrait(enemy, "frenzy") && enemy.life <= Math.ceil(enemy.maxLife / 2);

    // -- Debuff: Paralyze (halve attack damage) --
    let intentValue = intent.value;

    // Apply buffed attack bonus from Overseer
    if (enemy.buffedAttack && enemy.buffedAttack > 0 && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue += enemy.buffedAttack;
      enemy.buffedAttack = 0;
    }

    if (isFrenzied && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue = Math.floor(intentValue * 1.5);
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "trait",
        message: `${enemy.name} is in a FRENZY!`,
      });
    }

    if (hasTrait(enemy, TRAIT.EXTRA_STRONG) && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue = Math.floor(intentValue * 1.5);
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "trait",
        message: `${enemy.name} hits with Extra Strong force!`,
      });
    }

    if (enemy.paralyze > 0) {
      if (ATTACK_INTENT_KINDS.has(intent.kind)) {
        intentValue = Math.max(1, Math.floor(intentValue / 2));
        logCombat(state, {
          actor: "enemy", actorName: enemy.name, actorId: enemy.id,
          action: "status_tick", tone: "status",
          message: `${enemy.name} is Paralyzed — attack weakened.`,
        });
      }
      enemy.paralyze = Math.max(0, enemy.paralyze - 1);
    }

    // -- Monster intent resolution (delegated to monster-actions module) --
    if (monsterActions.resolveMonsterIntent(state, enemy, intent, intentValue, chooseEnemyTarget, dealDamage, healEntity)) {
      return;
    }

    // -- Base intent handlers --

    if (intent.kind === "guard") {
      applyGuard(enemy, intent.value);
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "intent", actionId: intent.kind,
        message: `${enemy.name} uses ${intent.label} and gains ${intent.value} Guard.`,
        effects: [{ target: "enemy", targetId: enemy.id, targetName: enemy.name, guardApplied: intent.value, lifeAfter: enemy.life, guardAfter: enemy.guard }],
      });
      return;
    }

    if (intent.kind === "guard_allies") {
      const livingEnemies = getLivingEnemies(state);
      livingEnemies.forEach((livingEnemy: CombatEnemyState) => {
        applyGuard(livingEnemy, intent.value);
      });
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "intent", actionId: intent.kind,
        message: `${enemy.name} uses ${intent.label} and fortifies the enemy line.`,
        effects: livingEnemies.map((e: CombatEnemyState) => ({ target: "enemy" as const, targetId: e.id, targetName: e.name, guardApplied: intent.value, lifeAfter: e.life, guardAfter: e.guard })),
      });
      return;
    }

    if (intent.kind === "heal_ally") {
      const target =
        getLivingEnemies(state)
          .slice()
          .sort((left: CombatEnemyState, right: CombatEnemyState) => left.life - right.life)[0] || null;
      if (target) {
        const healed = healEntity(target, intent.value);
        logCombat(state, {
          actor: "enemy", actorName: enemy.name, actorId: enemy.id,
          action: "intent", actionId: intent.kind,
          message: `${enemy.name} uses ${intent.label} and heals ${target.name} for ${healed}.`,
          effects: [{ target: "enemy", targetId: target.id, targetName: target.name, healing: healed, lifeAfter: target.life, guardAfter: target.guard }],
        });
      }
      return;
    }

    if (intent.kind === "heal_allies") {
      const livingEnemies = getLivingEnemies(state);
      const healEffects: CombatLogEffect[] = [];
      const healedTargets = livingEnemies
        .map((target: CombatEnemyState) => {
          const healed = healEntity(target, intent.value);
          if (healed > 0) {
            healEffects.push({ target: "enemy", targetId: target.id, targetName: target.name, healing: healed, lifeAfter: target.life, guardAfter: target.guard });
          }
          return healed > 0 ? `${target.name} for ${healed}` : "";
        })
        .filter(Boolean);
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "intent", actionId: intent.kind,
        message: healedTargets.length > 0
          ? `${enemy.name} uses ${intent.label} and restores ${healedTargets.join(", ")}.`
          : `${enemy.name} uses ${intent.label}, but the enemy line is already healthy.`,
        effects: healEffects,
      });
      return;
    }

    if (intent.kind === "heal_and_guard") {
      const target =
        getLivingEnemies(state)
          .slice()
          .sort((left: CombatEnemyState, right: CombatEnemyState) => left.life - right.life)[0] || null;
      const healed = target ? healEntity(target, intent.value) : 0;
      const guardGained = applyGuard(enemy, intent.secondaryValue || Math.max(2, Math.ceil(intent.value / 2)));
      const healGuardEffects: CombatLogEffect[] = [
        { target: "enemy", targetId: enemy.id, targetName: enemy.name, guardApplied: guardGained, lifeAfter: enemy.life, guardAfter: enemy.guard },
      ];
      if (target && healed > 0) {
        healGuardEffects.unshift({ target: "enemy", targetId: target.id, targetName: target.name, healing: healed, lifeAfter: target.life, guardAfter: target.guard });
      }
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "intent", actionId: intent.kind,
        message: target
          ? `${enemy.name} uses ${intent.label}, restoring ${target.name} for ${healed} and gaining ${guardGained} Guard.`
          : `${enemy.name} uses ${intent.label} and gains ${guardGained} Guard.`,
        effects: healGuardEffects,
      });
      return;
    }

    if (intent.kind === "attack_all") {
      const partyTargets = [state.hero, state.mercenary].filter((target: CombatHeroState | CombatMercenaryState) => target?.alive);
      const attackAllEffects: CombatLogEffect[] = [];
      const segments = partyTargets.map((target) => {
        const dealt = dealDamage(state, target, intentValue);
        attackAllEffects.push({ target: target === state.hero ? "hero" : "mercenary", targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard });
        return `${target.name} for ${dealt}`;
      });
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "intent", actionId: intent.kind,
        message: `${enemy.name} uses ${intent.label} on ${segments.join(" and ")}.`,
        effects: attackAllEffects,
      });
      return;
    }

    if (intent.kind === "attack_and_guard") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intentValue);
      const guardGained = applyGuard(enemy, intent.secondaryValue || Math.max(2, Math.ceil(intentValue / 2)));
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "intent", actionId: intent.kind,
        message: `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and gains ${guardGained} Guard.`,
        effects: [
          { target: target === state.hero ? "hero" : "mercenary", targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard },
          { target: "enemy", targetId: enemy.id, targetName: enemy.name, guardApplied: guardGained, lifeAfter: enemy.life, guardAfter: enemy.guard },
        ],
      });
      return;
    }

    if (intent.kind === "sunder_attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const removedGuard = target.guard;
      target.guard = 0;
      const dealt = dealDamage(state, target, intentValue);
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "intent", actionId: intent.kind,
        message: `${enemy.name} uses ${intent.label}, shattering ${removedGuard} Guard and hitting ${target.name} for ${dealt}.`,
        effects: [{ target: target === state.hero ? "hero" : "mercenary", targetName: target.name, damage: dealt, guardDamage: removedGuard, lifeAfter: target.life, guardAfter: target.guard }],
      });
      return;
    }

    if (intent.kind === "drain_attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intentValue);
      const healed = healEntity(enemy, intent.secondaryValue || Math.max(1, Math.ceil(dealt / 2)));
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "intent", actionId: intent.kind,
        message: `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and heals ${healed}.`,
        effects: [
          { target: target === state.hero ? "hero" : "mercenary", targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard },
          { target: "enemy", targetId: enemy.id, targetName: enemy.name, healing: healed, lifeAfter: enemy.life, guardAfter: enemy.guard },
        ],
      });
      return;
    }

    if (intent.kind === "attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intentValue);
      logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "intent", actionId: intent.kind,
        message: `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt}.`,
        effects: [{ target: target === state.hero ? "hero" : "mercenary", targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard }],
      });
    }
  }

  function advanceEnemyIntents(state: CombatState) {
    state.enemies.forEach((enemy: CombatEnemyState) => {
      if (!enemy.alive) {
        return;
      }
      // Tick cooldowns each turn
      monsterActions.tickCooldowns(enemy);

      // Slow: enemy repeats current intent instead of advancing
      if (enemy.slow > 0) {
        enemy.slow = Math.max(0, enemy.slow - 1);
        return;
      }
      enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intents.length;
      enemy.currentIntent = { ...enemy.intents[enemy.intentIndex] };
    });
  }

  runtimeWindow.__ROUGE_COMBAT_ENGINE_ENEMY_TURNS = {
    chooseEnemyTarget,
    resolveEnemyAction,
    advanceEnemyIntents,
  };
})();
