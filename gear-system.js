(() => {
  const DEFAULT_GEAR_CATALOG = {
    nightfang_blade: {
      id: "nightfang_blade",
      title: "Nightfang Blade",
      slot: "weapon",
      icon: "./assets/curated/themes/diablo-inspired/icons/cards/03_broadsword.svg",
      rarity: "common",
      weight: 3,
      description: "Attack cards deal +2 damage.",
      effects: {
        attack_flat_bonus: 2,
      },
    },
    bone_mace: {
      id: "bone_mace",
      title: "Bone Mace",
      slot: "weapon",
      icon: "./assets/curated/themes/diablo-inspired/icons/cards/20_bone-mace.svg",
      rarity: "uncommon",
      weight: 2,
      description: "Attack cards deal +3 damage.",
      effects: {
        attack_flat_bonus: 3,
      },
    },
    bloodmail_plate: {
      id: "bloodmail_plate",
      title: "Bloodmail Plate",
      slot: "armor",
      icon: "./assets/curated/themes/diablo-inspired/icons/cards/18_chest-armor.svg",
      rarity: "common",
      weight: 3,
      description: "Gain +6 Max Hull and +1 turn-start Block.",
      effects: {
        max_hull_bonus: 6,
        turn_start_block_bonus: 1,
      },
    },
    cryptguard_cuirass: {
      id: "cryptguard_cuirass",
      title: "Cryptguard Cuirass",
      slot: "armor",
      icon: "./assets/curated/themes/diablo-inspired/icons/cards/13_armor-upgrade.svg",
      rarity: "rare",
      weight: 1,
      description: "Gain +8 Max Hull and +2 turn-start Block.",
      effects: {
        max_hull_bonus: 8,
        turn_start_block_bonus: 2,
      },
    },
    ember_relic: {
      id: "ember_relic",
      title: "Ember Relic",
      slot: "trinket",
      icon: "./assets/curated/themes/diablo-inspired/icons/cards/10_burning-embers.svg",
      rarity: "uncommon",
      weight: 2,
      description: "Gain +2 turn-start cooling and +1 reward heal.",
      effects: {
        turn_start_cooling_bonus: 2,
        reward_heal_bonus: 1,
      },
    },
    soul_chalice: {
      id: "soul_chalice",
      title: "Soul Chalice",
      slot: "trinket",
      icon: "./assets/curated/themes/diablo-inspired/icons/cards/07_chalice-drops.svg",
      rarity: "rare",
      weight: 1,
      description: "Gain +1 turn-start Steam and overclock heat -3.",
      effects: {
        turn_start_energy_bonus: 1,
        overclock_heat_reduction: 3,
      },
    },
    blackroad_glaive: {
      id: "blackroad_glaive",
      title: "Blackroad Glaive",
      slot: "weapon",
      icon: "./assets/curated/themes/diablo-inspired/icons/cards/03_broadsword.svg",
      rarity: "rare",
      weight: 0,
      questOnly: true,
      description: "Quest relic: Attack cards deal +5 damage and start each turn with +1 Steam.",
      effects: {
        attack_flat_bonus: 5,
        turn_start_energy_bonus: 1,
      },
    },
    reliquary_heart: {
      id: "reliquary_heart",
      title: "Reliquary Heart",
      slot: "trinket",
      icon: "./assets/curated/themes/diablo-inspired/icons/cards/07_chalice-drops.svg",
      rarity: "rare",
      weight: 0,
      questOnly: true,
      description: "Quest relic: Gain +3 turn-start cooling and +2 reward heal.",
      effects: {
        turn_start_cooling_bonus: 3,
        reward_heal_bonus: 2,
      },
    },
  };

  function cloneGearCatalog(catalog = DEFAULT_GEAR_CATALOG) {
    const source = catalog && typeof catalog === "object" ? Object.values(catalog) : [];
    return Object.fromEntries(
      source
        .filter((gear) => gear && typeof gear === "object" && typeof gear.id === "string")
        .map((gear) => [
          gear.id,
          {
            ...gear,
            questOnly: Boolean(gear.questOnly),
            effects: {
              ...(gear.effects && typeof gear.effects === "object" ? gear.effects : {}),
            },
          },
        ])
    );
  }

  function createDefaultRunGearState() {
    return {
      gearInventory: [],
      equippedGear: {
        weapon: "",
        armor: "",
        trinket: "",
      },
    };
  }

  function sanitizeGearInventory({ gearCatalog, gearInventory }) {
    const allowed = new Set(Object.keys(gearCatalog || {}));
    return [...new Set((Array.isArray(gearInventory) ? gearInventory : [])
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id) => id && allowed.has(id)))];
  }

  function sanitizeEquippedGear({ gearCatalog, gearInventory, equippedGear }) {
    const inventory = new Set(sanitizeGearInventory({ gearCatalog, gearInventory }));
    const source = equippedGear && typeof equippedGear === "object" ? equippedGear : {};
    return {
      weapon:
        typeof source.weapon === "string" &&
        inventory.has(source.weapon) &&
        gearCatalog?.[source.weapon]?.slot === "weapon"
          ? source.weapon
          : "",
      armor:
        typeof source.armor === "string" &&
        inventory.has(source.armor) &&
        gearCatalog?.[source.armor]?.slot === "armor"
          ? source.armor
          : "",
      trinket:
        typeof source.trinket === "string" &&
        inventory.has(source.trinket) &&
        gearCatalog?.[source.trinket]?.slot === "trinket"
          ? source.trinket
          : "",
    };
  }

  function normalizeRunGearState({ gearCatalog, game }) {
    const defaults = createDefaultRunGearState();
    const normalizedInventory = sanitizeGearInventory({
      gearCatalog,
      gearInventory: game?.gearInventory,
    });
    const normalizedEquipped = sanitizeEquippedGear({
      gearCatalog,
      gearInventory: normalizedInventory,
      equippedGear: game?.equippedGear,
    });
    return {
      gearInventory: normalizedInventory.length > 0 ? normalizedInventory : defaults.gearInventory,
      equippedGear: normalizedEquipped,
    };
  }

  function getAvailableGearChoices({ gearCatalog, gearInventory = [] }) {
    const owned = new Set(sanitizeGearInventory({ gearCatalog, gearInventory }));
    return Object.values(gearCatalog || {})
      .filter((gear) => {
        if (!gear || typeof gear.id !== "string" || owned.has(gear.id)) {
          return false;
        }
        if (gear.questOnly) {
          return false;
        }
        const weight = Number.isFinite(gear.weight) ? gear.weight : 0;
        return weight > 0;
      })
      .map((gear) => ({
        id: gear.id,
        weight:
          Number.isFinite(gear.weight) && gear.weight > 0
            ? Math.max(1, Math.round(gear.weight))
            : 1,
      }));
  }

  function applyGearReward({ game, gearId, gearCatalog }) {
    if (!game || typeof game !== "object" || typeof gearId !== "string") {
      return null;
    }
    const gear = gearCatalog?.[gearId];
    if (!gear || typeof gear.slot !== "string") {
      return null;
    }

    const runGearState = normalizeRunGearState({ gearCatalog, game });
    game.gearInventory = runGearState.gearInventory;
    game.equippedGear = runGearState.equippedGear;

    if (game.gearInventory.includes(gearId)) {
      return null;
    }

    game.gearInventory.push(gearId);
    const slot = gear.slot;
    const replacedGearId = game.equippedGear?.[slot] || "";
    game.equippedGear[slot] = gearId;

    return {
      gear,
      slot,
      replacedGear: replacedGearId && gearCatalog?.[replacedGearId] ? gearCatalog[replacedGearId] : null,
    };
  }

  function getEquippedGearEntries({ gearCatalog, equippedGear }) {
    const slots = ["weapon", "armor", "trinket"];
    return slots.map((slot) => {
      const gearId = typeof equippedGear?.[slot] === "string" ? equippedGear[slot] : "";
      const gear = gearId ? gearCatalog?.[gearId] || null : null;
      return {
        slot,
        gearId,
        gear,
      };
    });
  }

  function getEquippedGearBonus({ gearCatalog, equippedGear, effectId }) {
    if (!effectId || typeof effectId !== "string") {
      return 0;
    }

    return getEquippedGearEntries({ gearCatalog, equippedGear }).reduce((sum, entry) => {
      const value = Number.parseInt(entry?.gear?.effects?.[effectId], 10);
      return Number.isInteger(value) ? sum + Math.max(0, value) : sum;
    }, 0);
  }

  window.BRASSLINE_GEAR_SYSTEM = {
    cloneGearCatalog,
    createDefaultRunGearState,
    sanitizeGearInventory,
    sanitizeEquippedGear,
    normalizeRunGearState,
    getAvailableGearChoices,
    applyGearReward,
    getEquippedGearEntries,
    getEquippedGearBonus,
  };
})();
