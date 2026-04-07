(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function classifyTone(action: CombatLogAction, message: string): CombatLogTone {
    if (action === "death") {
      return "loss";
    }
    if (action === "summon") {
      return "summon";
    }
    if (action === "status_tick") {
      return "status";
    }
    if (action === "modifier" || action === "approach" || action === "setup" || action === "turn_start" || action === "turn_end") {
      return "report";
    }
    const lower = message.toLowerCase();
    if (lower.includes("resurrect") || lower.includes("spawn")) {
      return "summon";
    }
    if (lower.includes("falls") || lower.includes("encounter lost") || lower.includes("explodes") || lower.includes("erupts")) {
      return "loss";
    }
    if (
      lower.includes("burn") || lower.includes("poison") || lower.includes("chill") ||
      lower.includes("freeze") || lower.includes("stun") || lower.includes("paralyze") ||
      lower.includes("amplif") || lower.includes("drain")
    ) {
      return "status";
    }
    if (lower.includes("guard") || lower.includes("heal") || lower.includes("gains")) {
      return "surge";
    }
    if (lower.includes("blinking") || lower.includes("teleport") || lower.includes("flees") || lower.includes("charging")) {
      return "maneuver";
    }
    if (
      action === "card_play" || action === "melee" || action === "skill_use" || action === "intent" || action === "trait"
    ) {
      return "strike";
    }
    return "report";
  }

  function derivePhase(state: CombatState): "setup" | "player" | "enemy" {
    if (!state.phase || state.turn === 0) {
      return "setup";
    }
    if (state.phase === "player") {
      return "player";
    }
    return "enemy";
  }

  function createLogEntry(state: CombatState, params: {
    actor: CombatLogEntry["actor"];
    actorName: string;
    actorId?: string;
    action: CombatLogAction;
    actionId?: string;
    tone?: CombatLogTone;
    message: string;
    effects?: CombatLogEffect[];
  }): CombatLogEntry {
    return {
      turn: state.turn || 0,
      phase: derivePhase(state),
      actor: params.actor,
      actorId: params.actorId,
      actorName: params.actorName,
      action: params.action,
      actionId: params.actionId,
      tone: params.tone || classifyTone(params.action, params.message),
      message: params.message,
      effects: params.effects || [],
    };
  }

  function appendLogEntry(state: CombatState, entry: CombatLogEntry) {
    state.log.unshift(entry);
    state.log = state.log.slice(0, runtimeWindow.ROUGE_LIMITS.COMBAT_LOG_SIZE);
  }

  function appendLog(state: CombatState, message: string) {
    const entry = createLogEntry(state, {
      actor: "environment",
      actorName: "",
      action: "setup",
      message,
    });
    appendLogEntry(state, entry);
  }

  function classifyDefeatCause(state: CombatState): CombatLogDefeatCause | null {
    if (!state.outcome) {
      return "timeout";
    }
    if (state.outcome !== "defeat") {
      return null;
    }
    const entries = state.log;
    if (entries.length === 0) {
      return "unknown";
    }

    const heroLifeHistory: number[] = [];
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      if (entry.action === "turn_start" || entry.action === "turn_end") {
        continue;
      }
      for (const effect of entry.effects) {
        if (effect.target === "hero" && effect.lifeAfter !== undefined) {
          heroLifeHistory.push(effect.lifeAfter);
        }
      }
    }

    if (heroLifeHistory.length >= 2) {
      const lastTwo = heroLifeHistory.slice(-2);
      if (lastTwo[0] > state.hero.maxLife * 0.5 && lastTwo[1] <= 0) {
        return "burst";
      }
    }

    if (!state.mercenary.alive && state.turn > 3) {
      const mercDeathTurn = findMercDeathTurn(entries);
      if (mercDeathTurn > 0 && state.turn - mercDeathTurn >= 3) {
        return "merc_collapse";
      }
    }

    if (state.turn >= 8) {
      return "attrition";
    }

    return "burst";
  }

  function findMercDeathTurn(entries: CombatLogEntry[]): number {
    for (const entry of entries) {
      if (entry.action === "death" && entry.actor === "environment") {
        const lower = entry.message.toLowerCase();
        if (!lower.includes("wanderer") && !lower.includes("encounter lost")) {
          return entry.turn;
        }
      }
    }
    return 0;
  }

  function summarizeCombatLog(state: CombatState): CombatLogSummary {
    const entries = state.log;
    const byActor: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byTone: Record<string, number> = {};
    let heroActions = 0;
    let mercenaryActions = 0;
    let enemyActions = 0;
    let cardsPlayed = 0;
    let skillsUsed = 0;
    let potionsUsed = 0;
    let enemyIntents = 0;
    let deaths = 0;
    let statusEffects = 0;

    for (const entry of entries) {
      byActor[entry.actor] = (byActor[entry.actor] || 0) + 1;
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byTone[entry.tone] = (byTone[entry.tone] || 0) + 1;

      if (entry.actor === "hero") { heroActions += 1; }
      if (entry.actor === "mercenary") { mercenaryActions += 1; }
      if (entry.actor === "enemy") { enemyActions += 1; }
      if (entry.action === "card_play") { cardsPlayed += 1; }
      if (entry.action === "skill_use") { skillsUsed += 1; }
      if (entry.action === "potion") { potionsUsed += 1; }
      if (entry.action === "intent") { enemyIntents += 1; }
      if (entry.action === "death") { deaths += 1; }
      if (entry.tone === "status") { statusEffects += 1; }
    }

    return {
      totalEntries: entries.length,
      totalTurns: state.turn,
      outcome: state.outcome || "timeout",
      defeatCause: classifyDefeatCause(state),
      byActor,
      byAction,
      byTone,
      heroActions,
      mercenaryActions,
      enemyActions,
      cardsPlayed,
      skillsUsed,
      potionsUsed,
      enemyIntents,
      deaths,
      statusEffects,
    };
  }

  runtimeWindow.__ROUGE_COMBAT_LOG = {
    createLogEntry,
    appendLogEntry,
    appendLog,
    summarizeCombatLog,
  };
})();
