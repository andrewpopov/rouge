#!/usr/bin/env bash
# Fix placeholder/broken sprites by re-extracting from raw sheets
# with tuned parameters for each problem sprite.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/assets/diablo2_downloads/organized/sprites/raw/spriters"
BOSSES="$ROOT/assets/curated/sprites/bosses"
ENEMIES="$ROOT/assets/curated/sprites/enemies"
BACKUP="$ROOT/assets/curated/sprites/enemies/_originals"
TMP=$(mktemp -d)

trap 'rm -rf "$TMP"' EXIT

extract_frame() {
  local src="$1" dest="$2" label="$3"
  local crop_geom="${4:-}" bg_color="${5:-}" fuzz="${6:-15}"

  echo "  Extracting: $label"

  local work="$TMP/work.png"

  # Step 1: Crop specific region if given
  if [ -n "$crop_geom" ]; then
    magick "$src" -crop "$crop_geom" +repage "$work"
  else
    cp "$src" "$work"
  fi

  # Step 2: Remove background color
  if [ -n "$bg_color" ]; then
    magick "$work" -fuzz "${fuzz}%" -transparent "$bg_color" -trim +repage "$TMP/clean.png"
  else
    # Auto-detect: sample corner pixel
    local corner
    corner=$(magick "$work" -crop 1x1+0+0 +repage -depth 8 txt:- | grep -o '#[0-9A-Fa-f]\{6\}' | head -1)
    if [ -n "$corner" ]; then
      magick "$work" -fuzz "${fuzz}%" -transparent "$corner" -trim +repage "$TMP/clean.png"
    else
      cp "$work" "$TMP/clean.png"
    fi
  fi

  # Step 3: Also remove a second bg layer if present (teal borders etc)
  local inner_corner
  inner_corner=$(magick "$TMP/clean.png" -crop 1x1+0+0 +repage -depth 8 txt:- | grep -o '#[0-9A-Fa-f]\{6\}' | head -1) || true
  if [ -n "$inner_corner" ] && [ "$inner_corner" != "#000000" ]; then
    magick "$TMP/clean.png" -fuzz 12% -transparent "$inner_corner" -trim +repage "$TMP/clean2.png" 2>/dev/null || true
    # Use clean2 only if it has actual content
    if [ -f "$TMP/clean2.png" ]; then
      local colors
      colors=$(magick "$TMP/clean2.png" -format "%k" info: 2>/dev/null) || colors=0
      if [ "$colors" -ge 4 ]; then
        mv "$TMP/clean2.png" "$TMP/clean.png"
      fi
    fi
  fi

  # Step 4: Resize to 128x128, centering (allow upscale for tiny sprites)
  magick "$TMP/clean.png" -resize 128x128 -background none -gravity center -extent 128x128 "$dest"

  local size
  size=$(stat -f%z "$dest")
  echo "    -> $dest ($size bytes)"
}

echo "=== Fixing Placeholder Sprites ==="
echo ""

# ──────────────────────────────────────────────────────
# DIABLO (55535) - 6798x18841, gray bg, ~340x470 per cell
# Front-facing idle frame: first column, first row
# ──────────────────────────────────────────────────────
echo "--- Diablo (source: 55535.png, 6798x18841) ---"

# Back up originals
for f in diablo pandemonium_diablo uber_diablo; do
  if [ -f "$BOSSES/$f.png" ]; then
    cp "$BOSSES/$f.png" "$BACKUP/${f}_boss.png" 2>/dev/null || true
  fi
done

# The sheet has large cells. First frame top-left (facing south) starts after a
# small header. Grab the first frame roughly at 0,20 size ~340x450
extract_frame "$RAW/55535.png" "$BOSSES/diablo.png" "diablo" \
  "340x450+0+20" "#C0C0C0" 18

# Pandemonium Diablo / Uber Diablo get the same sprite (they're Diablo variants)
cp "$BOSSES/diablo.png" "$BOSSES/pandemonium_diablo.png"
cp "$BOSSES/diablo.png" "$BOSSES/uber_diablo.png"
echo "    -> Copied to pandemonium_diablo.png, uber_diablo.png"

