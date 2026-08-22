#!/usr/bin/env python3
"""Sync TTG logo brand assets from Owner GO source image.

SSOT source (local): Gemini GO export · map-pin + T mark.
Outputs: frontend/public/brand/* · favicon · token/Etherscan sizes.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "frontend/public/brand"
TOKEN = BRAND / "token"
PUBLIC = ROOT / "frontend/public"
EVIDENCE = ROOT / "evidence/GO_ttg_v9_brand_logo_go"

DEFAULT_SOURCE = Path(r"D:/下载/Gemini_Generated_Image_v542kqv542kqv542.jpg")
GO_ASSET_ID = "Gemini_Generated_Image_v542kqv542kqv542"

# Crop bottom band (wordmark) then square-center on icon art.
CROP_BOTTOM_Y = 860
SIZES = {
    "bimi-logo.png": 112,
    "traveltrust-email-mark.png": 112,
    "token/ttg-logo-64.png": 64,
    "token/ttg-avatar.png": 128,
    "token/ttg-avatar-256.png": 256,
}


def crop_icon_square(im: Image.Image) -> Image.Image:
    w, h = im.size
    top = im.crop((0, 0, w, min(CROP_BOTTOM_Y, h)))
    side = min(top.size)
    left = (top.width - side) // 2
    return top.crop((left, 0, left + side, side))


def resize_png(im: Image.Image, size: int) -> bytes:
    out = im.resize((size, size), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    out.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def svg_embed_png(png_bytes: bytes, width: int, height: int, comment: str) -> str:
    b64 = base64.b64encode(png_bytes).decode("ascii")
    return f"""<svg xmlns="http://www.w3.org/2000/svg"
xmlns:xlink="http://www.w3.org/1999/xlink"
width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="TravelTrust TTG">
  <!-- {comment} -->
  <image x="0" y="0" width="{width}" height="{height}"
         preserveAspectRatio="xMidYMid meet"
         href="data:image/png;base64,{b64}"
         xlink:href="data:image/png;base64,{b64}"/>
</svg>
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    src = args.source.expanduser().resolve()
    if not src.is_file():
        print(f"ERROR: source not found: {src}", flush=True)
        return 1

    icon = crop_icon_square(Image.open(src).convert("RGBA"))
    written: list[str] = []

    for rel, size in SIZES.items():
        png = resize_png(icon, size)
        dest = BRAND / rel
        if not args.dry_run:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(png)
        written.append(str(dest.relative_to(ROOT)))

    bimi_png = resize_png(icon, 112)
    favicon_png = resize_png(icon, 32)
    logo32_png = resize_png(icon, 32)
    logo64_png = resize_png(icon, 64)

    svg_map = {
        BRAND / "bimi-logo.svg": svg_embed_png(
            bimi_png, 112, 112, "TTG GO logo · BIMI / site brand SSOT"
        ),
        BRAND / "traveltrust-mark.svg": svg_embed_png(
            bimi_png, 112, 112, "TTG GO logo · same as bimi-logo.svg"
        ),
        PUBLIC / "favicon.svg": svg_embed_png(
            favicon_png, 32, 32, "TravelTrust favicon · TTG GO logo"
        ),
        TOKEN / "ttg-logo-32.svg": svg_embed_png(
            logo32_png, 32, 32, "TTG token mark · Etherscan 32x32 SVG"
        ),
        TOKEN / "ttg-logo-64.svg": svg_embed_png(
            logo64_png, 64, 64, "TTG token mark · 64x64 SVG"
        ),
        TOKEN / "ttg-avatar-32.svg": svg_embed_png(
            logo32_png, 32, 32, "TTG avatar · Etherscan / wallet 32x32"
        ),
    }

    for path, content in svg_map.items():
        if not args.dry_run:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
        written.append(str(path.relative_to(ROOT)))

    # Archive GO source reference (read-only copy for evidence trail).
    if not args.dry_run:
        EVIDENCE.mkdir(parents=True, exist_ok=True)
        archive = EVIDENCE / f"{GO_ASSET_ID}.jpg"
        if not archive.exists():
            archive.write_bytes(src.read_bytes())
        manifest = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "go_asset_id": GO_ASSET_ID,
            "source_path": str(src),
            "crop_bottom_y": CROP_BOTTOM_Y,
            "outputs": written,
            "public_urls": {
                "site_brand_png": "https://www.web3-ttg.com/brand/bimi-logo.png",
                "site_brand_svg": "https://www.web3-ttg.com/brand/bimi-logo.svg",
                "etherscan_logo_32_svg": "https://www.web3-ttg.com/brand/token/ttg-logo-32.svg",
                "etherscan_avatar_256_png": "https://www.web3-ttg.com/brand/token/ttg-avatar-256.png",
            },
        }
        (EVIDENCE / "TTG_LOGO_GO_BRAND_SYNC_LATEST.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    print(json.dumps({"status": "ok", "written": written, "dry_run": args.dry_run}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
