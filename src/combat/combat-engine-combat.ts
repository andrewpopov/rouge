/* eslint-disable max-lines, max-depth */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const h = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
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
  const {
    applyGuard, drawCards, healEntity, dealDamage,
    addSkillModifiers,
    getSelectedEnemy, getSkillTierScale,
    createEmptySkillModifiers, createHero,
    createMercenary, createEnemy, applyRandomAffixes, createDeck,
    describeIntent, getCardDefinition, addDamageTypeRider,
    applyEnemySkillRider, getSkillPreparationSummary,
    applyPassiveSkill,
    addSkillWindow, getCardSkillKinds,
    getMatchingSkillWindows, getSkillWindowModifierPatch, getSkillWindowSummaries,
  } = h;
  const { parseInteger } = runtimeWindow.ROUGE_UTILS;
  const { resolveCardEffect, summarizeCardEffect } = runtimeWindow.__ROUGE_CARD_EFFECTS;
  const { COMBAT_PHASE } = runtimeWindow.ROUGE_CONSTANTS;
  const {
    getLivingEnemies, getFirstLivingEnemyId, getActiveMinions, startPlayerTurn,
    endTurn, usePotion, meleeStrike, checkOutcome,
  } = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
  function createCombatSkill(entry: CombatSkillLoadoutEntry): CombatEquippedSkillState {
    return {
      slotKey: entry.slotKey,
      skillId: entry.skill.id,
      name: entry.skill.name,
      family: entry.skill.family,
      slot: entry.skill.slot,
      tier: entry.skill.tier,
      cost: entry.skill.cost,
      cooldown: entry.skill.cooldown,
      remainingCooldown: 0,
      chargeCount: Math.max(0, entry.skill.chargeCount || 0),
      chargesRemaining: Math.max(0, entry.skill.chargeCount || 0),
      oncePerBattle: Boolean(entry.skill.oncePerBattle),
      usedThisBattle: false,
      summary: entry.skill.summary,
      exactText: entry.skill.exactText,
      active: entry.skill.active !== false,
      skillType: entry.skill.skillType || "attack",
      damageType: entry.skill.damageType || "none",
    };
  }

  function snapshotEnemyBoard(state: CombatState) {
    return Object.fromEntries(state.enemies.map((enemy) => [
      enemy.id,
      {
        life: enemy.life,
        guard: enemy.guard,
        slow: enemy.slow,
        freeze: enemy.freeze,
        stun: enemy.stun,
        burn: enemy.burn,
        poison: enemy.poison,
        paralyze: enemy.paralyze,
      },
    ]));
  }

  function getDamagedEnemies(state: CombatState, before: Record<string, { life: number; guard: number }>) {
    return state.enemies.filter((enemy) => {
      const snapshot = before[enemy.id];
      if (!snapshot) {
        return false;
      }
      return enemy.life < snapshot.life || enemy.guard < snapshot.guard;
    });
  }

  function previousCardKinds(content: GameContent, cardIds: string[]) {
    const kinds = new Set<string>();
    cardIds.forEach((cardId) => {
      const definition = getCardDefinition(content, cardId);
      getCardSkillKinds(cardId, definition).forEach((kind: string) => kinds.add(kind));
    });
    return kinds;
  }

  function didPlayEarlier(
    content: GameContent,
    cardIds: string[],
    predicate: (cardId: string, kinds: Set<string>) => boolean
  ) {
    return cardIds.some((cardId) => {
      const definition = getCardDefinition(content, cardId);
      return predicate(cardId, getCardSkillKinds(cardId, definition));
    });
  }

  function targetHasAnySnapshotStatus(
    snapshot: { burn?: number; poison?: number; slow?: number; freeze?: number; stun?: number; paralyze?: number } | null | undefined,
    statuses: Array<"burn" | "poison" | "slow" | "freeze" | "stun" | "paralyze">
  ) {
    if (!snapshot) {
      return false;
    }
    return statuses.some((status) => Math.max(0, Number(snapshot[status] || 0)) > 0);
  }

  function dealConditionalDamageToEnemy(state: CombatState, enemy: CombatEnemyState | null, amount: number, segments: string[], reason: string) {
    if (!enemy || !enemy.alive || amount <= 0) {
      return;
    }
    const dealt = dealDamage(state, enemy, amount);
    segments.push(`${reason} for ${dealt}`);
  }

  function dealConditionalDamageToEnemies(
    state: CombatState,
    enemies: CombatEnemyState[],
    amount: number,
    segments: string[],
    reason: string
  ) {
    const living = enemies.filter((enemy) => enemy.alive);
    if (living.length === 0 || amount <= 0) {
      return;
    }
    let total = 0;
    living.forEach((enemy) => {
      total += dealDamage(state, enemy, amount);
    });
    segments.push(`${reason} for ${total} total`);
  }

  function drawConditionalCards(state: CombatState, amount: number, segments: string[], reason: string) {
    if (amount <= 0) {
      return;
    }
    const drew = drawCards(state, amount);
    if (drew > 0) {
      segments.push(`${reason} and draws ${drew}`);
    }
  }

  function addCardWindow(
    state: CombatState,
    patch: Partial<CombatSkillWindowState> & Pick<CombatSkillWindowState, "id" | "skillId" | "summary">,
    segments: string[]
  ) {
    addSkillWindow(state, patch);
    segments.push(patch.summary);
  }

  function extendActiveTraps(state: CombatState, amount: number, segments: string[]) {
    if (amount <= 0) {
      return;
    }
    const traps = getActiveMinions(state).filter((minion) => minion.invulnerable && !minion.persistent);
    if (traps.length === 0) {
      return;
    }
    traps.forEach((trap) => {
      trap.remainingTurns = Math.max(1, trap.remainingTurns + amount);
    });
    segments.push(`extends active traps by ${amount} turn${amount === 1 ? "" : "s"}`);
  }

  const CARD_SPECIFIC_BEHAVIOR_IDS = new Set<string>([
    "amazon_amazonian_guard",
    "amazon_battle_focus",
    "amazon_fury_of_the_hunt",
    "amazon_huntress_mark",
    "amazon_impale",
    "amazon_inner_calm",
    "amazon_javelin_rush",
    "amazon_precision",
    "amazon_storm_javelin",
    "amazon_thunder_volley",
    "amazon_war_pike",
    "assassin_death_blossom",
    "assassin_dragon_claw",
    "assassin_dragon_flight",
    "assassin_dragon_tail",
    "assassin_fatal_cascade",
    "assassin_natalyas_guard",
    "assassin_shadow_shroud",
    "assassin_shadow_storm",
    "assassin_shadow_veil",
    "assassin_tiger_strike",
    "assassin_trap_mastery",
    "assassin_venom",
    "assassin_venom_strike",
    "assassin_weapon_block",
    "barbarian_ancient_vow",
    "barbarian_axe_mastery",
    "barbarian_battle_cry",
    "barbarian_bulwark",
    "barbarian_fury_howl",
    "barbarian_fury_mastery",
    "barbarian_increased_speed",
    "barbarian_increased_stamina",
    "barbarian_raging_cleave",
    "barbarian_taunt",
    "barbarian_war_stance",
    "barbarian_warlord_shout",
    "druid_carrion_vine",
    "druid_elemental_pack",
    "druid_feral_rage",
    "druid_force_of_nature",
    "druid_gale_force",
    "druid_hunger",
    "druid_natures_balance",
    "druid_natures_guardian",
    "druid_natures_wrath",
    "druid_pack_howl",
    "druid_primal_fury",
    "druid_renewal",
    "druid_savage_pounce",
    "druid_tornado",
    "druid_wild_convergence",
    "druid_wild_stampede",
    "druid_dire_wolf",
    "necromancer_army_of_dead",
    "necromancer_attract",
    "necromancer_bone_offering",
    "necromancer_bone_prison",
    "necromancer_bone_spear",
    "necromancer_confuse",
    "necromancer_corpse_explosion",
    "necromancer_corpse_harvest",
    "necromancer_corpse_lance",
    "necromancer_dark_ward",
    "necromancer_death_pact",
    "necromancer_desecrate",
    "necromancer_golem_mastery",
    "necromancer_lower_resist",
    "necromancer_plague_wind",
    "necromancer_poison_nova",
    "necromancer_skeleton_mastery",
    "necromancer_soul_harvest",
    "necromancer_summon_resist",
    "paladin_blessed_aim",
    "paladin_blessed_hammer_storm",
    "paladin_blessed_ward",
    "paladin_charge",
    "paladin_concentration",
    "paladin_conversion",
    "paladin_crusade",
    "paladin_divine_command",
    "paladin_divine_shield",
    "paladin_holy_strike",
    "paladin_redemption",
    "paladin_resist_cold",
    "paladin_righteous_guard",
    "paladin_righteous_wrath",
    "paladin_vigor",
    "sorceress_arcane_focus",
    "sorceress_arcane_ward",
    "sorceress_chilling_armor",
    "sorceress_combustion",
    "sorceress_conflagration",
    "sorceress_elemental_mastery",
    "sorceress_enchant",
    "sorceress_frost_bolt",
    "sorceress_ice_blast",
    "sorceress_mana_shield",
    "sorceress_nova",
    "sorceress_overcharge",
    "sorceress_shiver_armor",
    "sorceress_spell_surge",
    "sorceress_tempest",
    "sorceress_telekinesis",
    "sorceress_thunder_storm",
  ]);

  function addNextEnemyAttackReduction(
    state: CombatState,
    amount: number,
    heroOnly: boolean,
    segments: string[],
    summary: string,
    extra: { slow?: number; freeze?: number } = {}
  ) {
    state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + Math.max(0, amount));
    state.nextEnemyAttackReductionHeroOnly = heroOnly;
    state.nextEnemyAttackSlow = Math.max(0, state.nextEnemyAttackSlow + Math.max(0, extra.slow || 0));
    state.nextEnemyAttackFreeze = Math.max(0, state.nextEnemyAttackFreeze + Math.max(0, extra.freeze || 0));
    segments.push(summary);
  }

  function getAliveSummons(state: CombatState) {
    return getActiveMinions(state).filter((minion) => minion.alive);
  }

  function reinforceSummon(minion: CombatMinionState, amount: number, extraTurns = 0) {
    if (!minion || (!minion.alive && extraTurns <= 0) || (amount <= 0 && extraTurns <= 0)) {
      return;
    }
    if (amount > 0) {
      minion.power += amount;
      const hpGain = amount * 2;
      minion.maxLife += hpGain;
      minion.life = Math.min(minion.maxLife, minion.life + hpGain);
    }
    if (!minion.persistent && extraTurns > 0) {
      minion.remainingTurns = Math.max(1, minion.remainingTurns + extraTurns);
    }
  }

  function reinforceSummons(
    state: CombatState,
    amount: number,
    extraTurns = 0,
    predicate: (minion: CombatMinionState) => boolean = () => true
  ) {
    const summons = getAliveSummons(state).filter(predicate);
    summons.forEach((minion) => reinforceSummon(minion, amount, extraTurns));
    return summons;
  }

  function boostLatestSummon(state: CombatState, templateId: string, amount: number, extraTurns = 0) {
    const summon = [...getAliveSummons(state)].reverse().find((minion) => minion.templateId === templateId) || null;
    if (!summon) {
      return null;
    }
    reinforceSummon(summon, amount, extraTurns);
    return summon;
  }

  function enemyHasSnapshotStatusAtLeast(
    snapshot: { burn?: number; poison?: number; slow?: number; freeze?: number; stun?: number; paralyze?: number } | null | undefined,
    statuses: Array<"burn" | "poison" | "slow" | "freeze" | "stun" | "paralyze">,
    minimum = 1
  ) {
    if (!snapshot) {
      return false;
    }
    return statuses.some((status) => Math.max(0, Number(snapshot[status] || 0)) >= minimum);
  }

  function dealRandomSummonStrikes(state: CombatState, amount: number, segments: string[], reason: string) {
    const summons = getAliveSummons(state);
    const livingEnemies = getLivingEnemies(state);
    if (summons.length === 0 || livingEnemies.length === 0 || amount <= 0) {
      return;
    }
    let total = 0;
    summons.forEach(() => {
      const enemyIndex = Math.min(
        livingEnemies.length - 1,
        Math.max(0, Math.floor((typeof state.randomFn === "function" ? state.randomFn() : Math.random()) * livingEnemies.length))
      );
      const enemy = livingEnemies[enemyIndex] || livingEnemies[0];
      total += dealDamage(state, enemy, amount);
    });
    segments.push(`${reason} for ${total} total`);
  }

  function applyPassiveAuraGuardBonus(state: CombatState, card: CardDefinition, segments: string[]) {
    const hasGuardEffect = card.effects.some((effect) => effect.kind === "gain_guard_self" || effect.kind === "gain_guard_party");
    if (hasGuardEffect) {
      return;
    }
    const kinds = getCardSkillKinds(card.id, card);
    let guardBonus = 0;
    if (state.activePlayerAuras.includes("assassin_combo_mastery") && kinds.has("assassin") && kinds.has("melee")) {
      guardBonus += 2;
    }
    if (state.activePlayerAuras.includes("barbarian_combat_mastery") && kinds.has("attack")) {
      guardBonus += 3;
    }
    if (state.activePlayerAuras.includes("barbarian_battle_command") && kinds.has("warcry")) {
      guardBonus += 4;
    }
    if (state.activePlayerAuras.includes("paladin_combat_mastery") && kinds.has("attack")) {
      guardBonus += 3;
    }
    if (state.activePlayerAuras.includes("paladin_aura_mastery") && kinds.has("aura_card")) {
      guardBonus += 4;
    }
    if (guardBonus > 0) {
      applyGuard(state.hero, guardBonus);
      state.gainedGuardThisTurn = true;
      segments.push(`mastery grants ${guardBonus} Guard`);
    }
  }

  // ── Data-driven card behavior executor ──────────────────────────────────────
  const cardBehaviorData = runtimeWindow.__ROUGE_CARD_BEHAVIOR_DATA;

  function executeCardBehavior(
    behavior: Record<string, unknown>,
    state: CombatState,
    targetEnemy: CombatEnemyState | null,
    targetBefore: Record<string, number> | null,
    enemyBefore: Record<string, Record<string, number>>,
    segments: string[],
    context: { playedMeleeEarlier: boolean; playedSpellEarlier: boolean; card: CardDefinition }
  ): boolean {
    let handled = false;

    // Card window
    const window = behavior.window as { summary: string; remainingUses: number; damageBonus?: number; guardBonus?: number; costReduction?: number; requireKindsAny?: string[]; requireKindsAll?: string[] } | undefined;
    if (window) {
      addCardWindow(state, {
        id: `${context.card.id}_window`,
        skillId: context.card.id,
        ...window,
      }, segments);
      handled = true;
    }

    // Conditional single-target damage
    const condDmg = behavior.conditionalDamage as { amount: number; reason: string; condition: Record<string, unknown> } | undefined;
    if (condDmg && checkCondition(condDmg.condition, state, targetBefore, context)) {
      dealConditionalDamageToEnemy(state, targetEnemy, condDmg.amount, segments, condDmg.reason);
      handled = true;
    }

    // Conditional AoE damage
    const condAoe = behavior.conditionalAoeDamage as { amount: number; reason: string; condition: Record<string, unknown> } | undefined;
    if (condAoe && checkCondition(condAoe.condition, state, targetBefore, context)) {
      dealConditionalDamageToEnemies(state, getLivingEnemies(state), condAoe.amount, segments, condAoe.reason);
      handled = true;
    }

    // Status-filtered AoE damage
    const sfAoe = behavior.statusFilteredAoeDamage as { amount: number; reason: string; statusFilter: string[]; statusMinimum?: number; useSnapshot?: boolean } | undefined;
    if (sfAoe) {
      const minimum = sfAoe.statusMinimum || 1;
      const candidates = getLivingEnemies(state).filter((enemy: CombatEnemyState) => {
        const source = sfAoe.useSnapshot ? (enemyBefore[enemy.id] || {}) : enemy;
        return sfAoe.statusFilter.some((status: string) => Math.max(0, Number((source as Record<string, unknown>)[status] || 0)) >= minimum);
      });
      candidates.forEach((enemy: CombatEnemyState) => {
        dealConditionalDamageToEnemy(state, enemy, sfAoe.amount, segments, `${enemy.name} ${sfAoe.reason}`);
      });
      handled = true;
    }

    // Attack reduction
    const atkRed = behavior.attackReduction as { amount: number; heroOnly: boolean; summary: string; slow?: number; freeze?: number } | undefined;
    if (atkRed) {
      addNextEnemyAttackReduction(state, atkRed.amount, atkRed.heroOnly, segments, atkRed.summary, { slow: atkRed.slow, freeze: atkRed.freeze });
      handled = true;
    }

    // State modifications
    const mods = behavior.stateMods as Record<string, number> | undefined;
    if (mods) {
      if (mods.tempHeroDamageBonus) {
        state.tempHeroDamageBonus = Math.max(0, state.tempHeroDamageBonus + mods.tempHeroDamageBonus);
        if (mods.tempMercenaryDamageBonus) {
          state.tempMercenaryDamageBonus = Math.max(0, state.tempMercenaryDamageBonus + mods.tempMercenaryDamageBonus);
        }
        segments.push((cardBehaviorData.STATE_MOD_MESSAGES.tempHeroDamageBonus || "").replace("{N}", String(mods.tempHeroDamageBonus)));
      } else if (mods.tempSummonPowerBonus) {
        state.tempSummonPowerBonus = Math.max(0, state.tempSummonPowerBonus + mods.tempSummonPowerBonus);
        segments.push((cardBehaviorData.STATE_MOD_MESSAGES.tempSummonPowerBonus || "").replace("{N}", String(mods.tempSummonPowerBonus)));
      } else if (mods.tempTrapPowerBonus) {
        state.tempTrapPowerBonus = Math.max(0, state.tempTrapPowerBonus + mods.tempTrapPowerBonus);
        segments.push((cardBehaviorData.STATE_MOD_MESSAGES.tempTrapPowerBonus || "").replace("{N}", String(mods.tempTrapPowerBonus)));
      }
      handled = true;
    }

    // Conditional draw
    const condDraw = behavior.conditionalDraw as { amount: number; reason: string; condition: Record<string, unknown> } | undefined;
    if (condDraw && checkCondition(condDraw.condition, state, targetBefore, context)) {
      drawConditionalCards(state, condDraw.amount, segments, condDraw.reason);
      handled = true;
    }

    return handled;
  }

  function checkCondition(
    condition: Record<string, unknown>,
    state: CombatState,
    targetBefore: Record<string, number> | null,
    context: { playedMeleeEarlier: boolean; playedSpellEarlier: boolean }
  ): boolean {
    const type = condition.type as string;
    const statuses = condition.statuses as string[] | undefined;
    if (type === "targetHasStatus") {
      return targetHasAnySnapshotStatus(targetBefore, (statuses || []) as Array<"burn" | "poison" | "slow" | "freeze" | "stun" | "paralyze">);
    }
    if (type === "targetHasStatusAtLeast") {
      return enemyHasSnapshotStatusAtLeast(targetBefore, (statuses || []) as Array<"burn" | "poison" | "slow" | "freeze" | "stun" | "paralyze">);
    }
    if (type === "playedMeleeEarlier") {
      return context.playedMeleeEarlier;
    }
    if (type === "playedSpellEarlier") {
      return context.playedSpellEarlier;
    }
    if (type === "enemyDiedLastTurn") {
      return Boolean(state.enemyDiedLastTurn);
    }
    if (type === "heroGuardMin") {
      return state.hero.guard >= (condition.min as number || 0);
    }
    if (type === "enemyWillAttack") {
      return enemyWillAttackNextTurn(state.enemies?.find((e: CombatEnemyState) => e.id === state.selectedEnemyId) || null);
    }
    return false;
  }

  function applyCardSpecificEffects(params: {
    state: CombatState;
    content: GameContent;
    card: CardDefinition;
    targetEnemy: CombatEnemyState | null;
    enemyBefore: Record<string, { life: number; guard: number; slow: number; freeze: number; burn: number; poison: number; stun: number; paralyze: number }>;
    previousCardIds: string[];
    auraAlreadyActive: boolean;
    segments: string[];
  }) {
    const { state, content, card, targetEnemy, enemyBefore, previousCardIds, auraAlreadyActive, segments } = params;
    const targetBefore = targetEnemy ? enemyBefore[targetEnemy.id] : null;
    const kindsEarlier = previousCardKinds(content, previousCardIds);
    const playedSpellEarlier = kindsEarlier.has("spell");
    const playedFireSpellEarlier = didPlayEarlier(content, previousCardIds, (cardId, kinds) => {
      return kinds.has("spell") && /(fire|inferno|meteor|blaze|hydra|combust|conflagration|warmth|wall)/.test(cardId);
    });
    const playedMeleeEarlier = didPlayEarlier(content, previousCardIds, (_cardId, kinds) => kinds.has("melee"));
    const summonCount = getAliveSummons(state).length;

    // ── Data-driven behavior lookup ──
    const behavior = cardBehaviorData?.CARD_BEHAVIORS?.[card.id];
    if (behavior && executeCardBehavior(
      behavior, state, targetEnemy, targetBefore, enemyBefore, segments,
      { playedMeleeEarlier, playedSpellEarlier, card }
    )) {
      return;
    }

    // ── Remaining complex cases ──
    switch (card.id) {
      // amazon_amazonian_guard, amazon_inner_calm, amazon_impale, amazon_precision → data-driven
      case "amazon_battle_focus": {
        const pressuredEnemies = getLivingEnemies(state).filter((enemy) => !enemy.templateId.endsWith("_boss"));
        pressuredEnemies.forEach((enemy) => {
          enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 3);
        });
        if (pressuredEnemies.length > 0) {
          segments.push("all non-boss enemies deal 3 less damage next turn");
        }
        break;
      }
      // amazon_javelin_rush, amazon_storm_javelin, amazon_thunder_volley → data-driven
      case "amazon_huntress_mark":
        if (targetEnemy?.alive) {
          addCardWindow(state, {
            id: "amazon_huntress_mark_window",
            skillId: card.id,
            summary: `marks ${targetEnemy.name} for +4 damage on the next 2 hits`,
            remainingUses: 2,
            requireDamageCard: true,
            requireTargetEnemyId: targetEnemy.id,
            damageBonus: 4,
          }, segments);
        }
        break;
      // amazon_fury_of_the_hunt → data-driven
      case "amazon_war_pike":
        if (targetBefore && Math.max(0, targetBefore.slow) > 0 && targetEnemy?.alive) {
          targetEnemy.stun = 1;
          segments.push(`${targetEnemy.name} is stunned`);
        }
        break;
      // assassin_tiger_strike, assassin_venom, assassin_weapon_block, assassin_shadow_shroud → data-driven
      // assassin_dragon_tail, assassin_dragon_claw, assassin_shadow_veil → data-driven
      case "assassin_venom_strike":
        if (enemyHasSnapshotStatusAtLeast(targetBefore, ["burn", "paralyze"]) && targetEnemy?.alive) {
          targetEnemy.poison = Math.max(0, targetEnemy.poison + 3);
          segments.push(`${targetEnemy.name} takes 3 more Poison`);
        }
        break;
      // assassin_dragon_flight, sorceress_enchant → data-driven
      case "sorceress_telekinesis":
        if (targetEnemy?.alive) {
          targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + 5);
          segments.push(`${targetEnemy.name} deals 5 less damage next turn`);
        }
        break;
      // sorceress_nova, sorceress_arcane_focus, sorceress_ice_blast → data-driven
      case "sorceress_shiver_armor":
        state.nextEnemyAttackReductionHeroOnly = true;
        state.nextEnemyAttackSlow = Math.max(0, state.nextEnemyAttackSlow + 2);
        segments.push("the next enemy that attacks you gains 2 Slow");
        break;
      case "sorceress_combustion": {
        const burningEnemies = getLivingEnemies(state).filter((enemy) => enemy.burn > 0);
        burningEnemies.forEach((enemy) => {
          dealConditionalDamageToEnemy(state, enemy, Math.min(5, enemy.burn) * 3, segments, `${enemy.name} combusts`);
        });
        break;
      }
      // sorceress_thunder_storm → data-driven
      case "sorceress_mana_shield":
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 5);
        state.nextEnemyAttackReductionHeroOnly = true;
        segments.push("the next enemy attack against you deals 5 less damage");
        break;
      case "sorceress_frost_bolt":
        if (playedFireSpellEarlier && targetEnemy?.alive) {
          targetEnemy.slow = Math.max(0, targetEnemy.slow - 1);
          targetEnemy.freeze = Math.max(0, targetEnemy.freeze + 1);
          segments.push(`${targetEnemy.name} freezes instead of only slowing`);
        }
        break;
      // sorceress_spell_surge, sorceress_overcharge → data-driven
      // sorceress_chilling_armor → data-driven
      case "sorceress_arcane_ward":
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 6);
        state.nextEnemyAttackReductionHeroOnly = false;
        segments.push("the next enemy attack against you or your mercenary deals 6 less damage");
        break;
      // sorceress_elemental_mastery, sorceress_conflagration → data-driven
      // sorceress_tempest → data-driven
      case "assassin_trap_mastery":
        if (!auraAlreadyActive) {
          extendActiveTraps(state, 1, segments);
        }
        break;
      // assassin_natalyas_guard → data-driven
      // assassin_fatal_cascade, assassin_death_blossom, assassin_shadow_storm → data-driven
      // barbarian_axe_mastery, barbarian_increased_speed → data-driven
      case "barbarian_taunt":
        if (targetEnemy?.alive) {
          addCardWindow(state, {
            id: "barbarian_taunt_window",
            skillId: card.id,
            summary: `the next hit on ${targetEnemy.name} deals +6 damage`,
            remainingUses: 1,
            requireDamageCard: true,
            requireTargetEnemyId: targetEnemy.id,
            damageBonus: 6,
          }, segments);
        }
        break;
      case "barbarian_battle_cry":
        getLivingEnemies(state).forEach((enemy) => {
          enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 3);
        });
        segments.push("all enemies deal 3 less damage next turn");
        addCardWindow(state, {
          id: "barbarian_battle_cry_window",
          skillId: card.id,
          summary: "the next Attack deals +4 damage this turn",
          remainingUses: 1,
          requireKindsAny: ["attack"],
          damageBonus: 4,
        }, segments);
        break;
      // barbarian_increased_stamina, barbarian_war_stance, barbarian_fury_howl → data-driven
      // barbarian_bulwark, barbarian_raging_cleave, barbarian_fury_mastery, barbarian_ancient_vow → data-driven
      case "barbarian_warlord_shout":
        getLivingEnemies(state).forEach((enemy) => {
          enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 5);
        });
        state.tempHeroDamageBonus = Math.max(0, state.tempHeroDamageBonus + 5);
        state.tempMercenaryDamageBonus = Math.max(0, state.tempMercenaryDamageBonus + 5);
        segments.push("all enemies deal 5 less damage next turn");
        segments.push("you and your mercenary gain +5 damage this turn");
        break;
      // druid_feral_rage → data-driven
      case "druid_carrion_vine": {
        if (state.enemyDiedLastTurn) {
          const vine = boostLatestSummon(state, "druid_carrion_vine", 3);
          if (vine) {
            segments.push(`${vine.name} heals for 6 instead of 3`);
          }
        }
        break;
      }
      case "druid_natures_balance":
        if (summonCount > 0) {
          drawConditionalCards(state, 1, segments, "Nature's Balance is sustained by a summon");
        }
        if (getLivingEnemies(state).some((enemy) => enemy.burn > 0)) {
          applyGuard(state.hero, 3);
          state.gainedGuardThisTurn = true;
          segments.push("burning enemies grant 3 more Guard");
        }
        break;
      // druid_tornado → data-driven
      case "druid_dire_wolf":
        if (summonCount >= 2) {
          const wolf = boostLatestSummon(state, "druid_dire_wolf", 3);
          if (wolf) {
            segments.push(`${wolf.name} joins with +3 maul damage`);
          }
        }
        break;
      case "druid_pack_howl":
        state.tempSummonPowerBonus = Math.max(0, state.tempSummonPowerBonus + 4);
        segments.push("your summons gain +4 damage on their next hit");
        if (summonCount >= 3) {
          drawConditionalCards(state, 1, segments, "Pack Howl rewards the full board");
        }
        break;
      case "druid_natures_wrath":
        if (summonCount > 0) {
          dealConditionalDamageToEnemy(state, targetEnemy, 4, segments, "Nature's Wrath is amplified by your pack");
        }
        break;
      // druid_hunger → data-driven
      case "druid_savage_pounce":
        if (enemyHasSnapshotStatusAtLeast(targetBefore, ["slow", "stun"])) {
          dealConditionalDamageToEnemy(state, targetEnemy, 8, segments, "Savage Pounce pounces on the opening");
          if (targetEnemy?.alive) {
            targetEnemy.stun = 1;
            segments.push(`${targetEnemy.name} is stunned`);
          }
        }
        break;
      // druid_natures_guardian → data-driven
      case "druid_renewal": {
        const summon = getAliveSummons(state)[0] || null;
        if (summon) {
          reinforceSummon(summon, 2);
          segments.push(`${summon.name} is reinforced by +2`);
        }
        break;
      }
      case "druid_wild_convergence":
        if (summonCount > 0) {
          dealConditionalDamageToEnemies(state, getLivingEnemies(state), 6, segments, "Wild Convergence surges through the pack");
        }
        if (getLivingEnemies(state).some((enemy) => Math.max(0, enemyBefore[enemy.id]?.slow || 0) > 0)) {
          getLivingEnemies(state).forEach((enemy) => {
            enemy.burn = Math.max(0, enemy.burn + 2);
          });
          segments.push("slowed enemies cause 2 more Burn to spread");
        }
        break;
      // druid_gale_force → data-driven
      case "druid_primal_fury": {
        const healed = healEntity(state.hero, 9);
        if (healed > 0) {
          segments.push(`Primal Fury restores ${healed}`);
        }
        break;
      }
      case "druid_wild_stampede": {
        const summonScaledDamage = Math.max(0, Math.min(4, summonCount)) * 5;
        if (summonScaledDamage > 0) {
          dealConditionalDamageToEnemies(state, getLivingEnemies(state), summonScaledDamage, segments, "Wild Stampede scales with your summons");
        }
        break;
      }
      case "druid_force_of_nature": {
        const reinforced = reinforceSummons(state, 3);
        if (reinforced.length > 0) {
          segments.push(`${reinforced.length} summon${reinforced.length === 1 ? "" : "s"} are reinforced by +3`);
        }
        dealRandomSummonStrikes(state, 5, segments, "Force of Nature sends the pack charging");
        break;
      }
      case "druid_elemental_pack":
        dealRandomSummonStrikes(state, 3, segments, "Elemental Pack lashes out through your summons");
        break;
      // necromancer_corpse_explosion, necromancer_skeleton_mastery, necromancer_bone_spear → data-driven
      case "necromancer_bone_prison":
        if (targetEnemy?.alive) {
          targetEnemy.nextAttackPenalty = Math.max(0, (targetEnemy.nextAttackPenalty || 0) + 6);
          segments.push(`${targetEnemy.name} deals 6 less damage next turn`);
        }
        addCardWindow(state, {
          id: "necromancer_bone_prison_window",
          skillId: card.id,
          summary: "the next bone card deals +4 damage this turn",
          remainingUses: 1,
          requireKindsAny: ["bone"],
          damageBonus: 4,
        }, segments);
        break;
      case "necromancer_confuse":
        if (targetEnemy?.alive) {
          targetEnemy.confuse = Math.max(0, targetEnemy.confuse + 1);
          segments.push(`${targetEnemy.name} is confused and may strike another enemy`);
        }
        break;
      case "necromancer_lower_resist":
        if (targetEnemy?.alive) {
          addCardWindow(state, {
            id: "necromancer_lower_resist_window",
            skillId: card.id,
            summary: `the next 2 Poison or Burn applications against ${targetEnemy.name} gain +3`,
            remainingUses: 2,
            requireTargetEnemyId: targetEnemy.id,
            requireKindsAny: ["poison_application", "burn_application"],
            poison: 3,
            burn: 3,
          }, segments);
        }
        break;
      case "necromancer_summon_resist": {
        const reinforced = reinforceSummons(state, 0, 1);
        if (reinforced.length > 0) {
          segments.push(`${reinforced.length} summon${reinforced.length === 1 ? "" : "s"} gain +1 turn`);
        }
        break;
      }
      case "necromancer_attract":
        if (targetEnemy?.alive) {
          state.summonFocusEnemyId = targetEnemy.id;
          state.summonFocusDamageBonus = Math.max(0, state.summonFocusDamageBonus + 4);
          state.mercenary.skillTargetEnemyId = targetEnemy.id;
          state.mercenary.skillTargetDamageBonus = Math.max(0, state.mercenary.skillTargetDamageBonus + 4);
          segments.push(`${targetEnemy.name} takes 4 more damage from summons and the mercenary this turn`);
        }
        break;
      case "necromancer_golem_mastery": {
        const reinforced = reinforceSummons(state, 2);
        if (reinforced.length > 0) {
          segments.push(`${reinforced.length} summon${reinforced.length === 1 ? "" : "s"} are reinforced by +2`);
        }
        const golems = reinforceSummons(state, 3, 0, (minion) => minion.templateId.includes("golem"));
        if (golems.length > 0) {
          segments.push(`${golems[0].name} gains +3 more from Golem Mastery`);
        }
        break;
      }
      case "necromancer_soul_harvest":
        if (summonCount > 0) {
          drawConditionalCards(state, 1, segments, "Soul Harvest draws off your summon");
        }
        if (getLivingEnemies(state).some((enemy) => enemy.poison > 0)) {
          const healed = healEntity(state.hero, 3);
          if (healed > 0) {
            segments.push(`poisoned enemies restore ${healed} more life`);
          }
        }
        break;
      case "necromancer_desecrate":
        if (summonCount > 0) {
          getLivingEnemies(state).forEach((enemy) => {
            enemy.poison = Math.max(0, enemy.poison + 1);
          });
          segments.push("your summons spread 1 more Poison to all enemies");
        }
        break;
      // necromancer_poison_nova → data-driven
      case "necromancer_corpse_lance":
        if (state.enemyDiedLastTurn) {
          dealConditionalDamageToEnemy(state, targetEnemy, 10, segments, "Corpse Lance erupts from the fallen");
          if (targetEnemy?.alive) {
            targetEnemy.poison = Math.max(0, targetEnemy.poison + 3);
            segments.push(`${targetEnemy.name} takes 3 Poison`);
          }
        }
        break;
      // necromancer_dark_ward → data-driven
      case "necromancer_corpse_harvest":
        if (state.enemyDiedLastTurn) {
          const summonSegment = resolveCardEffect(state, { kind: "summon_minion", value: 7, minionId: "necromancer_skeleton" }, null, card.id, card);
          if (summonSegment) {
            segments.push(summonSegment);
          }
          const healed = healEntity(state.hero, 6);
          if (healed > 0) {
            segments.push(`Corpse Harvest restores ${healed}`);
          }
        }
        break;
      case "necromancer_bone_offering": {
        const summon = getAliveSummons(state)[0] || null;
        if (summon) {
          reinforceSummon(summon, 5, 1);
          segments.push(`${summon.name} gains +5 damage and +1 turn`);
        }
        break;
      }
      case "necromancer_death_pact":
        if (!targetEnemy?.alive) {
          const healed = healEntity(state.hero, 10);
          applyGuard(state.hero, 10);
          state.gainedGuardThisTurn = true;
          segments.push(`Death Pact pays out with ${healed} healing and 10 Guard`);
        }
        break;
      case "necromancer_army_of_dead": {
        const scaledDamage = Math.max(0, Math.min(4, summonCount)) * 5;
        if (scaledDamage > 0) {
          dealConditionalDamageToEnemies(state, getLivingEnemies(state), scaledDamage, segments, "Army of the Dead scales with your summons");
        }
        const reinforced = reinforceSummons(state, 2);
        if (reinforced.length > 0) {
          segments.push(`${reinforced.length} summon${reinforced.length === 1 ? "" : "s"} are reinforced by +2`);
        }
        break;
      }
      // necromancer_plague_wind → data-driven
      case "paladin_resist_cold":
        state.nextEnemyAttackReduction = Math.max(0, state.nextEnemyAttackReduction + 5);
        state.nextEnemyAttackReductionHeroOnly = false;
        segments.push("the next enemy attack against you or your mercenary deals 5 less damage");
        break;
      // paladin_charge, paladin_blessed_aim → data-driven
      // paladin_concentration, paladin_vigor, paladin_conversion, paladin_holy_strike → data-driven
      case "paladin_righteous_guard": {
        const pressuredEnemies = getLivingEnemies(state).filter((enemy) => !enemy.templateId.endsWith("_boss"));
        pressuredEnemies.forEach((enemy) => {
          enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + 3);
        });
        if (pressuredEnemies.length > 0) {
          segments.push("all non-boss enemies deal 3 less damage next turn");
        }
        break;
      }
      // paladin_divine_shield, paladin_blessed_hammer_storm → data-driven
      case "paladin_redemption": {
        if (state.enemyDiedLastTurn) {
          const healed = healEntity(state.hero, 6);
          if (healed > 0) {
            segments.push(`Redemption restores ${healed} more life`);
          }
        }
        break;
      }
      // paladin_blessed_ward, paladin_righteous_wrath, paladin_crusade → data-driven
      case "paladin_divine_command":
        state.tempHeroDamageBonus = Math.max(0, state.tempHeroDamageBonus + 5);
        state.tempMercenaryDamageBonus = Math.max(0, state.tempMercenaryDamageBonus + 5);
        segments.push("you and your mercenary gain +5 damage this turn");
        addCardWindow(state, {
          id: "paladin_divine_command_window",
          skillId: card.id,
          summary: "the next 2 cards each gain +4 damage or +4 Guard this turn",
          remainingUses: 2,
          damageBonus: 4,
          guardBonus: 4,
        }, segments);
        break;
      default:
        break;
    }
  }

  function enemyWillAttackNextTurn(enemy: CombatEnemyState | null) {
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

  function applyCardSkillWindows(
    state: CombatState,
    matchingWindows: CombatSkillWindowState[],
    enemyBefore: Record<string, { life: number; guard: number; slow: number }>
  ) {
    const damagedEnemies = getDamagedEnemies(state, enemyBefore);
    let totalDraw = 0;
    matchingWindows.forEach((window) => {
      let consumeCount = 1;
      if (damagedEnemies.length > 0) {
        if (window.drawOnDamage > 0) {
          totalDraw += window.drawOnDamage;
        }
        if (window.drawOnSingleTargetDamage > 0 && damagedEnemies.length === 1) {
          totalDraw += window.drawOnSingleTargetDamage;
        }
        if (window.drawOnMultiTargetDamage > 0 && damagedEnemies.length > 1) {
          totalDraw += window.drawOnMultiTargetDamage;
        }
        if (window.drawOnSlowedEnemyHit > 0 && damagedEnemies.some((enemy) => (enemyBefore[enemy.id]?.slow || 0) > 0)) {
          totalDraw += window.drawOnSlowedEnemyHit;
        }
        if (window.gainGuardOnAttackingEnemyHit > 0 && damagedEnemies.some((enemy) => enemyWillAttackNextTurn(enemy))) {
          applyGuard(state.hero, window.gainGuardOnAttackingEnemyHit);
          state.gainedGuardThisTurn = true;
        }
        if (window.applySlowOnDamage > 0) {
          damagedEnemies.forEach((enemy) => {
            enemy.slow = Math.max(0, enemy.slow + window.applySlowOnDamage);
          });
        }
        if (window.nextAttackPenaltyOnHit > 0) {
          const eligible = damagedEnemies.filter((enemy) => !window.requireEnemyAttackingNextTurnForPenalty || enemyWillAttackNextTurn(enemy));
          const applied = eligible.slice(0, Math.max(1, window.remainingUses));
          applied.forEach((enemy) => {
            enemy.nextAttackPenalty = Math.max(0, (enemy.nextAttackPenalty || 0) + window.nextAttackPenaltyOnHit);
          });
          if (!window.requireTargetEnemyId && applied.length > 1) {
            consumeCount = applied.length;
          }
        }
        if (damagedEnemies.length === 1) {
          const damagedEnemy = damagedEnemies[0];
          if (!window.sameEnemyId) {
            window.sameEnemyId = damagedEnemy.id;
            window.sameEnemyHitCount = 1;
          } else if (window.sameEnemyId === damagedEnemy.id) {
            window.sameEnemyHitCount = Math.max(0, (window.sameEnemyHitCount || 0) + 1);
            if ((window.sameEnemyHitCount || 0) >= 2) {
              if (window.slowOnSameEnemyCombo > 0) {
                damagedEnemy.slow = Math.max(0, damagedEnemy.slow + window.slowOnSameEnemyCombo);
              }
              if (window.guardOnSameEnemyCombo > 0) {
                applyGuard(state.hero, window.guardOnSameEnemyCombo);
                state.gainedGuardThisTurn = true;
              }
              if (window.energyNextTurnOnSameEnemyCombo > 0) {
                state.pendingEnergyNextTurn = Math.max(0, state.pendingEnergyNextTurn + window.energyNextTurnOnSameEnemyCombo);
              }
            }
          } else {
            window.sameEnemyId = damagedEnemy.id;
            window.sameEnemyHitCount = 1;
          }
        }
      }
      window.remainingUses = Math.max(0, window.remainingUses - consumeCount);
    });
    state.skillWindows = state.skillWindows.filter((window) => window.remainingUses > 0);
    if (totalDraw > 0) {
      drawCards(state, totalDraw);
    }
  }

  function useSkill(state: CombatState, slotKey: RunSkillBarSlotKey, targetId = "") {
    if (state.phase !== COMBAT_PHASE.PLAYER || state.outcome) {
      return { ok: false, message: "Skills can only be used during the player turn." };
    }

    const skill = state.equippedSkills.find((entry) => entry.slotKey === slotKey) || null;
    if (!skill) {
      return { ok: false, message: "No skill is equipped in that slot." };
    }
    if (!skill.active) {
      return { ok: false, message: "That skill is passive in combat." };
    }
    if (skill.remainingCooldown > 0) {
      return { ok: false, message: "That skill is still on cooldown." };
    }
    if (skill.oncePerBattle && skill.usedThisBattle) {
      return { ok: false, message: "That skill can only be used once per battle." };
    }
    if (skill.chargeCount > 0 && skill.chargesRemaining <= 0) {
      return { ok: false, message: "That skill is out of charges." };
    }
    if (state.hero.energy < skill.cost) {
      return { ok: false, message: "Not enough Energy." };
    }

    state.hero.energy -= skill.cost;
    skill.usedThisBattle = true;
    if (skill.chargeCount > 0) {
      skill.chargesRemaining = Math.max(0, skill.chargesRemaining - 1);
    }
    skill.remainingCooldown = Math.max(0, skill.cooldown);

    const scale = getSkillTierScale(skill);
    const targetEnemy = getSelectedEnemy(state, targetId);
    const modifiers: Partial<CombatSkillModifierState> = {};
    const segments: string[] = [];

    const specificResult = runtimeWindow.__ROUGE_COMBAT_ENGINE_SKILLS?.useSpecificActiveSkill?.(state, skill, targetEnemy);
    if (specificResult) {
      return specificResult;
    }

    if (skill.skillType === "attack" || skill.skillType === "spell") {
      if (targetEnemy) {
        const baseDamage = (skill.skillType === "spell" ? 2 + scale * 2 : 3 + scale * 2) + Math.max(0, state.tempHeroDamageBonus || 0);
        const dealt = dealDamage(state, targetEnemy, Math.max(1, baseDamage), skill.damageType === "none" ? undefined : skill.damageType as DamageType);
        segments.push(`hits ${targetEnemy.name} for ${dealt}`);
      }
      modifiers.nextCardDamageBonus = (modifiers.nextCardDamageBonus || 0) + (scale + 1);
      if (skill.skillType === "spell") {
        modifiers.nextCardCostReduction = (modifiers.nextCardCostReduction || 0) + 1;
      }
      addDamageTypeRider(modifiers, skill.damageType, scale);
    } else if (skill.skillType === "buff" || skill.skillType === "aura") {
      const guardValue = 3 + scale * 2;
      applyGuard(state.hero, guardValue);
      if (skill.family === "command" && state.mercenary.alive) {
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 2);
        segments.push(`rallies the mercenary`);
      } else {
        segments.push(`grants ${guardValue} Guard`);
      }
      modifiers.nextCardCostReduction = 1;
      modifiers.nextCardGuard = scale + 1;
      addDamageTypeRider(modifiers, skill.damageType, scale);
    } else if (skill.skillType === "debuff") {
      const rider = applyEnemySkillRider(targetEnemy, skill.damageType, scale + 1)
        || (targetEnemy ? applyEnemySkillRider(targetEnemy, "cold", scale) : "");
      if (rider) {
        segments.push(rider);
      }
      modifiers.nextCardCostReduction = 1;
      modifiers.nextCardDamageBonus = scale;
    } else if (skill.skillType === "summon") {
      const guardValue = 2 + scale;
      applyGuard(state.hero, guardValue);
      if (state.mercenary.alive) {
        applyGuard(state.mercenary, guardValue);
      }
      state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 1);
      drawCards(state, 1);
      segments.push(`bolsters the party and draws 1`);
      modifiers.nextCardGuard = scale;
    } else if (skill.family === "recovery") {
        const healed = healEntity(state.hero, 3 + scale * 2);
        drawCards(state, 1);
        segments.push(`heals ${healed} and draws 1`);
        modifiers.nextCardGuard = scale;
      } else if (skill.family === "command") {
        drawCards(state, 1);
        state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + scale + 2);
        segments.push(`draws 1 and readies the mercenary`);
        modifiers.nextCardDraw = 1;
      } else if (skill.family === "state") {
        const guardValue = 3 + scale * 2;
        applyGuard(state.hero, guardValue);
        segments.push(`steadies the Wanderer with ${guardValue} Guard`);
        modifiers.nextCardCostReduction = 1;
        modifiers.nextCardGuard = scale + 1;
      } else {
        modifiers.nextCardDamageBonus = 2 + scale;
        modifiers.nextCardDraw = skill.family === "commitment" ? 1 : 0;
        addDamageTypeRider(modifiers, skill.damageType, scale);
        segments.push(`arms the next card`);
      }

    addSkillModifiers(state, modifiers);
    if (segments.length === 0) {
      segments.push("changes the line of play");
    }
    const prepSummary = [getSkillPreparationSummary(state.skillModifiers), ...getSkillWindowSummaries(state)].filter(Boolean).join(", ");
    const message = `${skill.name}: ${segments.join(", ")}${prepSummary ? ` (${prepSummary}).` : "."}`;
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
    checkOutcome(state);
    return { ok: true, message: "Skill used." };
  }

  function playCard(state: CombatState, content: GameContent, instanceId: string, targetId: string = "") {
    if (state.phase !== COMBAT_PHASE.PLAYER || state.outcome) {
      return { ok: false, message: "Cards can only be played during the player turn." };
    }

    const handIndex = state.hand.findIndex((entry: CardInstance) => entry.instanceId === instanceId);
    if (handIndex < 0) {
      return { ok: false, message: "Card is not in hand." };
    }

    const cardInstance = state.hand[handIndex];
    const card = getCardDefinition(content, cardInstance.cardId);
    if (!card) {
      return { ok: false, message: "Unknown card." };
    }
    const targetEnemy =
      card.target === "enemy"
        ? state.enemies.find((enemy: CombatEnemyState) => enemy.id === targetId && enemy.alive) || null
        : null;
    if (card.target === "enemy" && !targetEnemy) {
      return { ok: false, message: "Select a living enemy." };
    }
    const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
    const costReduction = evo ? evo.getTreeCostReduction(cardInstance.cardId, state.deckCardIds, content.cardCatalog) : 0;
    const windowPatch = getSkillWindowModifierPatch(state, cardInstance.cardId, card, targetEnemy);
    const skillCostReduction = Math.max(0, (state.skillModifiers?.nextCardCostReduction || 0) + Math.max(0, windowPatch.nextCardCostReduction || 0));
    const effectiveCost = Math.max(0, card.cost - costReduction - skillCostReduction);
    if (state.hero.energy < effectiveCost) {
      return { ok: false, message: "Not enough Energy." };
    }

    const previousCardIds = Array.isArray(state.playedCardIdsThisTurn) ? [...state.playedCardIdsThisTurn] : [];
    state.hero.energy -= effectiveCost;
    state.hand.splice(handIndex, 1);
    state.cardsPlayed += 1;
    const baseSkillModifiers = { ...(state.skillModifiers || createEmptySkillModifiers()) };
    state.skillModifiers = {
      ...baseSkillModifiers,
      nextCardCostReduction: Math.max(0, baseSkillModifiers.nextCardCostReduction + Math.max(0, windowPatch.nextCardCostReduction || 0)),
      nextCardDamageBonus: Math.max(0, baseSkillModifiers.nextCardDamageBonus + Math.max(0, windowPatch.nextCardDamageBonus || 0)),
      nextCardBurn: Math.max(0, baseSkillModifiers.nextCardBurn + Math.max(0, windowPatch.nextCardBurn || 0)),
      nextCardPoison: Math.max(0, baseSkillModifiers.nextCardPoison + Math.max(0, windowPatch.nextCardPoison || 0)),
      nextCardSlow: Math.max(0, baseSkillModifiers.nextCardSlow + Math.max(0, windowPatch.nextCardSlow || 0)),
      nextCardFreeze: Math.max(0, baseSkillModifiers.nextCardFreeze + Math.max(0, windowPatch.nextCardFreeze || 0)),
      nextCardParalyze: Math.max(0, baseSkillModifiers.nextCardParalyze + Math.max(0, windowPatch.nextCardParalyze || 0)),
      nextCardDraw: Math.max(0, baseSkillModifiers.nextCardDraw + Math.max(0, windowPatch.nextCardDraw || 0)),
      nextCardGuard: Math.max(0, baseSkillModifiers.nextCardGuard + Math.max(0, windowPatch.nextCardGuard || 0)),
      nextCardIgnoreGuard: Math.max(0, baseSkillModifiers.nextCardIgnoreGuard + Math.max(0, windowPatch.nextCardIgnoreGuard || 0)),
      nextCardExtraStatus: Math.max(0, baseSkillModifiers.nextCardExtraStatus + Math.max(0, windowPatch.nextCardExtraStatus || 0)),
    };
    const matchingWindows: CombatSkillWindowState[] = getMatchingSkillWindows(state, cardInstance.cardId, card, targetEnemy);
    const enemyBefore = snapshotEnemyBoard(state);

    // ── Aura dual-mode: first play activates, second play does direct action ──
    const auraId = card.auraId || "";
    const auraAlreadyActive = auraId && state.activePlayerAuras.includes(auraId);

    const segments: string[] = [];
    if (auraAlreadyActive) {
      // Active mode: aura is already on, so do a direct action instead
      const auraPulseBonus = state.activePlayerAuras.includes("paladin_aura_mastery") && getCardSkillKinds(card.id, card).has("aura_card") ? 4 : 0;
      const activeGuard = Math.max(6, card.cost * 5) + Math.max(0, state.skillModifiers?.nextCardGuard || 0) + auraPulseBonus;
      const activeDamage =
        Math.max(4, card.cost * 4)
        + Math.max(0, state.skillModifiers?.nextCardDamageBonus || 0)
        + Math.max(0, state.tempHeroDamageBonus || 0)
        + auraPulseBonus;
      applyGuard(state.hero, activeGuard);
      segments.push(`gains ${activeGuard} Guard`);
      // Deal damage to target or AoE if no target
      if (targetEnemy && targetEnemy.alive) {
        const dealt = dealDamage(state, targetEnemy, activeDamage);
        segments.push(`hits ${targetEnemy.name} for ${dealt}`);
      } else {
        const living = getLivingEnemies(state);
        if (living.length > 0) {
          living.forEach((enemy: CombatEnemyState) => {
            dealDamage(state, enemy, Math.max(2, Math.ceil(activeDamage / 2)));
          });
          segments.push(`hits all enemies for ${Math.max(2, Math.ceil(activeDamage / 2))}`);
        }
      }
      segments.push("(aura pulse)");
    } else {
      card.effects.forEach((effect: CardEffect) => {
        const segment = resolveCardEffect(state, effect, targetEnemy, cardInstance.cardId, card);
        if (segment) {
          segments.push(segment);
        }
      });
      if (auraId) {
        state.activePlayerAuras.push(auraId);
      }
    }
    if (matchingWindows.some((window) => window.duplicateOnResolve)) {
      card.effects.forEach((effect: CardEffect) => {
        const segment = resolveCardEffect(state, effect, targetEnemy, cardInstance.cardId, card);
        if (segment) {
          segments.push(`Echo: ${segment}`);
        }
      });
    }
    if (!auraAlreadyActive) {
      applyPassiveAuraGuardBonus(state, card, segments);
    }
    applyCardSpecificEffects({
      state,
      content,
      card,
      targetEnemy,
      enemyBefore,
      previousCardIds,
      auraAlreadyActive: Boolean(auraAlreadyActive),
      segments,
    });

    // Aura cards are truly exhausted (removed from game) on first activation.
    // On second play (active mode), they go to discard normally.
    if (auraId && !auraAlreadyActive) {
      // True exhaust — don't put in discard, card is gone
    } else {
      state.discardPile.push(cardInstance);
    }
    combatLog.appendLogEntry(state, combatLog.createLogEntry(state, {
      actor: "hero",
      actorName: "the Wanderer",
      action: "card_play",
      actionId: card.id,
      message: summarizeCardEffect(card, segments),
    }));
    state.playedCardIdsThisTurn.push(card.id);
    applyCardSkillWindows(state, matchingWindows, enemyBefore);
    state.skillModifiers = createEmptySkillModifiers();

    if (targetEnemy?.id) {
      state.selectedEnemyId = targetEnemy.id;
    }
    if (!getLivingEnemies(state).some((enemy: CombatEnemyState) => enemy.id === state.selectedEnemyId)) {
      state.selectedEnemyId = getFirstLivingEnemyId(state);
    }

    checkOutcome(state);
    return { ok: true, message: "Card played." };
  }

  function applyEncounterModifiers(state: CombatState) {
    if (!runtimeWindow.ROUGE_COMBAT_MODIFIERS) {
      throw new Error("Combat modifiers helper is unavailable.");
    }
    runtimeWindow.ROUGE_COMBAT_MODIFIERS.applyEncounterModifiers(state);
  }

  function applyMercenaryContractBonuses(state: CombatState) {
    if (!state?.mercenary?.alive) {
      return;
    }

    if (state.mercenary.contractHeroStartGuard > 0) {
      applyGuard(state.hero, state.mercenary.contractHeroStartGuard);
      logCombat(state, { actor: "mercenary", actorName: state.mercenary.name, action: "setup", message: `The Wanderer enters with ${state.mercenary.contractHeroStartGuard} Guard from contract route support.`, effects: [] });
    }

    if (state.mercenary.contractHeroDamageBonus > 0) {
      state.hero.damageBonus += state.mercenary.contractHeroDamageBonus;
      logCombat(state, { actor: "mercenary", actorName: state.mercenary.name, action: "setup", message: `${state.mercenary.name} route support sharpens the Wanderer's attacks by ${state.mercenary.contractHeroDamageBonus}.`, effects: [] });
    }

    if (state.mercenary.contractOpeningDraw > 0) {
      const drawn = drawCards(state, state.mercenary.contractOpeningDraw);
      if (drawn > 0) {
        logCombat(state, { actor: "mercenary", actorName: state.mercenary.name, action: "setup", message: `${state.mercenary.name} route intel draws ${drawn} extra card${drawn === 1 ? "" : "s"} for the opening hand.`, effects: [] });
      }
    }

    if (state.mercenary.contractStartGuard > 0) {
      applyGuard(state.mercenary, state.mercenary.contractStartGuard);
      logCombat(state, { actor: "mercenary", actorName: state.mercenary.name, action: "setup", message: `${state.mercenary.name} enters with ${state.mercenary.contractStartGuard} Guard from contract route support.`, effects: [] });
    }

    if (state.mercenary.contractPerkLabels.length > 0) {
      logCombat(state, { actor: "mercenary", actorName: state.mercenary.name, action: "setup", message: `${state.mercenary.name} route perks active: ${state.mercenary.contractPerkLabels.join(", ")}.`, effects: [] });
    }
  }

  function createCombatState({
    content,
    encounterId,
    mercenaryId,
    randomFn = Math.random,
    heroState = null,
    mercenaryState = null,
    starterDeck = null,
    initialPotions = 2,
    weaponFamily = "",
    weaponName = "",
    weaponDamageBonus = 0,
    weaponProfile = null,
    armorProfile = null,
    classPreferredFamilies = [],
    equippedSkills = null,
  }: {
    content: GameContent;
    encounterId: string;
    mercenaryId: string;
    randomFn?: RandomFn;
    heroState?: Record<string, unknown> | null;
    mercenaryState?: Record<string, unknown> | null;
    starterDeck?: string[] | null;
    initialPotions?: number;
    weaponFamily?: string;
    weaponName?: string;
    weaponDamageBonus?: number;
    weaponProfile?: WeaponCombatProfile | null;
    armorProfile?: ArmorMitigationProfile | null;
    classPreferredFamilies?: string[];
    equippedSkills?: CombatSkillLoadoutEntry[] | null;
  }) {
    const encounter = content.encounterCatalog[encounterId];
    const state = {
      encounter,
      randomFn,
      nextCardInstanceId: 1,
      turn: 0,
      phase: COMBAT_PHASE.PLAYER,
      outcome: null as CombatOutcome | null,
      potions: Math.max(0, parseInteger(initialPotions, 0)),
      hero: createHero(content, heroState),
      mercenary: createMercenary(content, mercenaryId, mercenaryState),
      minions: [] as CombatMinionState[],
      enemies: encounter.enemies.map((enemyEntry: EncounterEnemyEntry) => createEnemy(content, enemyEntry)),
      drawPile: [] as CardInstance[],
      discardPile: [] as CardInstance[],
      hand: [] as CardInstance[],
      equippedSkills: (Array.isArray(equippedSkills) ? equippedSkills : []).map((entry) => createCombatSkill(entry)),
      skillModifiers: createEmptySkillModifiers(),
      skillWindows: [] as CombatSkillWindowState[],
      log: [] as CombatLogEntry[],
      selectedEnemyId: "",
      meleeUsed: false,
      weaponFamily,
      weaponName,
      weaponDamageBonus,
      weaponProfile,
      armorProfile,
      classPreferredFamilies,
      summonPowerBonus: 0,
      summonSecondaryBonus: 0,
      deckCardIds: Array.isArray(starterDeck) && starterDeck.length > 0 ? [...starterDeck] : [...content.starterDeck],
      cardsPlayed: 0,
      playedCardIdsThisTurn: [] as string[],
      potionsUsed: 0,
      lowestHeroLife: 0,
      lowestMercenaryLife: 0,
      pendingEnergyNextTurn: 0,
      gainedGuardThisTurn: false,
      enemyDiedThisTurn: false,
      enemyDiedLastTurn: false,
      summonDiedThisTurn: false,
      nextEnemyAttackReduction: 0,
      nextEnemyAttackReductionHeroOnly: false,
      nextEnemyAttackSlow: 0,
      nextEnemyAttackFreeze: 0,
      tempHeroDamageBonus: 0,
      tempMercenaryDamageBonus: 0,
      tempSummonPowerBonus: 0,
      tempTrapPowerBonus: 0,
      summonFocusEnemyId: "",
      summonFocusDamageBonus: 0,
      summonFocusNextAttackPenalty: 0,
      tauntTarget: "" as CombatState["tauntTarget"],
      tauntTurnsRemaining: 0,
      tauntMinionId: "",
      heroFade: 0,
      mercenaryAura: String((content.mercenaryCatalog?.[mercenaryId] as Record<string, unknown>)?.aura || ""),
      activePlayerAuras: [] as string[],
    };

    state.lowestHeroLife = state.hero.life;
    state.lowestMercenaryLife = state.mercenary.life;

    applyRandomAffixes(state, randomFn, encounterId);

    // Process on-spawn triggers (ETB effects) — only for original encounter enemies
    const initialEnemies = [...state.enemies];
    initialEnemies.forEach((enemy: CombatEnemyState) => {
      runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS.processSpawnTraits(state, enemy);
    });

    state.drawPile = createDeck(state, content, starterDeck);
    state.selectedEnemyId = getFirstLivingEnemyId(state);
    logCombat(state, { actor: "environment", actorName: "", action: "setup", message: `${encounter.name}: ${encounter.description}`, effects: [] });
    applyEncounterModifiers(state);
    startPlayerTurn(state);
    applyMercenaryContractBonuses(state);
    state.equippedSkills
      .filter((skill) => !skill.active)
      .forEach((skill) => applyPassiveSkill(state, skill));
    return state;
  }

  runtimeWindow.ROUGE_COMBAT_ENGINE = {
    createCombatState,
    playCard,
    useSkill,
    endTurn,
    usePotion,
    meleeStrike,
    describeIntent,
    getLivingEnemies,
    getFirstLivingEnemyId,
  };
  runtimeWindow.__ROUGE_COMBAT_CARD_RUNTIME = {
    cardSpecificBehaviorIds: Array.from(CARD_SPECIFIC_BEHAVIOR_IDS),
  };
})();
