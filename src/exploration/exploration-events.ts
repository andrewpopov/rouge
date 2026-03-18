(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;

  const {
    SHRINE_EVENTS,
    BLESSING_EVENTS,
    GAMBLE_EVENTS,
    TRADER_EVENTS,
    MYSTERY_EVENTS,
    REST_EVENTS,
    TRIAL_EVENTS,
    getUpgradableCardIds,
  } = runtimeWindow.__ROUGE_EXPLORATION_EVENT_TEMPLATES;

  const EVENT_PROBABILITY = 0.20;

  interface EventTemplate {
    id: string;
    kind: ExplorationEvent["kind"];
    title: string;
    flavor: string;
    icon: string;
    buildChoices: (run: RunState, content: GameContent) => ExplorationEventChoice[];
    minEncountersCleared?: number;
    minGold?: number;
  }

  function getTotalEncountersCleared(run: RunState): number {
    return run.acts.reduce((sum, act) => {
      return sum + act.zones.reduce((zSum, z) => zSum + (z.encountersCleared || 0), 0);
    }, 0);
  }

  // ============================
  //  Card Upgrade Events
  // ============================

  const CARD_UPGRADE_EVENTS: EventTemplate[] = [
    {
      id: "ancient_forge",
      kind: "card_upgrade",
      title: "Ancient Forge",
      flavor: "Embers still glow in a long-abandoned forge. The anvil hums with residual enchantment. A skilled hand could rekindle the flames and temper a weapon of war into something greater.",
      icon: "\u{1F525}",
      minEncountersCleared: 1,
      buildChoices(run, content) {
        const upgradable = getUpgradableCardIds(run, content);
        if (upgradable.length === 0) {return [];}
        return [
          { id: "forge_attack", title: "Temper a Weapon", description: "Choose an Attack card to upgrade. The forge burns hottest for blades.", effects: [], requiresCardPick: true },
          { id: "forge_skill", title: "Reinforce a Technique", description: "Choose a Skill card to upgrade. Discipline sharpens what the forge cannot.", effects: [], requiresCardPick: true },
          { id: "forge_any", title: "Stoke the Flames", description: "Choose any card to upgrade. The forge does not discriminate.", effects: [], requiresCardPick: true },
        ];
      },
    },
    {
      id: "hermits_library",
      kind: "card_upgrade",
      title: "Hermit's Library",
      flavor: "Dust motes swirl in shafts of pale light. Shelves groan under the weight of forgotten tomes. A hermit gestures wordlessly toward three volumes, each bound in a different hide.",
      icon: "\u{1F4DA}",
      minEncountersCleared: 2,
      buildChoices(run, content) {
        const upgradable = getUpgradableCardIds(run, content);
        if (upgradable.length === 0) {return [];}
        return [
          { id: "study_offense", title: "Study the Red Tome", description: "Choose a card to upgrade. Gain insight into offensive mastery.", effects: [], requiresCardPick: true },
          { id: "study_defense", title: "Study the Blue Tome", description: "Choose a card to upgrade. Gain insight into defensive fortitude.", effects: [], requiresCardPick: true },
          { id: "study_forbidden", title: "Study the Black Tome", description: "Choose a card to upgrade, but lose 4 HP. Forbidden knowledge always has a price.", effects: [{ kind: "hero_damage", value: 4 }], requiresCardPick: true },
        ];
      },
    },
    {
      id: "wandering_smith",
      kind: "card_upgrade",
      title: "Wandering Smith",
      flavor: "A weathered figure sits by the roadside, tools spread on a leather mat. She looks up with knowing eyes. \"One piece. I'll improve one piece, then I walk on.\"",
      icon: "\u{1F528}",
      minEncountersCleared: 0,
      buildChoices(run, content) {
        const upgradable = getUpgradableCardIds(run, content);
        if (upgradable.length === 0) {return [];}
        return [
          { id: "smith_upgrade", title: "Accept Her Offer", description: "Choose any card from your deck to upgrade.", effects: [], requiresCardPick: true },
          { id: "smith_gold", title: "Pay for Supplies", description: "Pay 15 gold. She upgrades a card and sharpens your mercenary's blade (+1 attack).", effects: [{ kind: "gold_bonus", value: -15 }, { kind: "mercenary_attack", value: 1 }], requiresCardPick: true },
          { id: "smith_decline", title: "Decline and Move On", description: "Leave the smith be. Gain a small amount of gold from the roadside scraps.", effects: [{ kind: "gold_bonus", value: 8 }], requiresCardPick: false },
        ];
      },
    },
    {
      id: "runic_altar",
      kind: "card_upgrade",
      title: "Runic Altar",
      flavor: "Carved into the cavern wall, an altar pulses with dim blue light. Runes spiral outward from its center, waiting to be fed. The air tastes of iron and old magic.",
      icon: "\u{1F4A0}",
      minEncountersCleared: 3,
      buildChoices(run, content) {
        const upgradable = getUpgradableCardIds(run, content);
        if (upgradable.length === 0) {return [];}
        return [
          { id: "altar_blood", title: "Blood Offering", description: "Lose 6 HP. Upgrade a card of your choice. Power demands sacrifice.", effects: [{ kind: "hero_damage", value: 6 }], requiresCardPick: true },
          { id: "altar_gold", title: "Gold Offering", description: "Pay 20 gold. Upgrade a card and gain +4 max HP.", effects: [{ kind: "gold_bonus", value: -20 }, { kind: "hero_max_life", value: 4 }], requiresCardPick: true },
          { id: "altar_prayer", title: "Kneel and Pray", description: "Upgrade a card. The altar asks nothing in return, but the runes dim forever.", effects: [], requiresCardPick: true },
        ];
      },
    },
  ];

  // ============================
  //  All templates combined
  // ============================

  const EVENT_TEMPLATES: EventTemplate[] = [
    ...CARD_UPGRADE_EVENTS,
    ...SHRINE_EVENTS,
    ...BLESSING_EVENTS,
    ...GAMBLE_EVENTS,
    ...TRADER_EVENTS,
    ...MYSTERY_EVENTS,
    ...REST_EVENTS,
    ...TRIAL_EVENTS,
  ];

  function rollExplorationEvent(
    run: RunState,
    zone: ZoneState,
    content: GameContent,
    seed: number
  ): ExplorationEvent | null {
    const totalCleared = getTotalEncountersCleared(run);

    if (zone.kind === "boss") {return null;}

    const roll = ((seed * 7919 + 1301) % 1000) / 1000;
    if (roll > EVENT_PROBABILITY) {return null;}

    const eligible = EVENT_TEMPLATES.filter((template) => {
      if (template.minEncountersCleared && totalCleared < template.minEncountersCleared) {return false;}
      if (template.minGold && run.gold < template.minGold) {return false;}
      const choices = template.buildChoices(run, content);
      return choices.length > 0;
    });

    if (eligible.length === 0) {return null;}

    const template = eligible[seed % eligible.length];
    const choices = template.buildChoices(run, content);
    const zoneFlavor = runtimeWindow.__ROUGE_ZONE_FLAVOR?.getZoneFlavor(template.id, zone.title);

    return {
      id: template.id,
      kind: template.kind,
      title: template.title,
      flavor: zoneFlavor || template.flavor,
      icon: template.icon,
      choices,
    };
  }

  function applyExplorationEventChoice(
    run: RunState,
    event: ExplorationEvent,
    choiceId: string,
    content: GameContent,
    cardId?: string
  ): ActionResult {
    const choice = event.choices.find((c) => c.id === choiceId);
    if (!choice) {return { ok: false, message: "Invalid event choice." };}

    if (choice.requiresCardPick && cardId) {
      const upgradedCardId = `${cardId}_plus`;
      if (!content.cardCatalog[upgradedCardId]) {
        return { ok: false, message: "That card cannot be upgraded." };
      }
      const deckIndex = run.deck.findIndex((id) => id === cardId);
      if (deckIndex < 0) {
        return { ok: false, message: "Card not found in deck." };
      }
      run.deck.splice(deckIndex, 1, upgradedCardId);
    }

    for (const effect of choice.effects) {
      if (effect.kind === "gold_bonus") {
        const goldDelta = toNumber(effect.value, 0);
        run.gold = Math.max(0, run.gold + goldDelta);
      }
      if (effect.kind === "mercenary_attack") {
        const attackGain = toNumber(effect.value, 0);
        run.mercenary.attack += attackGain;
      }
      if (effect.kind === "mercenary_max_life") {
        const gain = toNumber(effect.value, 0);
        run.mercenary.maxLife += gain;
        run.mercenary.currentLife = Math.min(run.mercenary.maxLife, run.mercenary.currentLife + gain);
      }
      if (effect.kind === "hero_damage") {
        const damage = toNumber(effect.value, 0);
        run.hero.currentLife = Math.max(1, run.hero.currentLife - damage);
      }
      if (effect.kind === "hero_heal") {
        const heal = toNumber(effect.value, 0);
        run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + heal);
      }
      if (effect.kind === "hero_max_life") {
        const gain = toNumber(effect.value, 0);
        run.hero.maxLife += gain;
        run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + gain);
      }
      if (effect.kind === "belt_capacity") {
        const gain = toNumber(effect.value, 0);
        run.belt.max += gain;
      }
      if (effect.kind === "refill_potions") {
        const refill = toNumber(effect.value, 0);
        run.belt.current = Math.min(run.belt.max, run.belt.current + refill);
      }
    }

    return { ok: true };
  }

  runtimeWindow.ROUGE_EXPLORATION_EVENTS = {
    rollExplorationEvent,
    applyExplorationEventChoice,
    getUpgradableCardIds,
  };
})();
