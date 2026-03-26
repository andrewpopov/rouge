#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

polish_dir() {
  local dir="$1"

  find "$dir" -maxdepth 1 -type f -name '*.png' | while read -r src; do
    local tmp="$TMP_DIR/$(basename "$src")"

    # Repack each sprite so the visible silhouette fills more of the portrait
    # slot without changing the final canvas size expected by the combat UI.
    magick "$src" \
      -trim +repage \
      -resize 120x120 \
      -background none \
      -gravity south \
      -extent 128x128 \
      "$tmp"

    mv "$tmp" "$src"
  done
}

polish_dir "$ROOT/assets/curated/sprites/enemies"
polish_dir "$ROOT/assets/curated/sprites/bosses"
