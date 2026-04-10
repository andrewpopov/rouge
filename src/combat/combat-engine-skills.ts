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

  function enemyHasAnyStatus(
    enemy: CombatEnemyState | null,
    statuses: Array<"burn" | "poison" | "slow" | "freeze" | "stun" | "paralyze">
  ): boolean {
    if (!enemy) {
      return false;
    }
    return statuses.some((status) => Math.max(0, Number(enemy[status] || 0)) > 0);
  }

  function didPlayEarlierWithKind(state: CombatState, kind: string): boolean {
    const playedCardIds = Array.isArray(state.playedCardIdsThisTurn) ? state.playedCardIdsThisTurn : [];
    if (playedCardIds.length === 0) {
      return kind === "melee" ? Boolean(state.meleeUsed) : false;
    }
    const content = runtimeWindow.ROUGE_GAME_CONTENT || null;
    const helpers = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    return playedCardIds.some((cardId) => {
      if (!content || !helpers?.getCardDefinition || !helpers?.getCardSkillKinds) {
        return false;
      }
      const card = helpers.getCardDefinition(content, cardId);
      const kinds = helpers.getCardSkillKinds(cardId, card);
      return Boolean(kinds?.has?.(kind));
    });
  }

  function dealDamageIgnoringGuard(
    state: CombatState,
    enemy: CombatEnemyState | null,
    amount: number,
    ignoreGuard: number,
    damageType: DamageType
  ): number {
    if (!enemy) {
      return 0;
    }
    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    if (turns?.dealDamageIgnoringGuard) {
      return turns.dealDamageIgnoringGuard(state, enemy, amount, ignoreGuard, damageType);
    }
    return runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS.dealDamage(state, enemy, amount, damageType);
  }

  function getOrderedLivingEnemies(state: CombatState, preferredEnemy: CombatEnemyState | null): CombatEnemyState[] {
    const living = state.enemies.filter((enemy) => enemy.alive);
    if (!preferredEnemy) {
      return living;
    }
    return [preferredEnemy, ...living.filter((enemy) => enemy.id !== preferredEnemy.id)];
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
      case "amazon_magic_arrow": {
        if (targetEnemy) {
          const dealt = dealDamageIgnoringGuard(state, targetEnemy, 7, 4, "magic" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt} through Guard`);
        }
        const drew = h.drawCards(state, 1);
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "amazon_fire_arrow":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 5, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 2);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        addSkillWindow(state, skill, "Next ranged card Burn 1", {
          remainingUses: 1,
          requireKindsAny: ["ranged"],
          burn: 1,
        });
        segments.push("arms the next ranged card with fire");
        break;
      case "amazon_cold_arrow":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 6, "cold" as DamageType);
          h.applyEnemyStatus(targetEnemy, "slow", 2);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "amazon_multiple_shot": {
        const affected = h.dealDamageToAllEnemies(state, 4, "physical" as DamageType);
        h.applyStatusToAllEnemies(state, "slow", 1);
        segments.push(`fans out across ${affected} enemy${affected === 1 ? "" : "ies"}`);
        break;
      }
      case "amazon_exploding_arrow":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 7, "fire" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        h.applyStatusToAllEnemies(state, "burn", 2);
        segments.push("explodes across the line");
        break;
      case "amazon_guided_arrow": {
        if (targetEnemy) {
          const dealt = dealDamageIgnoringGuard(state, targetEnemy, 10, 6, "physical" as DamageType);
          segments.push(`tracks ${targetEnemy.name} for ${dealt} through Guard`);
        }
        const drew = h.drawCards(state, 1);
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "amazon_ice_arrow":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 7, "cold" as DamageType);
          h.applyEnemyStatus(targetEnemy, "freeze", 1);
          h.applyEnemyStatus(targetEnemy, "slow", 1);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "amazon_immolation_arrow":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 8, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 4);
          segments.push(`buries ${targetEnemy.name} in flame for ${dealt}`);
        }
        h.applyStatusToAllEnemies(state, "burn", 2);
        addSkillWindow(state, skill, "Next ranged card Burn 2", {
          remainingUses: 1,
          requireKindsAny: ["ranged"],
          burn: 2,
        });
        segments.push("kindles the next ranged card");
        break;
      case "amazon_jab":
        if (targetEnemy) {
          const first = h.dealDamage(state, targetEnemy, 5, "physical" as DamageType);
          const second = targetEnemy.alive ? h.dealDamage(state, targetEnemy, 4, "physical" as DamageType) : 0;
          segments.push(`jabs ${targetEnemy.name} for ${first + second} total`);
        }
        break;
      case "amazon_poison_javelin":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 4, "poison" as DamageType);
          h.applyEnemyStatus(targetEnemy, "poison", 4);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        h.applyStatusToAllEnemies(state, "poison", 2);
        segments.push("leaves a poison trail");
        break;
      case "amazon_power_strike":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 9, "lightning" as DamageType);
          h.applyEnemyStatus(targetEnemy, "paralyze", 1);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
          if (enemyWillAttackNextTurn(targetEnemy)) {
            h.applyGuard(state.hero, 4);
            state.gainedGuardThisTurn = true;
            segments.push("gains 4 Guard against the counter");
          }
        }
        break;
      case "amazon_impale":
        if (targetEnemy) {
          const primed = enemyHasAnyStatus(targetEnemy, ["slow", "paralyze"]);
          const dealt = dealDamageIgnoringGuard(state, targetEnemy, 11, 3, "physical" as DamageType);
          segments.push(`drives into ${targetEnemy.name} for ${dealt}`);
          if (primed && targetEnemy.alive) {
            const bonus = h.dealDamage(state, targetEnemy, 5, "physical" as DamageType);
            segments.push(`follows through for ${bonus}`);
          }
        }
        break;
      case "amazon_lightning_bolt": {
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 7, "lightning" as DamageType);
          h.applyEnemyStatus(targetEnemy, "paralyze", 1);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        const others = state.enemies.filter((enemy) => enemy.alive && enemy.id !== targetEnemy?.id);
        others.forEach((enemy) => {
          h.applyEnemyStatus(enemy, "paralyze", 1);
        });
        if (others.length > 0) {
          segments.push("the bolt crackles through the rest of the line");
        }
        break;
      }
      case "amazon_charged_strike": {
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 8, "lightning" as DamageType);
          h.applyEnemyStatus(targetEnemy, "paralyze", 2);
          segments.push(`bursts through ${targetEnemy.name} for ${dealt}`);
        }
        const others = state.enemies.filter((enemy) => enemy.alive && enemy.id !== targetEnemy?.id);
        let arcTotal = 0;
        others.forEach((enemy) => {
          arcTotal += h.dealDamage(state, enemy, 3, "lightning" as DamageType);
        });
        if (arcTotal > 0) {
          segments.push(`charged bolts arc for ${arcTotal} total`);
        }
        break;
      }
      case "amazon_plague_javelin":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 5, "poison" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        h.applyStatusToAllEnemies(state, "poison", 4);
        segments.push("floods the line with poison");
        break;
      case "amazon_fend": {
        const primed = enemyHasAnyStatus(targetEnemy, ["slow", "paralyze"]);
        const ordered = getOrderedLivingEnemies(state, targetEnemy);
        let total = 0;
        for (let index = 0; index < 3; index += 1) {
          let choice = ordered.length > 0 ? ordered[index % ordered.length] : null;
          if (!choice || !choice.alive) {
            choice = state.enemies.find((enemy) => enemy.alive) || null;
          }
          if (!choice) {
            break;
          }
          total += h.dealDamage(state, choice, 6, "physical" as DamageType);
        }
        segments.push(`sweeps for ${total} total`);
        if (primed) {
          state.pendingEnergyNextTurn = Math.max(0, state.pendingEnergyNextTurn + 1);
          segments.push("banks 1 Energy for next turn");
        }
        break;
      }
      case "amazon_inner_sight":
        if (targetEnemy) {
          h.applyEnemyStatus(targetEnemy, "slow", 1);
          addSkillWindow(state, skill, `Next 2 hits vs ${targetEnemy.name} +3 ignore 3`, {
            remainingUses: 2,
            requireKindsAny: ["attack"],
            requireSingleTargetDamage: true,
            requireTargetEnemyId: targetEnemy.id,
            damageBonus: 3,
            ignoreGuard: 3,
          });
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 6);
          segments.push(`reveals ${targetEnemy.name}'s opening`);
        }
        break;
      case "amazon_slow_missiles": {
        h.applyStatusToAllEnemies(state, "slow", 2);
        h.applyGuard(state.hero, 5);
        state.gainedGuardThisTurn = true;
        const rangedThreats = state.enemies.filter((enemy) => enemy.alive && ["ranged", "support"].includes(enemy.role));
        if (rangedThreats.length > 0) {
          rangedThreats.forEach((enemy) => {
            enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 6);
          });
          segments.push(`slows ${rangedThreats.length} ranged threat${rangedThreats.length === 1 ? "" : "s"}`);
        } else {
          state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 4);
          state.nextEnemyAttackReductionHeroOnly = false;
          segments.push("blunts the next enemy attack");
        }
        segments.push("gains 5 Guard");
        break;
      }
      case "assassin_tiger_strike":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 7, "physical" as DamageType);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        addSkillWindow(state, skill, "Next Assassin melee +3", {
          remainingUses: 1,
          requireKindsAll: ["assassin", "melee"],
          damageBonus: 3,
        });
        segments.push("primes the next Assassin melee card");
        break;
      case "assassin_dragon_talon":
        if (targetEnemy) {
          let total = 0;
          for (let index = 0; index < 3; index += 1) {
            if (!targetEnemy.alive) {
              break;
            }
            total += h.dealDamage(state, targetEnemy, 5, "physical" as DamageType);
          }
          segments.push(`kicks ${targetEnemy.name} for ${total} total`);
        }
        break;
      case "assassin_fists_of_fire":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 8, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 3);
          segments.push(`sears ${targetEnemy.name} for ${dealt}`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "assassin_dragon_claw":
        if (targetEnemy) {
          const primed = enemyHasAnyStatus(targetEnemy, ["burn", "poison", "paralyze"]);
          let total = 0;
          for (let index = 0; index < 2; index += 1) {
            if (!targetEnemy.alive) {
              break;
            }
            total += h.dealDamage(state, targetEnemy, 7, "physical" as DamageType);
            if (primed && targetEnemy.alive) {
              total += h.dealDamage(state, targetEnemy, 3, "physical" as DamageType);
            }
          }
          segments.push(`rakes ${targetEnemy.name} for ${total} total`);
        }
        break;
      case "assassin_cobra_strike":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 10, "physical" as DamageType);
          segments.push(`strikes ${targetEnemy.name} for ${dealt}`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "assassin_claws_of_thunder":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 17, "lightning" as DamageType);
          h.applyEnemyStatus(targetEnemy, "paralyze", 1);
          segments.push(`electrocutes ${targetEnemy.name} for ${dealt}`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "assassin_dragon_tail": {
        const playedMeleeEarlier = didPlayEarlierWithKind(state, "melee");
        const affected = h.dealDamageToAllEnemies(state, 12, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", 3);
        if (playedMeleeEarlier) {
          h.dealDamageToAllEnemies(state, 5, "fire" as DamageType);
        }
        segments.push(`erupts across ${affected} enemy${affected === 1 ? "" : "ies"}`);
        if (playedMeleeEarlier) {
          segments.push("the earlier melee combo detonates");
        }
        break;
      }
      case "assassin_blades_of_ice":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 15, "cold" as DamageType);
          h.applyEnemyStatus(targetEnemy, "freeze", 1);
          h.applyEnemyStatus(targetEnemy, "slow", 1);
          segments.push(`freezes ${targetEnemy.name} for ${dealt}`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "assassin_dragon_flight":
        if (targetEnemy) {
          const playedMeleeEarlier = didPlayEarlierWithKind(state, "melee");
          const dealt = h.dealDamage(state, targetEnemy, 20, "physical" as DamageType);
          segments.push(`dives onto ${targetEnemy.name} for ${dealt}`);
          if (playedMeleeEarlier && targetEnemy.alive) {
            const bonus = h.dealDamage(state, targetEnemy, 10, "physical" as DamageType);
            segments.push(`the earlier combo adds ${bonus}`);
          }
        }
        break;
      case "assassin_psychic_hammer":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 4, "magic" as DamageType);
          h.applyEnemyStatus(targetEnemy, "paralyze", 1);
          state.mercenary.markedEnemyId = targetEnemy.id;
          state.mercenary.markBonus = Math.max(state.mercenary.markBonus, 8);
          segments.push(`hammers ${targetEnemy.name} for ${dealt}`);
          segments.push(`marks ${targetEnemy.name} for +8 mercenary damage`);
        }
        break;
      case "assassin_burst_of_speed":
        h.applyGuard(state.hero, 7);
        state.gainedGuardThisTurn = true;
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 10);
        {
          const drew = h.drawCards(state, 2);
          segments.push(`gains 7 Guard and draws ${drew}`);
        }
        break;
      case "assassin_cloak_of_shadows":
        h.applyGuard(state.hero, 7);
        state.gainedGuardThisTurn = true;
        {
          const drew = h.drawCards(state, 1);
          segments.push(`gains 7 Guard and draws ${drew}`);
        }
        break;
      case "assassin_fade":
        h.applyGuardToParty(state, 24, 24);
        state.gainedGuardThisTurn = true;
        h.healEntity(state.hero, 8);
        h.applyStatusToAllEnemies(state, "slow", 1);
        {
          const drew = h.drawCards(state, 1);
          segments.push(`wraps the party in 24 Guard, heals 8, and draws ${drew}`);
        }
        break;
      case "assassin_mind_blast": {
        const nonBossEnemies = state.enemies.filter((enemy) => enemy.alive && !enemy.templateId.endsWith("_boss"));
        nonBossEnemies.forEach((enemy) => {
          h.applyEnemyStatus(enemy, "stun", 1);
        });
        state.enemies.forEach((enemy) => {
          if (enemy.alive) {
            enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 3);
          }
        });
        h.applyGuard(state.hero, 6);
        state.gainedGuardThisTurn = true;
        segments.push(`stuns ${nonBossEnemies.length} non-boss foe${nonBossEnemies.length === 1 ? "" : "s"}`);
        segments.push("all enemies deal 3 less damage next turn");
        segments.push("gains 6 Guard");
        break;
      }
      case "assassin_venom":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 6, "poison" as DamageType);
          h.applyEnemyStatus(targetEnemy, "poison", 4);
          segments.push(`poisons ${targetEnemy.name} for ${dealt}`);
        }
        addSkillWindow(state, skill, "Next melee +4", {
          remainingUses: 1,
          requireKindsAny: ["melee"],
          damageBonus: 4,
        });
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "assassin_fire_blast":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 6, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 5);
          segments.push(`blasts ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "assassin_blade_sentinel": {
        const affected = h.dealDamageToAllEnemies(state, 4, "physical" as DamageType);
        const result = turns.summonMinion(state, h.createSummonSkillEffect(state, "assassin_blade_sentinel", 5, 0, 3));
        segments.push(`slashes across ${affected} enemy${affected === 1 ? "" : "ies"}`);
        segments.push(result);
        break;
      }
      case "assassin_charged_bolt_sentry": {
        const affected = h.dealDamageToAllEnemies(state, 4, "lightning" as DamageType);
        const result = turns.summonMinion(state, h.createSummonSkillEffect(state, "assassin_charged_bolt_sentry", 5, 1, 3));
        segments.push(`zaps ${affected} enemy${affected === 1 ? "" : "ies"}`);
        segments.push(result);
        break;
      }
      case "assassin_wake_of_fire": {
        const affected = h.dealDamageToAllEnemies(state, 6, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", 3);
        const result = turns.summonMinion(state, h.createSummonSkillEffect(state, "assassin_wake_of_fire", 7, 4, 4));
        segments.push(`scorches ${affected} enemy${affected === 1 ? "" : "ies"}`);
        segments.push(result);
        break;
      }
      case "assassin_blade_fury": {
        let total = 0;
        for (let index = 0; index < 3; index += 1) {
          const living = turns.getLivingEnemies(state);
          const choice = living[Math.floor((state.randomFn || Math.random)() * Math.max(1, living.length))] || living[0] || null;
          if (!choice) {
            break;
          }
          total += h.dealDamage(state, choice, 4, "physical" as DamageType);
        }
        segments.push(`fans spinning blades for ${total} total`);
        break;
      }
      case "assassin_blade_shield": {
        const affected = h.dealDamageToAllEnemies(state, 6, "physical" as DamageType);
        h.applyStatusToAllEnemies(state, "slow", 1);
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 8);
        const drew = h.drawCards(state, 1);
        segments.push(`cuts through ${affected} enemy${affected === 1 ? "" : "ies"}`);
        segments.push(`draws ${drew}`);
        break;
      }
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
      case "paladin_sacrifice":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 15, "physical" as DamageType);
          segments.push(`sacrifices for ${dealt} on ${targetEnemy.name}`);
        }
        state.hero.life = Math.max(1, state.hero.life - 3);
        state.lowestHeroLife = Math.min(state.lowestHeroLife, state.hero.life);
        segments.push("loses 3 Life");
        break;
      case "paladin_smite":
        if (targetEnemy) {
          const dealt = dealDamageIgnoringGuard(state, targetEnemy, 6, 3, "physical" as DamageType);
          h.applyEnemyStatus(targetEnemy, "stun", 1);
          segments.push(`smashes ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "paladin_holy_bolt": {
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 8, "magic" as DamageType);
          segments.push(`pierces ${targetEnemy.name} for ${dealt}`);
        }
        const healed = h.healParty(state, 3);
        if (healed.heroHealed + healed.mercenaryHealed > 0) {
          segments.push(`restores ${healed.heroHealed + healed.mercenaryHealed} Life to allies`);
        }
        break;
      }
      case "paladin_charge":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 12, "physical" as DamageType);
          segments.push(`charges ${targetEnemy.name} for ${dealt}`);
        }
        addSkillWindow(state, skill, "Next Attack +3", {
          remainingUses: 1,
          requireKindsAny: ["attack"],
          damageBonus: 3,
        });
        segments.push("primes the next attack");
        break;
      case "paladin_zeal":
        if (targetEnemy) {
          let total = 0;
          for (const amount of [5, 4, 3]) {
            if (!targetEnemy.alive) {
              break;
            }
            total += h.dealDamage(state, targetEnemy, amount, "physical" as DamageType);
          }
          segments.push(`lashes ${targetEnemy.name} for ${total} total`);
        }
        break;
      case "paladin_blessed_hammer": {
        const affected = h.dealDamageToAllEnemies(state, 9, "magic" as DamageType);
        segments.push(`hammers ${affected} enemy${affected === 1 ? "" : "ies"} across the line`);
        break;
      }
      case "paladin_vengeance":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 13, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 3);
          h.applyEnemyStatus(targetEnemy, "slow", 1);
          h.applyEnemyStatus(targetEnemy, "paralyze", 1);
          segments.push(`unleashes elemental vengeance on ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "paladin_conversion":
        if (targetEnemy) {
          const attacking = enemyWillAttackNextTurn(targetEnemy);
          const dealt = h.dealDamage(state, targetEnemy, 10, "physical" as DamageType);
          h.healEntity(state.hero, 5);
          h.applyGuard(state.hero, 8);
          state.gainedGuardThisTurn = true;
          segments.push(`converts momentum into ${dealt} on ${targetEnemy.name}`);
          if (attacking && targetEnemy.alive) {
            const bonus = h.dealDamage(state, targetEnemy, 5, "physical" as DamageType);
            segments.push(`punishes the telegraphed strike for ${bonus}`);
          }
        }
        break;
      case "paladin_holy_shield": {
        h.applyGuardToParty(state, 18, 18);
        state.gainedGuardThisTurn = true;
        const affected = h.dealDamageToAllEnemies(state, 8, "magic" as DamageType);
        const drew = h.drawCards(state, 2);
        segments.push(`fortifies the party and blasts ${affected} enemy${affected === 1 ? "" : "ies"}`);
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_prayer": {
        const healed = h.healParty(state, 5);
        h.applyGuard(state.hero, 4);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        segments.push(`heals ${healed.heroHealed + healed.mercenaryHealed} and gains 4 Guard`);
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_resist_fire": {
        h.applyGuard(state.hero, 10);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 3);
        state.nextEnemyAttackReductionHeroOnly = false;
        const drew = h.drawCards(state, 1);
        segments.push("gains 10 Guard and cools the next attack");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_defiance": {
        h.applyGuardToParty(state, 12, 12);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        segments.push("raises 12 Guard for the party");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_resist_cold": {
        h.applyGuard(state.hero, 12);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 5);
        state.nextEnemyAttackReductionHeroOnly = false;
        const drew = h.drawCards(state, 1);
        segments.push("gains 12 Guard and blunts the next attack by 5");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_cleansing": {
        segments.push(cleansePartyDebuff(state));
        h.healEntity(state.hero, 5);
        h.applyGuard(state.hero, 6);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        segments.push("heals 5 and gains 6 Guard");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_resist_lightning": {
        h.applyGuard(state.hero, 10);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 4);
        state.nextEnemyAttackReductionHeroOnly = false;
        const drew = h.drawCards(state, 1);
        segments.push("gains 10 Guard and grounds the next strike");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_vigor": {
        h.applyGuard(state.hero, 4);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        addSkillWindow(state, skill, "Next card cost -1", {
          remainingUses: 1,
          costReduction: 1,
        });
        segments.push("gains 4 Guard and quickens the next play");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_might":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 6, "physical" as DamageType);
          h.applyEnemyStatus(targetEnemy, "slow", 1);
          state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 8);
          segments.push(`pressures ${targetEnemy.name} for ${dealt}`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "paladin_holy_fire":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 9, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 4);
          state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 6);
          segments.push(`brands ${targetEnemy.name} for ${dealt}`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "paladin_thorns":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 5, "physical" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 2);
          segments.push(`lashes ${targetEnemy.name} for ${dealt}`);
        }
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 2);
        state.nextEnemyAttackReductionHeroOnly = true;
        segments.push("turns the next attack back on the enemy");
        break;
      case "paladin_blessed_aim": {
        h.applyGuard(state.hero, 6);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        addSkillWindow(state, skill, "Next 2 Attacks +4", {
          remainingUses: 2,
          requireKindsAny: ["attack"],
          damageBonus: 4,
        });
        segments.push("gains 6 Guard and steadies the next 2 attacks");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_concentration": {
        h.applyGuard(state.hero, 6);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        addSkillWindow(state, skill, "Next Aura/Attack +5", {
          remainingUses: 1,
          requireKindsAny: ["attack", "aura"],
          damageBonus: 5,
        });
        segments.push("gains 6 Guard and focuses the next aura");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "paladin_holy_freeze": {
        const affected = h.dealDamageToAllEnemies(state, 8, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "freeze", 1);
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 6);
        segments.push(`freezes ${affected} enemy${affected === 1 ? "" : "ies"} across the line`);
        break;
      }
      case "barbarian_bash":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 14, "physical" as DamageType);
          segments.push(`bashes ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "barbarian_double_swing":
        if (targetEnemy) {
          const first = h.dealDamage(state, targetEnemy, 6, "physical" as DamageType);
          const second = targetEnemy.alive ? h.dealDamage(state, targetEnemy, 5, "physical" as DamageType) : 0;
          segments.push(`swings for ${first + second} total on ${targetEnemy.name}`);
        }
        break;
      case "barbarian_leap":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 8, "physical" as DamageType);
          segments.push(`lands on ${targetEnemy.name} for ${dealt}`);
        }
        h.applyGuard(state.hero, 6);
        state.gainedGuardThisTurn = true;
        segments.push("gains 6 Guard");
        break;
      case "barbarian_double_throw":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 7, "physical" as DamageType);
          segments.push(`buries one weapon in ${targetEnemy.name} for ${dealt}`);
        }
        {
          const other = state.enemies.find((enemy) => enemy.alive && enemy.id !== targetEnemy?.id) || null;
          if (other) {
            const dealt = h.dealDamage(state, other, 7, "physical" as DamageType);
            segments.push(`the second throw hits ${other.name} for ${dealt}`);
          }
        }
        break;
      case "barbarian_stun":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 10, "physical" as DamageType);
          h.applyEnemyStatus(targetEnemy, "stun", 1);
          segments.push(`stuns ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "barbarian_concentrate":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 14, "physical" as DamageType);
          segments.push(`concentrates ${dealt} into ${targetEnemy.name}`);
        }
        h.healEntity(state.hero, 4);
        h.applyGuard(state.hero, 12);
        state.gainedGuardThisTurn = true;
        segments.push("heals 4 and gains 12 Guard");
        break;
      case "barbarian_leap_attack": {
        const affected = h.dealDamageToAllEnemies(state, 9, "physical" as DamageType);
        segments.push(`crashes into ${affected} enemy${affected === 1 ? "" : "ies"}`);
        break;
      }
      case "barbarian_frenzy":
        if (targetEnemy) {
          const first = h.dealDamage(state, targetEnemy, 10, "physical" as DamageType);
          const second = targetEnemy.alive ? h.dealDamage(state, targetEnemy, 9, "physical" as DamageType) : 0;
          segments.push(`frenzies ${targetEnemy.name} for ${first + second} total`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "barbarian_berserk":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 28, "magic" as DamageType);
          segments.push(`goes berserk on ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "barbarian_find_potion": {
        h.healEntity(state.hero, 5);
        h.applyGuard(state.hero, 4);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        segments.push("heals 5 and gains 4 Guard");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "barbarian_howl": {
        h.applyStatusToAllEnemies(state, "slow", 1);
        h.applyGuard(state.hero, 5);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        segments.push("howls across the line");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "barbarian_shout": {
        h.applyStatusToAllEnemies(state, "slow", 1);
        h.applyGuardToParty(state, 10, 10);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        segments.push("shouts the party into formation");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "barbarian_taunt":
        if (targetEnemy) {
          addSkillWindow(state, skill, `Next Attack vs ${targetEnemy.name} +6`, {
            remainingUses: 1,
            requireKindsAny: ["attack"],
            requireTargetEnemyId: targetEnemy.id,
            damageBonus: 6,
          });
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 6);
          segments.push(`taunts ${targetEnemy.name} into an opening`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "barbarian_find_item": {
        h.healEntity(state.hero, 6);
        h.applyGuard(state.hero, 6);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 2);
        segments.push("stabilizes with 6 healing and 6 Guard");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "barbarian_battle_cry": {
        state.enemies.forEach((enemy) => {
          if (enemy.alive) {
            enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 3);
          }
        });
        h.applyGuard(state.hero, 5);
        state.gainedGuardThisTurn = true;
        addSkillWindow(state, skill, "Next Attack +4", {
          remainingUses: 1,
          requireKindsAny: ["attack"],
          damageBonus: 4,
        });
        const drew = h.drawCards(state, 1);
        segments.push("cries out across the line");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "barbarian_battle_orders": {
        h.healEntity(state.hero, 6);
        h.applyStatusToAllEnemies(state, "slow", 1);
        h.applyGuardToParty(state, 22, 22);
        state.gainedGuardThisTurn = true;
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 16);
        const drew = h.drawCards(state, 1);
        segments.push("issues battle orders to the whole party");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
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
      case "druid_molten_boulder":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 11, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 3);
          targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + 4);
          segments.push(`rolls through ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "druid_cyclone_armor": {
        h.applyGuard(state.hero, 8);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReductionHeroOnly = true;
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 4);
        const drew = h.drawCards(state, 1);
        segments.push("raises cyclone armor");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "druid_werewolf":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 11, "physical" as DamageType);
          h.healEntity(state.hero, 5);
          segments.push(`tears into ${targetEnemy.name} for ${dealt} and heals 5`);
        }
        break;
      case "druid_werebear":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 9, "physical" as DamageType);
          h.applyEnemyStatus(targetEnemy, "slow", 1);
          h.applyGuardToParty(state, 6, 6);
          state.gainedGuardThisTurn = true;
          const drew = h.drawCards(state, 1);
          segments.push(`crushes ${targetEnemy.name} for ${dealt}`);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "druid_feral_rage":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 8, "physical" as DamageType);
          h.healEntity(state.hero, 4);
          addSkillWindow(state, skill, "Next Shapeshift/melee +3", {
            remainingUses: 1,
            requireKindsAny: ["shapeshift_melee"],
            damageBonus: 3,
          });
          segments.push(`slashes ${targetEnemy.name} for ${dealt} and heals 4`);
        }
        break;
      case "druid_maul":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 16, "physical" as DamageType);
          h.applyEnemyStatus(targetEnemy, "stun", 1);
          h.applyGuard(state.hero, 6);
          state.gainedGuardThisTurn = true;
          segments.push(`mauls ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "druid_fire_claws":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 9, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 3);
          h.applyGuard(state.hero, 5);
          state.gainedGuardThisTurn = true;
          segments.push(`scorches ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "druid_rabies":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 7, "poison" as DamageType);
          h.applyEnemyStatus(targetEnemy, "poison", 5);
          segments.push(`infects ${targetEnemy.name} for ${dealt}`);
        }
        state.enemies
          .filter((enemy) => enemy.alive && enemy.id !== targetEnemy?.id)
          .forEach((enemy) => {
            h.applyEnemyStatus(enemy, "poison", 5);
          });
        segments.push("spreads rabies through the line");
        break;
      case "druid_hunger":
        if (targetEnemy) {
          const slowed = Math.max(0, targetEnemy.slow || 0) > 0;
          const dealt = h.dealDamage(state, targetEnemy, 18, "physical" as DamageType);
          h.healEntity(state.hero, 10);
          segments.push(`feeds on ${targetEnemy.name} for ${dealt} and heals 10`);
          if (slowed && targetEnemy.alive) {
            const bonus = h.dealDamage(state, targetEnemy, 6, "physical" as DamageType);
            segments.push(`the slowed prey takes ${bonus} more`);
          }
        }
        break;
      case "druid_fury":
        if (targetEnemy) {
          const ordered = getOrderedLivingEnemies(state, targetEnemy);
          const strikes = [12, 11, 10];
          let total = 0;
          for (let index = 0; index < strikes.length; index += 1) {
            let choice = ordered[index % Math.max(1, ordered.length)] || null;
            if (!choice || !choice.alive) {
              choice = state.enemies.find((enemy) => enemy.alive) || null;
            }
            if (!choice) {
              break;
            }
            total += h.dealDamage(state, choice, strikes[index], "physical" as DamageType);
            h.applyEnemyStatus(choice, "slow", 1);
          }
          const drew = h.drawCards(state, 1);
          segments.push(`unleashes fury for ${total} total`);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
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
      case "necromancer_amplify_damage":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 2, "magic" as DamageType);
          addSkillWindow(state, skill, `Next 2 attacks vs ${targetEnemy.name} +4`, {
            remainingUses: 2,
            requireKindsAny: ["attack"],
            requireTargetEnemyId: targetEnemy.id,
            damageBonus: 4,
          });
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 8);
          const drew = h.drawCards(state, 1);
          segments.push(`curses ${targetEnemy.name} for ${dealt}`);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "necromancer_dim_vision":
        if (targetEnemy) {
          const penalty = ["ranged", "support"].includes(targetEnemy.role) ? 7 : 5;
          targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + penalty);
          h.applyEnemyStatus(targetEnemy, "slow", 1);
          h.applyGuard(state.hero, 6);
          state.gainedGuardThisTurn = true;
          segments.push(`dims ${targetEnemy.name}'s next attack by ${penalty}`);
        }
        break;
      case "necromancer_weaken": {
        state.enemies.forEach((enemy) => {
          if (enemy.alive) {
            enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 3);
          }
        });
        h.applyGuard(state.hero, 5);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        segments.push("weakens the whole line");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "necromancer_iron_maiden":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 5, "magic" as DamageType);
          targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + 2);
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 8);
          segments.push(`brands ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "necromancer_terror": {
        state.enemies
          .filter((enemy) => enemy.alive && !enemy.templateId.endsWith("_boss"))
          .forEach((enemy) => {
            enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 4);
          });
        h.applyGuard(state.hero, 7);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        segments.push("sends non-boss enemies reeling");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "necromancer_confuse":
        if (targetEnemy) {
          targetEnemy.confuse = Math.max(0, targetEnemy.confuse + 1);
          h.applyGuard(state.hero, 6);
          state.gainedGuardThisTurn = true;
          const drew = h.drawCards(state, 1);
          segments.push(`${targetEnemy.name} may strike another enemy`);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "necromancer_life_tap": {
        h.healEntity(state.hero, 6);
        h.applyGuard(state.hero, 5);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        segments.push("steals life for the Wanderer");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "necromancer_attract":
        if (targetEnemy) {
          h.applyEnemyStatus(targetEnemy, "slow", 1);
          h.applyGuard(state.hero, 5);
          state.gainedGuardThisTurn = true;
          state.summonFocusEnemyId = targetEnemy.id;
          state.summonFocusDamageBonus = Math.max(0, state.summonFocusDamageBonus + 4);
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 4);
          segments.push(`${targetEnemy.name} is exposed to your army`);
        }
        break;
      case "necromancer_bone_armor":
        h.applyGuard(state.hero, 12);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReductionHeroOnly = true;
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 4);
        {
          const drew = h.drawCards(state, 1);
          segments.push("raises a ring of bone");
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "necromancer_teeth": {
        let total = 0;
        for (let index = 0; index < 3; index += 1) {
          const current = turns.getLivingEnemies(state);
          const choice = current[Math.floor((state.randomFn || Math.random)() * Math.max(1, current.length))];
          if (!choice) {
            break;
          }
          total += h.dealDamage(state, choice, 3, "magic" as DamageType);
        }
        segments.push(`fans teeth for ${total} total`);
        break;
      }
      case "necromancer_poison_dagger":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 6, "poison" as DamageType);
          h.applyEnemyStatus(targetEnemy, "poison", 4);
          const drew = h.drawCards(state, 1);
          segments.push(`stabs ${targetEnemy.name} for ${dealt}`);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "necromancer_bone_wall":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 4, "magic" as DamageType);
          targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + 5);
          h.applyGuard(state.hero, 6);
          state.gainedGuardThisTurn = true;
          segments.push(`walls off ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "necromancer_bone_spear":
        if (targetEnemy) {
          const poisoned = Math.max(0, targetEnemy.poison || 0) > 0;
          const dealt = h.dealDamage(state, targetEnemy, 10, "magic" as DamageType);
          segments.push(`spears ${targetEnemy.name} for ${dealt}`);
          if (poisoned && targetEnemy.alive) {
            const bonus = h.dealDamage(state, targetEnemy, 6, "magic" as DamageType);
            segments.push(`poison cracks for ${bonus} more`);
          }
        }
        {
          const others = state.enemies.filter((enemy) => enemy.alive && enemy.id !== targetEnemy?.id);
          let arcTotal = 0;
          others.forEach((enemy) => {
            arcTotal += h.dealDamage(state, enemy, 4, "magic" as DamageType);
          });
          if (arcTotal > 0) {
            segments.push(`bone shards pierce through for ${arcTotal} total`);
          }
        }
        break;
      case "necromancer_bone_spirit":
        if (targetEnemy) {
          const dealt = dealDamageIgnoringGuard(state, targetEnemy, 18, 4, "magic" as DamageType);
          const drew = h.drawCards(state, 1);
          segments.push(`hunts ${targetEnemy.name} for ${dealt} through Guard`);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
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
      case "sorceress_frozen_armor":
        h.applyGuard(state.hero, 8);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReductionHeroOnly = true;
        state.nextEnemyAttackSlow = Math.max(0, state.nextEnemyAttackSlow + 1);
        state.nextEnemyAttackFreeze = Math.max(0, state.nextEnemyAttackFreeze + 1);
        segments.push("raises frozen armor");
        break;
      case "sorceress_ice_bolt":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 6, "cold" as DamageType);
          h.applyEnemyStatus(targetEnemy, "slow", 2);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "sorceress_ice_blast":
        if (targetEnemy) {
          const alreadySlowed = Math.max(0, targetEnemy.slow || 0) > 0;
          const dealt = h.dealDamage(state, targetEnemy, 12, "cold" as DamageType);
          h.applyEnemyStatus(targetEnemy, "freeze", 1);
          h.applyEnemyStatus(targetEnemy, "slow", 2);
          segments.push(`blasts ${targetEnemy.name} for ${dealt}`);
          if (alreadySlowed && targetEnemy.alive) {
            const bonus = h.dealDamage(state, targetEnemy, 6, "cold" as DamageType);
            segments.push(`the slowed target takes ${bonus} more`);
          }
        }
        break;
      case "sorceress_shiver_armor": {
        h.applyGuard(state.hero, 10);
        state.gainedGuardThisTurn = true;
        state.nextEnemyAttackReductionHeroOnly = true;
        state.nextEnemyAttackSlow = Math.max(0, state.nextEnemyAttackSlow + 2);
        state.nextEnemyAttackFreeze = Math.max(0, state.nextEnemyAttackFreeze + 1);
        const drew = h.drawCards(state, 1);
        segments.push("raises shiver armor");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
      case "sorceress_fire_bolt":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 8, "fire" as DamageType);
          h.applyEnemyStatus(targetEnemy, "burn", 2);
          segments.push(`hits ${targetEnemy.name} for ${dealt}`);
        }
        break;
      case "sorceress_fireball":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 10, "fire" as DamageType);
          segments.push(`explodes on ${targetEnemy.name} for ${dealt}`);
        }
        h.applyStatusToAllEnemies(state, "burn", 2);
        segments.push("splashes fire across the line");
        break;
      case "sorceress_enchant":
        h.applyGuard(state.hero, 4);
        state.gainedGuardThisTurn = true;
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + 6);
        addSkillWindow(state, skill, "Next 2 damage cards +4 Burn 1", {
          remainingUses: 2,
          requireDamageCard: true,
          damageBonus: 4,
          burn: 1,
        });
        segments.push("enchants the next 2 damaging plays");
        break;
      case "sorceress_charged_bolt": {
        let total = 0;
        for (let index = 0; index < 3; index += 1) {
          const current = turns.getLivingEnemies(state);
          const choice = current[Math.floor((state.randomFn || Math.random)() * Math.max(1, current.length))];
          if (!choice) {
            break;
          }
          total += h.dealDamage(state, choice, 3, "lightning" as DamageType);
        }
        segments.push(`fires 3 charged bolts for ${total} total`);
        break;
      }
      case "sorceress_telekinesis":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 4, "magic" as DamageType);
          targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + 5);
          segments.push(`batters ${targetEnemy.name} for ${dealt}`);
          segments.push(`${targetEnemy.name}'s next attack weakens`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "sorceress_lightning":
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 14, "lightning" as DamageType);
          h.applyEnemyStatus(targetEnemy, "paralyze", 2);
          segments.push(`blasts ${targetEnemy.name} for ${dealt}`);
        }
        {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        break;
      case "sorceress_teleport": {
        h.applyGuardToParty(state, 8, 8);
        state.gainedGuardThisTurn = true;
        const drew = h.drawCards(state, 1);
        addSkillWindow(state, skill, "Next Spell costs -1", {
          remainingUses: 1,
          requireKindsAny: ["spell"],
          costReduction: 1,
        });
        segments.push("teleports the party into position");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        break;
      }
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
      case "sorceress_glacial_spike": {
        const splash = h.dealDamageToAllEnemies(state, 4, "cold" as DamageType);
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 5, "cold" as DamageType);
          segments.push(`shatters on ${targetEnemy.name} for ${dealt}`);
        }
        h.applyStatusToAllEnemies(state, "freeze", 1);
        h.applyStatusToAllEnemies(state, "slow", 1);
        segments.push(`freezes ${splash} enemy${splash === 1 ? "" : "ies"} in the blast`);
        modifiers.nextCardFreeze = 1;
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
      case "sorceress_blaze": {
        h.dealDamageToAllEnemies(state, 4, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", 3);
        segments.push("leaves blazing ground across the line");
        modifiers.nextCardBurn = 1;
        break;
      }
      case "sorceress_fire_wall": {
        h.dealDamageToAllEnemies(state, 6, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", 4);
        segments.push("raises a wall of fire across the line");
        modifiers.nextCardBurn = 2;
        break;
      }
      case "sorceress_static_field": {
        h.dealDamageToAllEnemies(state, 2 + scale, "lightning" as DamageType);
        h.applyStatusToAllEnemies(state, "paralyze", scale + 1);
        segments.push("destabilizes the whole line");
        modifiers.nextCardParalyze = scale + 1;
        break;
      }
      case "sorceress_nova": {
        h.dealDamageToAllEnemies(state, 5, "lightning" as DamageType);
        h.applyStatusToAllEnemies(state, "paralyze", 1);
        segments.push("detonates a lightning nova");
        if (didPlayEarlierWithKind(state, "spell")) {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew} off the earlier spell`);
          }
        }
        modifiers.nextCardParalyze = 1;
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
      case "sorceress_chain_lightning": {
        let hits = 0;
        if (targetEnemy) {
          const dealt = h.dealDamage(state, targetEnemy, 8, "lightning" as DamageType);
          h.applyEnemyStatus(targetEnemy, "paralyze", 1);
          hits += 1;
          segments.push(`arcs into ${targetEnemy.name} for ${dealt}`);
        }
        const others = state.enemies.filter((enemy) => enemy.alive && enemy.id !== targetEnemy?.id).slice(0, 2);
        for (const enemy of others) {
          const dealt = h.dealDamage(state, enemy, 4, "lightning" as DamageType);
          h.applyEnemyStatus(enemy, "paralyze", 1);
          hits += 1;
          segments.push(`chains into ${enemy.name} for ${dealt}`);
        }
        if (hits > 1) {
          const drew = h.drawCards(state, 1);
          if (drew > 0) {
            segments.push(`draws ${drew}`);
          }
        }
        modifiers.nextCardParalyze = 1;
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
      case "druid_arctic_blast": {
        h.dealDamageToAllEnemies(state, 6, "cold" as DamageType);
        h.applyStatusToAllEnemies(state, "slow", 1);
        segments.push("lashes the line with arctic wind");
        modifiers.nextCardSlow = 1;
        break;
      }
      case "druid_fissure": {
        h.dealDamageToAllEnemies(state, 6, "fire" as DamageType);
        h.applyStatusToAllEnemies(state, "burn", 2);
        segments.push("opens a burning fissure across the line");
        modifiers.nextCardBurn = 1;
        break;
      }
      case "druid_twister": {
        h.dealDamageToAllEnemies(state, 5, "physical" as DamageType);
        h.applyStatusToAllEnemies(state, "slow", 1);
        const drew = h.drawCards(state, 1);
        segments.push("twisters rake across the line");
        if (drew > 0) {
          segments.push(`draws ${drew}`);
        }
        modifiers.nextCardSlow = 1;
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
      case "druid_tornado": {
        let bonusHits = 0;
        state.enemies
          .filter((enemy) => enemy.alive)
          .forEach((enemy) => {
            h.dealDamage(state, enemy, 12, "physical" as DamageType);
            if (enemy.slow > 0 && enemy.alive) {
              bonusHits += h.dealDamage(state, enemy, 4, "physical" as DamageType);
            }
          });
        segments.push("tears through the line with a tornado");
        if (bonusHits > 0) {
          segments.push(`the slowed enemies take ${bonusHits} more total`);
        }
        modifiers.nextCardDamageBonus = 1;
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
      case "necromancer_poison_explosion": {
        h.dealDamageToAllEnemies(state, 4, "poison" as DamageType);
        h.applyStatusToAllEnemies(state, "poison", 3);
        segments.push("bursts poison across the line");
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
