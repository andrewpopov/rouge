(() => {
  function createCardCatalog({ cardTune }) {
    const tuneCard = typeof cardTune === "function" ? cardTune : (_cardId, _key, fallback) => fallback;
    const isComboActive = (ctx) => typeof ctx?.hasCombo === "function" && ctx.hasCombo();
    const isFirstfireReady = (ctx) => Number.isInteger(ctx?.game?.turnCardsPlayed) && ctx.game.turnCardsPlayed === 0;
    const getEmbeddedSpellCatalog = () => {
      if (typeof window !== "object" || !window?.BRASSLINE_CLASS_CONTENT) {
        return {};
      }
      try {
        return typeof window.BRASSLINE_CLASS_CONTENT.getSpellCatalog === "function"
          ? window.BRASSLINE_CLASS_CONTENT.getSpellCatalog()
          : {};
      } catch (_error) {
        return {};
      }
    };
    const getClassCardType = (spell) => {
      const role = typeof spell?.cardRole === "string" ? spell.cardRole.trim().toLowerCase() : "spell";
      if (role === "attack") {
        return "Attack";
      }
      if (role === "utility") {
        return "Skill";
      }
      return "Spell";
    };
    const getClassCardTarget = (spell) => {
      const kind = typeof spell?.effect?.kind === "string" ? spell.effect.kind.trim().toLowerCase() : "";
      if (kind === "damage_selected") {
        return "enemy";
      }
      if (kind === "damage_all") {
        return "all";
      }
      return "none";
    };
    const buildClassSpellText = (spell) => {
      const value = Number.parseInt(spell?.effect?.value, 10) || 0;
      const rankBonus = Math.max(0, Number.parseInt(spell?.rankBonusPerLevel, 10) || 0);
      const supportCount = Array.isArray(spell?.deckSynergy?.supportSkillIds) ? spell.deckSynergy.supportSkillIds.length : 0;
      const sameTreeBonus = Math.max(0, Number.parseInt(spell?.deckSynergy?.sameTreeDistinctBonus, 10) || 0);
      const kind = typeof spell?.effect?.kind === "string" ? spell.effect.kind.trim().toLowerCase() : "";
      if (kind === "damage_all") {
        return `Deal ${value} to all enemies. +${rankBonus}/Rank. Same-tree cards add +${sameTreeBonus}.`;
      }
      if (kind === "damage_selected") {
        return `Deal ${value} damage. +${rankBonus}/Rank.${supportCount > 0 ? ` Support cards in-tree add power.` : ""}`;
      }
      if (kind === "gain_block") {
        return `Gain ${value} Block. +${rankBonus}/Rank.`;
      }
      if (kind === "heal_self") {
        return `Restore ${value} Hull. +${rankBonus}/Rank.`;
      }
      if (kind === "gain_energy") {
        return `Gain ${value} Steam. +${rankBonus}/Rank.`;
      }
      if (kind === "draw_cards") {
        return `Draw ${value} card${value === 1 ? "" : "s"}. +${rankBonus}/Rank.`;
      }
      return typeof spell?.description === "string" ? spell.description : "Class skill card.";
    };
    const baseCatalog = {
  stoke_burners: {
    id: "stoke_burners",
    title: "Stoke Burners",
    type: "Reactor",
    cost: tuneCard("stoke_burners", "cost", 1),
    icon: "./assets/curated/icons/cards/21_coal-pile.svg",
    text: tuneCard("stoke_burners", "text", "Gain 8 Heat. Deal 7 damage."),
    heatText: tuneCard("stoke_burners", "heatText", "+8 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("stoke_burners", "heatGain", 8);
      const baseDamage = tuneCard("stoke_burners", "baseDamage", 7);
      ctx.gainHeat(heatGain);
      const damage = ctx.consumeAttackMultiplier(baseDamage);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Stoke Burners hit ${ctx.target.name} for ${dealt}.`);
    },
  },
  pressure_vent: {
    id: "pressure_vent",
    title: "Pressure Vent",
    type: "Skill",
    cost: tuneCard("pressure_vent", "cost", 1),
    icon: "./assets/curated/icons/cards/09_valve.svg",
    text: tuneCard("pressure_vent", "text", "Lose 12 Heat. Draw 1 card."),
    heatText: tuneCard("pressure_vent", "heatText", "-12 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("pressure_vent", "heatGain", -12);
      const draw = tuneCard("pressure_vent", "draw", 1);
      ctx.gainHeat(heatGain);
      const drew = ctx.drawCards(draw);
      ctx.log(`Pressure Vent cooled core and drew ${drew} card.`);
    },
  },
  spark_lance: {
    id: "spark_lance",
    title: "Spark Lance",
    type: "Attack",
    cost: tuneCard("spark_lance", "cost", 2),
    icon: "./assets/curated/icons/cards/07_spark-plug.svg",
    text: tuneCard("spark_lance", "text", "Deal 12 damage. +6 at 60+ Heat."),
    heatText: tuneCard("spark_lance", "heatText", "+6 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("spark_lance", "heatGain", 6);
      const baseDamage = tuneCard("spark_lance", "baseDamage", 12);
      const bonusDamage = tuneCard("spark_lance", "bonusDamage", 6);
      const heatThreshold = tuneCard("spark_lance", "heatThreshold", 60);
      ctx.gainHeat(heatGain);
      const base = baseDamage + (ctx.game.player.heat >= heatThreshold ? bonusDamage : 0);
      const damage = ctx.consumeAttackMultiplier(base);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Spark Lance dealt ${dealt} to ${ctx.target.name}.`);
    },
  },
  emergency_fog: {
    id: "emergency_fog",
    title: "Emergency Fog",
    type: "Skill",
    cost: tuneCard("emergency_fog", "cost", 1),
    icon: "./assets/curated/icons/cards/15_smoke-bomb.svg",
    text: tuneCard("emergency_fog", "text", "Gain 9 Block and Exhaust."),
    heatText: tuneCard("emergency_fog", "heatText", "+4 heat"),
    target: "none",
    exhaust: true,
    play: (ctx) => {
      const heatGain = tuneCard("emergency_fog", "heatGain", 4);
      const blockGain = tuneCard("emergency_fog", "blockGain", 9);
      ctx.gainHeat(heatGain);
      ctx.gainBlock(blockGain);
      ctx.log(`Emergency Fog granted ${blockGain} Block.`);
    },
  },
  turret_burst: {
    id: "turret_burst",
    title: "Turret Burst",
    type: "Attack",
    cost: tuneCard("turret_burst", "cost", 2),
    icon: "./assets/curated/icons/cards/08_walking-turret.svg",
    text: tuneCard("turret_burst", "text", "Deal 9 to all enemies."),
    heatText: tuneCard("turret_burst", "heatText", "+10 heat"),
    target: "all",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("turret_burst", "heatGain", 10);
      const baseDamage = tuneCard("turret_burst", "baseDamage", 9);
      ctx.gainHeat(heatGain);
      const damage = ctx.consumeAttackMultiplier(baseDamage);
      let total = 0;
      ctx.livingEnemies().forEach((enemy) => {
        total += ctx.damageEnemy(enemy, damage);
      });
      ctx.log(`Turret Burst sprayed for ${total} total damage.`);
    },
  },
  overpressure: {
    id: "overpressure",
    title: "Overpressure",
    type: "Reactor",
    cost: tuneCard("overpressure", "cost", 0),
    icon: "./assets/curated/icons/cards/05_overdrive.svg",
    text: tuneCard("overpressure", "text", "Next attack deals double this turn."),
    heatText: tuneCard("overpressure", "heatText", "+15 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("overpressure", "heatGain", 15);
      const multiplier = tuneCard("overpressure", "attackMultiplier", 2);
      ctx.gainHeat(heatGain);
      ctx.game.player.nextAttackMultiplier = multiplier;
      ctx.log("Overpressure primed: next attack is doubled.");
    },
  },
  condenser_tap: {
    id: "condenser_tap",
    title: "Condenser Tap",
    type: "Skill",
    cost: tuneCard("condenser_tap", "cost", 1),
    icon: "./assets/curated/icons/cards/24_energy-tank.svg",
    text: tuneCard("condenser_tap", "text", "Lose 8 Heat. Gain 5 Block."),
    heatText: tuneCard("condenser_tap", "heatText", "-8 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("condenser_tap", "heatGain", -8);
      const blockGain = tuneCard("condenser_tap", "blockGain", 5);
      ctx.gainHeat(heatGain);
      ctx.gainBlock(blockGain);
      ctx.log(`Condenser Tap reduced heat and added ${blockGain} Block.`);
    },
  },
  arc_drill: {
    id: "arc_drill",
    title: "Arc Drill",
    type: "Attack",
    cost: tuneCard("arc_drill", "cost", 1),
    icon: "./assets/curated/icons/cards/03_drill.svg",
    text: tuneCard("arc_drill", "text", "Deal 8 damage twice if Heat >= 50."),
    heatText: tuneCard("arc_drill", "heatText", "+5 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("arc_drill", "heatGain", 5);
      const heatThreshold = tuneCard("arc_drill", "heatThreshold", 50);
      const hitsCold = tuneCard("arc_drill", "hitsCold", 1);
      const hitsHot = tuneCard("arc_drill", "hitsHot", 2);
      const baseDamage = tuneCard("arc_drill", "baseDamage", 8);
      ctx.gainHeat(heatGain);
      const hits = ctx.game.player.heat >= heatThreshold ? hitsHot : hitsCold;
      const damage = ctx.consumeAttackMultiplier(baseDamage);
      let total = 0;
      for (let i = 0; i < hits; i += 1) {
        total += ctx.damageEnemy(ctx.target, damage);
        if (!ctx.target.alive) {
          break;
        }
      }
      ctx.log(`Arc Drill hit ${ctx.target.name} for ${total}.`);
    },
  },
  rail_cannon: {
    id: "rail_cannon",
    title: "Rail Cannon",
    type: "Attack",
    cost: tuneCard("rail_cannon", "cost", 3),
    icon: "./assets/curated/icons/cards/04_laser-blast.svg",
    text: tuneCard("rail_cannon", "text", "Deal 22 damage. +8 at 70+ Heat."),
    heatText: tuneCard("rail_cannon", "heatText", "+12 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("rail_cannon", "heatGain", 12);
      const baseDamage = tuneCard("rail_cannon", "baseDamage", 22);
      const bonusDamage = tuneCard("rail_cannon", "bonusDamage", 8);
      const heatThreshold = tuneCard("rail_cannon", "heatThreshold", 70);
      ctx.gainHeat(heatGain);
      const base = baseDamage + (ctx.game.player.heat >= heatThreshold ? bonusDamage : 0);
      const damage = ctx.consumeAttackMultiplier(base);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Rail Cannon blasted ${ctx.target.name} for ${dealt}.`);
    },
  },
  coolant_flush: {
    id: "coolant_flush",
    title: "Coolant Flush",
    type: "Skill",
    cost: tuneCard("coolant_flush", "cost", 1),
    icon: "./assets/curated/icons/cards/24_energy-tank.svg",
    text: tuneCard("coolant_flush", "text", "Lose 18 Heat. Gain 7 Block and draw 1."),
    heatText: tuneCard("coolant_flush", "heatText", "-18 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("coolant_flush", "heatGain", -18);
      const blockGain = tuneCard("coolant_flush", "blockGain", 7);
      const draw = tuneCard("coolant_flush", "draw", 1);
      ctx.gainHeat(heatGain);
      ctx.gainBlock(blockGain);
      const drew = ctx.drawCards(draw);
      ctx.log(`Coolant Flush stabilized core and drew ${drew}.`);
    },
  },
  boiler_bastion: {
    id: "boiler_bastion",
    title: "Boiler Bastion",
    type: "Skill",
    cost: tuneCard("boiler_bastion", "cost", 2),
    icon: "./assets/curated/icons/cards/22_pipes.svg",
    text: tuneCard("boiler_bastion", "text", "Gain 18 Block."),
    heatText: tuneCard("boiler_bastion", "heatText", "+6 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("boiler_bastion", "heatGain", 6);
      const blockGain = tuneCard("boiler_bastion", "blockGain", 18);
      ctx.gainHeat(heatGain);
      ctx.gainBlock(blockGain);
      ctx.log("Boiler Bastion reinforced the hull.");
    },
  },
  flash_relay: {
    id: "flash_relay",
    title: "Flash Relay",
    type: "Reactor",
    cost: tuneCard("flash_relay", "cost", 1),
    icon: "./assets/curated/icons/cards/17_power-generator.svg",
    text: tuneCard("flash_relay", "text", "Gain 1 Steam. Gain +1 more at 60+ Heat."),
    heatText: tuneCard("flash_relay", "heatText", "+10 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("flash_relay", "heatGain", 10);
      const energyCold = tuneCard("flash_relay", "energyCold", 1);
      const energyHot = tuneCard("flash_relay", "energyHot", 2);
      const heatThreshold = tuneCard("flash_relay", "heatThreshold", 60);
      ctx.gainHeat(heatGain);
      const energy = ctx.game.player.heat >= heatThreshold ? energyHot : energyCold;
      ctx.gainEnergy(energy);
      ctx.log(`Flash Relay generated ${energy} Steam.`);
    },
  },
  static_field: {
    id: "static_field",
    title: "Static Field",
    type: "Skill",
    cost: tuneCard("static_field", "cost", 1),
    icon: "./assets/curated/icons/cards/19_tesla-coil.svg",
    text: tuneCard("static_field", "text", "Deal 4 to all enemies. Gain 4 Block."),
    heatText: tuneCard("static_field", "heatText", "+5 heat"),
    target: "all",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("static_field", "heatGain", 5);
      const damageEach = tuneCard("static_field", "damageEach", 4);
      const blockGain = tuneCard("static_field", "blockGain", 4);
      ctx.gainHeat(heatGain);
      let total = 0;
      ctx.livingEnemies().forEach((enemy) => {
        total += ctx.damageEnemy(enemy, damageEach);
      });
      ctx.gainBlock(blockGain);
      ctx.log(`Static Field pulsed for ${total} total damage.`);
    },
  },
  pressure_spike: {
    id: "pressure_spike",
    title: "Pressure Spike",
    type: "Attack",
    cost: tuneCard("pressure_spike", "cost", 1),
    icon: "./assets/curated/icons/cards/06_cogsplosion.svg",
    text: tuneCard("pressure_spike", "text", "Deal 14 damage. +6 vs blocked targets."),
    heatText: tuneCard("pressure_spike", "heatText", "+9 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("pressure_spike", "heatGain", 9);
      const baseDamage = tuneCard("pressure_spike", "baseDamage", 14);
      const bonusVsBlock = tuneCard("pressure_spike", "bonusVsBlock", 6);
      ctx.gainHeat(heatGain);
      const bonus = ctx.target.block > 0 ? bonusVsBlock : 0;
      const damage = ctx.consumeAttackMultiplier(baseDamage + bonus);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Pressure Spike cracked ${ctx.target.name} for ${dealt}.`);
    },
  },
  steam_barrier: {
    id: "steam_barrier",
    title: "Steam Barrier",
    type: "Skill",
    cost: tuneCard("steam_barrier", "cost", 1),
    icon: "./assets/curated/icons/cards/11_bellows.svg",
    text: tuneCard("steam_barrier", "text", "Lose 10 Heat. Gain 11 Block. Draw 1 if Heat <= 30."),
    heatText: tuneCard("steam_barrier", "heatText", "-10 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("steam_barrier", "heatGain", -10);
      const blockGain = tuneCard("steam_barrier", "blockGain", 11);
      const coolDrawThreshold = tuneCard("steam_barrier", "coolDrawThreshold", 30);
      const drawOnCool = tuneCard("steam_barrier", "drawOnCool", 1);
      ctx.gainHeat(heatGain);
      ctx.gainBlock(blockGain);
      let drew = 0;
      if (ctx.game.player.heat <= coolDrawThreshold) {
        drew = ctx.drawCards(drawOnCool);
      }
      ctx.log(`Steam Barrier granted ${blockGain} Block${drew > 0 ? ` and drew ${drew}.` : "."}`);
    },
  },
  boiler_spike: {
    id: "boiler_spike",
    title: "Boiler Spike",
    type: "Attack",
    cost: tuneCard("boiler_spike", "cost", 2),
    icon: "./assets/curated/icons/cards/01_steam-blast.svg",
    text: tuneCard("boiler_spike", "text", "Deal 10 damage. +8 at 80+ Heat."),
    heatText: tuneCard("boiler_spike", "heatText", "+6 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("boiler_spike", "heatGain", 6);
      const baseDamage = tuneCard("boiler_spike", "baseDamage", 10);
      const bonusDamage = tuneCard("boiler_spike", "bonusDamage", 8);
      const heatThreshold = tuneCard("boiler_spike", "heatThreshold", 80);
      ctx.gainHeat(heatGain);
      const base = baseDamage + (ctx.game.player.heat >= heatThreshold ? bonusDamage : 0);
      const damage = ctx.consumeAttackMultiplier(base);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Boiler Spike hammered ${ctx.target.name} for ${dealt}.`);
    },
  },
  scrap_hail: {
    id: "scrap_hail",
    title: "Scrap Hail",
    type: "Attack",
    cost: tuneCard("scrap_hail", "cost", 2),
    icon: "./assets/curated/icons/cards/02_bolt-bomb.svg",
    text: tuneCard("scrap_hail", "text", "Deal 5 to all enemies twice."),
    heatText: tuneCard("scrap_hail", "heatText", "+8 heat"),
    target: "all",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("scrap_hail", "heatGain", 8);
      const damageEach = tuneCard("scrap_hail", "damageEach", 5);
      const hits = tuneCard("scrap_hail", "hits", 2);
      ctx.gainHeat(heatGain);
      const damage = ctx.consumeAttackMultiplier(damageEach);
      let total = 0;
      for (let hit = 0; hit < hits; hit += 1) {
        ctx.livingEnemies().forEach((enemy) => {
          total += ctx.damageEnemy(enemy, damage);
        });
      }
      ctx.log(`Scrap Hail shredded enemy lines for ${total} total damage.`);
    },
  },
  circuit_break: {
    id: "circuit_break",
    title: "Circuit Break",
    type: "Skill",
    cost: tuneCard("circuit_break", "cost", 1),
    icon: "./assets/curated/icons/cards/14_battery-minus.svg",
    text: tuneCard("circuit_break", "text", "Lose 14 Heat. Gain 1 Steam."),
    heatText: tuneCard("circuit_break", "heatText", "-14 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("circuit_break", "heatGain", -14);
      const energyGain = tuneCard("circuit_break", "energyGain", 1);
      ctx.gainHeat(heatGain);
      ctx.gainEnergy(energyGain);
      ctx.log("Circuit Break vented pressure and restored Steam.");
    },
  },
  slag_round: {
    id: "slag_round",
    title: "Slag Round",
    type: "Attack",
    cost: tuneCard("slag_round", "cost", 1),
    icon: "./assets/curated/icons/cards/12_plug.svg",
    text: tuneCard("slag_round", "text", "Deal 11 damage. +5 if target is Charged."),
    heatText: tuneCard("slag_round", "heatText", "+4 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("slag_round", "heatGain", 4);
      const baseDamage = tuneCard("slag_round", "baseDamage", 11);
      const chargedBonus = tuneCard("slag_round", "chargedBonus", 5);
      ctx.gainHeat(heatGain);
      const bonus = ctx.target.attackBuff > 0 ? chargedBonus : 0;
      const damage = ctx.consumeAttackMultiplier(baseDamage + bonus);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Slag Round struck ${ctx.target.name} for ${dealt}.`);
    },
  },
  blast_shield: {
    id: "blast_shield",
    title: "Blast Shield",
    type: "Skill",
    cost: tuneCard("blast_shield", "cost", 1),
    icon: "./assets/curated/icons/cards/16_radar-sweep.svg",
    text: tuneCard("blast_shield", "text", "Gain 7 Block. Gain +5 if Heat >= 70."),
    heatText: tuneCard("blast_shield", "heatText", "+2 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("blast_shield", "heatGain", 2);
      const blockBase = tuneCard("blast_shield", "blockBase", 7);
      const blockBonus = tuneCard("blast_shield", "blockBonus", 5);
      const heatThreshold = tuneCard("blast_shield", "heatThreshold", 70);
      ctx.gainHeat(heatGain);
      const block = blockBase + (ctx.game.player.heat >= heatThreshold ? blockBonus : 0);
      ctx.gainBlock(block);
      ctx.log(`Blast Shield deployed for ${block} Block.`);
    },
  },
  combo_strike: {
    id: "combo_strike",
    title: "Combo Strike",
    type: "Attack",
    cost: tuneCard("combo_strike", "cost", 1),
    icon: "./assets/curated/icons/cards/06_cogsplosion.svg",
    text: tuneCard("combo_strike", "text", "Deal 9 damage. Combo: Gain 1 Steam."),
    heatText: tuneCard("combo_strike", "heatText", "+5 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("combo_strike", "heatGain", 5);
      const baseDamage = tuneCard("combo_strike", "baseDamage", 9);
      const comboEnergy = tuneCard("combo_strike", "comboEnergy", 1);
      const combo = isComboActive(ctx);
      ctx.gainHeat(heatGain);
      const damage = ctx.consumeAttackMultiplier(baseDamage);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      if (combo) {
        ctx.gainEnergy(comboEnergy);
      }
      ctx.log(`Combo Strike hit ${ctx.target.name} for ${dealt}${combo ? " and refunded Steam." : "."}`);
    },
  },
  relay_tap: {
    id: "relay_tap",
    title: "Relay Tap",
    type: "Reactor",
    cost: tuneCard("relay_tap", "cost", 0),
    icon: "./assets/curated/icons/cards/17_power-generator.svg",
    text: tuneCard("relay_tap", "text", "Draw 1. Combo: Draw 1 more."),
    heatText: tuneCard("relay_tap", "heatText", "+3 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("relay_tap", "heatGain", 3);
      const drawBase = tuneCard("relay_tap", "drawBase", 1);
      const drawCombo = tuneCard("relay_tap", "drawCombo", 1);
      const combo = isComboActive(ctx);
      ctx.gainHeat(heatGain);
      let drew = ctx.drawCards(drawBase);
      if (combo) {
        drew += ctx.drawCards(drawCombo);
      }
      ctx.log(`Relay Tap cycled ${drew} card${drew === 1 ? "" : "s"}.`);
    },
  },
  heat_sync: {
    id: "heat_sync",
    title: "Heat Sync",
    type: "Skill",
    cost: tuneCard("heat_sync", "cost", 1),
    icon: "./assets/curated/icons/cards/22_pipes.svg",
    text: tuneCard("heat_sync", "text", "Lose 7 Heat. Gain 5 Block. Combo: Gain +5 Block."),
    heatText: tuneCard("heat_sync", "heatText", "-7 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("heat_sync", "heatGain", -7);
      const blockBase = tuneCard("heat_sync", "blockBase", 5);
      const blockCombo = tuneCard("heat_sync", "blockCombo", 5);
      const combo = isComboActive(ctx);
      ctx.gainHeat(heatGain);
      const block = blockBase + (combo ? blockCombo : 0);
      ctx.gainBlock(block);
      ctx.log(`Heat Sync stabilized for ${block} Block.`);
    },
  },
  siphon_bolt: {
    id: "siphon_bolt",
    title: "Siphon Bolt",
    type: "Attack",
    cost: tuneCard("siphon_bolt", "cost", 1),
    icon: "./assets/curated/icons/cards/12_plug.svg",
    text: tuneCard("siphon_bolt", "text", "Deal 8 damage. Steal up to 4 Block from target."),
    heatText: tuneCard("siphon_bolt", "heatText", "+4 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("siphon_bolt", "heatGain", 4);
      const baseDamage = tuneCard("siphon_bolt", "baseDamage", 8);
      const stealBlockCap = tuneCard("siphon_bolt", "stealBlockCap", 4);
      ctx.gainHeat(heatGain);
      const stolen = Math.max(0, Math.min(stealBlockCap, ctx.target.block || 0));
      if (stolen > 0) {
        ctx.target.block -= stolen;
        ctx.gainBlock(stolen);
      }
      const damage = ctx.consumeAttackMultiplier(baseDamage);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Siphon Bolt dealt ${dealt} and siphoned ${stolen} Block.`);
    },
  },
  finisher_volley: {
    id: "finisher_volley",
    title: "Finisher Volley",
    type: "Attack",
    cost: tuneCard("finisher_volley", "cost", 2),
    icon: "./assets/curated/icons/cards/04_laser-blast.svg",
    text: tuneCard("finisher_volley", "text", "Deal 7 damage. Combo: Repeat."),
    heatText: tuneCard("finisher_volley", "heatText", "+8 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("finisher_volley", "heatGain", 8);
      const baseDamage = tuneCard("finisher_volley", "baseDamage", 7);
      const comboHits = tuneCard("finisher_volley", "comboHits", 2);
      const combo = isComboActive(ctx);
      ctx.gainHeat(heatGain);
      const hits = combo ? comboHits : 1;
      const damage = ctx.consumeAttackMultiplier(baseDamage);
      let total = 0;
      for (let hit = 0; hit < hits; hit += 1) {
        total += ctx.damageEnemy(ctx.target, damage);
        if (!ctx.target.alive) {
          break;
        }
      }
      ctx.log(`Finisher Volley dealt ${total}${combo ? " (combo burst)." : "."}`);
    },
  },
  ignition_jab: {
    id: "ignition_jab",
    title: "Ignition Jab",
    type: "Attack",
    cost: tuneCard("ignition_jab", "cost", 1),
    icon: "./assets/curated/icons/cards/07_spark-plug.svg",
    text: tuneCard("ignition_jab", "text", "Deal 7 damage. Firstfire: Gain 1 Steam."),
    heatText: tuneCard("ignition_jab", "heatText", "+4 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("ignition_jab", "heatGain", 4);
      const baseDamage = tuneCard("ignition_jab", "baseDamage", 7);
      const firstfireEnergy = tuneCard("ignition_jab", "firstfireEnergy", 1);
      const firstfire = isFirstfireReady(ctx);
      ctx.gainHeat(heatGain);
      const damage = ctx.consumeAttackMultiplier(baseDamage);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      if (firstfire) {
        ctx.gainEnergy(firstfireEnergy);
      }
      ctx.log(`Ignition Jab hit ${ctx.target.name} for ${dealt}${firstfire ? " and sparked extra Steam." : "."}`);
    },
  },
  opening_salvo: {
    id: "opening_salvo",
    title: "Opening Salvo",
    type: "Attack",
    cost: tuneCard("opening_salvo", "cost", 1),
    icon: "./assets/curated/icons/cards/04_laser-blast.svg",
    text: tuneCard("opening_salvo", "text", "Deal 10 damage. Firstfire: +6 damage."),
    heatText: tuneCard("opening_salvo", "heatText", "+5 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("opening_salvo", "heatGain", 5);
      const baseDamage = tuneCard("opening_salvo", "baseDamage", 10);
      const firstfireBonus = tuneCard("opening_salvo", "firstfireBonus", 6);
      const firstfire = isFirstfireReady(ctx);
      ctx.gainHeat(heatGain);
      const damage = ctx.consumeAttackMultiplier(baseDamage + (firstfire ? firstfireBonus : 0));
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Opening Salvo struck ${ctx.target.name} for ${dealt}${firstfire ? " (firstfire).": "."}`);
    },
  },
  vent_vector: {
    id: "vent_vector",
    title: "Vent Vector",
    type: "Skill",
    cost: tuneCard("vent_vector", "cost", 1),
    icon: "./assets/curated/icons/cards/09_valve.svg",
    text: tuneCard("vent_vector", "text", "Lose 10 Heat. Firstfire: Draw 1."),
    heatText: tuneCard("vent_vector", "heatText", "-10 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("vent_vector", "heatGain", -10);
      const firstfireDraw = tuneCard("vent_vector", "firstfireDraw", 1);
      const firstfire = isFirstfireReady(ctx);
      ctx.gainHeat(heatGain);
      const drew = firstfire ? ctx.drawCards(firstfireDraw) : 0;
      ctx.log(`Vent Vector cooled the core${drew > 0 ? ` and drew ${drew}.` : "."}`);
    },
  },
  priming_plating: {
    id: "priming_plating",
    title: "Priming Plating",
    type: "Skill",
    cost: tuneCard("priming_plating", "cost", 1),
    icon: "./assets/curated/icons/cards/11_bellows.svg",
    text: tuneCard("priming_plating", "text", "Gain 8 Block. Firstfire: Gain +6 Block."),
    heatText: tuneCard("priming_plating", "heatText", "+2 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("priming_plating", "heatGain", 2);
      const blockBase = tuneCard("priming_plating", "blockBase", 8);
      const firstfireBonus = tuneCard("priming_plating", "firstfireBonus", 6);
      const firstfire = isFirstfireReady(ctx);
      ctx.gainHeat(heatGain);
      const block = blockBase + (firstfire ? firstfireBonus : 0);
      ctx.gainBlock(block);
      ctx.log(`Priming Plating granted ${block} Block.`);
    },
  },
  relay_uplink: {
    id: "relay_uplink",
    title: "Relay Uplink",
    type: "Reactor",
    cost: tuneCard("relay_uplink", "cost", 0),
    icon: "./assets/curated/icons/cards/17_power-generator.svg",
    text: tuneCard("relay_uplink", "text", "Gain 1 Steam. Firstfire: Draw 1."),
    heatText: tuneCard("relay_uplink", "heatText", "+4 heat"),
    target: "none",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("relay_uplink", "heatGain", 4);
      const baseEnergy = tuneCard("relay_uplink", "baseEnergy", 1);
      const firstfireDraw = tuneCard("relay_uplink", "firstfireDraw", 1);
      const firstfire = isFirstfireReady(ctx);
      ctx.gainHeat(heatGain);
      ctx.gainEnergy(baseEnergy);
      const drew = firstfire ? ctx.drawCards(firstfireDraw) : 0;
      ctx.log(`Relay Uplink generated ${baseEnergy} Steam${drew > 0 ? ` and drew ${drew}.` : "."}`);
    },
  },
  breach_line: {
    id: "breach_line",
    title: "Breach Line",
    type: "Attack",
    cost: tuneCard("breach_line", "cost", 2),
    icon: "./assets/curated/icons/cards/02_bolt-bomb.svg",
    text: tuneCard("breach_line", "text", "Deal 6 to all enemies. Firstfire: Repeat."),
    heatText: tuneCard("breach_line", "heatText", "+7 heat"),
    target: "all",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("breach_line", "heatGain", 7);
      const damageEach = tuneCard("breach_line", "damageEach", 6);
      const firstfireHits = tuneCard("breach_line", "firstfireHits", 2);
      const firstfire = isFirstfireReady(ctx);
      const hits = firstfire ? firstfireHits : 1;
      ctx.gainHeat(heatGain);
      const damage = ctx.consumeAttackMultiplier(damageEach);
      let total = 0;
      for (let hit = 0; hit < hits; hit += 1) {
        ctx.livingEnemies().forEach((enemy) => {
          total += ctx.damageEnemy(enemy, damage);
        });
      }
      ctx.log(`Breach Line blasted for ${total}${firstfire ? " (firstfire burst)." : "."}`);
    },
  },
  purge_blast: {
    id: "purge_blast",
    title: "Purge Blast",
    type: "Attack",
    cost: tuneCard("purge_blast", "cost", 1),
    icon: "./assets/curated/icons/cards/01_steam-blast.svg",
    text: tuneCard("purge_blast", "text", "Deal 6 damage. If hand is empty after play, draw 2."),
    heatText: tuneCard("purge_blast", "heatText", "+2 heat"),
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const heatGain = tuneCard("purge_blast", "heatGain", 2);
      const baseDamage = tuneCard("purge_blast", "baseDamage", 6);
      const emptyHandDraw = tuneCard("purge_blast", "emptyHandDraw", 2);
      ctx.gainHeat(heatGain);
      const damage = ctx.consumeAttackMultiplier(baseDamage);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      let drew = 0;
      if (Array.isArray(ctx.game?.hand) && ctx.game.hand.length === 0) {
        drew = ctx.drawCards(emptyHandDraw);
      }
      ctx.log(`Purge Blast hit ${ctx.target.name} for ${dealt}${drew > 0 ? ` and drew ${drew}.` : "."}`);
    },
  },
  strike: {
    id: "strike",
    title: "Strike",
    type: "Attack",
    cost: tuneCard("strike", "cost", 1),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/03_broadsword.svg",
    text: tuneCard("strike", "text", "Deal 6 damage."),
    heatText: "",
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const damage = ctx.consumeAttackMultiplier(6);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Strike hit ${ctx.target.name} for ${dealt}.`);
    },
  },
  guard: {
    id: "guard",
    title: "Guard",
    type: "Skill",
    cost: tuneCard("guard", "cost", 1),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/13_armor-upgrade.svg",
    text: tuneCard("guard", "text", "Gain 6 Block."),
    heatText: "",
    target: "none",
    exhaust: false,
    play: (ctx) => {
      ctx.gainBlock(6);
      ctx.log("Guard granted 6 Block.");
    },
  },
  advance: {
    id: "advance",
    title: "Advance",
    type: "Skill",
    cost: tuneCard("advance", "cost", 0),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/13_armor-upgrade.svg",
    text: tuneCard("advance", "text", "Gain 1 Energy. Draw 1. Exhaust."),
    heatText: "",
    target: "none",
    exhaust: true,
    play: (ctx) => {
      const drew = ctx.drawCards(1);
      ctx.gainEnergy(1);
      ctx.log(`Advance granted 1 Energy and drew ${drew}.`);
    },
  },
  recover: {
    id: "recover",
    title: "Recover",
    type: "Skill",
    cost: tuneCard("recover", "cost", 1),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/15_ghost.svg",
    text: tuneCard("recover", "text", "Heal 4. Exhaust."),
    heatText: "",
    target: "none",
    exhaust: true,
    play: (ctx) => {
      const before = ctx.game.player.hull;
      ctx.game.player.hull = Math.min(ctx.game.player.maxHull, ctx.game.player.hull + 4);
      const healed = ctx.game.player.hull - before;
      ctx.log(`Recover restored ${healed} Hull.`);
    },
  },
  crushing_swing: {
    id: "crushing_swing",
    title: "Crushing Swing",
    type: "Attack",
    cost: tuneCard("crushing_swing", "cost", 2),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/03_broadsword.svg",
    text: tuneCard("crushing_swing", "text", "Deal 11 damage. If the target already took damage this turn, deal 4 more."),
    heatText: "",
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const bonus = ctx.target?.tookDamageThisTurn ? 4 : 0;
      const damage = ctx.consumeAttackMultiplier(11 + bonus);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Crushing Swing hit ${ctx.target.name} for ${dealt}.`);
    },
  },
  war_shout: {
    id: "war_shout",
    title: "War Shout",
    type: "Skill",
    cost: tuneCard("war_shout", "cost", 1),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/06_burning-skull.svg",
    text: tuneCard("war_shout", "text", "Gain 5 Block. Your next Attack this turn deals +4 damage."),
    heatText: "",
    target: "none",
    exhaust: false,
    play: (ctx) => {
      ctx.gainBlock(5);
      ctx.game.player.nextAttackFlatBonus = Math.max(0, Number.parseInt(ctx.game.player.nextAttackFlatBonus, 10) || 0) + 4;
      ctx.log("War Shout granted 5 Block and primed your next attack.");
    },
  },
  battle_instinct: {
    id: "battle_instinct",
    title: "Battle Instinct",
    type: "Skill",
    cost: tuneCard("battle_instinct", "cost", 0),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/06_burning-skull.svg",
    text: tuneCard("battle_instinct", "text", "Draw 2. If your hand contains 2 or more Attack cards, gain 1 Energy. Exhaust."),
    heatText: "",
    target: "none",
    exhaust: true,
    play: (ctx) => {
      const drew = ctx.drawCards(2);
      const attackCount = Array.isArray(ctx.game?.hand)
        ? ctx.game.hand.filter((instance) => baseCatalog[instance?.cardId]?.type === "Attack").length
        : 0;
      if (attackCount >= 2) {
        ctx.gainEnergy(1);
      }
      ctx.log(`Battle Instinct drew ${drew}${attackCount >= 2 ? " and granted 1 Energy." : "."}`);
    },
  },
  blood_rush: {
    id: "blood_rush",
    title: "Blood Rush",
    type: "Attack",
    cost: tuneCard("blood_rush", "cost", 1),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/03_broadsword.svg",
    text: tuneCard("blood_rush", "text", "Lose 3 HP. Deal 14 damage."),
    heatText: "",
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      if (typeof ctx.damagePlayer === "function") {
        ctx.damagePlayer(3, true);
      }
      const damage = ctx.consumeAttackMultiplier(14);
      const dealt = ctx.damageEnemy(ctx.target, damage);
      ctx.log(`Blood Rush hit ${ctx.target.name} for ${dealt}.`);
    },
  },
  flame_spark: {
    id: "flame_spark",
    title: "Flame Spark",
    type: "Spell",
    cost: tuneCard("flame_spark", "cost", 1),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/10_burning-embers.svg",
    text: tuneCard("flame_spark", "text", "Deal 7 damage. If this is the first Spell you played this turn, gain 1 Energy."),
    heatText: "",
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const firstSpell = (Number.isInteger(ctx.game?.turnSpellActionsUsed) ? ctx.game.turnSpellActionsUsed : 0) === 0;
      const dealt = ctx.damageEnemy(ctx.target, 7);
      if (firstSpell) {
        ctx.gainEnergy(1);
      }
      ctx.log(`Flame Spark hit ${ctx.target.name} for ${dealt}${firstSpell ? " and granted 1 Energy." : "."}`);
    },
  },
  cold_snap: {
    id: "cold_snap",
    title: "Cold Snap",
    type: "Spell",
    cost: tuneCard("cold_snap", "cost", 1),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/15_ghost.svg",
    text: tuneCard("cold_snap", "text", "Deal 5 damage. Gain 4 Block."),
    heatText: "",
    target: "enemy",
    exhaust: false,
    play: (ctx) => {
      const dealt = ctx.damageEnemy(ctx.target, 5);
      ctx.gainBlock(4);
      ctx.log(`Cold Snap hit ${ctx.target.name} for ${dealt} and granted 4 Block.`);
    },
  },
  warmth_card: {
    id: "warmth_card",
    title: "Warmth",
    type: "Skill",
    cost: tuneCard("warmth_card", "cost", 1),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/10_burning-embers.svg",
    text: tuneCard("warmth_card", "text", "Gain 1 Energy now and 1 Energy next turn. Exhaust."),
    heatText: "",
    target: "none",
    exhaust: true,
    play: (ctx) => {
      ctx.gainEnergy(1);
      ctx.game.player.pendingEnergyNextTurn = Math.max(
        0,
        Number.parseInt(ctx.game.player.pendingEnergyNextTurn, 10) || 0
      ) + 1;
      ctx.log("Warmth granted 1 Energy now and 1 next turn.");
    },
  },
  arc_surge: {
    id: "arc_surge",
    title: "Arc Surge",
    type: "Spell",
    cost: tuneCard("arc_surge", "cost", 2),
    icon: "./assets/curated/themes/diablo-inspired/icons/cards/06_burning-skull.svg",
    text: tuneCard("arc_surge", "text", "Deal 4 damage to all enemies. If you played another Spell this turn, draw 1."),
    heatText: "",
    target: "all",
    exhaust: false,
    play: (ctx) => {
      const priorSpells = Number.isInteger(ctx.game?.turnSpellActionsUsed) ? ctx.game.turnSpellActionsUsed : 0;
      let total = 0;
      ctx.livingEnemies().forEach((enemy) => {
        total += ctx.damageEnemy(enemy, 4);
      });
      let drew = 0;
      if (priorSpells > 0) {
        drew = ctx.drawCards(1);
      }
      ctx.log(`Arc Surge dealt ${total} total damage${drew > 0 ? ` and drew ${drew}.` : "."}`);
    },
  },
    };

    const classSpellCatalog = getEmbeddedSpellCatalog();
    Object.values(classSpellCatalog).forEach((spell) => {
      if (!spell || typeof spell !== "object" || typeof spell.id !== "string" || baseCatalog[spell.id]) {
        return;
      }
      const cardType = getClassCardType(spell);
      const target = getClassCardTarget(spell);
      const linkedSkillId = typeof spell.linkedSkillId === "string" ? spell.linkedSkillId : "";
      const defaultCostRaw = Number.parseInt(
        window?.BRASSLINE_CLASS_CONTENT?.getSkillCatalog?.()?.[linkedSkillId]?.energyCost,
        10
      );
      const defaultCost = Number.isInteger(defaultCostRaw) ? Math.max(0, defaultCostRaw) : 1;
      baseCatalog[spell.id] = {
        id: spell.id,
        title: typeof spell.title === "string" ? spell.title : spell.id,
        type: cardType,
        cost: tuneCard(spell.id, "cost", defaultCost),
        icon: typeof spell.icon === "string" ? spell.icon : "./assets/curated/themes/diablo-inspired/icons/cards/06_burning-skull.svg",
        text: tuneCard(spell.id, "text", buildClassSpellText(spell)),
        heatText: tuneCard(spell.id, "heatText", ""),
        target,
        exhaust: false,
        linkedSkillId,
        spellId: spell.id,
        classCard: true,
        play: (ctx) => {
          if (typeof ctx?.castClassSpellCard !== "function") {
            ctx.log(`${spell.title || spell.id} fizzled.`);
            return;
          }
          const outcome = ctx.castClassSpellCard({
            spellId: spell.id,
            effect: spell.effect,
            sourceCardType: cardType,
          });
          ctx.log(outcome?.message || `${spell.title || spell.id} resolved.`);
        },
      };
    });

    return baseCatalog;
  }

  window.BRASSLINE_CARD_CATALOG = {
    createCardCatalog,
  };
})();
