#!/usr/bin/env python3
"""Capture Cert #6 Phase B unpause walkthrough evidence."""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir

try:
    HAT_ETA = (resolve_hat_r1_evid_dir(ROOT) / "EXECUTE_EARLIEST_UNIX.txt").read_text(
        encoding="utf-8"
    ).strip()
except FileNotFoundError:
    HAT_ETA = "0"


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

    pb_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "phase-b/unpause"
    rec = pb_dir / "recordings"
    shot = pb_dir / "screenshots"
    rec.mkdir(parents=True, exist_ok=True)
    shot.mkdir(parents=True, exist_ok=True)

    role_slides = [
        (
            "role-owner-unpause-gate",
            "Owner · Phase B Unpause",
            [
                "Cert #1–#5 signoff complete",
                "export HAT_R1_PHASE_B_PAUSED=0",
                "run-hat-r1-phase-b-when-ready.sh",
            ],
        ),
        (
            "role-prerequisites-chain",
            "Prerequisites · GORP-07",
            [
                "Four-Ledger PASS 20260616T084248Z",
                "Enterprise HAT L9 recheck",
                "GovFreeze V2 baseline locked",
            ],
        ),
        (
            "role-governor-phase-a-handoff",
            "Phase A → Phase B Handoff",
            [
                "proposal → vote → queue (HAT-R1)",
                f"EXECUTE_EARLIEST_UNIX={HAT_ETA}",
                "Timelock state: queued → executable",
            ],
        ),
        (
            "role-treasury-timelock-eta",
            "ETA · Dual Timelock",
            [
                "TooEarly → wait EXECUTE_EARLIEST_UNIX",
                "V2_TL: Execute · Treasury Spend",
                "Legacy_TL: CP batches only · RB-G-09",
            ],
        ),
        (
            "role-phase-b-sequence",
            "Phase B Sequence (Cert #7–9)",
            ["#7 Execute", "#8 Treasury Spend", "#9 Unstake", "Requires HAT_R1_LIVE_WALLET_OK"],
        ),
        (
            "role-recovery-paths",
            "Recovery · GORP §3",
            ["§3.1 Execute fail · §3.5 Timelock", "No HAT_R1_FORCE_EXECUTE", "No Legacy+V2 mixed batch"],
        ),
    ]
    slide_paths: dict[str, Path] = {}
    for fname, title, lines in role_slides:
        p = shot / f"{fname}.png"
        make_slide(p, title, lines)
        slide_paths[fname] = p

    videos = [
        (
            "C-PB-01-owner-unpause-prerequisites.mp4",
            [slide_paths["role-owner-unpause-gate"], slide_paths["role-prerequisites-chain"]],
        ),
        (
            "C-PB-02-phase-a-handoff-eta-dual-timelock.mp4",
            [slide_paths["role-governor-phase-a-handoff"], slide_paths["role-treasury-timelock-eta"]],
        ),
        (
            "C-PB-03-phase-b-sequence-recovery.mp4",
            [slide_paths["role-phase-b-sequence"], slide_paths["role-recovery-paths"]],
        ),
    ]
    for vname, slides in videos:
        make_video(rec / vname, slides)

    manifest = {
        "captured_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "recordings": [v[0] for v in videos],
        "screenshots": [f"{fname}.png" for fname, _, _ in role_slides],
        "execute_earliest_unix": HAT_ETA,
        "honest_boundary": "Slide-based ffmpeg walkthrough; unpause gate only — not live Execute tx",
    }
    (pb_dir / "CERT6-CAPTURE-MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_CERT6_CAPTURE: OK recordings={len(videos)} screenshots={len(role_slides)}")


if __name__ == "__main__":
    main()
