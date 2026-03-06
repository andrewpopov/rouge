(() => {
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  const LEVEL_TABLE = [0, 20, 45, 75, 110, 150, 195, 245, 300];

  const CLASS_CATALOG = {
    amazon: {
      id: "amazon",
      title: "Amazon",
      description: "Dexterity-first hunter focused on precision and lane pressure.",
      treeId: "amazon_huntress_path",
      baseStats: {
        strength: 20,
        dexterity: 25,
        vitality: 20,
        energy: 15,
      },
      baseResistances: {
        physical: 0,
        fire: 0,
        cold: 0,
        poison: 0,
      },
      starterSkillIds: ["quick_shot"],
      starterItemIds: [],
    },
    sorceress: {
      id: "sorceress",
      title: "Sorceress",
      description: "Elemental caster with high energy scaling and AoE control.",
      treeId: "sorceress_ember_path",
      baseStats: {
        strength: 15,
        dexterity: 20,
        vitality: 20,
        energy: 30,
      },
      baseResistances: {
        physical: 0,
        fire: 5,
        cold: 0,
        poison: 0,
      },
      starterSkillIds: ["ember_bolt"],
      starterItemIds: [],
    },
    paladin: {
      id: "paladin",
      title: "Paladin",
      description: "Frontline zealot with stronger mitigation and defensive spells.",
      treeId: "paladin_sanctified_path",
      baseStats: {
        strength: 25,
        dexterity: 20,
        vitality: 25,
        energy: 15,
      },
      baseResistances: {
        physical: 5,
        fire: 0,
        cold: 0,
        poison: 5,
      },
      starterSkillIds: ["smite"],
      starterItemIds: [],
    },
  };

  const SKILL_TREE_CATALOG = {
    amazon_huntress_path: {
      id: "amazon_huntress_path",
      classId: "amazon",
      title: "Path Of The Huntress",
      nodes: [
        {
          id: "amazon_precise_shots",
          title: "Precise Shots",
          description: "Attack cards deal +1 damage per rank.",
          maxRank: 3,
          cost: 1,
          prereq: [],
          effects: {
            attack_flat_bonus: 1,
          },
        },
        {
          id: "amazon_eagle_eye",
          title: "Eagle Eye",
          description: "Gain +2 Dexterity per rank.",
          maxRank: 2,
          cost: 1,
          prereq: ["amazon_precise_shots"],
          effects: {
            stat_dexterity: 2,
          },
        },
        {
          id: "amazon_multishot_mastery",
          title: "Multishot Mastery",
          description: "Unlock Multishot.",
          maxRank: 1,
          cost: 1,
          prereq: ["amazon_precise_shots"],
          effects: {
            unlock_skill: "multishot",
          },
        },
      ],
    },
    sorceress_ember_path: {
      id: "sorceress_ember_path",
      classId: "sorceress",
      title: "Arcane Ember Path",
      nodes: [
        {
          id: "sorceress_arcane_studies",
          title: "Arcane Studies",
          description: "Spells deal +2 damage per rank.",
          maxRank: 3,
          cost: 1,
          prereq: [],
          effects: {
            spell_damage_bonus: 2,
          },
        },
        {
          id: "sorceress_warmth",
          title: "Warmth",
          description: "Gain +1 turn-start Steam and +5% fire resist per rank.",
          maxRank: 2,
          cost: 1,
          prereq: ["sorceress_arcane_studies"],
          effects: {
            turn_start_energy_bonus: 1,
            res_fire: 5,
          },
        },
        {
          id: "sorceress_frost_orb_mastery",
          title: "Frost Orb Mastery",
          description: "Unlock Frost Orb.",
          maxRank: 1,
          cost: 1,
          prereq: ["sorceress_arcane_studies"],
          effects: {
            unlock_skill: "frost_orb",
          },
        },
      ],
    },
    paladin_sanctified_path: {
      id: "paladin_sanctified_path",
      classId: "paladin",
      title: "Sanctified Path",
      nodes: [
        {
          id: "paladin_zealotry",
          title: "Zealotry",
          description: "Attack cards deal +1 damage per rank and gain +1 Strength.",
          maxRank: 3,
          cost: 1,
          prereq: [],
          effects: {
            attack_flat_bonus: 1,
            stat_strength: 1,
          },
        },
        {
          id: "paladin_holy_guard",
          title: "Holy Guard",
          description: "Gain +1 start-turn Block and +5% physical resist per rank.",
          maxRank: 2,
          cost: 1,
          prereq: ["paladin_zealotry"],
          effects: {
            turn_start_block_bonus: 1,
            res_physical: 5,
          },
        },
        {
          id: "paladin_holy_bolt_mastery",
          title: "Holy Bolt Mastery",
          description: "Unlock Holy Bolt.",
          maxRank: 1,
          cost: 1,
          prereq: ["paladin_zealotry"],
          effects: {
            unlock_skill: "holy_bolt",
          },
        },
      ],
    },
  };

  const SKILL_CATALOG = {
    quick_shot: {
      id: "quick_shot",
      classId: "amazon",
      title: "Quick Shot",
      description: "Fires a piercing physical shot.",
      cooldown: 1,
      energyCost: 1,
      spellId: "quick_shot_spell",
    },
    multishot: {
      id: "multishot",
      classId: "amazon",
      title: "Multishot",
      description: "Volley that hits every enemy lane.",
      cooldown: 3,
      energyCost: 2,
      spellId: "multishot_spell",
    },
    ember_bolt: {
      id: "ember_bolt",
      classId: "sorceress",
      title: "Ember Bolt",
      description: "Launch a focused fire bolt.",
      cooldown: 1,
      energyCost: 1,
      spellId: "ember_bolt_spell",
    },
    frost_orb: {
      id: "frost_orb",
      classId: "sorceress",
      title: "Frost Orb",
      description: "Explodes into chilling shards.",
      cooldown: 3,
      energyCost: 2,
      spellId: "frost_orb_spell",
    },
    smite: {
      id: "smite",
      classId: "paladin",
      title: "Smite",
      description: "Crush target with a holy strike.",
      cooldown: 1,
      energyCost: 1,
      spellId: "smite_spell",
    },
    holy_bolt: {
      id: "holy_bolt",
      classId: "paladin",
      title: "Holy Bolt",
      description: "Restore hull.",
      cooldown: 3,
      energyCost: 1,
      spellId: "holy_bolt_spell",
    },
  };

  const SPELL_CATALOG = {
    quick_shot_spell: {
      id: "quick_shot_spell",
      classId: "amazon",
      title: "Quick Shot",
      linkedSkillId: "quick_shot",
      description: "Deal physical damage to selected enemy.",
      effect: {
        kind: "damage_selected",
        value: 8,
        damageType: "physical",
      },
    },
    multishot_spell: {
      id: "multishot_spell",
      classId: "amazon",
      title: "Multishot",
      linkedSkillId: "multishot",
      description: "Deal physical damage to all enemies.",
      effect: {
        kind: "damage_all",
        value: 6,
        damageType: "physical",
      },
    },
    ember_bolt_spell: {
      id: "ember_bolt_spell",
      classId: "sorceress",
      title: "Ember Bolt",
      linkedSkillId: "ember_bolt",
      description: "Deal fire damage to selected enemy.",
      effect: {
        kind: "damage_selected",
        value: 9,
        damageType: "fire",
      },
    },
    frost_orb_spell: {
      id: "frost_orb_spell",
      classId: "sorceress",
      title: "Frost Orb",
      linkedSkillId: "frost_orb",
      description: "Deal cold damage to all enemies.",
      effect: {
        kind: "damage_all",
        value: 7,
        damageType: "cold",
      },
    },
    smite_spell: {
      id: "smite_spell",
      classId: "paladin",
      title: "Smite",
      linkedSkillId: "smite",
      description: "Deal physical damage to selected enemy.",
      effect: {
        kind: "damage_selected",
        value: 9,
        damageType: "physical",
      },
    },
    holy_bolt_spell: {
      id: "holy_bolt_spell",
      classId: "paladin",
      title: "Holy Bolt",
      linkedSkillId: "holy_bolt",
      description: "Restore hull.",
      effect: {
        kind: "heal_self",
        value: 10,
      },
    },
  };

  const ITEM_CATALOG = {
    chipped_ruby: {
      id: "chipped_ruby",
      title: "Chipped Ruby",
      rarity: "common",
      description: "+6% Fire resist.",
      dropWeight: 3,
      effects: {
        res_fire: 6,
      },
    },
    cracked_ward: {
      id: "cracked_ward",
      title: "Cracked Ward",
      rarity: "common",
      description: "+4% Physical resist.",
      dropWeight: 3,
      effects: {
        res_physical: 4,
      },
    },
    pilgrim_band: {
      id: "pilgrim_band",
      title: "Pilgrim Band",
      rarity: "uncommon",
      description: "+1 attack card damage and +3% cold resist.",
      dropWeight: 2,
      effects: {
        attack_flat_bonus: 1,
        res_cold: 3,
      },
    },
    warlords_grip: {
      id: "warlords_grip",
      title: "Warlord's Grip",
      rarity: "uncommon",
      description: "+3 Strength.",
      dropWeight: 2,
      effects: {
        stat_strength: 3,
      },
    },
    hawks_eye: {
      id: "hawks_eye",
      title: "Hawk's Eye",
      rarity: "uncommon",
      description: "+3 Dexterity.",
      dropWeight: 2,
      effects: {
        stat_dexterity: 3,
      },
    },
    mystic_sash: {
      id: "mystic_sash",
      title: "Mystic Sash",
      rarity: "uncommon",
      description: "+3 Energy.",
      dropWeight: 2,
      effects: {
        stat_energy: 3,
      },
    },
  };

  function normalizeId(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
  }

  function normalizeTitle(value, fallback = "Unknown") {
    if (typeof value !== "string" || !value.trim()) {
      return fallback;
    }
    return value.trim();
  }

  function getSeedBundle() {
    const bundle = window.BRASSLINE_SEEDS_D2;
    if (!bundle || typeof bundle !== "object") {
      return null;
    }
    return bundle;
  }

  function getClassArchetype(classId) {
    const id = normalizeId(classId);
    if (id === "sorceress" || id === "necromancer") {
      return "caster";
    }
    return "martial";
  }

  function getClassPrimaryStat(classId) {
    const id = normalizeId(classId);
    if (id === "sorceress" || id === "necromancer") {
      return "energy";
    }
    if (id === "amazon" || id === "assassin") {
      return "dexterity";
    }
    return "strength";
  }

  function getClassDamageType(classId) {
    const id = normalizeId(classId);
    if (id === "sorceress") {
      return "fire";
    }
    if (id === "necromancer") {
      return "poison";
    }
    if (id === "druid") {
      return "cold";
    }
    return "physical";
  }

  function inferDamageType(skillName, fallbackDamageType) {
    const name = String(skillName || "").toLowerCase();
    if (name.includes("fire") || name.includes("flame") || name.includes("meteor") || name.includes("hydra")) {
      return "fire";
    }
    if (name.includes("cold") || name.includes("ice") || name.includes("frost") || name.includes("blizzard")) {
      return "cold";
    }
    if (name.includes("poison") || name.includes("plague") || name.includes("venom") || name.includes("rabies")) {
      return "poison";
    }
    return fallbackDamageType;
  }

  function inferSpellEffect({ skillName, classId, slotIndex = 0 }) {
    const name = String(skillName || "").toLowerCase();
    const damageType = inferDamageType(name, getClassDamageType(classId));

    if (
      name.includes("armor") ||
      name.includes("shield") ||
      name.includes("defiance") ||
      name.includes("shout") ||
      name.includes("fade") ||
      name.includes("holy shield")
    ) {
      return {
        kind: "gain_block",
        value: slotIndex === 0 ? 6 : 10,
      };
    }

    if (
      name.includes("prayer") ||
      name.includes("redemption") ||
      name.includes("meditation") ||
      name.includes("life tap") ||
      name.includes("warmth")
    ) {
      return {
        kind: "heal_self",
        value: slotIndex === 0 ? 8 : 11,
      };
    }

    if (
      name.includes("nova") ||
      name.includes("meteor") ||
      name.includes("blizzard") ||
      name.includes("whirlwind") ||
      name.includes("mult") ||
      name.includes("shot") ||
      name.includes("fury") ||
      name.includes("storm") ||
      name.includes("fissure") ||
      name.includes("armageddon") ||
      name.includes("corpse explosion") ||
      name.includes("war cry")
    ) {
      return {
        kind: "damage_all",
        value: slotIndex === 0 ? 6 : 8,
        damageType,
      };
    }

    return {
      kind: "damage_selected",
      value: slotIndex === 0 ? 8 : 11,
      damageType,
    };
  }

  function collectClassSkillEntries(skillDoc, classId) {
    const classes = Array.isArray(skillDoc?.classes) ? skillDoc.classes : [];
    const classEntry = classes.find((entry) => normalizeId(entry?.classId) === normalizeId(classId));
    if (!classEntry) {
      return [];
    }

    const entries = [];
    (Array.isArray(classEntry.trees) ? classEntry.trees : []).forEach((tree) => {
      const treeId = normalizeId(tree?.id);
      const treeName = normalizeTitle(tree?.name, treeId || "Core");
      (Array.isArray(tree?.skills) ? tree.skills : []).forEach((skill, index) => {
        const skillId = normalizeId(skill?.id);
        if (!skillId) {
          return;
        }
        const requiredLevelRaw = Number.parseInt(skill?.requiredLevel, 10);
        const requiredLevel = Number.isInteger(requiredLevelRaw) ? requiredLevelRaw : 1;
        entries.push({
          id: skillId,
          title: normalizeTitle(skill?.name, skillId),
          requiredLevel,
          treeId,
          treeName,
          order: index,
        });
      });
    });

    entries.sort((a, b) => {
      if (a.requiredLevel !== b.requiredLevel) {
        return a.requiredLevel - b.requiredLevel;
      }
      if (a.treeId !== b.treeId) {
        return a.treeId.localeCompare(b.treeId);
      }
      return a.order - b.order;
    });

    return entries;
  }

  function pickClassSkills(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return {
        starter: null,
        signature: null,
        utility: null,
      };
    }

    const starter = entries.find((entry) => entry.requiredLevel <= 1) || entries[0];
    const signature =
      entries.find((entry) => entry.id !== starter.id && entry.requiredLevel >= 6 && entry.requiredLevel <= 18) ||
      entries.find((entry) => entry.id !== starter.id) ||
      starter;
    const utility =
      entries.find((entry) => {
        if (entry.id === starter.id || entry.id === signature.id) {
          return false;
        }
        const name = entry.title.toLowerCase();
        return (
          name.includes("armor") ||
          name.includes("shield") ||
          name.includes("shout") ||
          name.includes("resist") ||
          name.includes("prayer") ||
          name.includes("fade") ||
          name.includes("howl") ||
          name.includes("warmth")
        );
      }) ||
      entries.find((entry) => entry.id !== starter.id && entry.id !== signature.id) ||
      null;

    return { starter, signature, utility };
  }

  function getProgressionTier(requiredLevel) {
    if (requiredLevel <= 6) {
      return 1;
    }
    if (requiredLevel <= 18) {
      return 2;
    }
    return 3;
  }

  function getTreeNodeId(classId, treeId) {
    return `${classId}_${treeId}_attunement`;
  }

  function inferCardRole({ classId, effect }) {
    const kind = String(effect?.kind || "").toLowerCase();
    const damageType = String(effect?.damageType || "").toLowerCase();
    if (kind === "gain_block" || kind === "gain_energy" || kind === "draw_cards" || kind === "heal_self") {
      return "utility";
    }
    if (damageType === "physical" && getClassArchetype(classId) !== "caster") {
      return "attack";
    }
    return "spell";
  }

  function getSkillIconPath({ effect, cardRole }) {
    const kind = String(effect?.kind || "").toLowerCase();
    const damageType = String(effect?.damageType || "").toLowerCase();
    if (kind === "gain_block") {
      return "./assets/curated/themes/diablo-inspired/icons/cards/13_armor-upgrade.svg";
    }
    if (kind === "heal_self") {
      return "./assets/curated/themes/diablo-inspired/icons/cards/15_ghost.svg";
    }
    if (damageType === "fire") {
      return "./assets/curated/themes/diablo-inspired/icons/cards/10_burning-embers.svg";
    }
    if (damageType === "cold") {
      return "./assets/curated/themes/diablo-inspired/icons/cards/15_ghost.svg";
    }
    if (damageType === "poison") {
      return "./assets/curated/themes/diablo-inspired/icons/cards/12_snake-bite.svg";
    }
    if (cardRole === "attack") {
      return "./assets/curated/themes/diablo-inspired/icons/cards/03_broadsword.svg";
    }
    return "./assets/curated/themes/diablo-inspired/icons/cards/06_burning-skull.svg";
  }

  function getRankBonusPerLevel({ effect, requiredLevel }) {
    const kind = String(effect?.kind || "").toLowerCase();
    if (kind === "gain_block" || kind === "heal_self") {
      return requiredLevel >= 24 ? 4 : requiredLevel >= 12 ? 3 : 2;
    }
    return requiredLevel >= 24 ? 3 : requiredLevel >= 12 ? 2 : 1;
  }

  function buildSupportSkillIds({ treeSkills, skillId }) {
    const ordered = Array.isArray(treeSkills) ? treeSkills : [];
    const skillIndex = ordered.findIndex((entry) => entry?.id === skillId);
    if (skillIndex < 0) {
      return [];
    }
    return ordered
      .slice(Math.max(0, skillIndex - 2), skillIndex)
      .map((entry) => entry.id)
      .filter(Boolean);
  }

  function buildDeckSynergyConfig({ treeSkills, skillId, requiredLevel }) {
    const tier = getProgressionTier(requiredLevel);
    return {
      sameTreeDistinctBonus: tier >= 3 ? 2 : 1,
      sameSpellCopyBonus: 2,
      supportSkillIds: buildSupportSkillIds({
        treeSkills,
        skillId,
      }),
      supportPresenceBonus: 1,
      supportRankBonusPerLevel: 1,
    };
  }

  function buildTreeProgressionNodes({ classId, treeEntries }) {
    return treeEntries.map((treeEntry) => ({
      id: getTreeNodeId(classId, treeEntry.treeId),
      title: `${treeEntry.treeName} Attunement`,
      description: `Rank 1 unlocks Lv 1-6 ${treeEntry.treeName} cards, Rank 2 unlocks Lv 12-18, Rank 3 unlocks Lv 24-30 and adds extra same-tree scaling.`,
      maxRank: 3,
      cost: 1,
      prereq: [],
      effects: {
        unlock_tree_id: treeEntry.treeId,
        [`tree_spell_bonus_${treeEntry.treeId}`]: 1,
        [`tree_attack_bonus_${treeEntry.treeId}`]: 1,
      },
    }));
  }

  function getStarterSkillIds({ classSkills, picks }) {
    const starterIds = [];
    if (picks.starter?.id) {
      starterIds.push(picks.starter.id);
    }
    const extraStarter = classSkills.find(
      (entry) => entry.requiredLevel <= 1 && entry.id !== picks.starter?.id && entry.id !== picks.signature?.id
    );
    if (extraStarter?.id) {
      starterIds.push(extraStarter.id);
    }
    return [...new Set(starterIds)];
  }

  function buildSeedItemCatalog() {
    return {
      chipped_ruby: {
        id: "chipped_ruby",
        title: "Chipped Ruby",
        rarity: "common",
        icon: "./assets/curated/themes/diablo-inspired/icons/cards/10_burning-embers.svg",
        description: "+6% Fire resist.",
        dropWeight: 3,
        effects: {
          res_fire: 6,
        },
      },
      chipped_sapphire: {
        id: "chipped_sapphire",
        title: "Chipped Sapphire",
        rarity: "common",
        icon: "./assets/curated/themes/diablo-inspired/icons/cards/15_ghost.svg",
        description: "+6% Cold resist.",
        dropWeight: 3,
        effects: {
          res_cold: 6,
        },
      },
      chipped_emerald: {
        id: "chipped_emerald",
        title: "Chipped Emerald",
        rarity: "common",
        icon: "./assets/curated/themes/diablo-inspired/icons/cards/12_snake-bite.svg",
        description: "+6% Poison resist.",
        dropWeight: 3,
        effects: {
          res_poison: 6,
        },
      },
      cracked_bulwark: {
        id: "cracked_bulwark",
        title: "Cracked Bulwark",
        rarity: "uncommon",
        icon: "./assets/curated/themes/diablo-inspired/icons/cards/13_armor-upgrade.svg",
        description: "+2 turn-start Block.",
        dropWeight: 2,
        effects: {
          turn_start_block_bonus: 2,
        },
      },
      hunters_band: {
        id: "hunters_band",
        title: "Hunter's Band",
        rarity: "uncommon",
        icon: "./assets/curated/themes/diablo-inspired/icons/cards/03_broadsword.svg",
        description: "+1 attack card damage and +2 Dexterity.",
        dropWeight: 2,
        effects: {
          attack_flat_bonus: 1,
          stat_dexterity: 2,
        },
      },
      occult_focus: {
        id: "occult_focus",
        title: "Occult Focus",
        rarity: "uncommon",
        icon: "./assets/curated/themes/diablo-inspired/icons/cards/06_burning-skull.svg",
        description: "+2 spell damage and +2 Energy.",
        dropWeight: 2,
        effects: {
          spell_damage_bonus: 2,
          stat_energy: 2,
        },
      },
    };
  }

  const AUTHORED_CLASS_KIT_OVERRIDES = {
    barbarian: {
      description: "Durable melee bruiser with authored starter deck support and heavy physical scaling.",
      starterSkillIds: ["barbarian_bash"],
      starterDeckCardIds: [
        "strike",
        "strike",
        "strike",
        "guard",
        "guard",
        "guard",
        "advance",
        "recover",
        "crushing_swing",
        "crushing_swing",
        "war_shout",
        "war_shout",
        "battle_instinct",
        "blood_rush",
      ],
    },
    sorceress: {
      description: "Elemental caster with authored starter deck support and high-impact spells.",
      starterSkillIds: ["sorceress_fire_bolt"],
      starterDeckCardIds: [
        "strike",
        "strike",
        "guard",
        "guard",
        "advance",
        "advance",
        "recover",
        "flame_spark",
        "flame_spark",
        "cold_snap",
        "cold_snap",
        "warmth_card",
        "warmth_card",
        "arc_surge",
      ],
    },
  };

  const AUTHORED_STARTER_SPELL_OVERRIDES = {
    barbarian_bash_spell: {
      title: "Bash",
      effect: {
        kind: "damage_selected_combo_block",
        value: 9,
        bonusBlock: 3,
        damageType: "physical",
      },
      cardRole: "attack",
      rankBonusPerLevel: 2,
      deckSynergy: {
        sameTreeDistinctBonus: 1,
        sameSpellCopyBonus: 2,
        supportSkillIds: [],
        supportPresenceBonus: 0,
        supportRankBonusPerLevel: 0,
      },
    },
    sorceress_fire_bolt_spell: {
      title: "Fire Bolt",
      effect: {
        kind: "damage_selected_first_spell_gain_energy",
        value: 8,
        bonusEnergy: 1,
        damageType: "fire",
      },
      cardRole: "spell",
      rankBonusPerLevel: 1,
      deckSynergy: {
        sameTreeDistinctBonus: 1,
        sameSpellCopyBonus: 2,
        supportSkillIds: [],
        supportPresenceBonus: 0,
        supportRankBonusPerLevel: 0,
      },
    },
  };

  function applyAuthoredStarterKitOverrides({ classCatalog, skillCatalog, spellCatalog }) {
    Object.entries(AUTHORED_CLASS_KIT_OVERRIDES).forEach(([classId, override]) => {
      if (!classCatalog[classId]) {
        return;
      }
      classCatalog[classId] = {
        ...classCatalog[classId],
        description: override.description || classCatalog[classId].description,
        starterSkillIds: Array.isArray(override.starterSkillIds)
          ? [...override.starterSkillIds]
          : classCatalog[classId].starterSkillIds,
        starterDeckCardIds: Array.isArray(override.starterDeckCardIds)
          ? [...override.starterDeckCardIds]
          : [],
      };
    });

    Object.entries(AUTHORED_STARTER_SPELL_OVERRIDES).forEach(([spellId, override]) => {
      if (!spellCatalog[spellId]) {
        return;
      }
      const linkedSkillId = typeof spellCatalog[spellId].linkedSkillId === "string" ? spellCatalog[spellId].linkedSkillId : "";
      spellCatalog[spellId] = {
        ...spellCatalog[spellId],
        title: override.title || spellCatalog[spellId].title,
        effect: override.effect || spellCatalog[spellId].effect,
        cardRole: override.cardRole || spellCatalog[spellId].cardRole,
        rankBonusPerLevel:
          Number.isInteger(Number.parseInt(override.rankBonusPerLevel, 10))
            ? Number.parseInt(override.rankBonusPerLevel, 10)
            : spellCatalog[spellId].rankBonusPerLevel,
        deckSynergy: override.deckSynergy || spellCatalog[spellId].deckSynergy,
      };
      if (linkedSkillId && skillCatalog[linkedSkillId]) {
        skillCatalog[linkedSkillId] = {
          ...skillCatalog[linkedSkillId],
          title: override.title || skillCatalog[linkedSkillId].title,
          cardRole: override.cardRole || skillCatalog[linkedSkillId].cardRole,
        };
      }
    });
  }

  function buildSeedClassContent() {
    const seedBundle = getSeedBundle();
    const seedClasses = Array.isArray(seedBundle?.classes?.classes) ? seedBundle.classes.classes : null;
    const seedSkillDoc = seedBundle?.skills;
    if (!seedClasses || !seedSkillDoc) {
      return null;
    }

    const classCatalog = {};
    const skillTreeCatalog = {};
    const skillCatalog = {};
    const spellCatalog = {};
    const levelTable = [
      0, 20, 45, 75, 110, 150, 195, 245, 300, 360, 430, 510, 600, 700, 810, 930, 1060, 1200, 1350, 1510, 1680,
    ];

    const classDescriptions = {
      amazon: "Ranged hunter with pressure and lane control.",
      assassin: "Hybrid striker with trap-focused burst turns.",
      barbarian: "Durable melee bruiser with heavy physical scaling.",
      druid: "Adaptive warrior with elemental and shapeshift pressure.",
      necromancer: "Debuff caster focused on attrition and poison.",
      paladin: "Frontline zealot with defense and holy damage.",
      sorceress: "Elemental caster with high-impact spells.",
    };

    seedClasses.forEach((seedClass) => {
      const classId = normalizeId(seedClass?.id);
      if (!classId) {
        return;
      }
      const classTitle = normalizeTitle(seedClass?.name, classId);
      const treeId = `${classId}_discipline_path`;
      const baseStats = {
        strength: Number.parseInt(seedClass?.baseStats?.strength, 10) || 0,
        dexterity: Number.parseInt(seedClass?.baseStats?.dexterity, 10) || 0,
        vitality: Number.parseInt(seedClass?.baseStats?.vitality, 10) || 0,
        energy: Number.parseInt(seedClass?.baseStats?.energy, 10) || 0,
      };
      const classSkills = collectClassSkillEntries(seedSkillDoc, classId);
      const picks = pickClassSkills(classSkills);
      const starterSkillIds = getStarterSkillIds({
        classSkills,
        picks,
      });
      const treeEntries = [...new Map(classSkills.map((entry) => [entry.treeId, entry])).values()].map((entry) => ({
        treeId: entry.treeId,
        treeName: entry.treeName,
      }));
      const skillsByTreeId = classSkills.reduce((acc, entry) => {
        if (!acc[entry.treeId]) {
          acc[entry.treeId] = [];
        }
        acc[entry.treeId].push(entry);
        return acc;
      }, {});
      const archetype = getClassArchetype(classId);

      classCatalog[classId] = {
        id: classId,
        title: classTitle,
        description: classDescriptions[classId] || `${classTitle} class specialization.`,
        treeId,
        treeIds: treeEntries.map((entry) => entry.treeId),
        archetype,
        baseStats,
        baseResistances: {
          physical: 0,
          fire: 0,
          cold: 0,
          poison: 0,
        },
        starterSkillIds,
        deckProfile: {
          starterCardCopies: 1,
          maxSpellCopiesPerCard: 2,
          duplicateRewardsLevelCard: true,
          spellRewardWeight: archetype === "caster" ? 4 : 2,
          attackRewardWeight: archetype === "caster" ? 2 : 4,
        },
        starterItemIds: [],
      };

      skillTreeCatalog[treeId] = {
        id: treeId,
        classId,
        title: `${classTitle} Disciplines`,
        nodes: buildTreeProgressionNodes({
          classId,
          treeEntries,
        }),
      };

      classSkills.forEach((skillEntry) => {
        const skillId = normalizeId(skillEntry?.id);
        if (!skillId || skillCatalog[skillId]) {
          return;
        }
        const spellId = `${skillId}_spell`;
        const tier = getProgressionTier(skillEntry.requiredLevel);
        const cooldown = tier === 1 ? 1 : tier === 2 ? 2 : 3;
        const energyCost = tier === 1 ? 1 : tier === 2 ? 2 : 3;
        const effect = inferSpellEffect({
          skillName: skillEntry.title,
          classId,
          slotIndex: tier - 1,
        });
        const cardRole = inferCardRole({
          classId,
          effect,
        });
        const treeSkills = Array.isArray(skillsByTreeId[skillEntry.treeId]) ? skillsByTreeId[skillEntry.treeId] : [];

        skillCatalog[skillId] = {
          id: skillId,
          classId,
          treeId: skillEntry.treeId,
          treeName: skillEntry.treeName,
          title: normalizeTitle(skillEntry.title, skillId),
          description: `Cast ${normalizeTitle(skillEntry.title, skillId)}.`,
          cooldown,
          energyCost,
          requiredLevel: skillEntry.requiredLevel,
          rewardTier: tier,
          cardRole,
          delivery: "deck",
          spellId,
        };

        spellCatalog[spellId] = {
          id: spellId,
          classId,
          treeId: skillEntry.treeId,
          treeName: skillEntry.treeName,
          title: normalizeTitle(skillEntry.title, skillId),
          linkedSkillId: skillId,
          description: `${normalizeTitle(skillEntry.title, skillId)} card. Duplicates past two copies level the spell instead of bloating the deck.`,
          effect,
          icon: getSkillIconPath({
            effect,
            cardRole,
          }),
          cardRole,
          requiredLevel: skillEntry.requiredLevel,
          rewardTier: tier,
          rankCap: 5,
          rankBonusPerLevel: getRankBonusPerLevel({
            effect,
            requiredLevel: skillEntry.requiredLevel,
          }),
          maxDeckCopies: 2,
          deckSynergy: buildDeckSynergyConfig({
            treeSkills,
            skillId,
            requiredLevel: skillEntry.requiredLevel,
          }),
        };
      });
    });

    if (Object.keys(classCatalog).length === 0 || Object.keys(skillCatalog).length === 0) {
      return null;
    }

    applyAuthoredStarterKitOverrides({
      classCatalog,
      skillCatalog,
      spellCatalog,
    });

    return {
      levelTable,
      classCatalog,
      skillTreeCatalog,
      skillCatalog,
      spellCatalog,
      itemCatalog: buildSeedItemCatalog(),
    };
  }

  const SEEDED_CLASS_CONTENT = buildSeedClassContent();

  function getLevelTable() {
    return [...(SEEDED_CLASS_CONTENT?.levelTable || LEVEL_TABLE)];
  }

  function getClassCatalog() {
    return deepClone(SEEDED_CLASS_CONTENT?.classCatalog || CLASS_CATALOG);
  }

  function getSkillTreeCatalog() {
    return deepClone(SEEDED_CLASS_CONTENT?.skillTreeCatalog || SKILL_TREE_CATALOG);
  }

  function getSkillCatalog() {
    return deepClone(SEEDED_CLASS_CONTENT?.skillCatalog || SKILL_CATALOG);
  }

  function getSpellCatalog() {
    return deepClone(SEEDED_CLASS_CONTENT?.spellCatalog || SPELL_CATALOG);
  }

  function getItemCatalog() {
    return deepClone(SEEDED_CLASS_CONTENT?.itemCatalog || ITEM_CATALOG);
  }

  window.BRASSLINE_CLASS_CONTENT = {
    getLevelTable,
    getClassCatalog,
    getSkillTreeCatalog,
    getSkillCatalog,
    getSpellCatalog,
    getItemCatalog,
  };
})();
