#!/bin/bash
# Download Diablo 2 inventory item sprites from diablo2.diablowiki.net
# Source: https://diablo2.diablowiki.net
set -e

BASE="https://diablo2.diablowiki.net"
OUT="assets/curated/sprites/items"
mkdir -p "$OUT"

download() {
  local name="$1"
  local path="$2"
  local url="${BASE}${path}"
  local dest="${OUT}/${name}.gif"
  if [ -f "$dest" ]; then
    echo "  skip $name (exists)"
    return
  fi
  echo "  GET  $name <- $path"
  curl -sL "$url" -o "$dest"
  if [ ! -s "$dest" ]; then
    echo "  WARN $name is empty, removing"
    rm -f "$dest"
  fi
}

echo "=== Swords ==="
download "short_sword"    "/images/6/67/Sword-short_sword.gif"
download "scimitar"       "/images/d/dd/Sword-scimitar.gif"
download "sabre"          "/images/4/47/Sword-sabre.gif"
download "long_sword"     "/images/3/30/Sword-long.gif"
download "falchion"       "/images/7/7c/Sword-falchion.gif"
download "crystal_sword"  "/images/f/f8/Sword-crystal.gif"
download "bastard_sword"  "/images/7/7a/Sword-bastard_sword.gif"
download "broad_sword"    "/images/c/c7/Sword-broad_sword.gif"
download "war_sword"      "/images/2/28/Sword-war_sword.gif"
download "rune_sword"     "/images/3/30/Sword-long.gif"
download "legend_sword"   "/images/e/e9/Sword-2h.gif"
download "zweihander"     "/images/0/0b/Sword-2h-greater.gif"
download "balrog_blade"   "/images/3/38/Sword-giant_sword.gif"
download "colossus_blade" "/images/f/f6/Sword-great.gif"

echo "=== Maces ==="
download "mace"           "/images/a/a4/Blunt-mace.gif"
download "war_hammer"     "/images/f/f6/Blunt-war-hammer.gif"

echo "=== Polearms ==="
download "partizan"       "/images/d/da/Polearm-poleaxe.gif"
download "grim_scythe"    "/images/e/e6/Polearm-scythe-war.gif"

echo "=== Wands ==="
download "wand"           "/images/6/60/Blunt-wand.gif"
download "yew_wand"       "/images/b/b9/Blunt-yew-wand.gif"
download "bone_wand"      "/images/7/7f/Blunt-wand-bone.gif"
download "lich_wand"      "/images/a/a8/Blunt-wand-grim.gif"

echo "=== Staves ==="
download "battle_staff"   "/images/8/88/Staff-battle_staff.gif"
download "gnarled_staff"  "/images/8/8b/Staff-gnarled_staff.gif"
download "war_staff"      "/images/3/3d/Staff-war_staff.gif"

echo "=== Body Armor ==="
download "quilted_armor"    "/images/b/be/Armor-quilted.gif"
download "breast_plate"     "/images/0/0a/Armor_breastplate.gif"
download "leather_armor"    "/images/b/b6/Armor-leather.gif"
download "scale_mail"       "/images/0/0f/Mail-scale.gif"
download "chain_mail"       "/images/6/62/Mail-chain.gif"
download "ring_mail"        "/images/f/f4/Armor-ringmail.gif"
download "splint_mail"      "/images/0/07/Mail-splint.gif"
download "plate_mail"       "/images/0/02/Mail-plate.gif"
download "field_plate"      "/images/2/20/Armor-field-plate.gif"
download "gothic_plate"     "/images/8/84/Plate-gothic.gif"
download "light_plate"      "/images/a/ab/Plate-light-field.gif"
download "ghost_armor"      "/images/5/54/Armor_hard-leather.gif"
download "mage_plate"       "/images/4/44/Armor-studded.gif"
download "ancient_armor"    "/images/c/ce/Armor-ancient-plate.gif"
download "ornate_plate"     "/images/8/84/Plate-gothic.gif"
download "boneweave"        "/images/0/07/Mail-splint.gif"
download "chaos_armor"      "/images/2/20/Armor-field-plate.gif"
download "hellforge_plate"  "/images/0/0a/Armor-full-plate.gif"
download "archon_plate"     "/images/c/ce/Armor-ancient-plate.gif"
download "full_plate_mail"  "/images/0/0a/Armor-full-plate.gif"

echo "=== Helms ==="
download "cap"            "/images/3/3c/Headgear-cap.gif"
download "skull_cap"      "/images/7/71/Headgear-skull-cap.gif"
download "helm"           "/images/8/8b/Helm-helm.gif"
download "great_helm"     "/images/b/bc/Headgear-great_helm.gif"
download "crown"          "/images/0/00/Helm-crown.gif"

echo "=== Shields ==="
download "buckler"        "/images/d/dc/Shield-buckler.gif"
download "small_shield"   "/images/f/f9/Shield-small.gif"
download "large_shield"   "/images/6/65/Shield-large_shield.gif"
download "tower_shield"   "/images/1/1f/Shield-tower.GIF"
download "monarch"        "/images/d/d4/Shield-kite.GIF"

echo "=== Gloves ==="
download "leather_gloves" "/images/9/9e/Gloves-leather.gif"
download "heavy_gloves"   "/images/1/1c/Gloves-heavy-leather.gif"
download "chain_gloves"   "/images/4/4b/Gloves-chain.gif"
download "gauntlets"      "/images/6/6d/Gloves-gauntlets.GIF"

echo "=== Boots ==="
download "boots"          "/images/d/d9/Boots-boots.gif"
download "heavy_boots"    "/images/6/60/Boots-heavy.gif"
download "chain_boots"    "/images/b/b9/Boots-chain.gif"
download "war_boots"      "/images/5/55/Boots-greaves.GIF"

echo "=== Belts ==="
download "sash"           "/images/4/48/Belt-sash.gif"
download "light_belt"     "/images/f/f4/Belt-light_belt.gif"
download "heavy_belt"     "/images/4/4b/Belt-heavy.gif"
download "war_belt"       "/images/8/88/Belt-plated.GIF"

echo "=== Rings ==="
download "ring"           "/images/0/00/Ring.gif"
download "coral_ring"     "/images/7/7e/Ring-gold-red-gem.gif"
download "jade_ring"      "/images/1/1f/Ring-coil-purple-orb.gif"
download "diamond_ring"   "/images/7/7e/Ring-gold-red-gem.gif"

echo "=== Amulets ==="
download "amulet"             "/images/a/ae/Amulet1.gif"
download "jade_amulet"        "/images/d/d6/Amulet2.gif"
download "prismatic_amulet"   "/images/e/ef/Amulet-gold-cross.gif"
download "highlords_amulet"   "/images/e/ef/Amulet-gold-cross.gif"

echo ""
echo "Done! Downloaded to $OUT"
ls -la "$OUT" | head -5
echo "... $(ls "$OUT" | wc -l | tr -d ' ') files total"
