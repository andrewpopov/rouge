(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp } = runtimeWindow.ROUGE_UTILS;

  function appendLog(state, message) {
    state.log.unshift(message);
    state.log = state.log.slice(0, runtimeWindow.ROUGE_LIMITS.COMBAT_LOG_SIZE);
  }

  function getLivingEnemies(state) {
    return state.enemies.filter((enemy) => enemy.alive);
  }

  function getFirstLivingEnemyId(state) {
    return getLivingEnemies(state)[0]?.id || "";
  }

  function healEntity(entity, amount) {
    if (!entity || !entity.alive) {
      return 0;
    }
    const before = entity.life;
    entity.life = clamp(entity.life + amount, 0, entity.maxLife);
    return entity.life - before;
  }

  function applyGuard(entity, amount) {
    if (!entity || !entity.alive) {
      return 0;
    }
    entity.guard = Math.max(0, entity.guard + amount);
    return amount;
  }

  function handleDefeat(state, entity) {
    entity.alive = false;
    entity.guard = 0;
    if (entity.burn) {
      entity.burn = 0;
    }
    appendLog(state, `${entity.name} falls.`);
  }

  function dealDamage(state, entity, amount) {
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
    const damage = Math.max(0, Math.floor(amount));
    const blocked = Math.min(entity.guard, damage);
    entity.guard -= blocked;
    const lifeLoss = damage - blocked;
    entity.life = Math.max(0, entity.life - lifeLoss);
    if (entity.life <= 0 && entity.alive) {
      handleDefeat(state, entity);
    }
    return lifeLoss;
  }

  function checkOutcome(state) {
    if (!state.hero.alive || state.hero.life <= 0) {
      state.phase = "defeat";
      state.outcome = "defeat";
      appendLog(state, "The Wanderer falls. Encounter lost.");
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

  function chooseMercenaryTarget(state) {
    const livingEnemies = getLivingEnemies(state);
    const marked = livingEnemies.find((enemy) => enemy.id === state.mercenary.markedEnemyId);
    if (marked) {
      return marked;
    }

    if (state.mercenary.behavior === "backline_hunter") {
      const backlineTarget =
        livingEnemies.find((enemy) => enemy.role === "support") ||
        livingEnemies.find((enemy) => enemy.role === "ranged") ||
        null;
      if (backlineTarget) {
        return backlineTarget;
      }
    }

    if (state.mercenary.behavior === "guard_breaker") {
      const guardedTarget =
        livingEnemies
          .slice()
          .sort((left, right) => right.guard - left.guard)[0] || null;
      if (guardedTarget?.guard > 0) {
        return guardedTarget;
      }
    }

    if (state.mercenary.behavior === "boss_hunter") {
      const priorityTarget =
        livingEnemies.find((enemy) => enemy.templateId.endsWith("_boss")) ||
        livingEnemies.find((enemy) => enemy.templateId.includes("_elite")) ||
        null;
      if (priorityTarget) {
        return priorityTarget;
      }
    }

    if (state.mercenary.behavior === "wounded_hunter") {
      const woundedTarget =
        livingEnemies
          .slice()
          .sort((left, right) => {
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

    const selected = livingEnemies.find((enemy) => enemy.id === state.selectedEnemyId);
    if (selected) {
      return selected;
    }

    return livingEnemies.slice().sort((left, right) => left.life - right.life)[0] || null;
  }

  function resolveMercenaryAction(state) {
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
    if (state.mercenary.behavior === "backline_hunter" && (target.role === "support" || target.role === "ranged")) {
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

  function chooseEnemyTarget(state, rule) {
    if (rule === "lowest_life" && state.mercenary.alive && state.mercenary.life < state.hero.life) {
      return state.mercenary;
    }
    return state.hero.alive ? state.hero : state.mercenary;
  }

  function resolveEnemyAction(state, enemy) {
    const intent = enemy.currentIntent;
    if (!intent || !enemy.alive) {
      return;
    }

    if (enemy.burn > 0) {
      const burnDamage = dealDamage(state, enemy, enemy.burn);
      appendLog(state, `${enemy.name} takes ${burnDamage} Burn damage.`);
      enemy.burn = Math.max(0, enemy.burn - 1);
      if (!enemy.alive) {
        return;
      }
    }

    if (intent.kind === "guard") {
      applyGuard(enemy, intent.value);
      appendLog(state, `${enemy.name} uses ${intent.label} and gains ${intent.value} Guard.`);
      return;
    }

    if (intent.kind === "guard_allies") {
      const livingEnemies = getLivingEnemies(state);
      livingEnemies.forEach((livingEnemy) => {
        applyGuard(livingEnemy, intent.value);
      });
      appendLog(state, `${enemy.name} uses ${intent.label} and fortifies the enemy line.`);
      return;
    }

    if (intent.kind === "heal_ally") {
      const target =
        getLivingEnemies(state)
          .slice()
          .sort((left, right) => left.life - right.life)[0] || null;
      if (target) {
        const healed = healEntity(target, intent.value);
        appendLog(state, `${enemy.name} uses ${intent.label} and heals ${target.name} for ${healed}.`);
      }
      return;
    }

    if (intent.kind === "heal_allies") {
      const livingEnemies = getLivingEnemies(state);
      const healedTargets = livingEnemies
        .map((target) => {
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
          .sort((left, right) => left.life - right.life)[0] || null;
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
      const partyTargets = [state.hero, state.mercenary].filter((target) => target?.alive);
      const segments = partyTargets.map((target) => {
        const dealt = dealDamage(state, target, intent.value);
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
      const dealt = dealDamage(state, target, intent.value);
      const guardGained = applyGuard(enemy, intent.secondaryValue || Math.max(2, Math.ceil(intent.value / 2)));
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
      const dealt = dealDamage(state, target, intent.value);
      appendLog(state, `${enemy.name} uses ${intent.label}, shattering ${removedGuard} Guard and hitting ${target.name} for ${dealt}.`);
      return;
    }

    if (intent.kind === "drain_attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intent.value);
      const healed = healEntity(enemy, intent.secondaryValue || Math.max(1, Math.ceil(dealt / 2)));
      appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and heals ${healed}.`);
      return;
    }

    if (intent.kind === "attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intent.value);
      appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt}.`);
    }
  }

  function advanceEnemyIntents(state) {
    state.enemies.forEach((enemy) => {
      if (!enemy.alive) {
        return;
      }
      enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intents.length;
      enemy.currentIntent = { ...enemy.intents[enemy.intentIndex] };
    });
  }

  function drawCards(state, amount) {
    const shuffleCards = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS._shuffleInPlace;
    let drawn = 0;
    for (let index = 0; index < amount; index += 1) {
      if (state.drawPile.length === 0 && state.discardPile.length > 0) {
        state.drawPile = shuffleCards([...state.discardPile], state.randomFn);
        state.discardPile = [];
      }
      if (state.drawPile.length === 0) {
        break;
      }
      state.hand.push(state.drawPile.pop());
      drawn += 1;
    }
    return drawn;
  }

  function discardHand(state) {
    if (state.hand.length === 0) {
      return;
    }
    state.discardPile.push(...state.hand);
    state.hand = [];
  }

  function shuffleInPlace(items, randomFn) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(randomFn() * (index + 1));
      const temp = items[index];
      items[index] = items[swapIndex];
      items[swapIndex] = temp;
    }
    return items;
  }

  function meleeStrike(state, _content) {
    if (state.phase !== "player" || state.outcome) {
      return { ok: false, message: "Cannot melee right now." };
    }
    if (state.meleeUsed) {
      return { ok: false, message: "Melee already used this turn." };
    }
    const baseDamage = Math.max(1, state.weaponDamageBonus || 0);
    const preferred = Array.isArray(state.classPreferredFamilies) ? state.classPreferredFamilies : [];
    const familyMatch = preferred.includes(state.weaponFamily || "");
    const damage = familyMatch ? baseDamage + 2 : baseDamage;
    const target = state.enemies.find((e) => e.id === state.selectedEnemyId && e.alive) || getLivingEnemies(state)[0];
    if (!target) {
      return { ok: false, message: "No living enemy." };
    }
    const dealt = dealDamage(state, target, damage);
    state.meleeUsed = true;
    appendLog(state, `Melee strike hits ${target.name} for ${dealt}${familyMatch ? " (proficient)" : ""}.`);
    checkOutcome(state);
    return { ok: true, message: "Melee strike landed." };
  }

  function startPlayerTurn(state) {
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
    state.hero.energy = state.hero.maxEnergy;
    drawCards(state, Math.max(0, state.hero.handSize - state.hand.length));
    if (!getLivingEnemies(state).some((enemy) => enemy.id === state.selectedEnemyId)) {
      state.selectedEnemyId = getFirstLivingEnemyId(state);
    }
    appendLog(state, `Turn ${state.turn} begins.`);
  }

  function endTurn(state) {
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
      if (checkOutcome(state)) {
        return { ok: true, message: "Encounter resolved." };
      }
    }

    advanceEnemyIntents(state);
    if (!checkOutcome(state)) {
      startPlayerTurn(state);
    }
    return { ok: true, message: "Enemy phase complete." };
  }

  function usePotion(state, targetId) {
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
