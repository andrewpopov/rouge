/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const combatLog = runtimeWindow.__ROUGE_COMBAT_LOG;

  // Skill resolution extracted from combat-engine.ts
  // Handles per-skill-ID active skill logic for summon, area, hybrid, and support skills.

  function getSkillTierScale(skill: CombatEquippedSkillState): number {
    if (skill.slot === 3 || skill.tier === "capstone") { return 3; }
    if (skill.slot === 2 || skill.tier === "bridge") { return 2; }
    return 1;
  }

  function getActiveMinions(state: CombatState): CombatMinionState[] {
    return runtimeWindow.__ROUGE_COMBAT_MINIONS?.getActiveMinions?.(state)
      || (Array.isArray(state.minions) ? state.minions : []);
  }

  function reinforceFirstActiveMinion(state: CombatState, amount: number): string {
    const minion = getActiveMinions(state)[0];
    if (!minion || amount <= 0) {
      return "";
    }
    minion.power += amount;
    return `${minion.name} is reinforced by +${amount} power.`;
  }

  function isEnemyAlreadyWounded(enemy: CombatEnemyState | null): boolean {
    if (!enemy) {
      return false;
    }
    return enemy.life < enemy.maxLife
      || enemy.burn > 0
      || enemy.poison > 0
      || enemy.slow > 0
      || enemy.freeze > 0
      || enemy.stun > 0
      || enemy.paralyze > 0;
  }

  function enemyWillAttackNextTurn(enemy: CombatEnemyState | null): boolean {
    if (!enemy || !Array.isArray(enemy.intents) || enemy.intents.length === 0) {
      return false;
    }
    const nextIndex = (enemy.intentIndex + 1) % enemy.intents.length;
    const nextKind = enemy.intents[nextIndex]?.kind || "";
    const attackKinds = runtimeWindow.ROUGE_COMBAT_MODIFIERS?.ATTACK_INTENT_KINDS;
    if (attackKinds?.has?.(nextKind)) {
      return true;
    }
    return [
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
    ].includes(nextKind);
  }

  function addSkillWindow(
    state: CombatState,
    skill: CombatEquippedSkillState,
    summary: string,
    patch: Partial<CombatSkillWindowState>
  ) {
    return runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS.addSkillWindow(state, {
      id: `${skill.skillId}_${state.turn}_${state.cardsPlayed}_${state.skillWindows.length + 1}`,
      skillId: skill.skillId,
      summary,
      ...patch,
    });
  }

  function reinforceAllActiveMinions(state: CombatState, amount: number, extraTurns = 0): string {
    const minions = getActiveMinions(state);
    if (minions.length === 0 || (amount <= 0 && extraTurns <= 0)) {
      return "";
    }
    minions.forEach((minion) => {
      minion.power += amount;
      if (!minion.persistent && extraTurns > 0) {
        minion.remainingTurns += extraTurns;
      }
    });
    return `${minions.length} summon${minions.length === 1 ? "" : "s"} reinforced${amount > 0 ? ` by +${amount}` : ""}${extraTurns > 0 ? `${amount > 0 ? " and" : ""} +${extraTurns} turn` : ""}.`;
  }

  function extendFirstActiveMinion(state: CombatState, amount: number, extraTurns = 0): string {
    const minion = getActiveMinions(state)[0];
    if (!minion || (amount <= 0 && extraTurns <= 0)) {
      return "";
    }
    minion.power += amount;
    if (!minion.persistent && extraTurns > 0) {
      minion.remainingTurns += extraTurns;
    }
    return `${minion.name} gains${amount > 0 ? ` +${amount} power` : ""}${extraTurns > 0 ? `${amount > 0 ? " and" : ""} +${extraTurns} turn` : ""}.`;
  }

  function cleansePartyDebuff(state: CombatState): string {
    const debuffs: Array<keyof CombatHeroState> = [
      "heroBurn",
      "heroPoison",
      "chill",
      "amplify",
      "weaken",
      "energyDrain",
    ];
    const removed = debuffs.find((key) => Math.max(0, Number(state.hero[key] || 0)) > 0);
    if (!removed) {
      return "no debuff removed";
    }
    state.hero[removed] = 0 as never;
    return `cleanses ${removed}`;
  }

  function resolveStarterCoreSkill(
    state: CombatState,
    skill: CombatEquippedSkillState,
    targetEnemy: CombatEnemyState | null
  ): boolean {
    const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const scale = getSkillTierScale(skill);
    const modifiers: Partial<CombatSkillModifierState> = {};
    const segments: string[] = [];

    switch (skill.skillId) {
      case "amazon_call_the_shot": {
        const markBonus = 3 + scale;
        modifiers.nextCardDamageBonus = scale + 1;
        if (targetEnemy?.id) {
          state.mercenary.markedEnemyId = targetEnemy.id;
          state.mercenary.markBonus = Math.max(state.mercenary.markBonus, markBonus);
          segments.push(`marks ${targetEnemy.name} for +${markBonus} mercenary damage`);
        } else {
          segments.push("sharpens the next shot");
        }
        break;
      }
      case "assassin_shadow_feint": {
        h.applyGuard(state.hero, 4 + scale);
        modifiers.nextCardCostReduction = 1;
        modifiers.nextCardDamageBonus = scale + 1;
        modifiers.nextCardGuard = scale + 1;
        segments.push(`gains ${4 + scale} Guard`);
        break;
      }
      case "barbarian_core_bash": {
        const alreadyWounded = isEnemyAlreadyWounded(targetEnemy);
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 5 + scale, "physical" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        if (alreadyWounded) {
          h.applyGuard(state.hero, 2);
          segments.push("gains 2 Guard");
        }
        break;
      }
      case "druid_primal_attunement": {
        h.applyGuard(state.hero, 3 + scale);
        modifiers.nextCardDamageBonus = scale + 1;
        segments.push(`gains ${3 + scale} Guard`);
        const reinforcement = reinforceFirstActiveMinion(state, 1);
        if (reinforcement) {
          segments.push(reinforcement);
        }
        break;
      }
      case "necromancer_raise_servant": {
        const reinforcement = reinforceFirstActiveMinion(state, scale + 1);
        if (reinforcement) {
          segments.push(reinforcement);
        } else {
          const result = turns.summonMinion(state, h.createSummonSkillEffect(state, "necromancer_servant", 1 + scale, 0, 2));
          segments.push(result);
        }
        break;
      }
      case "paladin_sanctify": {
        h.applyGuardToParty(state, 3 + scale, 3 + scale);
        modifiers.nextCardDamageBonus = scale + 1;
        modifiers.nextCardGuard = scale + 1;
        segments.push(`grants ${3 + scale} Guard to the party`);
        break;
      }
      case "sorceress_core_fire_bolt": {
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 3 + scale, "fire" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        if (state.cardsPlayed === 0) {
          modifiers.nextCardCostReduction = 1;
          segments.push("smooths the next cast");
        }
        break;
      }
      default:
        return false;
    }

    h.addSkillModifiers(state, modifiers);
    const prep = h.getSkillPreparationSummary(state.skillModifiers);
    const message = `${skill.name}: ${segments.join(", ")}${prep ? ` (${prep}).` : "."}`;
    combatLog.appendLogEntry(state, combatLog.createLogEntry(state, {
      actor: "hero",
      actorName: "the Wanderer",
      action: "skill_use",
      actionId: skill.skillId,
      message,
    }));
    if (targetEnemy?.id) {
      state.selectedEnemyId = targetEnemy.id;
    }
    turns.checkOutcome(state);
    return true;
  }

  function buildSummonEffect(
    state: CombatState,
    skill: CombatEquippedSkillState
  ): CardEffect | null {
    const scale = getSkillTierScale(skill);
    const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    const build = (minionId: string, value: number, secondaryValue = 0, duration = 3): CardEffect =>
      h.createSummonSkillEffect(state, minionId, value, secondaryValue, duration);

    switch (skill.skillId) {
      case "amazon_decoy": return build("amazon_decoy", 2 + scale, 2 + scale);
      case "amazon_valkyrie": return build("amazon_valkyrie", 3 + scale, 2 + scale);
      case "assassin_shadow_master": return build("assassin_shadow_master", 3 + scale, 1 + scale);
      case "assassin_shadow_warrior": return build("assassin_shadow_master", 2 + scale, 1 + scale);
      case "assassin_lightning_sentry": return build("assassin_lightning_sentry", 2 + scale, 1 + scale, 4);
      case "assassin_wake_of_inferno": return build("assassin_wake_of_inferno", 2 + scale, 1 + scale, 4);
      case "assassin_death_sentry": return build("assassin_death_sentry", 3 + scale, 1 + scale, 4);
      case "druid_raven": return build("druid_raven", 2 + scale, 1 + scale);
      case "druid_poison_creeper": return build("druid_poison_creeper", 2 + scale, 1 + scale);
      case "druid_carrion_vine": return build("druid_carrion_vine", 2 + scale);
      case "druid_oak_sage": return build("druid_oak_sage", 2 + scale);
      case "druid_summon_spirit_wolf": return build("druid_spirit_wolf", 2 + scale, 0, 2);
      case "druid_summon_dire_wolf": return build("druid_dire_wolf", 3 + scale, 1 + scale, 2);
      case "druid_heart_of_wolverine": return build("druid_heart_of_wolverine", 2 + scale, 1 + scale);
      case "druid_solar_creeper": return build("druid_solar_creeper", 2 + scale, 1 + scale);
      case "druid_spirit_of_barbs": return build("druid_spirit_of_barbs", 2 + scale, 2 + scale);
      case "druid_summon_grizzly": return build("druid_grizzly", 3 + scale, 2 + scale);
      case "necromancer_raise_skeleton": return build("necromancer_skeleton", 2 + scale);
      case "necromancer_skeletal_mage": return build("necromancer_skeletal_mage", 2 + scale, 1 + scale);
      case "necromancer_clay_golem": return build("necromancer_clay_golem", 2 + scale, 1 + scale);
      case "necromancer_blood_golem": return build("necromancer_blood_golem", 3 + scale, 2 + scale);
      case "necromancer_iron_golem": return build("necromancer_iron_golem", 3 + scale, 2 + scale);
      case "necromancer_fire_golem": return build("necromancer_fire_golem", 3 + scale, 2 + scale);
      case "necromancer_revive": return build("necromancer_revive", 3 + scale, 2 + scale);
      case "sorceress_hydra": return build("sorceress_hydra", 3 + scale, 2 + scale);
      default: return null;
    }
  }

  function resolveSummonSkill(state: CombatState, skill: CombatEquippedSkillState): boolean {
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    const scale = getSkillTierScale(skill);
    const activeMinions = getActiveMinions(state);
    if (skill.skillId === "druid_pack_call") {
      const result = activeMinions.length > 0
        ? reinforceFirstActiveMinion(state, 2)
        : turns.summonMinion(state, h.createSummonSkillEffect(state, "druid_spirit_wolf", 2 + scale, 0, 2));
      combatLog.appendLogEntry(state, combatLog.createLogEntry(state, {
        actor: "hero",
        actorName: "the Wanderer",
        action: "skill_use",
        actionId: skill.skillId,
        message: `${skill.name}: ${result}`,
      }));
      turns.checkOutcome(state);
      return true;
    }
    if (skill.skillId === "druid_wild_convergence") {
      const result = activeMinions.length > 0
        ? reinforceAllActiveMinions(state, 2, 1)
        : turns.summonMinion(state, h.createSummonSkillEffect(state, "druid_grizzly", 3 + scale, 2 + scale, 2));
      combatLog.appendLogEntry(state, combatLog.createLogEntry(state, {
        actor: "hero",
        actorName: "the Wanderer",
        action: "skill_use",
        actionId: skill.skillId,
        message: `${skill.name}: ${result}`,
      }));
      turns.checkOutcome(state);
      return true;
    }
    if (skill.skillId === "necromancer_mass_reassembly") {
      const result = activeMinions.length > 0
        ? reinforceAllActiveMinions(state, 1)
        : turns.summonMinion(state, h.createSummonSkillEffect(state, "necromancer_skeleton", 2 + scale, 0, 2));
      combatLog.appendLogEntry(state, combatLog.createLogEntry(state, {
        actor: "hero",
        actorName: "the Wanderer",
        action: "skill_use",
        actionId: skill.skillId,
        message: `${skill.name}: ${result}`,
      }));
      turns.checkOutcome(state);
      return true;
    }
    if (skill.skillId === "necromancer_army_of_dust") {
      const result = activeMinions.length > 0
        ? reinforceAllActiveMinions(state, 2)
        : [
          turns.summonMinion(state, h.createSummonSkillEffect(state, "necromancer_skeleton", 2 + scale, 0, 2)),
          turns.summonMinion(state, h.createSummonSkillEffect(state, "necromancer_skeleton", 2 + scale, 0, 2)),
        ].join(" ");
      combatLog.appendLogEntry(state, combatLog.createLogEntry(state, {
        actor: "hero",
        actorName: "the Wanderer",
        action: "skill_use",
        actionId: skill.skillId,
        message: `${skill.name}: ${result}`,
      }));
      turns.checkOutcome(state);
      return true;
    }
    const effect = buildSummonEffect(state, skill);
    if (!effect) { return false; }
    const result = turns.summonMinion(state, effect);
    combatLog.appendLogEntry(state, combatLog.createLogEntry(state, {
      actor: "hero",
      actorName: "the Wanderer",
      action: "skill_use",
      actionId: skill.skillId,
      message: `${skill.name}: ${result}`,
    }));
    turns.checkOutcome(state);
    return true;
  }

  function resolveAuthoredSkill(
    state: CombatState,
    skill: CombatEquippedSkillState,
    targetEnemy: CombatEnemyState | null
  ): boolean {
    const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const segments: string[] = [];
    let handled = true;

    switch (skill.skillId) {
      case "amazon_serrated_volley":
        addSkillWindow(state, skill, "Next 2 ranged cards +3", {
          remainingUses: 2,
          requireKindsAny: ["ranged"],
          damageBonus: 3,
          slowOnSameEnemyCombo: 2,
        });
        segments.push("arms the next 2 ranged cards");
        break;
      case "amazon_pinning_fire":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 6, "physical" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
          if (enemyWillAttackNextTurn(targetEnemy)) {
            targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + 6);
            targetEnemy.slow = Math.max(0, targetEnemy.slow + 1);
            segments.push(`${targetEnemy.name}'s next attack weakens`);
          }
        }
        break;
      case "amazon_kill_zone":
        if (targetEnemy) {
          addSkillWindow(state, skill, `Next 3 ranged hits vs ${targetEnemy.name} +6`, {
            remainingUses: 3,
            requireKindsAny: ["ranged"],
            requireTargetEnemyId: targetEnemy.id,
            damageBonus: 6,
            nextAttackPenaltyOnHit: 8,
            requireEnemyAttackingNextTurnForPenalty: true,
          });
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 6);
          state.mercenary.skillTargetNextAttackPenalty = Math.max(0, state.mercenary.skillTargetNextAttackPenalty + 8);
          segments.push(`focuses fire on ${targetEnemy.name}`);
        }
        break;
      case "amazon_spear_break":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 7, "physical" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
          if (enemyWillAttackNextTurn(targetEnemy)) {
            targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + 6);
            state.mercenary.skillTargetEnemyId = targetEnemy.id;
            state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 4);
            segments.push(`breaks ${targetEnemy.name}'s next attack`);
          }
        }
        break;
      case "amazon_storm_step":
        h.applyGuard(state.hero, 5);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Next Attack +5", {
          remainingUses: 1,
          requireKindsAny: ["attack"],
          damageBonus: 5,
        });
        segments.push("gains 5 Guard");
        break;
      case "amazon_storm_spear":
        h.dealDamageToAllEnemies(state, 10, "physical" as DamageType);
        addSkillWindow(state, skill, "Next Attack +8", {
          remainingUses: 1,
          requireKindsAny: ["attack"],
          damageBonus: 8,
        });
        segments.push("crashes through the whole line");
        break;
      case "amazon_evasive_step":
        h.applyGuard(state.hero, 7);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 6);
        segments.push("gains 7 Guard and blunts the next enemy attack");
        break;
      case "amazon_hunters_focus":
        if (targetEnemy) {
          addSkillWindow(state, skill, `Next single-target hit on ${targetEnemy.name} draws 1`, {
            remainingUses: 1,
            requireSingleTargetDamage: true,
            requireTargetEnemyId: targetEnemy.id,
            drawOnDamage: 1,
          });
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDraw = Math.max(0, state.mercenary.skillTargetDraw + 1);
          segments.push(`focuses ${targetEnemy.name}`);
        }
        break;
      case "amazon_predators_calm":
        h.applyGuard(state.hero, 10);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Next 3 damaging cards +5", {
          remainingUses: 3,
          requireDamageCard: true,
          damageBonus: 5,
          drawOnSingleTargetDamage: 1,
        });
        segments.push("gains 10 Guard");
        break;
      case "assassin_marked_opening":
        if (targetEnemy) {
          addSkillWindow(state, skill, `Next Attack vs ${targetEnemy.name} +5`, {
            remainingUses: 1,
            requireKindsAny: ["attack"],
            requireTargetEnemyId: targetEnemy.id,
            damageBonus: 5,
          });
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 5);
          segments.push(`opens ${targetEnemy.name} to a follow-up`);
        }
        break;
      case "assassin_flash_step":
        h.applyGuard(state.hero, 7);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Next Assassin damage card cost -1", {
          remainingUses: 1,
          requireKindsAny: ["assassin_damage"],
          costReduction: 1,
        });
        segments.push("gains 7 Guard");
        break;
      case "assassin_death_blossom":
        addSkillWindow(state, skill, "Next 2 Assassin damage cards +8 cost -1", {
          remainingUses: 2,
          requireKindsAny: ["assassin_damage"],
          damageBonus: 8,
          costReduction: 1,
          energyNextTurnOnSameEnemyCombo: 1,
        });
        segments.push("arms 2 deadly follow-ups");
        break;
      case "assassin_execution_window":
        addSkillWindow(state, skill, "Next 2 Assassin damage cards punish status", {
          remainingUses: 2,
          requireKindsAny: ["assassin_damage"],
          requireEnemyStatusesAny: ["burn", "poison", "slow", "mark"],
          damageBonus: 6,
        });
        segments.push("opens a status-finisher window");
        break;
      case "assassin_veil_step":
        h.applyGuard(state.hero, 6);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Next shadow card cost -1 Draw 1", {
          remainingUses: 1,
          requireKindsAny: ["shadow"],
          costReduction: 1,
          drawBonus: 1,
        });
        segments.push("gains 6 Guard");
        break;
      case "assassin_living_shade":
        h.applyGuard(state.hero, 6);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Assassin cards punish status this turn", {
          remainingUses: 99,
          requireKindsAny: ["assassin_damage"],
          requireEnemyStatusesAny: ["burn", "poison", "slow", "freeze", "mark"],
          damageBonus: 5,
        });
        segments.push("gains 6 Guard");
        break;
      case "assassin_prepared_ground":
        addSkillWindow(state, skill, "Next Trap/field card +5 Slow 1", {
          remainingUses: 1,
          requireKindsAny: ["trap_field"],
          damageBonus: 5,
          slow: 1,
        });
        segments.push("primes the next trap line");
        break;
      case "assassin_wire_snare":
        h.applyStatusToAllEnemies(state, "slow", 1);
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 6);
        segments.push("slows the line and weakens the next attack");
        break;
      case "assassin_night_maze":
        h.applyStatusToAllEnemies(state, "slow", 1);
        addSkillWindow(state, skill, "Next trap/shadow setup triggers twice", {
          remainingUses: 1,
          requireKindsAny: ["shadow_or_trap_setup"],
          duplicateOnResolve: true,
        });
        segments.push("turns the next setup into an echo");
        break;
      case "barbarian_bar_double_swing":
        if (targetEnemy) {
          const first = h.dealDamage(state, targetEnemy, 5, "physical" as DamageType);
          const second = targetEnemy.alive ? h.dealDamage(state, targetEnemy, 5, "physical" as DamageType) : 0;
          segments.push(`hits ${targetEnemy.name} for ${first + second} total`);
        }
        break;
      case "barbarian_bar_leap":
        h.applyGuard(state.hero, 8);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Next Attack +5", {
          remainingUses: 1,
          requireKindsAny: ["attack"],
          damageBonus: 5,
        });
        segments.push("gains 8 Guard");
        break;
      case "barbarian_relentless_assault":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 10, "physical" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        addSkillWindow(state, skill, "Next 2 Attacks +6", {
          remainingUses: 2,
          requireKindsAny: ["attack"],
          damageBonus: 6,
          guardOnSameEnemyCombo: 6,
        });
        break;
      case "barbarian_iron_discipline":
        h.applyGuard(state.hero, 7);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Next 2 Attacks ignore 3 Guard", {
          remainingUses: 2,
          requireKindsAny: ["attack"],
          ignoreGuard: 3,
        });
        segments.push("gains 7 Guard");
        break;
      case "barbarian_measured_blow":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 8 + (state.gainedGuardThisTurn ? 4 : 0), "physical" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "barbarian_perfect_form":
        h.applyGuard(state.hero, 8);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Attacks cost -1, +4, ignore 5", {
          remainingUses: 99,
          requireKindsAny: ["attack"],
          damageBonus: 4,
          costReduction: 1,
          ignoreGuard: 5,
        });
        segments.push("locks into perfect form");
        break;
      case "barbarian_bar_howl":
        state.enemies
          .filter((enemy) => enemy.alive && !enemy.templateId.endsWith("_boss"))
          .forEach((enemy) => {
            enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 4);
          });
        segments.push("shakes non-boss enemies");
        break;
      case "barbarian_bar_battle_cry":
        if (targetEnemy) {
          targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + 6);
          addSkillWindow(state, skill, `Next Attack vs ${targetEnemy.name} +5`, {
            remainingUses: 1,
            requireKindsAny: ["attack"],
            requireTargetEnemyId: targetEnemy.id,
            damageBonus: 5,
          });
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 5);
          segments.push(`calls ${targetEnemy.name} out`);
        }
        break;
      case "barbarian_warlords_command":
        addSkillWindow(state, skill, "Damaging cards +5 this turn", {
          remainingUses: 99,
          requireDamageCard: true,
          damageBonus: 5,
        });
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 5);
        state.enemies.forEach((enemy) => {
          if (enemy.alive) {
            enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 4);
          }
        });
        h.drawCards(state, 1);
        segments.push("rallies the whole line");
        break;
      case "druid_tempest_channel":
        addSkillWindow(state, skill, "Next 2 elemental cards +1 rider", {
          remainingUses: 2,
          requireKindsAny: ["elemental"],
          burn: 1,
          slow: 1,
        });
        segments.push("channels elemental force");
        break;
      case "druid_arc_root":
        h.applyGuard(state.hero, 6);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Next elemental damage card +5", {
          remainingUses: 1,
          requireKindsAny: ["elemental"],
          requireDamageCard: true,
          damageBonus: 5,
        });
        segments.push("gains 6 Guard");
        break;
      case "druid_cataclysm":
        h.dealDamageToAllEnemies(state, 8, "fire" as DamageType);
        addSkillWindow(state, skill, "Next 2 elemental cards +4 and extra rider", {
          remainingUses: 2,
          requireKindsAny: ["elemental"],
          damageBonus: 4,
          burn: 2,
          slow: 2,
        });
        segments.push("smashes the whole line");
        break;
      case "druid_stonebark":
        h.applyGuardToParty(state, 6, 6);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackSlow = Math.max(0, state.nextEnemyAttackSlow + 1);
        segments.push("fortifies the party");
        break;
      case "druid_predatory_lunge":
        addSkillWindow(state, skill, "Next shapeshift/melee card +6", {
          remainingUses: 1,
          requireKindsAny: ["shapeshift_melee"],
          damageBonus: 6,
          drawOnSlowedEnemyHit: 1,
        });
        segments.push("primes a feral lunge");
        break;
      case "druid_elder_shape":
        h.applyGuard(state.hero, 10);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Next 2 shapeshift/melee cards +6 Slow 1", {
          remainingUses: 2,
          requireKindsAny: ["shapeshift_melee"],
          damageBonus: 6,
          slow: 1,
        });
        segments.push("gains 10 Guard");
        break;
      case "druid_spirit_shepherd":
        h.healEntity(state.hero, 4);
        state.tempSummonPowerBonus = Math.max(0, state.tempSummonPowerBonus + 2);
        if (getActiveMinions(state).length > 0) {
          segments.push(reinforceAllActiveMinions(state, 0, 1));
        }
        segments.push("heals 4 and shepherds the summons");
        break;
      case "necromancer_grave_mend":
        h.healEntity(state.hero, 5);
        segments.push("heals 5");
        {
          const minionResult = extendFirstActiveMinion(state, 2, 1);
          if (minionResult) {
            segments.push(minionResult);
          }
        }
        break;
      case "necromancer_hex_pulse":
        addSkillWindow(state, skill, "Next curse/control card +1 status Draw 1", {
          remainingUses: 1,
          requireKindsAny: ["curse_control"],
          extraStatus: 1,
          drawBonus: 1,
        });
        segments.push("empowers the next curse");
        break;
      case "necromancer_black_benediction":
        state.enemies.forEach((enemy) => {
          if (enemy.alive) {
            enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 4);
          }
        });
        addSkillWindow(state, skill, "Next 2 curse/control cards +4 +1 status Draw 1", {
          remainingUses: 2,
          requireKindsAny: ["curse_control"],
          damageBonus: 4,
          extraStatus: 1,
          drawBonus: 1,
        });
        segments.push("darkens the whole line");
        break;
      case "necromancer_unholy_order":
        if (targetEnemy) {
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 4);
          state.summonFocusEnemyId = targetEnemy.id;
          state.summonFocusDamageBonus = Math.max(0, state.summonFocusDamageBonus + 4);
          segments.push(`orders every servant toward ${targetEnemy.name}`);
        }
        break;
      case "necromancer_bone_ward":
        h.applyGuard(state.hero, 7);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "If an enemy dies this turn, Draw 1", {
          remainingUses: 1,
          requireKindsAny: ["__never__"],
        });
        segments.push("gains 7 Guard");
        break;
      case "necromancer_grave_rupture":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 12, "magic" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        if (state.enemyDiedThisTurn) {
          h.dealDamageToAllEnemies(state, 8, "magic" as DamageType);
          h.applyStatusToAllEnemies(state, "poison", 2);
          segments.push("ruptures the whole grave line");
        }
        break;
      case "necromancer_corpse_pact":
        if (state.enemyDiedThisTurn || state.summonDiedThisTurn) {
          h.dealDamageToAllEnemies(state, 9, "magic" as DamageType);
          h.healEntity(state.hero, 4);
          segments.push("cashes in a corpse pact");
        } else {
          segments.push("finds no corpse to claim");
        }
        break;
      case "paladin_zealous_chorus":
        h.applyGuard(state.hero, 5);
        state.gainedGuardThisTurn = true;
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 3);
        addSkillWindow(state, skill, "Damaging cards +3 this turn", {
          remainingUses: 99,
          requireDamageCard: true,
          damageBonus: 3,
        });
        segments.push("raises a zealous chorus");
        break;
      case "paladin_crusaders_step":
        addSkillWindow(state, skill, "Next Attack +6", {
          remainingUses: 1,
          requireKindsAny: ["attack"],
          damageBonus: 6,
          gainGuardOnAttackingEnemyHit: 6,
        });
        segments.push("primes a crusader strike");
        break;
      case "paladin_judgment_march":
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 5);
        addSkillWindow(state, skill, "Next 2 Attack/Aura cards +4 damage/guard", {
          remainingUses: 2,
          requireKindsAny: ["attack", "aura"],
          damageBonus: 4,
          guardBonus: 4,
        });
        segments.push("starts a judgment march");
        break;
      case "paladin_aegis_prayer":
        segments.push(cleansePartyDebuff(state));
        h.applyGuard(state.hero, 8);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 5);
        segments.push("gains 8 Guard");
        break;
      case "paladin_shield_of_grace":
        h.healEntity(state.hero, 4);
        h.applyGuardToParty(state, 5, 5);
        state.gainedGuardThisTurn = true;
        segments.push("heals 4 and shields the party");
        break;
      case "paladin_bulwark_of_faith":
        segments.push(cleansePartyDebuff(state));
        h.applyGuardToParty(state, 12, 12);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 10);
        segments.push("raises a massive bulwark");
        break;
      case "paladin_righteous_verdict":
        if (targetEnemy) {
          addSkillWindow(state, skill, `Next 2 hits vs ${targetEnemy.name} +4`, {
            remainingUses: 2,
            requireDamageCard: true,
            requireTargetEnemyId: targetEnemy.id,
            damageBonus: 4,
            nextAttackPenaltyOnHit: 5,
            requireEnemyAttackingNextTurnForPenalty: true,
          });
          segments.push(`judges ${targetEnemy.name}`);
        }
        break;
      case "paladin_aura_surge":
        h.drawCards(state, 1);
        addSkillWindow(state, skill, "Next Aura/Attack +5 damage/guard", {
          remainingUses: 1,
          requireKindsAny: ["attack", "aura"],
          damageBonus: 5,
          guardBonus: 5,
        });
        segments.push("draws 1 and surges the next aura");
        break;
      case "paladin_fanatic_decree":
        addSkillWindow(state, skill, "Attack/Aura cards +5 this turn", {
          remainingUses: 99,
          requireKindsAny: ["attack", "aura"],
          damageBonus: 5,
        });
        addSkillWindow(state, skill, "Next 2 enemies hit deal 6 less", {
          remainingUses: 2,
          requireDamageCard: true,
          nextAttackPenaltyOnHit: 6,
        });
        segments.push("issues a fanatic decree");
        break;
      case "sorceress_bar_frozen_armor":
        h.applyGuard(state.hero, 10);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReductionHeroOnly = true;
        state.nextEnemyAttackSlow = Math.max(0, state.nextEnemyAttackSlow + 1);
        state.nextEnemyAttackFreeze = Math.max(0, state.nextEnemyAttackFreeze + 1);
        segments.push("raises frozen armor");
        break;
      case "sorceress_crippling_frost":
        addSkillWindow(state, skill, "Next Spell adds Slow 1 Freeze 1", {
          remainingUses: 1,
          requireKindsAny: ["spell"],
          requireDamageCard: true,
          slow: 1,
          freeze: 1,
        });
        segments.push("primes a crippling cast");
        break;
      case "sorceress_absolute_zero":
        h.applyGuard(state.hero, 10);
        state.gainedGuardThisTurn = true;
        h.applyStatusToAllEnemies(state, "slow", 1);
        h.applyStatusToAllEnemies(state, "freeze", 1);
        addSkillWindow(state, skill, "Next Spell Draw 1", {
          remainingUses: 1,
          requireKindsAny: ["spell"],
          drawBonus: 1,
        });
        segments.push("freezes the whole line");
        break;
      case "sorceress_bar_fire_ball":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 13, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 2);
          segments.push(`blasts ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "sorceress_kindle":
        state.pendingEnergyNextTurn = Math.max(0, state.pendingEnergyNextTurn + 1);
        addSkillWindow(state, skill, "Next Spell +6", {
          remainingUses: 1,
          requireKindsAny: ["spell"],
          damageBonus: 6,
        });
        segments.push("stores 1 Energy for next turn");
        break;
      case "sorceress_meteor_rain":
        h.dealDamageToAllEnemies(state, 9, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", 2);
        addSkillWindow(state, skill, "Next Spell +8", {
          remainingUses: 1,
          requireKindsAny: ["spell"],
          damageBonus: 8,
        });
        segments.push("rains meteors across the line");
        break;
      case "sorceress_bar_charged_bolt": {
        let total = 0;
        for (let index = 0; index < 3; index += 1) {
          const current = turns.getLivingEnemies(state);
          const choice = current[Math.floor((state.randomFn || Math.random)() * Math.max(1, current.length))];
          if (!choice) {
            break;
          }
          total += h.dealDamage(state, choice, 4, "lightning" as DamageType);
        }
        segments.push(`fires 3 charged bolts for ${total} total`);
        break;
      }
      case "sorceress_static_flow":
        state.hero.energy += 1;
        addSkillWindow(state, skill, "Next Spell draws if it splashes", {
          remainingUses: 1,
          requireKindsAny: ["spell"],
          drawOnMultiTargetDamage: 1,
        });
        segments.push("gains 1 Energy now");
        break;
      case "sorceress_storm_rhythm":
        state.hero.energy += 1;
        addSkillWindow(state, skill, "Next 3 Spells +4", {
          remainingUses: 3,
          requireKindsAny: ["spell"],
          damageBonus: 4,
          drawOnMultiTargetDamage: 1,
        });
        segments.push("gains 1 Energy now");
        break;
      default:
        handled = false;
        break;
    }

    if (!handled) {
      return false;
    }

    const prep = [h.getSkillPreparationSummary(state.skillModifiers), ...h.getSkillWindowSummaries(state)].filter(Boolean).join(", ");
    combatLog.appendLogEntry(state, combatLog.createLogEntry(state, {
      actor: "hero",
      actorName: "the Wanderer",
      action: "skill_use",
      actionId: skill.skillId,
      message: `${skill.name}: ${segments.filter(Boolean).join(", ")}${prep ? ` (${prep}).` : "."}`,
    }));
    if (targetEnemy?.id) {
      state.selectedEnemyId = targetEnemy.id;
    }
    turns.checkOutcome(state);
    return true;
  }

  function resolveAreaAttackSkill(
    state: CombatState,
    skill: CombatEquippedSkillState,
    targetEnemy: CombatEnemyState | null
  ): boolean {
    const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const scale = getSkillTierScale(skill);
    const modifiers: Partial<CombatSkillModifierState> = {};
    const segments: string[] = [];

    switch (skill.skillId) {
      case "sorceress_frost_nova": {
        const dmg = 2 + scale * 2;
        h.dealDamageToAllEnemies(state, dmg, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        segments.push(`blasts the line for ${dmg} cold`);
        modifiers.nextCardFreeze = scale + 1;
        modifiers.nextCardSlow = scale + 1;
        break;
      }
      case "sorceress_blizzard": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        segments.push(`rains ice across the line for ${dmg}`);
        modifiers.nextCardFreeze = scale + 1;
        break;
      }
      case "sorceress_frozen_orb": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        segments.push(`shatters across the line for ${dmg}`);
        modifiers.nextCardFreeze = scale;
        break;
      }
      case "sorceress_inferno": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", scale + 1);
        segments.push(`scorches the line for ${dmg}`);
        modifiers.nextCardBurn = scale + 1;
        break;
      }
      case "sorceress_static_field": {
        h.dealDamageToAllEnemies(state, 2 + scale, "lightning" as DamageType);
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push("destabilizes the whole line");
        modifiers.nextCardParalyze = scale + 1;
        break;
      }
      case "sorceress_thunder_storm": {
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push("rattles the line with thunder");
        modifiers.nextCardParalyze = scale + 2;
        modifiers.nextCardDamageBonus = scale;
        break;
      }
      case "sorceress_meteor": {
        const dmg = 6 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 3 + scale);
        }
        h.applyStatusToAllEnemies(state, "burn", scale);
        segments.push(`smashes ${targetEnemy?.name || "the line"} for ${dmg} and splashes fire`);
        modifiers.nextCardBurn = scale + 1;
        break;
      }
      case "barbarian_whirlwind": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "physical" as DamageType);
        segments.push(`cleaves the line for ${dmg}`);
        modifiers.nextCardDamageBonus = scale + 1;
        break;
      }
      case "barbarian_war_cry": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "physical" as DamageType);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        h.applyStatusToAllEnemies(state, "stun", 1);
        segments.push(`shakes the line for ${dmg}`);
        modifiers.nextCardDamageBonus = scale;
        break;
      }
      case "barbarian_grim_ward": {
        h.applyStatusToAllEnemies(state, "slow", scale + 2);
        h.applyStatusToAllEnemies(state, "stun", 1);
        h.applyGuard(state.hero, 3 + scale);
        segments.push("wards the field");
        modifiers.nextCardDamageBonus = scale;
        break;
      }
      case "barbarian_battle_command": {
        h.drawCards(state, 1);
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 3);
        segments.push("rallies the mercenary");
        modifiers.nextCardDamageBonus = scale + 1;
        modifiers.nextCardCostReduction = 1;
        break;
      }
      case "amazon_strafe": {
        const enemies = turns.getLivingEnemies(state);
        const dmg = 2 + scale;
        enemies.forEach((enemy: CombatEnemyState) => {
          h.dealDamage(state, enemy, dmg, "physical" as DamageType);
        });
        h.drawCards(state, 1);
        segments.push(`peppers ${enemies.length} targets for ${dmg} each`);
        break;
      }
      case "amazon_lightning_fury": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "lightning" as DamageType);
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push(`jolts the line for ${dmg}`);
        modifiers.nextCardParalyze = scale;
        break;
      }
      case "amazon_lightning_strike": {
        const dmg = 6 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "lightning" as DamageType);
          h.applyEnemyStatus(targetEnemy, "paralyze", scale + 2);
        }
        const secondary = h.getOtherLivingEnemy(state, targetEnemy?.id || "");
        if (secondary) {
          h.dealDamage(state, secondary, 2 + scale, "lightning" as DamageType);
          h.applyEnemyStatus(secondary, "paralyze", scale);
        }
        segments.push(`strikes ${targetEnemy?.name || "a target"} and arcs`);
        modifiers.nextCardParalyze = scale + 1;
        break;
      }
      case "amazon_freezing_arrow": {
        const dmg = 4 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "cold" as DamageType);
        }
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        segments.push(`pierces ${targetEnemy?.name || "a target"} and freezes the line`);
        modifiers.nextCardFreeze = scale;
        break;
      }
      case "assassin_phoenix_strike": {
        const dmg = 5 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "fire" as DamageType);
        }
        h.applyStatusToAllEnemies(state, "burn", scale + 1);
        segments.push(`ignites ${targetEnemy?.name || "a target"} and sets the line ablaze`);
        modifiers.nextCardBurn = scale + 2;
        break;
      }
      case "assassin_shock_web": {
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        h.applyStatusToAllEnemies(state, "paralyze", scale);
        segments.push("webs the entire line");
        modifiers.nextCardParalyze = scale;
        break;
      }
      case "druid_firestorm": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", scale + 1);
        segments.push(`rains fire across the line for ${dmg}`);
        modifiers.nextCardBurn = scale;
        break;
      }
      case "druid_armageddon": {
        const dmg = 3 + scale;
        h.dealDamageToAllEnemies(state, dmg, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", scale + 2);
        segments.push(`rains destruction for ${dmg}`);
        modifiers.nextCardBurn = scale + 1;
        break;
      }
      case "druid_hurricane": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        segments.push(`batters the line for ${dmg}`);
        modifiers.nextCardFreeze = scale;
        break;
      }
      case "druid_shock_wave": {
        const dmg = 4 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "physical" as DamageType);
        }
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        h.applyStatusToAllEnemies(state, "stun", 1);
        h.applyGuard(state.hero, scale);
        segments.push(`shakes ${targetEnemy?.name || "the field"}`);
        modifiers.nextCardDamageBonus = scale;
        break;
      }
      case "druid_volcano": {
        const dmg = 5 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 2 + scale);
          h.applyEnemyStatus(targetEnemy, "slow", scale + 1);
        }
        h.applyStatusToAllEnemies(state, "burn", scale);
        segments.push(`erupts on ${targetEnemy?.name || "the field"}`);
        modifiers.nextCardBurn = scale + 1;
        break;
      }
      case "necromancer_corpse_explosion": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", scale);
        segments.push(`detonates for ${dmg} across the line`);
        break;
      }
      case "necromancer_decrepify": {
        h.applyStatusToAllEnemies(state, "slow", scale + 2);
        h.applyStatusToAllEnemies(state, "freeze", scale + 1);
        segments.push("curses the whole enemy line");
        modifiers.nextCardCostReduction = 1;
        break;
      }
      case "necromancer_lower_resist": {
        h.applyStatusToAllEnemies(state, "burn", scale);
        h.applyStatusToAllEnemies(state, "poison", scale);
        h.applyStatusToAllEnemies(state, "paralyze", scale);
        segments.push("strips resistances");
        modifiers.nextCardDamageBonus = scale + 2;
        break;
      }
      case "necromancer_poison_nova": {
        const dmg = 1 + scale;
        h.dealDamageToAllEnemies(state, dmg, "poison" as DamageType);
        h.applyStatusToAllEnemies(state, "poison", scale + 2);
        segments.push(`poisons the line for ${dmg}`);
        modifiers.nextCardPoison = scale + 1;
        break;
      }
      case "necromancer_bone_prison": {
        if (targetEnemy) {
          h.applyEnemyStatus(targetEnemy, "freeze", scale + 2);
          h.applyEnemyStatus(targetEnemy, "slow", scale + 2);
        }
        h.applyGuard(state.hero, 4 + scale);
        segments.push("imprisons the target");
        modifiers.nextCardGuard = scale + 1;
        break;
      }
      case "paladin_conviction": {
        h.applyStatusToAllEnemies(state, "slow", scale + 1);
        h.applyStatusToAllEnemies(state, "paralyze", scale);
        segments.push("exposes the enemy line");
        modifiers.nextCardDamageBonus = scale + 2;
        break;
      }
      case "paladin_fist_of_the_heavens": {
        const dmg = 6 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "lightning" as DamageType);
        }
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push(`smites ${targetEnemy?.name || "a target"} and shocks the line`);
        modifiers.nextCardParalyze = scale;
        break;
      }
      case "paladin_holy_shock": {
        const dmg = 2 + scale;
        h.dealDamageToAllEnemies(state, dmg, "lightning" as DamageType);
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push(`jolts the line for ${dmg}`);
        modifiers.nextCardParalyze = scale;
        break;
      }
      case "paladin_meditation": {
        const healed = h.healParty(state, 3 + scale);
        h.drawCards(state, 1);
        segments.push(`heals ${healed.heroHealed + healed.mercenaryHealed} and draws 1`);
        modifiers.nextCardCostReduction = 1;
        break;
      }
      case "paladin_redemption": {
        h.healParty(state, 4 + scale);
        h.applyGuardToParty(state, 3 + scale);
        segments.push("redeems the party");
        modifiers.nextCardGuard = scale + 1;
        break;
      }
      case "paladin_salvation": {
        h.applyGuardToParty(state, 5 + scale);
        h.drawCards(state, 1);
        segments.push("fortifies the party");
        modifiers.nextCardGuard = scale + 1;
        break;
      }
      case "paladin_sanctuary": {
        const dmg = 4 + scale;
        if (targetEnemy) {
          h.dealDamage(state, targetEnemy, dmg, "magic" as DamageType);
          h.applyEnemyStatus(targetEnemy, "slow", scale + 1);
        }
        h.applyGuardToParty(state, 4 + scale);
        segments.push(`drives back ${targetEnemy?.name || "a foe"} and shelters the party`);
        modifiers.nextCardGuard = scale;
        break;
      }
      case "paladin_fanaticism": {
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 3);
        segments.push("inspires fanatical zeal");
        modifiers.nextCardDamageBonus = scale + 2;
        modifiers.nextCardCostReduction = 1;
        break;
      }
      case "sorceress_chilling_armor": {
        h.applyGuard(state.hero, 5 + scale);
        if (targetEnemy) {
          h.applyEnemyStatus(targetEnemy, "freeze", scale + 1);
        }
        segments.push("encases the caster in frost");
        modifiers.nextCardGuard = scale + 1;
        break;
      }
      case "sorceress_energy_shield": {
        h.applyGuard(state.hero, 6 + scale);
        h.healEntity(state.hero, 2 + scale);
        segments.push("raises an energy barrier");
        modifiers.nextCardGuard = scale + 2;
        break;
      }
      default:
        return false;
    }

    h.addSkillModifiers(state, modifiers);
    const prep = h.getSkillPreparationSummary(state.skillModifiers);
    const message = `${skill.name}: ${segments.join(", ")}${prep ? ` (${prep}).` : "."}`;
    combatLog.appendLogEntry(state, combatLog.createLogEntry(state, {
      actor: "hero",
      actorName: "the Wanderer",
      action: "skill_use",
      actionId: skill.skillId,
      message,
    }));
    if (targetEnemy?.id) {
      state.selectedEnemyId = targetEnemy.id;
    }
    turns.checkOutcome(state);
    return true;
  }

  function useSpecificActiveSkill(
    state: CombatState,
    skill: CombatEquippedSkillState,
    targetEnemy: CombatEnemyState | null
  ): { ok: boolean; message: string } | null {
    if (resolveStarterCoreSkill(state, skill, targetEnemy)) {
      return { ok: true, message: "Skill used." };
    }

    if (resolveAuthoredSkill(state, skill, targetEnemy)) {
      return { ok: true, message: "Skill used." };
    }

    // Handle summon skills via the summon effect builder
    if (skill.skillType === "summon") {
      if (resolveSummonSkill(state, skill)) {
        return { ok: true, message: "Skill used." };
      }
      return null;
    }

    // Handle area / hybrid / support skills
    if (resolveAreaAttackSkill(state, skill, targetEnemy)) {
      return { ok: true, message: "Skill used." };
    }

    return null;
  }

  runtimeWindow.__ROUGE_COMBAT_ENGINE_SKILLS = {
    useSpecificActiveSkill,
  };
})();
