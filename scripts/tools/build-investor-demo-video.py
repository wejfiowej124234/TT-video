#!/usr/bin/env python3
"""
Build a brand-styled title-card MP4 for investor handoff (storyboard-style).

Shipped-pack narrative targets **~90s one-take** live capture (see external/00-START-HERE.md); this reel
may run longer as an interim title-card sequence until replaced.

Replace with a real screen recording when ready: same path and filename.

Requires: pip install Pillow
Optional: ffmpeg on PATH (otherwise only PNG frames + concat instructions are written).

Output: docs/fundraising/external/export-ready/demo/
  TravelTrust-Product-Demo-v{release}.mp4
  _frames/*.png (intermediate)
  SCREEN-RECORDING-BRIEF.txt (shot list for real demo)
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ANCHORS = ROOT / "registry" / "fundraising-external-numeric-anchors.v1.json"
OUT_DIR = ROOT / "docs" / "fundraising" / "external" / "export-ready" / "demo"
FFMPEG = "ffmpeg"

# (title, body lines, duration seconds) — total ~150s
SCENES: list[tuple[str, list[str], int]] = [
    (
        "TravelTrust 产品演示",
        [
            "面向投资人的主链概览（对外口径目标 ~90s 一镜；可先播放本短片，再开 Q&A）。",
            "本视频为叙事分镜；正式路演建议替换为真实环境录屏（路径同名覆盖）。",
        ],
        18,
    ),
    (
        "我们在解决什么",
        [
            "旅游交易中的信息不对称、履约约束不足、争议结构不清与信誉难沉淀。",
            "TravelTrust 把市场、订单、托管、争议/评分、信誉与社区放在一条链上。",
        ],
        20,
    ),
    (
        "主链入口（演示时可切屏）",
        [
            "市场 /market · 订单 /orders · 托管 /escrow",
            "信誉 /did-rank · 社区 /community · 帮助 /help",
            "录屏建议：自首页进入，依次点选上述路径（每段 10–15 秒）。",
        ],
        22,
    ),
    (
        "市场与下单",
        [
            "展示列表/发现与进入下单流程。",
            "口播：撮合只是第一步，关键是订单与后续托管如何闭环。",
        ],
        20,
    ),
    (
        "托管与履约",
        [
            "展示托管状态、释放/纠纷入口（按你环境可用功能为准）。",
            "口播：链上托管与争议路由是信任结构核心，非单一支付工具。",
        ],
        22,
    ),
    (
        "争议、评分与信誉",
        [
            "展示争议或评分结果如何回流到信誉展示。",
            "口播：信誉须可解释、可追溯，避免只展示单一数字。",
        ],
        20,
    ),
    (
        "数据与环境口径",
        [
            "本材料不嵌入运营 KPI；数字仅在 NDA 与 IR/财务/法务对表后提供。",
            "演示/测试环境不得宣称已等同全面公开生产，除非已正式公告。",
        ],
        18,
    ),
    (
        "下一步",
        [
            "请参阅同包中路演 Deck PDF/PPTX 与 OnePager、FAQ、白皮书 PDF。",
            "定量与条款以 NDA 下材料及签署文本为准。",
        ],
        15,
    ),
]


def _release() -> str:
    data = json.loads(ANCHORS.read_text(encoding="utf-8"))
    r = data.get("release")
    if not r:
        raise SystemExit("numeric anchors JSON missing release")
    return str(r)


def _fonts() -> tuple[object, object]:
    try:
        from PIL import ImageFont  # noqa: PLC0415

        paths = [
            Path(r"C:/Windows/Fonts/msyh.ttc"),
            Path(r"C:/Windows/Fonts/msyhbd.ttc"),
            Path(r"C:/Windows/Fonts/simhei.ttf"),
        ]
        for p in paths:
            if p.is_file():
                return (
                    ImageFont.truetype(str(p), 44),
                    ImageFont.truetype(str(p), 26),
                )
    except OSError:
        pass
    from PIL import ImageFont  # noqa: PLC0415

    d = ImageFont.load_default()
    return d, d


def _draw_frame(title: str, lines: list[str], out: Path) -> None:
    from PIL import Image, ImageDraw  # noqa: PLC0415

    w, h = 1280, 720
    bg = (10, 22, 40)
    accent = (45, 212, 191)
    white = (255, 255, 255)
    im = Image.new("RGB", (w, h), bg)
    draw = ImageDraw.Draw(im)
    font_title, font_body = _fonts()
    draw.rectangle([0, 0, w, 6], fill=accent)
    draw.text((56, 56), title, fill=white, font=font_title)
    y = 140
    max_w = w - 112
    for line in lines:
        for part in textwrap.wrap(line, width=28):
            draw.text((56, y), part, fill=white, font=font_body)
            y += 34
        y += 12
    draw.text(
        (56, h - 48),
        "TravelTrust · Investor materials · general information only",
        fill=(160, 170, 180),
        font=font_body,
    )
    im.save(out)


def _write_brief(dest: Path, release: str) -> None:
    dest.write_text(
        "\n".join(
            [
                f"TravelTrust · Product demo screen recording · Release {release}",
                "",
                "Replace demo/TravelTrust-Product-Demo-v{rel}.mp4 with a real capture when ready.".format(
                    rel=release
                ),
                "",
                "Suggested capture flow (one continuous ~90s one-take for shipped investor pack):",
                "1) Open app/dapp in demo/staging URL.",
                "2) Landing → /market → pick listing or order path.",
                "3) Show order detail and escrow state transitions you can safely demo.",
                "4) Open dispute/rating or help path if available.",
                "5) End on reputation/community surface.",
                "",
                "Do not narrate unaudited KPIs; point investors to NDA pack for numbers.",
                "",
            ]
        ),
        encoding="utf-8",
        newline="\n",
    )


def _ffmpeg_segments(frames_dir: Path, durations: list[int], out_mp4: Path) -> bool:
    seg_dir = frames_dir.parent / "_segments"
    seg_dir.mkdir(parents=True, exist_ok=True)
    concat = seg_dir / "list.txt"
    lines: list[str] = []
    for i, dsec in enumerate(durations):
        png = frames_dir / f"frame_{i+1:03d}.png"
        seg = seg_dir / f"seg_{i+1:03d}.mp4"
        cmd = [
            FFMPEG,
            "-y",
            "-loop",
            "1",
            "-i",
            str(png),
            "-c:v",
            "libx264",
            "-t",
            str(dsec),
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(seg),
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=120)
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired, OSError):
            return False
        lines.append(f"file '{seg.as_posix()}'")
    concat.write_text("\n".join(lines), encoding="utf-8")
    cmd2 = [
        FFMPEG,
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat),
        "-c",
        "copy",
        str(out_mp4),
    ]
    try:
        subprocess.run(cmd2, check=True, capture_output=True, timeout=120)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return False


def _purge_stale_demo_artifacts(out_dir: Path, release: str) -> None:
    for p in out_dir.glob("TravelTrust-Product-Demo-v*.mp4"):
        if p.name != f"TravelTrust-Product-Demo-v{release}.mp4" and p.is_file():
            try:
                p.unlink()
            except OSError:
                pass


def main() -> int:
    release = _release()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    _purge_stale_demo_artifacts(OUT_DIR, release)
    frames = OUT_DIR / "_frames"
    if frames.exists():
        for p in frames.glob("*.png"):
            p.unlink()
    else:
        frames.mkdir(parents=True, exist_ok=True)

    durations: list[int] = []
    for i, (title, lines, dsec) in enumerate(SCENES):
        durations.append(dsec)
        _draw_frame(title, lines, frames / f"frame_{i+1:03d}.png")

    _write_brief(OUT_DIR / "SCREEN-RECORDING-BRIEF.txt", release)

    out_mp4 = OUT_DIR / f"TravelTrust-Product-Demo-v{release}.mp4"
    if _ffmpeg_segments(frames, durations, out_mp4):
        print(f"OK: {out_mp4}")
    else:
        print(
            "SKIP: ffmpeg missing or failed; PNG frames in "
            + str(frames)
            + " — install ffmpeg and re-run, or assemble in your editor.",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
