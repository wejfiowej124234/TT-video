"""Resolve HAT-R1 evidence directory (mirrors scripts/dev/lib/hat-r1-evidence-lib.sh)."""
from __future__ import annotations

import os
from pathlib import Path


def resolve_hat_r1_evid_dir(root: Path | None = None) -> Path:
    root = (root or Path(__file__).resolve().parents[3]).resolve()
    env = os.environ.get("HAT_R1_EVID_DIR", "").strip()
    if env:
        p = Path(env)
        if not p.is_absolute():
            p = root / p
        if not p.is_dir():
            raise FileNotFoundError(f"HAT_R1_EVID_DIR not a directory: {p}")
        return p

    base = root / "evidence" / "GO_hat_r1_sepolia"
    if not base.is_dir():
        raise FileNotFoundError(f"no HAT-R1 evidence under {base} — set HAT_R1_EVID_DIR")

    candidates: list[Path] = []
    for child in base.iterdir():
        if child.is_dir() and (child / "EXECUTE_EARLIEST_UNIX.txt").is_file():
            candidates.append(child)
    if candidates:
        candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        return candidates[0]

    stamp_file = base / "latest-stamp.txt"
    if stamp_file.is_file():
        stamp = stamp_file.read_text(encoding="utf-8").strip()
        p = base / stamp
        if p.is_dir():
            return p

    raise FileNotFoundError(
        f"no HAT-R1 session with EXECUTE_EARLIEST_UNIX.txt under {base} — set HAT_R1_EVID_DIR"
    )


def hat_r1_rel_path(root: Path, evid_dir: Path | None = None) -> str:
    d = evid_dir or resolve_hat_r1_evid_dir(root)
    return d.relative_to(root.resolve()).as_posix()


def hat_r1_stamp(evid_dir: Path | None = None, root: Path | None = None) -> str:
    d = evid_dir or resolve_hat_r1_evid_dir(root)
    return d.name
