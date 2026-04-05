(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    applyGuard, getLivingEnemies, appendLog, drawCards, healEntity, dealDamage,
    summonMinion: _summonMinion, _shuffleInPlace: shuffleInPlace,
  } = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
  const { clamp, parseInteger } = runtimeWindow.ROUGE_UTILS;

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

  const INTENT_TEMPLATES: Record<string, string | null> = {
    attack: "V dmg", attack_all: "V dmg all", attack_and_guard: "V dmg + Guard",
    drain_attack: "V dmg + heal", guard: "+V Guard", guard_allies: "+V Guard all",
    heal_ally: "Heal V", heal_allies: "Heal all V", heal_and_guard: "Heal + Guard",
    sunder_attack: "Sunder V", resurrect_ally: "Resurrect", summon_minion: "Summon",
    attack_burn: "V dmg + Burn", attack_burn_all: "V dmg all + Burn",
    attack_lightning: "V dmg + Lightning", attack_lightning_all: "V dmg all + Lightning",
    attack_poison: "V dmg + Poison", attack_poison_all: "V dmg all + Poison",
    attack_chill: "V dmg + Chill", curse_amplify: "Amplify Damage", curse_weaken: "Decrepify",
    drain_energy: "V dmg + Drain", consume_corpse: "Consume corpse", corpse_explosion: "Corpse Explosion",
    buff_allies_attack: "Buff allies +V",
  };
  function describeIntent(intent: EnemyIntent | null) {
    if (!intent) { return "No action"; }
    if (intent.kind === "charge") {
      let scope = "";
      if (intent.target === "all_allies") { scope = " all"; }
      else if (intent.target === "mercenary") { scope = " merc"; }
      return `${intent.label} (${intent.value} dmg${scope}${intent.damageType ? ` ${intent.damageType}` : ""} next)`;
    }
    if (intent.kind === "teleport") { return `${intent.label} (+${intent.value} Guard)`; }
    const template = INTENT_TEMPLATES[intent.kind];
    if (template) { return template.replace(/V/g, String(intent.value)); }
    return intent.label || "Unknown";
  }

  function createEmptySkillModifiers(): CombatSkillModifierState {
    return {
      nextCardCostReduction: 0,
      nextCardDamageBonus: 0,
      nextCardBurn: 0,
      nextCardPoison: 0,
      nextCardSlow: 0,
      nextCardFreeze: 0,
      nextCardParalyze: 0,
      nextCardDraw: 0,
      nextCardGuard: 0,
    };
  }

  function hasSkillModifiers(state: CombatState) {
    const modifiers = state.skillModifiers || createEmptySkillModifiers();
    return Object.values(modifiers).some((value) => value > 0);
  }

  function clearSkillModifiers(state: CombatState) {
    state.skillModifiers = createEmptySkillModifiers();
  }

  function addSkillModifiers(state: CombatState, patch: Partial<CombatSkillModifierState>) {
    const next = { ...(state.skillModifiers || createEmptySkillModifiers()) };
    (Object.keys(next) as Array<keyof CombatSkillModifierState>).forEach((key) => {
      next[key] = Math.max(0, (next[key] || 0) + Math.max(0, patch[key] || 0));
    });
    state.skillModifiers = next;
  }

  function getSkillTierScale(skill: CombatEquippedSkillState) {
    if (skill.slot === 3 || skill.tier === "capstone") {
      return 3;
    }
    if (skill.slot === 2 || skill.tier === "bridge") {
      return 2;
    }
    return 1;
  }

  function getSelectedEnemy(state: CombatState, targetId = "") {
    return state.enemies.find((enemy: CombatEnemyState) => enemy.id === targetId && enemy.alive)
      || state.enemies.find((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId && enemy.alive)
      || getLivingEnemies(state)[0]
      || null;
  }

  function getOtherLivingEnemy(state: CombatState, excludedId = "") {
    return getLivingEnemies(state).find((enemy: CombatEnemyState) => enemy.id !== excludedId) || null;
  }

  function applyEnemyStatus(targetEnemy: CombatEnemyState | null, status: StatusEffectKind, amount: number) {
    if (!targetEnemy || !targetEnemy.alive || amount <= 0) {
      return "";
    }
    if (status === "burn") {
      targetEnemy.burn = Math.max(0, targetEnemy.burn + amount);
      return `burns ${targetEnemy.name} for ${amount}`;
    }
    if (status === "poison") {
      targetEnemy.poison = Math.max(0, targetEnemy.poison + amount);
      return `poisons ${targetEnemy.name} for ${amount}`;
    }
    if (status === "slow") {
      targetEnemy.slow = Math.max(0, targetEnemy.slow + amount);
      return `slows ${targetEnemy.name} for ${amount}`;
    }
    if (status === "freeze") {
      targetEnemy.freeze = Math.max(0, targetEnemy.freeze + amount);
      return `freezes ${targetEnemy.name} for ${amount}`;
    }
    if (status === "stun") {
      targetEnemy.stun = Math.max(0, targetEnemy.stun + amount);
      return `stuns ${targetEnemy.name} for ${amount}`;
    }
    if (status === "paralyze") {
      targetEnemy.paralyze = Math.max(0, targetEnemy.paralyze + amount);
      return `paralyzes ${targetEnemy.name} for ${amount}`;
    }
    return "";
  }

  function applyStatusToAllEnemies(state: CombatState, status: StatusEffectKind, amount: number) {
    if (amount <= 0) {
      return 0;
    }
    let affected = 0;
    getLivingEnemies(state).forEach((enemy: CombatEnemyState) => {
      const result = applyEnemyStatus(enemy, status, amount);
      if (result) {
        affected += 1;
      }
    });
    return affected;
  }

  function createSummonSkillEffect(state: CombatState, minionId: string, value: number, secondaryValue = 0, duration = 3): CardEffect {
    return {
      kind: "summon_minion",
      minionId,
      value: Math.max(1, value + Math.max(0, state.summonPowerBonus || 0)),
      secondaryValue: Math.max(0, secondaryValue + Math.max(0, state.summonSecondaryBonus || 0)),
      duration,
    };
  }

  function dealDamageToAllEnemies(state: CombatState, amount: number, damageType: DamageType) {
    const enemies = getLivingEnemies(state);
    enemies.forEach((enemy: CombatEnemyState) => {
      dealDamage(state, enemy, amount, damageType);
    });
    return enemies.length;
  }

  function applyGuardToParty(state: CombatState, heroGuard: number, mercenaryGuard = heroGuard) {
    applyGuard(state.hero, heroGuard);
    if (state.mercenary.alive) {
      applyGuard(state.mercenary, mercenaryGuard);
    }
  }

  function healParty(state: CombatState, amount: number) {
    const heroHealed = healEntity(state.hero, amount);
    const mercenaryHealed = state.mercenary.alive ? healEntity(state.mercenary, amount) : 0;
    return { heroHealed, mercenaryHealed };
  }

  function addDamageTypeRider(modifiers: Partial<CombatSkillModifierState>, damageType: SkillDamageTypeId, amount: number) {
    if (damageType === "fire") {
      modifiers.nextCardBurn = Math.max(0, (modifiers.nextCardBurn || 0) + amount);
      return;
    }
    if (damageType === "poison") {
      modifiers.nextCardPoison = Math.max(0, (modifiers.nextCardPoison || 0) + amount);
      return;
    }
    if (damageType === "cold") {
      modifiers.nextCardFreeze = Math.max(0, (modifiers.nextCardFreeze || 0) + amount);
      modifiers.nextCardSlow = Math.max(0, (modifiers.nextCardSlow || 0) + amount);
      return;
    }
    if (damageType === "lightning") {
      modifiers.nextCardParalyze = Math.max(0, (modifiers.nextCardParalyze || 0) + amount);
      return;
    }
    if (damageType === "magic") {
      modifiers.nextCardDamageBonus = Math.max(0, (modifiers.nextCardDamageBonus || 0) + amount);
      return;
    }
    if (damageType === "physical") {
      modifiers.nextCardDamageBonus = Math.max(0, (modifiers.nextCardDamageBonus || 0) + amount);
    }
  }

  function applyEnemySkillRider(targetEnemy: CombatEnemyState | null, damageType: SkillDamageTypeId, amount: number) {
    if (!targetEnemy || !targetEnemy.alive || amount <= 0) {
      return "";
    }
    if (damageType === "fire") {
      targetEnemy.burn = Math.max(0, targetEnemy.burn + amount);
      return `applies ${amount} Burn to ${targetEnemy.name}.`;
    }
    if (damageType === "poison") {
      targetEnemy.poison = Math.max(0, targetEnemy.poison + amount);
      return `applies ${amount} Poison to ${targetEnemy.name}.`;
    }
    if (damageType === "cold") {
      targetEnemy.freeze = Math.max(0, targetEnemy.freeze + amount);
      targetEnemy.slow = Math.max(0, targetEnemy.slow + amount);
      return `freezes ${targetEnemy.name} for ${amount}.`;
    }
    if (damageType === "lightning") {
      targetEnemy.paralyze = Math.max(0, targetEnemy.paralyze + amount);
      return `paralyzes ${targetEnemy.name} for ${amount}.`;
    }
    return "";
  }

  function applySpecificPassiveSkill(state: CombatState, skill: CombatEquippedSkillState) {
    const scale = getSkillTierScale(skill);
    const modifiers: Partial<CombatSkillModifierState> = {};
    const segments: string[] = [];
    const weaponFamily = String(state.weaponFamily || "").toLowerCase();

    switch (skill.skillId) {
      case "amazon_critical_strike":
        state.hero.damageBonus += scale + 1;
        modifiers.nextCardDamageBonus = scale + 1;
        segments.push(`sharpens the opener by ${scale + 1} damage`);
        break;
      case "amazon_dodge":
        applyGuard(state.hero, 3 + scale);
        if (state.mercenary.alive) {
          applyGuard(state.mercenary, 2 + scale);
        }
        modifiers.nextCardGuard = scale + 1;
        modifiers.nextCardCostReduction = 1;
        segments.push("sets a guarded footing");
        break;
      case "amazon_evade":
        applyGuardToParty(state, 4 + scale, 3 + scale);
        modifiers.nextCardGuard = scale + 1;
        modifiers.nextCardDraw = 1;
        segments.push("keeps the whole line evasive");
        break;
      case "amazon_pierce":
        state.hero.damageBonus += scale + 2;
        modifiers.nextCardDamageBonus = scale + 2;
        modifiers.nextCardCostReduction = 1;
        segments.push("loads the opener with piercing force");
        break;
      case "assassin_claw_mastery":
        state.hero.damageBonus += scale + 1;
        modifiers.nextCardCostReduction = 1;
        modifiers.nextCardDamageBonus = scale;
        segments.push("accelerates claw follow-ups");
        break;
      case "barbarian_sword_mastery":
      case "barbarian_axe_mastery":
      case "barbarian_mace_mastery":
      case "barbarian_polearm_mastery":
      case "barbarian_throwing_mastery": {
        const token = skill.skillId
          .replace("barbarian_", "")
          .replace("_mastery", "")
          .replace("throwing", "throw");
        const matchedWeapon = weaponFamily.includes(token);
        state.hero.damageBonus += matchedWeapon ? scale + 2 : scale + 1;
        if (matchedWeapon) {
          modifiers.nextCardDamageBonus = scale + 1;
          segments.push(`aligns with the ${token} loadout`);
        } else {
          modifiers.nextCardGuard = 1;
          segments.push(`keeps ${token} discipline ready`);
        }
        break;
      }
      case "druid_lycanthropy":
        state.hero.damageBonus += scale + 1;
        applyGuard(state.hero, 2 + scale);
        modifiers.nextCardDamageBonus = scale + 1;
        segments.push("primes a feral opener");
        break;
      case "barbarian_increased_speed":
        modifiers.nextCardCostReduction = 1;
        modifiers.nextCardDraw = 1;
        modifiers.nextCardDamageBonus = scale;
        segments.push("accelerates the first exchange");
        break;
      case "barbarian_natural_resistance":
        applyGuardToParty(state, 4 + scale, 3 + scale);
        healEntity(state.hero, 1 + scale);
        modifiers.nextCardGuard = scale + 1;
        segments.push("hardens the party against the opener");
        break;
      case "necromancer_skeleton_mastery":
        state.summonPowerBonus = Math.max(0, state.summonPowerBonus + scale + 1);
        state.summonSecondaryBonus = Math.max(0, state.summonSecondaryBonus + 1);
        modifiers.nextCardGuard = scale;
        segments.push("empowers future summons");
        break;
      case "necromancer_summon_resist":
        state.summonPowerBonus = Math.max(0, state.summonPowerBonus + scale + 1);
        state.summonSecondaryBonus = Math.max(0, state.summonSecondaryBonus + scale);
        applyGuardToParty(state, 3 + scale, 2 + scale);
        modifiers.nextCardGuard = scale + 1;
        segments.push("wards the party and their summons");
        break;
      case "sorceress_warmth":
        healEntity(state.hero, 2 + scale);
        state.hero.burnBonus += scale + 1;
        modifiers.nextCardCostReduction = 1;
        modifiers.nextCardBurn = scale;
        segments.push("warms the opening line");
        break;
      case "sorceress_cold_mastery":
        state.hero.damageBonus += scale + 1;
        modifiers.nextCardFreeze = scale + 1;
        modifiers.nextCardSlow = scale + 1;
        segments.push("sharpens every cold opening");
        break;
      case "sorceress_fire_mastery":
        state.hero.burnBonus += scale + 2;
        modifiers.nextCardBurn = scale + 2;
        modifiers.nextCardDamageBonus = scale;
        segments.push("intensifies the first fire line");
        break;
      case "sorceress_lightning_mastery":
        state.hero.damageBonus += scale + 1;
        modifiers.nextCardParalyze = scale + 1;
        modifiers.nextCardDamageBonus = scale;
        segments.push("charges the first lightning line");
        break;
      default:
        return false;
    }

    addSkillModifiers(state, modifiers);
    const cleanSegments = segments.filter(Boolean);
    appendLog(
      state,
      `${skill.name} shapes the opening hand: ${cleanSegments.join(", ")}${getSkillPreparationSummary(state.skillModifiers) ? ` (${getSkillPreparationSummary(state.skillModifiers)}).` : "."}`
    );
    return true;
  }

  runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS = {
    getSkillTierScale, addSkillModifiers, applyEnemyStatus, applyStatusToAllEnemies, dealDamageToAllEnemies,
    applyGuardToParty, healParty, addDamageTypeRider, applyEnemySkillRider, createSummonSkillEffect,
    getSelectedEnemy, getOtherLivingEnemy, applyGuard, healEntity, drawCards, dealDamage, appendLog,
    clearSkillModifiers, applySpecificPassiveSkill, describeIntent, createEmptySkillModifiers, hasSkillModifiers,
    makeCardInstance, createHero, createMercenary, createEnemy, parseActNumber, applyRandomAffixes, createDeck,
    getCardDefinition, summonMinion: _summonMinion, getSkillPreparationSummary, applyPassiveSkill,
  };


  function getSkillPreparationSummary(modifiers: CombatSkillModifierState) {
    const parts: string[] = [];
    if (modifiers.nextCardCostReduction > 0) { parts.push(`cost -${modifiers.nextCardCostReduction}`); }
    if (modifiers.nextCardDamageBonus > 0) { parts.push(`+${modifiers.nextCardDamageBonus} damage`); }
    if (modifiers.nextCardGuard > 0) { parts.push(`+${modifiers.nextCardGuard} guard`); }
    if (modifiers.nextCardDraw > 0) { parts.push(`+${modifiers.nextCardDraw} draw`); }
    if (modifiers.nextCardBurn > 0) { parts.push(`Burn ${modifiers.nextCardBurn}`); }
    if (modifiers.nextCardPoison > 0) { parts.push(`Poison ${modifiers.nextCardPoison}`); }
    if (modifiers.nextCardSlow > 0) { parts.push(`Slow ${modifiers.nextCardSlow}`); }
    if (modifiers.nextCardFreeze > 0) { parts.push(`Freeze ${modifiers.nextCardFreeze}`); }
    if (modifiers.nextCardParalyze > 0) { parts.push(`Paralyze ${modifiers.nextCardParalyze}`); }
    return parts.join(", ");
  }

  function applyPassiveSkill(state: CombatState, skill: CombatEquippedSkillState) {
    if (applySpecificPassiveSkill(state, skill)) {
      return;
    }
    const scale = getSkillTierScale(skill);
    const modifiers: Partial<CombatSkillModifierState> = {};
    const segments: string[] = [];

    if (skill.family === "command") {
      state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 1);
      drawCards(state, 1);
      segments.push(`draws 1 and empowers the mercenary by ${scale + 1}`);
    } else if (skill.family === "recovery") {
      applyGuard(state.hero, scale + 2);
      modifiers.nextCardGuard = scale;
      segments.push(`grants ${scale + 2} Guard`);
    } else if (skill.family === "state") {
      applyGuard(state.hero, scale + 2);
      modifiers.nextCardCostReduction = 1;
      segments.push(`steadies the opener`);
    } else {
      modifiers.nextCardDamageBonus = scale;
      segments.push(`arms the next card`);
    }

    addDamageTypeRider(modifiers, skill.damageType, scale);
    addSkillModifiers(state, modifiers);
    appendLog(state, `${skill.name} shapes the opening hand: ${segments.join(", ")}${getSkillPreparationSummary(state.skillModifiers) ? ` (${getSkillPreparationSummary(state.skillModifiers)}).` : "."}`);
  }

})();
