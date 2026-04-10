(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Minion classification ─────────────────────────────────────────────────────
  // Single source of truth for trap/creature/support/tank classification.

  const TRAP_ACTION_KINDS = new Set(["attack_all_burn", "attack_all_paralyze"]);
  const TRAP_ID_TOKENS = ["sentry", "wake_of", "trap", "sentinel"];
  const SUPPORT_ACTION_KINDS = new Set(["heal_party"]);
  const TANK_ACTION_KINDS = new Set(["attack_guard_party", "buff_mercenary_guard_party"]);

  function isTrapTemplate(template: { actionKind: string; id: string }): boolean {
    return TRAP_ACTION_KINDS.has(template.actionKind)
      || TRAP_ID_TOKENS.some((token) => template.id.includes(token));
  }

  function isSupportTemplate(template: { actionKind: string }): boolean {
    return SUPPORT_ACTION_KINDS.has(template.actionKind);
  }

  function isTankTemplate(template: { actionKind: string }): boolean {
    return TANK_ACTION_KINDS.has(template.actionKind);
  }

  /** Trap or support — these share the "device" cap and get invulnerable. */
  function isDeviceTemplate(template: { actionKind: string; id: string }): boolean {
    return isTrapTemplate(template) || isSupportTemplate(template);
  }

  /** Runtime check on a live minion (uses invulnerable flag + id/actionKind). */
  function isTrapLikeMinion(minion: { invulnerable?: boolean; actionKind: string; templateId: string }): boolean {
    return Boolean(minion.invulnerable)
      && (TRAP_ACTION_KINDS.has(minion.actionKind)
        || minion.templateId.includes("sentry")
        || minion.templateId.includes("wake")
        || minion.templateId.includes("trap")
        || minion.templateId.includes("sentinel"));
  }

  // ── Status helpers ────────────────────────────────────────────────────────────

  const ALL_STATUSES: readonly string[] = ["burn", "poison", "slow", "freeze", "stun", "paralyze"];

  /** Apply a status amount to an enemy. Stun is capped at the given value; others accumulate. */
  function applyStatus(enemy: CombatEnemyState, status: string, amount: number): void {
    if (status === "stun") {
      enemy.stun = Math.max(0, amount);
    } else if (status === "burn") {
      enemy.burn = Math.max(0, enemy.burn + amount);
    } else if (status === "poison") {
      enemy.poison = Math.max(0, enemy.poison + amount);
    } else if (status === "slow") {
      enemy.slow = Math.max(0, enemy.slow + amount);
    } else if (status === "freeze") {
      enemy.freeze = Math.max(0, enemy.freeze + amount);
    } else if (status === "paralyze") {
      enemy.paralyze = Math.max(0, enemy.paralyze + amount);
    }
  }

  /** Clear all six statuses to zero. */
  function clearAllStatuses(enemy: CombatEnemyState): void {
    enemy.burn = 0;
    enemy.poison = 0;
    enemy.slow = 0;
    enemy.freeze = 0;
    enemy.stun = 0;
    enemy.paralyze = 0;
  }

  /** Clear hard crowd-control statuses only (slow, freeze, stun, paralyze). */
  function clearCrowdControl(enemy: CombatEnemyState): void {
    enemy.slow = 0;
    enemy.freeze = 0;
    enemy.stun = 0;
    enemy.paralyze = 0;
  }

  // ── Guard calculation helpers ─────────────────────────────────────────────────

  /** Standard intent guard formula: secondaryValue if present, else ceil(value / divisor) with a floor of 2. */
  function calculateIntentGuard(intentValue: number, secondaryValue: number | undefined, divisor = 2): number {
    return secondaryValue || Math.max(2, Math.ceil(intentValue / divisor));
  }

  /** Standard intent heal formula: secondaryValue if present, else ceil(dealt / 2) with a floor of 1. */
  function calculateIntentHeal(dealt: number, secondaryValue: number | undefined): number {
    return secondaryValue || Math.max(1, Math.ceil(dealt / 2));
  }

  runtimeWindow.__ROUGE_COMBAT_UTILS = {
    isTrapTemplate,
    isSupportTemplate,
    isTankTemplate,
    isDeviceTemplate,
    isTrapLikeMinion,
    ALL_STATUSES,
    applyStatus,
    clearAllStatuses,
    clearCrowdControl,
    calculateIntentGuard,
    calculateIntentHeal,
  };
})();
