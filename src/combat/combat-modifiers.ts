(() => {
  const runtimeWindow = (typeof window === "object" ? window : {}) as Window;
  const { parseInteger } = runtimeWindow.ROUGE_UTILS;
  const { ENEMY_ROLE } = runtimeWindow.ROUGE_CONSTANTS;

  // Accessed lazily — combat-engine-turns loads after this module
  function applyGuard(target: CombatEnemyState, value: number) {
    runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS.applyGuard(target, value);
  }
  function appendLog(state: CombatState, message: string) {
    runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS.appendLog(state, message);
  }

  function advanceEnemyIntent(enemy: CombatEnemyState, steps: number) {
    if (!enemy?.alive || !Array.isArray(enemy.intents) || enemy.intents.length === 0) {
      return;
    }

    const stepCount = Math.max(0, parseInteger(steps, 0));
    enemy.intentIndex = (enemy.intentIndex + stepCount) % enemy.intents.length;
    enemy.currentIntent = { ...enemy.intents[enemy.intentIndex] };
  }

  function setEnemyIntentToFirstMatchingKind(enemy: CombatEnemyState, supportedKinds: Set<string>) {
    if (!enemy?.alive || !Array.isArray(enemy.intents) || enemy.intents.length === 0) {
      return false;
    }

    const matchingIndex = enemy.intents.findIndex((intent: EnemyIntent) => intent && supportedKinds.has(intent.kind));
    if (matchingIndex < 0) {
      return false;
    }

    enemy.intentIndex = matchingIndex;
    enemy.currentIntent = { ...enemy.intents[enemy.intentIndex] };
    return true;
  }

  function boostEnemyIntentValues(enemy: CombatEnemyState, supportedKinds: Set<string>, amount: number) {
    if (!enemy?.alive || !Array.isArray(enemy.intents) || enemy.intents.length === 0) {
      return false;
    }

    const bonus = Math.max(0, parseInteger(amount, 0));
    if (bonus <= 0) {
      return false;
    }

    let changed = false;
    enemy.intents = enemy.intents.map((intent: EnemyIntent) => {
      if (!intent || !supportedKinds.has(intent.kind)) {
        return intent;
      }

      changed = true;
      return {
        ...intent,
        value: Math.max(0, parseInteger(intent.value, 0) + bonus),
      };
    });

    if (changed) {
      enemy.currentIntent = { ...enemy.intents[enemy.intentIndex] };
    }

    return changed;
  }

  const INTENT = {
    ATTACK: "attack",
    ATTACK_ALL: "attack_all",
    ATTACK_AND_GUARD: "attack_and_guard",
    DRAIN_ATTACK: "drain_attack",
    SUNDER_ATTACK: "sunder_attack",
    CHARGE: "charge",
    TELEPORT: "teleport",
    ATTACK_BURN: "attack_burn",
    ATTACK_BURN_ALL: "attack_burn_all",
    ATTACK_LIGHTNING: "attack_lightning",
    ATTACK_LIGHTNING_ALL: "attack_lightning_all",
    ATTACK_POISON_ALL: "attack_poison_all",
    ATTACK_CHILL: "attack_chill",
    ATTACK_POISON: "attack_poison",
    DRAIN_ENERGY: "drain_energy",
    GUARD: "guard",
    GUARD_ALLIES: "guard_allies",
    HEAL_ALLY: "heal_ally",
    HEAL_ALLIES: "heal_allies",
    HEAL_AND_GUARD: "heal_and_guard",
    RESURRECT_ALLY: "resurrect_ally",
    BUFF_ALLIES_ATTACK: "buff_allies_attack",
    CONSUME_CORPSE: "consume_corpse",
    CORPSE_EXPLOSION: "corpse_explosion",
    CURSE_AMPLIFY: "curse_amplify",
    CURSE_WEAKEN: "curse_weaken",
    SUMMON_MINION: "summon_minion",
  } as const;

  const ATTACK_INTENT_KINDS = new Set([
    INTENT.ATTACK, INTENT.ATTACK_ALL, INTENT.ATTACK_AND_GUARD,
    INTENT.DRAIN_ATTACK, INTENT.SUNDER_ATTACK, INTENT.ATTACK_BURN,
    INTENT.ATTACK_BURN_ALL, INTENT.ATTACK_LIGHTNING, INTENT.ATTACK_LIGHTNING_ALL,
    INTENT.ATTACK_CHILL, INTENT.ATTACK_POISON, INTENT.ATTACK_POISON_ALL, INTENT.DRAIN_ENERGY,
  ]);

  const PRESSURE_INTENT_KINDS = new Set([...ATTACK_INTENT_KINDS, INTENT.CHARGE]);

  const HEALING_INTENT_KINDS = new Set([
    INTENT.HEAL_ALLY, INTENT.HEAL_ALLIES, INTENT.HEAL_AND_GUARD, INTENT.RESURRECT_ALLY,
  ]);

  const LINEBREAKER_INTENT_KINDS = new Set([INTENT.ATTACK_AND_GUARD, INTENT.SUNDER_ATTACK]);

  const RITUAL_INTENT_KINDS = new Set([
    INTENT.GUARD, INTENT.GUARD_ALLIES, INTENT.HEAL_ALLY,
    INTENT.HEAL_ALLIES, INTENT.HEAL_AND_GUARD, INTENT.RESURRECT_ALLY,
  ]);

  const MODIFIER_KIND = {
    FORTIFIED_LINE: "fortified_line",
    AMBUSH_OPENING: "ambush_opening",
    ESCORT_BULWARK: "escort_bulwark",
    BACKLINE_SCREEN: "backline_screen",
    VANGUARD_RUSH: "vanguard_rush",
    ESCORT_COMMAND: "escort_command",
    ESCORT_ROTATION: "escort_rotation",
    COURT_RESERVES: "court_reserves",
    CROSSFIRE_LANES: "crossfire_lanes",
    WAR_DRUMS: "war_drums",
    TRIAGE_COMMAND: "triage_command",
    TRIAGE_SCREEN: "triage_screen",
    LINEBREAKER_CHARGE: "linebreaker_charge",
    RITUAL_CADENCE: "ritual_cadence",
    ELITE_ONSLAUGHT: "elite_onslaught",
    SNIPER_NEST: "sniper_nest",
    BOSS_SCREEN: "boss_screen",
    BOSS_ONSLAUGHT: "boss_onslaught",
    BOSS_SALVO: "boss_salvo",
    PHALANX_MARCH: "phalanx_march",
  } as const;

  function applyEncounterModifiers(state: CombatState) {
    const modifiers = Array.isArray(state?.encounter?.modifiers) ? state.encounter.modifiers : [];

    modifiers.forEach((modifier: EncounterModifier) => {
      if (modifier.kind === MODIFIER_KIND.FORTIFIED_LINE) {
        const guardValue = Math.max(0, parseInteger(modifier.value, 0));
        state.enemies.forEach((enemy: CombatEnemyState) => applyGuard(enemy, guardValue));
        appendLog(state, `${state.encounter.name} begins fortified. The enemy line gains ${guardValue} Guard.`);
        return;
      }

      if (modifier.kind === MODIFIER_KIND.AMBUSH_OPENING) {
        const stepCount = Math.max(1, parseInteger(modifier.value, 1));
        const ambushers = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.RAIDER || enemy.role === ENEMY_ROLE.RANGED);
        ambushers.forEach((enemy: CombatEnemyState) => advanceEnemyIntent(enemy, stepCount));
        if (ambushers.length > 0) {
          appendLog(state, `${state.encounter.name} opens as an ambush. Raider and ranged enemies shift their first intent.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.ESCORT_BULWARK) {
        const guardValue = Math.max(0, parseInteger(modifier.value, 0));
        const escortTargets = state.enemies.filter((enemy: CombatEnemyState) => {
          return enemy.role === ENEMY_ROLE.SUPPORT || enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss");
        });
        escortTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, guardValue));
        if (escortTargets.length > 0) {
          appendLog(state, `${state.encounter.name} forms an escort bulwark. Elite and support enemies gain ${guardValue} Guard.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.BACKLINE_SCREEN) {
        const guardValue = Math.max(0, parseInteger(modifier.value, 0));
        const backlineTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.SUPPORT || enemy.role === ENEMY_ROLE.RANGED);
        backlineTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, guardValue));
        if (backlineTargets.length > 0) {
          appendLog(state, `${state.encounter.name} establishes a backline screen. Ranged and support enemies gain ${guardValue} Guard.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.VANGUARD_RUSH) {
        const stepCount = Math.max(1, parseInteger(modifier.value, 1));
        const vanguardTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.RAIDER || enemy.role === ENEMY_ROLE.BRUTE);
        vanguardTargets.forEach((enemy: CombatEnemyState) => advanceEnemyIntent(enemy, stepCount));
        if (vanguardTargets.length > 0) {
          appendLog(state, `${state.encounter.name} surges forward. Raider and brute enemies shift their first intent.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.ESCORT_COMMAND) {
        const stepCount = Math.max(1, parseInteger(modifier.value, 1));
        const commandTargets = state.enemies.filter((enemy: CombatEnemyState) => {
          return enemy.role === ENEMY_ROLE.SUPPORT || enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss");
        });
        commandTargets.forEach((enemy: CombatEnemyState) => advanceEnemyIntent(enemy, stepCount));
        if (commandTargets.length > 0) {
          appendLog(state, `${state.encounter.name} opens under escort command. Elite and support enemies advance their script.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.ESCORT_ROTATION) {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const escortTargets = state.enemies.filter((enemy: CombatEnemyState) => {
          return !enemy.templateId.endsWith("_boss") && (
            enemy.role === ENEMY_ROLE.SUPPORT ||
            enemy.role === ENEMY_ROLE.BRUTE ||
            enemy.templateId.includes("_elite")
          );
        });
        escortTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, value));
        escortTargets.forEach((enemy: CombatEnemyState) => advanceEnemyIntent(enemy, 1));
        if (escortTargets.length > 0) {
          appendLog(
            state,
            `${state.encounter.name} rotates its escorts. Non-boss escorts gain ${value} Guard and advance their opening script.`
          );
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.COURT_RESERVES) {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const reserveTargets = state.enemies.filter((enemy: CombatEnemyState) => {
          return !enemy.templateId.endsWith("_boss") && (
            enemy.templateId.includes("_elite") ||
            enemy.role === ENEMY_ROLE.RANGED ||
            enemy.role === ENEMY_ROLE.SUPPORT
          );
        });
        reserveTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, value));
        const reserveIntentKinds = new Set([...ATTACK_INTENT_KINDS, ...HEALING_INTENT_KINDS]);
        const boostedCount = reserveTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, reserveIntentKinds, value) ? 1 : 0);
        }, 0);
        if (reserveTargets.length > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} calls up court reserves. Elite and backline escorts gain ${value} Guard and their opening pressure intensifies by ${value}.`
          );
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.CROSSFIRE_LANES) {
        const damageBonus = Math.max(0, parseInteger(modifier.value, 0));
        const rangedTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.RANGED);
        const boostedCount = rangedTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, ATTACK_INTENT_KINDS, damageBonus) ? 1 : 0);
        }, 0);
        if (boostedCount > 0) {
          appendLog(state, `${state.encounter.name} establishes crossfire lanes. Ranged enemies hit ${damageBonus} harder.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.WAR_DRUMS) {
        const damageBonus = Math.max(0, parseInteger(modifier.value, 0));
        const vanguardTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.RAIDER || enemy.role === ENEMY_ROLE.BRUTE);
        const boostedCount = vanguardTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, ATTACK_INTENT_KINDS, damageBonus) ? 1 : 0);
        }, 0);
        if (boostedCount > 0) {
          appendLog(state, `${state.encounter.name} beats war drums. Raider and brute enemies hit ${damageBonus} harder.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.TRIAGE_COMMAND) {
        const healingBonus = Math.max(0, parseInteger(modifier.value, 0));
        const supportTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.SUPPORT);
        const boostedCount = supportTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, HEALING_INTENT_KINDS, healingBonus) ? 1 : 0);
        }, 0);
        if (boostedCount > 0) {
          appendLog(state, `${state.encounter.name} opens under triage command. Support enemies restore ${healingBonus} more life.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.TRIAGE_SCREEN) {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const supportTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.SUPPORT);
        const guardTargets = supportTargets.filter((enemy: CombatEnemyState) => enemy.alive);
        guardTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, value));
        const boostedCount = supportTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, HEALING_INTENT_KINDS, value) ? 1 : 0);
        }, 0);
        if (guardTargets.length > 0 || boostedCount > 0) {
          appendLog(state, `${state.encounter.name} forms a triage screen. Support enemies gain ${value} Guard and restore ${value} more life.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.LINEBREAKER_CHARGE) {
        const damageBonus = Math.max(0, parseInteger(modifier.value, 0));
        const linebreakerTargets = state.enemies.filter((enemy: CombatEnemyState) => {
          return enemy.role === ENEMY_ROLE.BRUTE || enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss");
        });
        const retunedCount = linebreakerTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (setEnemyIntentToFirstMatchingKind(enemy, LINEBREAKER_INTENT_KINDS) ? 1 : 0);
        }, 0);
        const boostedCount = linebreakerTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, LINEBREAKER_INTENT_KINDS, damageBonus) ? 1 : 0);
        }, 0);
        if (retunedCount > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} drills a linebreaker charge. Heavy enemies shift into breach scripts and their guard-breaking hits intensify by ${damageBonus}.`
          );
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.RITUAL_CADENCE) {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const ritualTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.SUPPORT || enemy.templateId.endsWith("_boss"));
        const retunedCount = ritualTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (setEnemyIntentToFirstMatchingKind(enemy, RITUAL_INTENT_KINDS) ? 1 : 0);
        }, 0);
        ritualTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, value));
        const boostedCount = ritualTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, RITUAL_INTENT_KINDS, value) ? 1 : 0);
        }, 0);
        if (ritualTargets.length > 0 || retunedCount > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} opens under ritual cadence. Support and boss enemies gain ${value} Guard and their warding rites intensify by ${value}.`
          );
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.ELITE_ONSLAUGHT) {
        const damageBonus = Math.max(0, parseInteger(modifier.value, 0));
        const eliteTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss"));
        eliteTargets.forEach((enemy: CombatEnemyState) => advanceEnemyIntent(enemy, 1));
        eliteTargets.forEach((enemy: CombatEnemyState) => {
          boostEnemyIntentValues(enemy, ATTACK_INTENT_KINDS, damageBonus);
        });
        if (eliteTargets.length > 0) {
          appendLog(state, `${state.encounter.name} opens under elite onslaught. Elite enemies advance their script and hit ${damageBonus} harder.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.SNIPER_NEST) {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const backlineTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.RANGED || enemy.role === ENEMY_ROLE.SUPPORT);
        backlineTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, value));
        const boostedCount = backlineTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, ATTACK_INTENT_KINDS, value) ? 1 : 0);
        }, 0);
        if (backlineTargets.length > 0 || boostedCount > 0) {
          appendLog(state, `${state.encounter.name} opens from a sniper nest. Backline enemies gain ${value} Guard and ranged attackers hit ${value} harder.`);
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.BOSS_SCREEN) {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const bossTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.templateId.endsWith("_boss"));
        const backlineTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.role === ENEMY_ROLE.RANGED || enemy.role === ENEMY_ROLE.SUPPORT);
        const bossIntentKinds = new Set([...PRESSURE_INTENT_KINDS, ...HEALING_INTENT_KINDS, "guard", "guard_allies"]);

        bossTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, value));
        backlineTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, value));
        const boostedCount = bossTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, bossIntentKinds, value) ? 1 : 0);
        }, 0);
        if (bossTargets.length > 0 || backlineTargets.length > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} raises a boss screen. The boss gains ${value} Guard, escorts gain ${value} Guard, and the boss opener intensifies by ${value}.`
          );
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.BOSS_ONSLAUGHT) {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const bossTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.templateId.endsWith("_boss"));
        const retunedCount = bossTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (setEnemyIntentToFirstMatchingKind(enemy, PRESSURE_INTENT_KINDS) ? 1 : 0);
        }, 0);
        const boostedCount = bossTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, PRESSURE_INTENT_KINDS, value) ? 1 : 0);
        }, 0);
        if (retunedCount > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} drives a boss onslaught. The boss shifts into its first attack script and hits ${value} harder.`
          );
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.BOSS_SALVO) {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const salvoTargets = state.enemies.filter((enemy: CombatEnemyState) => enemy.templateId.endsWith("_boss") || enemy.role === ENEMY_ROLE.RANGED);
        const retunedCount = salvoTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (setEnemyIntentToFirstMatchingKind(enemy, PRESSURE_INTENT_KINDS) ? 1 : 0);
        }, 0);
        const boostedCount = salvoTargets.reduce((count: number, enemy: CombatEnemyState) => {
          return count + (boostEnemyIntentValues(enemy, PRESSURE_INTENT_KINDS, value) ? 1 : 0);
        }, 0);
        if (retunedCount > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} opens in a boss salvo. The boss and ranged escorts shift into attack scripts and hit ${value} harder.`
          );
        }
        return;
      }

      if (modifier.kind === MODIFIER_KIND.PHALANX_MARCH) {
        const guardValue = Math.max(0, parseInteger(modifier.value, 0));
        const marchTargets = state.enemies.filter((enemy: CombatEnemyState) => {
          return enemy.role === ENEMY_ROLE.BRUTE || enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss");
        });
        marchTargets.forEach((enemy: CombatEnemyState) => applyGuard(enemy, guardValue));
        marchTargets.forEach((enemy: CombatEnemyState) => advanceEnemyIntent(enemy, 1));
        if (marchTargets.length > 0) {
          appendLog(state, `${state.encounter.name} advances in phalanx formation. Brute and elite enemies gain ${guardValue} Guard and advance their script.`);
        }
      }
    });
  }

  runtimeWindow.ROUGE_COMBAT_MODIFIERS = {
    INTENT,
    MODIFIER_KIND,
    ATTACK_INTENT_KINDS,
    HEALING_INTENT_KINDS,
    LINEBREAKER_INTENT_KINDS,
    RITUAL_INTENT_KINDS,
    applyEncounterModifiers,
  };
})();
