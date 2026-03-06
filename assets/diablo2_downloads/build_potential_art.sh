#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORG_DIR="$ROOT_DIR/organized"
OUT_DIR="$ROOT_DIR/potential_art"
SPRITE_MAP="$ROOT_DIR/spriters_asset_name_map.tsv"
SOUND_MAP="$ROOT_DIR/sounds_asset_name_map.tsv"
EXTERNAL_OGA_DIR="$ROOT_DIR/external_oga/downloads"
MANIFEST="$OUT_DIR/manifests/selected_assets.csv"
SUMMARY="$OUT_DIR/manifests/category_summary.txt"

sanitize_name() {
  local s="$1"
  s="${s//\&/ and }"
  s="${s//\'/}"
  s="${s//\(/_}"
  s="${s//\)/_}"
  s="${s//\//_}"
  s="${s//,/}"
  s="${s// /_}"
  s="${s//__/_}"
  s="${s//__/_}"
  printf '%s' "$s"
}

csv_escape() {
  local s="$1"
  s=${s//\"/\"\"}
  printf '%s' "$s"
}

category_match() {
  local name_l="$1"
  local id="$2"
  local cats=()

  if [[ "$name_l" =~ (amazon|assassin|barbarian|druid|necromancer|paladin|sorceress) ]]; then
    cats+=("classes")
  fi

  if [[ "$name_l" =~ (griswold|natalya|tal[[:space:]]*rasha|immortal[[:space:]]*king|mavina|trang|aldur) ]]; then
    cats+=("armor_sets")
  fi

  if [[ "$name_l" =~ (andariel|duriel|mephisto|diablo|baal|radament|summoner|nihlathak|izual|blood[[:space:]]*raven|countess|coldworm|council) ]]; then
    cats+=("bosses")
  fi

  if [[ "$name_l" =~ (fallen|fetish|golem|skeleton|zombie|demon|mummy|maggot|spider|bat|vampire|wraith|ghoul|hulk|shaman|tentacle|defiler|thrall|goatman|scarab|balrog|imp|vulture|baboon|rogue|zealot|mosquito|regurgitator|beetle|wolf|beast) ]]; then
    cats+=("monsters_random")
  fi

  if [[ "$name_l" =~ (weapon|sword|axe|mace|hammer|staff|bow|crossbow|spear|halberd|scythe|poleaxe|pole[[:space:]]*axe|javelin|dagger|wand|maul|club|flail) || "$id" == "420313" ]]; then
    cats+=("items/weapons")
  fi

  if [[ "$name_l" =~ (armor|shield|helm|helmet|shoulder|plate|mail|robe|coif|circlet) ]]; then
    cats+=("items/armor")
  fi

  if [[ "$name_l" =~ (potion|health|mana|rejuvenation|elixir|antidote|thawing|stamina|items[[:space:]]*and[[:space:]]*objects|items[[:space:]]*&[[:space:]]*objects) || "$id" == "420305" ]]; then
    cats+=("items/potions")
  fi

  if [[ "$name_l" =~ (rune|runes|items[[:space:]]*and[[:space:]]*objects|items[[:space:]]*&[[:space:]]*objects) || "$id" == "420305" ]]; then
    cats+=("items/runes")
  fi

  if [[ ${#cats[@]} -gt 0 ]]; then
    printf '%s\n' "${cats[@]}" | awk '!seen[$0]++'
  fi
}

copy_sprite_asset() {
  local id="$1"
  local name="$2"
  local categories="$3"
  local safe_name
  safe_name="$(sanitize_name "$name")"

  local raw_file=""
  for ext in png gif jpg jpeg; do
    if [[ -f "$ORG_DIR/sprites/raw/spriters/$id.$ext" ]]; then
      raw_file="$ORG_DIR/sprites/raw/spriters/$id.$ext"
      break
    fi
  done

  local extracted_dir=""
  if [[ -d "$ORG_DIR/sprites/extracted/$id" ]]; then
    extracted_dir="$ORG_DIR/sprites/extracted/$id"
  fi

  [[ -z "$raw_file" && -z "$extracted_dir" ]] && return

  while IFS= read -r category; do
    [[ -z "$category" ]] && continue
    local dest="$OUT_DIR/$category/sprites/${id}__${safe_name}"
    mkdir -p "$dest"

    local copied_files=0
    if [[ -n "$raw_file" ]]; then
      cp -f "$raw_file" "$dest/"
      copied_files=$((copied_files + 1))
      printf '"%s","%s",%s,"%s","%s","%s"\n' \
        "$(csv_escape "$category")" \
        "sprite_raw" \
        "$id" \
        "$(csv_escape "$name")" \
        "$(csv_escape "${raw_file#$ROOT_DIR/}")" \
        "$(csv_escape "${dest#$ROOT_DIR/}")" >> "$MANIFEST"
    fi

    if [[ -n "$extracted_dir" ]]; then
      cp -R "$extracted_dir" "$dest/extracted"
      local extracted_count
      extracted_count="$(find "$extracted_dir" -type f | wc -l | tr -d ' ')"
      printf '"%s","%s",%s,"%s","%s","%s"\n' \
        "$(csv_escape "$category")" \
        "sprite_extracted" \
        "$id" \
        "$(csv_escape "$name")" \
        "$(csv_escape "${extracted_dir#$ROOT_DIR/}")" \
        "$(csv_escape "${dest#$ROOT_DIR/}")" >> "$MANIFEST"
      copied_files=$((copied_files + extracted_count))
    fi
  done <<< "$categories"
}

copy_sound_asset() {
  local id="$1"
  local name="$2"
  local categories="$3"
  local safe_name
  safe_name="$(sanitize_name "$name")"

  local src_dir="$ORG_DIR/sounds/extracted/$id"
  [[ ! -d "$src_dir" ]] && return

  while IFS= read -r category; do
    [[ -z "$category" ]] && continue
    local dest="$OUT_DIR/$category/sounds/${id}__${safe_name}"
    mkdir -p "$dest"
    cp -R "$src_dir"/. "$dest/"

    printf '"%s","%s",%s,"%s","%s","%s"\n' \
      "$(csv_escape "$category")" \
      "sound_extracted" \
      "$id" \
      "$(csv_escape "$name")" \
      "$(csv_escape "${src_dir#$ROOT_DIR/}")" \
      "$(csv_escape "${dest#$ROOT_DIR/}")" >> "$MANIFEST"
  done <<< "$categories"
}

import_external_oga_sprites() {
  [[ ! -d "$EXTERNAL_OGA_DIR" ]] && return

  if [[ -f "$EXTERNAL_OGA_DIR/kenney_runepack.zip" ]]; then
    local dest="$OUT_DIR/items/runes/sprites/oga_rune_pack"
    mkdir -p "$dest"
    unzip -oq "$EXTERNAL_OGA_DIR/kenney_runepack.zip" -d "$dest"
    printf '"%s","%s","%s","%s","%s","%s"\n' \
      "items/runes" \
      "external_pack" \
      "oga" \
      "Kenney Rune Pack" \
      "external_oga/downloads/kenney_runepack.zip" \
      "potential_art/items/runes/sprites/oga_rune_pack" >> "$MANIFEST"
  fi

  if compgen -G "$EXTERNAL_OGA_DIR/potion-*.zip" > /dev/null; then
    local base_dir="$OUT_DIR/items/potions/sprites/oga_potion_icons"
    mkdir -p "$base_dir"
    for zip_file in "$EXTERNAL_OGA_DIR"/potion-*.zip; do
      local zip_name
      zip_name="$(basename "$zip_file" .zip)"
      local dest="$base_dir/$zip_name"
      mkdir -p "$dest"
      unzip -oq "$zip_file" -d "$dest"
      printf '"%s","%s","%s","%s","%s","%s"\n' \
        "items/potions" \
        "external_pack" \
        "oga" \
        "$zip_name" \
        "external_oga/downloads/$(basename "$zip_file")" \
        "potential_art/items/potions/sprites/oga_potion_icons/$zip_name" >> "$MANIFEST"
    done
  fi

  if [[ -f "$EXTERNAL_OGA_DIR/16x16_weapons_rpg_icons.zip" ]]; then
    local dest="$OUT_DIR/items/weapons/sprites/oga_weapon_icons"
    mkdir -p "$dest"
    unzip -oq "$EXTERNAL_OGA_DIR/16x16_weapons_rpg_icons.zip" -d "$dest"
    printf '"%s","%s","%s","%s","%s","%s"\n' \
      "items/weapons" \
      "external_pack" \
      "oga" \
      "16x16 Weapons RPG Icons" \
      "external_oga/downloads/16x16_weapons_rpg_icons.zip" \
      "potential_art/items/weapons/sprites/oga_weapon_icons" >> "$MANIFEST"
  fi

  if [[ -f "$EXTERNAL_OGA_DIR/items_paletted.png" ]]; then
    local armor_dest="$OUT_DIR/items/armor/sprites/oga_items_armor_health_ammo"
    local potion_dest="$OUT_DIR/items/potions/sprites/oga_items_armor_health_ammo"
    mkdir -p "$armor_dest" "$potion_dest"
    cp -f "$EXTERNAL_OGA_DIR/items_paletted.png" "$armor_dest/"
    cp -f "$EXTERNAL_OGA_DIR/items_paletted.png" "$potion_dest/"
    printf '"%s","%s","%s","%s","%s","%s"\n' \
      "items/armor" \
      "external_sheet" \
      "oga" \
      "Items Armor Health Ammo" \
      "external_oga/downloads/items_paletted.png" \
      "potential_art/items/armor/sprites/oga_items_armor_health_ammo/items_paletted.png" >> "$MANIFEST"
    printf '"%s","%s","%s","%s","%s","%s"\n' \
      "items/potions" \
      "external_sheet" \
      "oga" \
      "Items Armor Health Ammo" \
      "external_oga/downloads/items_paletted.png" \
      "potential_art/items/potions/sprites/oga_items_armor_health_ammo/items_paletted.png" >> "$MANIFEST"
  fi
}

echo "Rebuilding $OUT_DIR"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/manifests"

printf 'category,asset_type,asset_id,asset_name,source_path,destination_path\n' > "$MANIFEST"

echo "Selecting sprite assets"
while IFS=$'\t' read -r id name; do
  [[ -z "${id:-}" || -z "${name:-}" ]] && continue
  [[ ! "$id" =~ ^[0-9]+$ ]] && continue

  name_l="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
  cats="$(category_match "$name_l" "$id" || true)"
  [[ -z "$cats" ]] && continue

  copy_sprite_asset "$id" "$name" "$cats"
done < "$SPRITE_MAP"

echo "Selecting sound assets"
while IFS=$'\t' read -r id name; do
  [[ -z "${id:-}" || -z "${name:-}" ]] && continue
  [[ ! "$id" =~ ^[0-9]+$ ]] && continue

  name_l="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
  cats="$(category_match "$name_l" "$id" || true)"
  [[ -z "$cats" ]] && continue

  copy_sound_asset "$id" "$name" "$cats"
done < "$SOUND_MAP"

echo "Importing external OGA sprite packs"
import_external_oga_sprites

echo "Writing summary"
{
  echo "Potential Art Summary"
  echo "====================="
  echo ""
  echo "Created: $(date)"
  echo ""
  for category in classes armor_sets bosses monsters_random items/weapons items/armor items/potions items/runes; do
    sprite_count=0
    sound_count=0
    [[ -d "$OUT_DIR/$category/sprites" ]] && sprite_count="$(find "$OUT_DIR/$category/sprites" -type f | wc -l | tr -d ' ')"
    [[ -d "$OUT_DIR/$category/sounds" ]] && sound_count="$(find "$OUT_DIR/$category/sounds" -type f | wc -l | tr -d ' ')"
    echo "$category: sprites=$sprite_count sounds=$sound_count"
  done
  echo ""
  echo "Manifest: ${MANIFEST#$ROOT_DIR/}"
} > "$SUMMARY"

echo "Done"
