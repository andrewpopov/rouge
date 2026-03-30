(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { parseInteger } = runtimeWindow.ROUGE_UTILS;

  const neutralWeaponScaling = {
    getCardProficiency: (_cardId: string) => "",
    getWeaponTypedDamageAmount: (_state: CombatState, entry: WeaponDamageDefinition) => Math.max(1, parseInteger(entry?.amount, 1)),
    getWeaponEffectAmount: (_state: CombatState, effect: WeaponEffectDefinition) => Math.max(1, parseInteger(effect?.amount, 1)),
  };
  const {
    getCardProficiency,
    getWeaponTypedDamageAmount,
    getWeaponEffectAmount,
  } = runtimeWindow.__ROUGE_COMBAT_WEAPON_SCALING || neutralWeaponScaling;

  function weaponProfileEntryMatchesUse(proficiency: string | undefined, cardId: string) {
    if (!proficiency || !cardId) {
      return true;
    }
    return proficiency === getCardProficiency(cardId);
  }

  function weaponEffectMatchesCard(effect: WeaponEffectDefinition, cardId: string) {
    return weaponProfileEntryMatchesUse(effect.proficiency, cardId);
  }

  function applyWeaponTypedDamageToEnemy(
    state: CombatState,
    target: CombatEnemyState,
    damageEntry: WeaponDamageDefinition,
    cardId: string
  ) {
    if (!target?.alive) {
      return null;
    }

    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const amount = getWeaponTypedDamageAmount(state, damageEntry, cardId);
    const dealt = damageEntry.type === "poison"
      ? turns.dealLifeDamage(state, target, amount)
      : turns.dealDamage(state, target, amount, damageEntry.type);
    return { type: damageEntry.type, amount, dealt, targetName: target.name };
  }

  function summarizeWeaponTypedDamage(
    state: CombatState,
    damageEntry: WeaponDamageDefinition,
    results: Array<{ type: WeaponDamageType; amount: number; dealt: number; targetName: string }>
  ) {
    if (results.length === 0) {
      return "";
    }
    const totalDamage = results.reduce((sum, result) => sum + result.dealt, 0);
    if (totalDamage <= 0) {
      return "";
    }
    const weaponLabel = state.weaponName || "Weapon";
    return `${weaponLabel} dealt ${totalDamage} ${damageEntry.type} damage${results.length > 1 ? ` across ${results.length} targets` : ""}.`;
  }

  function applyWeaponTypedDamage(state: CombatState, targets: CombatEnemyState[], cardId: string) {
    const typedDamageEntries = Array.isArray(state.weaponProfile?.typedDamage)
      ? state.weaponProfile.typedDamage.filter((damageEntry) => weaponProfileEntryMatchesUse(damageEntry.proficiency, cardId))
      : [];
    return typedDamageEntries
      .map((damageEntry) => {
        const results = targets
          .map((target) => applyWeaponTypedDamageToEnemy(state, target, damageEntry, cardId))
          .filter(Boolean) as Array<{ type: WeaponDamageType; amount: number; dealt: number; targetName: string }>;
        return summarizeWeaponTypedDamage(state, damageEntry, results);
      })
      .filter(Boolean);
  }

  function applyWeaponEffectToEnemy(state: CombatState, target: CombatEnemyState, effect: WeaponEffectDefinition) {
    if (!target?.alive) {
      return null;
    }

    const turns = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const amount = getWeaponEffectAmount(state, effect);
    if (effect.kind === "burn") {
      target.burn = Math.max(0, target.burn + amount);
      return { kind: effect.kind, amount, guardBroken: 0, lifeBroken: 0, targetName: target.name };
    }
    if (effect.kind === "slow") {
      target.slow = Math.max(0, target.slow + amount);
      return { kind: effect.kind, amount, guardBroken: 0, lifeBroken: 0, targetName: target.name };
    }
    if (effect.kind === "freeze") {
      target.freeze = Math.max(0, target.freeze + amount);
      return { kind: effect.kind, amount, guardBroken: 0, lifeBroken: 0, targetName: target.name };
    }
    if (effect.kind === "shock") {
      target.paralyze = Math.max(0, target.paralyze + amount);
      return { kind: effect.kind, amount, guardBroken: 0, lifeBroken: 0, targetName: target.name };
    }
    if (effect.kind === "crushing") {
      const guardBroken = Math.min(target.guard, amount);
      target.guard = Math.max(0, target.guard - guardBroken);
      const lifeBroken = turns.dealLifeDamage(state, target, amount - guardBroken);
      return { kind: effect.kind, amount, guardBroken, lifeBroken, targetName: target.name };
    }
    return null;
  }

  function summarizeWeaponEffect(
    state: CombatState,
    effect: WeaponEffectDefinition,
    results: Array<{ kind: WeaponEffectKind; amount: number; guardBroken: number; lifeBroken: number; targetName: string }>
  ) {
    if (results.length === 0) {
      return "";
    }

    const weaponLabel = state.weaponName || "Weapon";
    if (effect.kind === "crushing") {
      const totalGuard = results.reduce((sum, result) => sum + result.guardBroken, 0);
      const totalLife = results.reduce((sum, result) => sum + result.lifeBroken, 0);
      const segments = [];
      if (totalGuard > 0) {
        segments.push(`shattered ${totalGuard} Guard`);
      }
      if (totalLife > 0) {
        segments.push(`dealt ${totalLife} crushing damage`);
      }
      if (segments.length === 0) {
        return "";
      }
      return `${weaponLabel} ${segments.join(" and ")}${results.length > 1 ? ` across ${results.length} targets` : ""}.`;
    }

    const statusLabel = effect.kind === "shock"
      ? "Shock"
      : effect.kind.charAt(0).toUpperCase() + effect.kind.slice(1);
    return `${weaponLabel} applied ${results[0].amount} ${statusLabel}${results.length > 1 ? ` to ${results.length} targets` : ""}.`;
  }

  function applyWeaponEffects(state: CombatState, targets: CombatEnemyState[], cardId: string) {
    const effects = Array.isArray(state.weaponProfile?.effects) ? state.weaponProfile.effects.filter((effect) => weaponEffectMatchesCard(effect, cardId)) : [];
    return effects
      .map((effect) => {
        const results = targets
          .map((target) => applyWeaponEffectToEnemy(state, target, effect))
          .filter(Boolean) as Array<{ kind: WeaponEffectKind; amount: number; guardBroken: number; lifeBroken: number; targetName: string }>;
        return summarizeWeaponEffect(state, effect, results);
      })
      .filter(Boolean);
  }

  runtimeWindow.__ROUGE_COMBAT_WEAPON_EFFECTS = {
    applyWeaponTypedDamage,
    applyWeaponEffects,
  };
})();
