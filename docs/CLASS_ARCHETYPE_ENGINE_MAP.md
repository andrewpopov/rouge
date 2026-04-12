# Class Archetype Engine Map

_Snapshot: 2026-04-06_

## Purpose

This document maps Diablo II build archetypes onto deckbuilder engine patterns from Slay the Spire and Monster Train.

It answers:

- what the 2-3 lane engines per class should actually DO in card terms
- what STS/MT pattern each D2 fantasy skins onto
- what cards each lane needs to form a real engine (not just a pile of themed cards)
- what the per-lane scaling plan is
- what each lane's "moment" is (the turn where the engine pays off)

Use it with:

- [CLASS_CARD_AUTHORING_MATRIX.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_AUTHORING_MATRIX.md)
- [CLASS_CARD_EXECUTION_PLAN.md](/Users/andrew/proj/rouge/docs/CLASS_CARD_EXECUTION_PLAN.md)
- [SKILL_TAXONOMY.md](/Users/andrew/proj/rouge/docs/SKILL_TAXONOMY.md)
- [DECKBUILDER_COMBAT_MODEL.md](/Users/andrew/proj/rouge/docs/DECKBUILDER_COMBAT_MODEL.md)
- [D2_SPECIALIZATION_MODEL.md](/Users/andrew/proj/rouge/docs/D2_SPECIALIZATION_MODEL.md)

This is a design-mapping document that should inform card authoring, not a claim about live content.

## Design Principle

Every D2 build that players love works because of a clear mechanical loop. Every STS/MT archetype that players love works because of a clear engine pattern. Rouge should skin the latter onto the former.

The rule is:

- the D2 fantasy tells the player WHAT they are
- the STS/MT engine pattern tells the designer HOW it plays
- Rouge cards must satisfy both

If a lane has D2 flavor but no engine pattern, it will feel like a pile of themed cards.

If a lane has an engine pattern but no D2 flavor, it will feel like a generic deckbuilder wearing a costume.

## Universal Engine Components

Every lane engine needs these five components:

1. **Setup** — cards that create the state the engine needs
2. **Payoff** — cards that cash out the state for damage or board advantage
3. **Scaling** — cards that make later turns stronger than earlier turns
4. **Sustain** — cards that keep the engine alive long enough to pay off
5. **Conversion** — cards that turn one resource into another (defense into offense, status into damage, death into value)

If any component is missing, the lane collapses into either:

- pure aggro (setup + payoff only, no scaling)
- stall (sustain only, no payoff)
- goodstuff pile (no interdependence between cards)

## Amazon

### Bow Volley (Bowazon / Multishot / Strafe)

**D2 Fantasy:** Stand at range, hose down screens with arrow volleys. Precision target selection. The Legolas archetype.

**STS/MT Pattern:** Silent Shiv engine. Many small hits, each amplified by a persistent scaling buff. The more arrows you fire, the more each one matters.

**Engine Loop:**

1. **Setup:** Mark a target or apply Slow. Play a buff card that arms the next volley (e.g., "next 2 ranged cards deal +X").
2. **Payoff:** Multi-hit ranged attacks that proc per-hit bonuses. Strafe-style cards that hit all enemies. Guided Arrow for single-target burst.
3. **Scaling:** Per-hit damage riders that grow with tree investment. "Each ranged hit this combat deals +1 more" passive scaling. Pierce effects that let arrows hit multiple targets.
4. **Sustain:** Guard-on-hit effects. Evasive repositioning cards. Mercenary tanking.
5. **Conversion:** Convert Slow stacks into damage. Convert marks into draw.

**The Moment:** A turn where you fire 3-4 ranged cards and each one procs +damage riders, clearing the board in a single volley.

**Key Difference From STS Shivs:** Amazon arrows should feel precise and deliberate, not spammy. Each arrow should matter more than a Shiv. Fewer hits but each hit is heavier.

**Cards This Lane Needs:**

- 2-3 multi-hit ranged attacks at different cost points
- 1-2 "arm the volley" setup cards
- 1 pierce or AoE spread card
- 1 scaling passive (per-hit rider)
- 1 defensive repositioning card
- 1 mark-to-damage conversion

### Javelin Storm (Javazon / Lightning Fury / Charged Strike)

**D2 Fantasy:** Throw lightning javelins that chain and scatter. Close in with Charged Strike for single-target devastation. The screen-clearing glass cannon.

**STS/MT Pattern:** Watcher Burst Window. Accumulate a charge resource, then unleash it all in one devastating turn. Alternately: Defect Lightning Orb variance — high ceiling, variable per-hit.

**Engine Loop:**

