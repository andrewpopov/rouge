(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const monsterActions = runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS;
  const { TRAIT } = monsterActions;
  const { COMBAT_PHASE, COMBAT_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
  const mercenaryModule = runtimeWindow.__ROUGE_COMBAT_MERCENARY;
  const neutralWeaponScaling = {
    hasPreferredWeaponFamily: (_state: CombatState) => false,
    getWeaponAttackBonus: (_state: CombatState, _cardId: string) => 0,
    getWeaponSupportBonus: (_state: CombatState, _cardId: string) => 0,
    getMeleeDamage: (state: CombatState) => {
      const baseDamage = Math.max(1, state.weaponDamageBonus || 0);
      if (state.hero.weaken > 0) {
        return Math.max(1, Math.floor(baseDamage * 0.7));
      }
      return baseDamage;
    },
  };
  const {
    hasPreferredWeaponFamily,
    getWeaponAttackBonus,
    getWeaponSupportBonus,
    getMeleeDamage,
  } = runtimeWindow.__ROUGE_COMBAT_WEAPON_SCALING || neutralWeaponScaling;

  const neutralMinionModule = {
    MAX_ACTIVE_MINIONS: 0,
    getActiveMinions: (_state: CombatState): CombatMinionState[] => [],
    getMinionTemplate: (_templateId: string): null => null,
    getMinionDuration: (_effect: CardEffect, _template: unknown): number => 0,
    getMinionPrimaryValue: (_effect: CardEffect): number => 0,
    getMinionSecondaryValue: (_effect: CardEffect): number => 0,
    getMinionReinforcementValue: (value: number): number => value,
    getMinionSkillSummary: (_minion: CombatMinionState): string => "",
    getSummonPreview: (_state: CombatState | null, _effect: CardEffect): string => "",
    buildMinionActionSummary: (
      _actionKind: CombatMinionActionKind,
      _power: number,
      _secondaryValue: number
    ): string => "",
  };
  const minionModule = runtimeWindow.__ROUGE_COMBAT_MINIONS || neutralMinionModule;
  const {
    MAX_ACTIVE_MINIONS,
    getActiveMinions,
    getMinionTemplate,
    getMinionDuration: _getMinionDuration,
    getMinionPrimaryValue: _getMinionPrimaryValue,
    getMinionSecondaryValue: _getMinionSecondaryValue,
    getMinionReinforcementValue: _getMinionReinforcementValue,
    getMinionSkillSummary,
    getSummonPreview,
  } = minionModule;
  const weaponEffectsModule = runtimeWindow.__ROUGE_COMBAT_WEAPON_EFFECTS;
  const { applyWeaponTypedDamage, applyWeaponEffects } = weaponEffectsModule;

  // Import from extracted modules
  const damageModule = runtimeWindow.__ROUGE_COMBAT_ENGINE_DAMAGE;
  const { hasTrait, healEntity, applyGuard, dealDamage, dealDirectDamage, dealDamageIgnoringGuard, dealLifeDamage } = damageModule;
  const enemyTurnsModule = runtimeWindow.__ROUGE_COMBAT_ENGINE_ENEMY_TURNS;
  const { resolveEnemyAction, advanceEnemyIntents } = enemyTurnsModule;

  function appendLog(state: CombatState, message: string) {
    runtimeWindow.__ROUGE_COMBAT_LOG.appendLog(state, message);
  }

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

  function getFirstLivingEnemyId(state: CombatState) {
    return getLivingEnemies(state)[0]?.id || "";
  }

  const minionActionsModule = runtimeWindow.__ROUGE_COMBAT_ENGINE_MINION_ACTIONS;
  const { summonMinion, resolveMinionPhase, getMinionStackCount, getMinionArtTier } = minionActionsModule;

  /* summonMinion, chooseMinionTarget, resolveMinionAction, resolveMinionPhase → combat-engine-minion-actions.ts */

  function checkOutcome(state: CombatState) {
    if (!state.hero.alive || state.hero.life <= 0) {
      state.phase = COMBAT_PHASE.DEFEAT;
      state.outcome = COMBAT_OUTCOME.DEFEAT;
      if (!state.log.some((entry: CombatLogEntry) => entry.message.includes("Encounter lost"))) {
        logCombat(state, {
          actor: "environment", actorName: "",
          action: "death", tone: "loss",
          message: "The Wanderer falls. Encounter lost.",
        });
      }
      return true;
    }
    if (getLivingEnemies(state).length === 0) {
      state.phase = COMBAT_PHASE.VICTORY;
      state.outcome = COMBAT_OUTCOME.VICTORY;
      logCombat(state, {
        actor: "environment", actorName: "",
        action: "setup", tone: "report",
        message: `${state.encounter.name} cleared.`,
      });
      return true;
    }
    return false;
  }

  function resolveMercenaryAction(state: CombatState) {
    mercenaryModule.resolveMercenaryAction(state, appendLog, dealDamage, applyGuard, getFirstLivingEnemyId);
  }

  function decayHeroTurnDebuffs(state: CombatState) {
    if (state.hero.chill > 0) {
      state.hero.chill = Math.max(0, state.hero.chill - 1);
    }
    if (state.hero.energyDrain > 0) {
      state.hero.energyDrain = Math.max(0, state.hero.energyDrain - 1);
    }
    if (state.hero.amplify > 0) {
      state.hero.amplify = Math.max(0, state.hero.amplify - 1);
    }
    if (state.hero.weaken > 0) {
      state.hero.weaken = Math.max(0, state.hero.weaken - 1);
    }
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

  function clearSkillModifiers(state: CombatState) {
    state.skillModifiers = {
      nextCardCostReduction: 0,
      nextCardDamageBonus: 0,
      nextCardBurn: 0,
      nextCardPoison: 0,
      nextCardSlow: 0,
      nextCardFreeze: 0,
      nextCardParalyze: 0,
      nextCardDraw: 0,
      nextCardGuard: 0,
      nextCardIgnoreGuard: 0,
      nextCardExtraStatus: 0,
    };
  }

  function hasSkillModifiers(state: CombatState) {
    return Object.values(state.skillModifiers || {}).some((value) => value > 0);
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
    if (state.phase !== COMBAT_PHASE.PLAYER || state.outcome) {
      return { ok: false, message: "Cannot melee right now." };
    }
    if (state.meleeUsed) {
      return { ok: false, message: "Melee already used this turn." };
    }
    const familyMatch = hasPreferredWeaponFamily(state);
    const damage = getMeleeDamage(state);
    const target = state.enemies.find((e: CombatEnemyState) => e.id === state.selectedEnemyId && e.alive) || getLivingEnemies(state)[0];
    if (!target) {
      return { ok: false, message: "No living enemy." };
    }
    const dealt = dealDamage(state, target, damage);
    const weaponSegments = [
      ...applyWeaponTypedDamage(state, target.alive ? [target] : [], ""),
      ...applyWeaponEffects(state, target.alive ? [target] : [], ""),
    ];
    state.meleeUsed = true;
    logCombat(state, {
      actor: "hero", actorName: "the Wanderer",
      action: "melee",
      message: `Melee strike hits ${target.name} for ${dealt}${familyMatch ? " (proficient)" : ""}.${weaponSegments.length > 0 ? ` ${weaponSegments.join(" ")}` : ""}`,
      effects: [{ target: "enemy", targetId: target.id, targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard }],
    });
    checkOutcome(state);
    return { ok: true, message: "Melee strike landed." };
  }

  function startPlayerTurn(state: CombatState) {
    if (state.outcome) {
      return;
    }
    state.phase = COMBAT_PHASE.PLAYER;
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
        state.phase = COMBAT_PHASE.DEFEAT;
        state.outcome = COMBAT_OUTCOME.DEFEAT;
        logCombat(state, {
          actor: "environment", actorName: "",
          action: "death", tone: "loss",
          message: "The Wanderer falls. Encounter lost.",
        });
        return;
      }

      if (state.tauntTurnsRemaining > 0) {
        state.tauntTurnsRemaining = Math.max(0, state.tauntTurnsRemaining - 1);
        if (state.tauntTurnsRemaining <= 0) {
          state.tauntTarget = "";
          state.tauntMinionId = "";
        }
      }

      if (state.heroFade > 0) {
        state.heroFade = Math.max(0, state.heroFade - 1);
      }
    }

    // Energy: apply energy drain
    let energyThisTurn = state.hero.maxEnergy;
    if (state.hero.energyDrain > 0 && state.turn > 1) {
      energyThisTurn = Math.max(1, energyThisTurn - 1);
    }
    if (state.pendingEnergyNextTurn > 0) {
      energyThisTurn += Math.max(0, state.pendingEnergyNextTurn);
      state.pendingEnergyNextTurn = 0;
    }
    state.hero.energy = energyThisTurn;

    state.equippedSkills.forEach((skill: CombatEquippedSkillState) => {
      if (skill.remainingCooldown > 0) {
        skill.remainingCooldown = Math.max(0, skill.remainingCooldown - 1);
      }
    });

    // Card draw: apply chill (draw 1 fewer)
    let drawCount = Math.max(0, state.hero.handSize - state.hand.length);
    if (state.hero.chill > 0 && state.turn > 1) {
      drawCount = Math.max(0, drawCount - 1);
    }
    drawCards(state, drawCount);

    if (!getLivingEnemies(state).some((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId)) {
      state.selectedEnemyId = getFirstLivingEnemyId(state);
    }
    logCombat(state, {
      actor: "environment", actorName: "",
      action: "turn_start", tone: "report",
      message: `Turn ${state.turn} begins.`,
    });
  }

  function endTurn(state: CombatState) {
    if (state.phase !== COMBAT_PHASE.PLAYER || state.outcome) {
      return { ok: false, message: "The turn cannot end right now." };
    }

    if (hasSkillModifiers(state)) {
      logCombat(state, {
        actor: "environment", actorName: "",
        action: "turn_end", tone: "report",
        message: "The prepared skill window fades at end of turn.",
      });
      clearSkillModifiers(state);
    }

    decayHeroTurnDebuffs(state);

    discardHand(state);
    state.phase = COMBAT_PHASE.ENEMY;
    resolveMinionPhase(state);
    if (checkOutcome(state)) {
      return { ok: true, message: "Encounter resolved." };
    }
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
      if ((hasTrait(enemy, "swift") || hasTrait(enemy, TRAIT.EXTRA_FAST)) && enemy.alive) {
        const label = hasTrait(enemy, "swift") ? "Swift" : "Extra Fast";
        logCombat(state, {
          actor: "enemy", actorName: enemy.name, actorId: enemy.id,
          action: "intent", tone: "strike",
          message: `${enemy.name} strikes again! (${label})`,
        });
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
    state.potionsUsed += 1;
    const healed = healEntity(target, state.hero.potionHeal);
    logCombat(state, {
      actor: "hero", actorName: "the Wanderer",
      action: "potion",
      message: `Potion used on ${target.name} for ${healed}.`,
      effects: [{ target: targetId === "mercenary" ? "mercenary" : "hero", targetName: target.name, healing: healed, lifeAfter: target.life, guardAfter: target.guard }],
    });
    return { ok: true, message: "Potion used." };
  }

  runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS = {
    MAX_ACTIVE_MINIONS,
    healEntity,
    applyGuard,
    dealDamage,
    dealDirectDamage,
    dealDamageIgnoringGuard,
    dealLifeDamage,
    getMinionStackCount,
    getMinionArtTier,
    checkOutcome,
    getLivingEnemies,
    getFirstLivingEnemyId,
    getActiveMinions,
    getMinionTemplate,
    getMinionSkillSummary,
    getSummonPreview,
    appendLog,
    drawCards,
    discardHand,
    getWeaponAttackBonus,
    getWeaponSupportBonus,
    applyWeaponTypedDamage,
    applyWeaponEffects,
    meleeStrike,
    summonMinion,
    startPlayerTurn,
    endTurn,
    usePotion,
    resolveMinionPhase,
    resolveMercenaryAction,
    resolveEnemyAction,
    advanceEnemyIntents,
    _shuffleInPlace: shuffleInPlace,
  };
})();
