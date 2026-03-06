#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CURATED_DIR="$ROOT_DIR/assets/curated/themes/diablo-inspired/icons"
SOURCES_PATH="$CURATED_DIR/SOURCES.txt"
AUTHORS_PATH="$CURATED_DIR/AUTHORS.txt"

mkdir -p "$CURATED_DIR/cards" "$CURATED_DIR/enemies" "$CURATED_DIR/ui"
: > "$SOURCES_PATH"
: > "$AUTHORS_PATH"

find_icon() {
  local icon_name="$1"
  shift
  local tag
  for tag in "$@"; do
    local tag_dir="$ROOT_DIR/assets/raw/game-icons/$tag/icons/000000/transparent/1x1"
    if [[ ! -d "$tag_dir" ]]; then
      continue
    fi
    local match
    match="$(find "$tag_dir" -type f -name "${icon_name}.svg" | head -n 1 || true)"
    if [[ -n "$match" ]]; then
      printf "%s\n" "$match"
      return 0
    fi
  done
  return 1
}

copy_icon() {
  local icon_name="$1"
  local destination_rel="$2"
  shift 2
  local source
  source="$(find_icon "$icon_name" "$@")" || {
    echo "Missing icon: $icon_name (searched tags: $*)"
    exit 1
  }
  cp "$source" "$CURATED_DIR/$destination_rel"
  printf "%s <= %s\n" "$destination_rel" "${source#$ROOT_DIR/}" >> "$SOURCES_PATH"
  printf "%s\n" "$(basename "$(dirname "$source")")" >> "$AUTHORS_PATH"
}

echo "Copying dark-fantasy card icons..."
copy_icon "ember-shot" "cards/01_ember-shot.svg" fire weapon
copy_icon "poison-bottle" "cards/02_poison-bottle.svg" poison
copy_icon "broadsword" "cards/03_broadsword.svg" blade weapon
copy_icon "crescent-blade" "cards/04_crescent-blade.svg" blade
copy_icon "life-tap" "cards/05_life-tap.svg" blood vampire
copy_icon "burning-skull" "cards/06_burning-skull.svg" skull fire
copy_icon "chalice-drops" "cards/07_chalice-drops.svg" vampire blood
copy_icon "gauntlet" "cards/08_gauntlet.svg" armor
copy_icon "candle-holder" "cards/09_candle-holder.svg" fire
copy_icon "burning-embers" "cards/10_burning-embers.svg" fire
copy_icon "blast" "cards/11_blast.svg" fire weapon
copy_icon "snake-bite" "cards/12_snake-bite.svg" poison
copy_icon "armor-upgrade" "cards/13_armor-upgrade.svg" armor
copy_icon "armor-downgrade" "cards/14_armor-downgrade.svg" armor
copy_icon "ghost" "cards/15_ghost.svg" death
copy_icon "crypt-entrance" "cards/16_crypt-entrance.svg" vampire death
copy_icon "grim-reaper" "cards/17_grim-reaper.svg" death
copy_icon "chest-armor" "cards/18_chest-armor.svg" armor
copy_icon "fangs" "cards/19_fangs.svg" vampire
copy_icon "bone-mace" "cards/20_bone-mace.svg" weapon skull
copy_icon "cultist" "cards/21_cultist.svg" medieval-fantasy mask
copy_icon "graveyard" "cards/22_graveyard.svg" death
copy_icon "dragon-breath" "cards/23_dragon-breath.svg" fire
copy_icon "burning-eye" "cards/24_burning-eye.svg" fire blood

echo "Copying dark-fantasy enemy icons..."
copy_icon "diablo-skull" "enemies/01_diablo-skull.svg" skull medieval-fantasy
copy_icon "cultist" "enemies/02_cultist.svg" medieval-fantasy mask
copy_icon "warlock-hood" "enemies/03_warlock-hood.svg" medieval-fantasy death
copy_icon "ogre" "enemies/04_ogre.svg" medieval-fantasy
copy_icon "troll" "enemies/05_troll.svg" medieval-fantasy
copy_icon "vampire-dracula" "enemies/06_vampire-dracula.svg" medieval-fantasy vampire
copy_icon "shambling-zombie" "enemies/07_shambling-zombie.svg" zombie
copy_icon "grim-reaper" "enemies/08_grim-reaper.svg" death
copy_icon "devil-mask" "enemies/09_devil-mask.svg" mask
copy_icon "death-skull" "enemies/10_death-skull.svg" skull death
copy_icon "dragon-head" "enemies/11_dragon-head.svg" medieval-fantasy
copy_icon "crowned-skull" "enemies/12_crowned-skull.svg" skull medieval-fantasy

echo "Copying dark-fantasy UI icons..."
copy_icon "heart-drop" "ui/hp_heart-drop.svg" blood
copy_icon "chest-armor" "ui/block_chest-armor.svg" armor
copy_icon "chalice-drops" "ui/energy_chalice-drops.svg" vampire blood
copy_icon "burning-eye" "ui/heat_burning-eye.svg" fire blood
copy_icon "grim-reaper" "ui/turn_grim-reaper.svg" death
copy_icon "death-skull" "ui/alert_death-skull.svg" skull death
copy_icon "crypt-entrance" "ui/path_crypt-entrance.svg" vampire death
copy_icon "candle-holder" "ui/info_candle-holder.svg" fire

sort -u "$AUTHORS_PATH" -o "$AUTHORS_PATH"

echo "Dark-fantasy curated icons written to: $CURATED_DIR"