1. **Setup:** Apply elemental marks. Build charge stacks through cheaper javelin cards. Apply Paralyze or Slow to buy time.
2. **Payoff:** Lightning Fury-style AoE that scales with charges or marks on the field. Charged Strike-style single-target burst that consumes stacks for massive damage.
3. **Scaling:** Charge accumulation across turns. Each javelin card adds charges; payoff cards consume them. More charges = bigger burst.
4. **Sustain:** Valkyrie summon as tank. Guard from Passive tree splash cards.
5. **Conversion:** Convert charges into AoE damage. Convert single-target kills into chain lightning spread.

**The Moment:** The Lightning Fury turn — consume built-up charges to deal massive AoE damage to everything.

**Cards This Lane Needs:**

- 2 cheap charge-building javelin cards
- 1-2 charge-consuming AoE payoffs
- 1 single-target charge-consuming burst
- 1 Paralyze applicator
- 1 summon or defensive bridge
- 1 charge-to-spread conversion

### Passive Tempo (Support / Crit / Dodge)

**D2 Fantasy:** Dodge, precision, critical hits. The Passive tree makes the Amazon better at everything without doing big flashy things. Inner Sight reveals weaknesses. Valkyrie fights alongside.

**STS/MT Pattern:** Defect Focus scaling. Passive bonuses that compound over time. Each point of investment makes ALL your other cards better.

**Engine Loop:**

1. **Setup:** Apply debuffs (Inner Sight). Summon Valkyrie. Play Critical Strike-style cards that buff future attacks.
2. **Payoff:** Empowered normal attacks. Cards that cash out accumulated buffs.
3. **Scaling:** Gradual passive accumulation. "This combat, your ranged cards deal +X" effects that stack.
4. **Sustain:** Dodge as damage prevention. Evasion. Guard gain tied to successful attacks.
5. **Conversion:** Convert evasion into counterattack damage. Convert mercenary support into draw.

**The Moment:** A turn where every card in your hand benefits from accumulated passive bonuses, making an average hand play like a great one.

**Cards This Lane Needs:**

- 2 passive buff cards (this-combat scaling)
- 1-2 debuff/reveal cards
- 1 Valkyrie or summon card
- 1-2 dodge/evasion defense cards
- 1 crit or precision payoff

## Assassin

### Martial Burst (Tiger Strike / Phoenix Strike / Dragon Tail)

**D2 Fantasy:** Build up elemental charges through melee combos, then release them in a devastating finisher. The combo fighter with the highest skill ceiling.

**STS/MT Pattern:** Watcher Stance Dancing + Divinity. Charge-up cards accumulate a resource; finisher cards spend it for burst. The charge/release cycle IS the gameplay.

**Engine Loop:**

1. **Setup:** Charge-up cards (Tiger Strike, Fists of Fire) that add combo charges. Each charge adds elemental damage to the next finisher.
2. **Payoff:** Finisher cards that consume all charges for burst damage. Dragon Tail for AoE release. Dragon Flight for targeted burst.
3. **Scaling:** Charges grow with repeated cycling. Later charge-ups add more per charge. Multi-element coverage from Phoenix Strike.
4. **Sustain:** Cobra Strike-style life steal on finishers. Guard from Shadow Disciplines splash.
5. **Conversion:** Convert charges into specific elemental damage types. Convert successful combos into energy or draw.

**The Moment:** A fully-charged Phoenix Strike release that hits every element and clears the board.

**Cards This Lane Needs:**

- 3 charge-up cards at different costs (cheap builder, mid elemental, expensive multi-charge)
- 2 finisher cards (AoE release, single-target burst)
- 1 charge-scaling passive
- 1 life-steal finisher
- 1 element-switching or multi-element card

### Trap Field (Trapsin / Lightning Sentry / Death Sentry)

**D2 Fantasy:** Place autonomous traps that kill enemies for you. The engineer who sets up kill zones. Safest Assassin playstyle — you manage positioning while traps do the work.

**STS/MT Pattern:** Monster Train floor management + Defect Orb persistence. Traps are persistent entities that act each turn without consuming hand cards. Corpse Explosion chain from Death Sentry is the Necromancer CE pattern — first kill cascades.

**Engine Loop:**

1. **Setup:** Place trap summons (Lightning Sentry, Wake of Fire). Each trap acts autonomously each turn. Traps have limited duration.
2. **Payoff:** Death Sentry — triggers corpse explosion when enemies die near traps. Chain reaction clears. Blade Shield for passive AoE.
3. **Scaling:** More traps = more autonomous damage. Trap damage scales with investment. Duration extension.
4. **Sustain:** Mind Blast-style crowd control. Cloak of Shadows for safety. Traps tank because enemies target them.
5. **Conversion:** Convert corpses into chain explosions. Convert trap presence into area denial.

**The Moment:** A board with 3+ traps where Death Sentry triggers a corpse explosion chain that wipes the encounter.

