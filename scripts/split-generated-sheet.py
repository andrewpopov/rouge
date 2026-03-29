#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageColor, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "data" / "art-batches" / "non-character-sheet-batches.json"
DEFAULT_OUTPUT_ROOT = ROOT / "output" / "generated-sheet-splits"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Split a generated grid sheet into labeled PNG assets."
    )
    parser.add_argument("--sheet", required=True, help="Path to the generated sheet image.")
    parser.add_argument("--batch-id", help="Batch id from the config file.")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="Path to batch config JSON.")
    parser.add_argument("--out-dir", help="Output directory. Defaults to output/generated-sheet-splits/<batch-id>.")
    parser.add_argument("--cols", type=int, help="Grid columns. Required when not using --batch-id.")
    parser.add_argument("--rows", type=int, help="Grid rows. Required when not using --batch-id.")
    parser.add_argument("--labels", help="Comma-separated labels in row-major order.")
    parser.add_argument("--labels-file", help="Text file with one label per line.")
    parser.add_argument("--offset-x", type=int, default=0, help="Left inset before first cell.")
    parser.add_argument("--offset-y", type=int, default=0, help="Top inset before first cell.")
    parser.add_argument("--gutter-x", type=int, default=0, help="Horizontal space between cells.")
    parser.add_argument("--gutter-y", type=int, default=0, help="Vertical space between cells.")
    parser.add_argument("--cell-width", type=int, help="Explicit cell width.")
    parser.add_argument("--cell-height", type=int, help="Explicit cell height.")
    parser.add_argument("--trim", action="store_true", help="Trim transparent bounds after keying.")
    parser.add_argument("--no-trim", action="store_true", help="Disable trimming even if enabled in config.")
    parser.add_argument("--key-color", help="Flat background color to remove, e.g. #00FF00.")
    parser.add_argument("--key-threshold", type=int, default=20, help="Per-channel tolerance for key color removal.")
    parser.add_argument("--extent", help="Optional fixed output canvas, e.g. 128x128.")
    parser.add_argument("--skip-empty", action="store_true", help="Skip fully empty cells after keying.")
    parser.add_argument("--dry-run", action="store_true", help="Print planned outputs without writing files.")
    return parser.parse_args()


def load_config(config_path: Path) -> dict[str, Any]:
    if not config_path.exists():
      raise FileNotFoundError(f"Missing config file: {config_path}")
    return json.loads(config_path.read_text())


def parse_labels(args: argparse.Namespace, batch: dict[str, Any]) -> list[str]:
    if args.labels:
        return [part.strip() for part in args.labels.split(",") if part.strip()]
    if args.labels_file:
        return [line.strip() for line in Path(args.labels_file).read_text().splitlines() if line.strip()]
    return list(batch.get("labels") or [])


def parse_extent(extent_value: str | None) -> tuple[int, int] | None:
    if not extent_value:
        return None
    width_str, height_str = extent_value.lower().split("x", 1)
    return int(width_str), int(height_str)


def merge_settings(args: argparse.Namespace, batch: dict[str, Any]) -> dict[str, Any]:
    labels = parse_labels(args, batch)
    settings = {
        "cols": args.cols or batch.get("cols"),
        "rows": args.rows or batch.get("rows"),
        "offset_x": args.offset_x,
        "offset_y": args.offset_y,
        "gutter_x": args.gutter_x,
        "gutter_y": args.gutter_y,
        "cell_width": args.cell_width,
        "cell_height": args.cell_height,
        "trim": False if args.no_trim else (args.trim or bool(batch.get("trim"))),
        "key_color": args.key_color or batch.get("keyColor"),
        "key_threshold": args.key_threshold,
        "extent": parse_extent(args.extent or batch.get("extent")),
        "labels": labels,
        "description": batch.get("description", ""),
        "category": batch.get("category", ""),
    }
    if not settings["cols"] or not settings["rows"]:
        raise ValueError("Missing grid size. Use --batch-id or provide --cols and --rows.")
    if not settings["labels"]:
        raise ValueError("Missing labels. Use --batch-id or provide --labels / --labels-file.")
    if len(settings["labels"]) > settings["cols"] * settings["rows"]:
        raise ValueError("More labels provided than grid cells available.")
    return settings


