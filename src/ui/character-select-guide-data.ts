(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const GUIDES: Record<string, ClassSelectorGuideDefinition> = {
    amazon: {
      roleLabel: "Precision Ranger",
      complexity: "Moderate",
      playstyleTags: ["Ranged", "Control", "Tempo"],
      profileRatings: {
        damage: 4,
        control: 4,
        survivability: 3,
        speed: 4,
        setup: 2,
      },
      coreHook: "Keeps pressure clean from range, then pivots into bows, javelins, or passive efficiency before the fight can close in.",
      selectionPitch: "Pick Amazon for safe ranged pressure, flexible weapon routes, and reliable act-by-act control.",
      flavor: "A road-hardened huntress who keeps the fight at javelin point long before it can touch her.",
      footerFlavor: "Raised for roads where hesitation kills, the Amazon reads weather, distance, and weakness in the same glance. She hunts like a commander at range, thinning the fight before anything living reaches her line.",
      pathGuides: {
        amazon_bow_and_crossbow: {
          laneIdentity: "The safest Amazon lane, built around steady ranged pressure and repeatable backline clears.",
          emphasisLine: "Leans on chill support, clean draw texture, and frequent volley turns that stay online all run.",
        },
        amazon_javelin_and_spear: {
          laneIdentity: "The fastest and riskiest Amazon lane, built for tempo swings that can end fights early.",
          emphasisLine: "Leans on aggressive spear turns, shock-style pressure, and burst windows that punish overcommitting.",
        },
        amazon_passive_and_magic: {
          laneIdentity: "The clean-efficiency lane that wins by staying sharp every turn instead of waiting for a single spike.",
          emphasisLine: "Leans on dodge, crit tempo, and mercenary-backed repeated attacks that never waste a draw.",
        },
      },
    },
    assassin: {
      roleLabel: "Sequencing Killer",
      complexity: "High",
      playstyleTags: ["Burst", "Control", "Setup-heavy"],
      profileRatings: {
        damage: 4,
        control: 4,
        survivability: 2,
        speed: 3,
        setup: 5,
      },
      coreHook: "Rewards planning turns ahead, lining up setup with payoff instead of spending tempo the moment it appears.",
      selectionPitch: "Pick Assassin for traps, burst turns, and a sharper tactical rhythm than the heavier bloodlines.",
      flavor: "A killer of prepared angles, equal parts trapwire, discipline, and sudden violence.",
      footerFlavor: "The Assassin is not a brawler but a planner who treats every turn like a trap half-sprung. She prefers a fight already decided by discipline, timing, and the exact moment the enemy realizes it is too late.",
      pathGuides: {
        assassin_martial_arts: {
          laneIdentity: "The hardest Assassin lane to pilot, built around surviving until charge and payoff turns finally line up.",
          emphasisLine: "Leans on setup discipline, burst windows, and tight sequencing that turns one clean hand into a kill.",
        },
        assassin_shadow_disciplines: {
          laneIdentity: "The flexible Assassin lane, winning through evasion, adaptation, and medium-value lines that stay live.",
          emphasisLine: "Leans on tempo-preserving tools, cleaner hand fixes, and choices that keep awkward turns playable.",
        },
        assassin_traps: {
          laneIdentity: "The battlefield-planning lane, turning delayed area pressure into control over how waves unfold.",
          emphasisLine: "Leans on trap density, safe setup turns, and draw order that gives the field time to matter.",
        },
      },
    },
    barbarian: {
      roleLabel: "Frontline Bruiser",
      complexity: "Low",
      playstyleTags: ["Frontline", "Pressure", "Defensive"],
      profileRatings: {
        damage: 4,
        control: 2,
        survivability: 5,
        speed: 3,
        setup: 2,
      },
      coreHook: "Wins by staying on the front foot without turning every attack into an overextension against telegraphed boss turns.",
      selectionPitch: "Pick Barbarian for blunt frontline pressure, louder survivability, and the cleanest brute-force run.",
      flavor: "A war-scarred bruiser who turns pain, iron, and roar into forward momentum.",
      footerFlavor: "The Barbarian comes from a world where survival is loud, physical, and witnessed at arm's length. He steps into danger like it owes him an answer, then keeps swinging until the road remembers his name.",
      pathGuides: {
        barbarian_combat_skills: {
          laneIdentity: "The default-feeling Barbarian lane, built around proactive hits backed by just enough defense to keep swinging.",
          emphasisLine: "Leans on strong melee upgrades, guard-positive attacks, and short fights that never let pressure stall.",
        },
        barbarian_combat_masteries: {
          laneIdentity: "The stable Barbarian lane, built for steadier scaling through weapon specialization and cleaner draw patterns.",
          emphasisLine: "Leans on reliable weapon progression, fewer dead support draws, and pressure that stays live in long fights.",
        },
        barbarian_warcries: {
          laneIdentity: "The most deckbuilder-heavy Barbarian lane, built around buffs, guard, and timed mercenary support.",
          emphasisLine: "Leans on taunts, sequencing, and tempo windows where timing matters more than raw hit size.",
        },
      },
    },
    druid: {
      roleLabel: "Adaptive Shifter",
      complexity: "Moderate",
      playstyleTags: ["Adaptive", "Summoner", "Control"],
      profileRatings: {
        damage: 3,
        control: 4,
        survivability: 4,
        speed: 2,
        setup: 4,
      },
      coreHook: "Changes run texture more than any other class, shifting between spell payoff, bruiser chaining, and board-building engines.",
      selectionPitch: "Pick Druid for adaptable pacing, summoned support, and the widest shift between defense and aggression.",
      flavor: "A keeper of feral bargains, shifting between fang, storm, and patient living engines.",
      footerFlavor: "The Druid walks as if storm, fang, and root have all agreed to lend him their patience. He is not one fighter but several, choosing the shape of the fight before the enemy understands which wild answered.",
      pathGuides: {
        druid_elemental: {
          laneIdentity: "The payoff-driven Druid lane, built around surviving until the larger elemental turns finally take over.",
          emphasisLine: "Leans on typed-damage support, spell sequencing, and enough stability to reach the explosive part of the deck.",
        },
        druid_shape_shifting: {
          laneIdentity: "The sturdy melee Druid lane, built to chain durable attacks without turning into mindless stat racing.",
          emphasisLine: "Leans on resilient melee weapons, smoother awkward turns, and enough reach to close once bosses stabilize.",
        },
        druid_summoning: {
          laneIdentity: "The engine lane, built around establishing a board and letting support carry the fight once it settles.",
          emphasisLine: "Leans on summon density, protected setup turns, and payoff that grows as the board stays alive.",
        },
      },
    },
    necromancer: {
      roleLabel: "Attrition Commander",
      complexity: "High",
      playstyleTags: ["Control", "Summoner", "Setup-heavy"],
      profileRatings: {
        damage: 3,
        control: 5,
        survivability: 3,
        speed: 1,
        setup: 5,
      },
      coreHook: "Turns time itself into leverage, using curses, setup, and engines to decide when the real damage finally lands.",
      selectionPitch: "Pick Necromancer for curses, attrition, and the most oppressive battlefield control in the roster.",
      flavor: "A grave tactician who wins by curse, collapse, and the fear of what rises next.",
      footerFlavor: "The Necromancer enters a battle like a scholar entering a sealed crypt: calm, prepared, and already thinking three deaths ahead. He bends fear, rot, and obedience into order until the field belongs more to his design than to the living on it.",
      pathGuides: {
        necromancer_curses: {
          laneIdentity: "The most tactical Necromancer lane, built around weakening the enemy until long fights become yours.",
          emphasisLine: "Leans on control density, survivability, and enough finishing pressure that stalled enemies actually die.",
        },
        necromancer_poison_and_bone: {
          laneIdentity: "The signature setup-then-detonate lane, built around buying time before a clean bone burst window opens.",
          emphasisLine: "Leans on curse support, wand progression, and consistency that makes the payoff show up on time.",
        },
        necromancer_summoning: {
          laneIdentity: "The swarm engine lane, built around scaling the fight through minion presence and patient support sequencing.",
          emphasisLine: "Leans on summon density, board protection, and backup damage so the engine does not die in setup.",
        },
      },
    },
    paladin: {
      roleLabel: "Aura Vanguard",
      complexity: "Moderate",
      playstyleTags: ["Defensive", "Support", "Tempo"],
      profileRatings: {
        damage: 3,
        control: 3,
        survivability: 5,
        speed: 2,
        setup: 3,
      },
      coreHook: "Turns aura timing into fight structure, balancing safe attacks with enough payoff to actually finish the job.",
      selectionPitch: "Pick Paladin for disciplined defense, aura support, and steady tempo through dangerous encounters.",
      flavor: "A vow-bound vanguard who brings order to chaos through steel, faith, and timed auras.",
      footerFlavor: "The Paladin bears himself like judgment given armor and a measured stride. He does not rush chaos; he closes around it with faith, steel, and the certainty that some vows are stronger than panic.",
      pathGuides: {
        paladin_combat_skills: {
          laneIdentity: "The intuitive Paladin lane, built around repeated frontline attacks that stay safe through aura support.",
          emphasisLine: "Leans on reliable melee weapons, guard-sustain windows, and steady pressure that never drops out of the hand.",
        },
        paladin_defensive_auras: {
          laneIdentity: "The long-fight Paladin lane, built around survivability that eventually dominates attrition.",
          emphasisLine: "Leans on burst answers, defensive scaling, and real closing tools so tankiness does not become drift.",
        },
        paladin_offensive_auras: {
          laneIdentity: "The synergy-sensitive Paladin lane, built around turning ordinary attacks into real damage engines.",
          emphasisLine: "Leans on aura density, consistent attack cadence, and assembling the engine before the fight runs away.",
        },
      },
    },
    sorceress: {
      roleLabel: "Spell Engine",
      complexity: "High",
      playstyleTags: ["Burst", "Control", "Tempo"],
      profileRatings: {
        damage: 5,
        control: 4,
        survivability: 2,
        speed: 4,
        setup: 4,
      },
      coreHook: "Lives on hand texture, energy pacing, and reaching the turn where spell engines finally overwhelm the board.",
      selectionPitch: "Pick Sorceress for explosive spell scaling, elemental control, and the highest ceiling for burst damage.",
      flavor: "An elemental savant who survives the thin early turns for one overwhelming answer.",
      footerFlavor: "The Sorceress is brilliant enough to feel fragile early and terrifying later, a bloodline built around surviving until the sky answers back. She fights with the confidence of someone who knows control is only the prelude to annihilation.",
      pathGuides: {
        sorceress_cold: {
          laneIdentity: "The safest Sorceress lane, built around denial and the discipline to convert control into lethal.",
          emphasisLine: "Leans on freeze tempo, safe staff progress, and enough payoff that safety does not replace damage.",
        },
        sorceress_fire: {
          laneIdentity: "The classic power lane, built around delayed explosive turns that need real protection to come online.",
          emphasisLine: "Leans on burn scaling, payoff sequencing, and survival during the turns before the engine catches fire.",
        },
        sorceress_lightning: {
          laneIdentity: "The swing-turn lane, built around draw, energy, and volatility that rewards planning for randomness.",
          emphasisLine: "Leans on hand texture support, acceleration, and lines that stay alive even when the high roll misses.",
        },
      },
    },
  };

  function getGuide(classId: string): ClassSelectorGuideDefinition | null {
    return GUIDES[classId] || null;
  }

  runtimeWindow.__ROUGE_CHARACTER_SELECT_GUIDE = {
    getGuide,
  };
})();
