(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const MAX_ENEMIES_IN_COMBAT = 6;

  const combatLog = runtimeWindow.__ROUGE_COMBAT_LOG;
  function _appendLog(state: CombatState, message: string) {
    combatLog.appendLog(state, message);
  }
  function _logCombat(state: CombatState, params: {
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

  function _hasTrait(enemy: CombatEnemyState, trait: MonsterTraitKind) {
    return Array.isArray(enemy.traits) && enemy.traits.includes(trait);
  }

  function heroIsImmuneTo(state: CombatState, damageType: DamageType) {
    return Array.isArray(state.armorProfile?.immunities) && state.armorProfile.immunities.includes(damageType);
  }

  function dealHeroDamage(state: CombatState, amount: number, damageType: DamageType = "physical", bypassGuard = true) {
    const combatTurns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    if (bypassGuard) {
      return combatTurns?.dealDirectDamage?.(state, state.hero, amount, damageType) || 0;
    }
    return combatTurns?.dealDamage?.(state, state.hero, amount, damageType) || 0;
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
    const builderData = runtimeWindow.__ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS_DATA;
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
    if (heroIsImmuneTo(state, "fire")) {
      return;
    }
    state.hero.heroBurn = Math.max(0, state.hero.heroBurn + stacks);
  }

  function applyHeroPoison(state: CombatState, stacks: number) {
    if (heroIsImmuneTo(state, "poison")) {
      return;
    }
    state.hero.heroPoison = Math.max(0, state.hero.heroPoison + stacks);
  }

  function applyHeroChill(state: CombatState, stacks: number) {
    if (heroIsImmuneTo(state, "cold")) {
      return;
    }
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
      const dealt = dealHeroDamage(state, explosionDamage, "physical", true);
      _logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "trait", tone: "loss",
        message: `${enemy.name} EXPLODES for ${dealt} damage! (bypasses Guard)`,
        effects: [{ target: "hero", targetName: "The Wanderer", damage: dealt, lifeAfter: state.hero.life, guardAfter: state.hero.guard }],
      });
      if (state.hero.life <= 0 && state.hero.alive) {
        state.hero.alive = false;
        state.hero.guard = 0;
        _logCombat(state, {
          actor: "environment", actorName: "",
          action: "death", tone: "loss",
          message: "The Wanderer falls. Encounter lost.",
          effects: [{ target: "hero", targetName: "The Wanderer", killed: true, lifeAfter: state.hero.life, guardAfter: state.hero.guard }],
        });
      }
    }

    if (enemy.traits.includes("death_poison")) {
      const stacks = 2;
      applyHeroPoison(state, stacks);
      _logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "trait", tone: "status",
        message: `${enemy.name}'s corpse releases a poison cloud! (${stacks} Poison on hero)`,
        effects: [{ target: "hero", targetName: "The Wanderer", statusApplied: { kind: "poison", stacks }, lifeAfter: state.hero.life, guardAfter: state.hero.guard }],
      });
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
        _logCombat(state, {
          actor: "enemy", actorName: enemy.name, actorId: enemy.id,
          action: "summon", tone: "summon",
          message: `${enemy.name} bursts open, spawning ${spawnCount} creature${spawnCount > 1 ? "s" : ""}!`,
        });
      }
    }

    if (enemy.traits.includes(TRAIT.FIRE_ENCHANTED)) {
      const fireDamage = Math.max(1, Math.floor(enemy.maxLife * 0.25));
      const dealt = dealHeroDamage(state, fireDamage, "fire", true);
      _logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "trait", tone: "loss",
        message: `${enemy.name} erupts in flame for ${dealt} fire damage! (bypasses Guard)`,
        effects: [{ target: "hero", targetName: "The Wanderer", damage: dealt, lifeAfter: state.hero.life, guardAfter: state.hero.guard }],
      });
      if (state.hero.life <= 0 && state.hero.alive) {
        state.hero.alive = false;
        state.hero.guard = 0;
        _logCombat(state, {
          actor: "environment", actorName: "",
          action: "death", tone: "loss",
          message: "The Wanderer falls. Encounter lost.",
          effects: [{ target: "hero", targetName: "The Wanderer", killed: true, lifeAfter: state.hero.life, guardAfter: state.hero.guard }],
        });
      }
    }

    if (enemy.traits.includes(TRAIT.COLD_ENCHANTED)) {
      applyHeroChill(state, 2);
      _logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "trait", tone: "status",
        message: `${enemy.name} releases a Frost Nova! (2 Chill on hero)`,
        effects: [{ target: "hero", targetName: "The Wanderer", statusApplied: { kind: "chill", stacks: 2 }, lifeAfter: state.hero.life, guardAfter: state.hero.guard }],
      });
    }
  }

  // ── On-spawn trait processing (ETB triggers) ──

  function processSpawnTraits(state: CombatState, enemy: CombatEnemyState) {
    if (!Array.isArray(enemy.traits) || !enemy.traits.includes("summon_allies_on_spawn")) {
      return;
    }
    const config = enemy.spawnConfig;
    if (!config) {
      return;
    }
    const range = config.maxCount - config.minCount + 1;
    const count = config.minCount + Math.floor(state.randomFn() * range);
    const spawnCount = Math.min(count, MAX_ENEMIES_IN_COMBAT - state.enemies.length);

    for (let i = 0; i < spawnCount; i++) {
      const spawnId = `spawn_init_${state.enemies.length}`;
      const spawnLife = Math.max(3, Math.floor(enemy.maxLife * config.lifeRatio));
      const baseAttack = enemy.intents[0]?.value || 3;
      const spawnAttack = Math.max(2, Math.floor(baseAttack * config.attackRatio));
      const spawn: CombatEnemyState = {
        id: spawnId,
        templateId: `${enemy.templateId}_${config.family}`,
        name: config.spawnName,
        role: config.role,
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
        currentIntent: { kind: "attack", label: `${config.spawnName} Stab`, value: spawnAttack, target: "hero" },
        intents: [
          { kind: "attack", label: `${config.spawnName} Stab`, value: spawnAttack, target: "hero" },
          { kind: "attack", label: `${config.spawnName} Slash`, value: spawnAttack, target: "lowest_life" },
        ],
        traits: [...config.traits],
        family: config.family,
        summonTemplateId: "",
        consumed: false,
        buffedAttack: 0,
      };
      state.enemies.push(spawn);
    }

    if (spawnCount > 0) {
      _logCombat(state, {
        actor: "enemy", actorName: enemy.name, actorId: enemy.id,
        action: "summon", tone: "summon",
        message: `${enemy.name} enters with ${spawnCount} ${config.spawnName}${spawnCount > 1 ? "s" : ""}!`,
      });
    }
  }

  // ── Hero debuff turn processing ──

  function processHeroDebuffs(state: CombatState) {
    if (!state.hero.alive) {
      return;
    }

    if (state.hero.heroBurn > 0) {
      const burnDmg = state.hero.heroBurn;
      const dealt = dealHeroDamage(state, burnDmg, "fire", true);
      _logCombat(state, {
        actor: "environment", actorName: "",
        action: "status_tick", tone: "status",
        message: `The Wanderer takes ${dealt} Burn damage.`,
        effects: [{ target: "hero", targetName: "The Wanderer", damage: dealt, lifeAfter: state.hero.life, guardAfter: state.hero.guard }],
      });
      state.hero.heroBurn = Math.max(0, state.hero.heroBurn - 1);
      if (state.hero.life <= 0 && state.hero.alive) {
        state.hero.alive = false;
        state.hero.guard = 0;
        return;
      }
    }

    if (state.hero.heroPoison > 0) {
      const poisonDmg = state.hero.heroPoison;
      const dealt = dealHeroDamage(state, poisonDmg, "poison", true);
      _logCombat(state, {
        actor: "environment", actorName: "",
        action: "status_tick", tone: "status",
        message: `The Wanderer takes ${dealt} Poison damage.`,
        effects: [{ target: "hero", targetName: "The Wanderer", damage: dealt, lifeAfter: state.hero.life, guardAfter: state.hero.guard }],
      });
      state.hero.heroPoison = Math.max(0, state.hero.heroPoison - 1);
      if (state.hero.life <= 0 && state.hero.alive) {
        state.hero.alive = false;
        state.hero.guard = 0;
        return;
      }
    }

    if (state.hero.chill > 0) {
      _logCombat(state, {
        actor: "environment", actorName: "",
        action: "status_tick", tone: "status",
        message: `The Wanderer is Chilled — draws 1 fewer card.`,
      });
      state.hero.chill = Math.max(0, state.hero.chill - 1);
    }

    if (state.hero.energyDrain > 0) {
      _logCombat(state, {
        actor: "environment", actorName: "",
        action: "status_tick", tone: "status",
        message: `The Wanderer is drained — 1 less Energy this turn.`,
      });
      state.hero.energyDrain = Math.max(0, state.hero.energyDrain - 1);
    }

    if (state.hero.amplify > 0) {
      _logCombat(state, {
        actor: "environment", actorName: "",
        action: "status_tick", tone: "status",
        message: `Amplify Damage active — the Wanderer takes increased damage.`,
      });
      state.hero.amplify = Math.max(0, state.hero.amplify - 1);
    }

    if (state.hero.weaken > 0) {
      _logCombat(state, {
        actor: "environment", actorName: "",
        action: "status_tick", tone: "status",
        message: `Decrepify active — the Wanderer deals reduced damage.`,
      });
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

  runtimeWindow.__ROUGE_MONSTER_TRAITS = {
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
    processSpawnTraits,
    processHeroDebuffs,
    isIntentOnCooldown,
    putIntentOnCooldown,
    tickCooldowns,
  };
})();
