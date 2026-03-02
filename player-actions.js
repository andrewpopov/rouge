(() => {
  function drawCards({ game, amount, shuffleInPlace }) {
    if (!game || !Number.isFinite(amount)) {
      return 0;
    }

    let drawn = 0;
    for (let i = 0; i < amount; i += 1) {
      if (game.drawPile.length === 0 && game.discardPile.length > 0) {
        game.drawPile = [...game.discardPile];
        game.discardPile = [];
        if (typeof shuffleInPlace === "function") {
          shuffleInPlace(game.drawPile);
        }
      }

      if (game.drawPile.length === 0) {
        break;
      }

      game.hand.push(game.drawPile.pop());
      drawn += 1;
    }
    return drawn;
  }

  function damageEnemy({ enemy, amount, ensureRunStats }) {
    if (!enemy || !enemy.alive) {
      return 0;
    }
    const wasAlive = enemy.alive;
    const damage = Math.max(0, Math.floor(amount));
    const absorbed = Math.min(enemy.block, damage);
    const hullHit = damage - absorbed;
    enemy.block -= absorbed;
    enemy.hp = Math.max(0, enemy.hp - hullHit);
    if (hullHit > 0 && typeof ensureRunStats === "function") {
      ensureRunStats().damageDealt += hullHit;
    }
    if (enemy.hp <= 0) {
      enemy.alive = false;
      enemy.intent = null;
      enemy.block = 0;
      enemy.aimed = false;
      enemy.aimedLane = null;
      if (wasAlive && typeof ensureRunStats === "function") {
        ensureRunStats().enemiesDestroyed += 1;
      }
    }
    return hullHit;
  }

  function damagePlayer({ game, amount, ignoreBlock = false, ensureRunStats }) {
    if (!game || !game.player) {
      return 0;
    }

    const damage = Math.max(0, Math.floor(amount));
    let hullHit = damage;

    if (!ignoreBlock) {
      const absorbed = Math.min(game.player.block, damage);
      hullHit = damage - absorbed;
      game.player.block -= absorbed;
    }

    game.player.hull = Math.max(0, game.player.hull - hullHit);
    if (hullHit > 0 && typeof ensureRunStats === "function") {
      ensureRunStats().damageTaken += hullHit;
    }
    return hullHit;
  }

  function gainHeat({ game, amount, clamp, maxHeat }) {
    if (!game || !game.player || typeof clamp !== "function") {
      return;
    }
    game.player.heat = clamp(game.player.heat + amount, 0, maxHeat);
  }

  function gainBlock({ game, amount }) {
    if (!game || !game.player) {
      return;
    }
    game.player.block = Math.max(0, game.player.block + amount);
  }

  function gainEnergy({ game, amount }) {
    if (!game || !game.player) {
      return;
    }
    game.player.energy = Math.max(0, game.player.energy + amount);
  }

  function consumeAttackMultiplier({ game, baseAmount }) {
    if (!game || !game.player) {
      return baseAmount;
    }
    const multiplier = game.player.nextAttackMultiplier;
    game.player.nextAttackMultiplier = 1;
    return baseAmount * multiplier;
  }

  function collectDeckInstances({ game }) {
    if (!game) {
      return [];
    }
    return [...game.drawPile, ...game.discardPile, ...game.hand, ...game.exhaustPile];
  }

  function isCardPlayable({ game, card, selectedEnemy }) {
    if (!game || !card) {
      return false;
    }
    if (game.phase !== "player") {
      return false;
    }
    if (game.player.energy < card.cost) {
      return false;
    }
    if (card.target === "enemy" && !selectedEnemy) {
      return false;
    }
    return true;
  }

  function playCard({
    game,
    instanceId,
    cardCatalog,
    getSelectedEnemy,
    isCardPlayableFn,
    setLog,
    updateHud,
    buildContextFn,
    ensureRunStats,
    checkEndStates,
    renderCards,
    renderEnemies,
    renderTrackMap,
  }) {
    if (!game || game.phase !== "player") {
      return;
    }

    const handIndex = game.hand.findIndex((instance) => instance.instanceId === instanceId);
    if (handIndex < 0) {
      return;
    }

    const instance = game.hand[handIndex];
    const card = cardCatalog[instance.cardId];
    const selectedEnemy = typeof getSelectedEnemy === "function" ? getSelectedEnemy() : null;
    const playable = typeof isCardPlayableFn === "function" ? isCardPlayableFn(card, selectedEnemy) : false;

    if (!playable) {
      if (typeof setLog === "function") {
        setLog("Card cannot be played now.");
      }
      if (typeof updateHud === "function") {
        updateHud();
      }
      return;
    }

    game.player.energy -= card.cost;
    game.hand.splice(handIndex, 1);

    const ctx = typeof buildContextFn === "function" ? buildContextFn(selectedEnemy) : null;
    if (ctx) {
      card.play(ctx);
    }
    game.turnCardsPlayed = Number.isInteger(game.turnCardsPlayed) ? game.turnCardsPlayed + 1 : 1;
    if (typeof ensureRunStats === "function") {
      ensureRunStats().cardsPlayed += 1;
    }

    if (card.exhaust) {
      game.exhaustPile.push(instance);
    } else {
      game.discardPile.push(instance);
    }

    if (typeof getSelectedEnemy === "function") {
      getSelectedEnemy();
    }
    if (typeof checkEndStates === "function" && checkEndStates()) {
      if (typeof renderCards === "function") renderCards();
      if (typeof renderEnemies === "function") renderEnemies();
      if (typeof renderTrackMap === "function") renderTrackMap();
      if (typeof updateHud === "function") updateHud();
      return;
    }

    if (typeof renderCards === "function") renderCards();
    if (typeof renderEnemies === "function") renderEnemies();
    if (typeof updateHud === "function") updateHud();
  }

  function discardHand({ game }) {
    if (!game || game.hand.length === 0) {
      return;
    }
    game.discardPile.push(...game.hand);
    game.hand = [];
  }

  function purgeHand({
    game,
    initGame,
    setLog,
    updateHud,
    gainHeatFn,
    discardHandFn,
    drawCardsFn,
    renderCards,
    purgeHeatGain = 6,
  }) {
    if (!game) {
      return;
    }
    if (game.phase === "gameover" || game.phase === "run_victory") {
      if (typeof initGame === "function") {
        initGame();
      }
      return;
    }
    if (game.phase !== "player") {
      return;
    }
    if (game.player.energy < 1) {
      if (typeof setLog === "function") {
        setLog("Not enough Steam to purge hand.");
      }
      if (typeof updateHud === "function") {
        updateHud();
      }
      return;
    }
    if (game.hand.length === 0) {
      if (typeof setLog === "function") {
        setLog("No cards in hand to purge.");
      }
      return;
    }

    const toDraw = game.hand.length;
    game.player.energy -= 1;
    if (typeof gainHeatFn === "function") {
      gainHeatFn(purgeHeatGain);
    }
    if (typeof discardHandFn === "function") {
      discardHandFn();
    }
    const drew = typeof drawCardsFn === "function" ? drawCardsFn(toDraw) : 0;
    if (typeof setLog === "function") {
      setLog(`Purged hand and redrew ${drew} card${drew === 1 ? "" : "s"}.`);
    }
    if (typeof renderCards === "function") renderCards();
    if (typeof updateHud === "function") updateHud();
  }

  function useOverclock({
    game,
    setLog,
    updateHud,
    gainEnergyFn,
    gainHeatFn,
    damagePlayerFn,
    overclockHeatGain,
    overclockStrainHeatThreshold,
    overclockStrainDamage,
  }) {
    if (!game || game.phase !== "player") {
      return;
    }
    if (game.player.overclockUsed) {
      if (typeof setLog === "function") {
        setLog("Overclock already used this turn.");
      }
      if (typeof updateHud === "function") {
        updateHud();
      }
      return;
    }

    game.player.overclockUsed = true;
    if (typeof gainEnergyFn === "function") {
      gainEnergyFn(1);
    }
    if (typeof gainHeatFn === "function") {
      gainHeatFn(overclockHeatGain);
    }

    if (game.player.heat >= overclockStrainHeatThreshold) {
      const burn = typeof damagePlayerFn === "function" ? damagePlayerFn(overclockStrainDamage, true) : 0;
      if (typeof setLog === "function") {
        setLog(`Overclock strain scorched hull for ${burn}.`);
      }
    } else if (typeof setLog === "function") {
      setLog("Overclock successful: +1 Steam this turn.");
    }

    if (typeof updateHud === "function") {
      updateHud();
    }
  }

  function shiftLane({ game, direction, setLog, clampLane, renderTrackMap, updateHud }) {
    if (!game) {
      return;
    }
    if (game.phase === "gameover" || game.phase === "run_victory") {
      return;
    }
    if (game.phase !== "player") {
      return;
    }
    if (game.player.movedThisTurn) {
      if (typeof setLog === "function") {
        setLog("Track shift already used this turn.");
      }
      return;
    }
    if (game.player.energy < 1) {
      if (typeof setLog === "function") {
        setLog("Not enough Steam to shift tracks.");
      }
      return;
    }

    const nextLane = typeof clampLane === "function" ? clampLane(game.player.lane + direction) : game.player.lane;
    if (nextLane === game.player.lane) {
      if (typeof setLog === "function") {
        setLog("Cannot shift further on this side.");
      }
      return;
    }

    game.player.energy -= 1;
    game.player.movedThisTurn = true;
    game.player.lane = nextLane;
    if (typeof setLog === "function") {
      setLog(`Shifted to Track ${nextLane + 1}.`);
    }
    if (typeof renderTrackMap === "function") renderTrackMap();
    if (typeof updateHud === "function") updateHud();
  }

  function startPlayerTurn({
    game,
    gainHeatFn,
    gainEnergyFn,
    getTurnStartCoolingAmount,
    getTurnStartBlockAmount,
    getTurnStartEnergyBonus,
    drawCardsFn,
    handSize,
    rollEnemyIntents,
    getSelectedEnemy,
  }) {
    if (!game || !game.player) {
      return;
    }
    game.phase = "player";
    game.turn += 1;
    game.player.energy = game.player.maxEnergy;
    game.player.block = typeof getTurnStartBlockAmount === "function" ? getTurnStartBlockAmount() : 0;
    game.player.movedThisTurn = false;
    game.player.overclockUsed = false;
    game.player.nextAttackMultiplier = 1;
    game.turnCardsPlayed = 0;
    const energyBonus =
      typeof getTurnStartEnergyBonus === "function"
        ? Math.max(0, Number.parseInt(getTurnStartEnergyBonus(), 10) || 0)
        : 0;
    if (energyBonus > 0 && typeof gainEnergyFn === "function") {
      gainEnergyFn(energyBonus);
    }
    if (typeof gainHeatFn === "function" && typeof getTurnStartCoolingAmount === "function") {
      gainHeatFn(-getTurnStartCoolingAmount());
    }
    if (typeof drawCardsFn === "function") {
      drawCardsFn(handSize - game.hand.length);
    }
    if (typeof rollEnemyIntents === "function") {
      rollEnemyIntents();
    }
    if (typeof getSelectedEnemy === "function") {
      getSelectedEnemy();
    }
  }

  function endTurn({
    game,
    setLog,
    discardHandFn,
    damagePlayerFn,
    checkEndStates,
    renderCards,
    renderEnemies,
    renderTrackMap,
    updateHud,
    advanceTelegraphs,
    livingEnemies,
    resolveEnemyIntent,
    startPlayerTurnFn,
  }) {
    if (!game || game.phase !== "player") {
      return;
    }

    game.phase = "enemy";
    if (typeof discardHandFn === "function") {
      discardHandFn();
    }
    const notes = [];

    if (game.player.heat >= 90 && typeof damagePlayerFn === "function") {
      const faultDamage = Math.floor((game.player.heat - 80) / 10) + 1;
      const took = damagePlayerFn(faultDamage, true);
      notes.push(`Heat fault erupted for ${took} direct hull damage.`);
    }

    if (typeof checkEndStates === "function" && checkEndStates()) {
      if (typeof renderCards === "function") renderCards();
      if (typeof renderEnemies === "function") renderEnemies();
      if (typeof renderTrackMap === "function") renderTrackMap();
      if (typeof updateHud === "function") updateHud();
      return;
    }

    if (typeof advanceTelegraphs === "function") {
      notes.push(...advanceTelegraphs());
    }

    if (typeof checkEndStates === "function" && checkEndStates()) {
      if (typeof renderCards === "function") renderCards();
      if (typeof renderEnemies === "function") renderEnemies();
      if (typeof renderTrackMap === "function") renderTrackMap();
      if (typeof updateHud === "function") updateHud();
      return;
    }

    const enemies = typeof livingEnemies === "function" ? livingEnemies() : [];
    enemies.forEach((enemy) => {
      const note = typeof resolveEnemyIntent === "function" ? resolveEnemyIntent(enemy) : null;
      if (note) {
        notes.push(note);
      }
    });

    if (typeof checkEndStates === "function" && checkEndStates()) {
      if (typeof renderCards === "function") renderCards();
      if (typeof renderEnemies === "function") renderEnemies();
      if (typeof renderTrackMap === "function") renderTrackMap();
      if (typeof updateHud === "function") updateHud();
      return;
    }

    if (typeof setLog === "function") {
      setLog(notes.length > 0 ? notes.join(" ") : "Enemy phase complete.");
    }
    if (typeof startPlayerTurnFn === "function") {
      startPlayerTurnFn();
    }
    if (typeof renderCards === "function") renderCards();
    if (typeof renderEnemies === "function") renderEnemies();
    if (typeof renderTrackMap === "function") renderTrackMap();
    if (typeof updateHud === "function") updateHud();
  }

  window.BRASSLINE_PLAYER_ACTIONS = {
    drawCards,
    damageEnemy,
    damagePlayer,
    gainHeat,
    gainBlock,
    gainEnergy,
    consumeAttackMultiplier,
    collectDeckInstances,
    isCardPlayable,
    playCard,
    discardHand,
    purgeHand,
    useOverclock,
    shiftLane,
    startPlayerTurn,
    endTurn,
  };
})();
