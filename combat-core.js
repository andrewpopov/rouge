(() => {
  function normalizeCookTier({ tier }) {
    const normalized = String(tier || "medium").toLowerCase();
    if (normalized === "fast" || normalized === "medium" || normalized === "slow") {
      return normalized;
    }
    return "medium";
  }

  function getCookTurns({ intent, normalizeCookTierFn, cookTierTurns }) {
    if (typeof intent?.cook === "number") {
      return Math.max(1, intent.cook);
    }
    const tier = normalizeCookTierFn(intent?.cookTier);
    return cookTierTurns[tier];
  }

  function getLockedAimLane({ enemy, clampLaneFn }) {
    if (!enemy || !enemy.aimed || !Number.isInteger(enemy.aimedLane)) {
      return null;
    }
    return clampLaneFn(enemy.aimedLane);
  }

  function getAimedShotDamage({ enemy, intent = enemy?.intent }) {
    if (!enemy || !intent || intent.kind !== "attack") {
      return 0;
    }
    const aimBonus = enemy.aimed ? 5 : 0;
    return Math.max(0, intent.value + enemy.attackBuff + aimBonus);
  }

  function describeIntent({
    enemy,
    getAimedShotDamageFn,
    getLockedAimLaneFn,
    normalizeCookTierFn,
    getCookTurnsFn,
    cookTierLabel,
  }) {
    const intent = enemy?.intent;
    if (!intent || !enemy?.alive) {
      return "Offline";
    }

    if (intent.kind === "attack") {
      const damage = getAimedShotDamageFn(enemy, intent);
      const aimedLane = getLockedAimLaneFn(enemy);
      if (aimedLane !== null) {
        return `${intent.label} ${damage}${intent.hits > 1 ? `x${intent.hits}` : ""} -> T${aimedLane + 1} (Locked)`;
      }
      return `${intent.label} ${damage}${intent.hits > 1 ? `x${intent.hits}` : ""}`;
    }
    if (intent.kind === "guard") {
      return `${intent.label} +${intent.value} Block`;
    }
    if (intent.kind === "charge") {
      return `${intent.label} +${intent.value} Power`;
    }
    if (intent.kind === "stoke") {
      return `${intent.label} +${intent.value} Heat`;
    }
    if (intent.kind === "resurrect") {
      const reviveCountRaw = Number.parseInt(intent.value, 10);
      const reviveCount = Number.isInteger(reviveCountRaw) && reviveCountRaw > 0 ? reviveCountRaw : 1;
      return `${intent.label} revive ${reviveCount}`;
    }
    if (intent.kind === "aim") {
      const aimedLane = getLockedAimLaneFn(enemy);
      if (aimedLane !== null) {
        return `${intent.label} +${intent.value} Block (T${aimedLane + 1})`;
      }
      return `${intent.label} +${intent.value} Block`;
    }
    if (intent.kind === "lob") {
      const tier = normalizeCookTierFn(intent.cookTier);
      const turns = getCookTurnsFn(intent);
      return `${intent.label} ${intent.value} AoE (${cookTierLabel[tier]} ${turns}t)`;
    }
    if (intent.kind === "sweep") {
      const tier = normalizeCookTierFn(intent.cookTier);
      const turns = getCookTurnsFn(intent);
      return `${intent.label} ${intent.value} line (${cookTierLabel[tier]} ${turns}t)`;
    }
    return "Unknown";
  }

  function clampLane({ lane, clamp, trackLanes }) {
    return clamp(lane, 0, trackLanes - 1);
  }

  function getLobLanes({ center, radius, trackLanes }) {
    const lanes = [];
    for (let lane = center - radius; lane <= center + radius; lane += 1) {
      if (lane >= 0 && lane < trackLanes) {
        lanes.push(lane);
      }
    }
    return lanes;
  }

  function makeSweepLanes({ width, clamp, trackLanes, playerLane }) {
    const w = clamp(width, 1, trackLanes);
    if (playerLane <= Math.floor(trackLanes / 2)) {
      return {
        lanes: Array.from({ length: w }, (_, i) => i),
        direction: "right",
      };
    }
    return {
      lanes: Array.from({ length: w }, (_, i) => trackLanes - w + i),
      direction: "left",
    };
  }

  function queueTelegraph({ game, config, normalizeCookTierFn }) {
    const id = `tg_${game.nextTelegraphId}`;
    game.nextTelegraphId += 1;

    const cookTier = normalizeCookTierFn(config.cookTier);
    const telegraph = {
      id,
      type: config.type,
      damage: config.damage,
      cookTurns: config.cookTurns,
      turnsLeft: config.cookTurns,
      cookTier,
      targetLane: config.targetLane ?? null,
      lanes: config.lanes ?? [],
      radius: config.radius ?? 0,
      direction: config.direction ?? null,
      sourceEnemyId: config.sourceEnemyId ?? null,
    };

    game.telegraphs.push(telegraph);
  }

  function resolveTelegraph({ game, telegraph, getLobLanesFn, damagePlayerFn }) {
    if (telegraph.type === "lob") {
      const impactedLanes = getLobLanesFn(telegraph.targetLane, telegraph.radius);
      if (impactedLanes.includes(game.player.lane)) {
        const took = damagePlayerFn(telegraph.damage);
        return `Lob explosion hit Track ${telegraph.targetLane + 1} and dealt ${took}.`;
      }
      return `Lob exploded harmlessly on Track ${telegraph.targetLane + 1}.`;
    }

    if (telegraph.type === "sweep") {
      if (telegraph.lanes.includes(game.player.lane)) {
        const took = damagePlayerFn(telegraph.damage);
        return `Directional sweep cut through your track for ${took}.`;
      }
      return "Directional sweep passed without impact.";
    }

    return null;
  }

  function releaseExpiredLockedHighlight({ game }) {
    if (typeof game.highlightLockKey !== "string" || !game.highlightLockKey.startsWith("tg_")) {
      return;
    }
    const stillActive = game.telegraphs.some((telegraph) => telegraph.id === game.highlightLockKey);
    if (!stillActive) {
      game.highlightLockKey = null;
      game.highlightLanes = [];
    }
  }

  function advanceTelegraphs({ game, resolveTelegraphFn, releaseExpiredLockedHighlightFn }) {
    if (game.telegraphs.length === 0) {
      return [];
    }

    const notes = [];
    const pending = [];

    game.telegraphs.forEach((telegraph) => {
      telegraph.turnsLeft -= 1;
      if (telegraph.turnsLeft <= 0) {
        const note = resolveTelegraphFn(telegraph);
        if (note) {
          notes.push(note);
        }
      } else {
        pending.push(telegraph);
      }
    });

    game.telegraphs = pending;
    releaseExpiredLockedHighlightFn();
    return notes;
  }

  function makeCardInstance({ game, cardId }) {
    const id = game.nextCardInstanceId;
    game.nextCardInstanceId += 1;
    return {
      cardId,
      instanceId: `c_${id}_${cardId}`,
    };
  }

  function createEnemy({ game, entry, slot, enemyBlueprints, enemyTune, enemyIntentTune, clamp }) {
    const blueprint = enemyBlueprints[entry.key];
    const power = entry.power ?? 1;
    const isElite = Boolean(entry?.elite);
    const intentSource =
      isElite && Array.isArray(blueprint.eliteIntents) && blueprint.eliteIntents.length > 0
        ? blueprint.eliteIntents
        : blueprint.intents;
    const eliteHpMultiplier =
      isElite && Number.isFinite(blueprint.eliteHpMultiplier) && blueprint.eliteHpMultiplier > 0
        ? blueprint.eliteHpMultiplier
        : 1;
    const maxHpBase = enemyTune(entry.key, "maxHp", blueprint.maxHp);
    const hp = Math.max(1, Math.round(maxHpBase * power * eliteHpMultiplier));
    const intents = intentSource.map((intent, intentIndex) => {
      const tunedValue = enemyIntentTune(entry.key, intentIndex, "value", intent.value);
      const tunedHits = enemyIntentTune(entry.key, intentIndex, "hits", intent.hits);
      const tunedCookTier = enemyIntentTune(entry.key, intentIndex, "cookTier", intent.cookTier);
      const tunedRadius = enemyIntentTune(entry.key, intentIndex, "radius", intent.radius);
      const tunedWidth = enemyIntentTune(entry.key, intentIndex, "width", intent.width);

      const scaled = {
        ...intent,
        value: Math.max(1, Math.round(tunedValue * power)),
      };
      if (Number.isFinite(tunedHits)) {
        scaled.hits = Math.max(0, Math.round(tunedHits));
      }
      if (typeof tunedCookTier === "string") {
        scaled.cookTier = tunedCookTier;
      }
      if (Number.isFinite(tunedRadius)) {
        scaled.radius = Math.max(0, Math.round(tunedRadius));
      }
      if (Number.isFinite(tunedWidth)) {
        scaled.width = Math.max(1, Math.round(tunedWidth));
      }
      return scaled;
    });

    const fallbackIntentIndex = blueprint.startIntentIndex ?? (slot % intents.length);
    const tunedIntentIndex = enemyTune(entry.key, "startIntentIndex", fallbackIntentIndex);
    const startIntentIndex = clamp(
      Number.isFinite(tunedIntentIndex) ? Math.floor(tunedIntentIndex) : fallbackIntentIndex,
      0,
      Math.max(0, intents.length - 1)
    );
    const startBlock =
      isElite && Number.isFinite(blueprint.eliteStartBlock)
        ? Math.max(0, Math.round(blueprint.eliteStartBlock * power))
        : 0;
    const startAttackBuff =
      isElite && Number.isFinite(blueprint.eliteAttackBuff)
        ? Math.max(0, Math.round(blueprint.eliteAttackBuff))
        : 0;
    const eliteLabel = isElite && typeof blueprint.eliteLabel === "string" ? blueprint.eliteLabel.trim() : "";

    return {
      id: `enemy_${game.sectorIndex + 1}_${slot + 1}_${entry.key}`,
      key: blueprint.key,
      name: blueprint.name,
      maxHp: hp,
      hp,
      block: startBlock,
      attackBuff: startAttackBuff,
      aimed: false,
      aimedLane: null,
      icon: blueprint.icon,
      intents,
      intentIndex: startIntentIndex,
      intent: null,
      alive: true,
      elite: isElite,
      eliteLabel,
    };
  }

  window.BRASSLINE_COMBAT_CORE = {
    normalizeCookTier,
    getCookTurns,
    getLockedAimLane,
    getAimedShotDamage,
    describeIntent,
    clampLane,
    getLobLanes,
    makeSweepLanes,
    queueTelegraph,
    resolveTelegraph,
    advanceTelegraphs,
    releaseExpiredLockedHighlight,
    makeCardInstance,
    createEnemy,
  };
})();