**Cards This Lane Needs:**

- 2-3 trap summon cards (fire, lightning, blade variants)
- 1 corpse explosion / death trigger payoff
- 1 crowd control card (Mind Blast)
- 1 trap enhancement or duration card
- 1 trap-scaling passive
- 1 trap-to-damage conversion

### Shadow Tempo (Shadow Disciplines / Burst of Speed / Venom)

**D2 Fantasy:** Speed, evasion, shadow clones, and venom. The tempo assassin who moves faster than enemies can react. Fade for survivability, Burst of Speed for offense.

**STS/MT Pattern:** Silent Discard engine. Cards that cycle through your hand rapidly, generating value from the cycling itself. Wraith Form-style temporary invulnerability windows.

**Engine Loop:**

1. **Setup:** Burst of Speed for draw/tempo. Cloak of Shadows for safety window. Venom application.
2. **Payoff:** Shadow Warrior clone that copies your last action. Venom-boosted attacks. Speed-enhanced multi-actions.
3. **Scaling:** Venom stacking over the fight. Shadow clone efficiency. Speed buffs that compound.
4. **Sustain:** Fade for damage reduction. Weapon Block for defense. Hand cycling for consistency.
5. **Conversion:** Convert speed into extra actions. Convert shadow state into cost reduction. Convert status stacks into burst.

**The Moment:** A Burst of Speed turn where you play 4-5 cards, each dealing bonus Venom damage, while Shadow Warrior copies the best one.

**Cards This Lane Needs:**

- 1-2 speed/tempo buff cards
- 1 shadow clone or mirror card
- 1-2 venom/poison application cards
- 1 Fade or damage-reduction card
- 1 hand-cycling card
- 1 speed-to-damage conversion

## Barbarian

### Combat Pressure (WW Barb / Frenzy / Berserk)

**D2 Fantasy:** Pure melee aggression. Whirlwind through packs, Frenzy into escalating attack speed, Berserk for magic damage burst. The unstoppable force.

**STS/MT Pattern:** Ironclad Strength scaling. Each attack makes the next one stronger. Frenzy stacks map directly to Strength accumulation. Berserk maps to the self-damage archetype (drop defense, gain massive offense).

**Engine Loop:**

1. **Setup:** Frenzy-style cards that gain stacks with each attack. War Shout-style attack buffers. Positioning with Leap.
2. **Payoff:** Whirlwind AoE that benefits from accumulated stacks. Berserk for magic-damage burst against tough targets. Multi-hit attacks that multiply scaling.
3. **Scaling:** Frenzy stacks — each attack adds attack speed and damage. Rage accumulation (Hellhorned pattern). Weapon mastery passives.
4. **Sustain:** Life leech from rapid attacks. Iron Skin for guard. Natural Resistance for cleansing.
5. **Conversion:** Convert Frenzy stacks into AoE via Whirlwind. Convert defense-drop into magic damage via Berserk.

**The Moment:** A Whirlwind turn after 3+ Frenzy stacks where you clear the entire board in one spinning attack.

**Cards This Lane Needs:**

- 2-3 attack cards that build stacks/momentum
- 1-2 AoE payoff cards (Whirlwind, Leap Attack)
- 1 Berserk-style high-risk burst card
- 1 Frenzy-style escalating attack
- 1 life leech sustain card
- 1 momentum-to-AoE conversion

### Mastery Frontline (Weapon Masteries / Iron Skin / Concentrate)

**D2 Fantasy:** Weapon expertise, armor, and methodical fighting. The durable frontline warrior who wins through reliability and damage reduction. Concentrate for steady, uninterruptable damage.

**STS/MT Pattern:** Ironclad Barricade/Block. Defense that persists and can be converted to offense. Consistent, reliable cards that never feel amazing but never let you down.

**Engine Loop:**

1. **Setup:** Weapon Mastery buffs that enhance all attacks. Iron Skin for guard floor. Concentrate for steady damage + defense.
2. **Payoff:** Body Slam-style cards that convert accumulated guard into damage. Reliable high-damage attacks.
3. **Scaling:** Mastery passives that grow over the fight. Guard accumulation. Weapon damage riders.
4. **Sustain:** Guard generation on every attack. Iron Skin renewals. Damage reduction.
5. **Conversion:** Convert accumulated guard into damage. Convert weapon mastery into penetration.

**The Moment:** A turn where your guard is so high that you convert it into a massive damage card while taking zero net damage.

**Cards This Lane Needs:**

- 2 weapon mastery passive cards
- 1-2 guard-to-damage conversion cards
- 1 Concentrate-style reliable attack+guard card
- 1 penetration or guard-break card
- 1 damage reduction sustain card
- 1 mastery-scaling passive

### Warcry Tempo (Shout / Battle Orders / War Cry)

