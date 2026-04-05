(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
  const {
    applyGuard, appendLog, drawCards, healEntity, dealDamage,
    clearSkillModifiers, addSkillModifiers,
    getSelectedEnemy, getSkillTierScale,
    createEmptySkillModifiers, createHero,
    createMercenary, createEnemy, applyRandomAffixes, createDeck,
    describeIntent, getCardDefinition, addDamageTypeRider,
    applyEnemySkillRider, getSkillPreparationSummary, hasSkillModifiers,
    applyPassiveSkill,
  } = h;
  const { parseInteger } = runtimeWindow.ROUGE_UTILS;
  const { resolveCardEffect, summarizeCardEffect } = runtimeWindow.__ROUGE_CARD_EFFECTS;
  const { COMBAT_PHASE } = runtimeWindow.ROUGE_CONSTANTS;
  const {
    getLivingEnemies, getFirstLivingEnemyId, startPlayerTurn,
    endTurn, usePotion, meleeStrike, checkOutcome,
  } = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;

  function createCombatSkill(entry: CombatSkillLoadoutEntry): CombatEquippedSkillState {
    return {
      slotKey: entry.slotKey,
      skillId: entry.skill.id,
      name: entry.skill.name,
      family: entry.skill.family,
      slot: entry.skill.slot,
      tier: entry.skill.tier,
      cost: entry.skill.cost,
      cooldown: entry.skill.cooldown,
      remainingCooldown: 0,
      chargeCount: Math.max(0, entry.skill.chargeCount || 0),
      chargesRemaining: Math.max(0, entry.skill.chargeCount || 0),
      oncePerBattle: Boolean(entry.skill.oncePerBattle),
      usedThisBattle: false,
      summary: entry.skill.summary,
      exactText: entry.skill.exactText,
      active: entry.skill.active !== false,
      skillType: entry.skill.skillType || "attack",
      damageType: entry.skill.damageType || "none",
    };
  }

  function useSkill(state: CombatState, slotKey: RunSkillBarSlotKey, targetId = "") {
    if (state.phase !== COMBAT_PHASE.PLAYER || state.outcome) {
      return { ok: false, message: "Skills can only be used during the player turn." };
    }

    const skill = state.equippedSkills.find((entry) => entry.slotKey === slotKey) || null;
    if (!skill) {
      return { ok: false, message: "No skill is equipped in that slot." };
    }
    if (!skill.active) {
      return { ok: false, message: "That skill is passive in combat." };
    }
    if (skill.remainingCooldown > 0) {
      return { ok: false, message: "That skill is still on cooldown." };
    }
    if (skill.oncePerBattle && skill.usedThisBattle) {
      return { ok: false, message: "That skill can only be used once per battle." };
    }
    if (skill.chargeCount > 0 && skill.chargesRemaining <= 0) {
      return { ok: false, message: "That skill is out of charges." };
    }
    if (state.hero.energy < skill.cost) {
      return { ok: false, message: "Not enough Energy." };
    }

    state.hero.energy -= skill.cost;
    skill.usedThisBattle = true;
    if (skill.chargeCount > 0) {
      skill.chargesRemaining = Math.max(0, skill.chargesRemaining - 1);
    }
    skill.remainingCooldown = Math.max(0, skill.cooldown);

    const scale = getSkillTierScale(skill);
    const targetEnemy = getSelectedEnemy(state, targetId);
    const modifiers: Partial<CombatSkillModifierState> = {};
    const segments: string[] = [];

    const specificResult = runtimeWindow.__ROUGE_COMBAT_ENGINE_SKILLS?.useSpecificActiveSkill?.(state, skill, targetEnemy);
    if (specificResult) {
      return specificResult;
    }

    if (skill.skillType === "attack" || skill.skillType === "spell") {
      if (targetEnemy) {
        const baseDamage = skill.skillType === "spell" ? 2 + scale * 2 : 3 + scale * 2;
        const dealt = dealDamage(state, targetEnemy, Math.max(1, baseDamage), skill.damageType === "none" ? undefined : skill.damageType as DamageType);
        segments.push(`hits ${targetEnemy.name} for ${dealt}`);
      }
      modifiers.nextCardDamageBonus = (modifiers.nextCardDamageBonus || 0) + (scale + 1);
      if (skill.skillType === "spell") {
        modifiers.nextCardCostReduction = (modifiers.nextCardCostReduction || 0) + 1;
      }
      addDamageTypeRider(modifiers, skill.damageType, scale);
    } else if (skill.skillType === "buff" || skill.skillType === "aura") {
      const guardValue = 3 + scale * 2;
      applyGuard(state.hero, guardValue);
      if (skill.family === "command" && state.mercenary.alive) {
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 2);
        segments.push(`rallies the mercenary`);
      } else {
        segments.push(`grants ${guardValue} Guard`);
      }
      modifiers.nextCardCostReduction = 1;
      modifiers.nextCardGuard = scale + 1;
      addDamageTypeRider(modifiers, skill.damageType, scale);
    } else if (skill.skillType === "debuff") {
      const rider = applyEnemySkillRider(targetEnemy, skill.damageType, scale + 1)
        || (targetEnemy ? applyEnemySkillRider(targetEnemy, "cold", scale) : "");
      if (rider) {
        segments.push(rider);
      }
      modifiers.nextCardCostReduction = 1;
      modifiers.nextCardDamageBonus = scale;
    } else if (skill.skillType === "summon") {
      const guardValue = 2 + scale;
      applyGuard(state.hero, guardValue);
      if (state.mercenary.alive) {
        applyGuard(state.mercenary, guardValue);
      }
      state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 1);
      drawCards(state, 1);
      segments.push(`bolsters the party and draws 1`);
      modifiers.nextCardGuard = scale;
    } else if (skill.family === "recovery") {
        const healed = healEntity(state.hero, 3 + scale * 2);
        drawCards(state, 1);
        segments.push(`heals ${healed} and draws 1`);
        modifiers.nextCardGuard = scale;
      } else if (skill.family === "command") {
        drawCards(state, 1);
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 2);
        segments.push(`draws 1 and readies the mercenary`);
        modifiers.nextCardDraw = 1;
      } else if (skill.family === "state") {
        const guardValue = 3 + scale * 2;
        applyGuard(state.hero, guardValue);
        segments.push(`steadies the Wanderer with ${guardValue} Guard`);
        modifiers.nextCardCostReduction = 1;
        modifiers.nextCardGuard = scale + 1;
      } else {
        modifiers.nextCardDamageBonus = 2 + scale;
        modifiers.nextCardDraw = skill.family === "commitment" ? 1 : 0;
        addDamageTypeRider(modifiers, skill.damageType, scale);
        segments.push(`arms the next card`);
      }

    addSkillModifiers(state, modifiers);
    if (segments.length === 0) {
      segments.push("changes the line of play");
    }
    appendLog(
      state,
      `${skill.name}: ${segments.join(", ")}${getSkillPreparationSummary(state.skillModifiers) ? ` (${getSkillPreparationSummary(state.skillModifiers)}).` : "."}`
    );

    if (targetEnemy?.id) {
      state.selectedEnemyId = targetEnemy.id;
    }
    checkOutcome(state);
    return { ok: true, message: "Skill used." };
  }

  function playCard(state: CombatState, content: GameContent, instanceId: string, targetId: string = "") {
    if (state.phase !== COMBAT_PHASE.PLAYER || state.outcome) {
      return { ok: false, message: "Cards can only be played during the player turn." };
    }

    const handIndex = state.hand.findIndex((entry: CardInstance) => entry.instanceId === instanceId);
    if (handIndex < 0) {
      return { ok: false, message: "Card is not in hand." };
    }

    const cardInstance = state.hand[handIndex];
    const card = getCardDefinition(content, cardInstance.cardId);
    if (!card) {
      return { ok: false, message: "Unknown card." };
    }
    const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
    const costReduction = evo ? evo.getTreeCostReduction(cardInstance.cardId, state.deckCardIds, content.cardCatalog) : 0;
    const skillCostReduction = Math.max(0, state.skillModifiers?.nextCardCostReduction || 0);
    const effectiveCost = Math.max(0, card.cost - costReduction - skillCostReduction);
    if (state.hero.energy < effectiveCost) {
      return { ok: false, message: "Not enough Energy." };
    }

    const targetEnemy =
      card.target === "enemy"
        ? state.enemies.find((enemy: CombatEnemyState) => enemy.id === targetId && enemy.alive) || null
        : null;
    if (card.target === "enemy" && !targetEnemy) {
      return { ok: false, message: "Select a living enemy." };
    }

    state.hero.energy -= effectiveCost;
    state.hand.splice(handIndex, 1);
    state.cardsPlayed += 1;

    const segments: string[] = [];
    card.effects.forEach((effect: CardEffect) => {
      const segment = resolveCardEffect(state, effect, targetEnemy, cardInstance.cardId);
      if (segment) {
        segments.push(segment);
      }
    });

    state.discardPile.push(cardInstance);
    appendLog(state, summarizeCardEffect(card, segments));
    if (hasSkillModifiers(state)) {
      clearSkillModifiers(state);
    }

    if (targetEnemy?.id) {
      state.selectedEnemyId = targetEnemy.id;
    }
    if (!getLivingEnemies(state).some((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId)) {
      state.selectedEnemyId = getFirstLivingEnemyId(state);
    }

    checkOutcome(state);
    return { ok: true, message: "Card played." };
  }

  function applyEncounterModifiers(state: CombatState) {
    if (!runtimeWindow.ROUGE_COMBAT_MODIFIERS) {
      throw new Error("Combat modifiers helper is unavailable.");
    }
    runtimeWindow.ROUGE_COMBAT_MODIFIERS.applyEncounterModifiers(state);
  }

  function applyMercenaryContractBonuses(state: CombatState) {
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

  function createCombatState({
    content,
    encounterId,
    mercenaryId,
    randomFn = Math.random,
    heroState = null,
    mercenaryState = null,
    starterDeck = null,
    initialPotions = 2,
    weaponFamily = "",
    weaponName = "",
    weaponDamageBonus = 0,
    weaponProfile = null,
    armorProfile = null,
    classPreferredFamilies = [],
    equippedSkills = null,
  }: {
    content: GameContent;
    encounterId: string;
    mercenaryId: string;
    randomFn?: RandomFn;
    heroState?: Record<string, unknown> | null;
    mercenaryState?: Record<string, unknown> | null;
    starterDeck?: string[] | null;
    initialPotions?: number;
    weaponFamily?: string;
    weaponName?: string;
    weaponDamageBonus?: number;
    weaponProfile?: WeaponCombatProfile | null;
    armorProfile?: ArmorMitigationProfile | null;
    classPreferredFamilies?: string[];
    equippedSkills?: CombatSkillLoadoutEntry[] | null;
  }) {
    const encounter = content.encounterCatalog[encounterId];
    const state = {
      encounter,
      randomFn,
      nextCardInstanceId: 1,
      turn: 0,
      phase: COMBAT_PHASE.PLAYER,
      outcome: null as CombatOutcome | null,
      potions: Math.max(0, parseInteger(initialPotions, 0)),
      hero: createHero(content, heroState),
      mercenary: createMercenary(content, mercenaryId, mercenaryState),
      minions: [] as CombatMinionState[],
      enemies: encounter.enemies.map((enemyEntry: EncounterEnemyEntry) => createEnemy(content, enemyEntry)),
      drawPile: [] as CardInstance[],
      discardPile: [] as CardInstance[],
      hand: [] as CardInstance[],
      equippedSkills: (Array.isArray(equippedSkills) ? equippedSkills : []).map((entry) => createCombatSkill(entry)),
      skillModifiers: createEmptySkillModifiers(),
      log: [] as string[],
      selectedEnemyId: "",
      meleeUsed: false,
      weaponFamily,
      weaponName,
      weaponDamageBonus,
      weaponProfile,
      armorProfile,
      classPreferredFamilies,
      summonPowerBonus: 0,
      summonSecondaryBonus: 0,
      deckCardIds: Array.isArray(starterDeck) && starterDeck.length > 0 ? [...starterDeck] : [...content.starterDeck],
      cardsPlayed: 0,
      potionsUsed: 0,
      lowestHeroLife: 0,
      lowestMercenaryLife: 0,
    };

    state.lowestHeroLife = state.hero.life;
    state.lowestMercenaryLife = state.mercenary.life;

    applyRandomAffixes(state, randomFn, encounterId);

    // Process on-spawn triggers (ETB effects) — only for original encounter enemies
    const initialEnemies = [...state.enemies];
    initialEnemies.forEach((enemy: CombatEnemyState) => {
      runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS.processSpawnTraits(state, enemy);
    });

    state.drawPile = createDeck(state, content, starterDeck);
    state.selectedEnemyId = getFirstLivingEnemyId(state);
    appendLog(state, `${encounter.name}: ${encounter.description}`);
    applyEncounterModifiers(state);
    startPlayerTurn(state);
    applyMercenaryContractBonuses(state);
    state.equippedSkills
      .filter((skill) => !skill.active)
      .forEach((skill) => applyPassiveSkill(state, skill));
    return state;
  }

  runtimeWindow.ROUGE_COMBAT_ENGINE = {
    createCombatState,
    playCard,
    useSkill,
    endTurn,
    usePotion,
    meleeStrike,
    describeIntent,
    getLivingEnemies,
    getFirstLivingEnemyId,
  };
})();
