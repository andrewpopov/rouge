const fs = require("fs");
const path = require("path");

const repo = "/Users/andrew/proj/rouge";
const outPath = path.join(repo, "tmp/imagegen/card_art_remaining98_batch3.jsonl");

const classMeta = {
  amazon: {
    archetype: "an amazon huntress using bows, javelins, and disciplined battlefield footwork",
    palette: "cold iron, worn leather brown, ash gray, pale ivory, soot black",
    materials: "feathered shafts, steel tips, leather straps, dust, smoke",
  },
  assassin: {
    archetype: "an assassin using claw weapons, shadow craft, and lethal traps",
    palette: "smoke gray, steel blue, black leather, ember red, soot black",
    materials: "hooked blades, dark leather, smoke wisps, sparks, cinder haze",
  },
  barbarian: {
    archetype: "a barbarian warlord of fur, iron, scars, and brutal momentum",
    palette: "black iron, old bronze, dried blood red, ash gray, ember orange",
    materials: "fur, scarred steel, leather wraps, dust, shattered grit",
  },
  druid: {
    archetype: "a primal druid channeling beasts, storm, bark, and elemental earth",
    palette: "earth brown, storm gray, moss dark, bone ivory, ember orange",
    materials: "fur, bark, stone, vine, ash, frost, windblown debris",
  },
  necromancer: {
    archetype: "a necromancer wielding bone magic, grave ash, and corpsecraft",
    palette: "dead ivory, grave gray, soot black, rust brown, bruised crimson",
    materials: "bone shards, torn cloth, rust, ash, smoke, cracked stone",
  },
  paladin: {
    archetype: "a sanctified paladin in battered holy steel and radiant force",
    palette: "pale gold, ivory light, stone gray, soot black, blue-white",
    materials: "hammered steel, sacred light, cracked stone, dust, sparks",
  },
  sorceress: {
    archetype: "a battle sorceress shaping fire, frost, lightning, and arcane force",
    palette: "ember orange, glacial blue-white, storm gray, pale cyan, soot black",
    materials: "flame, frost crystal, lightning forks, smoke, vapor, cinders",
  },
};