**D2 Fantasy:** Battle shouts that buff the party and debuff enemies. The commander who makes everyone around them stronger. War Cry stuns entire screens.

**STS/MT Pattern:** Monster Train aura stacking + Watcher Mantra accumulation. Warcries are persistent buffs that accumulate value. Battle Orders is the ultimate party buff — it maps to Focus scaling (makes everything better).

**Engine Loop:**

1. **Setup:** Shout for party guard. Battle Cry to debuff enemies. Taunt to redirect aggression.
2. **Payoff:** War Cry AoE stun + damage. Battle Orders for massive party buff that enables a power turn. Warcry-empowered attacks.
3. **Scaling:** Warcry buff stacking over the fight. Each new warcry extends or amplifies the previous one. Battle Command adding skill levels.
4. **Sustain:** Shout for guard. Find Potion for emergency healing. Taunt for threat redirection.
5. **Conversion:** Convert warcry buffs into damage windows. Convert enemy debuffs into safe attack turns.

**The Moment:** A Battle Orders turn that buffs the entire party, followed by a War Cry stun, creating a 2-turn window where everything hits harder and nothing hits back.

**Cards This Lane Needs:**

- 2 party buff cards (guard, damage, mixed)
- 1-2 enemy debuff cards
- 1 AoE stun or crowd control card
- 1 warcry-to-damage conversion
- 1 support/heal card
- 1 mercenary command card

## Druid

### Elemental Storm (Wind Druid / Fire Druid / Armageddon)

**D2 Fantasy:** Command fire, wind, and cold through nature. Tornado's physical damage + Hurricane's cold creates dual-type coverage. Fissure cracks open the earth. The storm caller surrounded by elemental fury.

**STS/MT Pattern:** Defect Orb variety + Lightning combo. Different elements serve different roles (fire = damage, cold = control, wind = physical bypass). Element-switching adds tactical depth like Defect orb management.

**Engine Loop:**

1. **Setup:** Firestorm or Fissure to apply Burn. Cyclone Armor for elemental defense. Arctic Blast for cold setup.
2. **Payoff:** Volcano or Armageddon for massive fire AoE. Tornado for physical AoE. Hurricane for persistent cold damage.
3. **Scaling:** Burn stacking. Element-combo bonuses (fire + cold = more damage). Cyclone Armor absorbing more with investment.
4. **Sustain:** Cyclone Armor absorbs elemental damage. Oak Sage splash for HP. Cold effects slow enemies.
5. **Conversion:** Convert Burn stacks into burst. Convert Slow into setup for Tornado accuracy. Convert elemental variety into coverage.

**The Moment:** An Armageddon turn where fire rains down on Burned and Slowed enemies, converting all status stacks into a devastating AoE.

**Cards This Lane Needs:**

- 2 fire damage cards (setup + payoff)
- 1-2 wind/physical damage cards
- 1 cold control card
- 1 Cyclone Armor defense card
- 1 element-combo bonus card
- 1 burn-to-burst conversion

### Shifter Bruiser (Fury Druid / Werebear / Werewolf)

**D2 Fantasy:** Shapeshift into werewolf for speed and multi-hit fury, or werebear for raw power and tankiness. The primal transformation. Lycanthropy for sustain.

**STS/MT Pattern:** Ironclad Self-Damage + Strength scaling. Transformation IS the engine — entering a form changes your card evaluation. Fury's multi-hit maps to Sword Boomerang (multiplies scaling). Werebear maps to Barricade (tanky but slower).

**Engine Loop:**

1. **Setup:** Transform (Werewolf or Werebear). Each form changes how subsequent cards behave. Lycanthropy for sustain.
2. **Payoff:** Fury multi-hit that benefits from form bonuses. Maul for heavy single-target. Fire Claws for elemental melee.
3. **Scaling:** Form bonuses that grow over the fight. Feral Rage stacking. Life leech that sustains aggressive play.
4. **Sustain:** Lycanthropy life bonus. Werebear damage reduction. Life leech from rapid attacks.
5. **Conversion:** Convert form duration into sustained damage. Convert life leech into aggressive positioning. Convert wolf speed into extra card plays.

**The Moment:** A Fury turn in Werewolf form where 3 rapid hits each proc damage bonuses and life leech, sustaining through a dangerous encounter.

**Cards This Lane Needs:**

- 1-2 transformation cards (wolf speed vs bear power)
- 2 multi-hit melee attacks
- 1 form-enhanced single-target burst
- 1 life leech / sustain card
- 1 form-scaling passive
- 1 form-to-damage conversion

### Summoner Engine (Beastmaster / Spirit Wolves / Grizzly)

**D2 Fantasy:** Command an army of animals. Ravens scout, Wolves fight, Grizzly tanks, Spirit companions provide auras. The beastmaster who fights through his pack.

