#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parent.parent
ENEMY_OUTPUT_DIR = ROOT / "assets/curated/sprites/enemies"


@dataclass(frozen=True)
class SpriteJob:
    slug: str
    source: str
    candidate_index: int = 0
    crop_size: int = 960
    direct_frame: bool = False


JOBS: tuple[SpriteJob, ...] = (
    SpriteJob("fallen", "assets/diablo2_downloads/potential_art/monsters_random/sprites/92837__Fallen_Body/92837.png"),
    SpriteJob("fallen_shaman", "assets/diablo2_downloads/potential_art/monsters_random/sprites/54314__Fallen_Shaman/54314.png"),
    SpriteJob("fetish", "assets/diablo2_downloads/potential_art/monsters_random/sprites/93063__Fetish_Knife_/93063.png"),
    SpriteJob("fetish_shaman", "assets/diablo2_downloads/potential_art/monsters_random/sprites/54315__Fetish_Shaman/54315.gif"),
    SpriteJob("goatman", "assets/diablo2_downloads/potential_art/monsters_random/sprites/84900__Goatman_Weaponless_/84900.png"),
    SpriteJob("wraith", "assets/diablo2_downloads/potential_art/monsters_random/sprites/72427__Wraith/72427.png"),
    SpriteJob("demon_imp", "assets/diablo2_downloads/potential_art/monsters_random/sprites/94832__Demon_Imp/94832.png"),
    SpriteJob("giant_mosquito", "assets/diablo2_downloads/potential_art/monsters_random/sprites/94572__Giant_Mosquito/94572.png"),
    SpriteJob("vampire", "assets/diablo2_downloads/potential_art/monsters_random/sprites/54333__Vampire/54333.gif"),
    SpriteJob("sand_maggot", "assets/diablo2_downloads/potential_art/monsters_random/sprites/54325__Sand_Maggot/54325.gif"),
    SpriteJob("sand_maggot_young", "assets/diablo2_downloads/potential_art/monsters_random/sprites/54326__Sand_Maggot_Young/54326.gif"),
    SpriteJob("baboon_demon", "assets/diablo2_downloads/potential_art/monsters_random/sprites/54307__Baboon_Demon/54307.gif"),
    SpriteJob("frog_demon", "assets/diablo2_downloads/potential_art/monsters_random/sprites/54316__Frog_Demon/54316.gif"),
    SpriteJob("regurgitator", "assets/diablo2_downloads/potential_art/monsters_random/sprites/54324__Regurgitator/54324.gif"),
    SpriteJob("vulture_demon", "assets/diablo2_downloads/potential_art/monsters_random/sprites/54336__Vulture_Demon/54336.gif"),
    SpriteJob("council_member", "assets/diablo2_downloads/potential_art/bosses/sprites/54310__Council_Member/54310.gif"),
)


def run_magick(*args: str | Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["magick", *map(str, args)],
        capture_output=True,
        text=True,
        check=True,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract and stylize first-pass monster portraits from raw Diablo II sheets."
    )
    parser.add_argument(
        "--only",
        nargs="*",
        default=[],
        help="Optional list of monster slugs to generate. Default: generate the curated first-pass roster.",
    )
    return parser.parse_args()


def build_seed_draws(size: int, step: int = 48) -> list[str]:
    points: list[tuple[int, int]] = []
    for x in range(0, size, step):
        points.append((x, 0))
        points.append((x, size - 1))
    for y in range(0, size, step):
        points.append((0, y))
        points.append((size - 1, y))

    draw_args: list[str] = []
    seen: set[tuple[int, int]] = set()
    for point in points:
        if point in seen:
            continue
        seen.add(point)
        draw_args.extend(["-draw", f"color {point[0]},{point[1]} floodfill"])
    return draw_args


def parse_connected_components(text: str) -> list[dict[str, int]]:
    components: list[dict[str, int]] = []
    pattern = re.compile(
        r"\s*(\d+):\s*(\d+)x(\d+)\+(\d+)\+(\d+)\s+([0-9.]+),([0-9.]+)\s+(\d+)\s+"
    )
    for line in text.splitlines():
        match = pattern.match(line)
        if not match:
            continue
        component_id, width, height, x, y, _cx, _cy, area = match.groups()
        components.append(
            {
                "id": int(component_id),
                "w": int(width),
                "h": int(height),
                "x": int(x),
                "y": int(y),
                "area": int(area),
            }
        )
    return components


