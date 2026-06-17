#!/usr/bin/env python3
"""Capture Cert #5 finance walkthrough evidence."""
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

    fin_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "walkthrough/finance"
    rec = fin_dir / "recordings"
    shot = fin_dir / "screenshots"
    rec.mkdir(parents=True, exist_ok=True)
    shot.mkdir(parents=True, exist_ok=True)

    role_slides = [
        (
            "role-finance-four-ledger",
            "Finance Operator · GORP-05",
            ["W-F fundingSource EOA", "Country Pool accrual", "four-ledger PASS 20260616T084248Z"],
        ),
        (
            "role-fee-router-4555",
            "FeeRouter vs 45/55",
            ["FeeRouter 65/20/15 escrow", "Orthogonal to NetProfit 45/55", "No Admin POST spend"],
        ),
        (
            "role-treasury-split-accounting",
            "Treasury Operator · split",
            ["Legacy TL splitNetProfit batch", "globalTreasury → V2 Timelock", "Receipt + four-ledger handoff"],
        ),
        (
            "role-distribution-ledger",
            "Distribution Ledger",
            ["Investor accruals read/register", "Finance internal · not P4 cash", "Treasury accounting separate"],
        ),
        (
            "role-auditor-traceability",
            "Auditor · read-only",
            ["four-ledger trace", "No fundingSource write", "§3.6 FAIL triage read"],
        ),
        (
            "role-recovery-paths",
            "Recovery · GORP §3",
            ["SplitNotFunded → fund batch", "four-ledger FAIL → §3.6", "settlementPaused → Owner unpause"],
        ),
    ]
    slide_paths: dict[str, Path] = {}
    for fname, title, lines in role_slides:
        p = shot / f"{fname}.png"
        make_slide(p, title, lines)
        slide_paths[fname] = p

    videos = [
        (
            "C-FIN-01-finance-operator-four-ledger.mp4",
            [slide_paths["role-finance-four-ledger"], slide_paths["role-fee-router-4555"]],
        ),
        (
            "C-FIN-02-treasury-split-treasury-accounting.mp4",
            [slide_paths["role-treasury-split-accounting"], slide_paths["role-distribution-ledger"]],
        ),
        (
            "C-FIN-03-auditor-traceability-recovery.mp4",
            [slide_paths["role-auditor-traceability"], slide_paths["role-recovery-paths"]],
        ),
    ]
    for vname, slides in videos:
        make_video(rec / vname, slides)

    manifest = {
        "captured_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "recordings": [v[0] for v in videos],
        "screenshots": [f"{fname}.png" for fname, _, _ in role_slides],
        "honest_boundary": "Slide-based ffmpeg walkthrough; not live ERP/chain UI screen capture",
    }
    (fin_dir / "CERT5-CAPTURE-MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_CERT5_CAPTURE: OK recordings={len(videos)} screenshots={len(role_slides)}")


if __name__ == "__main__":
    main()
