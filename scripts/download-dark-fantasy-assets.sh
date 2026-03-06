#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GAME_ICONS_DIR="$ROOT_DIR/assets/source/game-icons"
RAW_DIR="$ROOT_DIR/assets/raw/game-icons"

TAGS=(
  medieval-fantasy
  weapon
  blade
  skull
  blood
  fire
  poison
  armor
  zombie
  vampire
  death
  mask
)

mkdir -p "$GAME_ICONS_DIR" "$RAW_DIR"

echo "Downloading dark-fantasy Game-icons tags via Playwright..."
node "$ROOT_DIR/scripts/download-game-icons.js" "${TAGS[@]}"

echo "Extracting downloaded archives..."
for tag in "${TAGS[@]}"; do
  zip_path="$GAME_ICONS_DIR/${tag}.svg.zip"
  out_dir="$RAW_DIR/$tag"
  mkdir -p "$out_dir"
  unzip -qo "$zip_path" -d "$out_dir"
done

echo "Done. Dark-fantasy assets are in:"
echo "  - $GAME_ICONS_DIR"
echo "  - $RAW_DIR"