def select_component(mask_path: Path, crop_size: int, candidate_index: int) -> dict[str, int]:
    alpha_path = mask_path.with_name("alpha.png")
    run_magick(mask_path, "-alpha", "extract", "-threshold", "0", alpha_path)
    connected = run_magick(
        alpha_path,
        "-define",
        "connected-components:verbose=true",
        "-connected-components",
        "8",
        "null:",
    )
    ranked: list[tuple[float, dict[str, int]]] = []
    for component in parse_connected_components(connected.stderr or connected.stdout):
        if component["id"] == 0 or component["area"] < 40:
            continue
        density = component["area"] / (component["w"] * component["h"])
        if density > 0.8:
            continue
        if component["w"] < 8 or component["h"] < 8:
            continue
        if component["w"] > 180 or component["h"] > 220:
            continue
        score = component["area"] * 3 - (component["x"] * 0.9 + component["y"] * 0.7)
        ranked.append((score, component))

    if not ranked:
        raise RuntimeError(f"No usable sprite component found in {mask_path}")

    ranked.sort(key=lambda entry: entry[0], reverse=True)
    if candidate_index >= len(ranked):
        raise RuntimeError(
            f"Candidate index {candidate_index} is out of range for {mask_path} (found {len(ranked)} candidates)"
        )
    return ranked[candidate_index][1]


def extract_sheet_frame(job: SpriteJob) -> Image.Image:
    source_path = ROOT / job.source
    if job.direct_frame:
        return Image.open(source_path).convert("RGBA")

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_root = Path(temp_dir)
        crop_path = temp_root / "crop.png"
        mask_path = temp_root / "masked.png"

        run_magick(
            source_path,
            "-coalesce",
            "-delete",
            "1--1",
            "-crop",
            f"{job.crop_size}x{job.crop_size}+0+0",
            "+repage",
            crop_path,
        )
        run_magick(
            crop_path,
            "-alpha",
            "set",
            "-fuzz",
            "14%",
            "-fill",
            "transparent",
            *build_seed_draws(job.crop_size),
            mask_path,
        )

        component = select_component(mask_path, job.crop_size, job.candidate_index)
        left = max(0, component["x"] - 8)
        top = max(0, component["y"] - 8)
        right = min(job.crop_size, component["x"] + component["w"] + 8)
        bottom = min(job.crop_size, component["y"] + component["h"] + 8)
        return Image.open(mask_path).convert("RGBA").crop((left, top, right, bottom))


def stylize(sprite: Image.Image) -> Image.Image:
    alpha = sprite.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError("Sprite alpha is empty after extraction")

    sprite = sprite.crop(bbox)
    alpha = sprite.getchannel("A")

    grayscale = ImageOps.grayscale(sprite)
    grade = ImageOps.colorize(grayscale, black="#130d0c", mid="#6b2b1a", white="#dcb07a").convert("RGBA")
    grade.putalpha(alpha)
    sprite = Image.blend(sprite, grade, 0.28)
    sprite = ImageEnhance.Contrast(sprite).enhance(1.18)
    sprite = ImageEnhance.Color(sprite).enhance(1.12)
    sprite = ImageEnhance.Sharpness(sprite).enhance(1.10)

    canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    scale = min(92 / sprite.width, 92 / sprite.height)
    scaled_size = (
        max(1, round(sprite.width * scale)),
        max(1, round(sprite.height * scale)),
    )
    sprite = sprite.resize(scaled_size, Image.Resampling.NEAREST)
    alpha = sprite.getchannel("A")

    shadow_alpha = alpha.filter(ImageFilter.GaussianBlur(4))
    shadow = ImageOps.colorize(shadow_alpha, black="#000000", white="#2a0d08").convert("RGBA")
    shadow.putalpha(shadow_alpha)

    rim_alpha = ImageChops.subtract(alpha.filter(ImageFilter.MaxFilter(5)), alpha)
    rim = ImageOps.colorize(rim_alpha, black="#000000", white="#ffb15a").convert("RGBA")
    rim.putalpha(rim_alpha)

    x = (128 - sprite.width) // 2
    y = 128 - sprite.height - 10
    canvas.alpha_composite(shadow, (x + 2, y + 5))
    canvas.alpha_composite(rim, (x, y))
    canvas.alpha_composite(sprite, (x, y))
    return canvas


def main() -> None:
    args = parse_args()
    selected = set(args.only)
    jobs = [job for job in JOBS if not selected or job.slug in selected]
    if selected and len(jobs) != len(selected):
        missing = sorted(selected - {job.slug for job in jobs})
        raise SystemExit(f"Unknown monster slug(s): {', '.join(missing)}")

    ENEMY_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for job in jobs:
        sprite = extract_sheet_frame(job)
        output_path = ENEMY_OUTPUT_DIR / f"{job.slug}.png"
        stylize(sprite).save(output_path)
        print(f"generated {job.slug} -> {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