const overrides = {
  amazon_multiple_shot: {
    core: "a disciplined fan of arrows splitting across the field in one sweeping release",
    subject: "one centered bow volley spreading into multiple lethal paths, huntress only partly implied",
    mood: "sweeping, martial, controlled, punishing",
  },
  amazon_power_strike: {
    core: "a lightning-charged javelin thrust punching through darkness with one stunning impact",
    subject: "one centered spear or javelin strike wrapped in restrained lightning arcs",
    mood: "focused, electrified, tactical, severe",
  },
  amazon_guided_arrow: {
    core: "a single arrow curving with unnatural certainty toward its doomed target",
    subject: "one centered arrow banking through dark air toward a marked weak point",
    mood: "inevitable, precise, predatory, calm",
  },
  amazon_charged_strike: {
    core: "a spear strike discharging layered lightning through a target in repeated bursts",
    subject: "one centered charged spear impact with branching lightning lashing outward",
    mood: "violent, focused, crackling, dominant",
  },
  amazon_strafe: {
    core: "a rapid rain of arrows cutting the battlefield into parallel killing lanes",
    subject: "one centered barrage of arrows streaking in synchronized lines, no crowded battlefield",
    mood: "relentless, disciplined, suppressive, elite",
  },
  amazon_valkyrie: {
    core: "a summoned valkyrie descending as a martial guardian spirit with spear and shield",
    subject: "one centered valkyrie warrior in radiant armor, no full amazon body present",
    mood: "protective, noble, martial, severe",
  },
  amazon_lightning_fury: {
    core: "a javelin cast exploding into a lattice of lightning that rakes the whole field",
    subject: "one centered thrown javelin and branching storm arcs leaping outward to many unseen foes",
    mood: "catastrophic, electric, triumphant, controlled",
  },
  assassin_claw_mastery: {
    core: "perfectly trained claw weapons poised for a killing exchange with predatory control",
    subject: "one centered pair of assassin claws in guarded hands, no full body required",
    mood: "exact, disciplined, predatory, cold",
  },
  assassin_tiger_strike: {
    core: "a claw strike landing with the brief ghost-shape of a tiger tearing through the same line",
    subject: "one centered assassin claw impact with a compact tiger-sigil slash",
    mood: "predatory, explosive, exact, feral",
  },
  assassin_fire_blast: {
    core: "a compact fire charge hurled from a shadowed hand and bursting at close range",
    subject: "one centered thrown fire bomb or explosive ember orb, no full battlefield",
    mood: "sudden, scorching, vicious, compact",
  },
  assassin_psychic_hammer: {
    core: "an invisible mind-force blow striking like a hammer of pressure and stun",
    subject: "one centered psychic shock impact blooming from a hand or unseen strike",
    mood: "sudden, occult, disorienting, sharp",
  },
  assassin_blade_shield: {
    core: "a rotating ring of assassin blades forming a lethal defensive perimeter",
    subject: "one centered halo of curved blades around a dark core, no full figure needed",
    mood: "defensive, lethal, disciplined, whirling",
  },
  assassin_cloak_of_shadows: {
    core: "a veil of engineered darkness swallowing sight and threat around the assassin",
    subject: "one centered hoodless assassin silhouette dissolving into a mantle of shadow, minimal background",
    mood: "concealed, oppressive, silent, controlled",
  },
  assassin_burst_of_speed: {
    core: "the assassin exploding forward in a blur of impossible acceleration",
    subject: "one centered agile figure stretched by speed lines and displaced cloth, no battlefield crowd",
    mood: "swift, urgent, precise, predatory",
  },
  assassin_wake_of_fire: {
    core: "a trap line venting repeated sheets of fire across the ground like a hidden furnace mouth",
    subject: "one centered fire trap or rune vent sweeping a fan of flame outward",
    mood: "engineered, scorching, relentless, cunning",
  },
  assassin_fists_of_fire: {
    core: "a burning martial strike with both fists wrapped in compact infernal flame",
    subject: "one centered gauntleted or bare-handed punch igniting into a short fire trail",
    mood: "hot, direct, explosive, disciplined",
  },
  assassin_cobra_strike: {
    core: "a serpent-fast thrust carrying venom and lifestealing control in the same motion",
    subject: "one centered lunge or claw strike with a compact cobra silhouette in the wake",
    mood: "venomous, swift, predatory, precise",
  },
  assassin_claws_of_thunder: {
    core: "a claw strike bursting into concentrated lightning at the instant of contact",
    subject: "one centered claw impact wrapped in sharp blue-white thunder arcs",
    mood: "electric, surgical, violent, exact",
  },
  assassin_lightning_sentry: {
    core: "an assassin sentry turret spitting disciplined forks of lightning over the whole field",
    subject: "one centered arcane sentry device with repeated lightning discharges, no full assassin body",
    mood: "mechanical, crackling, watchful, severe",
  },
  assassin_shadow_warrior: {
    core: "a living shadow duplicate stepping into the fight as a deadly mirror of the assassin",
    subject: "one centered shadow warrior with twin blades and a faint mirrored aura, no extra crowd",
    mood: "protective, uncanny, disciplined, lethal",
  },
  assassin_phoenix_strike: {
    core: "a finishing strike crowned by a brief eruption of phoenix fire and martial force",
    subject: "one centered assassin strike with a compact phoenix-shaped flare around the impact",
    mood: "mythic, explosive, exact, elite",
  },
  assassin_death_sentry: {
    core: "a grim death sentry pulsing out repeated killing blasts over a field of bodies",
    subject: "one centered sentry construct with a ring of shockwave death pulses",
    mood: "merciless, engineered, grim, overwhelming",
  },
  barbarian_find_potion: {
    core: "a scarred barbarian fist wrenching a blood-red potion from the wreckage of battle",
    subject: "one centered hand, belt, or shattered ground with a hard-won potion vial as the focal point",
    mood: "resourceful, rough, grounded, survivalist",
  },
  barbarian_natural_resistance: {
    core: "a barbarian enduring fire, frost, and poison pressure through sheer hardened resilience",
    subject: "one centered torso or braced figure resisting three elemental threats at once",
    mood: "unyielding, seasoned, stoic, hard",
  },
  barbarian_battle_orders: {
    core: "a command bellow that hardens allies and crushes hesitation out of the air itself",
    subject: "one centered barbarian warlord shouting with a pressure wave of command radiating outward",
    mood: "commanding, rallying, relentless, severe",
  },
  barbarian_berserk: {
    core: "a barbarian strike so furious it tears through steel with a raw magic edge",
    subject: "one centered berserker swing breaking into pale brutal force, still clearly barbarian not caster",
    mood: "feral, unstoppable, violent, possessed",
  },
  druid_raven: {
    core: "a summoned raven spirit diving in a marking strike over the battlefield",
    subject: "one centered black raven with cruel beak and omen-bright eyes",
    mood: "watchful, swift, ominous, precise",
  },
  druid_firestorm: {
    core: "multiple jets of druidic flame ripping across the ground in a chaotic but controlled wave",
    subject: "one centered surge of branching ground-fire and ember spray, no full druid body",
    mood: "eruptive, scorching, primal, fast",
  },
  druid_werewolf: {
    core: "a werewolf maul landing with savage speed and blood-warm momentum",
    subject: "one centered werewolf beast-warrior in mid-slash, no crowded battlefield",
    mood: "feral, hungry, fast, brutal",
  },
  druid_poison_creeper: {
    core: "a thorned vine-creature surging from the ground to bite and spread venom",
    subject: "one centered serpentine poison creeper of roots and fangs, no full druid body",
    mood: "venomous, creeping, primal, hostile",
  },
  druid_cyclone_armor: {
    core: "a druidic armor of spinning wind and debris wrapping the body like a storm shell",
    subject: "one centered torso or silhouette inside a tight cyclone barrier",
    mood: "protective, stormbound, controlled, elemental",
  },
  druid_lycanthropy: {
    core: "the druid mid-transformation, human form giving way to beast power and predatory endurance",
    subject: "one centered close-up partial transformation into wolf-beast features, no busy scene",
    mood: "primal, feral, potent, transformative",
  },
  druid_werebear: {
    core: "a werebear crashing forward in a mauling guard-breaking slam",
    subject: "one centered hulking werebear with one crushing paw or forearm strike",
    mood: "massive, protective, savage, unstoppable",
  },
  druid_oak_sage: {
    core: "an ancient oak spirit rising as a healing totem with a living heart of light",
    subject: "one centered oak sage spirit or bark totem, no full druid body",
    mood: "protective, ancient, restorative, solemn",
  },
  necromancer_teeth: {
    core: "a spray of jagged bone teeth erupting forward like a fan of ivory knives",
    subject: "one centered volley of bone shards or fangs blasting through darkness",
    mood: "sharp, cruel, occult, sudden",
  },
  necromancer_bone_armor: {
    core: "an armor of interlocking bone plates locking around the necromancer like a grave shell",
    subject: "one centered torso or silhouette wrapped in curved bone armor",
    mood: "protective, grim, ritual, severe",
  },
  necromancer_amplify_damage: {
    core: "a curse mark flaring over a target and opening every hidden seam for greater harm",
    subject: "one centered cursed sigil burned into armor or flesh, no full necromancer body",
    mood: "malignant, exacting, predatory, occult",
  },
  necromancer_raise_skeleton: {
    core: "a skeleton warrior clawing up from the grave in answer to a necromantic command",
    subject: "one centered skeleton rising from broken earth with rusty weapon in hand",
    mood: "grim, obedient, relentless, cold",
  },
  necromancer_bone_wall: {
    core: "a barricade of jagged bone erupting from the ground to halt and wound",
    subject: "one centered wall or fan of bone spikes thrusting upward",
    mood: "harsh, defensive, cruel, rigid",
  },
  necromancer_life_tap: {
    core: "a blood rite siphoning vitality through a cursed handprint and feeding it back as survival",
    subject: "one centered occult hand sigil or bleeding pact mark, no full figure",
    mood: "hungry, sinister, restorative, intimate",
  },
  necromancer_clay_golem: {
    core: "a hulking clay golem rising with mud-heavy fists and a protector's bulk",
    subject: "one centered clay golem, heavy and earthen, no full necromancer body",
    mood: "massive, protective, grim, deliberate",
  },
  necromancer_iron_maiden: {
    core: "a cruel curse of spikes and iron pressure closing around a doomed target",
    subject: "one centered iron-maiden-like cage or halo of spikes tightening inward",
    mood: "sadistic, ritual, punishing, severe",
  },
  necromancer_blood_golem: {
    core: "a blood golem stitched from gore-dark flesh and bound to siphoning vitality",
    subject: "one centered hulking blood golem, no full necromancer body",
    mood: "grotesque, heavy, sustaining, relentless",
  },
  necromancer_decrepify: {
    core: "a withering curse aging and weakening its victim in a single instant",
    subject: "one centered cursed target silhouette unraveling under a decay halo",
    mood: "withering, oppressive, occult, cruel",
  },
  necromancer_skeletal_mage: {
    core: "a skeletal mage raising a toxic bolt while poison gathers around the field",
    subject: "one centered skeletal caster, no full necromancer body",
    mood: "toxic, eerie, relentless, cunning",
  },
  necromancer_bone_spirit: {
    core: "a sacred-dead spirit of bone and hatred diving toward a target as a perfect killing omen",
    subject: "one centered bone spirit projectile or skull-like spirit with a trailing wail",
    mood: "inevitable, spectral, lethal, severe",
  },
  paladin_prayer: {
    core: "a quiet battlefield prayer mending flesh and resolve through steady sanctified light",
    subject: "one centered pair of gauntleted hands, bowed helm, or devotional aura over cracked stone",
    mood: "calm, restorative, devout, resolute",
  },
  paladin_might: {
    core: "a martial blessing of strength turning one strike into a sacred show of force",
    subject: "one centered weapon arm or gauntlet swollen with restrained holy power",
    mood: "empowered, martial, resolute, forceful",
  },
  paladin_thorns: {
    core: "a sanctified aura of barbs and flame punishing anything that presses too close",
    subject: "one centered defensive halo of radiant thorns around armor or shield",
    mood: "punishing, protective, righteous, hard",
  },
  paladin_cleansing: {
    core: "holy fire washing corruption and battle-filth away in a controlled rite of recovery",
    subject: "one centered aura of purifying flame around a battered knight silhouette",
    mood: "clean, sanctified, restorative, stern",
  },
  paladin_defiance: {
    core: "a stance of absolute refusal turning shield and will into one immovable bastion",
    subject: "one centered shield wall pose or massive shield under radiant pressure",
    mood: "unyielding, protective, resolute, severe",
  },
  paladin_holy_bolt: {
    core: "a straight lance of sanctified energy fired with surgical clarity into the dark",
    subject: "one centered holy projectile or radiant bolt line, no full battlefield",
    mood: "pure, precise, radiant, severe",
  },
  paladin_holy_fire: {
    core: "a halo of consecrated flame washing outward from a knightly centerline",
    subject: "one centered holy fire aura around armor or weapon, no full crowd scene",
    mood: "radiant, scorching, protective, devout",
  },
  paladin_fanaticism: {
    core: "a righteous battle aura driving allies into perfect zeal and crushing enemy momentum",
    subject: "one centered paladin aura bloom with weapon and shield motifs, no full crowd scene",
    mood: "fervent, commanding, radiant, relentless",
  },
  paladin_conviction: {
    core: "a condemning holy aura forcing the whole field to bend beneath judgment",
    subject: "one centered ring or dome of judgmental radiance pressing down on unseen enemies",
    mood: "judgmental, dominant, sanctified, crushing",
  },
  sorceress_warmth: {
    core: "inner ember magic gathering at the heart and hands as a sustaining furnace of life",
    subject: "one centered sorceress torso or hands glowing with contained ember heat",
    mood: "restorative, intimate, warm, arcane",
  },
  sorceress_energy_shield: {
    core: "an arcane barrier skin of force wrapping the sorceress in translucent protection",
    subject: "one centered silhouette inside a layered energy shield, no busy scene",
    mood: "protective, lucid, arcane, controlled",
  },
  sorceress_frozen_armor: {
    core: "a skin of living frost locking over cloth and steel as defensive cold power",
    subject: "one centered armored torso or shoulder crusted in magical ice",
    mood: "cold, protective, elegant, severe",
  },
  sorceress_static_field: {
    core: "a field of compressed lightning ripping outward in a circular pulse over the whole battlefield",
    subject: "one centered ring or dome of crackling lightning pressure",
    mood: "electrical, suppressive, arcane, tense",
  },
  sorceress_inferno: {
    core: "a continuous stream of sorcerous fire carving a bright furnace path through the dark",
    subject: "one centered ribbon or cone of fire projected forward, no crowded battlefield",
    mood: "scorching, relentless, controlled, arcane",
  },
  sorceress_meteor: {
    core: "a meteor impact turning the battlefield into a crater of fire, slag, and shock",
    subject: "one centered descending meteor or fresh impact column, no full sorceress body",
    mood: "cataclysmic, scorching, heavy, triumphant",
  },
  sorceress_teleport: {
    core: "the sorceress vanishing through a tear in space, leaving only force and afterlight behind",
    subject: "one centered empty displacement scar or partial departing silhouette, no busy scene",
    mood: "sudden, elegant, arcane, evasive",
  },
  sorceress_lightning_mastery: {
    core: "a perfected storm lattice answering the sorceress with disciplined mass lightning",
    subject: "one centered web of chained lightning under total control",
    mood: "masterful, electric, commanding, precise",
  },
};

