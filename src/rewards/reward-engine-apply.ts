(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp, toNumber } = runtimeWindow.ROUGE_UTILS;
  const MAX_BELT_SIZE = 5;
  const archetypes = runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES;
  const builder = runtimeWindow.__ROUGE_REWARD_ENGINE_BUILDER;

  function addCardToDeck(run: RunState, cardId: string, content: GameContent) {
    if (!content.cardCatalog[cardId]) {
      return { ok: false, message: `Unknown reward card: ${cardId}` };
    }
    run.deck.push(cardId);
    return { ok: true };
  }

  function upgradeCardInDeck(run: RunState, fromCardId: string, toCardId: string, content: GameContent) {
    if (!fromCardId || !toCardId || !content.cardCatalog[toCardId]) {
      return { ok: false, message: "Reward upgrade is invalid." };
    }
    const deckIndex = run.deck.findIndex((cardId: string) => cardId === fromCardId);
    if (deckIndex < 0) {
      return { ok: false, message: `No ${fromCardId} copy remains in the deck.` };
    }
    run.deck.splice(deckIndex, 1, toCardId);
    return { ok: true };
  }

  function applyChoice(run: RunState, choice: RewardChoice, content: GameContent) {
    const effects = Array.isArray(choice?.effects) ? choice.effects : [];
    const itemSystem = runtimeWindow.ROUGE_ITEM_SYSTEM;
    const equipmentEffects = effects.filter((effect: RewardChoiceEffect) => {
      return (
        effect.kind === "equip_item" ||
        effect.kind === "grant_item" ||
        effect.kind === "grant_rune" ||
        effect.kind === "socket_rune" ||
        effect.kind === "add_socket"
      );
    });

    if (equipmentEffects.length > 0 && itemSystem) {
      const equipmentResult = itemSystem.applyChoice(
        run,
        {
          ...choice,
          effects: equipmentEffects,
        },
        content
      );
      if (!equipmentResult.ok) {
        return equipmentResult;
      }
    }

    for (let index = 0; index < effects.length; index += 1) {
      const rawEffect = effects[index];
      let effect = rawEffect;
      if (rawEffect.kind === "reinforce_build") {
        effect = builder.resolveReinforceBuildReward(run, content).effect;
      } else if (rawEffect.kind === "support_build") {
        effect = builder.resolveSupportBuildReward(run, content).effect;
      } else if (rawEffect.kind === "pivot_build") {
        effect = builder.resolvePivotBuildReward(run, content).effect;
      }
      if (
        effect.kind === "equip_item" ||
        effect.kind === "grant_item" ||
        effect.kind === "grant_rune" ||
        effect.kind === "socket_rune" ||
        effect.kind === "add_socket"
      ) {
        continue;
      }

      if (effect.kind === "add_card") {
        const result = addCardToDeck(run, effect.cardId, content);
        if (!result.ok) {
          return result;
        }
        continue;
      }

      if (effect.kind === "upgrade_card") {
        const result = upgradeCardInDeck(run, effect.fromCardId, effect.toCardId, content);
        if (!result.ok) {
          return result;
        }
        continue;
      }

      if (effect.kind === "hero_max_life") {
        const lifeGain = toNumber(effect.value, 0);
        run.hero.maxLife += lifeGain;
        run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + lifeGain);
        continue;
      }

      if (effect.kind === "hero_max_energy") {
        const energyGain = toNumber(effect.value, 0);
        run.hero.maxEnergy = clamp(run.hero.maxEnergy + energyGain, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_ENERGY);
        continue;
      }

      if (effect.kind === "hero_potion_heal") {
        const potionGain = toNumber(effect.value, 0);
        run.hero.potionHeal = clamp(run.hero.potionHeal + potionGain, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_POTION_HEAL);
        continue;
      }

      if (effect.kind === "mercenary_attack") {
        const attackGain = toNumber(effect.value, 0);
        run.mercenary.attack += attackGain;
        continue;
      }

      if (effect.kind === "mercenary_max_life") {
        const lifeGain = toNumber(effect.value, 0);
        run.mercenary.maxLife += lifeGain;
        run.mercenary.currentLife = Math.min(run.mercenary.maxLife, run.mercenary.currentLife + lifeGain);
        continue;
      }

      if (effect.kind === "belt_capacity") {
        const capacityGain = toNumber(effect.value, 0);
        run.belt.max = clamp(run.belt.max + capacityGain, 1, MAX_BELT_SIZE);
        continue;
      }

      if (effect.kind === "refill_potions") {
        const refillAmount = toNumber(effect.value, 0);
        run.belt.current = Math.min(run.belt.max, run.belt.current + refillAmount);
        continue;
      }

      if (effect.kind === "gold_bonus") {
        const goldGain = toNumber(effect.value, 0);
        run.gold += goldGain;
        run.summary.goldGained += goldGain;
        continue;
      }

      if (effect.kind === "class_point") {
        const pointGain = toNumber(effect.value, 0);
        run.progression.classPointsAvailable += pointGain;
        run.summary.classPointsEarned += pointGain;
        continue;
      }

      if (effect.kind === "attribute_point") {
        const pointGain = toNumber(effect.value, 0);
        run.progression.attributePointsAvailable += pointGain;
        run.summary.attributePointsEarned += pointGain;
      }
    }

    archetypes.syncArchetypeScores(run, content);
    return { ok: true };
  }

  runtimeWindow.__ROUGE_REWARD_ENGINE_APPLY = {
    applyChoice,
  };
})();