**STS/MT Pattern:** Monster Train Umbra Gorge + Awoken healing. Summons are persistent board presence. The engine is keeping them alive and scaling them. Heart of Wolverine maps to Focus — makes all summons better.

**Engine Loop:**

1. **Setup:** Summon wolves, ravens, or creepers. Each summon acts autonomously. Heart of Wolverine or Oak Sage for passive aura.
2. **Payoff:** Summon Grizzly as the ultimate pet. Pack damage when multiple summons are active. Summon-count-matters cards.
3. **Scaling:** Spirit auras that buff all summons. Summon stat growth. Pack synergy (more summons = each one stronger).
4. **Sustain:** Oak Sage healing aura. Carrion Vine for life recovery. Summons absorb hits meant for you.
5. **Conversion:** Convert summon deaths into value (corpse-vine). Convert pack presence into damage buffs. Convert aura investment into whole-board scaling.

**The Moment:** A turn where the Grizzly tanks a boss hit, wolves deal bonus damage from Heart of Wolverine, and you reinforce everything — the pack operating as a coordinated army.

**Cards This Lane Needs:**

- 2-3 summon cards (different animal types)
- 1 spirit aura card (Heart of Wolverine / Oak Sage)
- 1 pack synergy payoff
- 1 summon reinforcement/healing card
- 1 summon-scaling passive
- 1 summon-to-board-control conversion

## Necromancer

### Bone Burst (Bonemancer / Bone Spear / Bone Spirit)

**D2 Fantasy:** Magic-damage projectiles that pierce everything. Bone Armor for defense. Bone Prison for terrain control. The tactical bone mage who creates corridors of death.

**STS/MT Pattern:** Defect Dark Orb + Lightning pierce. Bone damage grows over the fight (like Dark Orb accumulation). Bone Armor maps to Frost Orb block scaling. The piercing projectile fantasy is unique — hitting multiple enemies per card.

**Engine Loop:**

1. **Setup:** Bone Armor for defense floor. Bone Wall or Prison for enemy funneling. Teeth for cheap early pressure.
2. **Payoff:** Bone Spear piercing through multiple enemies. Bone Spirit for massive single-target burst. Corpse Explosion after first kill.
3. **Scaling:** Bone damage synergies (each bone card makes others stronger). Bone Armor growing with investment. Magic damage type bypassing most resistance.
4. **Sustain:** Bone Armor absorption. Bone Prison blocking enemy approach. Magic damage ignoring physical immunity.
5. **Conversion:** Convert bone wall presence into funneling kills. Convert kills into Corpse Explosion chains. Convert defense investment into Bone Armor scaling.

**The Moment:** A Bone Spear that pierces 3+ enemies in a line, followed by Corpse Explosion cascading from the first kill.

**Cards This Lane Needs:**

- 2 direct bone damage cards (cheap + expensive)
- 1 Bone Armor defense card
- 1 piercing or multi-target bone card
- 1 Corpse Explosion chain card
- 1 bone synergy scaling card
- 1 bone-defense-to-offense conversion

### Curse Control (Curse Necro / Amplify Damage / Lower Resist / Decrepify)

**D2 Fantasy:** Weaken enemies so thoroughly that your minions and allies destroy them effortlessly. The puppet master who controls the battlefield through debuffs. Amplify Damage doubles all physical damage. Lower Resist strips elemental resistance. Decrepify slows and weakens.

**STS/MT Pattern:** Stygian Guard Frostbite/Sap debuff stacking. Each curse makes all other damage sources more effective. This is the pure support/tax archetype — you make everything else better.

**Engine Loop:**

1. **Setup:** Apply Amplify Damage or Lower Resist to key targets. Apply Decrepify for slow + weaken. Stack multiple curses for compound effect.
2. **Payoff:** Your minions, mercenary, and damage cards all benefit from the debuffed enemies. Terror and Confuse for crowd manipulation.
3. **Scaling:** Curse stacking — each additional curse makes enemies weaker. Lower Resist enabling elemental damage sources. Curse duration extension.
4. **Sustain:** Life Tap for party-wide life leech. Weaken reducing incoming damage. Dim Vision blinding ranged enemies.
5. **Conversion:** Convert curse stacks into damage multipliers. Convert crowd control into safe setup turns. Convert Life Tap into sustain for the whole party.

**The Moment:** An Amplify Damage + Corpse Explosion turn where the first kill cascades because everything takes double physical damage.

**Cards This Lane Needs:**

- 2-3 different curse cards (damage amp, resist strip, slow/weaken)
- 1 curse-enhanced payoff card
- 1 Life Tap sustain card
- 1 crowd control card (Terror, Confuse)
- 1 curse-duration or curse-spread card
- 1 curse-to-multiplier conversion