const elementPalette = {
  fire: "ember orange, molten gold, black smoke, crimson cinder, soot black",
  cold: "glacial white, steel blue, pale cyan, ash silver, soot black",
  lightning: "blue-white, pale gold, storm gray, cold steel, soot black",
  poison: "sickly green, grave gray, dead ivory, black smoke, bruised crimson",
  arcane: "pale ivory, dim gold, ash gray, smoke black, cold steel",
  physical: null,
};

function parseCards() {
  const assetMap = fs.readFileSync(path.join(repo, "src/content/asset-map-data.ts"), "utf8");
  const illMatch = assetMap.match(/const CARD_ILLUSTRATIONS: Record<string, string> = \{([\s\S]*?)\n  \};/);
  const illustrated = new Set([...illMatch[1].matchAll(/^\s*([a-z0-9_]+):\s*`/gm)].map((m) => m[1]));
  const files = [
    "src/content/class-cards-amazon.ts",
    "src/content/class-cards-assassin.ts",
    "src/content/class-cards-barbarian.ts",
    "src/content/class-cards-druid.ts",
    "src/content/class-cards-necromancer.ts",
    "src/content/class-cards-paladin.ts",
    "src/content/class-cards-sorceress.ts",
  ];
  const cards = [];
  for (const file of files) {
    const className = file.match(/class-cards-([a-z]+)\.ts/)[1];
    const lines = fs.readFileSync(path.join(repo, file), "utf8").split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\s*([a-z0-9_]+):\s*\{$/);
      if (!m) continue;
      let depth = 1;
      const block = [lines[i]];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const line = lines[j];
        block.push(line);
        depth += (line.match(/\{/g) || []).length;
        depth -= (line.match(/\}/g) || []).length;
        if (depth === 0) break;
      }
      i = j;
      const joined = block.join("\n");
      const id = (joined.match(/\bid:\s*"([^"]+)"/) || [])[1];
      const title = (joined.match(/\btitle:\s*"([^"]+)"/) || [])[1];
      const text = (joined.match(/\btext:\s*"([^"]+)"/) || [])[1];
      if (!id || !title || !text || illustrated.has(id)) continue;
      cards.push({ className, id, title, text });
    }
  }
  return cards;
}

function detectElement(card) {
  const lower = `${card.id} ${card.title} ${card.text}`.toLowerCase();
  if (/(fire|burn|inferno|meteor|volcano|armageddon|wake_of_fire|holy fire)/.test(lower)) return "fire";
  if (/(cold|freeze|ice|blizzard|frozen|hurricane)/.test(lower)) return "cold";
  if (/(lightning|paralyze|static|charged|thunder)/.test(lower)) return "lightning";
  if (/poison/.test(lower)) return "poison";
  if (/(magic|psychic|teleport|energy|bone spirit)/.test(lower)) return "arcane";
  return "physical";
}

function detectCategory(card) {
  const lower = `${card.id} ${card.title}`.toLowerCase();
  if (overrides[card.id]) return "override";
  if (/sentry|wake_of_fire/.test(lower)) return "trap";
  if (/valkyrie|raven|creeper|sage|skeleton|golem|mage|warrior/.test(lower) || /Summon /.test(card.text)) return "summon";
  if (/armor|shield|skin|resistance|defiance|fade|cloak|warmth|cleansing|prayer|fanaticism|conviction|mastery|lycanthropy/.test(lower)) return "aura";
  if (/teleport|burst_of_speed|leap/.test(lower)) return "motion";
  if (/howl|shout|war_cry|battle_orders/.test(lower)) return "roar";
  if (/multiple_shot|strafe|whirlwind|tornado|hurricane|blizzard|meteor|firestorm|volcano|armageddon|nova|field|lightning_fury|chain_lightning|holy_freeze/.test(lower) || /all enemies/.test(card.text)) return "area";
  if (/arrow|bolt|dagger|spear|hammer/.test(lower)) return "projectile";
  return "melee";
}

function summonDescriptor(card) {
  const name = ((card.text.match(/Summon ([^.]+)\./) || [])[1] || card.title).toLowerCase();
  if (name.includes("valkyrie")) return "one centered valkyrie guardian with spear and shield, no summoner body";
  if (name.includes("raven")) return "one centered black raven spirit diving in a marking strike";
  if (name.includes("poison creeper")) return "one centered thorned vine-serpent erupting from the ground";
  if (name.includes("oak sage")) return "one centered oak spirit totem with a living heart of light";
  if (name.includes("skeleton")) return "one centered skeleton warrior rising from broken earth";
  if (name.includes("clay golem")) return "one centered hulking clay golem, heavy and earthen";
  if (name.includes("blood golem")) return "one centered flesh-and-blood golem bound by dark ritual";
  if (name.includes("skeletal mage")) return "one centered skeletal mage lifting a toxic bolt";
  if (name.includes("shadow warrior")) return "one centered shadow assassin duplicate with twin blades";
  return `one centered summoned ${name} as the dominant silhouette`;
}

function genericSpec(card) {
  const element = detectElement(card);
  const category = detectCategory(card);
  if (category === "override") return overrides[card.id];
  if (category === "trap") {
    return {
      core: `a hidden assassin trap for "${card.title}" erupting into repeated battlefield punishment`,
      subject: "one centered trap device or sigil engine unleashing its effect, no full body hero",
      mood: "engineered, lethal, watchful, controlled",
    };
  }
  if (category === "summon") {
    return {
      core: `the summoned force of "${card.title}" arriving as a persistent ally with its own deadly role`,
      subject: summonDescriptor(card),
      mood: "summoned, purposeful, protective, relentless",
    };
  }
  if (category === "aura") {
    return {
      core: `the effect of "${card.title}" focused into one iconic defensive or empowering manifestation`,
      subject: "one centered torso, shield, weapon, or ritual aura that reads instantly at card size",
      mood: "protective, empowered, controlled, resolute",
    };
  }
  if (category === "motion") {
    return {
      core: `a sudden movement skill for "${card.title}" captured at the exact instant of displacement or impact`,
      subject: "one centered figure or motion scar tearing through darkness, no busy battlefield",
      mood: "swift, forceful, agile, decisive",
    };
  }
  if (category === "roar") {
    return {
      core: `a command or roar from "${card.title}" turning voice into a battlefield shockwave`,
      subject: "one centered warrior or knight with a pressure wave radiating outward",
      mood: "commanding, suppressive, rallying, severe",
    };
  }
  if (category === "area") {
    return {
      core: `a battlefield-wide ${element === "physical" ? "martial sweep" : element} storm from "${card.title}" overwhelming multiple foes at once`,
      subject: "one centered mass effect or sweeping arc, no crowded army scene, clean silhouette",
      mood: "sweeping, dominant, punishing, cinematic",
    };
  }
  if (category === "projectile") {
    return {
      core: `a single ${element === "physical" ? "" : `${element} `}projectile or impact from "${card.title}" shown with lethal clarity`,
      subject: "one centered projectile, impact point, or straight killing line, no full battlefield",
      mood: "precise, lethal, focused, clean",
    };
  }
  return {
    core: `a decisive martial strike for "${card.title}" landing at full force`,
    subject: "one centered weapon blow, claw strike, or combat impact, compact enough for card readability",
    mood: "violent, direct, grounded, severe",
  };
}

function buildPrompt(card) {
  const cls = classMeta[card.className];
  const spec = genericSpec(card);
  const element = detectElement(card);
  const palette = spec.palette || elementPalette[element] || cls.palette;
  const materials = spec.materials || cls.materials;
  return [
    "Use case: stylized-concept",
    "Asset type: combat card illustration",
    `Primary request: a premium dark-fantasy card illustration for an original game called Blood Rogue showing ${cls.archetype}. Depict the skill "${card.title}". Card rules: "${card.text}". Focus on ${spec.core}.`,
    `Subject: ${spec.subject}.`,
    "Style/medium: painterly gothic dark fantasy, mature deckbuilder art.",
    "Composition/framing: vertical 3:4 illustration, strong centered silhouette, dark uncluttered edges, readable inside a small card art window.",
    `Lighting/mood: ${spec.mood}.`,
    `Color palette: ${palette}.`,
    `Materials/textures: ${materials}.`,
    "Constraints: no text, no logo, no frame, no watermark, no modern objects, no crowded battlefield unless the card absolutely requires a wide effect.",
    "Avoid: no cartoon style, no anime, no goofy proportions, no UI overlays, no generic stock-fantasy posing.",
  ].join("\n");
}

const cards = parseCards();
const lines = cards.map((card) =>
  JSON.stringify({
    prompt: buildPrompt(card),
    size: "1024x1536",
    quality: "low",
    out: `${card.id}__gpt15low_v1.png`,
  }),
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`);
console.log(`wrote ${lines.length} jobs to ${outPath}`);
console.log(lines.slice(0, 3).join("\n"));
