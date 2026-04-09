(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    healEntity,
    applyGuard,
    dealDamage,
    dealDamageIgnoringGuard,
    getLivingEnemies,
    drawCards,
    summonMinion,
    getWeaponAttackBonus,
    getWeaponSupportBonus,
    applyWeaponTypedDamage,
    applyWeaponEffects,
  } = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;

  const AMAZON_JAVELIN_CARD_TOKEN = /(javelin|spear|impale|fend|power_strike|charged_strike|lightning|plague|war_pike|jab)/;
  const NECROMANCER_BONE_POISON_CARD_TOKEN = /(bone|poison|teeth|spear|spirit|nova|plague|corpse|fang)/;
  const SORCERESS_COLD_SPELL_TOKEN = /(cold|frost|glacial|ice|blizzard|frozen|orb|chill|shiver|tempest)/;
  const SORCERESS_FIRE_SPELL_TOKEN = /(fire|inferno|blaze|meteor|hydra|combust|conflagration|wall|warmth)/;
  const SORCERESS_LIGHTNING_SPELL_TOKEN = /(lightning|static|nova|telekinesis|teleport|thunder|overcharge|arc|storm|charged_bolt)/;

  function getCardKinds(cardId: string, card: CardDefinition | null) {
    const helpers = runtimeWindow.__ROUGE_COMBAT_ENGINE_HELPERS;
    if (!helpers?.getCardSkillKinds) {
      return new Set<string>();
    }
    return helpers.getCardSkillKinds(cardId, card);
  }

  function hasActiveAura(state: CombatState, auraId: string) {
    return Array.isArray(state.activePlayerAuras) && state.activePlayerAuras.includes(auraId);
  }

  function getCardAuraBonuses(
    state: CombatState,
    cardId: string,
    card: CardDefinition | null,
    effectKind: CardEffect["kind"]
  ) {
    const normalizedId = String(cardId || "").toLowerCase();
    const kinds = getCardKinds(cardId, card);
    const bonuses = {
      damage: 0,
      guard: 0,
      burn: 0,
      poison: 0,
      slow: 0,
      freeze: 0,
      paralyze: 0,
      draw: 0,
      mark: 0,
    };

    if (hasActiveAura(state, "amazon_ranged_mastery") && kinds.has("ranged")) {
      bonuses.damage += 3;
    }
    if (hasActiveAura(state, "amazon_javelin_mastery") && normalizedId.startsWith("amazon_") && AMAZON_JAVELIN_CARD_TOKEN.test(normalizedId)) {
      bonuses.damage += 3;
      bonuses.paralyze += 1;
    }
    if (hasActiveAura(state, "assassin_combo_mastery") && normalizedId.startsWith("assassin_") && kinds.has("melee")) {
      bonuses.damage += 3;
      bonuses.guard += 2;
    }
    if (hasActiveAura(state, "assassin_lethal_tempo") && normalizedId.startsWith("assassin_") && effectKind === "draw") {
      bonuses.draw += 1;
    }
    if (hasActiveAura(state, "barbarian_combat_mastery") && normalizedId.startsWith("barbarian_") && kinds.has("attack")) {
      bonuses.damage += 3;
      bonuses.guard += 3;
    }
    if (hasActiveAura(state, "barbarian_battle_command") && normalizedId.startsWith("barbarian_") && kinds.has("warcry")) {
      bonuses.guard += 4;
      if (effectKind === "draw") {
        bonuses.draw += 1;
      }
    }
    if (hasActiveAura(state, "druid_elemental_mastery") && normalizedId.startsWith("druid_")) {
      bonuses.burn += 2;
      bonuses.slow += 1;
    }
    if (hasActiveAura(state, "necromancer_bone_plague") && normalizedId.startsWith("necromancer_") && NECROMANCER_BONE_POISON_CARD_TOKEN.test(normalizedId)) {
      bonuses.damage += 3;
    }
    if (hasActiveAura(state, "necromancer_curse_mastery") && normalizedId.startsWith("necromancer_") && kinds.has("curse")) {
      bonuses.mark += 2;
      if (effectKind === "draw") {
        bonuses.draw += 1;
      }
    }
    if (hasActiveAura(state, "paladin_combat_mastery") && normalizedId.startsWith("paladin_") && kinds.has("attack")) {
      bonuses.damage += 3;
      bonuses.guard += 3;
    }
    if (hasActiveAura(state, "paladin_aura_mastery") && normalizedId.startsWith("paladin_") && kinds.has("aura_card")) {
      bonuses.damage += 4;
      bonuses.guard += 4;
    }
    if (normalizedId.startsWith("sorceress_") && kinds.has("spell")) {
      if (hasActiveAura(state, "sorceress_cold_mastery") && SORCERESS_COLD_SPELL_TOKEN.test(normalizedId)) {
        bonuses.damage += 3;
        bonuses.slow += 1;
      }
      if (hasActiveAura(state, "sorceress_fire_mastery") && SORCERESS_FIRE_SPELL_TOKEN.test(normalizedId)) {
        bonuses.damage += 3;
        bonuses.burn += 2;
      }
      if (hasActiveAura(state, "sorceress_arc_mastery") && SORCERESS_LIGHTNING_SPELL_TOKEN.test(normalizedId)) {
        bonuses.damage += 3;
        if (effectKind === "draw") {
          bonuses.draw += 1;
        }
      }
    }

    if (state.mercenary.alive && state.mercenaryAura === "precision" && kinds.has("ranged")) {
      bonuses.damage += 2;
    }
    if (state.mercenary.alive && state.mercenaryAura === "venom") {
      bonuses.poison += 2;
    }

    return bonuses;
  }

  function applyWeaken(state: CombatState, amount: number) {
    if (state.hero.weaken > 0) {
      return Math.max(1, Math.floor(amount * 0.7));
    }
    return amount;
  }

  function getSynergyBonus(state: CombatState, cardId: string): number {
    const evo = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
    if (!evo) { return 0; }
    return evo.getSynergyDamageBonus(cardId, state.deckCardIds);
  }

  function getWeaponScaledSupportValue(state: CombatState, effect: CardEffect, cardId: string, card: CardDefinition | null): number {
    const scalesWithWeapon =
      effect.kind === "gain_guard_self" ||
      effect.kind === "gain_guard_party" ||
      effect.kind === "heal_hero" ||
      effect.kind === "heal_mercenary" ||
      effect.kind === "mark_enemy_for_mercenary" ||
      effect.kind === "buff_mercenary_next_attack";
    const weaponBonus = scalesWithWeapon ? getWeaponSupportBonus(state, cardId) : 0;
    const auraBonuses = getCardAuraBonuses(state, cardId, card, effect.kind);
    let auraSupportBonus = 0;
    if (effect.kind === "gain_guard_self" || effect.kind === "gain_guard_party") {
      auraSupportBonus = auraBonuses.guard;
    } else if (effect.kind === "mark_enemy_for_mercenary") {
      auraSupportBonus = auraBonuses.mark;
    }
    return Math.max(0, effect.value + weaponBonus + auraSupportBonus);
  }

  function getPendingSkillDamageBonus(state: CombatState): number {
    return Math.max(0, state.skillModifiers?.nextCardDamageBonus || 0);
  }

  function getPendingSkillGuardBonus(state: CombatState): number {
    return Math.max(0, state.skillModifiers?.nextCardGuard || 0);
  }

  function getPendingSkillDrawBonus(state: CombatState): number {
    return Math.max(0, state.skillModifiers?.nextCardDraw || 0);
  }

  function getPendingSkillIgnoreGuard(state: CombatState): number {
    return Math.max(0, state.skillModifiers?.nextCardIgnoreGuard || 0);
  }

  function getPendingSkillExtraStatus(state: CombatState): number {
    return Math.max(0, state.skillModifiers?.nextCardExtraStatus || 0);
  }

  function applyPendingSkillRider(state: CombatState, targets: CombatEnemyState[]): string[] {
    const segments: string[] = [];
    const burn = Math.max(0, state.skillModifiers?.nextCardBurn || 0);
    const poison = Math.max(0, state.skillModifiers?.nextCardPoison || 0);
    const slow = Math.max(0, state.skillModifiers?.nextCardSlow || 0);
    const freeze = Math.max(0, state.skillModifiers?.nextCardFreeze || 0);
    const paralyze = Math.max(0, state.skillModifiers?.nextCardParalyze || 0);
    const livingTargets = targets.filter((enemy) => enemy.alive);
    if (livingTargets.length === 0) {
      return segments;
    }

    livingTargets.forEach((enemy) => {
      if (burn > 0) {
        enemy.burn = Math.max(0, enemy.burn + burn);
      }
      if (poison > 0) {
        enemy.poison = Math.max(0, enemy.poison + poison);
      }
      if (slow > 0) {
        enemy.slow = Math.max(0, enemy.slow + slow);
      }
      if (freeze > 0) {
        enemy.freeze = Math.max(0, enemy.freeze + freeze);
      }
      if (paralyze > 0) {
        enemy.paralyze = Math.max(0, enemy.paralyze + paralyze);
      }
    });

    if (burn > 0) { segments.push(`Burn ${burn}${livingTargets.length > 1 ? " line" : ""}.`); }
    if (poison > 0) { segments.push(`Poison ${poison}${livingTargets.length > 1 ? " line" : ""}.`); }
    if (slow > 0) { segments.push(`Slow ${slow}${livingTargets.length > 1 ? " line" : ""}.`); }
    if (freeze > 0) { segments.push(`Freeze ${freeze}${livingTargets.length > 1 ? " line" : ""}.`); }
    if (paralyze > 0) { segments.push(`Paralyze ${paralyze}${livingTargets.length > 1 ? " line" : ""}.`); }
    return segments;
  }

  function resolveCardEffect(
    state: CombatState,
    effect: CardEffect,
    targetEnemy: CombatEnemyState | null,
    cardId: string,
    card: CardDefinition | null = null
  ) {
    const auraBonuses = getCardAuraBonuses(state, cardId, card, effect.kind);
    if (effect.kind === "damage") {
      const synergy = getSynergyBonus(state, cardId);
      const weaponBonus = getWeaponAttackBonus(state, cardId);
      let damage = applyWeaken(
        state,
        Math.max(
          0,
          effect.value
            + state.hero.damageBonus
            + Math.max(0, state.tempHeroDamageBonus || 0)
            + synergy
            + weaponBonus
            + getPendingSkillDamageBonus(state)
            + auraBonuses.damage
        )
      );
      // Stun vulnerability: stunned enemies take +50% damage
      if (targetEnemy && targetEnemy.stun > 0) {
        damage = Math.floor(damage * 1.5);
      }
      const dealt = getPendingSkillIgnoreGuard(state) > 0
        ? dealDamageIgnoringGuard(state, targetEnemy, damage, getPendingSkillIgnoreGuard(state))
        : dealDamage(state, targetEnemy, damage);
      const weaponSegments = [
        ...applyWeaponTypedDamage(state, targetEnemy?.alive ? [targetEnemy] : [], cardId),
        ...applyWeaponEffects(state, targetEnemy?.alive ? [targetEnemy] : [], cardId),
      ];
      const skillSegments = applyPendingSkillRider(state, targetEnemy?.alive ? [targetEnemy] : []);
      return `dealt ${dealt} to ${targetEnemy.name}.${weaponSegments.length > 0 ? ` ${weaponSegments.join(" ")}` : ""}${skillSegments.length > 0 ? ` ${skillSegments.join(" ")}` : ""}`;
    }
    if (effect.kind === "gain_guard_self") {
      const guardValue = Math.max(0, getWeaponScaledSupportValue(state, effect, cardId, card) + state.hero.guardBonus + getPendingSkillGuardBonus(state));
      applyGuard(state.hero, guardValue);
      if (guardValue > 0) {
        state.gainedGuardThisTurn = true;
      }
      return `gained ${guardValue} Guard.`;
    }
    if (effect.kind === "mark_enemy_for_mercenary") {
      if (!targetEnemy || !targetEnemy.alive) {
        return "";
      }
      state.mercenary.markedEnemyId = targetEnemy.id;
      state.mercenary.markBonus = getWeaponScaledSupportValue(state, effect, cardId, card);
      return `marked ${targetEnemy.name} for +${state.mercenary.markBonus} mercenary damage.`;
    }
    if (effect.kind === "apply_burn") {
      if (targetEnemy && targetEnemy.alive) {
        const burnValue = Math.max(0, effect.value + state.hero.burnBonus + (state.skillModifiers?.nextCardBurn || 0) + getPendingSkillExtraStatus(state) + auraBonuses.burn);
        targetEnemy.burn = Math.max(0, targetEnemy.burn + burnValue);
        return `applied ${burnValue} Burn.`;
      }
      return "";
    }
    if (effect.kind === "apply_poison") {
      if (targetEnemy && targetEnemy.alive) {
        const poisonValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardPoison || 0) + getPendingSkillExtraStatus(state) + auraBonuses.poison);
        targetEnemy.poison = Math.max(0, targetEnemy.poison + poisonValue);
        return `applied ${poisonValue} Poison.`;
      }
      return "";
    }
    if (effect.kind === "apply_slow") {
      if (targetEnemy && targetEnemy.alive) {
        const slowValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardSlow || 0) + getPendingSkillExtraStatus(state) + auraBonuses.slow);
        targetEnemy.slow = Math.max(0, targetEnemy.slow + slowValue);
        return `applied ${slowValue} Slow.`;
      }
      return "";
    }
    if (effect.kind === "apply_freeze") {
      if (targetEnemy && targetEnemy.alive) {
        const freezeValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardFreeze || 0) + getPendingSkillExtraStatus(state) + auraBonuses.freeze);
        targetEnemy.freeze = Math.max(0, targetEnemy.freeze + freezeValue);
        return `applied ${freezeValue} Freeze.`;
      }
      return "";
    }
    if (effect.kind === "apply_stun") {
      if (targetEnemy && targetEnemy.alive) {
        targetEnemy.stun = 1;
        return `stunned ${targetEnemy.name}.`;
      }
      return "";
    }
    if (effect.kind === "apply_paralyze") {
      if (targetEnemy && targetEnemy.alive) {
        const paralyzeValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardParalyze || 0) + getPendingSkillExtraStatus(state) + auraBonuses.paralyze);
        targetEnemy.paralyze = Math.max(0, targetEnemy.paralyze + paralyzeValue);
        return `applied ${paralyzeValue} Paralyze.`;
      }
      return "";
    }
    if (effect.kind === "apply_burn_all") {
      const living = getLivingEnemies(state);
      const burnValue = Math.max(0, effect.value + state.hero.burnBonus + (state.skillModifiers?.nextCardBurn || 0) + getPendingSkillExtraStatus(state) + auraBonuses.burn);
      living.forEach((enemy: CombatEnemyState) => { enemy.burn = Math.max(0, enemy.burn + burnValue); });
      return `applied ${burnValue} Burn to all enemies.`;
    }
    if (effect.kind === "apply_poison_all") {
      const living = getLivingEnemies(state);
      const poisonValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardPoison || 0) + getPendingSkillExtraStatus(state) + auraBonuses.poison);
      living.forEach((enemy: CombatEnemyState) => { enemy.poison = Math.max(0, enemy.poison + poisonValue); });
      return `applied ${poisonValue} Poison to all enemies.`;
    }
    if (effect.kind === "apply_slow_all") {
      const living = getLivingEnemies(state);
      const slowValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardSlow || 0) + getPendingSkillExtraStatus(state) + auraBonuses.slow);
      living.forEach((enemy: CombatEnemyState) => { enemy.slow = Math.max(0, enemy.slow + slowValue); });
      return `applied ${slowValue} Slow to all enemies.`;
    }
    if (effect.kind === "apply_freeze_all") {
      const living = getLivingEnemies(state);
      const freezeValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardFreeze || 0) + getPendingSkillExtraStatus(state) + auraBonuses.freeze);
      living.forEach((enemy: CombatEnemyState) => { enemy.freeze = Math.max(0, enemy.freeze + freezeValue); });
      return `applied ${freezeValue} Freeze to all enemies.`;
    }
    if (effect.kind === "apply_stun_all") {
      const living = getLivingEnemies(state);
      living.forEach((enemy: CombatEnemyState) => { enemy.stun = 1; });
      return `stunned all enemies.`;
    }
    if (effect.kind === "apply_paralyze_all") {
      const living = getLivingEnemies(state);
      const paralyzeValue = Math.max(0, effect.value + (state.skillModifiers?.nextCardParalyze || 0) + getPendingSkillExtraStatus(state) + auraBonuses.paralyze);
      living.forEach((enemy: CombatEnemyState) => { enemy.paralyze = Math.max(0, enemy.paralyze + paralyzeValue); });
      return `applied ${paralyzeValue} Paralyze to all enemies.`;
    }
    if (effect.kind === "apply_taunt") {
      if (state.mercenary.alive) {
        state.tauntTarget = "mercenary";
        state.tauntTurnsRemaining = Math.max(1, effect.value);
        return `mercenary taunts for ${effect.value} turn${effect.value > 1 ? "s" : ""}.`;
      }
      return "";
    }
    if (effect.kind === "apply_fade") {
      state.heroFade = Math.max(state.heroFade, effect.value);
      return `the Wanderer fades into shadow for ${effect.value} turn${effect.value > 1 ? "s" : ""}. Enemies prefer other targets.`;
    }
    if (effect.kind === "gain_guard_party") {
      const guardValue = Math.max(0, getWeaponScaledSupportValue(state, effect, cardId, card) + state.hero.guardBonus + getPendingSkillGuardBonus(state));
      applyGuard(state.hero, guardValue);
      applyGuard(state.mercenary, guardValue);
      if (guardValue > 0) {
        state.gainedGuardThisTurn = true;
      }
      return `granted ${guardValue} Guard to the party.`;
    }
    if (effect.kind === "buff_mercenary_next_attack") {
      const attackBonus = getWeaponScaledSupportValue(state, effect, cardId, card);
      state.mercenary.nextAttackBonus = Math.max(0, state.mercenary.nextAttackBonus + attackBonus);
      return `buffed the mercenary's next attack by ${attackBonus}.`;
    }
    if (effect.kind === "damage_all") {
      const synergy = getSynergyBonus(state, cardId);
      const weaponBonus = getWeaponAttackBonus(state, cardId);
      const damage = applyWeaken(
        state,
        Math.max(
          0,
          effect.value
            + state.hero.damageBonus
            + Math.max(0, state.tempHeroDamageBonus || 0)
            + synergy
            + weaponBonus
            + getPendingSkillDamageBonus(state)
            + auraBonuses.damage
        )
      );
      const targets = getLivingEnemies(state);
      const total = targets.reduce((sum: number, enemy: CombatEnemyState) => {
        const dealt = getPendingSkillIgnoreGuard(state) > 0
          ? dealDamageIgnoringGuard(state, enemy, damage, getPendingSkillIgnoreGuard(state))
          : dealDamage(state, enemy, damage);
        return sum + dealt;
      }, 0);
      const aliveTargets = targets.filter((enemy: CombatEnemyState) => enemy.alive);
      const weaponSegments = [
        ...applyWeaponTypedDamage(state, aliveTargets, cardId),
        ...applyWeaponEffects(state, aliveTargets, cardId),
      ];
      const skillSegments = applyPendingSkillRider(state, aliveTargets);
      return `dealt ${total} total damage.${weaponSegments.length > 0 ? ` ${weaponSegments.join(" ")}` : ""}${skillSegments.length > 0 ? ` ${skillSegments.join(" ")}` : ""}`;
    }
    if (effect.kind === "heal_mercenary") {
      const healed = healEntity(state.mercenary, getWeaponScaledSupportValue(state, effect, cardId, card));
      return `healed the mercenary for ${healed}.`;
    }
    if (effect.kind === "draw") {
      const drew = drawCards(state, effect.value + getPendingSkillDrawBonus(state) + auraBonuses.draw);
      return `drew ${drew} card${drew === 1 ? "" : "s"}.`;
    }
    if (effect.kind === "heal_hero") {
      const healed = healEntity(state.hero, getWeaponScaledSupportValue(state, effect, cardId, card));
      return `healed for ${healed}.`;
    }
    if (effect.kind === "summon_minion") {
      return summonMinion(state, effect);
    }
    return "";
  }

  function summarizeCardEffect(card: CardDefinition, segments: string[]) {
    if (segments.length === 0) {
      return `${card.title} resolved.`;
    }
    return `${card.title}: ${segments.join(" ")}`;
  }

  runtimeWindow.__ROUGE_CARD_EFFECTS = {
    resolveCardEffect,
    summarizeCardEffect,
  };
})();