# ──────────────────────────────────────────────────────
# FALLEN (92829) - 5659x6134, gray/teal bg, tiny sprites ~30px
# Used for: rakanishu, colenzo_the_annihilator, fire_eye bosses
# Also re-do the enemy fallen.png
# ──────────────────────────────────────────────────────
echo ""
echo "--- Fallen-based (source: 92829.png, 5659x6134) ---"

# The cells are about 190x130 each with teal borders.
# The sprites are tiny (~30px) but we can upscale them.
# Row 1 is "attack 1" facing south. Let's grab a frame.
# First cell after teal border: roughly 5,20 size 185x125

for f in rakanishu colenzo_the_annihilator fire_eye; do
  [ -f "$BOSSES/$f.png" ] && cp "$BOSSES/$f.png" "$BACKUP/${f}_boss.png" 2>/dev/null || true
done
[ -f "$ENEMIES/fallen.png" ] && cp "$ENEMIES/fallen.png" "$BACKUP/fallen_enemy_prev.png" 2>/dev/null || true

extract_frame "$RAW/92829.png" "$ENEMIES/fallen.png" "fallen (enemy)" \
  "185x125+5+20" "#C0C0C0" 20

# For bosses, use slightly different frames for variety
extract_frame "$RAW/92829.png" "$BOSSES/rakanishu.png" "rakanishu" \
  "185x125+195+20" "#C0C0C0" 20

extract_frame "$RAW/92829.png" "$BOSSES/colenzo_the_annihilator.png" "colenzo_the_annihilator" \
  "185x125+385+20" "#C0C0C0" 20

extract_frame "$RAW/92829.png" "$BOSSES/fire_eye.png" "fire_eye" \
  "185x125+575+20" "#C0C0C0" 20

# ──────────────────────────────────────────────────────
# ZOMBIE (88431) - 7279x4880, gray/teal bg, small sprites ~40px
# Used for: corpsefire boss
# ──────────────────────────────────────────────────────
echo ""
echo "--- Zombie-based (source: 88431.png, 7279x4880) ---"

[ -f "$BOSSES/corpsefire.png" ] && cp "$BOSSES/corpsefire.png" "$BACKUP/corpsefire_boss.png" 2>/dev/null || true
[ -f "$ENEMIES/zombie.png" ] && cp "$ENEMIES/zombie.png" "$BACKUP/zombie_enemy_prev.png" 2>/dev/null || true

# Zombie cells are roughly 200x170 with the sprite ~40px in center
extract_frame "$RAW/88431.png" "$ENEMIES/zombie.png" "zombie (enemy)" \
  "200x170+5+20" "#C0C0C0" 20

extract_frame "$RAW/88431.png" "$BOSSES/corpsefire.png" "corpsefire" \
  "200x170+210+20" "#C0C0C0" 20

# ──────────────────────────────────────────────────────
# SKELETON (92815) - 2361x2424, pink bg, ~100px sprites
# Used for: bonebreaker boss
# ──────────────────────────────────────────────────────
echo ""
echo "--- Skeleton-based (source: 92815.png, 2361x2424) ---"

[ -f "$BOSSES/bonebreaker.png" ] && cp "$BOSSES/bonebreaker.png" "$BACKUP/bonebreaker_boss.png" 2>/dev/null || true

# Pink bg (#FF00FF or similar), cells ~120x120 with teal borders
# First row is "attack 1" facing south
extract_frame "$RAW/92815.png" "$BOSSES/bonebreaker.png" "bonebreaker" \
  "120x120+5+20" "#FF00FF" 15

# ──────────────────────────────────────────────────────
# WENDIGO (64031) - 5949x2444, gray bg, ~80px sprites
# Used for: treehead_woodfist boss
# ──────────────────────────────────────────────────────
echo ""
echo "--- Wendigo-based (source: 64031.png, 5949x2444) ---"

[ -f "$BOSSES/treehead_woodfist.png" ] && cp "$BOSSES/treehead_woodfist.png" "$BACKUP/treehead_boss.png" 2>/dev/null || true

# Wendigo has a grid on gray bg with decent sized sprites
extract_frame "$RAW/64031.png" "$BOSSES/treehead_woodfist.png" "treehead_woodfist" \
  "160x160+5+5" "#C0C0C0" 18

echo ""
echo "=== Done! ==="
echo "Originals backed up to: $BACKUP"
