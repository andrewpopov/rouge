(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  interface EventTemplate {
    id: string;
    kind: ExplorationEvent["kind"];
    title: string;
    flavor: string;
    icon: string;
    buildChoices: (run: RunState, content: GameContent) => ExplorationEventChoice[];
    minEncountersCleared?: number;
    minGold?: number;
  }

  const { getUpgradableCardIds } = runtimeWindow.ROUGE_REWARD_ENGINE;

  const SHRINE_EVENTS: EventTemplate[] = [
    {
      id: "shrine_of_war",
      kind: "shrine",
      title: "Shrine of War",
      flavor: "A cracked obelisk radiates a deep crimson glow. Weapons lie scattered at its base\u2014offerings from warriors who sought its blessing. The stone hums with barely contained violence.",
      icon: "\u{2694}",
      minEncountersCleared: 1,
      buildChoices(_run) {
        return [
          { id: "war_embrace", title: "Embrace the Fury", description: "Lose 6 HP. Mercenary gains +3 attack. The shrine feeds on sacrifice.", effects: [{ kind: "hero_damage", value: 6 }, { kind: "mercenary_attack", value: 3 }] },
          { id: "war_temper", title: "Temper Your Resolve", description: "Mercenary gains +1 attack and +4 max Life. A measured offering.", effects: [{ kind: "mercenary_attack", value: 1 }, { kind: "mercenary_max_life", value: 4 }] },
          { id: "war_reject", title: "Reject the Shrine", description: "Gain +4 max HP. You will fight on your own terms.", effects: [{ kind: "hero_max_life", value: 4 }] },
        ];
      },
    },
    {
      id: "shrine_of_plenty",
      kind: "shrine",
      title: "Shrine of Plenty",
      flavor: "Golden coins spill from a crack in the earth around a moss-covered altar. A warm breeze carries the scent of honeyed wine. The shrine promises abundance to those who kneel.",
      icon: "\u{1F4B0}",
      minEncountersCleared: 0,
      buildChoices(_run) {
        return [
          { id: "plenty_tithe", title: "Leave a Tithe", description: "Pay 10 gold. Gain +8 max HP and refill 2 potions. The shrine rewards generosity.", effects: [{ kind: "gold_bonus", value: -10 }, { kind: "hero_max_life", value: 8 }, { kind: "refill_potions", value: 2 }] },
          { id: "plenty_take", title: "Take the Offering", description: "Gain 25 gold from the pile. The shrine dims but does not protest.", effects: [{ kind: "gold_bonus", value: 25 }] },
          { id: "plenty_pray", title: "Pray for Guidance", description: "Gain 10 gold and refill 1 potion. A humble blessing.", effects: [{ kind: "gold_bonus", value: 10 }, { kind: "refill_potions", value: 1 }] },
        ];
      },
    },
    {
      id: "shrine_of_vitality",
      kind: "shrine",
      title: "Shrine of Vitality",
      flavor: "Vines thick with luminous blossoms coil around an ancient stone. Each bloom pulses with a heartbeat rhythm. The air itself feels nourishing\u2014wounds close, pain fades, weariness lifts.",
      icon: "\u{1F33F}",
      minEncountersCleared: 0,
      buildChoices(_run) {
        return [
          { id: "vitality_bloom", title: "Breathe the Blossoms", description: "Gain +10 max HP and recover that amount. The vines wither after giving their gift.", effects: [{ kind: "hero_max_life", value: 10 }] },
          { id: "vitality_share", title: "Share with Your Companion", description: "Gain +4 max HP. Mercenary gains +6 max Life. The shrine blesses all who stand near.", effects: [{ kind: "hero_max_life", value: 4 }, { kind: "mercenary_max_life", value: 6 }] },
          { id: "vitality_harvest", title: "Harvest the Blossoms", description: "Refill all potions and gain +1 belt capacity. The petals make potent salves.", effects: [{ kind: "belt_capacity", value: 1 }, { kind: "refill_potions", value: 99 }] },
        ];
      },
    },
    {
      id: "shrine_of_shadow",
      kind: "shrine",
      title: "Shrine of Shadow",
      flavor: "No light touches this altar. It drinks in the torchlight, leaving only a void that whispers promises of power. Dark gifts always come with dark costs.",
      icon: "\u{1F311}",
      minEncountersCleared: 2,
      buildChoices(_run) {
        return [
          { id: "shadow_bargain", title: "Embrace the Dark", description: "Lose 10 HP. Gain +10 max HP and +2 mercenary attack. Power at a steep price.", effects: [{ kind: "hero_damage", value: 10 }, { kind: "hero_max_life", value: 10 }, { kind: "mercenary_attack", value: 2 }] },
          { id: "shadow_glimpse", title: "Peer into the Void", description: "Lose 4 HP. Gain 20 gold and refill 1 potion. A taste of the abyss.", effects: [{ kind: "hero_damage", value: 4 }, { kind: "gold_bonus", value: 20 }, { kind: "refill_potions", value: 1 }] },
          { id: "shadow_resist", title: "Turn Away", description: "Gain +2 max HP. Your resolve strengthens. Not all power is worth claiming.", effects: [{ kind: "hero_max_life", value: 2 }] },
        ];
      },
    },
    {
      id: "shrine_of_the_fallen",
      kind: "shrine",
      title: "Shrine of the Fallen",
      flavor: "Names are carved into every surface of this monument\u2014hundreds of them, in scripts both familiar and alien. A spectral flame burns at its peak, refusing to die. It honors those who came before.",
      icon: "\u{1F56F}",
      minEncountersCleared: 3,
      buildChoices(_run) {
        return [
          { id: "fallen_honor", title: "Add Your Name", description: "Gain +6 max HP, +1 mercenary attack, and refill 1 potion. The shrine acknowledges you.", effects: [{ kind: "hero_max_life", value: 6 }, { kind: "mercenary_attack", value: 1 }, { kind: "refill_potions", value: 1 }] },
          { id: "fallen_mourn", title: "Mourn the Lost", description: "Gain +8 max HP. Mercenary gains +4 max Life. Grief sharpens purpose.", effects: [{ kind: "hero_max_life", value: 8 }, { kind: "mercenary_max_life", value: 4 }] },
          { id: "fallen_desecrate", title: "Loot the Offerings", description: "Gain 30 gold. The flame flickers angrily but cannot stop you.", effects: [{ kind: "gold_bonus", value: 30 }] },
        ];
      },
    },
  ];

  const BLESSING_EVENTS: EventTemplate[] = [
    {
      id: "roadside_shrine", kind: "blessing", title: "Roadside Shrine",
      flavor: "A small stone shrine stands at a crossroads, garlands of dried flowers draped across its face. Travelers have left offerings here for generations. The air around it feels still and warm.",
      icon: "\u{2728}", minEncountersCleared: 0,
      buildChoices(_run) {
        return [
          { id: "shrine_vitality", title: "Pray for Vitality", description: "Gain +6 max HP and recover that amount.", effects: [{ kind: "hero_max_life", value: 6 }] },
          { id: "shrine_fortune", title: "Pray for Fortune", description: "Gain 20 gold.", effects: [{ kind: "gold_bonus", value: 20 }] },
          { id: "shrine_companionship", title: "Pray for Companionship", description: "Your mercenary gains +1 attack and +4 max Life.", effects: [{ kind: "mercenary_attack", value: 1 }, { kind: "mercenary_max_life", value: 4 }] },
        ];
      },
    },
    {
      id: "fallen_paladin", kind: "blessing", title: "Fallen Paladin",
      flavor: "A dying knight leans against a shattered pillar, blood pooling beneath rusted plate. With a trembling hand he holds out a vial of golden light. \"Take it. My fight is over. Yours is not.\"",
      icon: "\u{1F6E1}", minEncountersCleared: 2,
      buildChoices(_run) {
        return [
          { id: "paladin_vial", title: "Take the Vial", description: "Gain +8 max HP and recover that amount. A paladin's final blessing.", effects: [{ kind: "hero_max_life", value: 8 }] },
          { id: "paladin_sword", title: "Take His Sword", description: "Your mercenary gains +2 attack. The blade still hums with conviction.", effects: [{ kind: "mercenary_attack", value: 2 }] },
          { id: "paladin_honor", title: "Honor His Memory", description: "Gain 12 gold and refill 1 potion. Bury him properly before moving on.", effects: [{ kind: "gold_bonus", value: 12 }, { kind: "refill_potions", value: 1 }] },
        ];
      },
    },
    {
      id: "enchanted_spring", kind: "blessing", title: "Enchanted Spring",
      flavor: "Crystal-clear water bubbles up from between mossy stones. The pool glows faintly beneath the surface. Something about the light makes old wounds feel distant.",
      icon: "\u{1F4A7}", minEncountersCleared: 1,
      buildChoices(_run) {
        return [
          { id: "spring_drink", title: "Drink Deeply", description: "Recover up to 12 HP. The water tastes of starlight.", effects: [{ kind: "hero_heal", value: 12 }] },
          { id: "spring_fill", title: "Fill Your Flasks", description: "Refill 2 potion charges. The spring water preserves well.", effects: [{ kind: "refill_potions", value: 2 }] },
          { id: "spring_bathe", title: "Bathe in the Waters", description: "Gain +4 max HP and recover that amount. The spring strengthens what it touches.", effects: [{ kind: "hero_max_life", value: 4 }] },
        ];
      },
    },
  ];

  const GAMBLE_EVENTS: EventTemplate[] = [
    {
      id: "goblin_merchant", kind: "gamble", title: "Goblin Merchant",
      flavor: "A hunched figure emerges from behind a boulder, dragging a sack twice its size. Mismatched eyes gleam with avarice. \"Deal? Deal! Good deal for strong hero. Maybe.\"",
      icon: "\u{1F47A}", minGold: 15, minEncountersCleared: 1,
      buildChoices(run) {
        if (run.gold < 15) {return [];}
        return [
          { id: "goblin_big_bet", title: "The Big Bet", description: "Pay 30 gold. Gain +10 max HP, +1 mercenary attack, and refill all potions.", effects: [{ kind: "gold_bonus", value: -30 }, { kind: "hero_max_life", value: 10 }, { kind: "mercenary_attack", value: 1 }, { kind: "refill_potions", value: 99 }] },
          { id: "goblin_small_bet", title: "The Small Bet", description: "Pay 15 gold. Gain +6 max HP and refill 1 potion.", effects: [{ kind: "gold_bonus", value: -15 }, { kind: "hero_max_life", value: 6 }, { kind: "refill_potions", value: 1 }] },
          { id: "goblin_rob", title: "Rob the Goblin", description: "Take 25 gold. The goblin flees shrieking. You feel slightly guilty.", effects: [{ kind: "gold_bonus", value: 25 }] },
        ];
      },
    },
    {
      id: "cursed_chest", kind: "gamble", title: "Cursed Chest",
      flavor: "A heavy iron chest sits in the center of the room, chains wrapped tight around its frame. Scratches in the stone floor suggest it has been dragged here from somewhere deep below. It vibrates faintly.",
      icon: "\u{1F5DD}", minEncountersCleared: 2,
      buildChoices(_run) {
        return [
          { id: "chest_open", title: "Break the Chains", description: "Lose 8 HP. Gain 35 gold and +2 mercenary attack. Pain is temporary, gold is not.", effects: [{ kind: "hero_damage", value: 8 }, { kind: "gold_bonus", value: 35 }, { kind: "mercenary_attack", value: 2 }] },
          { id: "chest_careful", title: "Pick the Lock", description: "Gain 18 gold. Slower, but safer. Most of the contents are intact.", effects: [{ kind: "gold_bonus", value: 18 }] },
          { id: "chest_leave", title: "Walk Away", description: "Some things are better left sealed. Gain +4 max HP from the peace of mind.", effects: [{ kind: "hero_max_life", value: 4 }] },
        ];
      },
    },
    {
      id: "bone_dice", kind: "gamble", title: "Bone Dice",
      flavor: "Two skeletal hands protrude from a crack in the wall, cupping a pair of yellowed dice. A voice like grinding gravel speaks: \"Winner takes. Loser pays. Roll?\"",
      icon: "\u{1F3B2}", minEncountersCleared: 3, minGold: 10,
      buildChoices(run) {
        if (run.gold < 10) {return [];}
        return [
          { id: "dice_high", title: "Bet High", description: "Pay 25 gold. Gain +8 max HP, +2 mercenary attack, and refill 2 potions.", effects: [{ kind: "gold_bonus", value: -25 }, { kind: "hero_max_life", value: 8 }, { kind: "mercenary_attack", value: 2 }, { kind: "refill_potions", value: 2 }] },
          { id: "dice_low", title: "Bet Low", description: "Pay 10 gold. Gain +4 max HP and refill 1 potion. Safe and sensible.", effects: [{ kind: "gold_bonus", value: -10 }, { kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }] },
          { id: "dice_cheat", title: "Kick the Wall", description: "Smash the skeletal hands. Grab 15 gold from the rubble. The voice curses you.", effects: [{ kind: "gold_bonus", value: 15 }] },
        ];
      },
    },
  ];

  const TRADER_EVENTS: EventTemplate[] = [
    {
      id: "potion_peddler", kind: "trader", title: "Potion Peddler",
      flavor: "A cloaked figure blocks the path, dozens of glass vials clinking at her belt. \"Potions! Salves! Elixirs of dubious origin! Everything your expedition needs, priced to move.\"",
      icon: "\u{1F9EA}", minGold: 10,
      buildChoices(run) {
        if (run.gold < 10) {return [];}
        return [
          { id: "peddler_bulk", title: "Buy in Bulk", description: "Pay 20 gold. Refill all potion charges and increase belt capacity by 1.", effects: [{ kind: "gold_bonus", value: -20 }, { kind: "belt_capacity", value: 1 }, { kind: "refill_potions", value: 99 }] },
          { id: "peddler_one", title: "Buy One Potion", description: "Pay 10 gold. Refill 2 potion charges. Quick and affordable.", effects: [{ kind: "gold_bonus", value: -10 }, { kind: "refill_potions", value: 2 }] },
          { id: "peddler_haggle", title: "Haggle Aggressively", description: "Refill 1 potion charge for free. She looks annoyed but relents.", effects: [{ kind: "refill_potions", value: 1 }] },
        ];
      },
    },
    {
      id: "arms_dealer", kind: "trader", title: "Arms Dealer",
      flavor: "Crates of weapons line the cavern walls, each stamped with military insignia from kingdoms you don't recognize. The dealer sharpens a blade without looking up. \"Buying or browsing?\"",
      icon: "\u{2694}", minGold: 15, minEncountersCleared: 2,
      buildChoices(run) {
        if (run.gold < 15) {return [];}
        return [
          { id: "arms_merc_weapon", title: "Arm Your Mercenary", description: "Pay 20 gold. Mercenary gains +3 attack. A proper blade makes all the difference.", effects: [{ kind: "gold_bonus", value: -20 }, { kind: "mercenary_attack", value: 3 }] },
          { id: "arms_armor", title: "Buy Reinforced Armor", description: "Pay 15 gold. Gain +8 max HP. The plating is heavy but reliable.", effects: [{ kind: "gold_bonus", value: -15 }, { kind: "hero_max_life", value: 8 }] },
          { id: "arms_browse", title: "Just Browsing", description: "Chat with the dealer. Learn nothing useful but gain 5 gold he drops accidentally.", effects: [{ kind: "gold_bonus", value: 5 }] },
        ];
      },
    },
  ];

  const MYSTERY_EVENTS: EventTemplate[] = [
    {
      id: "strange_mirror", kind: "mystery", title: "Strange Mirror",
      flavor: "A full-length mirror stands upright in the middle of the corridor, impossibly clean amid the filth. Your reflection stares back, but its expression doesn't match yours. It mouths a single word: \"Choose.\"",
      icon: "\u{1FA9E}", minEncountersCleared: 2,
      buildChoices(_run) {
        return [
          { id: "mirror_touch", title: "Touch the Glass", description: "Lose 5 HP. Gain +6 max HP and +1 mercenary attack. The mirror shatters.", effects: [{ kind: "hero_damage", value: 5 }, { kind: "hero_max_life", value: 6 }, { kind: "mercenary_attack", value: 1 }] },
          { id: "mirror_speak", title: "Speak to the Reflection", description: "Gain 15 gold. Your reflection smiles and fades. The mirror becomes ordinary.", effects: [{ kind: "gold_bonus", value: 15 }] },
          { id: "mirror_smash", title: "Shatter the Mirror", description: "Gain +4 max HP. Seven years of bad luck, but also seven shards of enchanted glass.", effects: [{ kind: "hero_max_life", value: 4 }] },
        ];
      },
    },
    {
      id: "whispering_well", kind: "mystery", title: "Whispering Well",
      flavor: "A deep stone well stands in a clearing, its rim worn smooth by countless hands. Whispers drift up from the darkness below, too faint to make out. A frayed rope dangles into the void.",
      icon: "\u{1F573}", minEncountersCleared: 1,
      buildChoices(_run) {
        return [
          { id: "well_coin", title: "Toss a Coin", description: "Pay 10 gold. Gain +6 max HP and refill 1 potion. The whispers bless you.", effects: [{ kind: "gold_bonus", value: -10 }, { kind: "hero_max_life", value: 6 }, { kind: "refill_potions", value: 1 }] },
          { id: "well_descend", title: "Climb Down", description: "Lose 4 HP from the rough descent. Find 22 gold and a forgotten potion at the bottom.", effects: [{ kind: "hero_damage", value: 4 }, { kind: "gold_bonus", value: 22 }, { kind: "refill_potions", value: 1 }] },
          { id: "well_listen", title: "Listen Carefully", description: "The whispers teach patience. Gain +4 max HP. Sometimes the best move is stillness.", effects: [{ kind: "hero_max_life", value: 4 }] },
        ];
      },
    },
    {
      id: "abandoned_camp", kind: "mystery", title: "Abandoned Camp",
      flavor: "Tents sag on broken poles, supplies scattered across the mud. Whatever drove these travelers away left in a hurry. A cooking fire still smolders. The stew smells edible.",
      icon: "\u{26FA}", minEncountersCleared: 0,
      buildChoices(_run) {
        return [
          { id: "camp_eat", title: "Eat the Stew", description: "Recover 8 HP and refill 1 potion. Waste not, want not.", effects: [{ kind: "hero_heal", value: 8 }, { kind: "refill_potions", value: 1 }] },
          { id: "camp_loot", title: "Search the Tents", description: "Gain 16 gold from scattered belongings. Someone else's misfortune is your gain.", effects: [{ kind: "gold_bonus", value: 16 }] },
          { id: "camp_rest", title: "Rest by the Fire", description: "Gain +4 max HP and recover that amount. A moment of calm before the next storm.", effects: [{ kind: "hero_max_life", value: 4 }] },
        ];
      },
    },
  ];

  const REST_EVENTS: EventTemplate[] = [
    {
      id: "hermit_healer", kind: "rest", title: "Hermit Healer",
      flavor: "Smoke curls from a chimney hidden among the rocks. Inside, an old woman tends a bubbling cauldron. She neither smiles nor frowns. \"Sit. Heal. Then leave.\"",
      icon: "\u{1F33F}", minEncountersCleared: 1,
      buildChoices(_run) {
        return [
          { id: "healer_full", title: "Full Treatment", description: "Pay 12 gold. Recover 15 HP and refill 2 potions. Her medicine is bitter but effective.", effects: [{ kind: "gold_bonus", value: -12 }, { kind: "hero_heal", value: 15 }, { kind: "refill_potions", value: 2 }] },
          { id: "healer_tonic", title: "Quick Tonic", description: "Recover 8 HP for free. She waves away your coin. \"Just go.\"", effects: [{ kind: "hero_heal", value: 8 }] },
          { id: "healer_mercenary", title: "Tend the Mercenary", description: "Mercenary gains +4 max Life. She patches the worst of the wounds.", effects: [{ kind: "mercenary_max_life", value: 4 }] },
        ];
      },
    },
  ];

  const TRIAL_EVENTS: EventTemplate[] = [
    {
      id: "guardian_statue", kind: "trial", title: "Guardian Statue",
      flavor: "A towering stone guardian blocks the passage, eyes glowing faintly red. A plaque at its feet reads: \"Prove your worth or pay the toll. None pass freely.\"",
      icon: "\u{1F5FF}", minEncountersCleared: 2,
      buildChoices(_run) {
        return [
          { id: "statue_fight", title: "Prove Your Worth", description: "Lose 10 HP. Gain +8 max HP and +2 mercenary attack. Strength respects strength.", effects: [{ kind: "hero_damage", value: 10 }, { kind: "hero_max_life", value: 8 }, { kind: "mercenary_attack", value: 2 }] },
          { id: "statue_pay", title: "Pay the Toll", description: "Pay 20 gold. The statue steps aside. Gain +4 max HP for the courtesy.", effects: [{ kind: "gold_bonus", value: -20 }, { kind: "hero_max_life", value: 4 }] },
          { id: "statue_sneak", title: "Find Another Way", description: "Gain 8 gold from a side passage. The statue does not pursue.", effects: [{ kind: "gold_bonus", value: 8 }] },
        ];
      },
    },
    {
      id: "blood_fountain", kind: "trial", title: "Blood Fountain",
      flavor: "Crimson water flows upward from a cracked basin, defying gravity. The fountain's edge is lined with handprints\u2014some old, some disturbingly fresh. Power radiates from its depths.",
      icon: "\u{1FA78}", minEncountersCleared: 3,
      buildChoices(_run) {
        return [
          { id: "fountain_drink", title: "Drink from the Fountain", description: "Lose 12 HP. Gain +12 max HP and +2 mercenary attack. The blood remembers strength.", effects: [{ kind: "hero_damage", value: 12 }, { kind: "hero_max_life", value: 12 }, { kind: "mercenary_attack", value: 2 }] },
          { id: "fountain_splash", title: "Splash the Water", description: "Lose 4 HP. Gain +6 max HP. A cautious taste of forbidden power.", effects: [{ kind: "hero_damage", value: 4 }, { kind: "hero_max_life", value: 6 }] },
          { id: "fountain_leave", title: "Leave It Be", description: "Gain +2 max HP. Discretion is the better part of valor.", effects: [{ kind: "hero_max_life", value: 2 }] },
        ];
      },
    },
  ];

  runtimeWindow.__ROUGE_EXPLORATION_EVENT_TEMPLATES = {
    SHRINE_EVENTS,
    BLESSING_EVENTS,
    GAMBLE_EVENTS,
    TRADER_EVENTS,
    MYSTERY_EVENTS,
    REST_EVENTS,
    TRIAL_EVENTS,
    getUpgradableCardIds,
  };
})();
