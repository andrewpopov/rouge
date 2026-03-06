# Legacy Steampunk Prototype - MVP Art Spec (Historical)

This document records the retired pre-migration art direction. Start with `PROJECT_MASTER.md` instead. Do not use this file for new product-facing decisions except when cleaning up legacy UI still based on the old prototype shell.

## Theme
- You are the engineer of a steam-reactor train crossing a dead industrial frontier.
- The whole combat UI is a control panel, not a character scene.
- Heat is represented as pressure in pipes, gauges, and warning lamps.

## Visual Direction
- Flat 2D UI with hard-edged panel shapes.
- Minimal animation: warning blink, gauge shake, short steam puff.
- No frame-by-frame character animation for MVP.

## Palette
- `#121417` background charcoal
- `#2B3138` panel steel
- `#9C7A4F` brass accent
- `#FF6A00` heat orange
- `#8FD3FF` coolant blue
- `#FFD166` warning yellow
- `#E84A5F` danger red

## Screen Layout (Combat)
- Top left: player HP + armor.
- Top center: reactor heat gauge (largest UI element).
- Top right: enemy intent + turn counter.
- Center: enemy badge tokens.
- Bottom center: hand of cards (5 cards).
- Bottom left: draw/discard counters.
- Bottom right: end turn + overclock button.

## MVP Asset Checklist
- 1 static background panel.
- 3 card frame variants: `Attack`, `Skill`, `Reactor`.
- 24 card icons (curated and copied).
- 12 enemy badge icons (curated and copied).
- 8 UI status icons (curated and copied).
- 6 UI elements from Kenney: button, panel, progress bars, warning marker.

## Pack-to-Use Mapping
- Background and panel frame:
  - `assets/raw/kenney/ui-pack-adventure/PNG/Default/panel_grey_bolts_dark.png`
  - `assets/raw/kenney/ui-pack-adventure/PNG/Default/pattern_diagonal_grey_small.png`
- Heat and HP bars:
  - `assets/raw/kenney/ui-pack-adventure/PNG/Default/progress_red_border.png`
  - `assets/raw/kenney/ui-pack-adventure/PNG/Default/progress_red_small.png`
  - `assets/raw/kenney/ui-pack-adventure/PNG/Default/progress_blue_border.png`
  - `assets/raw/kenney/ui-pack-adventure/PNG/Default/progress_blue_small.png`
- Buttons:
  - `assets/raw/kenney/ui-pack-adventure/PNG/Default/button_red.png`
  - `assets/raw/kenney/ui-pack-adventure/PNG/Default/button_grey.png`
- Card base shapes:
  - `assets/raw/kenney/boardgame-pack/PNG/Cards/cardBack_red5.png`
  - `assets/raw/kenney/boardgame-pack/PNG/Cards/cardBack_blue5.png`
  - `assets/raw/kenney/boardgame-pack/PNG/Cards/cardBack_green5.png`

## Curated Icons (Already Prepared)
- Card icons: `assets/curated/icons/cards`
- Enemy icons: `assets/curated/icons/enemies`
- UI icons: `assets/curated/icons/ui`

Run this after downloads:

```bash
./scripts/curate-mvp-icons.sh
```