### Summon Swarm (Summonmancer / Fishymancer / Revive)

**D2 Fantasy:** Raise an overwhelming undead army. Skeletons fight, Skeleton Mages cast, Golems tank, Revived monsters retain their abilities. The dark lord commanding an undead horde, untouchable behind a wall of minions.

**STS/MT Pattern:** Monster Train Remnant Reform + Umbra Gorge. Summons that persist, die, and get replaced. Corpse Explosion as the real damage engine — the summons create corpses, CE converts corpses into AoE. Skeleton Mastery maps to Focus scaling.

**Engine Loop:**

1. **Setup:** Raise Skeleton army. Summon Clay Golem for tanking. Apply Amplify Damage to enable CE.
2. **Payoff:** Corpse Explosion chain reaction. Revive to bring back elite monsters. Skeleton Mage elemental damage.
3. **Scaling:** Skeleton Mastery making all summons stronger. More summons = more corpse fuel. Golem Mastery for tankier frontline.
4. **Sustain:** Summons absorb all incoming damage. Blood Golem for life recovery. Life Tap for army-wide leech.
5. **Conversion:** Convert enemy corpses into AoE damage (CE). Convert summon deaths into replacements. Convert army presence into untouchable safety.

**The Moment:** First skeleton kill triggers Amplify Damage + Corpse Explosion chain that wipes the entire encounter while you stand safely behind your army.

**Cards This Lane Needs:**

- 2-3 summon cards (skeleton, mage, golem variants)
- 1 Corpse Explosion card
- 1 Skeleton Mastery scaling card
- 1 Revive or elite-summon card
- 1 summon sustain / reinforcement card
- 1 death-to-value conversion

## Paladin

### Combat Zeal (Zealot / Smiter / Charge)

**D2 Fantasy:** Rapid consecutive melee strikes fueled by holy fury. Zeal hits 5 times in one animation. Smite never misses. Charge closes distance instantly. The crusader who fights with speed and conviction.

**STS/MT Pattern:** Ironclad Strength + multi-hit (Sword Boomerang / Pummel). Each Zeal strike procs on-hit effects, so scaling multiplies rapidly. Smite's guaranteed hit maps to "cannot be blocked" reliability.

**Engine Loop:**

1. **Setup:** Apply Holy Shield for defense. Activate an aura for passive buff. Position with Charge.
2. **Payoff:** Zeal multi-hit that procs Crushing Blow, life leech, and aura bonuses on every strike. Smite for guaranteed boss damage.
3. **Scaling:** Fanaticism aura adding attack speed and damage to all strikes. Holy Shield growing defense. Zeal hit count meaning every buff is multiplied.
4. **Sustain:** Life leech from rapid Zeal hits. Holy Shield for block. Prayer aura for passive healing.
5. **Conversion:** Convert aura investment into Zeal damage. Convert rapid hits into life recovery. Convert holy damage types into immunity bypass.

**The Moment:** A Zeal turn with Fanaticism active where 5 rapid strikes each deal amplified damage with life leech, instantly recovering any damage taken.

**Cards This Lane Needs:**

- 2 multi-hit attack cards
- 1 Charge or gap-closer card
- 1 Holy Shield defense card
- 1 aura-enhanced payoff card
- 1 on-hit scaling card
- 1 hit-count-to-recovery conversion

### Offensive Aura (Hammerdin / FOHdin / Auradin)

**D2 Fantasy:** Blessed Hammer spiraling outward dealing magic damage. Fist of the Heavens calling down divine lightning. Holy Fire/Freeze/Shock pulses damaging nearby enemies. The caster paladin whose auras are the primary weapon.

**STS/MT Pattern:** Defect Power accumulation + Orb scaling. Auras ARE the engine — they provide passive value every turn. Blessed Hammer maps to a spell-based AoE that benefits from concentration. Conviction Aura maps to Lower Resist. The aura system is Monster Train's permanent-buff layering.

**Engine Loop:**

1. **Setup:** Activate Conviction or Concentration aura. Play setup cards that enhance aura output. Holy Fire or Holy Freeze for persistent passive damage.
2. **Payoff:** Blessed Hammer AoE benefiting from Concentration. Fist of the Heavens for targeted burst. Aura pulses for passive clearing.
3. **Scaling:** Aura investment increasing passive damage per turn. Concentration or Conviction amplifying all damage. Multiple aura layers stacking value.
4. **Sustain:** Redemption aura for corpse-based healing. Meditation for mana recovery. Holy Shield for defense.
5. **Conversion:** Convert aura investment into passive AoE. Convert Conviction resistance reduction into damage multiplication. Convert holy damage into immunity bypass.

**The Moment:** A Blessed Hammer turn with maxed Concentration where spiraling hammers clear the board while Conviction strips all resistance.

