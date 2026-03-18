#!/usr/bin/env node

/**
 * Extract idle frames from downloaded D2 sprite sheets into curated combat sprites.
 * Requires: ImageMagick 7 (magick command)
 *
 * Pipeline:
 *  1. Remove outer border color (teal, tan, pink, etc.) via corner sampling
 *  2. Remove inner sprite-sheet background via second corner sampling
 *  3. Use connected-components to find individual sprite blobs
 *  4. Extract the largest non-background blob → 128x128 PNG with transparency
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const MAIN_REPO = process.env.ROUGE_MAIN_REPO || path.resolve(ROOT, "../rouge");
const RAW_DIR = path.join(MAIN_REPO, "assets/diablo2_downloads/organized/sprites/raw/spriters");
const EXTRACTED_DIR = path.join(MAIN_REPO, "assets/diablo2_downloads/organized/sprites/extracted");
const OUT_DIR = path.join(ROOT, "assets/curated/sprites");
const TMP = path.join(ROOT, ".sprite-tmp");

for (const sub of ["enemies", "bosses", "classes", "mercenaries"]) {
  fs.mkdirSync(path.join(OUT_DIR, sub), { recursive: true });
}
fs.mkdirSync(TMP, { recursive: true });

let total = 0, success = 0, skip = 0, fail = 0;
let tmpN = 0;
function tmpFile() { return path.join(TMP, `t${tmpN++}.png`); }

function findRaw(id) {
  for (const ext of ["gif", "png", "jpg"]) {
    const p = path.join(RAW_DIR, `${id}.${ext}`);
    if (fs.existsSync(p)) {return p;}
  }
  return null;
}

function findExtractedIdle(assetId) {
  const base = path.join(EXTRACTED_DIR, String(assetId));
  if (!fs.existsSync(base)) {return null;}
  const direct = path.join(base, "idle.png");
  if (fs.existsSync(direct)) {return direct;}
  try {
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const sub = path.join(base, entry.name, "idle.png");
        if (fs.existsSync(sub)) {return sub;}
      }
    }
  } catch { /* ignore */ }
  return null;
}

function run(cmd, timeout = 30000) {
  try {
    return execSync(cmd, { stdio: "pipe", timeout }).toString().trim();
  } catch { return null; }
}

function magick(args, timeout = 30000) {
  return run(`magick ${args}`, timeout) !== null;
}

function getInfo(src) {
  const out = run(`magick identify -format "%w %h" "${src}[0]"`);
  if (!out) {return null;}
  const [w, h] = out.split(" ").map(Number);
  return (w && h) ? { w, h } : null;
}

