(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

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

  // ── Elite modifier trait constants ──

  const TRAIT: Record<string, MonsterTraitKind> = {
    EXTRA_FAST: "extra_fast",
    EXTRA_STRONG: "extra_strong",
    CURSED: "cursed",
    COLD_ENCHANTED: "cold_enchanted",
    FIRE_ENCHANTED: "fire_enchanted",
    LIGHTNING_ENCHANTED: "lightning_enchanted",
    STONE_SKIN: "stone_skin",
    MANA_BURN: "mana_burn",
  };

  // ── Random affix scaling by act ──
  // [normalMin, normalMax, eliteMin, eliteMax]
  const AFFIX_COUNT_BY_ACT: Record<number, [number, number, number, number]> = {
    0: [0, 0, 0, 0],
    1: [0, 0, 1, 1],
    2: [0, 0, 1, 1],
    3: [0, 1, 1, 2],
    4: [0, 1, 2, 3],
    5: [1, 1, 2, 3],
  };

  function rollAffixCount(actNumber: number, isElite: boolean, randomFn: RandomFn): number {
    const tier = AFFIX_COUNT_BY_ACT[actNumber] || AFFIX_COUNT_BY_ACT[0];
    const min = isElite ? tier[2] : tier[0];
    const max = isElite ? tier[3] : tier[1];
    if (min >= max) { return min; }
    return min + Math.floor(randomFn() * (max - min + 1));
  }

  function rollRandomAffixes(
    actNumber: number,
    variant: string,
    existingTraits: MonsterTraitKind[],
    randomFn: RandomFn,
  ): { traits: MonsterTraitKind[]; lifeBonus: number; attackBonus: number; guardBonus: number } {
    if (variant === "boss") {
      return { traits: [], lifeBonus: 0, attackBonus: 0, guardBonus: 0 };
    }
    const builderData = runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS_DATA;
    const packages: { profileId: string }[] = builderData.ACT_ELITE_PACKAGES[actNumber] || [];
    const profiles: Record<string, { lifeBonus: number; attackBonus: number; guardBonus: number }> = builderData.ELITE_AFFIX_PROFILES;
    const modifierMap: Record<string, MonsterTraitKind> = builderData.ELITE_MODIFIER_MAP;

    const pool = packages
      .map((pkg: { profileId: string }) => ({
        profileId: pkg.profileId,
        modifier: modifierMap[pkg.profileId],
        profile: profiles[pkg.profileId],
      }))
      .filter((entry) => entry.modifier && entry.profile && !existingTraits.includes(entry.modifier));

    if (pool.length === 0) {
      return { traits: [], lifeBonus: 0, attackBonus: 0, guardBonus: 0 };
    }

    const isElite = variant === "elite";
    const count = Math.min(rollAffixCount(actNumber, isElite, randomFn), pool.length);
    if (count === 0) {
      return { traits: [], lifeBonus: 0, attackBonus: 0, guardBonus: 0 };
    }

    // Fisher-Yates shuffle of pool indices, pick first `count`
    const indices = pool.map((_: unknown, i: number) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(randomFn() * (i + 1));
      const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
    }

    const picked = indices.slice(0, count).map((idx: number) => pool[idx]);
    const traits = picked.map((p: { modifier: MonsterTraitKind }) => p.modifier);
    const lifeBonus = picked.reduce((sum: number, p: { profile: { lifeBonus: number } }) => sum + p.profile.lifeBonus, 0);
    const attackBonus = picked.reduce((sum: number, p: { profile: { attackBonus: number } }) => sum + p.profile.attackBonus, 0);
    const guardBonus = picked.reduce((sum: number, p: { profile: { guardBonus: number } }) => sum + p.profile.guardBonus, 0);

    return { traits, lifeBonus, attackBonus, guardBonus };
  }

  // ── Hero debuff helpers ──

  function applyHeroBurn(state: CombatState, stacks: number) {
    state.hero.heroBurn = Math.max(0, state.hero.heroBurn + stacks);
  }

  function applyHeroPoison(state: CombatState, stacks: number) {
    state.hero.heroPoison = Math.max(0, state.hero.heroPoison + stacks);
  }

  function applyHeroChill(state: CombatState, stacks: number) {
    state.hero.chill = Math.max(0, state.hero.chill + stacks);
  }

  function applyHeroAmplify(state: CombatState, stacks: number) {
    state.hero.amplify = Math.max(0, state.hero.amplify + stacks);
  }

  function applyHeroWeaken(state: CombatState, stacks: number) {
    state.hero.weaken = Math.max(0, state.hero.weaken + stacks);
  }

  function applyHeroEnergyDrain(state: CombatState, stacks: number) {
    state.hero.energyDrain = Math.max(0, state.hero.energyDrain + stacks);
  }

  // ── Death trait processing ──

  function processDeathTraits(state: CombatState, enemy: CombatEnemyState) {
    if (!Array.isArray(enemy.traits)) {
      return;
    }

    if (enemy.traits.includes("death_explosion")) {
      const explosionDamage = Math.max(1, Math.floor(enemy.maxLife * 0.3));
      const before = state.hero.life;
      state.hero.life = Math.max(0, state.hero.life - explosionDamage);
      const dealt = before - state.hero.life;
      _appendLog(state, `${enemy.name} EXPLODES for ${dealt} damage! (bypasses Guard)`);
      if (state.hero.life <= 0 && state.hero.alive) {
        state.hero.alive = false;
        state.hero.guard = 0;
        _appendLog(state, "The Wanderer falls. Encounter lost.");
      }
    }

    if (enemy.traits.includes("death_poison")) {
      const stacks = 2;
      applyHeroPoison(state, stacks);
      _appendLog(state, `${enemy.name}'s corpse releases a poison cloud! (${stacks} Poison on hero)`);
    }

    if (enemy.traits.includes("death_spawn")) {
      if (state.enemies.length < MAX_ENEMIES_IN_COMBAT) {
        const spawnCount = Math.min(2, MAX_ENEMIES_IN_COMBAT - state.enemies.length);
        for (let i = 0; i < spawnCount; i++) {
          const spawnId = `spawn_${state.turn}_${state.enemies.length}`;
          const spawnLife = Math.max(3, Math.floor(enemy.maxLife * 0.3));
          const spawn: CombatEnemyState = {
            id: spawnId,
            templateId: enemy.summonTemplateId || `${enemy.templateId}_spawn`,
            name: `${enemy.name} spawn`,
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
            currentIntent: { kind: "attack", label: "Spawn Bite", value: Math.max(2, Math.floor(enemy.maxLife * 0.1)), target: "hero" },
            intents: [
              { kind: "attack", label: "Spawn Bite", value: Math.max(2, Math.floor(enemy.maxLife * 0.1)), target: "hero" },
            ],
            traits: [],
            family: enemy.family || "",
            summonTemplateId: "",
            consumed: false,
            buffedAttack: 0,
          };
          state.enemies.push(spawn);
        }
        _appendLog(state, `${enemy.name} bursts open, spawning ${spawnCount} creature${spawnCount > 1 ? "s" : ""}!`);
      }
    }

    if (enemy.traits.includes(TRAIT.FIRE_ENCHANTED)) {
      const fireDamage = Math.max(1, Math.floor(enemy.maxLife * 0.25));
      const before = state.hero.life;
      state.hero.life = Math.max(0, state.hero.life - fireDamage);
      const dealt = before - state.hero.life;
      _appendLog(state, `${enemy.name} erupts in flame for ${dealt} fire damage! (bypasses Guard)`);
      if (state.hero.life <= 0 && state.hero.alive) {
        state.hero.alive = false;
        state.hero.guard = 0;
        _appendLog(state, "The Wanderer falls. Encounter lost.");
      }
    }

    if (enemy.traits.includes(TRAIT.COLD_ENCHANTED)) {
      applyHeroChill(state, 2);
      _appendLog(state, `${enemy.name} releases a Frost Nova! (2 Chill on hero)`);
    }
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
      const before = state.hero.life;
      state.hero.life = Math.max(0, state.hero.life - boltDamage);
      const dealt = before - state.hero.life;
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

  // ── Hero debuff turn processing ──

  function processHeroDebuffs(state: CombatState) {
    if (!state.hero.alive) {
      return;
    }

    if (state.hero.heroBurn > 0) {
      const burnDmg = state.hero.heroBurn;
      state.hero.life = Math.max(0, state.hero.life - burnDmg);
      _appendLog(state, `The Wanderer takes ${burnDmg} Burn damage.`);
      state.hero.heroBurn = Math.max(0, state.hero.heroBurn - 1);
      if (state.hero.life <= 0 && state.hero.alive) {
        state.hero.alive = false;
        state.hero.guard = 0;
        return;
      }
    }

    if (state.hero.heroPoison > 0) {
      const poisonDmg = state.hero.heroPoison;
      state.hero.life = Math.max(0, state.hero.life - poisonDmg);
      _appendLog(state, `The Wanderer takes ${poisonDmg} Poison damage.`);
      state.hero.heroPoison = Math.max(0, state.hero.heroPoison - 1);
      if (state.hero.life <= 0 && state.hero.alive) {
        state.hero.alive = false;
        state.hero.guard = 0;
        return;
      }
    }

    if (state.hero.chill > 0) {
      _appendLog(state, `The Wanderer is Chilled — draws 1 fewer card.`);
      state.hero.chill = Math.max(0, state.hero.chill - 1);
    }

    if (state.hero.energyDrain > 0) {
      _appendLog(state, `The Wanderer is drained — 1 less Energy this turn.`);
      state.hero.energyDrain = Math.max(0, state.hero.energyDrain - 1);
    }

    if (state.hero.amplify > 0) {
      _appendLog(state, `Amplify Damage active — the Wanderer takes increased damage.`);
      state.hero.amplify = Math.max(0, state.hero.amplify - 1);
    }

    if (state.hero.weaken > 0) {
      _appendLog(state, `Decrepify active — the Wanderer deals reduced damage.`);
      state.hero.weaken = Math.max(0, state.hero.weaken - 1);
    }
  }

  // ── Cooldown helpers ──

  function isIntentOnCooldown(enemy: CombatEnemyState) {
    if (!enemy.cooldowns || !enemy.currentIntent?.cooldown) {
      return false;
    }
    return (enemy.cooldowns[enemy.intentIndex] || 0) > 0;
  }

  function putIntentOnCooldown(enemy: CombatEnemyState) {
    if (!enemy.currentIntent?.cooldown) {
      return;
    }
    if (!enemy.cooldowns) {
      enemy.cooldowns = {};
    }
    enemy.cooldowns[enemy.intentIndex] = enemy.currentIntent.cooldown;
  }

  function tickCooldowns(enemy: CombatEnemyState) {
    if (!enemy.cooldowns) {
      return;
    }
    for (const key of Object.keys(enemy.cooldowns)) {
      const idx = Number(key);
      if (enemy.cooldowns[idx] > 0) {
        enemy.cooldowns[idx] -= 1;
      }
    }
  }

  // ── D2 monster intent resolution ──
  // Returns true if the intent was handled, false to fall through to base intents.

  function resolveMonsterIntent(
    state: CombatState,
    enemy: CombatEnemyState,
    intent: EnemyIntent,
    intentValue: number,
    chooseTarget: (state: CombatState, rule: EnemyIntentTarget | undefined) => CombatHeroState | CombatMercenaryState | null,
    dealDamage: (state: CombatState, entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number,
    healEntity: (entity: CombatHeroState | CombatMercenaryState | CombatEnemyState, amount: number) => number,
  ): boolean {

    // --- Resurrect Ally (Shaman / Greater Mummy) ---
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

    // --- Summon Minion (Sand Maggot / Flesh Spawner) ---
    if (intent.kind === "summon_minion") {
      if (state.enemies.length < MAX_ENEMIES_IN_COMBAT) {
        const spawnId = `summon_${state.turn}_${state.enemies.length}`;
        const spawnLife = Math.max(4, Math.floor(intent.value * 1.5));
        const spawnAttack = Math.max(2, Math.floor(intent.value * 0.6));
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
        _appendLog(state, `${enemy.name} uses ${intent.label} and spawns a minion!`);
        putIntentOnCooldown(enemy);
      } else {
        _appendLog(state, `${enemy.name} tries to summon but the field is full.`);
      }
      return true;
    }

    // --- Attack + Burn (Inferno, Fireball) ---
    if (intent.kind === "attack_burn") {
      const target = chooseTarget(state, intent.target);
      if (!target) { return true; }
      const dealt = dealDamage(state, target, intentValue);
      const burnStacks = intent.secondaryValue || 2;
      applyHeroBurn(state, burnStacks);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and inflicts ${burnStacks} Burn!`);
      return true;
    }

    // --- Attack All + Burn (Inferno Breath, Fire Wall) ---
    if (intent.kind === "attack_burn_all") {
      const partyTargets = [state.hero, state.mercenary].filter((t: CombatHeroState | CombatMercenaryState) => t?.alive);
      const segments = partyTargets.map((target) => {
        const dealt = dealDamage(state, target, intentValue);
        return `${target.name} for ${dealt}`;
      });
      const burnStacks = intent.secondaryValue || 2;
      applyHeroBurn(state, burnStacks);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${segments.join(" and ")} and inflicts ${burnStacks} Burn!`);
      return true;
    }

    // --- Attack + Poison ---
    if (intent.kind === "attack_poison") {
      const target = chooseTarget(state, intent.target);
      if (!target) { return true; }
      const dealt = dealDamage(state, target, intentValue);
      const poisonStacks = intent.secondaryValue || 2;
      applyHeroPoison(state, poisonStacks);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and inflicts ${poisonStacks} Poison!`);
      return true;
    }

    // --- Attack + Chill (Cold) ---
    if (intent.kind === "attack_chill") {
      const target = chooseTarget(state, intent.target);
      if (!target) { return true; }
      const dealt = dealDamage(state, target, intentValue);
      const chillStacks = intent.secondaryValue || 1;
      applyHeroChill(state, chillStacks);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and inflicts Chill!`);
      return true;
    }

    // --- Curse: Amplify Damage ---
    if (intent.kind === "curse_amplify") {
      const stacks = intent.value || 2;
      applyHeroAmplify(state, stacks);
      _appendLog(state, `${enemy.name} casts ${intent.label} — the Wanderer takes increased damage for ${stacks} turns!`);
      putIntentOnCooldown(enemy);
      return true;
    }

    // --- Curse: Weaken / Decrepify ---
    if (intent.kind === "curse_weaken") {
      const stacks = intent.value || 2;
      applyHeroWeaken(state, stacks);
      _appendLog(state, `${enemy.name} casts ${intent.label} — the Wanderer deals reduced damage for ${stacks} turns!`);
      putIntentOnCooldown(enemy);
      return true;
    }

    // --- Drain Energy (Mana Burn) ---
    if (intent.kind === "drain_energy") {
      const target = chooseTarget(state, intent.target);
      if (!target) { return true; }
      const dealt = dealDamage(state, target, intentValue);
      applyHeroEnergyDrain(state, 1);
      _appendLog(state, `${enemy.name} uses ${intent.label} on ${target.name} for ${dealt} and drains Energy!`);
      return true;
    }

    // --- Buff Allies Attack (Overseer Whip) ---
    if (intent.kind === "buff_allies_attack") {
      const livingAllies = _getLivingEnemies(state).filter((a: CombatEnemyState) => a.id !== enemy.id);
      livingAllies.forEach((ally: CombatEnemyState) => {
        ally.buffedAttack = (ally.buffedAttack || 0) + intent.value;
      });
      _appendLog(state, `${enemy.name} uses ${intent.label} — buffing allies' next attack by +${intent.value}!`);
      putIntentOnCooldown(enemy);
      return true;
    }

    // --- Consume Corpse (Corpse Spitter) ---
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

    // --- Corpse Explosion (Death Mauler) ---
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
    TRAIT,
    AFFIX_COUNT_BY_ACT,
    rollRandomAffixes,
    applyHeroBurn,
    applyHeroPoison,
    applyHeroChill,
    applyHeroAmplify,
    applyHeroWeaken,
    applyHeroEnergyDrain,
    processDeathTraits,
    processHeroDebuffs,
    processModifierOnAttack,
    processModifierOnHit,
    isIntentOnCooldown,
    putIntentOnCooldown,
    tickCooldowns,
    resolveMonsterIntent,
  };
})();
