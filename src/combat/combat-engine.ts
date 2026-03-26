(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    applyGuard,
    checkOutcome,
    getLivingEnemies,
    getFirstLivingEnemyId,
    appendLog,
    drawCards,
    startPlayerTurn,
    endTurn,
    usePotion,
    meleeStrike,
    _shuffleInPlace: shuffleInPlace,
  } = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
  const { clamp, parseInteger } = runtimeWindow.ROUGE_UTILS;
  const { resolveCardEffect, summarizeCardEffect } = runtimeWindow.__ROUGE_CARD_EFFECTS;
  const { COMBAT_PHASE } = runtimeWindow.ROUGE_CONSTANTS;

  function makeCardInstance(state: CombatState, cardId: string) {
    const instanceId = `card_${state.nextCardInstanceId}`;
    state.nextCardInstanceId += 1;
    return { instanceId, cardId };
  }

  function createHero(content: GameContent, heroState: Record<string, unknown> | null = null) {
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
      heroBurn: 0,
      heroPoison: 0,
      chill: 0,
      amplify: 0,
      weaken: 0,
      energyDrain: 0,
    };
  }

  function createMercenary(content: GameContent, mercenaryId: string, mercenaryState: Record<string, unknown> | null = null) {
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

  function createEnemy(content: GameContent, enemyEntry: EncounterEnemyEntry) {
    const template = content.enemyCatalog[enemyEntry.templateId];
    const { TRAIT } = runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS;
    const hasTraitStoneSkin = Array.isArray(template.traits) && template.traits.includes(TRAIT.STONE_SKIN);
    return {
      id: enemyEntry.id,
      templateId: template.templateId,
      name: template.name,
      role: template.role || "",
      maxLife: template.maxLife,
      life: template.maxLife,
      guard: hasTraitStoneSkin ? Math.floor(template.maxLife * 0.3) : 0,
      burn: 0,
      poison: 0,
      slow: 0,
      freeze: 0,
      stun: 0,
      paralyze: 0,
      alive: true,
      intentIndex: 0,
      currentIntent: { ...template.intents[0] },
      intents: template.intents.map((intent: EnemyIntent) => ({ ...intent })),
      traits: Array.isArray(template.traits) ? [...template.traits] : [],
      family: template.family || "",
      summonTemplateId: template.summonTemplateId || "",
      spawnConfig: template.spawnConfig || undefined,
      consumed: false,
      buffedAttack: 0,
      cooldowns: {},
    };
  }

  function parseActNumber(encounterId: string): number {
    const match = encounterId.match(/^act_(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function applyRandomAffixes(state: CombatState, randomFn: RandomFn, encounterId: string) {
    const { TRAIT, rollRandomAffixes } = runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS;
    const { ATTACK_INTENT_KINDS } = runtimeWindow.ROUGE_COMBAT_MODIFIERS;
    const actNumber = parseActNumber(encounterId);

    state.enemies.forEach((enemy: CombatEnemyState) => {
      let variant = "base";
      if (enemy.templateId.includes("_elite")) { variant = "elite"; }
      else if (enemy.templateId.endsWith("_boss")) { variant = "boss"; }
      const result = rollRandomAffixes(actNumber, variant, enemy.traits, randomFn);
      if (result.traits.length === 0) { return; }

      enemy.traits.push(...result.traits);
      enemy.maxLife += result.lifeBonus;
      enemy.life += result.lifeBonus;

      if (result.traits.includes(TRAIT.STONE_SKIN)) {
        const stoneSkinGuard = Math.floor(enemy.maxLife * 0.3);
        enemy.guard = Math.max(enemy.guard, stoneSkinGuard);
      }

      enemy.intents.forEach((intent: EnemyIntent) => {
        if (ATTACK_INTENT_KINDS.has(intent.kind)) {
          intent.value += result.attackBonus;
        }
      });
      enemy.currentIntent = { ...enemy.intents[enemy.intentIndex] };
    });
  }

  function createDeck(state: CombatState, content: GameContent, starterDeck: string[] | null = null) {
    const deckSource = Array.isArray(starterDeck) && starterDeck.length > 0 ? starterDeck : content.starterDeck;
    const deck = deckSource.map((cardId: string) => makeCardInstance(state, cardId));
    return shuffleInPlace(deck, state.randomFn);
  }

  function getCardDefinition(content: GameContent, cardId: string) {
    return content.cardCatalog[cardId] || null;
  }

  function describeIntent(intent: EnemyIntent | null) {
    if (!intent) {
      return "No action";
    }
    if (intent.kind === "attack") {
      return `${intent.value} dmg`;
    }
    if (intent.kind === "attack_all") {
      return `${intent.value} dmg all`;
    }
    if (intent.kind === "attack_and_guard") {
      return `${intent.value} dmg + Guard`;
    }
    if (intent.kind === "drain_attack") {
      return `${intent.value} dmg + heal`;
    }
    if (intent.kind === "charge") {
      const scope = intent.target === "all_allies" ? " all" : intent.target === "mercenary" ? " merc" : "";
      const damageType = intent.damageType ? ` ${intent.damageType}` : "";
      return `${intent.label} (${intent.value} dmg${scope}${damageType} next)`;
    }
    if (intent.kind === "teleport") {
      return `${intent.label} (+${intent.value} Guard)`;
    }
    if (intent.kind === "guard") {
      return `+${intent.value} Guard`;
    }
    if (intent.kind === "guard_allies") {
      return `+${intent.value} Guard all`;
    }
    if (intent.kind === "heal_ally") {
      return `Heal ${intent.value}`;
    }
    if (intent.kind === "heal_allies") {
      return `Heal all ${intent.value}`;
    }
    if (intent.kind === "heal_and_guard") {
      return "Heal + Guard";
    }
    if (intent.kind === "sunder_attack") {
      return `Sunder ${intent.value}`;
    }
    if (intent.kind === "resurrect_ally") {
      return "Resurrect";
    }
    if (intent.kind === "summon_minion") {
      return "Summon";
    }
    if (intent.kind === "attack_burn") {
      return `${intent.value} dmg + Burn`;
    }
    if (intent.kind === "attack_burn_all") {
      return `${intent.value} dmg all + Burn`;
    }
    if (intent.kind === "attack_lightning") {
      return `${intent.value} dmg + Lightning`;
    }
    if (intent.kind === "attack_lightning_all") {
      return `${intent.value} dmg all + Lightning`;
    }
    if (intent.kind === "attack_poison") {
      return `${intent.value} dmg + Poison`;
    }
    if (intent.kind === "attack_poison_all") {
      return `${intent.value} dmg all + Poison`;
    }
    if (intent.kind === "attack_chill") {
      return `${intent.value} dmg + Chill`;
    }
    if (intent.kind === "curse_amplify") {
      return "Amplify Damage";
    }
    if (intent.kind === "curse_weaken") {
      return "Decrepify";
    }
    if (intent.kind === "drain_energy") {
      return `${intent.value} dmg + Drain`;
    }
    if (intent.kind === "buff_allies_attack") {
      return `Buff allies +${intent.value}`;
    }
    if (intent.kind === "consume_corpse") {
      return "Consume corpse";
    }
    if (intent.kind === "corpse_explosion") {
      return "Corpse Explosion";
    }
    return intent.label || "Unknown";
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
    const effectiveCost = Math.max(0, card.cost - costReduction);
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

    const segments: string[] = [];
    card.effects.forEach((effect: CardEffect) => {
      const segment = resolveCardEffect(state, effect, targetEnemy, cardInstance.cardId);
      if (segment) {
        segments.push(segment);
      }
    });

    state.discardPile.push(cardInstance);
    appendLog(state, summarizeCardEffect(card, segments));

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
      enemies: encounter.enemies.map((enemyEntry: EncounterEnemyEntry) => createEnemy(content, enemyEntry)),
      drawPile: [] as CardInstance[],
      discardPile: [] as CardInstance[],
      hand: [] as CardInstance[],
      log: [] as string[],
      selectedEnemyId: "",
      meleeUsed: false,
      weaponFamily,
      weaponName,
      weaponDamageBonus,
      weaponProfile,
      armorProfile,
      classPreferredFamilies,
      deckCardIds: Array.isArray(starterDeck) && starterDeck.length > 0 ? [...starterDeck] : [...content.starterDeck],
    };

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
    return state;
  }

  runtimeWindow.ROUGE_COMBAT_ENGINE = {
    createCombatState,
    playCard,
    endTurn,
    usePotion,
    meleeStrike,
    describeIntent,
    getLivingEnemies,
    getFirstLivingEnemyId,
  };
})();
