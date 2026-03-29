(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { parseInteger } = runtimeWindow.ROUGE_UTILS;

  const WEAPON_SCALING_POLICY = {
    preferredWeaponCardBonus: 1,
    weaponSupportBaselineBonus: 1,
    preferredWeaponEffectBonus: 1,
    preferredWeaponMeleeBonus: 4,
  } as const;

  function getCardProficiency(cardId: string) {
    return runtimeWindow.__ROUGE_SKILL_EVOLUTION?.getCardProficiency?.(cardId) ||
      runtimeWindow.__ROUGE_SKILL_EVOLUTION?.getCardTree?.(cardId) ||
      "";
  }

  function hasPreferredWeaponFamily(state: CombatState) {
    const preferred = Array.isArray(state.classPreferredFamilies) ? state.classPreferredFamilies : [];
    return preferred.includes(state.weaponFamily || "");
  }

  function getWeaponProfileBonus(
    entries: Record<string, number> | null | undefined,
    cardId: string
  ) {
    const proficiency = getCardProficiency(cardId);
    if (!proficiency) {
      return 0;
    }
    const baseBonus = Math.max(0, parseInteger(entries?.[proficiency], 0));
    if (baseBonus <= 0) {
      return 0;
    }
    return baseBonus;
  }

  function normalizeWeaponAttackValue(value: number) {
    const normalized = Math.max(0, parseInteger(value, 0));
    if (normalized <= 0) {
      return 0;
    }
    return Math.max(1, Math.ceil(normalized / 2));
  }

  function getWeaponAttackBonus(state: CombatState, cardId: string) {
    const baseBonus = normalizeWeaponAttackValue(getWeaponProfileBonus(state.weaponProfile?.attackDamageByProficiency, cardId));
    if (baseBonus <= 0) {
      return 0;
    }
    return baseBonus + (hasPreferredWeaponFamily(state) ? WEAPON_SCALING_POLICY.preferredWeaponCardBonus : 0);
  }

  function getWeaponSupportBonus(state: CombatState, cardId: string) {
    const baseBonus = getWeaponProfileBonus(state.weaponProfile?.supportValueByProficiency, cardId);
    if (baseBonus <= 0) {
      return 0;
    }
    return baseBonus +
      WEAPON_SCALING_POLICY.weaponSupportBaselineBonus +
      (hasPreferredWeaponFamily(state) ? WEAPON_SCALING_POLICY.preferredWeaponCardBonus : 0);
  }

  function getWeaponTypedDamageAmount(state: CombatState, entry: WeaponDamageDefinition, cardId: string) {
    const rawAmount = Math.max(1, parseInteger(entry.amount, 1));
    const baseAmount = cardId ? normalizeWeaponAttackValue(rawAmount) : rawAmount;
    const preferredBonus = hasPreferredWeaponFamily(state)
      ? (cardId ? WEAPON_SCALING_POLICY.preferredWeaponCardBonus : 0) + WEAPON_SCALING_POLICY.preferredWeaponEffectBonus
      : 0;
    return Math.max(1, baseAmount + preferredBonus);
  }

  function getWeaponEffectAmount(state: CombatState, effect: WeaponEffectDefinition) {
    return Math.max(
      1,
      parseInteger(effect.amount, 1) + (hasPreferredWeaponFamily(state) ? WEAPON_SCALING_POLICY.preferredWeaponEffectBonus : 0)
    );
  }

  function getMeleeDamage(state: CombatState) {
    const baseDamage = Math.max(1, state.weaponDamageBonus || 0);
    let damage = hasPreferredWeaponFamily(state)
      ? baseDamage + WEAPON_SCALING_POLICY.preferredWeaponMeleeBonus
      : baseDamage;
    if (state.hero.weaken > 0) {
      damage = Math.max(1, Math.floor(damage * 0.7));
    }
    return damage;
  }

  runtimeWindow.__ROUGE_COMBAT_WEAPON_SCALING = {
    WEAPON_SCALING_POLICY,
    getCardProficiency,
    hasPreferredWeaponFamily,
    getWeaponAttackBonus,
    getWeaponSupportBonus,
    getWeaponTypedDamageAmount,
    getWeaponEffectAmount,
    getMeleeDamage,
  };
})();
