(() => {
  const DEFAULT_REWARD_TREE_CATALOG = {
    ashmarked_resolve: {
      id: "ashmarked_resolve",
      title: "Ashmarked Resolve",
      description: "Gain +4 Max Hull.",
      icon: "./assets/curated/themes/diablo-inspired/icons/ui/block_chest-armor.svg",
      requirements: {
        sectorsCleared: 1,
      },
      effects: {
        max_hull_bonus: 4,
      },
      prereq: [],
    },
    hunter_ward: {
      id: "hunter_ward",
      title: "Hunter Ward",
      description: "Gain +2 turn-start Block.",
      icon: "./assets/curated/themes/diablo-inspired/icons/ui/alert_death-skull.svg",
      requirements: {
        flawlessClears: 1,
      },
      effects: {
        turn_start_block_bonus: 2,
      },
      prereq: ["ashmarked_resolve"],
    },
    blood_rite: {
      id: "blood_rite",
      title: "Blood Rite",
      description: "Gain +1 turn-start Steam.",
      icon: "./assets/curated/themes/diablo-inspired/icons/ui/energy_chalice-drops.svg",
      requirements: {
        bossKills: 1,
      },
      effects: {
        turn_start_energy_bonus: 1,
      },
      prereq: ["ashmarked_resolve"],
    },
    infernal_focus: {
      id: "infernal_focus",
      title: "Infernal Focus",
      description: "Gain +2 turn-start cooling.",
      icon: "./assets/curated/themes/diablo-inspired/icons/ui/heat_burning-eye.svg",
      requirements: {
        speedClears: 1,
      },
      effects: {
        turn_start_cooling_bonus: 2,
      },
      prereq: ["ashmarked_resolve"],
    },
    slayer_crown: {
      id: "slayer_crown",
      title: "Slayer Crown",
      description: "Attack cards deal +2 damage.",
      icon: "./assets/curated/themes/diablo-inspired/icons/ui/turn_grim-reaper.svg",
      requirements: {
        bossKills: 2,
        sectorsCleared: 8,
      },
      effects: {
        attack_flat_bonus: 2,
      },
      prereq: ["blood_rite", "hunter_ward"],
    },
  };

  const OBJECTIVE_KEYS = ["sectorsCleared", "bossKills", "flawlessClears", "speedClears"];

  function cloneRewardTreeCatalog(catalog = DEFAULT_REWARD_TREE_CATALOG) {
    const source = catalog && typeof catalog === "object" ? Object.values(catalog) : [];
    return Object.fromEntries(
      source
        .filter((node) => node && typeof node === "object" && typeof node.id === "string")
        .map((node) => [
          node.id,
          {
            ...node,
            requirements: {
              ...(node.requirements && typeof node.requirements === "object" ? node.requirements : {}),
            },
            effects: {
              ...(node.effects && typeof node.effects === "object" ? node.effects : {}),
            },
            prereq: Array.isArray(node.prereq)
              ? node.prereq.filter((entry) => typeof entry === "string" && entry.trim())
              : [],
          },
        ])
    );
  }

  function createDefaultRewardTreeState() {
    return {
      objectives: {
        sectorsCleared: 0,
        bossKills: 0,
        flawlessClears: 0,
        speedClears: 0,
      },
      unlockedNodeIds: [],
    };
  }

  function sanitizeObjectives(rawObjectives = {}) {
    const fallback = createDefaultRewardTreeState().objectives;
    const source = rawObjectives && typeof rawObjectives === "object" ? rawObjectives : {};
    OBJECTIVE_KEYS.forEach((key) => {
      const value = Number.parseInt(source[key], 10);
      fallback[key] = Number.isInteger(value) ? Math.max(0, value) : 0;
    });
    return fallback;
  }

  function sanitizeRewardTreeState({ rewardTreeCatalog, rawState }) {
    const fallback = createDefaultRewardTreeState();
    const source = rawState && typeof rawState === "object" ? rawState : {};
    const allowedNodes = new Set(Object.keys(rewardTreeCatalog || {}));
    const unlockedNodeIds = [...new Set((Array.isArray(source.unlockedNodeIds) ? source.unlockedNodeIds : [])
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id) => id && allowedNodes.has(id)))];
    return {
      objectives: sanitizeObjectives(source.objectives),
      unlockedNodeIds,
    };
  }

  function meetsObjectiveRequirements({ state, node }) {
    const reqs = node?.requirements && typeof node.requirements === "object" ? node.requirements : {};
    return OBJECTIVE_KEYS.every((key) => {
      const requiredRaw = Number.parseInt(reqs[key], 10);
      if (!Number.isInteger(requiredRaw) || requiredRaw <= 0) {
        return true;
      }
      const current = Number.parseInt(state?.objectives?.[key], 10);
      return Number.isInteger(current) && current >= requiredRaw;
    });
  }

  function meetsNodePrereq({ state, node }) {
    const unlocked = new Set(Array.isArray(state?.unlockedNodeIds) ? state.unlockedNodeIds : []);
    const prereq = Array.isArray(node?.prereq) ? node.prereq : [];
    return prereq.every((nodeId) => unlocked.has(nodeId));
  }

  function applyObjectiveProgress({ rewardTreeCatalog, state, delta }) {
    const normalizedState = sanitizeRewardTreeState({
      rewardTreeCatalog,
      rawState: state,
    });
    const progressDelta = delta && typeof delta === "object" ? delta : {};
    const objectives = { ...normalizedState.objectives };
    OBJECTIVE_KEYS.forEach((key) => {
      const amountRaw = Number.parseInt(progressDelta[key], 10);
      if (!Number.isInteger(amountRaw) || amountRaw === 0) {
        return;
      }
      objectives[key] = Math.max(0, objectives[key] + amountRaw);
    });

    const unlockedNodeIds = [...normalizedState.unlockedNodeIds];
    const unlockedSet = new Set(unlockedNodeIds);
    const newlyUnlockedNodes = [];
    let changed = true;
    while (changed) {
      changed = false;
      Object.values(rewardTreeCatalog || {}).forEach((node) => {
        if (!node || typeof node !== "object" || typeof node.id !== "string") {
          return;
        }
        if (unlockedSet.has(node.id)) {
          return;
        }
        if (!meetsObjectiveRequirements({ state: { objectives }, node })) {
          return;
        }
        if (!meetsNodePrereq({ state: { unlockedNodeIds }, node })) {
          return;
        }
        unlockedNodeIds.push(node.id);
        unlockedSet.add(node.id);
        newlyUnlockedNodes.push(node);
        changed = true;
      });
    }

    return {
      state: {
        objectives,
        unlockedNodeIds,
      },
      newlyUnlockedNodes,
    };
  }

  function getUnlockedNodes({ rewardTreeCatalog, state }) {
    const normalizedState = sanitizeRewardTreeState({
      rewardTreeCatalog,
      rawState: state,
    });
    return normalizedState.unlockedNodeIds
      .map((nodeId) => rewardTreeCatalog?.[nodeId])
      .filter(Boolean);
  }

  function getRewardTreeBonus({ rewardTreeCatalog, state, effectId }) {
    if (typeof effectId !== "string" || !effectId.trim()) {
      return 0;
    }
    return getUnlockedNodes({ rewardTreeCatalog, state }).reduce((sum, node) => {
      const value = Number.parseInt(node?.effects?.[effectId], 10);
      return Number.isInteger(value) ? sum + Math.max(0, value) : sum;
    }, 0);
  }

  function formatNodeRequirementLabel({ node, objectives }) {
    const reqs = node?.requirements && typeof node.requirements === "object" ? node.requirements : {};
    const objectiveState = objectives && typeof objectives === "object" ? objectives : {};
    const parts = [];
    OBJECTIVE_KEYS.forEach((key) => {
      const needRaw = Number.parseInt(reqs[key], 10);
      if (!Number.isInteger(needRaw) || needRaw <= 0) {
        return;
      }
      const haveRaw = Number.parseInt(objectiveState[key], 10);
      const have = Number.isInteger(haveRaw) ? Math.max(0, haveRaw) : 0;
      if (key === "sectorsCleared") {
        parts.push(`Sectors ${have}/${needRaw}`);
      } else if (key === "bossKills") {
        parts.push(`Boss Kills ${have}/${needRaw}`);
      } else if (key === "flawlessClears") {
        parts.push(`Flawless ${have}/${needRaw}`);
      } else if (key === "speedClears") {
        parts.push(`Speed Clears ${have}/${needRaw}`);
      }
    });
    const prereq = Array.isArray(node?.prereq) ? node.prereq : [];
    if (prereq.length > 0) {
      parts.push(`Prereq ${prereq.length}`);
    }
    return parts.join(" // ");
  }

  window.BRASSLINE_REWARD_TREE = {
    cloneRewardTreeCatalog,
    createDefaultRewardTreeState,
    sanitizeRewardTreeState,
    applyObjectiveProgress,
    getUnlockedNodes,
    getRewardTreeBonus,
    formatNodeRequirementLabel,
  };
})();
