(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp, parseInteger } = runtimeWindow.ROUGE_UTILS;
  const monsterActions = runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS;
  const { TRAIT } = monsterActions;
  const DEFAULT_ATTACK_INTENT_KINDS = new Set<EnemyIntentKind>([
    "attack",
    "attack_all",
    "attack_and_guard",
    "drain_attack",
    "sunder_attack",
    "attack_burn",
    "attack_burn_all",
    "attack_lightning",
    "attack_lightning_all",
    "attack_poison",
    "attack_poison_all",
    "attack_chill",
    "drain_energy",
  ]);
  const { ATTACK_INTENT_KINDS } = runtimeWindow.ROUGE_COMBAT_MODIFIERS || {
    ATTACK_INTENT_KINDS: DEFAULT_ATTACK_INTENT_KINDS,
  };
  const mercenaryModule = runtimeWindow.__ROUGE_COMBAT_MERCENARY;
  const { COMBAT_PHASE, COMBAT_OUTCOME } = runtimeWindow.ROUGE_CONSTANTS;
  const neutralWeaponScaling = {
    getCardProficiency: (_cardId: string) => "",
    hasPreferredWeaponFamily: (_state: CombatState) => false,
    getWeaponAttackBonus: (_state: CombatState, _cardId: string) => 0,
    getWeaponSupportBonus: (_state: CombatState, _cardId: string) => 0,
    getWeaponTypedDamageAmount: (_state: CombatState, entry: WeaponDamageDefinition) => Math.max(1, parseInteger(entry?.amount, 1)),
    getWeaponEffectAmount: (_state: CombatState, effect: WeaponEffectDefinition) => Math.max(1, parseInteger(effect?.amount, 1)),
    getMeleeDamage: (state: CombatState) => {
      const baseDamage = Math.max(1, state.weaponDamageBonus || 0);
      if (state.hero.weaken > 0) {
        return Math.max(1, Math.floor(baseDamage * 0.7));
      }
      return baseDamage;
    },
  };
  const {
    getCardProficiency,
    hasPreferredWeaponFamily,
    getWeaponAttackBonus,
    getWeaponSupportBonus,
    getWeaponTypedDamageAmount,
    getWeaponEffectAmount,
    getMeleeDamage,
  } = runtimeWindow.__ROUGE_COMBAT_WEAPON_SCALING || neutralWeaponScaling;

  const THORNS_DAMAGE = 2;
  const REGENERATION_AMOUNT = 2;
  const MAX_ACTIVE_MINIONS = 3;
  const DEFAULT_TEMPORARY_MINION_DURATION = 3;

  type MinionTemplateDefinition = {
    id: string;
    name: string;
    skillLabel: string;
    actionKind: CombatMinionActionKind;
    targetRule: CombatMinionTargetRule;
    persistent: boolean;
  };

  const MINION_TEMPLATES: Record<string, MinionTemplateDefinition> = {
    necromancer_skeleton: {
      id: "necromancer_skeleton",
      name: "Skeleton",
      skillLabel: "Rusty Slash",
      actionKind: "attack",
      targetRule: "selected_enemy",
      persistent: true,
    },
    necromancer_clay_golem: {
      id: "necromancer_clay_golem",
      name: "Clay Golem",
      skillLabel: "Mud Guard",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      persistent: true,
    },
    necromancer_skeletal_mage: {
      id: "necromancer_skeletal_mage",
      name: "Skeletal Mage",
      skillLabel: "Toxic Bolt",
      actionKind: "attack_poison",
      targetRule: "lowest_life",
      persistent: true,
    },
    necromancer_blood_golem: {
      id: "necromancer_blood_golem",
      name: "Blood Golem",
      skillLabel: "Siphon Maw",
      actionKind: "attack_heal_hero",
      targetRule: "selected_enemy",
      persistent: true,
    },
    necromancer_revive: {
      id: "necromancer_revive",
      name: "Revived Horror",
      skillLabel: "Grave Pummel",
      actionKind: "attack",
      targetRule: "selected_enemy",
      persistent: true,
    },
    druid_raven: {
      id: "druid_raven",
      name: "Raven",
      skillLabel: "Pecking Mark",
      actionKind: "attack_mark",
      targetRule: "lowest_life",
      persistent: true,
    },
    druid_poison_creeper: {
      id: "druid_poison_creeper",
      name: "Poison Creeper",
      skillLabel: "Venom Lash",
      actionKind: "attack_poison",
      targetRule: "lowest_life",
      persistent: true,
    },
    druid_oak_sage: {
      id: "druid_oak_sage",
      name: "Oak Sage",
      skillLabel: "Vital Bloom",
      actionKind: "heal_party",
      targetRule: "all_enemies",
      persistent: true,
    },
    druid_heart_of_wolverine: {
      id: "druid_heart_of_wolverine",
      name: "Heart of Wolverine",
      skillLabel: "Pack Fury",
      actionKind: "buff_mercenary_guard_party",
      targetRule: "all_enemies",
      persistent: true,
    },
    druid_grizzly: {
      id: "druid_grizzly",
      name: "Grizzly",
      skillLabel: "Mauling Swipe",
      actionKind: "attack_guard_party",
      targetRule: "selected_enemy",
      persistent: true,
    },
    assassin_wake_of_fire: {
      id: "assassin_wake_of_fire",
      name: "Wake of Fire",
      skillLabel: "Flame Sweep",
      actionKind: "attack_all_burn",
      targetRule: "all_enemies",
      persistent: false,
    },
    assassin_lightning_sentry: {
      id: "assassin_lightning_sentry",
      name: "Lightning Sentry",
      skillLabel: "Static Volley",
      actionKind: "attack_all_paralyze",
      targetRule: "all_enemies",
      persistent: false,
    },
    assassin_death_sentry: {
      id: "assassin_death_sentry",
      name: "Death Sentry",
      skillLabel: "Death Pulse",
      actionKind: "attack_all_paralyze",
      targetRule: "all_enemies",
      persistent: false,
    },
  };

  function appendLog(state: CombatState, message: string) {
    state.log.unshift(message);
    state.log = state.log.slice(0, runtimeWindow.ROUGE_LIMITS.COMBAT_LOG_SIZE);
  }

  function getLivingEnemies(state: CombatState) {
    return state.enemies.filter((enemy: CombatEnemyState) => enemy.alive);
  }

  function getFirstLivingEnemyId(state: CombatState) {
    return getLivingEnemies(state)[0]?.id || "";
  }

  function getActiveMinions(state: CombatState) {
    return Array.isArray(state.minions) ? state.minions : [];
  }

  function getMinionTemplate(templateId: string) {
    return MINION_TEMPLATES[templateId] || null;
  }

  function getMinionDuration(effect: CardEffect, template: MinionTemplateDefinition) {
    if (template.persistent) {
      return 0;
    }
    return Math.max(1, parseInteger(effect.duration, DEFAULT_TEMPORARY_MINION_DURATION));
  }

  function getMinionPrimaryValue(effect: CardEffect) {
    return Math.max(0, parseInteger(effect.value, 0));
  }

  function getMinionSecondaryValue(effect: CardEffect) {
    return Math.max(0, parseInteger(effect.secondaryValue, 0));
  }

  function getMinionReinforcementValue(amount: number) {
    return Math.max(1, Math.ceil(Math.max(1, amount) / 2));
  }

  function buildMinionActionSummary(actionKind: CombatMinionActionKind, power: number, secondaryValue: number) {
    if (actionKind === "attack") {
      return `${power} strike/phase`;
    }
    if (actionKind === "attack_mark") {
      return `${power} strike + Mark ${secondaryValue}`;
    }
    if (actionKind === "attack_poison") {
      return `${power} strike + Poison ${secondaryValue}`;
    }
    if (actionKind === "attack_guard_party") {
      return `${power} strike + Guard ${secondaryValue}`;
    }
    if (actionKind === "attack_heal_hero") {
      return `${power} strike + Heal ${secondaryValue}`;
    }
    if (actionKind === "heal_party") {
      return `Heal party ${power}`;
    }
    if (actionKind === "buff_mercenary_guard_party") {
      return `Merc +${power} + Guard ${secondaryValue}`;
    }
    if (actionKind === "attack_all_burn") {
      return `${power} line + Burn ${secondaryValue}`;
    }
    if (actionKind === "attack_all_paralyze") {
      return `${power} line + Paralyze ${secondaryValue}`;
    }
    return `${power} skill`;
  }

  function getMinionSkillSummary(minion: CombatMinionState) {
    return buildMinionActionSummary(minion.actionKind, minion.power, minion.secondaryValue);
  }

  function getSummonPreview(state: CombatState | null, effect: CardEffect) {
    const template = getMinionTemplate(String(effect.minionId || ""));
    if (!template) {
      return "Summon";
    }
    const power = getMinionPrimaryValue(effect);
    const secondaryValue = getMinionSecondaryValue(effect);
    const existing = state ? getActiveMinions(state).find((minion) => minion.templateId === template.id) : null;
    const hasOpenSlot = !state || existing || getActiveMinions(state).length < MAX_ACTIVE_MINIONS;
    const lead = existing ? `Reinforce ${template.name}` : `Summon ${template.name}`;
    const durationSegment = template.persistent ? "Persistent" : `${getMinionDuration(effect, template)} turns`;
    const actionSegment = buildMinionActionSummary(template.actionKind, power, secondaryValue);
    if (!hasOpenSlot) {
      return `${lead} · limit ${MAX_ACTIVE_MINIONS}/${MAX_ACTIVE_MINIONS}`;
    }
    return `${lead} · ${actionSegment}${durationSegment ? ` · ${durationSegment}` : ""}`;
  }

  function summonMinion(state: CombatState, effect: CardEffect) {
    const template = getMinionTemplate(String(effect.minionId || ""));
    if (!template) {
      return "the summon fizzles.";
    }

    const power = getMinionPrimaryValue(effect);
    const secondaryValue = getMinionSecondaryValue(effect);
    const duration = getMinionDuration(effect, template);
    const existing = getActiveMinions(state).find((minion) => minion.templateId === template.id);

    if (existing) {
      existing.power += getMinionReinforcementValue(power);
      if (secondaryValue > 0) {
        existing.secondaryValue += getMinionReinforcementValue(secondaryValue);
      }
      if (!existing.persistent) {
        existing.remainingTurns = Math.max(existing.remainingTurns, duration) + 1;
      }
      return `${existing.name} is reinforced (${getMinionSkillSummary(existing)}${existing.persistent ? "" : `, ${existing.remainingTurns} turns`}).`;
    }

    if (getActiveMinions(state).length >= MAX_ACTIVE_MINIONS) {
      return `${template.name} cannot enter the field. Minion limit reached (${MAX_ACTIVE_MINIONS}).`;
    }

    const minion: CombatMinionState = {
      id: `minion_${state.turn}_${state.minions.length + 1}_${template.id}`,
      templateId: template.id,
      name: template.name,
      skillLabel: template.skillLabel,
      actionKind: template.actionKind,
      targetRule: template.targetRule,
      power,
      secondaryValue,
      remainingTurns: duration,
      persistent: template.persistent,
    };
    state.minions.push(minion);
    return `${minion.name} joins the field (${getMinionSkillSummary(minion)}${minion.persistent ? "" : `, ${minion.remainingTurns} turns`}).`;
  }

  function chooseMinionTarget(state: CombatState, minion: CombatMinionState) {
    const livingEnemies = getLivingEnemies(state);
    if (livingEnemies.length === 0) {
      return null;
    }
    if (minion.targetRule === "lowest_life") {
      return livingEnemies
        .slice()
        .sort((left: CombatEnemyState, right: CombatEnemyState) => {
          if (left.life !== right.life) {
            return left.life - right.life;
          }
          return left.guard - right.guard;
        })[0] || null;
    }
    const selected = livingEnemies.find((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId);
    return selected || livingEnemies[0] || null;
  }

  function resolveMinionAction(state: CombatState, minion: CombatMinionState) {
    const actionLabel = `${minion.name} uses ${minion.skillLabel}`;
    if (minion.actionKind === "attack") {
      const target = chooseMinionTarget(state, minion);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, minion.power);
      appendLog(state, `${actionLabel} on ${target.name} for ${dealt}.`);
      return;
    }

    if (minion.actionKind === "attack_mark") {
      const target = chooseMinionTarget(state, minion);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, minion.power);
      state.mercenary.markedEnemyId = target.id;
      state.mercenary.markBonus = Math.max(state.mercenary.markBonus, minion.secondaryValue);
      appendLog(state, `${actionLabel} on ${target.name} for ${dealt} and marks it for +${minion.secondaryValue} mercenary damage.`);
      return;
    }

    if (minion.actionKind === "attack_poison") {
      const target = chooseMinionTarget(state, minion);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, minion.power);
      target.poison = Math.max(0, target.poison + minion.secondaryValue);
      appendLog(state, `${actionLabel} on ${target.name} for ${dealt} and applies ${minion.secondaryValue} Poison.`);
      return;
    }

    if (minion.actionKind === "attack_guard_party") {
      const target = chooseMinionTarget(state, minion);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, minion.power);
      applyGuard(state.hero, minion.secondaryValue);
      if (state.mercenary.alive) {
        applyGuard(state.mercenary, minion.secondaryValue);
      }
      appendLog(state, `${actionLabel} on ${target.name} for ${dealt} and grants ${minion.secondaryValue} Guard to the party.`);
      return;
    }

    if (minion.actionKind === "attack_heal_hero") {
      const target = chooseMinionTarget(state, minion);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, minion.power);
      const healed = healEntity(state.hero, minion.secondaryValue);
      appendLog(state, `${actionLabel} on ${target.name} for ${dealt} and heals the Wanderer for ${healed}.`);
      return;
    }

    if (minion.actionKind === "heal_party") {
      const heroHealed = healEntity(state.hero, minion.power);
      const mercHealed = state.mercenary.alive ? healEntity(state.mercenary, minion.power) : 0;
      appendLog(state, `${actionLabel}, healing the party for ${heroHealed + mercHealed}.`);
      return;
    }

    if (minion.actionKind === "buff_mercenary_guard_party") {
      state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + minion.power);
      applyGuard(state.hero, minion.secondaryValue);
      if (state.mercenary.alive) {
        applyGuard(state.mercenary, minion.secondaryValue);
      }
      appendLog(state, `${actionLabel}, granting the mercenary +${minion.power} attack and ${minion.secondaryValue} Guard to the party.`);
      return;
    }

    if (minion.actionKind === "attack_all_burn") {
      const livingEnemies = getLivingEnemies(state);
      if (livingEnemies.length === 0) {
        return;
      }
      let totalDamage = 0;
      livingEnemies.forEach((enemy: CombatEnemyState) => {
        totalDamage += dealDamage(state, enemy, minion.power);
        if (enemy.alive) {
          enemy.burn = Math.max(0, enemy.burn + minion.secondaryValue);
        }
      });
      appendLog(state, `${actionLabel}, scorching the line for ${totalDamage} total damage and ${minion.secondaryValue} Burn.`);
      return;
    }

    if (minion.actionKind === "attack_all_paralyze") {
      const livingEnemies = getLivingEnemies(state);
      if (livingEnemies.length === 0) {
        return;
      }
      let totalDamage = 0;
      livingEnemies.forEach((enemy: CombatEnemyState) => {
        totalDamage += dealDamage(state, enemy, minion.power);
        if (enemy.alive) {
          enemy.paralyze = Math.max(0, enemy.paralyze + Math.max(1, minion.secondaryValue));
        }
      });
      appendLog(state, `${actionLabel}, blasting the line for ${totalDamage} total damage and ${Math.max(1, minion.secondaryValue)} Paralyze.`);
    }
  }

  function resolveMinionPhase(state: CombatState) {
    const minionsToAct = [...getActiveMinions(state)];
    if (minionsToAct.length === 0) {
      return;
    }

    for (let index = 0; index < minionsToAct.length; index += 1) {
      const minion = minionsToAct[index];
      resolveMinionAction(state, minion);
      if (!minion.persistent) {
        minion.remainingTurns = Math.max(0, minion.remainingTurns - 1);
        if (minion.remainingTurns <= 0) {
          appendLog(state, `${minion.name} fades from the field.`);
        }
      }
      if (!getLivingEnemies(state).some((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId)) {
        state.selectedEnemyId = getFirstLivingEnemyId(state);
      }
    }

    state.minions = getActiveMinions(state).filter((minion: CombatMinionState) => minion.persistent || minion.remainingTurns > 0);
  }

  function hasTrait(enemy: CombatEnemyState, trait: MonsterTraitKind) {
    return Array.isArray(enemy.traits) && enemy.traits.includes(trait);
  }

  function healEntity(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) {
    if (!entity || !entity.alive) {
      return 0;
    }
    const before = entity.life;
    entity.life = clamp(entity.life + amount, 0, entity.maxLife);
    return entity.life - before;
  }

  function applyGuard(entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) {
    if (!entity || !entity.alive) {
      return 0;
    }
    entity.guard = Math.max(0, entity.guard + amount);
    return amount;
  }

  function handleDefeat(state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState) {
    const isEnemy = state.enemies.includes(entity as CombatEnemyState);
    entity.alive = false;
    entity.guard = 0;
    if (entity.burn) { entity.burn = 0; }
    if ((entity as CombatEnemyState).poison) { (entity as CombatEnemyState).poison = 0; }
    if ((entity as CombatEnemyState).slow) { (entity as CombatEnemyState).slow = 0; }
    if ((entity as CombatEnemyState).freeze) { (entity as CombatEnemyState).freeze = 0; }
    if ((entity as CombatEnemyState).stun) { (entity as CombatEnemyState).stun = 0; }
    if ((entity as CombatEnemyState).paralyze) { (entity as CombatEnemyState).paralyze = 0; }
    appendLog(state, `${entity.name} falls.`);

    // Process death traits for enemies
    if (isEnemy) {
      monsterActions.processDeathTraits(state, entity as CombatEnemyState);

      // Flee on ally death: mark Fallen-type allies to skip their next action
      const deadEnemy = entity as CombatEnemyState;
      getLivingEnemies(state).forEach((ally: CombatEnemyState) => {
        if (ally.id !== deadEnemy.id && hasTrait(ally, "flee_on_ally_death")) {
          ally.stun = Math.max(ally.stun, 1);
          appendLog(state, `${ally.name} panics and flees!`);
        }
      });
    }
  }

  function heroIsImmuneTo(state: CombatState, damageType: DamageType = "physical") {
    return Array.isArray(state.armorProfile?.immunities) && state.armorProfile.immunities.includes(damageType);
  }

  function getHeroResistance(state: CombatState, damageType: DamageType = "physical") {
    return (state.armorProfile?.resistances || [])
      .filter((entry) => entry.type === damageType)
      .reduce((total, entry) => total + parseInteger(entry.amount, 0), 0);
  }

  function getMitigatedIncomingDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType: DamageType = "physical"
  ) {
    let finalAmount = amount;
    const isHero = entity === state.hero;
    if (isHero && state.hero.amplify > 0) {
      finalAmount = Math.floor(finalAmount * 1.5);
    }
    if (!isHero) {
      return Math.max(0, Math.floor(finalAmount));
    }
    if (heroIsImmuneTo(state, damageType)) {
      return 0;
    }
    const resisted = Math.max(0, Math.floor(finalAmount) - getHeroResistance(state, damageType));
    return Math.max(0, resisted);
  }

  function dealDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType: DamageType = "physical"
  ) {
    if (!entity || !entity.alive) {
      return 0;
    }
    const debug = runtimeWindow.ROUGE_DEBUG;
    const isAlly = entity === state.hero || entity === state.mercenary;
    if (debug?.invulnerable && isAlly) {
      return 0;
    }
    if (debug?.oneHitKill && !isAlly) {
      entity.guard = 0;
      entity.life = 0;
      handleDefeat(state, entity);
      return entity.maxLife;
    }

    const damage = getMitigatedIncomingDamage(state, entity, amount, damageType);
    const blocked = Math.min(entity.guard, damage);
    entity.guard -= blocked;
    const lifeLoss = damage - blocked;
    entity.life = Math.max(0, entity.life - lifeLoss);

    // Thorns / Lightning Enchanted: enemy deals damage back when hit
    if (!isAlly && (entity as CombatEnemyState).alive) {
      monsterActions.processModifierOnHit(state, entity as CombatEnemyState);
      if (hasTrait(entity as CombatEnemyState, "thorns")) {
        const thornsDamage = THORNS_DAMAGE;
        const heroLifeBefore = state.hero.life;
        const heroGuardBefore = state.hero.guard;
        dealDamage(state, state.hero, thornsDamage, "physical");
        const thornsDealt = (heroLifeBefore - state.hero.life) + (heroGuardBefore - state.hero.guard);
        if (thornsDealt > 0) {
          appendLog(state, `${entity.name}'s thorns deal ${thornsDealt} damage back!`);
        }
      }
    }

    if (entity.life <= 0 && entity.alive) {
      handleDefeat(state, entity);
    }
    return lifeLoss;
  }

  function dealDirectDamage(
    state: CombatState,
    entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
    amount: number,
    damageType: DamageType = "physical"
  ) {
    if (!entity || !entity.alive) {
      return 0;
    }
    const debug = runtimeWindow.ROUGE_DEBUG;
    const isAlly = entity === state.hero || entity === state.mercenary;
    if (debug?.invulnerable && isAlly) {
      return 0;
    }
    if (debug?.oneHitKill && !isAlly) {
      entity.life = 0;
      handleDefeat(state, entity);
      return entity.maxLife;
    }

    const damage = getMitigatedIncomingDamage(state, entity, amount, damageType);
    if (damage <= 0) {
      return 0;
    }
    const before = entity.life;
    entity.life = Math.max(0, entity.life - damage);
    if (entity.life <= 0 && entity.alive) {
      handleDefeat(state, entity);
    }
    return before - entity.life;
  }

  function dealLifeDamage(state: CombatState, entity: CombatEnemyState, amount: number) {
    if (!entity || !entity.alive) {
      return 0;
    }
    const directDamage = Math.max(0, Math.floor(amount));
    if (directDamage <= 0) {
      return 0;
    }
    const before = entity.life;
    entity.life = Math.max(0, entity.life - directDamage);
    if (entity.life <= 0 && entity.alive) {
      handleDefeat(state, entity);
    }
    return before - entity.life;
  }

  function weaponProfileEntryMatchesUse(proficiency: string | undefined, cardId: string) {
    if (!proficiency || !cardId) {
      return true;
    }
    return proficiency === getCardProficiency(cardId);
  }

  function weaponEffectMatchesCard(effect: WeaponEffectDefinition, cardId: string) {
    return weaponProfileEntryMatchesUse(effect.proficiency, cardId);
  }

  function applyWeaponTypedDamageToEnemy(
    state: CombatState,
    target: CombatEnemyState,
    damageEntry: WeaponDamageDefinition,
    cardId: string
  ) {
    if (!target?.alive) {
      return null;
    }

    const amount = getWeaponTypedDamageAmount(state, damageEntry, cardId);
    const dealt = damageEntry.type === "poison"
      ? dealLifeDamage(state, target, amount)
      : dealDamage(state, target, amount, damageEntry.type);
    return { type: damageEntry.type, amount, dealt, targetName: target.name };
  }

  function summarizeWeaponTypedDamage(
    state: CombatState,
    damageEntry: WeaponDamageDefinition,
    results: Array<{ type: WeaponDamageType; amount: number; dealt: number; targetName: string }>
  ) {
    if (results.length === 0) {
      return "";
    }
    const totalDamage = results.reduce((sum, result) => sum + result.dealt, 0);
    if (totalDamage <= 0) {
      return "";
    }
    const weaponLabel = state.weaponName || "Weapon";
    return `${weaponLabel} dealt ${totalDamage} ${damageEntry.type} damage${results.length > 1 ? ` across ${results.length} targets` : ""}.`;
  }

  function applyWeaponTypedDamage(state: CombatState, targets: CombatEnemyState[], cardId: string) {
    const typedDamageEntries = Array.isArray(state.weaponProfile?.typedDamage)
      ? state.weaponProfile.typedDamage.filter((damageEntry) => weaponProfileEntryMatchesUse(damageEntry.proficiency, cardId))
      : [];
    return typedDamageEntries
      .map((damageEntry) => {
        const results = targets
          .map((target) => applyWeaponTypedDamageToEnemy(state, target, damageEntry, cardId))
          .filter(Boolean) as Array<{ type: WeaponDamageType; amount: number; dealt: number; targetName: string }>;
        return summarizeWeaponTypedDamage(state, damageEntry, results);
      })
      .filter(Boolean);
  }

  function applyWeaponEffectToEnemy(state: CombatState, target: CombatEnemyState, effect: WeaponEffectDefinition) {
    if (!target?.alive) {
      return null;
    }

    const amount = getWeaponEffectAmount(state, effect);
    if (effect.kind === "burn") {
      target.burn = Math.max(0, target.burn + amount);
      return { kind: effect.kind, amount, guardBroken: 0, lifeBroken: 0, targetName: target.name };
    }
    if (effect.kind === "slow") {
      target.slow = Math.max(0, target.slow + amount);
      return { kind: effect.kind, amount, guardBroken: 0, lifeBroken: 0, targetName: target.name };
    }
    if (effect.kind === "freeze") {
      target.freeze = Math.max(0, target.freeze + amount);
      return { kind: effect.kind, amount, guardBroken: 0, lifeBroken: 0, targetName: target.name };
    }
    if (effect.kind === "shock") {
      target.paralyze = Math.max(0, target.paralyze + amount);
      return { kind: effect.kind, amount, guardBroken: 0, lifeBroken: 0, targetName: target.name };
    }
    if (effect.kind === "crushing") {
      const guardBroken = Math.min(target.guard, amount);
      target.guard = Math.max(0, target.guard - guardBroken);
      const lifeBroken = dealLifeDamage(state, target, amount - guardBroken);
      return { kind: effect.kind, amount, guardBroken, lifeBroken, targetName: target.name };
    }
    return null;
  }

  function summarizeWeaponEffect(
    state: CombatState,
    effect: WeaponEffectDefinition,
    results: Array<{ kind: WeaponEffectKind; amount: number; guardBroken: number; lifeBroken: number; targetName: string }>
  ) {
    if (results.length === 0) {
      return "";
    }

    const weaponLabel = state.weaponName || "Weapon";
    if (effect.kind === "crushing") {
      const totalGuard = results.reduce((sum, result) => sum + result.guardBroken, 0);
      const totalLife = results.reduce((sum, result) => sum + result.lifeBroken, 0);
      const segments = [];
      if (totalGuard > 0) {
        segments.push(`shattered ${totalGuard} Guard`);
      }
      if (totalLife > 0) {
        segments.push(`dealt ${totalLife} crushing damage`);
      }
      if (segments.length === 0) {
        return "";
      }
      return `${weaponLabel} ${segments.join(" and ")}${results.length > 1 ? ` across ${results.length} targets` : ""}.`;
    }

    const statusLabel = effect.kind === "shock"
      ? "Shock"
      : effect.kind.charAt(0).toUpperCase() + effect.kind.slice(1);
    return `${weaponLabel} applied ${results[0].amount} ${statusLabel}${results.length > 1 ? ` to ${results.length} targets` : ""}.`;
  }

  function applyWeaponEffects(state: CombatState, targets: CombatEnemyState[], cardId: string) {
    const effects = Array.isArray(state.weaponProfile?.effects) ? state.weaponProfile.effects.filter((effect) => weaponEffectMatchesCard(effect, cardId)) : [];
    return effects
      .map((effect) => {
        const results = targets
          .map((target) => applyWeaponEffectToEnemy(state, target, effect))
          .filter(Boolean) as Array<{ kind: WeaponEffectKind; amount: number; guardBroken: number; lifeBroken: number; targetName: string }>;
        return summarizeWeaponEffect(state, effect, results);
      })
      .filter(Boolean);
  }

  function checkOutcome(state: CombatState) {
    if (!state.hero.alive || state.hero.life <= 0) {
      state.phase = COMBAT_PHASE.DEFEAT;
      state.outcome = COMBAT_OUTCOME.DEFEAT;
      if (!state.log.some((l: string) => l.includes("Encounter lost"))) {
        appendLog(state, "The Wanderer falls. Encounter lost.");
      }
      return true;
    }
    if (getLivingEnemies(state).length === 0) {
      state.phase = COMBAT_PHASE.VICTORY;
      state.outcome = COMBAT_OUTCOME.VICTORY;
      appendLog(state, `${state.encounter.name} cleared.`);
      return true;
    }
    return false;
  }

  function resolveMercenaryAction(state: CombatState) {
    mercenaryModule.resolveMercenaryAction(state, appendLog, dealDamage, applyGuard, getFirstLivingEnemyId);
  }

  function chooseEnemyTarget(state: CombatState, rule: EnemyIntentTarget | undefined) {
    if (rule === "mercenary" && state.mercenary.alive) {
      return state.mercenary;
    }
    if (rule === "lowest_life" && state.mercenary.alive && state.mercenary.life < state.hero.life) {
      return state.mercenary;
    }
    if (state.hero.alive) {
      return state.hero;
    }
    if (state.mercenary.alive) {
      return state.mercenary;
    }
    return null;
  }

  function resolveEnemyAction(state: CombatState, enemy: CombatEnemyState) {
    const intent = enemy.currentIntent;
    if (!intent || !enemy.alive) {
      return;
    }

    // ── Cooldown check: if current intent is on cooldown, use fallback attack ──
    if (monsterActions.isIntentOnCooldown(enemy)) {
      const fallbackValue = Math.max(2, Math.floor(intent.value * 0.7));
      const target = chooseEnemyTarget(state, "hero");
      if (target) {
        const dealt = dealDamage(state, target, fallbackValue);
        appendLog(state, `${enemy.name} attacks ${target.name} for ${dealt}. (${intent.label} on cooldown)`);
      }
      return;
    }

    // ── Passive: Regeneration ──
    if (hasTrait(enemy, "regeneration")) {
      const regenAmount = REGENERATION_AMOUNT;
      const healed = healEntity(enemy, regenAmount);
      if (healed > 0) {
        appendLog(state, `${enemy.name} regenerates ${healed} HP.`);
      }
    }

    // ── DOT: Burn (fire) ──
    if (enemy.burn > 0) {
      const burnDamage = dealDamage(state, enemy, enemy.burn);
      appendLog(state, `${enemy.name} takes ${burnDamage} Burn damage.`);
      enemy.burn = Math.max(0, enemy.burn - 1);
      if (!enemy.alive) { return; }
    }

    // ── DOT: Poison (bypasses guard) ──
    if (enemy.poison > 0) {
      const poisonDamage = Math.max(0, Math.floor(enemy.poison));
      enemy.life = Math.max(0, enemy.life - poisonDamage);
      appendLog(state, `${enemy.name} takes ${poisonDamage} Poison damage.`);
      enemy.poison = Math.max(0, enemy.poison - 1);
      if (enemy.life <= 0 && enemy.alive) {
        handleDefeat(state, enemy);
        return;
      }
    }

    const ignoresHardCrowdControl = intent.kind === "teleport";
    if (ignoresHardCrowdControl) {
      enemy.freeze = 0;
      enemy.stun = 0;
      enemy.slow = 0;
      enemy.paralyze = 0;
    }

    // ── CC: Freeze (skip turn) ──
    if (!ignoresHardCrowdControl && enemy.freeze > 0) {
      appendLog(state, `${enemy.name} is Frozen and cannot act.`);
      enemy.freeze = Math.max(0, enemy.freeze - 1);
      return;
    }

    // ── CC: Stun (skip turn, consumed) ──
    if (!ignoresHardCrowdControl && enemy.stun > 0) {
      appendLog(state, `${enemy.name} is Stunned and cannot act.`);
      enemy.stun = 0;
      return;
    }

    // ── Passive: Frenzy (below 50% HP = +50% attack) ──
    const isFrenzied = hasTrait(enemy, "frenzy") && enemy.life <= Math.ceil(enemy.maxLife / 2);

    // ── Debuff: Paralyze (halve attack damage) ──
    let intentValue = intent.value;

    // Apply buffed attack bonus from Overseer
    if (enemy.buffedAttack && enemy.buffedAttack > 0 && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue += enemy.buffedAttack;
      enemy.buffedAttack = 0;
    }

    if (isFrenzied && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue = Math.floor(intentValue * 1.5);
      appendLog(state, `${enemy.name} is in a FRENZY!`);
    }

    if (hasTrait(enemy, TRAIT.EXTRA_STRONG) && ATTACK_INTENT_KINDS.has(intent.kind)) {
      intentValue = Math.floor(intentValue * 1.5);
      appendLog(state, `${enemy.name} hits with Extra Strong force!`);
    }

    if (enemy.paralyze > 0) {
      if (ATTACK_INTENT_KINDS.has(intent.kind)) {
        intentValue = Math.max(1, Math.floor(intentValue / 2));
        appendLog(state, `${enemy.name} is Paralyzed — attack weakened.`);
      }
      enemy.paralyze = Math.max(0, enemy.paralyze - 1);
    }

    // ── D2 monster intent resolution (delegated to monster-actions module) ──
    if (monsterActions.resolveMonsterIntent(state, enemy, intent, intentValue, chooseEnemyTarget, dealDamage, healEntity)) {
      return;
    }

    // ── Base intent handlers ──

    if (intent.kind === "guard") {
      applyGuard(enemy, intent.value);
      appendLog(state, `${enemy.name} uses ${intent.label} and gains ${intent.value} Guard.`);
      return;
    }

    if (intent.kind === "guard_allies") {
      const livingEnemies = getLivingEnemies(state);
      livingEnemies.forEach((livingEnemy: CombatEnemyState) => {
        applyGuard(livingEnemy, intent.value);
      });
      appendLog(state, `${enemy.name} uses ${intent.label} and fortifies the enemy line.`);
      return;
    }

    if (intent.kind === "heal_ally") {
      const target =
        getLivingEnemies(state)
          .slice()
          .sort((left: CombatEnemyState, right: CombatEnemyState) => left.life - right.life)[0] || null;
      if (target) {
        const healed = healEntity(target, intent.value);
        appendLog(state, `${enemy.name} uses ${intent.label} and heals ${target.name} for ${healed}.`);
      }
      return;
    }

    if (intent.kind === "heal_allies") {
      const livingEnemies = getLivingEnemies(state);
      const healedTargets = livingEnemies
        .map((target: CombatEnemyState) => {
          const healed = healEntity(target, intent.value);
          return healed > 0 ? `${target.name} for ${healed}` : "";
        })
        .filter(Boolean);
      appendLog(
        state,
        healedTargets.length > 0
          ? `${enemy.name} uses ${intent.label} and restores ${healedTargets.join(", ")}.`
          : `${enemy.name} uses ${intent.label}, but the enemy line is already healthy.`
      );
      return;
    }

    if (intent.kind === "heal_and_guard") {
      const target =
        getLivingEnemies(state)
          .slice()
          .sort((left: CombatEnemyState, right: CombatEnemyState) => left.life - right.life)[0] || null;
      const healed = target ? healEntity(target, intent.value) : 0;
      const guardGained = applyGuard(enemy, intent.secondaryValue || Math.max(2, Math.ceil(intent.value / 2)));
      appendLog(
        state,
        target
          ? `${enemy.name} uses ${intent.label}, restoring ${target.name} for ${healed} and gaining ${guardGained} Guard.`
          : `${enemy.name} uses ${intent.label} and gains ${guardGained} Guard.`
      );
      return;
    }

    if (intent.kind === "attack_all") {
      const partyTargets = [state.hero, state.mercenary].filter((target: CombatHeroState | CombatMercenaryState) => target?.alive);
      const segments = partyTargets.map((target) => {
        const dealt = dealDamage(state, target, intentValue);
        return `${target.name} for ${dealt}`;
      });
      appendLog(state, `${enemy.name} uses ${intent.label} on ${segments.join(" and ")}.`);
      return;
    }

    if (intent.kind === "attack_and_guard") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intentValue);
      const guardGained = applyGuard(enemy, intent.secondaryValue || Math.max(2, Math.ceil(intentValue / 2)));
      appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and gains ${guardGained} Guard.`);
      return;
    }

    if (intent.kind === "sunder_attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const removedGuard = target.guard;
      target.guard = 0;
      const dealt = dealDamage(state, target, intentValue);
      appendLog(state, `${enemy.name} uses ${intent.label}, shattering ${removedGuard} Guard and hitting ${target.name} for ${dealt}.`);
      return;
    }

    if (intent.kind === "drain_attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intentValue);
      const healed = healEntity(enemy, intent.secondaryValue || Math.max(1, Math.ceil(dealt / 2)));
      appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and heals ${healed}.`);
      return;
    }

    if (intent.kind === "attack") {
      const target = chooseEnemyTarget(state, intent.target);
      if (!target) {
        return;
      }
      const dealt = dealDamage(state, target, intentValue);
      appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt}.`);
    }
  }

  function advanceEnemyIntents(state: CombatState) {
    state.enemies.forEach((enemy: CombatEnemyState) => {
      if (!enemy.alive) {
        return;
      }
      // Tick cooldowns each turn
      monsterActions.tickCooldowns(enemy);

      // Slow: enemy repeats current intent instead of advancing
      if (enemy.slow > 0) {
        enemy.slow = Math.max(0, enemy.slow - 1);
        return;
      }
      enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intents.length;
      enemy.currentIntent = { ...enemy.intents[enemy.intentIndex] };
    });
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
    appendLog(state, `Melee strike hits ${target.name} for ${dealt}${familyMatch ? " (proficient)" : ""}.${weaponSegments.length > 0 ? ` ${weaponSegments.join(" ")}` : ""}`);
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
        appendLog(state, "The Wanderer falls. Encounter lost.");
        return;
      }
    }

    // Energy: apply energy drain
    let energyThisTurn = state.hero.maxEnergy;
    if (state.hero.energyDrain > 0 && state.turn > 1) {
      energyThisTurn = Math.max(1, energyThisTurn - 1);
    }
    state.hero.energy = energyThisTurn;

    // Card draw: apply chill (draw 1 fewer)
    let drawCount = Math.max(0, state.hero.handSize - state.hand.length);
    if (state.hero.chill > 0 && state.turn > 1) {
      drawCount = Math.max(0, drawCount - 1);
    }
    drawCards(state, drawCount);

    if (!getLivingEnemies(state).some((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId)) {
      state.selectedEnemyId = getFirstLivingEnemyId(state);
    }
    appendLog(state, `Turn ${state.turn} begins.`);
  }

  function endTurn(state: CombatState) {
    if (state.phase !== COMBAT_PHASE.PLAYER || state.outcome) {
      return { ok: false, message: "The turn cannot end right now." };
    }

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
        appendLog(state, `${enemy.name} strikes again! (${label})`);
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
    const healed = healEntity(target, state.hero.potionHeal);
    appendLog(state, `Potion used on ${target.name} for ${healed}.`);
    return { ok: true, message: "Potion used." };
  }

  runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS = {
    MAX_ACTIVE_MINIONS,
    healEntity,
    applyGuard,
    dealDamage,
    dealDirectDamage,
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
