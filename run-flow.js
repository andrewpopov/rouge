(() => {
  function drawRewardChoices({ rewardPool, rewardChoiceCount, shuffleInPlace, getUpgradeablePathIds }) {
    const cardPool = [...rewardPool];
    shuffleInPlace(cardPool);
    const upgradePool = getUpgradeablePathIds();
    shuffleInPlace(upgradePool);

    const choices = [];
    if (upgradePool.length > 0) {
      choices.push({
        type: "upgrade",
        upgradeId: upgradePool.shift(),
      });
    }

    while (choices.length < rewardChoiceCount && cardPool.length > 0) {
      choices.push({
        type: "card",
        cardId: cardPool.shift(),
      });
    }

    while (choices.length < rewardChoiceCount && upgradePool.length > 0) {
      choices.push({
        type: "upgrade",
        upgradeId: upgradePool.shift(),
      });
    }

    shuffleInPlace(choices);
    return choices;
  }

  function beginInterlude({
    game,
    interlude,
    deckInstances,
    rewardMessage,
    clamp,
    runSectorsLength,
    appendRunTimelineEntry,
    setLog,
    renderEnemies,
    renderCards,
    renderTrackMap,
    updateHud,
  }) {
    if (!interlude) {
      return false;
    }
    game.phase = "interlude";
    game.interlude = {
      ...interlude,
      options: interlude.options.map((option) => ({ ...option })),
    };
    game.interludeDeck = Array.isArray(deckInstances) ? [...deckInstances] : [];
    game.openEnemyTooltipId = null;
    game.highlightLanes = [];
    game.highlightLockKey = null;

    appendRunTimelineEntry(`Interlude: ${interlude.title}.`, {
      sectorIndex: clamp(game.sectorIndex - 1, 0, Math.max(0, runSectorsLength - 1)),
      type: interlude.type === "shop" ? "reward" : "sector",
    });
    setLog(`${rewardMessage} ${interlude.title}: choose one option.`);
    renderEnemies();
    renderCards();
    renderTrackMap();
    updateHud();
    return true;
  }

  function resolveInterludeOption({
    game,
    optionIndex,
    setLog,
    updateHud,
    collectDeckInstances,
    clamp,
    gainHeat,
    makeCardInstance,
    cardCatalog,
    runSectorsLength,
    appendRunTimelineEntry,
    beginSectorBattle,
  }) {
    if (game.phase !== "interlude" || !game.interlude) {
      return;
    }

    const option = game.interlude.options?.[optionIndex];
    if (!option) {
      setLog("Invalid interlude option.");
      updateHud();
      return;
    }

    const deck = Array.isArray(game.interludeDeck) ? [...game.interludeDeck] : collectDeckInstances();
    const notes = [];

    if (option.hull !== 0) {
      const before = game.player.hull;
      game.player.hull = clamp(game.player.hull + option.hull, 0, game.player.maxHull);
      const delta = game.player.hull - before;
      if (delta !== 0) {
        notes.push(`${delta > 0 ? "+" : ""}${delta} Hull`);
      }
    }
    if (option.heat !== 0) {
      const before = game.player.heat;
      gainHeat(option.heat);
      const delta = game.player.heat - before;
      if (delta !== 0) {
        notes.push(`${delta > 0 ? "+" : ""}${delta} Heat`);
      }
    }
    if (option.addCard && cardCatalog[option.addCard]) {
      deck.push(makeCardInstance(option.addCard));
      notes.push(`Added ${cardCatalog[option.addCard].title}`);
    }
    if (option.removeCard) {
      const removeIndex = deck.findIndex((instance) => instance.cardId === option.removeCard);
      if (removeIndex >= 0) {
        const [removed] = deck.splice(removeIndex, 1);
        const removedTitle = cardCatalog[removed.cardId]?.title || removed.cardId;
        notes.push(`Removed ${removedTitle}`);
      }
    }
    if (option.targetSector) {
      const routedIndex = clamp(option.targetSector - 1, game.sectorIndex, Math.max(0, runSectorsLength - 1));
      if (routedIndex !== game.sectorIndex) {
        game.sectorIndex = routedIndex;
      }
      notes.push(`Route set to Sector ${game.sectorIndex + 1}`);
    }

    const interludeTitle = game.interlude.title;
    appendRunTimelineEntry(`Interlude ${interludeTitle}: ${option.label}.`, {
      sectorIndex: clamp(game.sectorIndex - 1, 0, Math.max(0, runSectorsLength - 1)),
      type: game.interlude.type === "shop" ? "reward" : "sector",
    });

    game.interlude = null;
    game.interludeDeck = [];
    setLog(
      notes.length > 0
        ? `Interlude resolved (${option.label}): ${notes.join(", ")}.`
        : `Interlude resolved: ${option.label}.`
    );
    beginSectorBattle(deck, false);
  }

  function beginSectorBattle({
    game,
    deckInstances,
    freshStart = false,
    getCurrentSector,
    createEnemy,
    clamp,
    heatCarryRatio,
    heatCarryFloor,
    maxHeat,
    clampLane,
    trackLanes,
    shuffleInPlace,
    rollEnemyIntents,
    drawCards,
    handSize,
    setLog,
    appendRunTimelineEntry,
    renderEnemies,
    renderTrackMap,
    renderCards,
    updateHud,
  }) {
    const sector = getCurrentSector();
    if (!sector) {
      game.phase = "run_victory";
      game.openEnemyTooltipId = null;
      game.highlightLanes = [];
      game.highlightLockKey = null;
      renderEnemies();
      renderTrackMap();
      renderCards();
      updateHud();
      return;
    }

    game.phase = "player";
    game.turn = 1;
    game.rewardChoices = [];
    game.interlude = null;
    game.interludeDeck = [];
    game.openEnemyTooltipId = null;
    game.highlightLanes = [];
    game.highlightLockKey = null;
    game.telegraphs = [];
    game.enemies = sector.enemies.map((entry, index) => createEnemy(entry, index));

    if (!freshStart) {
      game.player.heat = clamp(Math.round(game.player.heat * heatCarryRatio), heatCarryFloor, maxHeat);
    }
    game.player.block = 0;
    game.player.energy = game.player.maxEnergy;
    game.player.movedThisTurn = false;
    game.player.lane = clampLane(Math.floor(trackLanes / 2));
    game.player.nextAttackMultiplier = 1;
    game.player.overclockUsed = false;

    game.drawPile = [...deckInstances];
    shuffleInPlace(game.drawPile);
    game.discardPile = [];
    game.hand = [];
    game.exhaustPile = [];

    rollEnemyIntents();
    drawCards(handSize);
    game.selectedEnemyId = game.enemies[0]?.id ?? null;
    setLog(`Entering ${sector.name}.`);
    appendRunTimelineEntry(`Entered ${sector.name}.`, {
      sectorIndex: game.sectorIndex,
      turn: game.turn,
      type: "sector",
    });

    renderEnemies();
    renderTrackMap();
    renderCards();
    updateHud();
  }

  function applyRewardAndAdvance({
    game,
    rewardChoice = null,
    normalizeRewardChoice,
    getRewardChoiceKey,
    setLog,
    renderRewardPanel,
    collectDeckInstances,
    rewardHealSkip,
    rewardHealChosen,
    cardCatalog,
    makeCardInstance,
    ensureRunStats,
    appendRunTimelineEntry,
    applyUpgradePath,
    clamp,
    runSectorsLength,
    recordRunOutcome,
    renderEnemies,
    renderCards,
    renderTrackMap,
    updateHud,
    getInterludeForAfterSector,
    beginInterlude,
    beginSectorBattle,
  }) {
    if (game.phase !== "reward") {
      return;
    }

    const normalizedChoice = normalizeRewardChoice(rewardChoice);
    if (rewardChoice !== null && !normalizedChoice) {
      setLog("Invalid reward selection.");
      renderRewardPanel();
      return;
    }

    if (normalizedChoice) {
      const offeredKeys = new Set(game.rewardChoices.map((choice) => getRewardChoiceKey(choice)).filter(Boolean));
      const selectedKey = getRewardChoiceKey(normalizedChoice);
      if (offeredKeys.size > 0 && !offeredKeys.has(selectedKey)) {
        setLog("Reward no longer available. Pick one of the offered rewards.");
        renderRewardPanel();
        return;
      }
    }

    const deck = collectDeckInstances();
    let rewardMessage = "";
    let healAmount = rewardHealSkip;

    if (normalizedChoice) {
      healAmount = rewardHealChosen;
      if (normalizedChoice.type === "card" && normalizedChoice.cardId && cardCatalog[normalizedChoice.cardId]) {
        deck.push(makeCardInstance(normalizedChoice.cardId));
        ensureRunStats().rewardsClaimed += 1;
        ensureRunStats().cardsRewarded += 1;
        appendRunTimelineEntry(`Reward: added ${cardCatalog[normalizedChoice.cardId].title}.`, {
          sectorIndex: game.sectorIndex,
          type: "reward",
        });
        rewardMessage = `Added ${cardCatalog[normalizedChoice.cardId].title}. Hull repaired by ${rewardHealChosen}.`;
      } else if (normalizedChoice.type === "upgrade" && normalizedChoice.upgradeId) {
        const upgradeResult = applyUpgradePath(normalizedChoice.upgradeId);
        if (!upgradeResult) {
          setLog("Upgrade path is already maxed. Pick a different reward.");
          renderRewardPanel();
          return;
        }
        ensureRunStats().rewardsClaimed += 1;
        ensureRunStats().upgradesRewarded += 1;
        appendRunTimelineEntry(
          `Reward: installed ${upgradeResult.path.title} Lv ${upgradeResult.nextLevel}/${upgradeResult.path.maxLevel}.`,
          { sectorIndex: game.sectorIndex, type: "reward" }
        );
        rewardMessage = `Installed ${upgradeResult.path.title} Lv ${upgradeResult.nextLevel}/${upgradeResult.path.maxLevel}. Hull repaired by ${rewardHealChosen}.`;
      } else {
        setLog("Invalid reward selection.");
        renderRewardPanel();
        return;
      }
    } else {
      ensureRunStats().rewardSkips += 1;
      appendRunTimelineEntry(`Reward skipped (+${rewardHealSkip} Hull).`, {
        sectorIndex: game.sectorIndex,
        type: "reward",
      });
      rewardMessage = `Skipped reward. Hull repaired by ${rewardHealSkip}.`;
    }

    game.player.hull = clamp(game.player.hull + healAmount, 0, game.player.maxHull);
    game.sectorIndex += 1;

    if (game.sectorIndex >= runSectorsLength) {
      game.phase = "run_victory";
      game.telegraphs = [];
      appendRunTimelineEntry("Route secured.", {
        sectorIndex: runSectorsLength - 1,
        turn: game.turn,
        type: "victory",
      });
      recordRunOutcome("run_victory");
      setLog("Route secured. Click Restart Run to play again.");
      renderEnemies();
      renderCards();
      renderTrackMap();
      updateHud();
      return;
    }

    const interlude = getInterludeForAfterSector(game.sectorIndex);
    if (interlude) {
      beginInterlude(interlude, deck, rewardMessage);
      return;
    }

    setLog(rewardMessage);
    beginSectorBattle(deck, false);
  }

  function checkEndStates({
    game,
    livingEnemies,
    runSectorsLength,
    discardHand,
    appendRunTimelineEntry,
    recordRunOutcome,
    drawRewardChoices,
    getCurrentSector,
    setLog,
  }) {
    if (game.player.hull <= 0) {
      game.phase = "gameover";
      game.interlude = null;
      game.interludeDeck = [];
      game.openEnemyTooltipId = null;
      game.highlightLanes = [];
      game.highlightLockKey = null;
      game.telegraphs = [];
      discardHand();
      appendRunTimelineEntry("Run lost. Reactor destroyed.", {
        sectorIndex: game.sectorIndex,
        turn: game.turn,
        type: "danger",
      });
      recordRunOutcome("gameover");
      setLog("Reactor lost. Click Restart Run.");
      return true;
    }

    if (livingEnemies().length === 0) {
      game.interlude = null;
      game.interludeDeck = [];
      game.openEnemyTooltipId = null;
      game.highlightLanes = [];
      game.highlightLockKey = null;
      game.telegraphs = [];
      discardHand();
      const finalSector = game.sectorIndex >= runSectorsLength - 1;
      if (finalSector) {
        game.phase = "run_victory";
        appendRunTimelineEntry("Foundry Crown secured.", {
          sectorIndex: game.sectorIndex,
          turn: game.turn,
          type: "victory",
        });
        recordRunOutcome("run_victory");
        setLog("Foundry Crown secured. Click Restart Run.");
      } else {
        game.phase = "reward";
        game.rewardChoices = drawRewardChoices();
        const sector = getCurrentSector();
        const sectorName = sector ? sector.name : `Sector ${game.sectorIndex + 1}`;
        appendRunTimelineEntry(`${sectorName} cleared.`, {
          sectorIndex: game.sectorIndex,
          turn: game.turn,
          type: "sector",
        });
        setLog("Sector cleared. Choose 1 reward (card or upgrade path) to continue.");
      }
      return true;
    }

    return false;
  }

  window.BRASSLINE_RUN_FLOW = {
    drawRewardChoices,
    beginInterlude,
    resolveInterludeOption,
    beginSectorBattle,
    applyRewardAndAdvance,
    checkEndStates,
  };
})();
