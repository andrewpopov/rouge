(() => {
  function chooseNextIntent({ enemy }) {
    if (!enemy || !Array.isArray(enemy.intents) || enemy.intents.length === 0) {
      return;
    }
    const intent = enemy.intents[enemy.intentIndex % enemy.intents.length];
    enemy.intentIndex += 1;
    enemy.intent = { ...intent };
  }

  function rollEnemyIntents({ enemies, chooseNextIntentFn }) {
    (Array.isArray(enemies) ? enemies : []).forEach((enemy) => {
      chooseNextIntentFn({ enemy });
    });
  }

  function resolveEnemyIntent({
    enemy,
    enemies,
    playerLane,
    getPlayerHull,
    getAimedShotDamage,
    getLockedAimLane,
    damagePlayer,
    gainHeat,
    queueTelegraph,
    clampLane,
    randomInt,
    normalizeCookTier,
    getCookTurns,
    makeSweepLanes,
    cookTierLabel,
  }) {
    const intent = enemy?.intent;
    if (!intent || !enemy?.alive) {
      return null;
    }

    if (intent.kind === "aim") {
      enemy.block += intent.value;
      enemy.aimed = true;
      enemy.aimedLane = playerLane;
      return `${enemy.name} stopped and aimed at Track ${enemy.aimedLane + 1}.`;
    }

    if (intent.kind === "attack") {
      const hitDamage = getAimedShotDamage(enemy, intent);
      const lockedLane = getLockedAimLane(enemy);
      enemy.aimed = false;
      enemy.aimedLane = null;

      if (lockedLane !== null && playerLane !== lockedLane) {
        return `${enemy.name} fired at Track ${lockedLane + 1}, but you dodged the shot.`;
      }

      let total = 0;
      for (let i = 0; i < intent.hits; i += 1) {
        total += damagePlayer(hitDamage);
        if (getPlayerHull() <= 0) {
          break;
        }
      }
      if (lockedLane !== null) {
        return `${enemy.name} fired into Track ${lockedLane + 1} for ${total} hull damage.`;
      }
      return `${enemy.name} dealt ${total} hull damage.`;
    }

    if (intent.kind === "guard") {
      enemy.block += intent.value;
      return `${enemy.name} gained ${intent.value} Block.`;
    }

    if (intent.kind === "charge") {
      enemy.attackBuff += intent.value;
      return `${enemy.name} powered up by ${intent.value}.`;
    }

    if (intent.kind === "stoke") {
      gainHeat(intent.value);
      return `${enemy.name} raised your Heat by ${intent.value}.`;
    }

    if (intent.kind === "resurrect") {
      const roster = Array.isArray(enemies) ? enemies : [];
      const maxRevivesRaw = Number.parseInt(intent.value, 10);
      const maxRevives = Number.isInteger(maxRevivesRaw) && maxRevivesRaw > 0 ? maxRevivesRaw : 1;
      const healPercentRaw = Number.parseInt(intent.healPercent, 10);
      const healRatio = Number.isInteger(healPercentRaw) && healPercentRaw > 0 ? healPercentRaw / 100 : 0.35;
      const targetKey = typeof intent.targetKey === "string" ? intent.targetKey.trim().toLowerCase() : "";

      let revived = 0;
      for (let index = 0; index < roster.length; index += 1) {
        const ally = roster[index];
        if (!ally || ally.id === enemy.id || ally.alive) {
          continue;
        }
        if (targetKey && String(ally.key || "").toLowerCase() !== targetKey) {
          continue;
        }

        ally.alive = true;
        ally.hp = Math.max(1, Math.round((Number.parseInt(ally.maxHp, 10) || 1) * healRatio));
        ally.block = 0;
        ally.aimed = false;
        ally.aimedLane = null;
        ally.intent = null;
        revived += 1;

        if (revived >= maxRevives) {
          break;
        }
      }

      if (revived > 0) {
        return `${enemy.name} resurrected ${revived} ${revived === 1 ? "ally" : "allies"}.`;
      }
      return `${enemy.name} chanted a resurrection, but no corpses answered.`;
    }

    if (intent.kind === "lob") {
      const offset = randomInt(3) - 1;
      const targetLane = clampLane(playerLane + offset);
      const radius = intent.radius ?? 0;
      const cookTier = normalizeCookTier(intent.cookTier);
      const cookTurns = getCookTurns(intent);
      queueTelegraph({
        type: "lob",
        damage: intent.value,
        cookTurns,
        cookTier,
        targetLane,
        radius,
        sourceEnemyId: enemy.id,
      });
      return `${enemy.name} lobbed a shell at Track ${targetLane + 1} (${cookTierLabel[cookTier]} ${cookTurns}t).`;
    }

    if (intent.kind === "sweep") {
      const sweep = makeSweepLanes(intent.width ?? 3);
      const cookTier = normalizeCookTier(intent.cookTier);
      const cookTurns = getCookTurns(intent);
      queueTelegraph({
        type: "sweep",
        damage: intent.value,
        cookTurns,
        cookTier,
        lanes: sweep.lanes,
        direction: sweep.direction,
        sourceEnemyId: enemy.id,
      });
      return `${enemy.name} lined up a directional sweep (${cookTierLabel[cookTier]} ${cookTurns}t).`;
    }

    return null;
  }

  window.BRASSLINE_ENEMY_PHASE = {
    chooseNextIntent,
    rollEnemyIntents,
    resolveEnemyIntent,
  };
})();
