(() => {
  const DEFAULT_CATALOG = {
    fortified_patrol: {
      id: "fortified_patrol",
      title: "Fortified Patrol",
      description: "All enemies start with +4 Block.",
      effect: "enemy_block",
      value: 4,
      weight: 1,
      allowedOnBoss: false,
    },
    pressure_front: {
      id: "pressure_front",
      title: "Pressure Front",
      description: "Start battle with +12 Heat.",
      effect: "player_heat",
      value: 12,
      weight: 1,
      allowedOnBoss: true,
    },
    steam_surge: {
      id: "steam_surge",
      title: "Steam Surge",
      description: "Start battle with +1 Steam.",
      effect: "player_energy",
      value: 1,
      weight: 1,
      allowedOnBoss: true,
    },
  };

  function getConfiguredModifier(baseModifier, configById) {
    const config = configById?.[baseModifier.id];
    if (!config || typeof config !== "object" || config.enabled === false) {
      return null;
    }

    const title =
      config && typeof config.title === "string" && config.title.trim() ? config.title.trim() : baseModifier.title;
    const description =
      config && typeof config.description === "string" && config.description.trim()
        ? config.description.trim()
        : baseModifier.description;
    const value =
      config && Number.isFinite(config.value) ? Math.round(config.value) : baseModifier.value;
    const weight =
      config && Number.isFinite(config.weight) ? Math.max(1, Math.floor(config.weight)) : baseModifier.weight;
    const allowedOnBoss =
      config && typeof config.allowedOnBoss === "boolean" ? config.allowedOnBoss : baseModifier.allowedOnBoss;

    return {
      ...baseModifier,
      title,
      description,
      value,
      weight,
      allowedOnBoss,
    };
  }

  function buildEncounterModifierCatalog({ modifierConfig } = {}) {
    const configById = modifierConfig && typeof modifierConfig === "object" ? modifierConfig : null;
    if (!configById) {
      return {};
    }
    return Object.fromEntries(
      Object.values(DEFAULT_CATALOG)
        .map((baseModifier) => getConfiguredModifier(baseModifier, configById))
        .filter(Boolean)
        .map((modifier) => [modifier.id, modifier])
    );
  }

  function buildWeightedPool({ modifierCatalog, includeBossSector = false }) {
    const catalog = modifierCatalog && typeof modifierCatalog === "object" ? modifierCatalog : {};
    const entries = Object.values(catalog).filter((modifier) => {
      if (!modifier || typeof modifier !== "object" || typeof modifier.id !== "string") {
        return false;
      }
      if (includeBossSector) {
        return modifier.allowedOnBoss !== false;
      }
      return true;
    });

    const weightedPool = [];
    entries.forEach((modifier) => {
      const copies = Number.isFinite(modifier.weight) ? Math.max(1, Math.floor(modifier.weight)) : 1;
      for (let index = 0; index < copies; index += 1) {
        weightedPool.push(modifier.id);
      }
    });
    return weightedPool;
  }

  function getRandomEncounterModifier({ sector, modifierCatalog, randomInt }) {
    if (!sector || typeof sector !== "object") {
      return null;
    }

    const weightedPool = buildWeightedPool({
      modifierCatalog,
      includeBossSector: Boolean(sector.boss),
    });

    if (weightedPool.length === 0) {
      return null;
    }

    const nextIndex =
      typeof randomInt === "function"
        ? randomInt(weightedPool.length)
        : Math.floor(Math.random() * weightedPool.length);
    const safeIndex = Number.isInteger(nextIndex)
      ? Math.max(0, Math.min(weightedPool.length - 1, nextIndex))
      : 0;
    const modifierId = weightedPool[safeIndex];
    const modifier = modifierCatalog?.[modifierId];
    return modifier ? { ...modifier } : null;
  }

  function applyEncounterModifier({ game, modifier, clamp, maxHeat }) {
    if (!game || !modifier) {
      return "";
    }

    if (modifier.effect === "enemy_block") {
      const amount = Number.isFinite(modifier.value) ? Math.max(0, Math.round(modifier.value)) : 0;
      if (amount > 0) {
        game.enemies.forEach((enemy) => {
          if (enemy?.alive) {
            enemy.block = Math.max(0, Math.round((enemy.block || 0) + amount));
          }
        });
      }
      return `Mutator active: ${modifier.title} (+${amount} enemy Block).`;
    }

    if (modifier.effect === "player_heat") {
      const amount = Number.isFinite(modifier.value) ? Math.round(modifier.value) : 0;
      const limit = Number.isFinite(maxHeat) ? maxHeat : game.player?.heat;
      if (game.player && Number.isFinite(game.player.heat)) {
        game.player.heat = typeof clamp === "function"
          ? clamp(game.player.heat + amount, 0, limit)
          : game.player.heat + amount;
      }
      const sign = amount >= 0 ? "+" : "";
      return `Mutator active: ${modifier.title} (${sign}${amount} Heat).`;
    }

    if (modifier.effect === "player_energy") {
      const amount = Number.isFinite(modifier.value) ? Math.round(modifier.value) : 0;
      if (game.player && Number.isFinite(game.player.energy)) {
        game.player.energy = Math.max(0, game.player.energy + amount);
      }
      const sign = amount >= 0 ? "+" : "";
      return `Mutator active: ${modifier.title} (${sign}${amount} Steam this turn).`;
    }

    return "";
  }

  window.BRASSLINE_ENCOUNTER_MODIFIERS = {
    buildEncounterModifierCatalog,
    getRandomEncounterModifier,
    applyEncounterModifier,
  };
})();
