(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({})) as Window;

  const BONUS_KIND = {
    GUARD: "guard",
    GUARD_BONUS: "guard_bonus",
    DAMAGE: "damage",
    BURN_BONUS: "burn_bonus",
    DRAW: "draw",
    ENERGY: "energy",
    POTION: "potion",
  } as const;

  type ApproachKind = "cautious" | "aggressive" | "tactical";

  // Each entry: [bonusKind, value, display label]
  const BONUS_POOL: Record<ApproachKind, [string, number, string][]> = {
    cautious: [
      [BONUS_KIND.GUARD, 5, "+5 Guard"],
      [BONUS_KIND.GUARD, 8, "+8 Guard"],
      [BONUS_KIND.GUARD_BONUS, 1, "+1 Guard per card"],
      [BONUS_KIND.POTION, 1, "+1 Potion"],
    ],
    aggressive: [
      [BONUS_KIND.DAMAGE, 1, "+1 Damage"],
      [BONUS_KIND.DAMAGE, 2, "+2 Damage"],
      [BONUS_KIND.DAMAGE, 3, "+3 Damage"],
      [BONUS_KIND.BURN_BONUS, 1, "+1 Burn per card"],
    ],
    tactical: [
      [BONUS_KIND.DRAW, 1, "+1 Card drawn"],
      [BONUS_KIND.DRAW, 2, "+2 Cards drawn"],
      [BONUS_KIND.ENERGY, 1, "+1 Energy"],
      [BONUS_KIND.ENERGY, 2, "+2 Energy"],
    ],
  };

  function pickBonus(approach: string, seed: number): { id: string; label: string } {
    const key = (approach === "cautious" || approach === "aggressive" || approach === "tactical")
      ? approach : "cautious";
    const pool = BONUS_POOL[key];
    const index = ((seed * 31 + key.charCodeAt(0)) >>> 0) % pool.length;
    const [kind, value, label] = pool[index];
    return { id: `${kind}:${value}`, label };
  }

  function applyBonus(combat: CombatState, bonusId: string): void {
    if (!combat || !combat.hero) {
      // eslint-disable-next-line no-console
      if (typeof console !== "undefined") { console.warn("[approach-bonus] applyBonus called with invalid combat state"); }
      return;
    }
    const { applyGuard, appendLog, drawCards } = runtimeWindow.__ROUGE_COMBAT_ENGINE_TURNS;
    const [kind, rawVal] = bonusId.split(":");
    const v = parseInt(rawVal, 10) || 0;

    switch (kind) {
      case BONUS_KIND.GUARD:
        applyGuard(combat.hero, v);
        appendLog(combat, `Careful approach. +${v} Guard.`);
        break;
      case BONUS_KIND.GUARD_BONUS:
        combat.hero.guardBonus += v;
        appendLog(combat, `Fortified stance. +${v} Guard per card.`);
        break;
      case BONUS_KIND.DAMAGE:
        combat.hero.damageBonus += v;
        appendLog(combat, `Aggressive charge. +${v} Damage.`);
        break;
      case BONUS_KIND.BURN_BONUS:
        combat.hero.burnBonus += v;
        appendLog(combat, `Infernal preparation. +${v} Burn per card.`);
        break;
      case BONUS_KIND.DRAW:
        drawCards(combat, v);
        appendLog(combat, `Tactical insight. Drew ${v} extra card${v > 1 ? "s" : ""}.`);
        break;
      case BONUS_KIND.ENERGY:
        combat.hero.energy += v;
        appendLog(combat, `Strategic positioning. +${v} Energy.`);
        break;
      case BONUS_KIND.POTION:
        combat.potions += v;
        appendLog(combat, `Scavenged supplies. +${v} Potion.`);
        break;
    }
  }

  runtimeWindow.__ROUGE_APPROACH_BONUS = { pickBonus, applyBonus };
})();
