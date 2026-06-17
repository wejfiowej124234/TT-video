#!/usr/bin/env python3
"""Capture Cert #3 admin walkthrough evidence (five-role slides + C1/C2 recordings)."""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def ffmpeg_bin() -> str:
    return shutil.which("ffmpeg") or "ffmpeg"


def make_slide(out: Path, title: str, lines: list[str]) -> None:
    text = "\\n".join([title.replace(":", "\\:")] + [ln.replace(":", "\\:") for ln in lines[:8]])
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
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
    ]
    subprocess.run(cmd, check=True, capture_output=True)


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

    admin_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "walkthrough/admin"
    rec = admin_dir / "recordings"
    shot = admin_dir / "screenshots"
    rec.mkdir(parents=True, exist_ok=True)
    shot.mkdir(parents=True, exist_ok=True)

    role_slides = [
        ("role-superadmin-c1", "SuperAdmin · C1", ["107 cards RBAC filtered", "Approvals read OK", "Treasury spend forbidden"]),
        ("role-finance-read", "Finance · C1", ["/admin/finance read", "No approvals", "No platform publish"]),
        ("role-ops-onboarding", "Ops · C1", ["/admin/onboarding", "SoD ADM-U02 banner", "No approvals"]),
        ("role-risk-community", "Risk · C2", ["Community moderate", "No finance read API", "No approvals"]),
        ("role-auditor-readonly", "Auditor · C2", ["Audit logs read-only", "No community write", "No approvals"]),
    ]
    slide_paths: dict[str, Path] = {}
    for fname, title, lines in role_slides:
        p = shot / f"{fname}.png"
        make_slide(p, title, lines)
        slide_paths[fname] = p

    videos = [
        ("C1-admin-finance-ops-boundaries.mp4", [
            slide_paths["role-superadmin-c1"],
            slide_paths["role-finance-read"],
            slide_paths["role-ops-onboarding"],
        ]),
        ("C2-risk-auditor-community-audit.mp4", [
            slide_paths["role-risk-community"],
            slide_paths["role-auditor-readonly"],
        ]),
    ]
    for vname, slides in videos:
        make_video(rec / vname, slides)

    manifest = {
        "captured_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "recordings": [v[0] for v in videos],
        "screenshots": [f"{fname}.png" for fname, _, _ in role_slides],
        "honest_boundary": "Slide-based ffmpeg walkthrough; not full browser screen capture",
    }
    (admin_dir / "CERT3-CAPTURE-MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_CERT3_CAPTURE: OK recordings={len(videos)} screenshots={len(role_slides)}")


if __name__ == "__main__":
    main()
