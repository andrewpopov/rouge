(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

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

  const minionModule = runtimeWindow.__ROUGE_COMBAT_MINIONS;
  const {
    MAX_ACTIVE_MINIONS,
    getActiveMinions,
    getMinionTemplate,
    getMinionDuration,
    getMinionPrimaryValue,
    getMinionSecondaryValue,
    getMinionReinforcementValue,
    getMinionSkillSummary,
  } = minionModule;

  const damageModule = runtimeWindow.__ROUGE_COMBAT_ENGINE_DAMAGE;
  const { healEntity, applyGuard, dealDamage } = damageModule;

  const { parseInteger } = runtimeWindow.ROUGE_UTILS;
  const { isTrapTemplate, isSupportTemplate, isTankTemplate } = runtimeWindow.__ROUGE_COMBAT_UTILS;

  function getMinionStackCount(minion: CombatMinionState): number {
    return Math.max(1, (minion as { stackCount?: number }).stackCount || 1);
  }

  function summonMinion(state: CombatState, effect: CardEffect) {
    const template = getMinionTemplate(String(effect.minionId || ""));
    if (!template) {
      return "the summon fizzles.";
    }

    const power = getMinionPrimaryValue(effect);
    const secondaryValue = getMinionSecondaryValue(effect);
    const duration = getMinionDuration(effect, template);
    const templateStackCap = Math.max(0, parseInteger((template as { stackCap?: number }).stackCap, 0));
    const templateStackGroup = (template as { stackGroup?: string }).stackGroup || "";
    const existing = getActiveMinions(state).find((minion) => {
      if (minion.templateId === template.id) { return true; }
      if (templateStackGroup) {
        const minionTemplate = getMinionTemplate(minion.templateId);
        return minionTemplate && (minionTemplate as { stackGroup?: string }).stackGroup === templateStackGroup;
      }
      return false;
    });

    if (existing) {
      const currentStackCount = getMinionStackCount(existing);
      const atStackCap = templateStackCap > 0 && currentStackCount >= templateStackCap;
      if (atStackCap) {
        if (!existing.persistent) {
          existing.remainingTurns = Math.max(existing.remainingTurns, duration) + 1;
        }
        return `${existing.name} is already at max stack (${templateStackCap}) and refreshes (${getMinionSkillSummary(existing)}, ${existing.life}/${existing.maxLife} HP${existing.persistent ? "" : `, ${existing.remainingTurns} turns`}).`;
      }
      const stackAbility = (template as { stackAbility?: string }).stackAbility || "";
      if (stackAbility && !(existing as { stackAbilities?: string[] }).stackAbilities?.includes(stackAbility)) {
        const abilities = (existing as { stackAbilities?: string[] }).stackAbilities || [];
        abilities.push(stackAbility);
        existing.stackAbilities = abilities;
      }
      existing.stackCount = getMinionStackCount(existing) + 1;
      existing.power += getMinionReinforcementValue(power);
      if (secondaryValue > 0) {
        existing.secondaryValue += getMinionReinforcementValue(secondaryValue);
      }
      if (!existing.persistent) {
        existing.remainingTurns = Math.max(existing.remainingTurns, duration) + 1;
      }
      const hpGain = getMinionReinforcementValue(power) * 2;
      existing.maxLife += hpGain;
      existing.life = Math.min(existing.maxLife, existing.life + hpGain);
      existing.alive = true;
      return `${existing.name} is reinforced (${getMinionSkillSummary(existing)}, ${existing.life}/${existing.maxLife} HP${existing.persistent ? "" : `, ${existing.remainingTurns} turns`}).`;
    }

    // Classify minion type for HP and targeting
    const isTankMinion = isTankTemplate(template);
    const isTrapMinion = isTrapTemplate(template);
    const isSupportMinion = isSupportTemplate(template);

    // Split cap: creatures and traps have separate limits
    const activeMinions = getActiveMinions(state);
    const activeCreatures = activeMinions.filter((m: CombatMinionState) => !m.invulnerable).length;
    const activeTraps = activeMinions.filter((m: CombatMinionState) => m.invulnerable).length;
    const isNewTrap = isTrapMinion || isSupportMinion;
    let atCap = false;
    if (isNewTrap) {
      atCap = activeTraps >= minionModule.MAX_ACTIVE_TRAPS;
    } else {
      atCap = activeCreatures >= minionModule.MAX_ACTIVE_CREATURES;
    }

    if (atCap) {
      const capLabel = isNewTrap ? "trap" : "creature";
      const capValue = isNewTrap ? minionModule.MAX_ACTIVE_TRAPS : minionModule.MAX_ACTIVE_CREATURES;
      return `${template.name} cannot enter the field. ${capLabel} limit reached (${capValue}).`;
    }
    let minionMaxLife = Math.max(8, power * 2);
    if (isTrapMinion) {
      minionMaxLife = 1;
    } else if (isTankMinion) {
      minionMaxLife = Math.max(12, power * 3);
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
      life: minionMaxLife,
      maxLife: minionMaxLife,
      guard: 0,
      alive: true,
      taunt: isTankMinion,
      invulnerable: isTrapMinion || isSupportMinion,
      stackCount: 1,
      stackAbilities: (template as { stackAbility?: string }).stackAbility ? [(template as { stackAbility?: string }).stackAbility!] : [],
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
      if (!target) { return; }
      const dealt = dealDamage(state, target, minion.power);
      logCombat(state, { actor: "minion", actorName: minion.name, actorId: minion.id, action: "intent", actionId: minion.actionKind, message: `${actionLabel} on ${target.name} for ${dealt}.`, effects: [{ target: "enemy", targetId: target.id, targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard }] });
      return;
    }

    if ((minion.actionKind as string) === "attack_all") {
      const targets = getLivingEnemies(state);
      if (targets.length === 0) { return; }
      let total = 0;
      const effects: CombatLogEffect[] = [];
      targets.forEach((target) => {
        const dealt = dealDamage(state, target, minion.power);
        total += dealt;
        effects.push({ target: "enemy", targetId: target.id, targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard });
      });
      logCombat(state, { actor: "minion", actorName: minion.name, actorId: minion.id, action: "intent", actionId: minion.actionKind, message: `${actionLabel} on the line for ${total} total.`, effects });
      return;
    }

    if (minion.actionKind === "attack_mark") {
      const target = chooseMinionTarget(state, minion);
      if (!target) { return; }
      const dealt = dealDamage(state, target, minion.power);
      state.mercenary.markedEnemyId = target.id;
      state.mercenary.markBonus = Math.max(state.mercenary.markBonus, minion.secondaryValue);
      logCombat(state, {
        actor: "minion", actorName: minion.name, actorId: minion.id,
        action: "intent", actionId: minion.actionKind,
        message: `${actionLabel} on ${target.name} for ${dealt} and marks it for +${minion.secondaryValue} mercenary damage.`,
        effects: [{ target: "enemy", targetId: target.id, targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard }],
      });
      return;
    }

    if (minion.actionKind === "attack_poison") {
      const target = chooseMinionTarget(state, minion);
      if (!target) { return; }
      const dealt = dealDamage(state, target, minion.power);
      target.poison = Math.max(0, target.poison + minion.secondaryValue);
      logCombat(state, {
        actor: "minion", actorName: minion.name, actorId: minion.id,
        action: "intent", actionId: minion.actionKind,
        message: `${actionLabel} on ${target.name} for ${dealt} and applies ${minion.secondaryValue} Poison.`,
        effects: [{ target: "enemy", targetId: target.id, targetName: target.name, damage: dealt, statusApplied: { kind: "poison", stacks: minion.secondaryValue }, lifeAfter: target.life, guardAfter: target.guard }],
      });
      return;
    }

    if (minion.actionKind === "attack_guard_party") {
      const target = chooseMinionTarget(state, minion);
      if (!target) { return; }
      const dealt = dealDamage(state, target, minion.power);
      applyGuard(state.hero, minion.secondaryValue);
      if (state.mercenary.alive) { applyGuard(state.mercenary, minion.secondaryValue); }
      logCombat(state, {
        actor: "minion", actorName: minion.name, actorId: minion.id,
        action: "intent", actionId: minion.actionKind,
        message: `${actionLabel} on ${target.name} for ${dealt} and grants ${minion.secondaryValue} Guard to the party.`,
        effects: [
          { target: "enemy", targetId: target.id, targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard },
          { target: "hero", targetName: "the Wanderer", guardApplied: minion.secondaryValue, lifeAfter: state.hero.life, guardAfter: state.hero.guard },
          ...(state.mercenary.alive ? [{ target: "mercenary" as const, targetName: state.mercenary.name, guardApplied: minion.secondaryValue, lifeAfter: state.mercenary.life, guardAfter: state.mercenary.guard }] : []),
        ],
      });
      return;
    }

    if (minion.actionKind === "attack_heal_hero") {
      const target = chooseMinionTarget(state, minion);
      if (!target) { return; }
      const dealt = dealDamage(state, target, minion.power);
      const healed = healEntity(state.hero, minion.secondaryValue);
      logCombat(state, {
        actor: "minion", actorName: minion.name, actorId: minion.id,
        action: "intent", actionId: minion.actionKind,
        message: `${actionLabel} on ${target.name} for ${dealt} and heals the Wanderer for ${healed}.`,
        effects: [
          { target: "enemy", targetId: target.id, targetName: target.name, damage: dealt, lifeAfter: target.life, guardAfter: target.guard },
          { target: "hero", targetName: "the Wanderer", healing: healed, lifeAfter: state.hero.life, guardAfter: state.hero.guard },
        ],
      });
      return;
    }

    if (minion.actionKind === "heal_party") {
      const heroHealed = healEntity(state.hero, minion.power);
      const mercHealed = state.mercenary.alive ? healEntity(state.mercenary, minion.power) : 0;
      logCombat(state, {
        actor: "minion", actorName: minion.name, actorId: minion.id,
        action: "intent", actionId: minion.actionKind,
        message: `${actionLabel}, healing the party for ${heroHealed + mercHealed}.`,
        effects: [
          { target: "hero", targetName: "the Wanderer", healing: heroHealed, lifeAfter: state.hero.life, guardAfter: state.hero.guard },
          ...(mercHealed > 0 ? [{ target: "mercenary" as const, targetName: state.mercenary.name, healing: mercHealed, lifeAfter: state.mercenary.life, guardAfter: state.mercenary.guard }] : []),
        ],
      });
      return;
    }

    if (minion.actionKind === "buff_mercenary_guard_party") {
      state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + minion.power);
      applyGuard(state.hero, minion.secondaryValue);
      if (state.mercenary.alive) { applyGuard(state.mercenary, minion.secondaryValue); }
      logCombat(state, {
        actor: "minion", actorName: minion.name, actorId: minion.id,
        action: "intent", actionId: minion.actionKind,
        message: `${actionLabel}, granting the mercenary +${minion.power} attack and ${minion.secondaryValue} Guard to the party.`,
        effects: [
          { target: "hero", targetName: "the Wanderer", guardApplied: minion.secondaryValue, lifeAfter: state.hero.life, guardAfter: state.hero.guard },
          ...(state.mercenary.alive ? [{ target: "mercenary" as const, targetName: state.mercenary.name, guardApplied: minion.secondaryValue, lifeAfter: state.mercenary.life, guardAfter: state.mercenary.guard }] : []),
        ],
      });
      return;
    }

    if (minion.actionKind === "attack_all_burn") {
      const livingEnemies = getLivingEnemies(state);
      if (livingEnemies.length === 0) { return; }
      let totalDamage = 0;
      const burnEffects: CombatLogEffect[] = [];
      livingEnemies.forEach((enemy: CombatEnemyState) => {
        const dmg = dealDamage(state, enemy, minion.power);
        totalDamage += dmg;
        if (enemy.alive) { enemy.burn = Math.max(0, enemy.burn + minion.secondaryValue); }
        burnEffects.push({ target: "enemy", targetId: enemy.id, targetName: enemy.name, damage: dmg, statusApplied: { kind: "burn", stacks: minion.secondaryValue }, lifeAfter: enemy.life, guardAfter: enemy.guard });
      });
      logCombat(state, {
        actor: "minion", actorName: minion.name, actorId: minion.id,
        action: "intent", actionId: minion.actionKind,
        message: `${actionLabel}, scorching the line for ${totalDamage} total damage and ${minion.secondaryValue} Burn.`,
        effects: burnEffects,
      });
      return;
    }

    if (minion.actionKind === "attack_all_paralyze") {
      const livingEnemies = getLivingEnemies(state);
      if (livingEnemies.length === 0) { return; }
      let totalDamage = 0;
      const paraEffects: CombatLogEffect[] = [];
      livingEnemies.forEach((enemy: CombatEnemyState) => {
        const dmg = dealDamage(state, enemy, minion.power);
        totalDamage += dmg;
        if (enemy.alive) { enemy.paralyze = Math.max(0, enemy.paralyze + Math.max(1, minion.secondaryValue)); }
        paraEffects.push({ target: "enemy", targetId: enemy.id, targetName: enemy.name, damage: dmg, statusApplied: { kind: "paralyze", stacks: Math.max(1, minion.secondaryValue) }, lifeAfter: enemy.life, guardAfter: enemy.guard });
      });
      logCombat(state, {
        actor: "minion", actorName: minion.name, actorId: minion.id,
        action: "intent", actionId: minion.actionKind,
        message: `${actionLabel}, blasting the line for ${totalDamage} total damage and ${Math.max(1, minion.secondaryValue)} Paralyze.`,
        effects: paraEffects,
      });
    }
  }

  function resolveMinionPhase(state: CombatState) {
    const minionsToAct = [...getActiveMinions(state)];
    if (minionsToAct.length === 0) { return; }

    for (let index = 0; index < minionsToAct.length; index += 1) {
      const minion = minionsToAct[index];
      resolveMinionAction(state, minion);
      if (!minion.persistent) {
        minion.remainingTurns = Math.max(0, minion.remainingTurns - 1);
        if (minion.remainingTurns <= 0) {
          logCombat(state, { actor: "minion", actorName: minion.name, actorId: minion.id, action: "death", tone: "report", message: `${minion.name} fades from the field.` });
        }
      }
      if (!getLivingEnemies(state).some((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId)) {
        state.selectedEnemyId = getFirstLivingEnemyId(state);
      }
    }

    state.minions = getActiveMinions(state).filter((minion: CombatMinionState) => minion.persistent || minion.remainingTurns > 0);
  }

  function getMinionArtTier(minion: CombatMinionState, maxTier?: number): number {
    const tierCap = Math.max(1, Number(maxTier) || 5);
    return Math.min(tierCap, getMinionStackCount(minion));
  }

  runtimeWindow.__ROUGE_COMBAT_ENGINE_MINION_ACTIONS = {
    summonMinion,
    chooseMinionTarget,
    resolveMinionAction,
    resolveMinionPhase,
    getMinionStackCount,
    getMinionArtTier,
  };
})();
