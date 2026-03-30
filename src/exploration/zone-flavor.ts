(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ═══════════════════════════════════════════
  //  Zone environment classification
  // ═══════════════════════════════════════════
  //  Groups zones by terrain/atmosphere so event
  //  flavor text can vary by environment.

  type ZoneEnv = "moor" | "cave" | "plains" | "forest" | "marsh" | "ruins" | "monastery"
    | "desert" | "oasis" | "canyon" | "tomb" | "jungle" | "temple" | "hell" | "ice" | "mountain";

  const ZONE_ENV_MAP: Record<string, ZoneEnv> = {
    // Act 1
    "forsaken palisade": "ruins",
    "blighted moors": "moor",
    "black pit": "cave",
    "pale fields": "plains",
    "graveyard ridge": "ruins",
    "cairn field": "plains",
    "ashfall hamlet": "ruins",
    "hollow passage": "cave",
    "gloamwood": "forest",
    "drowning marsh": "marsh",
    "ruined watchtower": "ruins",
    "monastery gate": "monastery",
    "outer abbey": "monastery",
    "gate barracks": "monastery",
    "iron cells": "cave",
    "inner cloister": "monastery",
    "black chapel": "monastery",
    "abbey vault": "cave",
    // Act 2
    "oasis refuge": "oasis",
    "shale flats": "desert",
    "collapsed cisterns": "cave",
    "dust hills": "desert",
    "buried tomb entries": "tomb",
    "salt oasis": "oasis",
    "sunken archives": "ruins",
    "worm-tunnels": "cave",
    "serpent vaults": "tomb",
    "veiled court": "temple",
    "lower court": "cave",
    "star archive": "temple",
    "sandscript canyon": "canyon",
    "royal vault": "tomb",
    "royal sepulcher": "tomb",
    // Act 3
    "rotting dock refuge": "jungle",
    "widowwood": "jungle",
    "spider hollows": "cave",
    "fever marsh": "marsh",
    "hunter village": "jungle",
    "hunter canopy": "jungle",
    "drowned causeway": "temple",
    "river quarter": "jungle",
    "idol market": "temple",
    "flooded processional": "temple",
    "temple stairs": "temple",
    "idol court": "temple",
    "corrupted sanctum": "temple",
    // Act 4
    "ruined sanctuary": "hell",
    "burning causeway": "hell",
    "chained bastion": "hell",
    "demon forge": "hell",
    "black gate": "hell",
    "ashen throne": "hell",
    // Act 5
    "frosthaven keep": "mountain",
    "siege walls": "mountain",
    "watchfire ridge": "mountain",
    "icebound river": "ice",
    "tombs of the fallen": "mountain",
    "white drift cavern": "cave",
    "ancient halls": "ice",
    "mourning temple": "ice",
    "glacial tunnels": "ice",
    "sorrow halls": "cave",
    "frost scar": "ice",
    "ruin halls": "cave",
    "the ascent": "mountain",
    "oathbreaker vault": "cave",
    "summit gate": "mountain",
    "summit citadel": "mountain",
    "citadel core": "hell",
    "crown of ruin": "hell",
  };

  function resolveZoneEnv(zoneTitle: string): ZoneEnv | null {
    const key = zoneTitle.toLowerCase();
    for (const [pattern, env] of Object.entries(ZONE_ENV_MAP)) {
      if (key.includes(pattern)) {return env;}
    }
    return null;
  }

  // ═══════════════════════════════════════════
  //  Per-event environment flavor overrides
  // ═══════════════════════════════════════════
  //  Keys: eventId → envType → flavor string.
  //  Only events that benefit from zone-aware text
  //  need entries. Missing combos fall through to
  //  the template's default flavor.

  const ENV_FLAVOR: Record<string, Partial<Record<ZoneEnv, string>>> = {
    // Card upgrade events
    ancient_forge: {
      cave: "Deep in the tunnels, a forge built into the living rock still glows. Dwarven runes line the chimney — someone knew this vein of iron well.",
      desert: "Half-buried in sand, an anvil radiates heat that has nothing to do with the sun. The forge stones are cracked but the enchantment holds.",
      jungle: "Vines have claimed the bellows, but the coals beneath burn eternal. The jungle tried to swallow this forge and failed.",
      hell: "Hellfire needs no bellows. A demonic forge juts from the scorched ground, its anvil stained with the blood of a thousand weapons.",
      ice: "Frost rimes everything except the anvil. Steam hisses where snowflakes touch the metal. Even the cold cannot quench this fire.",
      mountain: "Carved into the cliffside, a barbarian forge overlooks the valley below. The mountain wind feeds the flames.",
      marsh: "The forge stands on a stone platform above the waterline, its chimney blackened by centuries of use. Bog iron litters the ground.",
      monastery: "In a ruined workshop behind the barracks, a forge still burns. The Rogues kept their weapons sharp here once.",
      temple: "Ornate braziers flank an altar-forge. Whatever priests tended this flame, they forged more than prayers.",
      ruins: "Among the rubble, a smith's workshop stands mostly intact. Tools hang on pegs as if their owner just stepped out.",
    },
    hermits_library: {
      cave: "Bookshelves have been carved into the cavern walls, each tome sealed behind glass to keep out the damp. A lantern flickers at the back.",
      desert: "A stone chamber beneath the dunes holds scrolls preserved by dry air. The hermit wraps each one in oiled cloth.",
      jungle: "Bamboo shelves sag under leather-bound volumes. The hermit has rigged palm-leaf awnings to keep the rain off.",
      hell: "Charred pages flutter in the sulfurous wind. The hermit binds his books in demon hide — nothing else survives the heat.",
      ice: "The library is an ice cave, books frozen in crystal-clear walls. The hermit chips them free one at a time.",
      monastery: "A hidden scriptorium behind the cathedral altar. The Rogues never found this room — the hermit prefers it that way.",
      ruins: "Salvaged books fill a cellar beneath a collapsed house. The hermit has been collecting since before the town fell.",
    },
    wandering_smith: {
      cave: "She sits at the tunnel mouth, tools spread on a flat rock. \"Light's better here,\" she says without looking up.",
      desert: "She shelters under a lean-to of bleached canvas, hammer ringing against an anvil half-sunk in sand.",
      jungle: "She works under a canopy of broad leaves, sweat dripping onto the blade she hones. Mosquitoes avoid the sparks.",
      hell: "She sits cross-legged on a basalt slab, unfazed by the brimstone. \"Heat's free down here,\" she shrugs.",
      ice: "Bundled in furs, she works fast — the metal becomes brittle if it cools too quickly in this wind.",
      plains: "She sits at a crossroads marker, tools spread on a leather mat. Grass bends around her in the wind.",
      moor: "She has set up where the ground is firmest, near an old stone. Mist curls around her as she works.",
      mountain: "She perches on a ledge overlooking the pass, hammer strikes echoing off the peaks.",
    },
    runic_altar: {
      cave: "The altar is part of the cavern itself — runes spiral across the ceiling in phosphorescent blue. The stone sweats with condensation.",
      desert: "Sand has been swept clean in a perfect circle around the altar. The runes glow brighter as the sun sets.",
      jungle: "Roots have grown around but never over the altar. Even the jungle respects whatever sleeps inside.",
      hell: "The runes burn crimson instead of blue. This altar was corrupted long ago, but its power remains.",
      ice: "Frozen runes shimmer beneath a sheet of clear ice. Your breath clouds the glyphs as you lean close.",
      ruins: "The altar stands in what was once a town square. The runes are the only thing the looters couldn't take.",
      tomb: "Nested among sarcophagi, the altar's blue glow is the only light. The dead seem to lean toward it.",
    },

    // Shrine events
    shrine_of_war: {
      cave: "The obelisk fills the cavern chamber, its crimson glow painting the wet walls red. Echoes of battle cries reverberate.",
      desert: "The shrine stands alone in the wastes, weapons bleached by sun jutting from the sand around it.",
      hell: "War is native here. The obelisk pulses in time with distant screams, perfectly at home.",
      ice: "Blood-red light melts a circle of bare ground around the shrine. Even the frost fears it.",
      jungle: "Machetes and spears ring the base — offerings from warriors who hunted these paths.",
      mountain: "Barbarian axes and war-hammers pile at its base. This shrine has seen generations of pilgrims.",
    },
    shrine_of_plenty: {
      cave: "Coins have rolled into every crack and crevice. The underground spring nearby tastes faintly of honey.",
      desert: "An impossible spring bubbles beside the altar. Dates and figs grow from a single palm overhead.",
      jungle: "Exotic fruits pile around the moss-covered stone. Birds sing in the canopy above — this grove is untouched by corruption.",
      ice: "Warm light radiates from the altar, melting a lush circle of green grass in the snow.",
      ruins: "Market goods surround the shrine — bread, wine, cloth — as fresh as the day they were offered.",
    },
    shrine_of_vitality: {
      moor: "The blossoms push through the boggy ground, their glow cutting the mist. Life persists even here.",
      cave: "Luminous moss and pale flowers carpet the chamber. An underground stream feeds this impossible garden.",
      desert: "A single vine coils around the stone, heavy with glowing fruit. The desert cannot touch this place.",
      jungle: "The shrine is indistinguishable from the canopy — a riot of blossoms and vines all pulsing with the same heartbeat.",
      hell: "Somehow, life clings to this stone. The blossoms burn at their tips but refuse to wither.",
      ice: "Hot-spring water feeds the roots. Steam and blossom-light make this cavern feel like another world.",
    },
    shrine_of_shadow: {
      cave: "The darkness here is older than the mountain above. Your torch gutters and dies within ten paces.",
      desert: "At noon, no shadow should exist — yet the shrine casts one that stretches impossibly long.",
      hell: "Even in Hell, this void is darker. Demons give the shrine a wide berth.",
      forest: "The trees lean away from this spot. No birds sing. No insects buzz. Only silence.",
      ice: "The shrine absorbs the white glare of snow and returns nothing. A hole in the world.",
      ruins: "The altar sits in a collapsed cellar. The darkness down here feels alive and watching.",
    },
    shrine_of_the_fallen: {
      plains: "The monument rises from the grass like a lighthouse. Names in a dozen tongues catch the wind.",
      cave: "Names cover the walls, the ceiling, the floor — everywhere the spectral light can reach.",
      desert: "Sand cannot bury these names. Every storm reveals more, carved into stone that never erodes.",
      mountain: "The monument commands the highest point of the pass. Names of barbarian heroes fill every surface.",
      hell: "The names glow defiantly against the infernal dark. Even here, the fallen are remembered.",
      jungle: "The monument is wrapped in flowering vines, but every name remains legible. The jungle tends this place.",
    },

    // Blessing events
    roadside_shrine: {
      plains: "A small cairn marks the crossroads where two cattle paths meet. Wildflowers grow thicker here.",
      forest: "The shrine sits where a stream crosses the path. Someone has laid fresh berries at its feet.",
      desert: "A cairn of stacked stones beside a dried well. Travelers have tucked prayers between the rocks.",
      jungle: "The shrine is half-hidden by ferns, but someone keeps the path to it clear.",
      moor: "Standing stones mark this spot. Peat moss and heather form a soft carpet before the shrine.",
      ice: "The shrine is sheltered in a snow-hollowed overhang. Frozen prayer flags snap in the wind.",
      mountain: "Perched on a cliff edge, the shrine overlooks the valley. Climbers leave tokens for safe passage.",
    },
    fallen_paladin: {
      cave: "He crawled here to die in the dark, away from the things that killed his brothers. His shield still bears the Zakarum crest.",
      desert: "Sunstroke and blood loss have done their work. He leans against the ruin of a sandstone column.",
      jungle: "Poisoned arrows jut from his breastplate. The jungle's defenders showed no mercy.",
      hell: "He made it farther than most. His armor is scorched black, but the vial's golden light endures.",
      monastery: "He fell defending the gate. His brothers lie nearby, but he alone still breathes.",
      ice: "Frostbite has blackened his fingers, but he holds the vial steady. \"Take it before I drop it.\"",
    },
    enchanted_spring: {
      cave: "The spring emerges from a crack in the limestone, pooling in a natural basin. Crystals line the edges.",
      forest: "Sunlight filters through the canopy to strike the pool. Deer tracks ring the mossy banks.",
      marsh: "Clear water bubbles up through the peat, impossibly pure amid the murk.",
      jungle: "The spring cascades over mossy rocks into a pool ringed by orchids. Parrots watch from above.",
      ice: "A hot spring steams in a hollow of snow. The water glows faintly blue beneath the surface.",
      mountain: "Snowmelt feeds a crystal pool wedged between boulders. The water tastes of minerals and starlight.",
      desert: "Water rises from the sand in a perfect circle. It should not exist here, but it does.",
    },

    // Gamble events
    goblin_merchant: {
      cave: "He scurries from behind a stalagmite, his sack scraping the stone floor. \"Echo carry far! Speak soft, buy loud.\"",
      desert: "He pops up from behind a dune, sand cascading from his sack. \"Hot goods! Cold prices! Desert special!\"",
      jungle: "He drops from a vine overhead, landing with a thud. \"Jungle tax! Very reasonable! Only double!\"",
      hell: "He seems entirely too comfortable here. \"Demon no buy. Demon only break. You — you buy, yes?\"",
      ice: "Wrapped in stolen furs three sizes too large, he shivers beside his sack. \"Quick deal! Before toes fall off!\"",
      ruins: "He's set up shop in a collapsed doorway, goods displayed on a salvaged door. \"Antiques! Very old! Very valuable! Maybe!\"",
    },
    cursed_chest: {
      cave: "The chest sits in a dead-end chamber, chains bolted to the bedrock. Scratch marks surround it in concentric circles.",
      desert: "Half-buried in sand, the chest's chains are red with rust. The vibration sends sand grains dancing.",
      jungle: "Roots have grown over the chains but cannot crack them. The chest has been here longer than the trees.",
      hell: "The chains glow white-hot but do not melt. Whatever is inside has been imprisoned by something stronger than hellfire.",
      ice: "Frost has welded the chains together. The chest vibrates hard enough to shake loose icicles from the ceiling.",
      tomb: "The chest sits atop a sarcophagus, as if placed there deliberately. The chains are inscribed with warnings.",
    },
    bone_dice: {
      cave: "The skeletal hands jut from a crack in the tunnel wall. Torchlight makes the yellowed dice glow like amber.",
      desert: "The hands reach up from the sand, dice cupped as if offering water to a dying traveler.",
      hell: "Down here, the dice are warm. The grinding voice sounds almost cheerful. \"Good odds in Hell. Everything to lose.\"",
      ruins: "The hands protrude from a collapsed wall, still clutching the dice after all these years.",
      ice: "Frozen solid, the skeletal fingers crack as they flex. \"Cold game. Warm stakes. Roll?\"",
    },

    // Trader events
    potion_peddler: {
      cave: "Her vials clink and echo in the tunnels. \"Acoustics are great for sales down here. You can hear every bubble.\"",
      desert: "She's rigged a parasol from a broken spear and her cloak. \"Sunstroke cure, half off. Dehydration tonic, buy two get one.\"",
      jungle: "Her belt is supplemented by a bandolier of local remedies. \"Antivenom! Leech repellent! Fungal ointment! Jungle survival kit!\"",
      hell: "Soot-stained but undeterred. \"Fireproof flasks, thank you very much. I've adapted to the market.\"",
      ice: "She stamps her feet and blows on her hands between sales. \"Warming elixir? Frostbite salve? I've got what the mountain demands.\"",
    },
    arms_dealer: {
      cave: "Crates are stacked against the cavern wall, each bearing insignia worn smooth by underground moisture.",
      desert: "The dealer has spread a carpet under a canvas awning. Blades gleam in the harsh sunlight.",
      jungle: "Machetes and blowguns supplement the usual stock. The dealer knows the local market.",
      hell: "Demonic weaponry hangs alongside mortal steel. \"Salvage,\" he says. \"The previous owners don't need them anymore.\"",
      ice: "Every blade has a leather grip-wrap against the cold. \"Bare metal will freeze to your hand up here.\"",
      mountain: "Heavy axes and war-hammers dominate the stock. \"Barbarian craftsmanship. Nothing finer for mountain work.\"",
    },

    // Mystery events
    strange_mirror: {
      cave: "The mirror stands in a grotto, perfectly clean amid the dripping stone. Your reflection holds a torch you aren't carrying.",
      desert: "It rises from the sand like a mirage made solid. Your reflection stands in a lush garden.",
      jungle: "Vines frame it but never cross the glass. Your reflection stands in a winter landscape.",
      hell: "The mirror shows a peaceful meadow. Your reflection smiles serenely. The contrast is deeply unsettling.",
      ice: "Your reflection stands in a warm room by a fire. It beckons. The mirror's surface is warm to the touch.",
      ruins: "It hangs on the one intact wall, perfectly level. Your reflection stands in the town as it was before the fall.",
    },
    whispering_well: {
      plains: "The well sits where two paths cross. Whispers rise with the morning mist.",
      cave: "The well drops through the cave floor into deeper darkness. The whispers have an echo.",
      forest: "Moss and ivy soften the well's stone rim. Leaf-shadows dance across the dark water.",
      desert: "The well should be dry, but water glints far below. The whispers carry the sound of distant rain.",
      jungle: "Broad leaves have formed a natural roof over the well. The whispers mix with birdsong.",
      ice: "The well rim is crusted with frost, but the water below is liquid and dark. The whispers steam.",
    },
    abandoned_camp: {
      plains: "Wind flattens the sagging tents against their poles. A cooking pot swings from its tripod.",
      cave: "Bedrolls and scattered gear fill a widened chamber. The fire's smoke still stains the ceiling.",
      forest: "The camp is tucked in a clearing. Firelight would have been visible from the path.",
      desert: "Sand is already reclaiming the camp. The stew has a gritty crust but smells edible underneath.",
      jungle: "Insects have found the camp. The stew is covered but still warm. They left minutes ago.",
      moor: "The camp perches on a dry hummock above the bog. Boot prints lead off into the mist and don't come back.",
      ice: "Everything is frosted over. The fire is just embers under ash. They couldn't have gone far in this cold.",
      hell: "Who camps in Hell? Desperate people. The fire burns without fuel and the stew bubbles on its own.",
    },

    // Rest events
    hermit_healer: {
      cave: "Her hut is built into a widened alcove, chimney venting through a natural fissure. Herbs hang from every surface.",
      forest: "Smoke curls from a cottage hidden among the oaks. A garden of medicinal herbs surrounds it.",
      desert: "A mud-brick shelter with a reed roof. Inside it's cool and smells of dried sage.",
      jungle: "Her shelter is woven from living branches. Poultices dry on a rack in the humid air.",
      ice: "A stone hut banked with snow, impossibly warm inside. She brews something that steams and smells of pine.",
      marsh: "Her stilted hut sits above the waterline. She grinds bog-moss into paste without looking up.",
      moor: "Smoke from her chimney is the only landmark in the mist. She opens the door before you knock.",
      mountain: "Her cave is high up a switchback, out of the wind. \"Altitude sickness or blade wounds?\" she asks flatly.",
    },

    // Trial events
    guardian_statue: {
      cave: "The statue fills the tunnel, arms spread wall to wall. There is no way around it.",
      desert: "Sand has scoured its features smooth, but the eyes still glow. It has guarded this pass for millennia.",
      jungle: "Vines have claimed everything except the face. The stone jaw works slowly: \"Prove your worth.\"",
      hell: "The statue is cracked and scorched but still functional. Even demons respect its vigil.",
      ice: "Ice coats the statue like armor. Its breath comes in frozen clouds. \"None pass freely.\"",
      monastery: "It guards the inner gate, placed here by the Rogues. Their order is gone but the guardian remains.",
      mountain: "Carved from the cliff face itself, the guardian is part of the mountain. The barbarians built this centuries ago.",
      ruins: "The statue stands amid rubble, the only thing still upright. The plaque at its feet is freshly cleaned.",
    },
    blood_fountain: {
      cave: "The fountain fills an underground grotto, its crimson water casting red ripples on the ceiling.",
      desert: "It erupts from cracked earth, defying every law of the wasteland. The surrounding sand is stained dark.",
      hell: "Blood fountains are common in Hell, but this one is different — it offers power freely. That's worse.",
      ice: "The crimson water steams in the cold air. A ring of melted snow surrounds the basin.",
      jungle: "The basin is carved from a single massive tree stump. The crimson water feeds roots that pulse visibly.",
      tomb: "The fountain sits at the center of a burial chamber. The handprints on its rim belong to the interred.",
    },
  };

  /**
   * Given an event ID and a zone title, return zone-appropriate flavor text.
   * Falls back to null if no override exists for this event+zone combination.
   */
  function getZoneFlavor(eventId: string, zoneTitle: string): string | null {
    const env = resolveZoneEnv(zoneTitle);
    if (!env) {return null;}
    const overrides = ENV_FLAVOR[eventId];
    if (!overrides) {return null;}
    return overrides[env] ?? null;
  }

  runtimeWindow.__ROUGE_ZONE_FLAVOR = { getZoneFlavor, resolveZoneEnv };
})();
