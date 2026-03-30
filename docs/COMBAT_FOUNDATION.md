# Combat Foundation

Last updated: March 27, 2026.

## Live Rule Set

The current build is a turn-based encounter between:

- `1` hero
- `1` mercenary
- `N` enemies from the selected encounter

The player acts through cards in hand. The mercenary acts automatically when the player ends the turn. Enemies then resolve their visible intents in sequence.

## Live Encounter-In-Run Contract

The encounter sandbox sits inside a larger app loop:

- `front_door` -> `character_select` -> `safe_zone` -> `world_map` -> `encounter` -> `reward`
- boss rewards move into `act_transition` or `run_complete`
- non-combat quest, shrine, aftermath-event, and opportunity nodes can resolve directly into the existing `reward` phase and then return to the world map
- hero life, mercenary life, potion belt state, and loadout bonuses carry from `RunState` into combat and back out
- reward resolution applies gold, XP, training growth, potion charges, deck changes, item or rune changes, quest or shrine or event or opportunity outcomes, zone clears, act clears, boss trophies, and run-summary updates

## Current Resources

- `Life`: persistent health inside the encounter
- `Guard`: temporary mitigation that absorbs damage before Life
- `Energy`: the hero's card-play resource each turn
- `Hand Size`: the hero's turn-start hand target; this is usually class-defined, but unique item bonuses can now raise it
- `Potions`: off-deck combat support actions
- `Burn`, `Freeze`, `Shock`, `Slow`, and `Crushing`: live status or control hooks applied by skills, enemies, and weapon effects depending on source
- equipped weapons can now contribute explicit skill-proficiency attack and support bonuses, typed fire or cold or lightning or poison damage, and on-hit effects like Burn, Freeze, Shock, Slow, and Crushing depending on weapon family
- equipped armor can now contribute physical and elemental mitigation through live resistance lines, with rare unique-only immunities on armor
- socketed runes and completed runewords now feed directly into derived combat stats before encounter creation, and unique-only rarity bonuses can affect hand size as well as the more traditional Life or Energy or damage hooks

## Ally Flow

1. Start turn with full hero `Energy`.
2. Play cards from hand.
3. Use a potion on the hero or mercenary if needed.
4. End turn.
5. Mercenary attacks automatically.
6. Enemies act.
7. New turn begins if the encounter is still live.

## Live Cards

The live build now runs class-authored combat cards with explicit proficiencies and tiered reward pools. Across the seven classes, the card ecosystem includes:

- direct single-target damage
- damage plus self-Guard
- mark-for-mercenary support
- Burn application
- party Guard support
- mercenary next-attack buffs
- area damage
- self-heal and mercenary heal
- draw support

Reward pools currently add:

- upgraded `+` versions of starter skills
- stronger single-target finishers
- more area damage options
- Guard and draw support cards
- mercenary synergy cards
- item or rune choices that affect later fights indirectly through `RunState`
- weapon families that now specialize live combat differently, including bow or crossbow bonuses for Amazon bow attacks and bow-tagged support cards, javelin or spear bonuses for javelin skills, wand bonuses for Necromancer poison or bone and summon support, and elemental staff bonuses for Sorceress or Druid spell packages

## Live Mercenary Behaviors

- `Blackwood Hunter`: consumes hero marks for bonus damage
- `Sepulcher Spearwall`: gains Guard after attacking
- `River Spellblade`: deals bonus damage to burning enemies
- `River Shadow`: prioritizes support and ranged backline enemies
- `Ashen Bulwark`: prioritizes guarded targets, shatters Guard, and hits harder
- `Frosthaven Captain`: prioritizes elite and boss enemies and deals bonus damage to them
- `Ashen Scout`: prioritizes wounded enemies and executes them harder
- authored mercenary route perks can turn world-node flags into compound crossroad-to-reserve-to-relay-to-culmination packages with parallel legacy, reckoning, recovery, accord, and covenant combat payoffs, including opening Guard, hero Guard, flat attack, hero damage, behavior-specific bonuses, and opening draw

## Live Enemy Behaviors

- direct attacks
- Guard turns
- ally healing turns
- heal-and-Guard support turns
- party-wide boss attacks
- enemy-line fortification
- guard-shattering boss charges
- drain attacks that heal the acting boss
- telegraphed multi-turn boss wind-ups, reposition turns, and boss-specific typed damage packages
- elite affix turns that attack and fortify in the same action
- act-tuned support fortify turns, ranged volleys, and brute guard-break turns across the generated act packs
- broader generated act pools with seven opening encounters, six branch battles, six branch minibosses, four elite-affix families per act, and stronger escort, backline-screen, boss-screen, boss-salvo, court-reserve, sniper-nest, phalanx-march, linebreaker-charge, and ritual-cadence encounter scripting
- encounter-local modifiers for fortified starts, ambush openings, backline screens, vanguard rushes, escort bulwarks, escort commands, escort rotations, court reserves, crossfire lanes, war drums, triage commands, triage screens, linebreaker charges, ritual cadences, elite onslaughts, sniper nests, boss screens, boss salvos, boss onslaughts, and phalanx marches
- five-package consequence-conditioned branch-battle and branch-miniboss encounter and reward ladders plus a seven-package boss ladder that swap in recovery, accord, covenant, detour, and escalation variants, with shrine, crossroad, accord, and alternate sidepass-or-breach covenant bell routes promoting the top late-route packages

The runtime enemy roster is a mix of authored fallback encounters and seed-derived act encounter sets generated by `src/content/encounter-registry.ts`. Act bosses use per-act scripted intent packages, generated elites now come from four affix families per act, and base archetypes shift their intent kits by act instead of sharing one static role baseline. The current act bosses are no longer generic stat sticks: the Briar Matron leans into poison pressure, the Sepulcher Devourer uses mercenary-first crush turns, the Idol Patriarch carries lightning pressure, the Cinder Tyrant uses fire telegraphs, and the Siege Tyrant teleports and summons.

## Near-Term Expansion Targets

- broader mercenary route-perk breadth beyond the current twelve-per-contract route-perk baseline and reserve-or-relay-or-culmination-or-legacy-or-reckoning-or-recovery-or-accord-or-covenant-linked payoff pass
- broader encounter-local modifier catalogs and escort or boss scripting beyond the current twenty-modifier, court-reserve, boss-salvo, linebreaker-charge, ritual-cadence, boss-screen, sniper-nest, and phalanx-march baseline
- broader per-item and runeword coverage for the current weapon and armor combat hooks
- more encounter archetypes and route-side combat variety
