#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/assets/source"
KENNEY_DIR="$SOURCE_DIR/kenney"
GAME_ICONS_DIR="$SOURCE_DIR/game-icons"
RAW_DIR="$ROOT_DIR/assets/raw"

mkdir -p "$KENNEY_DIR" "$GAME_ICONS_DIR" "$RAW_DIR"

echo "Downloading Kenney packs..."
curl -L --fail --progress-bar \
  -o "$KENNEY_DIR/ui-pack-sci-fi.zip" \
  "https://kenney.nl/media/pages/assets/ui-pack-sci-fi/d83f166279-1724181109/kenney_ui-pack-space-expansion.zip"

curl -L --fail --progress-bar \
  -o "$KENNEY_DIR/ui-pack-adventure.zip" \
  "https://kenney.nl/media/pages/assets/ui-pack-adventure/a9a6ec7d59-1723597274/kenney_ui-pack-adventure.zip"

curl -L --fail --progress-bar \
  -o "$KENNEY_DIR/boardgame-pack.zip" \
  "https://kenney.nl/media/pages/assets/boardgame-pack/f1403c350d-1677667644/kenney_boardgame-pack.zip"

echo "Downloading Game-icons tags via Playwright..."
node "$ROOT_DIR/scripts/download-game-icons.js" steampunk machine smoke light energy

echo "Extracting archives..."
mkdir -p "$RAW_DIR/kenney/ui-pack-sci-fi" \
  "$RAW_DIR/kenney/ui-pack-adventure" \
  "$RAW_DIR/kenney/boardgame-pack" \
  "$RAW_DIR/game-icons/steampunk" \
  "$RAW_DIR/game-icons/machine" \
  "$RAW_DIR/game-icons/smoke" \
  "$RAW_DIR/game-icons/light" \
  "$RAW_DIR/game-icons/energy"

unzip -qo "$KENNEY_DIR/ui-pack-sci-fi.zip" -d "$RAW_DIR/kenney/ui-pack-sci-fi"
unzip -qo "$KENNEY_DIR/ui-pack-adventure.zip" -d "$RAW_DIR/kenney/ui-pack-adventure"
unzip -qo "$KENNEY_DIR/boardgame-pack.zip" -d "$RAW_DIR/kenney/boardgame-pack"

unzip -qo "$GAME_ICONS_DIR/steampunk.svg.zip" -d "$RAW_DIR/game-icons/steampunk"
unzip -qo "$GAME_ICONS_DIR/machine.svg.zip" -d "$RAW_DIR/game-icons/machine"
unzip -qo "$GAME_ICONS_DIR/smoke.svg.zip" -d "$RAW_DIR/game-icons/smoke"
unzip -qo "$GAME_ICONS_DIR/light.svg.zip" -d "$RAW_DIR/game-icons/light"
unzip -qo "$GAME_ICONS_DIR/energy.svg.zip" -d "$RAW_DIR/game-icons/energy"

echo "Done. Assets are in:"
echo "  - $SOURCE_DIR"
echo "  - $RAW_DIR"
