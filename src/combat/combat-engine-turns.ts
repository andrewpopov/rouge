(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp } = runtimeWindow.ROUGE_UTILS;
  const monsterActions = runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS;
  const { D2_MOD } = monsterActions;
  const mercenaryModule = runtimeWindow.__ROUGE_COMBAT_MERCENARY;

  function appendLog(state: CombatState, message: string) {
    state.log.unshift(message);
    state.log = state.log.slice(0, runtimeWindow.ROUGE_LIMITS.COMBAT_LOG_SIZE);
  }

  function getLivingEnemies(state: CombatState) {
    return state.enemies.filter((enemy: CombatEnemyState) => enemy.alive);
  }

  function getFirstLivingEnemyId(state: CombatState) {
    return getLivingEnemies(state)[0]?.id || "";
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
    appendLog(state, `${entity.name} falls.`);

    // Process death traits for enemies
    if (isEnemy) {
      monsterActions.processDeathTraits(state, entity as CombatEnemyState);

      // Flee on ally death: mark Fallen-type allies to skip their next action
      const deadEnemy = entity as CombatEnemyState;
      getLivingEnemies(state).forEach((ally: CombatEnemyState) => {
        if (ally.id !== deadEnemy.id && hasTrait(ally, "flee_on_ally_death")) {
          ally.stun = Math.max(ally.stun, 1);
          appendLog(state, `${ally.name} panics and flees!`);
        }
      });
    }
  }

  function dealDamage(state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) {
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

    let finalAmount = amount;
    // Amplify: hero takes +50% damage
    if (isAlly && entity === state.hero && state.hero.amplify > 0) {
      finalAmount = Math.floor(finalAmount * 1.5);
    }

    const damage = Math.max(0, Math.floor(finalAmount));
    const blocked = Math.min(entity.guard, damage);
    entity.guard -= blocked;
    const lifeLoss = damage - blocked;
    entity.life = Math.max(0, entity.life - lifeLoss);

    // Thorns / Lightning Enchanted: enemy deals damage back when hit
    if (!isAlly && (entity as CombatEnemyState).alive) {
      monsterActions.processModifierOnHit(state, entity as CombatEnemyState);
      if (hasTrait(entity as CombatEnemyState, "thorns")) {
        const thornsDamage = 2;
        const heroBefore = state.hero.life;
        state.hero.life = Math.max(0, state.hero.life - thornsDamage);
        const thornsDealt = heroBefore - state.hero.life;
        if (thornsDealt > 0) {
          appendLog(state, `${entity.name}'s thorns deal ${thornsDealt} damage back!`);
        }
        if (state.hero.life <= 0 && state.hero.alive) {
          state.hero.alive = false;
          state.hero.guard = 0;
          appendLog(state, "The Wanderer falls. Encounter lost.");
        }
      }
    }

    if (entity.life <= 0 && entity.alive) {
      handleDefeat(state, entity);
    }
    return lifeLoss;
  }

  function checkOutcome(state: CombatState) {
    if (!state.hero.alive || state.hero.life <= 0) {
      state.phase = "defeat";
      state.outcome = "defeat";
      if (!state.log.some((l: string) => l.includes("Encounter lost"))) {
        appendLog(state, "The Wanderer falls. Encounter lost.");
      }
      return true;
    }
    if (getLivingEnemies(state).length === 0) {
      state.phase = "victory";
      state.outcome = "victory";
      appendLog(state, `${state.encounter.name} cleared.`);
      return true;
    }
    return false;
  }

  function resolveMercenaryAction(state: CombatState) {
    mercenaryModule.resolveMercenaryAction(state, appendLog, dealDamage, applyGuard, getFirstLivingEnemyId);
  }

  function chooseEnemyTarget(state: CombatState, rule: EnemyIntentTarget | undefined) {
    if (rule === "lowest_life" && state.mercenary.alive && state.mercenary.life < state.hero.life) {
      return state.mercenary;
    }
    return state.hero.alive ? state.hero : state.mercenary;
  }

  function resolveEnemyAction(state: CombatState, enemy: CombatEnemyState) {
    const intent = enemy.currentIntent;
    if (!intent || !enemy.alive) {
      return;
    }

    // ── Cooldown check: if current intent is on cooldown, use fallback attack ──
    if (monsterActions.isIntentOnCooldown(enemy)) {
      const fallbackValue = Math.max(2, Math.floor(intent.value * 0.7));
      const target = chooseEnemyTarget(state, "hero");
      if (target) {
        const dealt = dealDamage(state, target, fallbackValue);
        appendLog(state, `${enemy.name} attacks ${target.name} for ${dealt}. (${intent.label} on cooldown)`);
      }
      return;
    }

    // ── Passive: Regeneration ──
    if (hasTrait(enemy, "regeneration")) {
      const regenAmount = 2;
      const healed = healEntity(enemy, regenAmount);
      if (healed > 0) {
        appendLog(state, `${enemy.name} regenerates ${healed} HP.`);
      }
    }

    // ── DOT: Burn (fire) ──
    if (enemy.burn > 0) {
      const burnDamage = dealDamage(state, enemy, enemy.burn);
      appendLog(state, `${enemy.name} takes ${burnDamage} Burn damage.`);
      enemy.burn = Math.max(0, enemy.burn - 1);
      if (!enemy.alive) { return; }
    }

    // ── DOT: Poison (bypasses guard) ──
    if (enemy.poison > 0) {
      const poisonDamage = Math.max(0, Math.floor(enemy.poison));
      enemy.life = Math.max(0, enemy.life - poisonDamage);
      appendLog(state, `${enemy.name} takes ${poisonDamage} Poison damage.`);
      enemy.poison = Math.max(0, enemy.poison - 1);
      if (enemy.life <= 0 && enemy.alive) {
        handleDefeat(state, enemy);
        return;
      }
    }

    // ── CC: Freeze (skip turn) ──
    if (enemy.freeze > 0) {
      appendLog(state, `${enemy.name} is Frozen and cannot act.`);
      enemy.freeze = Math.max(0, enemy.freeze - 1);
      return;
    }

    // ── CC: Stun (skip turn, consumed) ──
    if (enemy.stun > 0) {
      appendLog(state, `${enemy.name} is Stunned and cannot act.`);
      enemy.stun = 0;
      return;
    }

    // ── Passive: Frenzy (below 50% HP = +50% attack) ──
    const isFrenzied = hasTrait(enemy, "frenzy") && enemy.life <= Math.ceil(enemy.maxLife / 2);

    // ── Debuff: Paralyze (halve attack damage) ──
    const ATTACK_INTENTS = ["attack", "attack_all", "attack_and_guard", "sunder_attack", "drain_attack", "attack_burn", "attack_burn_all", "attack_poison", "attack_chill", "drain_energy"];
    let intentValue = intent.value;

    // Apply buffed attack bonus from Overseer
    if (enemy.buffedAttack && enemy.buffedAttack > 0 && ATTACK_INTENTS.includes(intent.kind)) {
      intentValue += enemy.buffedAttack;
      enemy.buffedAttack = 0;
    }

    if (isFrenzied && ATTACK_INTENTS.includes(intent.kind)) {
      intentValue = Math.floor(intentValue * 1.5);
      appendLog(state, `${enemy.name} is in a FRENZY!`);
    }

    if (hasTrait(enemy, D2_MOD.EXTRA_STRONG) && ATTACK_INTENTS.includes(intent.kind)) {
      intentValue = Math.floor(intentValue * 1.5);
      appendLog(state, `${enemy.name} hits with Extra Strong force!`);
    }

    if (enemy.paralyze > 0) {
      if (ATTACK_INTENTS.includes(intent.kind)) {
        intentValue = Math.max(1, Math.floor(intentValue / 2));
        appendLog(state, `${enemy.name} is Paralyzed — attack weakened.`);
      }
      enemy.paralyze = Math.max(0, enemy.paralyze - 1);
    }

    // ── D2 monster intent resolution (delegated to monster-actions module) ──
    if (monsterActions.resolveMonsterIntent(state, enemy, intent, intentValue, chooseEnemyTarget, dealDamage, healEntity)) {
      return;
    }

    // ── Base intent handlers ──

    if (intent.kind === "guard") {
      applyGuard(enemy, intent.value);
      appendLog(state, `${enemy.name} uses ${intent.label} and gains ${intent.value} Guard.`);
      return;
    }

    if (intent.kind === "guard_allies") {
      const livingEnemies = getLivingEnemies(state);
      livingEnemies.forEach((livingEnemy: CombatEnemyState) => {
        applyGuard(livingEnemy, intent.value);
      });
      appendLog(state, `${enemy.name} uses ${intent.label} and fortifies the enemy line.`);
      return;
    }

    if (intent.kind === "heal_ally") {
      const target =
        getLivingEnemies(state)
          .slice()
          .sort((left: CombatEnemyState, right: CombatEnemyState) => left.life - right.life)[0] || null;
      if (target) {
        const healed = healEntity(target, intent.value);
        appendLog(state, `${enemy.name} uses ${intent.label} and heals ${target.name} for ${healed}.`);
      }
      return;
    }

    if (intent.kind === "heal_allies") {
      const livingEnemies = getLivingEnemies(state);
      const healedTargets = livingEnemies
        .map((target: CombatEnemyState) => {
          const healed = healEntity(target, intent.value);
          return healed > 0 ? `${target.name} for ${healed}` : "";
        })
        .filter(Boolean);
      appendLog(
        state,
        healedTargets.length > 0
          ? `${enemy.name} uses ${intent.label} and restores ${healedTargets.join(", ")}.`
          : `${enemy.name} uses ${intent.label}, but the enemy line is already healthy.`
      );
      return;
    }

    if (intent.kind === "heal_and_guard") {
      const target =
        getLivingEnemies(state)
          .slice()
          .sort((left: CombatEnemyState, right: CombatEnemyState) => left.life - right.life)[0] || null;
      const healed = target ? healEntity(target, intent.value) : 0;
      const guardGained = applyGuard(enemy, intent.secondaryValue || Math.max(2, Math.ceil(intent.value / 2)));
      appendLog(
        state,
        target
          ? `${enemy.name} uses ${intent.label}, restoring ${target.name} for ${healed} and gaining ${guardGained} Guard.`
          : `${enemy.name} uses ${intent.label} and gains ${guardGained} Guard.`
      );
      return;
    }

    if (intent.kind === "attack_all") {
      const partyTargets = [state.hero, state.mercenary].filter((target: CombatHeroState | CombatMercenaryState) => target?.alive);
      const segments = partyTargets.map((target) => {
        const dealt = dealDamage(state, target, intentValue);
        return `${target.name} for ${dealt}`;
      });
      appendLog(state, `${enemy.name} uses ${intent.label} on ${segments.join(" and ")}.`);
      return;
    }

    if (intent.kind === "attack_and_guard") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intentValue);
      const guardGained = applyGuard(enemy, intent.secondaryValue || Math.max(2, Math.ceil(intentValue / 2)));
      appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and gains ${guardGained} Guard.`);
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
      appendLog(state, `${enemy.name} uses ${intent.label}, shattering ${removedGuard} Guard and hitting ${target.name} for ${dealt}.`);
      return;
    }

    if (intent.kind === "drain_attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intentValue);
      const healed = healEntity(enemy, intent.secondaryValue || Math.max(1, Math.ceil(dealt / 2)));
      appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and heals ${healed}.`);
      return;
    }

    if (intent.kind === "attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intentValue);
      appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt}.`);
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

  function drawCards(state: CombatState, amount: number) {
    let drawn = 0;
    for (let index = 0; index < amount; index += 1) {
      if (state.drawPile.length === 0 && state.discardPile.length > 0) {
        state.drawPile = shuffleInPlace([...state.discardPile], state.randomFn);
        state.discardPile = [];
      }
      if (state.drawPile.length === 0) {
        break;
      }
      const card = state.drawPile.pop();
      if (card) {
        state.hand.push(card);
      }
      drawn += 1;
    }
    return drawn;
  }

  function discardHand(state: CombatState) {
    if (state.hand.length === 0) {
      return;
    }
    state.discardPile.push(...state.hand);
    state.hand = [];
  }

  function shuffleInPlace<T>(items: T[], randomFn: RandomFn) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(randomFn() * (index + 1));
      const temp = items[index];
      items[index] = items[swapIndex];
      items[swapIndex] = temp;
    }
    return items;
  }

  function meleeStrike(state: CombatState, _content: GameContent) {
    if (state.phase !== "player" || state.outcome) {
      return { ok: false, message: "Cannot melee right now." };
    }
    if (state.meleeUsed) {
      return { ok: false, message: "Melee already used this turn." };
    }
    const baseDamage = Math.max(1, state.weaponDamageBonus || 0);
    const preferred = Array.isArray(state.classPreferredFamilies) ? state.classPreferredFamilies : [];
    const familyMatch = preferred.includes(state.weaponFamily || "");
    let damage = familyMatch ? baseDamage + 2 : baseDamage;
    // Weaken: hero deals -30% damage
    if (state.hero.weaken > 0) {
      damage = Math.max(1, Math.floor(damage * 0.7));
    }
    const target = state.enemies.find((e: CombatEnemyState) => e.id === state.selectedEnemyId && e.alive) || getLivingEnemies(state)[0];
    if (!target) {
      return { ok: false, message: "No living enemy." };
    }
    const dealt = dealDamage(state, target, damage);
    state.meleeUsed = true;
    appendLog(state, `Melee strike hits ${target.name} for ${dealt}${familyMatch ? " (proficient)" : ""}.`);
    checkOutcome(state);
    return { ok: true, message: "Melee strike landed." };
  }

  function startPlayerTurn(state: CombatState) {
    if (state.outcome) {
      return;
    }
    state.phase = "player";
    state.turn += 1;
    state.meleeUsed = false;
    state.hero.guard = 0;
    if (state.mercenary.alive) {
      state.mercenary.guard = 0;
    }

    // Process hero debuffs at turn start (before drawing)
    if (state.turn > 1) {
      monsterActions.processHeroDebuffs(state);
      if (!state.hero.alive) {
        state.phase = "defeat";
        state.outcome = "defeat";
        appendLog(state, "The Wanderer falls. Encounter lost.");
        return;
      }
    }

    // Energy: apply energy drain
    let energyThisTurn = state.hero.maxEnergy;
    if (state.hero.energyDrain > 0 && state.turn > 1) {
      energyThisTurn = Math.max(1, energyThisTurn - 1);
    }
    state.hero.energy = energyThisTurn;

    // Card draw: apply chill (draw 1 fewer)
    let drawCount = Math.max(0, state.hero.handSize - state.hand.length);
    if (state.hero.chill > 0 && state.turn > 1) {
      drawCount = Math.max(0, drawCount - 1);
    }
    drawCards(state, drawCount);

    if (!getLivingEnemies(state).some((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId)) {
      state.selectedEnemyId = getFirstLivingEnemyId(state);
    }
    appendLog(state, `Turn ${state.turn} begins.`);
  }

  function endTurn(state: CombatState) {
    if (state.phase !== "player" || state.outcome) {
      return { ok: false, message: "The turn cannot end right now." };
    }

    discardHand(state);
    state.phase = "enemy";
    resolveMercenaryAction(state);
    if (checkOutcome(state)) {
      return { ok: true, message: "Encounter resolved." };
    }

    const enemiesToAct = getLivingEnemies(state);
    for (let index = 0; index < enemiesToAct.length; index += 1) {
      const enemy = enemiesToAct[index];
      resolveEnemyAction(state, enemy);
      if (enemy.alive) {
        monsterActions.processModifierOnAttack(state, enemy);
      }
      if (checkOutcome(state)) {
        return { ok: true, message: "Encounter resolved." };
      }

      // Swift / Extra Fast trait: execute action a second time
      if ((hasTrait(enemy, "swift") || hasTrait(enemy, D2_MOD.EXTRA_FAST)) && enemy.alive) {
        const label = hasTrait(enemy, "swift") ? "Swift" : "Extra Fast";
        appendLog(state, `${enemy.name} strikes again! (${label})`);
        resolveEnemyAction(state, enemy);
        if (enemy.alive) {
          monsterActions.processModifierOnAttack(state, enemy);
        }
        if (checkOutcome(state)) {
          return { ok: true, message: "Encounter resolved." };
        }
      }
    }

    advanceEnemyIntents(state);
    if (!checkOutcome(state)) {
      startPlayerTurn(state);
    }
    return { ok: true, message: "Enemy phase complete." };
  }

  function usePotion(state: CombatState, targetId: "hero" | "mercenary") {
    if (state.outcome) {
      return { ok: false, message: "The encounter is already over." };
    }
    if (state.potions <= 0) {
      return { ok: false, message: "No potions left." };
    }

    const target = targetId === "mercenary" ? state.mercenary : state.hero;
    if (!target.alive) {
      return { ok: false, message: "Cannot heal a downed ally." };
    }
    if (target.life >= target.maxLife) {
      return { ok: false, message: "Target is already at full life." };
    }

    state.potions -= 1;
    const healed = healEntity(target, state.hero.potionHeal);
    appendLog(state, `Potion used on ${target.name} for ${healed}.`);
    return { ok: true, message: "Potion used." };
  }

  runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS = {
    healEntity,
    applyGuard,
    dealDamage,
    checkOutcome,
    getLivingEnemies,
    getFirstLivingEnemyId,
    appendLog,
    drawCards,
    discardHand,
    meleeStrike,
    startPlayerTurn,
    endTurn,
    usePotion,
    resolveMercenaryAction,
    resolveEnemyAction,
    advanceEnemyIntents,
    _shuffleInPlace: shuffleInPlace,
  };
})();
