(() => {
  const runtimeWindow = (typeof window === "object" ? window : {}) as Window;

  function parseInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : fallback;
  }

  function appendLog(state, message) {
    state.log.unshift(message);
    state.log = state.log.slice(0, 18);
  }

  function applyGuard(entity, amount) {
    if (!entity || !entity.alive) {
      return 0;
    }
    entity.guard = Math.max(0, entity.guard + amount);
    return amount;
  }

  function advanceEnemyIntent(enemy, steps) {
    if (!enemy?.alive || !Array.isArray(enemy.intents) || enemy.intents.length === 0) {
      return;
    }

    const stepCount = Math.max(0, parseInteger(steps, 0));
    enemy.intentIndex = (enemy.intentIndex + stepCount) % enemy.intents.length;
    enemy.currentIntent = { ...enemy.intents[enemy.intentIndex] };
  }

  function setEnemyIntentToFirstMatchingKind(enemy, supportedKinds) {
    if (!enemy?.alive || !Array.isArray(enemy.intents) || enemy.intents.length === 0) {
      return false;
    }

    const matchingIndex = enemy.intents.findIndex((intent) => intent && supportedKinds.has(intent.kind));
    if (matchingIndex < 0) {
      return false;
    }

    enemy.intentIndex = matchingIndex;
    enemy.currentIntent = { ...enemy.intents[enemy.intentIndex] };
    return true;
  }

  function boostEnemyIntentValues(enemy, supportedKinds, amount) {
    if (!enemy?.alive || !Array.isArray(enemy.intents) || enemy.intents.length === 0) {
      return false;
    }

    const bonus = Math.max(0, parseInteger(amount, 0));
    if (bonus <= 0) {
      return false;
    }

    let changed = false;
    enemy.intents = enemy.intents.map((intent) => {
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

  function applyEncounterModifiers(state) {
    const modifiers = Array.isArray(state?.encounter?.modifiers) ? state.encounter.modifiers : [];
    const attackIntentKinds = new Set(["attack", "attack_all", "attack_and_guard", "drain_attack", "sunder_attack"]);
    const healingIntentKinds = new Set(["heal_ally", "heal_allies", "heal_and_guard"]);
    const linebreakerIntentKinds = new Set(["attack_and_guard", "sunder_attack"]);
    const ritualIntentKinds = new Set(["guard", "guard_allies", "heal_ally", "heal_allies", "heal_and_guard"]);

    modifiers.forEach((modifier) => {
      if (modifier.kind === "fortified_line") {
        const guardValue = Math.max(0, parseInteger(modifier.value, 0));
        state.enemies.forEach((enemy) => applyGuard(enemy, guardValue));
        appendLog(state, `${state.encounter.name} begins fortified. The enemy line gains ${guardValue} Guard.`);
        return;
      }

      if (modifier.kind === "ambush_opening") {
        const stepCount = Math.max(1, parseInteger(modifier.value, 1));
        const ambushers = state.enemies.filter((enemy) => enemy.role === "raider" || enemy.role === "ranged");
        ambushers.forEach((enemy) => advanceEnemyIntent(enemy, stepCount));
        if (ambushers.length > 0) {
          appendLog(state, `${state.encounter.name} opens as an ambush. Raider and ranged enemies shift their first intent.`);
        }
        return;
      }

      if (modifier.kind === "escort_bulwark") {
        const guardValue = Math.max(0, parseInteger(modifier.value, 0));
        const escortTargets = state.enemies.filter((enemy) => {
          return enemy.role === "support" || enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss");
        });
        escortTargets.forEach((enemy) => applyGuard(enemy, guardValue));
        if (escortTargets.length > 0) {
          appendLog(state, `${state.encounter.name} forms an escort bulwark. Elite and support enemies gain ${guardValue} Guard.`);
        }
        return;
      }

      if (modifier.kind === "backline_screen") {
        const guardValue = Math.max(0, parseInteger(modifier.value, 0));
        const backlineTargets = state.enemies.filter((enemy) => enemy.role === "support" || enemy.role === "ranged");
        backlineTargets.forEach((enemy) => applyGuard(enemy, guardValue));
        if (backlineTargets.length > 0) {
          appendLog(state, `${state.encounter.name} establishes a backline screen. Ranged and support enemies gain ${guardValue} Guard.`);
        }
        return;
      }

      if (modifier.kind === "vanguard_rush") {
        const stepCount = Math.max(1, parseInteger(modifier.value, 1));
        const vanguardTargets = state.enemies.filter((enemy) => enemy.role === "raider" || enemy.role === "brute");
        vanguardTargets.forEach((enemy) => advanceEnemyIntent(enemy, stepCount));
        if (vanguardTargets.length > 0) {
          appendLog(state, `${state.encounter.name} surges forward. Raider and brute enemies shift their first intent.`);
        }
        return;
      }

      if (modifier.kind === "escort_command") {
        const stepCount = Math.max(1, parseInteger(modifier.value, 1));
        const commandTargets = state.enemies.filter((enemy) => {
          return enemy.role === "support" || enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss");
        });
        commandTargets.forEach((enemy) => advanceEnemyIntent(enemy, stepCount));
        if (commandTargets.length > 0) {
          appendLog(state, `${state.encounter.name} opens under escort command. Elite and support enemies advance their script.`);
        }
        return;
      }

      if (modifier.kind === "escort_rotation") {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const escortTargets = state.enemies.filter((enemy) => {
          return !enemy.templateId.endsWith("_boss") && (
            enemy.role === "support" ||
            enemy.role === "brute" ||
            enemy.templateId.includes("_elite")
          );
        });
        escortTargets.forEach((enemy) => applyGuard(enemy, value));
        escortTargets.forEach((enemy) => advanceEnemyIntent(enemy, 1));
        if (escortTargets.length > 0) {
          appendLog(
            state,
            `${state.encounter.name} rotates its escorts. Non-boss escorts gain ${value} Guard and advance their opening script.`
          );
        }
        return;
      }

      if (modifier.kind === "court_reserves") {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const reserveTargets = state.enemies.filter((enemy) => {
          return !enemy.templateId.endsWith("_boss") && (
            enemy.templateId.includes("_elite") ||
            enemy.role === "ranged" ||
            enemy.role === "support"
          );
        });
        reserveTargets.forEach((enemy) => applyGuard(enemy, value));
        const reserveIntentKinds = new Set([...attackIntentKinds, ...healingIntentKinds]);
        const boostedCount = reserveTargets.reduce((count, enemy) => {
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

      if (modifier.kind === "crossfire_lanes") {
        const damageBonus = Math.max(0, parseInteger(modifier.value, 0));
        const rangedTargets = state.enemies.filter((enemy) => enemy.role === "ranged");
        const boostedCount = rangedTargets.reduce((count, enemy) => {
          return count + (boostEnemyIntentValues(enemy, attackIntentKinds, damageBonus) ? 1 : 0);
        }, 0);
        if (boostedCount > 0) {
          appendLog(state, `${state.encounter.name} establishes crossfire lanes. Ranged enemies hit ${damageBonus} harder.`);
        }
        return;
      }

      if (modifier.kind === "war_drums") {
        const damageBonus = Math.max(0, parseInteger(modifier.value, 0));
        const vanguardTargets = state.enemies.filter((enemy) => enemy.role === "raider" || enemy.role === "brute");
        const boostedCount = vanguardTargets.reduce((count, enemy) => {
          return count + (boostEnemyIntentValues(enemy, attackIntentKinds, damageBonus) ? 1 : 0);
        }, 0);
        if (boostedCount > 0) {
          appendLog(state, `${state.encounter.name} beats war drums. Raider and brute enemies hit ${damageBonus} harder.`);
        }
        return;
      }

      if (modifier.kind === "triage_command") {
        const healingBonus = Math.max(0, parseInteger(modifier.value, 0));
        const supportTargets = state.enemies.filter((enemy) => enemy.role === "support");
        const boostedCount = supportTargets.reduce((count, enemy) => {
          return count + (boostEnemyIntentValues(enemy, healingIntentKinds, healingBonus) ? 1 : 0);
        }, 0);
        if (boostedCount > 0) {
          appendLog(state, `${state.encounter.name} opens under triage command. Support enemies restore ${healingBonus} more life.`);
        }
        return;
      }

      if (modifier.kind === "triage_screen") {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const supportTargets = state.enemies.filter((enemy) => enemy.role === "support");
        const guardTargets = supportTargets.filter((enemy) => enemy.alive);
        guardTargets.forEach((enemy) => applyGuard(enemy, value));
        const boostedCount = supportTargets.reduce((count, enemy) => {
          return count + (boostEnemyIntentValues(enemy, healingIntentKinds, value) ? 1 : 0);
        }, 0);
        if (guardTargets.length > 0 || boostedCount > 0) {
          appendLog(state, `${state.encounter.name} forms a triage screen. Support enemies gain ${value} Guard and restore ${value} more life.`);
        }
        return;
      }

      if (modifier.kind === "linebreaker_charge") {
        const damageBonus = Math.max(0, parseInteger(modifier.value, 0));
        const linebreakerTargets = state.enemies.filter((enemy) => {
          return enemy.role === "brute" || enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss");
        });
        const retunedCount = linebreakerTargets.reduce((count, enemy) => {
          return count + (setEnemyIntentToFirstMatchingKind(enemy, linebreakerIntentKinds) ? 1 : 0);
        }, 0);
        const boostedCount = linebreakerTargets.reduce((count, enemy) => {
          return count + (boostEnemyIntentValues(enemy, linebreakerIntentKinds, damageBonus) ? 1 : 0);
        }, 0);
        if (retunedCount > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} drills a linebreaker charge. Heavy enemies shift into breach scripts and their guard-breaking hits intensify by ${damageBonus}.`
          );
        }
        return;
      }

      if (modifier.kind === "ritual_cadence") {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const ritualTargets = state.enemies.filter((enemy) => enemy.role === "support" || enemy.templateId.endsWith("_boss"));
        const retunedCount = ritualTargets.reduce((count, enemy) => {
          return count + (setEnemyIntentToFirstMatchingKind(enemy, ritualIntentKinds) ? 1 : 0);
        }, 0);
        ritualTargets.forEach((enemy) => applyGuard(enemy, value));
        const boostedCount = ritualTargets.reduce((count, enemy) => {
          return count + (boostEnemyIntentValues(enemy, ritualIntentKinds, value) ? 1 : 0);
        }, 0);
        if (ritualTargets.length > 0 || retunedCount > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} opens under ritual cadence. Support and boss enemies gain ${value} Guard and their warding rites intensify by ${value}.`
          );
        }
        return;
      }

      if (modifier.kind === "elite_onslaught") {
        const damageBonus = Math.max(0, parseInteger(modifier.value, 0));
        const eliteTargets = state.enemies.filter((enemy) => enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss"));
        eliteTargets.forEach((enemy) => advanceEnemyIntent(enemy, 1));
        eliteTargets.forEach((enemy) => {
          boostEnemyIntentValues(enemy, attackIntentKinds, damageBonus);
        });
        if (eliteTargets.length > 0) {
          appendLog(state, `${state.encounter.name} opens under elite onslaught. Elite enemies advance their script and hit ${damageBonus} harder.`);
        }
        return;
      }

      if (modifier.kind === "sniper_nest") {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const backlineTargets = state.enemies.filter((enemy) => enemy.role === "ranged" || enemy.role === "support");
        backlineTargets.forEach((enemy) => applyGuard(enemy, value));
        const boostedCount = backlineTargets.reduce((count, enemy) => {
          return count + (boostEnemyIntentValues(enemy, attackIntentKinds, value) ? 1 : 0);
        }, 0);
        if (backlineTargets.length > 0 || boostedCount > 0) {
          appendLog(state, `${state.encounter.name} opens from a sniper nest. Backline enemies gain ${value} Guard and ranged attackers hit ${value} harder.`);
        }
        return;
      }

      if (modifier.kind === "boss_screen") {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const bossTargets = state.enemies.filter((enemy) => enemy.templateId.endsWith("_boss"));
        const backlineTargets = state.enemies.filter((enemy) => enemy.role === "ranged" || enemy.role === "support");
        const bossIntentKinds = new Set([...attackIntentKinds, ...healingIntentKinds, "guard", "guard_allies"]);

        bossTargets.forEach((enemy) => applyGuard(enemy, value));
        backlineTargets.forEach((enemy) => applyGuard(enemy, value));
        const boostedCount = bossTargets.reduce((count, enemy) => {
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

      if (modifier.kind === "boss_onslaught") {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const bossTargets = state.enemies.filter((enemy) => enemy.templateId.endsWith("_boss"));
        const retunedCount = bossTargets.reduce((count, enemy) => {
          return count + (setEnemyIntentToFirstMatchingKind(enemy, attackIntentKinds) ? 1 : 0);
        }, 0);
        const boostedCount = bossTargets.reduce((count, enemy) => {
          return count + (boostEnemyIntentValues(enemy, attackIntentKinds, value) ? 1 : 0);
        }, 0);
        if (retunedCount > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} drives a boss onslaught. The boss shifts into its first attack script and hits ${value} harder.`
          );
        }
        return;
      }

      if (modifier.kind === "boss_salvo") {
        const value = Math.max(0, parseInteger(modifier.value, 0));
        const salvoTargets = state.enemies.filter((enemy) => enemy.templateId.endsWith("_boss") || enemy.role === "ranged");
        const retunedCount = salvoTargets.reduce((count, enemy) => {
          return count + (setEnemyIntentToFirstMatchingKind(enemy, attackIntentKinds) ? 1 : 0);
        }, 0);
        const boostedCount = salvoTargets.reduce((count, enemy) => {
          return count + (boostEnemyIntentValues(enemy, attackIntentKinds, value) ? 1 : 0);
        }, 0);
        if (retunedCount > 0 || boostedCount > 0) {
          appendLog(
            state,
            `${state.encounter.name} opens in a boss salvo. The boss and ranged escorts shift into attack scripts and hit ${value} harder.`
          );
        }
        return;
      }

      if (modifier.kind === "phalanx_march") {
        const guardValue = Math.max(0, parseInteger(modifier.value, 0));
        const marchTargets = state.enemies.filter((enemy) => {
          return enemy.role === "brute" || enemy.templateId.includes("_elite") || enemy.templateId.endsWith("_boss");
        });
        marchTargets.forEach((enemy) => applyGuard(enemy, guardValue));
        marchTargets.forEach((enemy) => advanceEnemyIntent(enemy, 1));
        if (marchTargets.length > 0) {
          appendLog(state, `${state.encounter.name} advances in phalanx formation. Brute and elite enemies gain ${guardValue} Guard and advance their script.`);
        }
      }
    });
  }

  runtimeWindow.ROUGE_COMBAT_MODIFIERS = {
    applyEncounterModifiers,
  };
})();
