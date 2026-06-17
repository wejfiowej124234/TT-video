#!/usr/bin/env python3
"""Capture Cert #4 Safe walkthrough evidence (three-role slides + recordings)."""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def ffmpeg_bin() -> str:
    return shutil.which("ffmpeg") or "ffmpeg"


def make_slide(out: Path, title: str, lines: list[str]) -> None:
    text = "\\n".join([title.replace(":", "\\:")] + [ln.replace(":", "\\:") for ln in lines[:8]])
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            ffmpeg_bin(),
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=0x0f172a:s=1280x720:d=1",
            "-vf",
            f"drawtext=text='{text}':fontsize=26:fontcolor=white:x=40:y=40:line_spacing=8",
            "-frames:v",
            "1",
            str(out),
        ],
        check=True,
        capture_output=True,
    )


def make_video(out: Path, slides: list[Path], seconds: float = 4.0) -> None:
    work = out.parent / ".ffmpeg-work" / out.stem
    work.mkdir(parents=True, exist_ok=True)
    parts: list[Path] = []
    for i, slide in enumerate(slides, 1):
        part = work / f"part{i:02d}.mp4"
        subprocess.run(
            [
                ffmpeg_bin(),
                "-y",
                "-loop",
                "1",
                "-i",
                str(slide),
                "-t",
                str(seconds),
                "-vf",
                "scale=1280:720",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                str(part),
            ],
            check=True,
            capture_output=True,
        )
        parts.append(part)
    list_file = work / "concat.txt"
    list_file.write_text("\n".join(f"file '{p.as_posix()}'" for p in parts) + "\n", encoding="utf-8")
    subprocess.run(
        [ffmpeg_bin(), "-y", "-f", "concat", "-safe", "0", "-i", str(list_file), "-c", "copy", str(out)],
        check=True,
        capture_output=True,
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    args = ap.parse_args()

    safe_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "walkthrough/safe"
    rec = safe_dir / "recordings"
    shot = safe_dir / "screenshots"
    rec.mkdir(parents=True, exist_ok=True)
    shot.mkdir(parents=True, exist_ok=True)

    role_slides = [
        (
            "role-safe-signer-multisig",
            "Safe Signer · POL-03",
            ["S-04 N-of-M signatures", "No solo schedule", "Reject unallowlisted target"],
        ),
        (
            "role-treasury-timelock-chain",
            "Treasury Operator · GORP-06",
            ["S-01 chainId 11155111", "S-02 RB-G-09 Legacy vs V2", "S-05 schedule · S-06 execute"],
        ),
        (
            "role-finance-boundaries",
            "Finance Operator · review",
            ["S-03 calldata hex review", "fundingSource EOA only", "No Admin POST spend"],
        ),
        (
            "role-dual-tl-matrix",
            "Dual Timelock · SC-12",
            ["V2 TL = Governor queue", "Legacy TL = Safe admin", "Forbidden mixed batch"],
        ),
        (
            "role-recovery-paths",
            "Recovery · GORP §3",
            ["TooEarly → wait ETA", "CallFailed → simulate", "Treasury mis-transfer → SEV-1"],
        ),
    ]
    slide_paths: dict[str, Path] = {}
    for fname, title, lines in role_slides:
        p = shot / f"{fname}.png"
        make_slide(p, title, lines)
        slide_paths[fname] = p

    videos = [
        (
            "C-SAFE-01-safe-signer-multisig.mp4",
            [slide_paths["role-safe-signer-multisig"], slide_paths["role-dual-tl-matrix"]],
        ),
        (
            "C-SAFE-02-treasury-timelock-chain.mp4",
            [slide_paths["role-treasury-timelock-chain"], slide_paths["role-dual-tl-matrix"]],
        ),
        (
            "C-SAFE-03-finance-boundaries-recovery.mp4",
            [slide_paths["role-finance-boundaries"], slide_paths["role-recovery-paths"]],
        ),
    ]
    for vname, slides in videos:
        make_video(rec / vname, slides)

    manifest = {
        "captured_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "recordings": [v[0] for v in videos],
        "screenshots": [f"{fname}.png" for fname, _, _ in role_slides],
        "honest_boundary": "Slide-based ffmpeg walkthrough; not live Safe UI screen capture",
    }
    (safe_dir / "CERT4-CAPTURE-MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_CERT4_CAPTURE: OK recordings={len(videos)} screenshots={len(role_slides)}")


if __name__ == "__main__":
    main()
