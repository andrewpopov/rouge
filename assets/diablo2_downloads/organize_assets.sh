#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORGANIZED_DIR="$ROOT_DIR/organized"
SPRITES_DIR="$ORGANIZED_DIR/sprites"
SOUNDS_DIR="$ORGANIZED_DIR/sounds"
PACKS_DIR="$ORGANIZED_DIR/packs"
INDEX_CSV="$ORGANIZED_DIR/index.csv"

csv_escape() {
  local s="$1"
  s=${s//\"/\"\"}
  printf '%s' "$s"
}

extract_zip_to_dir() {
  local zip_file="$1"
  local out_dir="$2"
  mkdir -p "$out_dir"
  unzip -oq "$zip_file" -d "$out_dir"
}

echo "Resetting $ORGANIZED_DIR"
rm -rf "$ORGANIZED_DIR"
mkdir -p \
  "$SPRITES_DIR/raw/spriters" \
  "$SPRITES_DIR/raw/opengameart" \
  "$SPRITES_DIR/extracted" \
  "$SOUNDS_DIR/extracted" \
  "$PACKS_DIR/archives" \
  "$PACKS_DIR/extracted/opengameart" \
  "$PACKS_DIR/extracted/opendiablo2"

echo "Copying direct sprite images"
find "$ROOT_DIR/spriters/sprites" -maxdepth 1 -type f \( -name '*.png' -o -name '*.gif' -o -name '*.jpg' -o -name '*.jpeg' \) -print0 \
  | xargs -0 -I {} cp -f {} "$SPRITES_DIR/raw/spriters/"

find "$ROOT_DIR/opengameart" -maxdepth 1 -type f \( -name '*.png' -o -name '*.gif' -o -name '*.jpg' -o -name '*.jpeg' \) -print0 \
  | xargs -0 -I {} cp -f {} "$SPRITES_DIR/raw/opengameart/"

echo "Extracting sprite zip archives"
find "$ROOT_DIR/spriters/sprites" -maxdepth 1 -type f -name '*.zip' -print0 \
  | while IFS= read -r -d '' zip_file; do
      zip_name="$(basename "$zip_file" .zip)"
      extract_zip_to_dir "$zip_file" "$SPRITES_DIR/extracted/$zip_name"
    done

echo "Extracting sound zip archives"
find "$ROOT_DIR/spriters/sounds" -maxdepth 1 -type f -name '*.zip' -print0 \
  | while IFS= read -r -d '' zip_file; do
      zip_name="$(basename "$zip_file" .zip)"
      extract_zip_to_dir "$zip_file" "$SOUNDS_DIR/extracted/$zip_name"
    done

echo "Collecting pack archives"
find "$ROOT_DIR/opengameart" -maxdepth 1 -type f -name '*.zip' -print0 \
  | while IFS= read -r -d '' zip_file; do
      cp -f "$zip_file" "$PACKS_DIR/archives/"
      zip_name="$(basename "$zip_file" .zip)"
      extract_zip_to_dir "$zip_file" "$PACKS_DIR/extracted/opengameart/$zip_name"
    done

if [[ -f "$ROOT_DIR/https___github.com_OpenDiablo2_OpenDiablo2_archive_refs_heads_master.zip" ]]; then
  cp -f "$ROOT_DIR/https___github.com_OpenDiablo2_OpenDiablo2_archive_refs_heads_master.zip" "$PACKS_DIR/archives/opendiablo2_master.zip"
  extract_zip_to_dir "$ROOT_DIR/https___github.com_OpenDiablo2_OpenDiablo2_archive_refs_heads_master.zip" "$PACKS_DIR/extracted/opendiablo2/OpenDiablo2-master"
fi

if [[ -f "$ROOT_DIR/https___raw.githubusercontent.com_OpenDiablo2_OpenDiablo2_master_docs_mpq.md" ]]; then
  cp -f "$ROOT_DIR/https___raw.githubusercontent.com_OpenDiablo2_OpenDiablo2_master_docs_mpq.md" "$PACKS_DIR/extracted/opendiablo2/mpq.md"
fi

echo "Generating CSV index: $INDEX_CSV"
printf 'category,source,relative_path,size_bytes,sha256,mime_type\n' > "$INDEX_CSV"

find "$ORGANIZED_DIR" -type f ! -path "$INDEX_CSV" -print0 \
  | while IFS= read -r -d '' file_path; do
      rel_path="${file_path#$ORGANIZED_DIR/}"
      case "$rel_path" in
        sprites/raw/spriters/*)
          category="sprite"
          source="spriters-direct"
          ;;
        sprites/raw/opengameart/*)
          category="sprite"
          source="opengameart-direct"
          ;;
        sprites/extracted/*)
          category="sprite"
          source="spriters-zip"
          ;;
        sounds/extracted/*)
          category="sound"
          source="sounds-zip"
          ;;
        packs/extracted/opengameart/*)
          category="pack"
          source="opengameart-zip"
          ;;
        packs/extracted/opendiablo2/*)
          category="pack"
          source="opendiablo2"
          ;;
        packs/archives/*)
          category="pack"
          source="archives"
          ;;
        *)
          category="other"
          source="unknown"
          ;;
      esac

      size_bytes="$(stat -f%z "$file_path")"
      sha256="$(shasum -a 256 "$file_path" | awk '{print $1}')"
      mime_type="$(file -b --mime-type "$file_path")"

      printf '"%s","%s","%s",%s,"%s","%s"\n' \
        "$(csv_escape "$category")" \
        "$(csv_escape "$source")" \
        "$(csv_escape "$rel_path")" \
        "$size_bytes" \
        "$(csv_escape "$sha256")" \
        "$(csv_escape "$mime_type")" \
        >> "$INDEX_CSV"
    done

echo "Done"
