(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    healEntity,
    applyGuard,
    dealDamage,
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
  const { clamp } = runtimeWindow.ROUGE_UTILS;

  function parseInteger(value: unknown, fallback: number) {
    const parsed = Number.parseInt(value as string, 10);
    return Number.isInteger(parsed) ? parsed : fallback;
  }

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
    const { D2_MOD } = runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS;
    const hasTraitStoneSkin = Array.isArray(template.traits) && template.traits.includes(D2_MOD.STONE_SKIN);
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
      consumed: false,
      buffedAttack: 0,
      cooldowns: {},
    };
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
    if (intent.kind === "attack_poison") {
      return `${intent.value} dmg + Poison`;
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

  function summarizeCardEffect(card: CardDefinition, segments: string[]) {
    if (segments.length === 0) {
      return `${card.title} resolved.`;
    }
    return `${card.title}: ${segments.join(" ")}`;
  }

  function applyWeaken(state: CombatState, amount: number) {
    if (state.hero.weaken > 0) {
      return Math.max(1, Math.floor(amount * 0.7));
    }
    return amount;
  }

  function resolveCardEffect(state: CombatState, effect: CardEffect, targetEnemy: CombatEnemyState | null) {
    if (effect.kind === "damage") {
      const damage = applyWeaken(state, Math.max(0, effect.value + state.hero.damageBonus));
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
    if (effect.kind === "apply_poison") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.poison = Math.max(0, targetEnemy.poison + effect.value);
        return `applied ${effect.value} Poison.`;
      }
      return "";
    }
    if (effect.kind === "apply_slow") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.slow = Math.max(0, targetEnemy.slow + effect.value);
        return `applied ${effect.value} Slow.`;
      }
      return "";
    }
    if (effect.kind === "apply_freeze") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.freeze = Math.max(0, targetEnemy.freeze + effect.value);
        return `applied ${effect.value} Freeze.`;
      }
      return "";
    }
    if (effect.kind === "apply_stun") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.stun = 1;
        return `stunned ${targetEnemy.name}.`;
      }
      return "";
    }
    if (effect.kind === "apply_paralyze") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.paralyze = Math.max(0, targetEnemy.paralyze + effect.value);
        return `applied ${effect.value} Paralyze.`;
      }
      return "";
    }
    if (effect.kind === "apply_burn_all") {
      const living = getLivingEnemies(state);
      const burnValue = Math.max(0, effect.value + state.hero.burnBonus);
      living.forEach((enemy: CombatEnemyState) => { enemy.burn = Math.max(0, enemy.burn + burnValue); });
      return `applied ${burnValue} Burn to all enemies.`;
    }
    if (effect.kind === "apply_poison_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.poison = Math.max(0, enemy.poison + effect.value); });
      return `applied ${effect.value} Poison to all enemies.`;
    }
    if (effect.kind === "apply_slow_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.slow = Math.max(0, enemy.slow + effect.value); });
      return `applied ${effect.value} Slow to all enemies.`;
    }
    if (effect.kind === "apply_freeze_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.freeze = Math.max(0, enemy.freeze + effect.value); });
      return `applied ${effect.value} Freeze to all enemies.`;
    }
    if (effect.kind === "apply_stun_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.stun = 1; });
      return `stunned all enemies.`;
    }
    if (effect.kind === "apply_paralyze_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.paralyze = Math.max(0, enemy.paralyze + effect.value); });
      return `applied ${effect.value} Paralyze to all enemies.`;
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
      const damage = applyWeaken(state, Math.max(0, effect.value + state.hero.damageBonus));
      const total = getLivingEnemies(state).reduce((sum: number, enemy: CombatEnemyState) => sum + dealDamage(state, enemy, damage), 0);
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

  function playCard(state: CombatState, content: GameContent, instanceId: string, targetId: string = "") {
    if (state.phase !== "player" || state.outcome) {
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
    if (state.hero.energy < card.cost) {
      return { ok: false, message: "Not enough Energy." };
    }

    const targetEnemy =
      card.target === "enemy"
        ? state.enemies.find((enemy: CombatEnemyState) => enemy.id === targetId && enemy.alive) || null
        : null;
    if (card.target === "enemy" && !targetEnemy) {
      return { ok: false, message: "Select a living enemy." };
    }

    state.hero.energy -= card.cost;
    state.hand.splice(handIndex, 1);

    const segments: string[] = [];
    card.effects.forEach((effect: CardEffect) => {
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
    weaponDamageBonus = 0,
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
    weaponDamageBonus?: number;
    classPreferredFamilies?: string[];
  }) {
    const encounter = content.encounterCatalog[encounterId];
    const state = {
      encounter,
      randomFn,
      nextCardInstanceId: 1,
      turn: 0,
      phase: "player" as CombatPhase,
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
      weaponDamageBonus,
      classPreferredFamilies,
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
    meleeStrike,
    describeIntent,
    getLivingEnemies,
    getFirstLivingEnemyId,
  };
})();