**Cards This Lane Needs:**

- 2 aura activation/enhancement cards
- 1-2 aura-scaled spell cards (Blessed Hammer, FoH)
- 1 Conviction or resistance-reduction card
- 1 aura-stacking passive
- 1 Redemption or aura-sustain card
- 1 aura-to-AoE conversion

### Defensive Anchor (Defensive Auras / Holy Shield / Salvation)

**D2 Fantasy:** The unkillable holy tank. Prayer heals the party. Cleansing removes debuffs. Defiance amplifies guard. Salvation provides all-resistance. The paladin who keeps everyone alive.

**STS/MT Pattern:** Ironclad Barricade + Awoken healing. Defense that persists and accumulates. The "you cannot kill me" archetype that eventually converts surplus defense into damage.

**Engine Loop:**

1. **Setup:** Prayer for passive healing. Defiance for guard scaling. Cleansing to remove debuffs.
2. **Payoff:** Holy Bolt for healing-that-damages-undead. Defense-to-offense conversion via shield-based attacks. Party-wide guard enabling aggressive ally play.
3. **Scaling:** Resistance accumulation making all damage less threatening. Guard floor that rises each turn. Aura investment compounding safety.
4. **Sustain:** Prayer + Meditation for dual healing. Cleansing for debuff removal. Redemption for corpse-based recovery.
5. **Conversion:** Convert surplus guard into damage. Convert healing into offensive holy bolt damage. Convert party safety into more aggressive card plays.

**The Moment:** A turn where Prayer has healed 15+ HP, Defiance guard absorbs all incoming damage, and you convert the safety into a Holy Bolt that both heals and damages.

**Cards This Lane Needs:**

- 2 healing/aura cards (Prayer, Cleansing)
- 1 guard-scaling card (Defiance, Holy Shield)
- 1 cleanse or debuff removal card
- 1 defense-to-offense conversion card
- 1 party-wide protection card
- 1 holy-bolt-style heal-and-damage card

## Sorceress

### Fire Burst (Blizzard Sorc crossed with Fire builds)

**D2 Fantasy:** Burn setup into explosive payoff. Fireball for sustained pressure, Meteor for delayed burst, Hydra for persistent fire summons. The fire mage who sets the world ablaze.

**STS/MT Pattern:** Silent Poison (Burn = Poison ticking) + Watcher Divinity burst (Meteor = build up to one big hit). Burn stacking over turns is the slow engine; Meteor or Hydra is the burst payoff.

**Engine Loop:**

1. **Setup:** Fire Bolt and Inferno for cheap Burn application. Warmth for energy recovery. Blaze for ground fire.
2. **Payoff:** Fireball for efficient damage + Burn. Meteor for delayed massive burst. Hydra for persistent fire damage.
3. **Scaling:** Burn stacking over the fight. Fire Mastery amplifying all fire damage. Warmth recovering energy for more spell casts.
4. **Sustain:** Energy Shield for mana-as-health. Warmth for sustain. Frozen Armor splash for emergency defense.
5. **Conversion:** Convert Burn stacks into Meteor damage bonus. Convert energy recovery into more spell casts. Convert fire mastery into scaling.

**The Moment:** A Meteor turn that lands on enemies already stacking 6+ Burn, creating a single-turn damage spike that evaporates everything.

**Cards This Lane Needs:**

- 2 Burn application cards (cheap + efficient)
- 1-2 fire burst payoff cards (Fireball, Meteor)
- 1 Hydra or persistent fire card
- 1 Warmth-style energy recovery card
- 1 Fire Mastery scaling card
- 1 burn-to-burst conversion

### Cold Control (Blizzard Sorc / Frozen Orb)

**D2 Fantasy:** Freeze everything. Blizzard covers areas in ice. Frozen Orb sprays ice bolts in all directions. Cold Mastery pierces resistance. The ice queen who controls the battlefield through crowd control.

**STS/MT Pattern:** Stygian Guard Frostbite stacking + Ironclad Block scaling. Cold effects slow and freeze enemies, creating safe turns. The engine is crowd control that enables safe offense. Shiver Armor maps to thorns-style reactive defense.

**Engine Loop:**

1. **Setup:** Ice Bolt for cheap cold + Slow. Frozen Armor for reactive defense. Frost Nova for AoE freeze.
2. **Payoff:** Blizzard for area denial + sustained cold damage. Frozen Orb for AoE burst. Cold Mastery for resistance penetration.
3. **Scaling:** Cold Mastery reducing enemy resistance over the fight. Freeze duration increasing with investment. Chill stacking that makes enemies progressively weaker.
4. **Sustain:** Frozen enemies cannot attack. Frozen Armor retaliates on hit. Energy Shield splash.
5. **Conversion:** Convert freeze control into safe damage turns. Convert Chill stacks into damage bonus. Convert cold mastery into resistance penetration.

