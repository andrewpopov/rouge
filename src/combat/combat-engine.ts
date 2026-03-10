(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function parseInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : fallback;
  }

  function appendLog(state, message) {
    state.log.unshift(message);
    state.log = state.log.slice(0, 18);
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

  function makeCardInstance(state, cardId) {
    const instanceId = `card_${state.nextCardInstanceId}`;
    state.nextCardInstanceId += 1;
    return { instanceId, cardId };
  }

  function createHero(content, heroState = null) {
    const definition = {
      ...content.hero,
      ...(heroState && typeof heroState === "object" ? heroState : {}),
    };
    const maxLife = Math.max(1, parseInteger(definition.maxLife, content.hero.maxLife || 1));
    const maxEnergy = Math.max(1, parseInteger(definition.maxEnergy, content.hero.maxEnergy || 1));
    const handSize = Math.max(1, parseInteger(definition.handSize, content.hero.handSize || 1));
    const potionHeal = Math.max(1, parseInteger(definition.potionHeal, content.hero.potionHeal || 1));
    const life = clamp(parseInteger(heroState?.life ?? heroState?.currentLife, maxLife), 0, maxLife);
    return {
      ...definition,
      maxLife,
      maxEnergy,
      handSize,
      potionHeal,
      life,
      guard: 0,
      energy: maxEnergy,
      alive: life > 0,
      damageBonus: Math.max(0, parseInteger(definition.damageBonus, 0)),
      guardBonus: Math.max(0, parseInteger(definition.guardBonus, 0)),
      burnBonus: Math.max(0, parseInteger(definition.burnBonus, 0)),
    };
  }

  function createMercenary(content, mercenaryId, mercenaryState = null) {
    const definition = content.mercenaryCatalog[mercenaryId];
    const merged = {
      ...definition,
      ...(mercenaryState && typeof mercenaryState === "object" ? mercenaryState : {}),
    };
    const maxLife = Math.max(1, parseInteger(merged.maxLife, definition.maxLife || 1));
    const life = clamp(parseInteger(mercenaryState?.life ?? mercenaryState?.currentLife, maxLife), 0, maxLife);
    return {
      ...merged,
      maxLife,
      life,
      guard: 0,
      alive: life > 0,
      nextAttackBonus: 0,
      markedEnemyId: "",
      markBonus: 0,
      contractAttackBonus: Math.max(0, parseInteger(merged.contractAttackBonus, 0)),
      contractBehaviorBonus: Math.max(0, parseInteger(merged.contractBehaviorBonus, 0)),
      contractStartGuard: Math.max(0, parseInteger(merged.contractStartGuard, 0)),
      contractHeroDamageBonus: Math.max(0, parseInteger(merged.contractHeroDamageBonus, 0)),
      contractHeroStartGuard: Math.max(0, parseInteger(merged.contractHeroStartGuard, 0)),
      contractOpeningDraw: Math.max(0, parseInteger(merged.contractOpeningDraw, 0)),
      contractPerkLabels: Array.isArray(merged.contractPerkLabels) ? [...merged.contractPerkLabels] : [],
    };
  }

  function createEnemy(content, enemyEntry) {
    const template = content.enemyCatalog[enemyEntry.templateId];
    return {
      id: enemyEntry.id,
      templateId: template.templateId,
      name: template.name,
      role: template.role || "",
      maxLife: template.maxLife,
      life: template.maxLife,
      guard: 0,
      burn: 0,
      alive: true,
      intentIndex: 0,
      currentIntent: { ...template.intents[0] },
      intents: template.intents.map((intent) => ({ ...intent })),
    };
  }

  function createDeck(state, content, starterDeck = null) {
    const deckSource = Array.isArray(starterDeck) && starterDeck.length > 0 ? starterDeck : content.starterDeck;
    const deck = deckSource.map((cardId) => makeCardInstance(state, cardId));
    return shuffleInPlace(deck, state.randomFn);
  }

  function getCardDefinition(content, cardId) {
    return content.cardCatalog[cardId] || null;
  }

  function getLivingEnemies(state) {
    return state.enemies.filter((enemy) => enemy.alive);
  }

  function getFirstLivingEnemyId(state) {
    return getLivingEnemies(state)[0]?.id || "";
  }

  function drawCards(state, amount) {
    let drawn = 0;
    for (let index = 0; index < amount; index += 1) {
      if (state.drawPile.length === 0 && state.discardPile.length > 0) {
        state.drawPile = shuffleInPlace([...state.discardPile], state.randomFn);
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
    // Invulnerable: hero and mercenary take no damage
    const isAlly = entity === state.hero || entity === state.mercenary;
    if (debug?.invulnerable && isAlly) {
      return 0;
    }
    // One-hit kill: enemies die instantly
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

  function describeIntent(intent) {
    if (!intent) {
      return "No action";
    }
    if (intent.kind === "attack") {
      return `${intent.label}: ${intent.value} damage`;
    }
    if (intent.kind === "attack_all") {
      return `${intent.label}: ${intent.value} damage to both allies`;
    }
    if (intent.kind === "attack_and_guard") {
      return `${intent.label}: ${intent.value} damage, then gain Guard`;
    }
    if (intent.kind === "drain_attack") {
      return `${intent.label}: ${intent.value} damage and self-heal`;
    }
    if (intent.kind === "guard") {
      return `${intent.label}: +${intent.value} Guard`;
    }
    if (intent.kind === "guard_allies") {
      return `${intent.label}: +${intent.value} Guard to all enemies`;
    }
    if (intent.kind === "heal_ally") {
      return `${intent.label}: heal ally ${intent.value}`;
    }
    if (intent.kind === "heal_allies") {
      return `${intent.label}: heal all enemies ${intent.value}`;
    }
    if (intent.kind === "heal_and_guard") {
      return `${intent.label}: heal an ally and gain Guard`;
    }
    if (intent.kind === "sunder_attack") {
      return `${intent.label}: break Guard, then hit for ${intent.value}`;
    }
    return intent.label || "Unknown";
  }

  function summarizeCardEffect(card, segments) {
    if (segments.length === 0) {
      return `${card.title} resolved.`;
    }
    return `${card.title}: ${segments.join(" ")}`;
  }

  function resolveCardEffect(state, effect, targetEnemy) {
    if (effect.kind === "damage") {
      const damage = Math.max(0, effect.value + state.hero.damageBonus);
      const dealt = dealDamage(state, targetEnemy, damage);
      return `dealt ${dealt} to ${targetEnemy.name}.`;
    }
    if (effect.kind === "gain_guard_self") {
      const guardValue = Math.max(0, effect.value + state.hero.guardBonus);
      applyGuard(state.hero, guardValue);
      return `gained ${guardValue} Guard.`;
    }
    if (effect.kind === "mark_enemy_for_mercenary") {
      state.mercenary.markedEnemyId = targetEnemy?.alive ? targetEnemy.id : "";
      state.mercenary.markBonus = effect.value;
      return `marked ${targetEnemy.name} for the mercenary.`;
    }
    if (effect.kind === "apply_burn") {
      if (targetEnemy && targetEnemy.alive) {
        const burnValue = Math.max(0, effect.value + state.hero.burnBonus);
        targetEnemy.burn = Math.max(0, targetEnemy.burn + burnValue);
        return `applied ${burnValue} Burn.`;
      }
      return "";
    }
    if (effect.kind === "gain_guard_party") {
      const guardValue = Math.max(0, effect.value + state.hero.guardBonus);
      applyGuard(state.hero, guardValue);
      applyGuard(state.mercenary, guardValue);
      return `granted ${guardValue} Guard to the party.`;
    }
    if (effect.kind === "buff_mercenary_next_attack") {
      state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + effect.value);
      return `buffed the mercenary's next attack by ${effect.value}.`;
    }
    if (effect.kind === "damage_all") {
      const damage = Math.max(0, effect.value + state.hero.damageBonus);
      const total = getLivingEnemies(state).reduce((sum, enemy) => sum + dealDamage(state, enemy, damage), 0);
      return `dealt ${total} total damage.`;
    }
    if (effect.kind === "heal_mercenary") {
      const healed = healEntity(state.mercenary, effect.value);
      return `healed the mercenary for ${healed}.`;
    }
    if (effect.kind === "draw") {
      const drew = drawCards(state, effect.value);
      return `drew ${drew} card${drew === 1 ? "" : "s"}.`;
    }
    if (effect.kind === "heal_hero") {
      const healed = healEntity(state.hero, effect.value);
      return `healed for ${healed}.`;
    }
    return "";
  }

  function playCard(state, content, instanceId, targetId = "") {
    if (state.phase !== "player" || state.outcome) {
      return { ok: false, message: "Cards can only be played during the player turn." };
    }

    const handIndex = state.hand.findIndex((entry) => entry.instanceId === instanceId);
    if (handIndex < 0) {
      return { ok: false, message: "Card is not in hand." };
    }

    const cardInstance = state.hand[handIndex];
    const card = getCardDefinition(content, cardInstance.cardId);
    if (!card) {
      return { ok: false, message: "Unknown card." };
    }
    if (state.hero.energy < card.cost) {
      return { ok: false, message: "Not enough Energy." };
    }

    const targetEnemy =
      card.target === "enemy"
        ? state.enemies.find((enemy) => enemy.id === targetId && enemy.alive) || null
        : null;
    if (card.target === "enemy" && !targetEnemy) {
      return { ok: false, message: "Select a living enemy." };
    }

    state.hero.energy -= card.cost;
    state.hand.splice(handIndex, 1);

    const segments = [];
    card.effects.forEach((effect) => {
      const segment = resolveCardEffect(state, effect, targetEnemy);
      if (segment) {
        segments.push(segment);
      }
    });

    state.discardPile.push(cardInstance);
    appendLog(state, summarizeCardEffect(card, segments));

    if (targetEnemy?.id) {
      state.selectedEnemyId = targetEnemy.id;
    }
    if (!getLivingEnemies(state).some((enemy) => enemy.id === state.selectedEnemyId)) {
      state.selectedEnemyId = getFirstLivingEnemyId(state);
    }

    checkOutcome(state);
    return { ok: true, message: "Card played." };
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

  function applyEncounterModifiers(state) {
    if (!runtimeWindow.ROUGE_COMBAT_MODIFIERS) {
      throw new Error("Combat modifiers helper is unavailable.");
    }
    runtimeWindow.ROUGE_COMBAT_MODIFIERS.applyEncounterModifiers(state);
  }

  function applyMercenaryContractBonuses(state) {
    if (!state?.mercenary?.alive) {
      return;
    }

    if (state.mercenary.contractHeroStartGuard > 0) {
      applyGuard(state.hero, state.mercenary.contractHeroStartGuard);
      appendLog(state, `The Wanderer enters with ${state.mercenary.contractHeroStartGuard} Guard from contract route support.`);
    }

    if (state.mercenary.contractHeroDamageBonus > 0) {
      state.hero.damageBonus += state.mercenary.contractHeroDamageBonus;
      appendLog(state, `${state.mercenary.name} route support sharpens the Wanderer's attacks by ${state.mercenary.contractHeroDamageBonus}.`);
    }

    if (state.mercenary.contractOpeningDraw > 0) {
      const drawn = drawCards(state, state.mercenary.contractOpeningDraw);
      if (drawn > 0) {
        appendLog(state, `${state.mercenary.name} route intel draws ${drawn} extra card${drawn === 1 ? "" : "s"} for the opening hand.`);
      }
    }

    if (state.mercenary.contractStartGuard > 0) {
      applyGuard(state.mercenary, state.mercenary.contractStartGuard);
      appendLog(state, `${state.mercenary.name} enters with ${state.mercenary.contractStartGuard} Guard from contract route support.`);
    }

    if (state.mercenary.contractPerkLabels.length > 0) {
      appendLog(state, `${state.mercenary.name} route perks active: ${state.mercenary.contractPerkLabels.join(", ")}.`);
    }
  }

  function startPlayerTurn(state) {
    if (state.outcome) {
      return;
    }
    state.phase = "player";
    state.turn += 1;
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

  function createCombatState({
    content,
    encounterId,
    mercenaryId,
    randomFn = Math.random,
    heroState = null,
    mercenaryState = null,
    starterDeck = null,
    initialPotions = 2,
  }) {
    const encounter = content.encounterCatalog[encounterId];
    const state = {
      encounter,
      randomFn,
      nextCardInstanceId: 1,
      turn: 0,
      phase: "player",
      outcome: null,
      potions: Math.max(0, parseInteger(initialPotions, 0)),
      hero: createHero(content, heroState),
      mercenary: createMercenary(content, mercenaryId, mercenaryState),
      enemies: encounter.enemies.map((enemyEntry) => createEnemy(content, enemyEntry)),
      drawPile: [],
      discardPile: [],
      hand: [],
      log: [],
      selectedEnemyId: "",
    };

    state.drawPile = createDeck(state, content, starterDeck);
    state.selectedEnemyId = getFirstLivingEnemyId(state);
    appendLog(state, `${encounter.name}: ${encounter.description}`);
    applyEncounterModifiers(state);
    startPlayerTurn(state);
    applyMercenaryContractBonuses(state);
    return state;
  }

  runtimeWindow.ROUGE_COMBAT_ENGINE = {
    createCombatState,
    playCard,
    endTurn,
    usePotion,
    describeIntent,
    getLivingEnemies,
    getFirstLivingEnemyId,
  };
})();