function sampleColor(src, x, y) {
  const out = run(`magick "${src}" -crop 1x1+${x}+${y} +repage -depth 8 txt:-`);
  if (!out) {return null;}
  const m = out.match(/#([0-9A-Fa-f]{6,8})/);
  if (!m) {return null;}
  const hex = m[1];
  // Skip transparent pixels (alpha = 00)
  if (hex.length === 8 && hex.slice(6) === "00") {return null;}
  return `#${hex.slice(0, 6)}`;
}

/**
 * Find the dominant opaque background color by sampling multiple interior positions.
 */
function findInnerBg(src) {
  const info = getInfo(src);
  if (!info) {return null;}
  const positions = [
    [Math.floor(info.w * 0.25), Math.floor(info.h * 0.25)],
    [Math.floor(info.w * 0.5), Math.floor(info.h * 0.5)],
    [Math.floor(info.w * 0.75), Math.floor(info.h * 0.25)],
    [Math.floor(info.w * 0.25), Math.floor(info.h * 0.75)],
    [100, 100],
    [50, 50],
  ];
  const counts = {};
  for (const [x, y] of positions) {
    if (x >= info.w || y >= info.h) {continue;}
    const c = sampleColor(src, x, y);
    if (c) {
      counts[c] = (counts[c] || 0) + 1;
    }
  }
  // Return the most frequently sampled color (likely the background)
  let best = null, bestCount = 0;
  for (const [color, count] of Object.entries(counts)) {
    if (count > bestCount) { best = color; bestCount = count; }
  }
  return best;
}

function isUsable(f) {
  if (!fs.existsSync(f)) {return false;}
  if (fs.statSync(f).size < 300) {return false;}
  const out = run(`magick "${f}" -format "%k" info:`);
  return out ? parseInt(out, 10) >= 4 : false;
}

function rm(...files) {
  for (const f of files) {
    try { if (fs.existsSync(f)) {fs.unlinkSync(f);} } catch { /* */ }
  }
}

/**
 * Remove both background layers and find the first sprite via connected components.
 */
function extractSprite(src, dest) {
  const t1 = tmpFile(), t2 = tmpFile(), t3 = tmpFile(), t4 = tmpFile();

  try {
    // Detect and remove outer border color
    const outerColor = sampleColor(src, 0, 0);
    if (!outerColor) {return false;}

    if (!magick(`"${src}" -fuzz 15% -transparent "${outerColor}" -trim +repage "${t1}"`)) {return false;}
    if (!fs.existsSync(t1)) {return false;}

    // Detect and remove inner background color (sample interior, not corner)
    const innerColor = findInnerBg(t1);
    if (innerColor) {
      magick(`"${t1}" -fuzz 20% -transparent "${innerColor}" -trim +repage "${t2}"`);
    }
    const cleanSrc = (fs.existsSync(t2) && getInfo(t2)) ? t2 : t1;

    const cleanInfo = getInfo(cleanSrc);
    if (!cleanInfo) {return false;}

    // If already small enough, just resize directly
    if (cleanInfo.w <= 256 && cleanInfo.h <= 256) {
      if (!magick(`"${cleanSrc}" -trim +repage -resize "128x128>" -background none -gravity center -extent 128x128 "${dest}"`)) {return false;}
      return isUsable(dest);
    }

    // Use connected components on a manageable crop region
    // Crop the top-left portion to analyze (avoid processing huge images)
    const cropW = Math.min(cleanInfo.w, 800);
    const cropH = Math.min(cleanInfo.h, 800);
    if (!magick(`"${cleanSrc}" -crop "${cropW}x${cropH}+0+0" +repage "${t3}"`)) {return false;}
    if (!fs.existsSync(t3)) {return false;}

    // Find connected components (sprite blobs)
    const ccOut = run(`magick "${t3}" -alpha extract -threshold 50% -morphology Close Diamond:3 -define connected-components:verbose=true -connected-components 8 null:`, 30000);

    if (ccOut) {
      // Parse connected component output to find largest non-background blob
      const blobs = [];
      for (const line of ccOut.split("\n")) {
        // Format: id: WxH+X+Y centroid area color
        const m = line.match(/(\d+):\s+(\d+)x(\d+)\+(\d+)\+(\d+)\s+[\d.,]+\s+(\d+)\s+srgb\((\d+)/);
        if (m) {
          const [, id, w, h, x, y, area, colorR] = m.map(Number);
          blobs.push({ id, w, h, x, y, area, isWhite: colorR === 255 });
        }
      }

      // White blobs are the sprites (foreground). Sort by area descending.
      const spriteBlobs = blobs.filter(b => b.isWhite).sort((a, b) => b.area - a.area);

      if (spriteBlobs.length > 0) {
        // Take the largest sprite blob
        const best = spriteBlobs[0];
        // Add small padding
        const pad = 4;
        const cx = Math.max(0, best.x - pad);
        const cy = Math.max(0, best.y - pad);
        const cw = best.w + pad * 2;
        const ch = best.h + pad * 2;

        if (magick(`"${t3}" -crop "${cw}x${ch}+${cx}+${cy}" +repage -trim +repage -resize "128x128>" -background none -gravity center -extent 128x128 "${dest}"`)) {
          if (isUsable(dest)) {return true;}
        }
      }
    }

    // Fallback: just crop top-left and resize
    const estFrame = Math.min(200, Math.floor(Math.min(cleanInfo.w, cleanInfo.h) / 3));
    if (magick(`"${cleanSrc}" -crop "${estFrame}x${estFrame}+0+0" +repage -trim +repage -resize "128x128>" -background none -gravity center -extent 128x128 "${dest}"`)) {
      if (isUsable(dest)) {return true;}
    }

    return false;
  } finally {
    rm(t1, t2, t3, t4);
  }
}

/**
 * Extract from pre-extracted idle sheet: crop first direction row, then extract sprite.
 */
function tryExtractedIdle(assetId, dest) {
  const idleSrc = findExtractedIdle(assetId);
  if (!idleSrc) {return false;}

  const info = getInfo(idleSrc);
  if (!info) {return false;}

  const t = tmpFile();
  try {
    // Idle sheets have ~8 direction rows. Take first row.
    const rowH = Math.max(1, Math.floor(info.h / 8));
    if (!magick(`"${idleSrc}" -crop "${info.w}x${rowH}+0+0" +repage "${t}"`)) {return false;}
    if (!fs.existsSync(t)) {return false;}
    return extractSprite(t, dest);
  } finally {
    rm(t);
  }
}

/**
 * Extract from GIF: first frame → extractSprite
 */
function tryGif(src, dest) {
  const t = tmpFile();
  try {
    if (!magick(`"${src}[0]" "${t}"`)) {return false;}
    if (!fs.existsSync(t)) {return false;}
    return extractSprite(t, dest);
  } finally {
    rm(t);
  }
}

/**
 * Extract from raw PNG sheet: try sections, then full.
 */
function trySheet(src, dest) {
  const info = getInfo(src);
  if (!info) {return false;}

  const t = tmpFile();
  try {
    // Skip label text area (~2% from top) and take top quarter
    const ySkip = Math.min(40, Math.floor(info.h * 0.02));
    const cropH = Math.min(Math.floor(info.h / 3), 1200);

    if (magick(`"${src}" -crop "${info.w}x${cropH}+0+${ySkip}" +repage "${t}"`)) {
      if (fs.existsSync(t) && extractSprite(t, dest)) {return true;}
    }

    // Full image
    return extractSprite(src, dest);
  } finally {
    rm(t);
  }
}

function processEntry(src, dest, label) {
  if (fs.existsSync(dest)) { skip++; return; }
  total++;

  const assetId = path.basename(src).replace(/\.\w+$/, "");

  // 1. Pre-extracted idle sheet
  if (tryExtractedIdle(assetId, dest)) {
    success++;
    console.log(`  [extracted] ${label}`);
    return;
  }
  rm(dest);

  // 2. GIF first frame
  if (path.extname(src).toLowerCase() === ".gif") {
    if (tryGif(src, dest)) {
      success++;
      console.log(`  [gif] ${label}`);
      return;
    }
    rm(dest);
  }

  // 3. Raw sheet
  if (trySheet(src, dest)) {
    success++;
    console.log(`  [sheet] ${label}`);
    return;
  }
  rm(dest);

  console.log(`  [FAIL] ${label}`);
  fail++;
}

// ── Game ID → Spriter Asset ID Mappings ──

const ENEMY_MAP = {
  fallen: 92829, fallen_shaman: 54314, spike_fiend: 54330, zombie: 88431,
  wendigo: 64031, corrupt_rogue: 84128, corrupt_rogue_archer: 84128,
  corrupt_rogue_spearwoman: 84128, skeleton: 92815, skeleton_archer: 92815,
  skeleton_mage: 92815, goatman: 84589, blood_hawk: 54308, tainted: 84205,
  giant_spider: 54329, wraith: 72427, fetish: 70852, vampire: 54333,
  flying_scimitar: 54333, blood_hawk_nest: 70044, gargoyle_trap: 54333,
  leaper: 54323, scarab_demon: 90905, sand_maggot: 54325,
  sand_maggot_egg: 90207, sand_maggot_young: 54326, vulture_demon: 54336,
  swarm: 70851, sabre_cat: 54327, slinger: 54327, mummy: 77192,
  greater_mummy: 54320, sand_raider: 54327, bat_demon: 70851,
  claw_viper: 54307, baboon_demon: 54307, blunderbore: 54309,
  lightning_spire: 84792, mummy_sarcophagus: 77192, fire_tower: 84792,
  fetish_shaman: 54315, giant_mosquito: 70851, thorned_hulk: 93975,
  frog_demon: 54316, willowisp: 71306, bone_fetish: 89566,
  tentacle_beast: 94077, zakarum_zealot: 109183, zakarum_priest: 109183,
  council_member: 54310,
  finger_mage: 91470, megademon: 54309, regurgitator: 54324,
  oblivion_knight: 109183, vile_mother: 54335, vile_child: 54334,
  baal_s_minion: 99987, suicide_minion: 99987, death_mauler: 94968,
  catapult: 93359, overseer: 54309, demon_imp: 94832, siege_beast: 109198,
  abominable: 71292, reanimated_horde: 95000, succubus: 67720,
  stygian_fury: 67720, frozen_horror: 71292, blood_lord: 94621,
  putrid_defiler: 93322, pain_worm: 71209, minion_of_destruction: 93254,
  reziarfg: 54309, undead_horror: 95000,
};

const BOSS_MAP = {
  andariel: 54306, duriel: 84214, mephisto: 109347, diablo: 55535,
  baal: 99987, blood_raven: 84128, the_countess: 54333, the_smith: 54321,
  griswold: 54321, bishibosh: 54314, rakanishu: 92829, corpsefire: 88431,
  bonebreaker: 92815, coldcrow: 84128, treehead_woodfist: 64031,
  pitspawn_fouldog: 54316, the_cow_king: 54333, radament: 90075,
  the_summoner: 109183, ancient_kaa_the_soulless: 54320,
  creeping_feature: 77192, dark_elder: 54325, beetleburst: 90905,
  bloodwitch_the_wild: 54307, fangskin: 54307, fire_eye: 92829,
  coldworm_the_burrower: 54325, battlemaid_sarina: 84128,
  witch_doctor_endugu: 54315, stormtree: 93975, sszark_the_burning: 70852,
  icehawk_riftwing: 70851, bremm_sparkfist: 54310, geleb_flamefinger: 54310,
  ismail_vilehand: 54310, maffer_dragonhand: 54310, toorc_icefist: 54310,
  wyand_voidbringer: 54310, izual: 54322, hephasto_the_armorer: 54321,
  grand_vizier_of_chaos: 91470, infector_of_souls: 54309,
  lord_de_seis: 109183, nihlathak: 109182, shenk_the_overseer: 54309,
  eldritch_the_rectifier: 54309, pindleskin: 95000,
  sharptooth_slayer: 54309, frozenstein: 71292, bonesaw_breaker: 95000,
  dac_farren: 71292, eyeback_the_unleashed: 54309, thresh_socket: 54309,
  snapchip_shatter: 71292, colenzo_the_annihilator: 92829,
  achmel_the_cursed: 54320, bartuc_the_bloody: 54310,
  ventar_the_unholy: 54309, lister_the_tormentor: 93254,
  korlic: 54309, madawc: 54309, talic: 54309,
  uber_diablo: 55535, uber_baal: 99987, uber_mephisto: 109347,
  uber_duriel: 84214, uber_izual: 54322, pandemonium_diablo: 55535,
  lilith: 54306,
};

const CLASS_MAP = {
  amazon: 54286, assassin: 54288, barbarian: 54291,
  druid: 54294, necromancer: 54297, paladin: 54302, sorceress: 54300,
};

const MERC_MAP = {
  rogue_scout: 84128, desert_guard: 54327, iron_wolf: 109183,
  kurast_shadow: 54333, templar_vanguard: 54302,
  harrogath_captain: 54309, pandemonium_scout: 91470,
};

function processCategory(label, map, subdir) {
  console.log(`\n=== ${label} ===`);
  for (const [gameId, assetId] of Object.entries(map)) {
    const src = findRaw(assetId);
    if (src) {
      processEntry(src, path.join(OUT_DIR, subdir, `${gameId}.png`), `${subdir}:${gameId}`);
    } else {
      console.log(`  [MISS] ${subdir}:${gameId} - no raw asset for ID ${assetId}`);
      fail++;
    }
  }
}

console.log("D2 Sprite Extraction Pipeline v4 (connected-components)");
console.log("========================================================\n");
console.log(`Source: ${RAW_DIR}`);
console.log(`Output: ${OUT_DIR}\n`);

processCategory("Enemy Sprites", ENEMY_MAP, "enemies");
processCategory("Boss Sprites", BOSS_MAP, "bosses");
processCategory("Class Sprites", CLASS_MAP, "classes");
processCategory("Mercenary Sprites", MERC_MAP, "mercenaries");

try { fs.rmSync(TMP, { recursive: true }); } catch { /* ignore */ }

console.log("\n=== Summary ===");
console.log(`Processed: ${total}`);
console.log(`Extracted: ${success}`);
console.log(`Skipped (existing): ${skip}`);
console.log(`Failed: ${fail}`);

for (const sub of ["enemies", "bosses", "classes", "mercenaries"]) {
  const dir = path.join(OUT_DIR, sub);
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".png"));
  console.log(`  ${sub}: ${files.length} sprites`);
}