def transparentize_key_color(image: Image.Image, color_value: str, threshold: int) -> Image.Image:
    key_r, key_g, key_b = ImageColor.getrgb(color_value)
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if (
                abs(r - key_r) <= threshold
                and abs(g - key_g) <= threshold
                and abs(b - key_b) <= threshold
            ):
                pixels[x, y] = (r, g, b, 0)
    return rgba


def trim_transparent_bounds(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return image
    return image.crop(bbox)


def contain_on_canvas(image: Image.Image, extent: tuple[int, int]) -> Image.Image:
    fitted = ImageOps.contain(image, extent, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", extent, (0, 0, 0, 0))
    x = (extent[0] - fitted.width) // 2
    y = (extent[1] - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    return canvas


def resolve_cell_size(sheet: Image.Image, settings: dict[str, Any]) -> tuple[int, int]:
    if settings["cell_width"] and settings["cell_height"]:
        return settings["cell_width"], settings["cell_height"]

    usable_width = sheet.width - settings["offset_x"] - settings["gutter_x"] * (settings["cols"] - 1)
    usable_height = sheet.height - settings["offset_y"] - settings["gutter_y"] * (settings["rows"] - 1)
    if usable_width <= 0 or usable_height <= 0:
        raise ValueError("Computed non-positive usable sheet area. Check offsets, gutters, rows, and columns.")
    return usable_width // settings["cols"], usable_height // settings["rows"]


def main() -> None:
    args = parse_args()
    config = load_config(Path(args.config))
    batch = {}
    if args.batch_id:
        batch = (config.get("batches") or {}).get(args.batch_id) or {}
        if not batch:
            raise KeyError(f"Unknown batch id: {args.batch_id}")

    settings = merge_settings(args, batch)
    sheet_path = Path(args.sheet).expanduser().resolve()
    out_dir = (
        Path(args.out_dir).expanduser().resolve()
        if args.out_dir
        else (DEFAULT_OUTPUT_ROOT / (args.batch_id or sheet_path.stem)).resolve()
    )
    sheet = Image.open(sheet_path).convert("RGBA")
    cell_width, cell_height = resolve_cell_size(sheet, settings)

    if not args.dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    outputs: list[dict[str, Any]] = []
    for index, label in enumerate(settings["labels"]):
        row = index // settings["cols"]
        col = index % settings["cols"]
        x0 = settings["offset_x"] + col * (cell_width + settings["gutter_x"])
        y0 = settings["offset_y"] + row * (cell_height + settings["gutter_y"])
        x1 = x0 + cell_width
        y1 = y0 + cell_height
        cell = sheet.crop((x0, y0, x1, y1))

        if settings["key_color"]:
            cell = transparentize_key_color(cell, settings["key_color"], settings["key_threshold"])
        if settings["trim"]:
            cell = trim_transparent_bounds(cell)

        alpha = cell.getchannel("A")
        is_empty = alpha.getbbox() is None
        if is_empty and args.skip_empty:
            continue
        if settings["extent"]:
            cell = contain_on_canvas(cell, settings["extent"])

        out_path = out_dir / f"{label}.png"
        outputs.append(
            {
                "label": label,
                "row": row,
                "col": col,
                "box": [x0, y0, x1, y1],
                "output": str(out_path),
                "empty": is_empty,
            }
        )
        if not args.dry_run:
            cell.save(out_path)

    manifest = {
        "sheet": str(sheet_path),
        "batchId": args.batch_id or "",
        "description": settings["description"],
        "category": settings["category"],
        "grid": {
            "cols": settings["cols"],
            "rows": settings["rows"],
            "cellWidth": cell_width,
            "cellHeight": cell_height,
            "offsetX": settings["offset_x"],
            "offsetY": settings["offset_y"],
            "gutterX": settings["gutter_x"],
            "gutterY": settings["gutter_y"],
        },
        "trim": settings["trim"],
        "keyColor": settings["key_color"] or "",
        "extent": list(settings["extent"]) if settings["extent"] else None,
        "outputs": outputs,
    }

    print(f"sheet: {sheet_path}")
    print(f"batch: {args.batch_id or '(custom)'}")
    print(f"out dir: {out_dir}")
    print(f"labels: {len(outputs)}")
    if not args.dry_run:
        manifest_path = out_dir / "_split-manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"manifest: {manifest_path}")


if __name__ == "__main__":
    main()
