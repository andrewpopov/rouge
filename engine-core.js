(() => {
  const PHASES = {
    RUN_SETUP: "run_setup",
    CHARACTER_SELECT: "character_select",
    SAFE_ZONE: "safe_zone",
    WORLD_MAP: "world_map",
    ENCOUNTER: "encounter",
    REWARD: "reward",
    ACT_TRANSITION: "act_transition",
    RUN_COMPLETE: "run_complete",
    RUN_FAILED: "run_failed",
  };

  const COMBAT_SUBPHASES = {
    PLAYER_TURN: "player_turn",
    ENEMY_RESOLVE: "enemy_resolve",
  };

  const PHASE_VALUES = new Set(Object.values(PHASES));
  const COMBAT_SUBPHASE_VALUES = new Set(Object.values(COMBAT_SUBPHASES));

  const DEFAULT_PHASE_TRANSITIONS = {
    [PHASES.RUN_SETUP]: [
      PHASES.CHARACTER_SELECT,
      PHASES.SAFE_ZONE,
      PHASES.WORLD_MAP,
      PHASES.ENCOUNTER,
      PHASES.REWARD,
      PHASES.ACT_TRANSITION,
      PHASES.RUN_COMPLETE,
      PHASES.RUN_FAILED,
    ],
    [PHASES.CHARACTER_SELECT]: [PHASES.SAFE_ZONE, PHASES.WORLD_MAP, PHASES.ENCOUNTER, PHASES.RUN_SETUP],
    [PHASES.SAFE_ZONE]: [PHASES.WORLD_MAP, PHASES.ENCOUNTER, PHASES.CHARACTER_SELECT, PHASES.RUN_SETUP],
    [PHASES.WORLD_MAP]: [
      PHASES.ENCOUNTER,
      PHASES.REWARD,
      PHASES.ACT_TRANSITION,
      PHASES.RUN_COMPLETE,
      PHASES.RUN_FAILED,
      PHASES.SAFE_ZONE,
    ],
    [PHASES.ENCOUNTER]: [
      PHASES.REWARD,
      PHASES.WORLD_MAP,
      PHASES.ACT_TRANSITION,
      PHASES.RUN_COMPLETE,
      PHASES.RUN_FAILED,
    ],
    [PHASES.REWARD]: [
      PHASES.WORLD_MAP,
      PHASES.ENCOUNTER,
      PHASES.ACT_TRANSITION,
      PHASES.RUN_COMPLETE,
      PHASES.RUN_FAILED,
    ],
    [PHASES.ACT_TRANSITION]: [
      PHASES.WORLD_MAP,
      PHASES.ENCOUNTER,
      PHASES.REWARD,
      PHASES.RUN_COMPLETE,
      PHASES.RUN_FAILED,
    ],
    [PHASES.RUN_COMPLETE]: [
      PHASES.RUN_SETUP,
      PHASES.CHARACTER_SELECT,
      PHASES.SAFE_ZONE,
      PHASES.WORLD_MAP,
      PHASES.ENCOUNTER,
    ],
    [PHASES.RUN_FAILED]: [
      PHASES.RUN_SETUP,
      PHASES.CHARACTER_SELECT,
      PHASES.SAFE_ZONE,
      PHASES.WORLD_MAP,
      PHASES.ENCOUNTER,
    ],
  };

  function normalizePhase(value) {
    if (typeof value !== "string") {
      return "";
    }
    const normalized = value.trim().toLowerCase();
    return PHASE_VALUES.has(normalized) ? normalized : "";
  }

  function normalizeCombatSubphase(value) {
    if (typeof value !== "string") {
      return "";
    }
    const normalized = value.trim().toLowerCase();
    return COMBAT_SUBPHASE_VALUES.has(normalized) ? normalized : "";
  }

  function normalizeTransitionMap(transitions) {
    const source = transitions && typeof transitions === "object" ? transitions : DEFAULT_PHASE_TRANSITIONS;
    const normalizedMap = {};

    Object.entries(source).forEach(([from, rawTargets]) => {
      const normalizedFrom = normalizePhase(from);
      if (!normalizedFrom) {
        return;
      }
      if (!Array.isArray(normalizedMap[normalizedFrom])) {
        normalizedMap[normalizedFrom] = [];
      }
      (Array.isArray(rawTargets) ? rawTargets : []).forEach((target) => {
        const normalizedTo = normalizePhase(target);
        if (!normalizedTo || normalizedMap[normalizedFrom].includes(normalizedTo)) {
          return;
        }
        normalizedMap[normalizedFrom].push(normalizedTo);
      });
    });

    if (Object.keys(normalizedMap).length > 0) {
      return normalizedMap;
    }

    const fallback = {};
    Object.entries(DEFAULT_PHASE_TRANSITIONS).forEach(([from, targets]) => {
      fallback[from] = [...targets];
    });
    return fallback;
  }

  function createPhaseController({
    initialPhase = PHASES.RUN_SETUP,
    transitions = DEFAULT_PHASE_TRANSITIONS,
    onTransition = null,
    maxHistoryEntries = 300,
  } = {}) {
    const transitionMap = normalizeTransitionMap(transitions);
    let phase = normalizePhase(initialPhase) || PHASES.RUN_SETUP;
    const history = [];
    const historyLimitRaw = Number.parseInt(maxHistoryEntries, 10);
    const historyLimit = Number.isInteger(historyLimitRaw) && historyLimitRaw > 0 ? historyLimitRaw : 300;

    function canTransition(nextPhase) {
      const normalizedNext = normalizePhase(nextPhase);
      if (!normalizedNext) {
        return false;
      }
      if (normalizedNext === phase) {
        return true;
      }
      const allowed = Array.isArray(transitionMap[phase]) ? transitionMap[phase] : [];
      return allowed.includes(normalizedNext);
    }

    function setPhase(nextPhase, { reason = "", metadata = null, force = false } = {}) {
      const normalizedNext = normalizePhase(nextPhase);
      if (!normalizedNext) {
        return {
          ok: false,
          changed: false,
          from: phase,
          to: phase,
          reason: "invalid_target_phase",
        };
      }
      if (normalizedNext === phase) {
        return {
          ok: true,
          changed: false,
          from: phase,
          to: phase,
          reason: "noop",
        };
      }
      if (!force && !canTransition(normalizedNext)) {
        return {
          ok: false,
          changed: false,
          from: phase,
          to: phase,
          reason: "invalid_transition",
        };
      }

      const from = phase;
      phase = normalizedNext;
      const entry = {
        from,
        to: normalizedNext,
        reason: typeof reason === "string" ? reason : "",
        metadata: metadata && typeof metadata === "object" ? { ...metadata } : null,
        timestampMs: Date.now(),
      };
      history.push(entry);
      if (history.length > historyLimit) {
        history.splice(0, history.length - historyLimit);
      }
      if (typeof onTransition === "function") {
        onTransition(entry);
      }
      return {
        ok: true,
        changed: true,
        from,
        to: normalizedNext,
      };
    }

    function getPhase() {
      return phase;
    }

    function getHistory() {
      return history.map((entry) => ({ ...entry }));
    }

    return {
      canTransition,
      setPhase,
      getPhase,
      getHistory,
      transitionMap,
    };
  }

  function createActionLoop({ onError = null, maxDepth = 200 } = {}) {
    const queue = [];
    let running = false;
    let processed = 0;
    const maxDepthRaw = Number.parseInt(maxDepth, 10);
    const maxDepthValue = Number.isInteger(maxDepthRaw) && maxDepthRaw > 0 ? maxDepthRaw : 200;

    function pump() {
      if (running) {
        return;
      }
      running = true;
      let guard = 0;
      while (queue.length > 0 && guard < maxDepthValue) {
        guard += 1;
        const action = queue.shift();
        if (!action || typeof action.execute !== "function") {
          continue;
        }
        try {
          action.execute();
          processed += 1;
        } catch (error) {
          if (typeof onError === "function") {
            onError(error, action.id || "action");
          } else {
            throw error;
          }
        }
      }
      running = false;
    }

    function dispatch(actionId, execute) {
      if (typeof execute !== "function") {
        return false;
      }
      queue.push({
        id: typeof actionId === "string" && actionId.trim() ? actionId.trim() : "action",
        execute,
      });
      pump();
      return true;
    }

    function getStats() {
      return {
        running,
        processed,
        pending: queue.length,
      };
    }

    return {
      dispatch,
      pump,
      getStats,
    };
  }

  function createRenderLoop({ onRender = null } = {}) {
    let renderCount = 0;
    let lastReason = "";

    function requestRender(reason = "") {
      renderCount += 1;
      lastReason = typeof reason === "string" ? reason : "";
      if (typeof onRender === "function") {
        onRender({
          reason: lastReason,
          renderCount,
          timestampMs: Date.now(),
        });
      }
    }

    function getStats() {
      return {
        renderCount,
        lastReason,
      };
    }

    return {
      requestRender,
      getStats,
    };
  }

  function createGameEngine({
    game,
    initialPhase = PHASES.RUN_SETUP,
    transitions = DEFAULT_PHASE_TRANSITIONS,
    onTransition = null,
    onRender = null,
    onError = null,
  } = {}) {
    const phaseController = createPhaseController({
      initialPhase,
      transitions,
      onTransition: (entry) => {
        if (game && typeof game === "object") {
          game.phase = entry.to;
        }
        if (typeof onTransition === "function") {
          onTransition(entry);
        }
      },
    });
    const actionLoop = createActionLoop({
      onError,
    });
    const renderLoop = createRenderLoop({
      onRender,
    });

    const startingPhase = normalizePhase(game?.phase) || phaseController.getPhase();
    phaseController.setPhase(startingPhase, {
      force: true,
      reason: "hydrate_phase",
    });

    function transition(nextPhase, reason = "", metadata = null, force = false) {
      const result = phaseController.setPhase(nextPhase, {
        reason,
        metadata,
        force: Boolean(force),
      });
      if (result.ok && result.changed) {
        renderLoop.requestRender(`phase:${result.to}`);
      }
      return result;
    }

    function dispatch(actionId, execute) {
      return actionLoop.dispatch(actionId, () => {
        execute();
        renderLoop.requestRender(`action:${actionId}`);
      });
    }

    function getDiagnostics() {
      return {
        phase: phaseController.getPhase(),
        historyLength: phaseController.getHistory().length,
        actionLoop: actionLoop.getStats(),
        renderLoop: renderLoop.getStats(),
      };
    }

    return {
      transition,
      canTransition: phaseController.canTransition,
      getPhase: phaseController.getPhase,
      getPhaseHistory: phaseController.getHistory,
      dispatch,
      requestRender: renderLoop.requestRender,
      getDiagnostics,
      phaseTransitions: phaseController.transitionMap,
    };
  }

  window.BRASSLINE_ENGINE_CORE = {
    PHASES,
    COMBAT_SUBPHASES,
    DEFAULT_PHASE_TRANSITIONS,
    normalizePhase,
    normalizeCombatSubphase,
    createPhaseController,
    createActionLoop,
    createRenderLoop,
    createGameEngine,
  };
})();
