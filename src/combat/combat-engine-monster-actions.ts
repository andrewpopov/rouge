(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const traits = runtimeWindow.__ROUGE_MONSTER_TRAITS;
  const { TRAIT, applyHeroBurn, applyHeroPoison, applyHeroChill, applyHeroAmplify, applyHeroWeaken, applyHeroEnergyDrain, putIntentOnCooldown } = traits;

  const MAX_ENEMIES_IN_COMBAT = 6;

  function _appendLog(state: CombatState, message: string) {
    state.log.unshift(message);
    state.log = state.log.slice(0, runtimeWindow.ROUGE_LIMITS.COMBAT_LOG_SIZE);
  }

  function _getLivingEnemies(state: CombatState) {
    return state.enemies.filter((e: CombatEnemyState) => e.alive);
  }

  function _getDeadEnemies(state: CombatState) {
    return state.enemies.filter((e: CombatEnemyState) => !e.alive && !e.consumed);
  }

  function _hasTrait(enemy: CombatEnemyState, trait: MonsterTraitKind) {
    return Array.isArray(enemy.traits) && enemy.traits.includes(trait);
  }

  function _getLivingPartyTargets(state: CombatState) {
    return [state.hero, state.mercenary].filter((target: CombatHeroState | CombatMercenaryState) => target?.alive);
  }

  // ── D2 elite modifier: on-attack effects ──

  function processModifierOnAttack(state: CombatState, enemy: CombatEnemyState) {
    if (!Array.isArray(enemy.traits) || !state.hero.alive) {
      return;
    }
    if (enemy.traits.includes(TRAIT.CURSED)) {
      applyHeroAmplify(state, 2);
      _appendLog(state, `${enemy.name}'s Cursed aura amplifies damage on the Wanderer!`);
    }
    if (enemy.traits.includes(TRAIT.COLD_ENCHANTED)) {
      applyHeroChill(state, 1);
    }
    if (enemy.traits.includes(TRAIT.FIRE_ENCHANTED)) {
      applyHeroBurn(state, 1);
    }
    if (enemy.traits.includes(TRAIT.MANA_BURN)) {
      applyHeroEnergyDrain(state, 1);
      _appendLog(state, `${enemy.name}'s Mana Burn drains the Wanderer's energy!`);
    }
  }

  // ── D2 elite modifier: on-hit-by-player effects ──

  function processModifierOnHit(state: CombatState, enemy: CombatEnemyState) {
    if (!Array.isArray(enemy.traits) || !enemy.alive || !state.hero.alive) {
      return;
    }
    if (enemy.traits.includes(TRAIT.LIGHTNING_ENCHANTED)) {
      const boltDamage = 2;
      const dealt = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS?.dealDirectDamage?.(state, state.hero, boltDamage, "lightning") || 0;
      if (dealt > 0) {
        _appendLog(state, `${enemy.name}'s lightning arc zaps the Wanderer for ${dealt}!`);
      }
      if (state.hero.life <= 0 && state.hero.alive) {
        state.hero.alive = false;
        state.hero.guard = 0;
        _appendLog(state, "The Wanderer falls. Encounter lost.");
      }
    }
  }

  // ── D2 monster intent resolution ──

  function resolveMonsterIntent(
    state: CombatState,
    enemy: CombatEnemyState,
    intent: EnemyIntent,
    intentValue: number,
    chooseTarget: (state: CombatState, rule: EnemyIntentTarget | undefined) => CombatHeroState | CombatMercenaryState | null,
    dealDamage: (
      state: CombatState,
      entity: CombatHeroState | CombatMercenaryState | CombatEnemyState,
      amount: number,
      damageType?: DamageType
    ) => number,
    healEntity: (entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number,
  ): boolean {

    if (intent.kind === "resurrect_ally") {
      const deadAllies = _getDeadEnemies(state).filter(
        (dead: CombatEnemyState) => dead.id !== enemy.id && !_hasTrait(dead, "death_explosion")
      );
      if (deadAllies.length > 0) {
        const target = deadAllies[0];
        target.alive = true;
        target.life = Math.max(1, Math.floor(target.maxLife * 0.5));
        target.guard = 0;
        target.burn = 0;
        target.poison = 0;
        target.slow = 0;
        target.freeze = 0;
        target.stun = 0;
        target.paralyze = 0;
        target.intentIndex = 0;
        target.currentIntent = { ...target.intents[0] };
        _appendLog(state, `${enemy.name} uses ${intent.label} and resurrects ${target.name}!`);
        putIntentOnCooldown(enemy);
      } else {
        const fallbackTarget = chooseTarget(state, "hero");
        if (fallbackTarget) {
          const dealt = dealDamage(state, fallbackTarget, intentValue);
          _appendLog(state, `${enemy.name} has no allies to resurrect — attacks ${fallbackTarget.name} for ${dealt}.`);
        }
      }
      return true;
    }

    if (intent.kind === "summon_minion") {
      const spawnCount = Math.max(1, Math.floor(intent.secondaryValue || 1));
      const availableSlots = Math.max(0, MAX_ENEMIES_IN_COMBAT - state.enemies.length);
      const actualCount = Math.min(spawnCount, availableSlots);
      if (actualCount > 0) {
        const spawnLife = Math.max(4, Math.floor(intent.value * 1.5));
        const spawnAttack = Math.max(2, Math.floor(intent.value * 0.6));
        for (let index = 0; index < actualCount; index += 1) {
          const spawnId = `summon_${state.turn}_${state.enemies.length}`;
          const spawn: CombatEnemyState = {
            id: spawnId,
            templateId: enemy.summonTemplateId || `${enemy.templateId}_young`,
            name: intent.label.includes("Egg") ? "Maggot Young" : `${enemy.name} Minion`,
            role: "raider",
            maxLife: spawnLife,
            life: spawnLife,
            guard: 0,
            burn: 0,
            poison: 0,
            slow: 0,
            freeze: 0,
            stun: 0,
            paralyze: 0,
            alive: true,
            intentIndex: 0,
            currentIntent: { kind: "attack", label: "Minion Strike", value: spawnAttack, target: "hero" },
            intents: [
              { kind: "attack", label: "Minion Strike", value: spawnAttack, target: "hero" },
              { kind: "attack", label: "Minion Bite", value: spawnAttack, target: "lowest_life" },
            ],
            traits: [],
            family: enemy.family || "",
            summonTemplateId: "",
            consumed: false,
            buffedAttack: 0,
          };
          state.enemies.push(spawn);
        }
        _appendLog(state, `${enemy.name} uses ${intent.label} and spawns ${actualCount} minion${actualCount === 1 ? "" : "s"}!`);
        putIntentOnCooldown(enemy);
      } else {
        _appendLog(state, `${enemy.name} tries to summon but the field is full.`);
      }
      return true;
    }

    if (intent.kind === "charge") {
      const guardGained = Math.max(0, intent.secondaryValue || Math.max(2, Math.ceil(intent.value / 3)));
      if (guardGained > 0) {
        runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS?.applyGuard?.(enemy, guardGained);
      }
      let scope = "the Wanderer";
      if (intent.target === "all_allies") {
        scope = "the whole party";
      } else if (intent.target === "mercenary") {
        scope = "the mercenary";
      }
      const damageType = intent.damageType ? ` ${intent.damageType}` : "";
      _appendLog(
        state,
        `${enemy.name} begins charging ${intent.label}. ${scope} will take ${intent.value}${damageType} damage next turn.${guardGained > 0 ? ` ${enemy.name} gains ${guardGained} Guard.` : ""}`
      );
      return true;
    }

    if (intent.kind === "teleport") {
      enemy.slow = 0;
      enemy.freeze = 0;
      enemy.stun = 0;
      enemy.paralyze = 0;
      runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS?.applyGuard?.(enemy, Math.max(0, intent.value));
      _appendLog(state, `${enemy.name} uses ${intent.label}, blinking out of reach and gaining ${Math.max(0, intent.value)} Guard.`);
      return true;
    }

    if (intent.kind === "attack_burn") {
      const target = chooseTarget(state, intent.target);
      if (!target) { return true; }
      const dealt = dealDamage(state, target, intentValue, "fire");
      const burnStacks = intent.secondaryValue || 2;
      applyHeroBurn(state, burnStacks);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and inflicts ${burnStacks} Burn!`);
      return true;
    }

    if (intent.kind === "attack_burn_all") {
      const partyTargets = _getLivingPartyTargets(state);
      const segments = partyTargets.map((target) => {
        const dealt = dealDamage(state, target, intentValue, "fire");
        return `${target.name} for ${dealt}`;
      });
      const burnStacks = intent.secondaryValue || 2;
      applyHeroBurn(state, burnStacks);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${segments.join(" and ")} and inflicts ${burnStacks} Burn!`);
      return true;
    }

    if (intent.kind === "attack_poison") {
      const target = chooseTarget(state, intent.target);
      if (!target) { return true; }
      const dealt = dealDamage(state, target, intentValue, "poison");
      const poisonStacks = intent.secondaryValue || 2;
      applyHeroPoison(state, poisonStacks);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and inflicts ${poisonStacks} Poison!`);
      return true;
    }

    if (intent.kind === "attack_poison_all") {
      const partyTargets = _getLivingPartyTargets(state);
      const segments = partyTargets.map((target) => {
        const dealt = dealDamage(state, target, intentValue, "poison");
        return `${target.name} for ${dealt}`;
      });
      const poisonStacks = intent.secondaryValue || 2;
      applyHeroPoison(state, poisonStacks);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${segments.join(" and ")} and inflicts ${poisonStacks} Poison!`);
      return true;
    }

    if (intent.kind === "attack_lightning") {
      const target = chooseTarget(state, intent.target);
      if (!target) { return true; }
      const dealt = dealDamage(state, target, intentValue, "lightning");
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} lightning damage!`);
      return true;
    }

    if (intent.kind === "attack_lightning_all") {
      const partyTargets = _getLivingPartyTargets(state);
      const segments = partyTargets.map((target) => {
        const dealt = dealDamage(state, target, intentValue, "lightning");
        return `${target.name} for ${dealt}`;
      });
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${segments.join(" and ")}!`);
      return true;
    }

    if (intent.kind === "attack_chill") {
      const target = chooseTarget(state, intent.target);
      if (!target) { return true; }
      const dealt = dealDamage(state, target, intentValue, "cold");
      const chillStacks = intent.secondaryValue || 1;
      applyHeroChill(state, chillStacks);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and inflicts Chill!`);
      return true;
    }

    if (intent.kind === "curse_amplify") {
      const stacks = intent.value || 2;
      applyHeroAmplify(state, stacks);
      _appendLog(state, `${enemy.name} casts ${intent.label} — the Wanderer takes increased damage for ${stacks} turns!`);
      putIntentOnCooldown(enemy);
      return true;
    }

    if (intent.kind === "curse_weaken") {
      const stacks = intent.value || 2;
      applyHeroWeaken(state, stacks);
      _appendLog(state, `${enemy.name} casts ${intent.label} — the Wanderer deals reduced damage for ${stacks} turns!`);
      putIntentOnCooldown(enemy);
      return true;
    }

    if (intent.kind === "drain_energy") {
      const target = chooseTarget(state, intent.target);
      if (!target) { return true; }
      const dealt = dealDamage(state, target, intentValue);
      applyHeroEnergyDrain(state, 1);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and drains Energy!`);
      return true;
    }

    if (intent.kind === "buff_allies_attack") {
      const livingAllies = _getLivingEnemies(state).filter((a: CombatEnemyState) => a.id !== enemy.id);
      livingAllies.forEach((ally: CombatEnemyState) => {
        ally.buffedAttack = (ally.buffedAttack || 0) + intent.value;
      });
      _appendLog(state, `${enemy.name} uses ${intent.label} — buffing allies' next attack by +${intent.value}!`);
      putIntentOnCooldown(enemy);
      return true;
    }

    if (intent.kind === "consume_corpse") {
      const corpses = _getDeadEnemies(state);
      if (corpses.length > 0) {
        const corpse = corpses[0];
        corpse.consumed = true;
        const healed = healEntity(enemy, Math.floor(enemy.maxLife * 0.25));
        const target = chooseTarget(state, "hero");
        const dealt = target ? dealDamage(state, target, intentValue) : 0;
        _appendLog(state, `${enemy.name} consumes ${corpse.name}'s corpse, heals ${healed}, and spits remains for ${dealt}!`);
      } else {
        const target = chooseTarget(state, "hero");
        if (target) {
          const dealt = dealDamage(state, target, intentValue);
          _appendLog(state, `${enemy.name} finds no corpse — attacks ${target.name} for ${dealt}.`);
        }
      }
      return true;
    }

    if (intent.kind === "corpse_explosion") {
      const deadCount = _getDeadEnemies(state).length;
      if (deadCount > 0) {
        const explosionDamage = Math.max(2, deadCount * intent.value);
        const partyTargets = [state.hero, state.mercenary].filter((t: CombatHeroState | CombatMercenaryState) => t?.alive);
        const segments = partyTargets.map((target) => {
          const dealt = dealDamage(state, target, explosionDamage);
          return `${target.name} for ${dealt}`;
        });
        _appendLog(state, `${enemy.name} detonates ${deadCount} corpse${deadCount > 1 ? "s" : ""}, hitting ${segments.join(" and ")}!`);
      } else {
        const target = chooseTarget(state, "hero");
        if (target) {
          const dealt = dealDamage(state, target, intentValue);
          _appendLog(state, `${enemy.name} finds no corpses — attacks ${target.name} for ${dealt}.`);
        }
      }
      return true;
    }

    return false;
  }

  runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS = {
    TRAIT: traits.TRAIT,
    AFFIX_COUNT_BY_ACT: traits.AFFIX_COUNT_BY_ACT,
    rollRandomAffixes: traits.rollRandomAffixes,
    applyHeroBurn: traits.applyHeroBurn,
    applyHeroPoison: traits.applyHeroPoison,
    applyHeroChill: traits.applyHeroChill,
    applyHeroAmplify: traits.applyHeroAmplify,
    applyHeroWeaken: traits.applyHeroWeaken,
    applyHeroEnergyDrain: traits.applyHeroEnergyDrain,
    processDeathTraits: traits.processDeathTraits,
    processSpawnTraits: traits.processSpawnTraits,
    processHeroDebuffs: traits.processHeroDebuffs,
    processModifierOnAttack,
    processModifierOnHit,
    isIntentOnCooldown: traits.isIntentOnCooldown,
    putIntentOnCooldown: traits.putIntentOnCooldown,
    tickCooldowns: traits.tickCooldowns,
    resolveMonsterIntent,
  };
})();
