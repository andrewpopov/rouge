# Asset Packs To Download

## Required Packs

1. Kenney UI Pack - Sci-Fi (CC0)
- URL: https://kenney.nl/assets/ui-pack-sci-fi
- Local ZIP: `assets/source/kenney/ui-pack-sci-fi.zip`
- Use for: bars, futuristic panel strips, status accents.

2. Kenney UI Pack - Adventure (CC0)
- URL: https://kenney.nl/assets/ui-pack-adventure
- Local ZIP: `assets/source/kenney/ui-pack-adventure.zip`
- Use for: primary panels, buttons, progress bars, warning motifs.

3. Kenney Boardgame Pack (CC0)
- URL: https://kenney.nl/assets/boardgame-pack
- Local ZIP: `assets/source/kenney/boardgame-pack.zip`
- Use for: card back templates and token-like shapes.

4. Game-icons tag packs (CC BY 3.0)
- Base URL: https://game-icons.net
- Downloaded by Playwright from these tags:
  - `steampunk`
  - `machine`
  - `smoke`
  - `light`
  - `energy`
- Local ZIPs: `assets/source/game-icons/*.svg.zip`
- Use for: card art glyphs, enemy badges, UI symbols.

## Download Commands

```bash
./scripts/download-assets.sh
./scripts/curate-mvp-icons.sh
```

## What The Scripts Do
- `scripts/download-assets.sh`
  - Downloads all Kenney ZIPs.
  - Uses Playwright script (`scripts/download-game-icons.js`) to fetch Game-icons archives.
  - Extracts everything to `assets/raw`.
- `scripts/curate-mvp-icons.sh`
  - Copies a hand-picked MVP set into `assets/curated/icons`.

## Licensing Notes
- Kenney packs are CC0 (see local `License.txt` in extracted folders).
- Game-icons are CC BY 3.0; attribution is required.
- Attribution details are in `docs/ATTRIBUTION.md`.