**The Moment:** A Blizzard that freezes the entire board, followed by a Frozen Orb that shatters frozen enemies for bonus damage.

**Cards This Lane Needs:**

- 2 cold application cards (Slow, Freeze)
- 1-2 AoE cold payoff cards (Blizzard, Frozen Orb)
- 1 Cold Mastery scaling card
- 1 Frozen Armor reactive defense card
- 1 freeze-to-shatter conversion card
- 1 Glacial Spike or crowd control card

### Lightning Tempo (Lightning Sorc / Chain Lightning / Static Field)

**D2 Fantasy:** High variance, high tempo lightning. Chain Lightning arcs between all enemies. Static Field removes a percentage of HP. Teleport for repositioning. The fastest, most explosive Sorceress build.

**STS/MT Pattern:** Defect Lightning Orb variance + Watcher Stance Dancing tempo. High damage ceiling, variable per-hit. Static Field is a unique pattern — percentage-based damage that's always relevant. Energy management and spell chaining create the "tempo" feel.

**Engine Loop:**

1. **Setup:** Charged Bolt for multi-hit spread. Static Field for percentage HP removal. Telekinesis for energy.
2. **Payoff:** Lightning for high single-target damage. Chain Lightning for AoE. Lightning Mastery for damage amplification.
3. **Scaling:** Lightning Mastery increasing all lightning damage. Energy recovery enabling more spells per turn. Spell chaining bonuses.
4. **Sustain:** Teleport for repositioning. Energy Shield for mana-as-health. Static Field softening bosses.
5. **Conversion:** Convert energy into more spell casts. Convert chain hits into draw or energy. Convert Static Field percentage damage into kill range for follow-up spells.

**The Moment:** A Chain Lightning + Lightning turn where bolts arc through the entire enemy formation, each hit amplified by Lightning Mastery.

**Cards This Lane Needs:**

- 2 lightning damage cards (single + chain)
- 1 Static Field percentage-damage card
- 1 Teleport or repositioning card
- 1 Lightning Mastery scaling card
- 1 energy recovery / spell chaining card
- 1 chain-hit-to-draw conversion

## Cross-Class Patterns Summary

### Setup Patterns

| Pattern | D2 Skin | STS/MT Source |
| --- | --- | --- |
| Mark target | Amazon Inner Sight, Necro Amplify Damage | Silent Marked for Death, MT Sap |
| Apply status | Sorc Burn, Necro Poison, Druid Slow | Silent Poison, Defect Frost |
| Build charges | Assassin martial charges, Javazon lightning | Watcher Mantra, Defect Orb channeling |
| Place summon | Druid animals, Necro skeletons, Assassin traps | MT unit placement |
| Activate aura | Paladin auras, Druid spirit auras | Defect Powers, MT persistent buffs |
| Transform | Druid shapeshift | Watcher Stance enter |

### Payoff Patterns

| Pattern | D2 Skin | STS/MT Source |
| --- | --- | --- |
| Multi-hit burst | Amazon volley, Barb WW, Pally Zeal | Ironclad Pummel, Silent Shiv burst |
| AoE release | Javazon LF, Sorc Chain Lightning, Necro CE | Ironclad Immolate, Defect Electrodynamics |
| Charge consume | Assassin finisher, Javazon Charged Strike | Watcher Divinity, Defect Dark Orb evoke |
| Status detonate | Necro CE, Sorc Meteor on Burn | Silent Catalyst, MT Frostbite |
| Summon payoff | Necro Revive, Druid Grizzly | MT Champion upgrade |
| Defense convert | Barb guard slam, Pally shield bash | Ironclad Body Slam |

### Scaling Patterns

| Pattern | D2 Skin | STS/MT Source |
| --- | --- | --- |
| Per-hit rider | Amazon arrow bonus, Barb Frenzy stack | Ironclad Strength, MT Rage |
| Mastery passive | Barb weapon mastery, Sorc element mastery | Defect Focus, MT aura |
| Aura accumulation | Paladin auras, Druid spirits | Defect Powers, MT permanent buffs |
| Status stacking | Necro poison, Sorc Burn, Druid Slow | Silent Poison, MT Frostbite |
| Summon growth | Necro Skeleton Mastery, Druid pack size | MT Gorge, MT Reform |
| Charge buildup | Assassin combo charges, Javazon charges | Watcher Mantra, Defect Orb |

## Next Use

Use this doc to draft:

1. per-class card lists that fill each lane to the 50-card target
2. exact card text that satisfies both the D2 fantasy and the engine pattern
3. role tags, reward roles, and splash roles using the established taxonomy
4. per-lane scaling validation (does this lane actually get stronger over a run?)
