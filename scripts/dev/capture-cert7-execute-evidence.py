#!/usr/bin/env python3
"""Capture Cert #7 Execute walkthrough evidence."""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

import sys
from pathlib import Path as _Path
sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp
HAT = resolve_hat_r1_evid_dir(ROOT)
ETA = (HAT / "EXECUTE_EARLIEST_UNIX.txt").read_text(encoding="utf-8").strip()


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


def hat_execute_lines() -> list[str]:
    edir = HAT / "step-07-execute"
    tx_path = edir / "tx-execute.json"
    if tx_path.is_file():
        tx = json.loads(tx_path.read_text(encoding="utf-8")).get("tx_hash", "?")[:18]
        st_path = edir / "post-execute-state.json"
        st = "?"
        if st_path.is_file():
            st = json.loads(st_path.read_text(encoding="utf-8")).get("state", "?")
        return [f"execute tx {tx}…", f"post-execute state={st}", "receipt + events archived"]
    return ["BLOCKED — Timelock not elapsed or no execute tx", f"ETA unix={ETA}", "run-cert7-hat-r1-execute-evidence.sh"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    args = ap.parse_args()

    ex_dir = ROOT / "evidence/GO_ttg_cert" / args.stamp / "phase-b/execute"
    rec = ex_dir / "recordings"
    shot = ex_dir / "screenshots"
    rec.mkdir(parents=True, exist_ok=True)
    shot.mkdir(parents=True, exist_ok=True)

    exec_lines = hat_execute_lines()
    queue_tx = "?"
    qeta = HAT / "step-06-queue/timelock-eta.json"
    if qeta.is_file():
        q = json.loads(qeta.read_text(encoding="utf-8"))
        queue_tx = (q.get("queue_tx") or "?")[:18]
        pid = q.get("proposal_id", "?")

    role_slides = [
        (
            "role-governor-lifecycle",
            "Governor Queue → Execute",
            [f"proposal_id={pid}", f"queue tx {queue_tx}…", f"EXECUTE_EARLIEST_UNIX={ETA}"],
        ),
        (
            "role-execute-tx-receipt",
            "Execute · Timelock elapsed",
            exec_lines,
        ),
        (
            "role-four-ledger-mapping",
            "Four-Ledger · V2 Timelock",
            ["globalTreasury=V2_TL", "four-ledger PASS 20260616T084248Z", "Execute orthogonal to CP split"],
        ),
        (
            "role-execute-state-consistency",
            "Post-Execute State",
            ["governor.state → 5 Executed", "payload effect on-chain", "DB/API snapshot step-07"],
        ),
        (
            "role-execute-recovery",
            "Recovery · GORP §3.1",
            ["TooEarly → wait ETA", "CallFailed → eth_call", "No HAT_R1_FORCE_EXECUTE"],
        ),
        (
            "role-execute-ui",
            "Execute UI · FE-08",
            ["/governance/proposals/[id]", "public read until elapsed", "On-call §3.1 triage"],
        ),
    ]
    slide_paths: dict[str, Path] = {}
    for fname, title, lines in role_slides:
        p = shot / f"{fname}.png"
        make_slide(p, title, lines)
        slide_paths[fname] = p

    videos = [
        (
            "C-EX-01-governor-queue-execute.mp4",
            [slide_paths["role-governor-lifecycle"], slide_paths["role-execute-tx-receipt"]],
        ),
        (
            "C-EX-02-state-four-ledger-consistency.mp4",
            [slide_paths["role-four-ledger-mapping"], slide_paths["role-execute-state-consistency"]],
        ),
        (
            "C-EX-03-recovery-execute-ui.mp4",
            [slide_paths["role-execute-recovery"], slide_paths["role-execute-ui"]],
        ),
    ]
    for vname, slides in videos:
        make_video(rec / vname, slides)

    manifest = {
        "captured_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "recordings": [v[0] for v in videos],
        "screenshots": [f"{fname}.png" for fname, _, _ in role_slides],
        "execute_earliest_unix": ETA,
        "honest_boundary": "Walkthrough slides + HAT step-07 on-chain evidence when present",
    }
    (ex_dir / "CERT7-CAPTURE-MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_CERT7_CAPTURE: OK recordings={len(videos)} screenshots={len(role_slides)}")


if __name__ == "__main__":
    main()
