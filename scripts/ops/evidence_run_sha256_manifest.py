#!/usr/bin/env python3
"""
91 §8.2 — Generate or verify evidence_sha256_manifest.json for a run_<UTC>/ directory.

  generate <abs_or_repo_relative_dir>
  verify   <abs_or_repo_relative_dir>

Writes:
  evidence_sha256_manifest.json — schema traveltrust.evidence_sha256_manifest.v1
  evidence_sha256_manifest.sha256 — hex sha256 of the JSON file (UTF-8, no trailing newline in hash file optional)

Excludes from hashing: the two manifest files themselves, and .git/
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = "traveltrust.evidence_sha256_manifest.v1"
MANIFEST_NAME = "evidence_sha256_manifest.json"
HASH_NAME = "evidence_sha256_manifest.sha256"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolve_dir(arg: str) -> Path:
    p = Path(arg)
    if not p.is_absolute():
        p = repo_root() / p
    p = p.resolve()
    if not p.is_dir():
        print(f"evidence_run_sha256_manifest: not a directory: {p}", file=sys.stderr)
        sys.exit(2)
    return p


def should_skip(path: Path, root: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return True
    parts = rel.parts
    if ".git" in parts:
        return True
    if path.name in (MANIFEST_NAME, HASH_NAME):
        return True
    return False


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def generate(root: Path) -> None:
    files: list[tuple[str, str, int]] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        dp = Path(dirpath)
        for name in filenames:
            fp = dp / name
            if fp.is_symlink():
                continue
            if should_skip(fp, root):
                continue
            rel = str(fp.relative_to(root)).replace("\\", "/")
            st = fp.stat()
            digest = sha256_file(fp)
            files.append((rel, digest, st.st_size))
    files.sort(key=lambda x: x[0])
    try:
        root_rel = str(root.relative_to(repo_root())).replace("\\", "/")
    except ValueError:
        root_rel = str(root)
    payload = {
        "schema": SCHEMA,
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "root_relative": root_rel,
        "file_count": len(files),
        "files": [{"path": rel, "sha256": dg, "size": sz} for rel, dg, sz in files],
    }
    out_json = root / MANIFEST_NAME
    text = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=False) + "\n"
    out_json.write_text(text, encoding="utf-8")
    h = sha256_bytes(text.encode("utf-8"))
    (root / HASH_NAME).write_text(h + "\n", encoding="utf-8")
    print(f"evidence_run_sha256_manifest: wrote {out_json.name} + {HASH_NAME} ({len(files)} files)")


def verify(root: Path) -> None:
    mj = root / MANIFEST_NAME
    hs = root / HASH_NAME
    if not mj.is_file():
        print(f"evidence_run_sha256_manifest: missing {mj}", file=sys.stderr)
        sys.exit(1)
    text = mj.read_text(encoding="utf-8")
    expected_sidecar = hs.read_text(encoding="utf-8").strip() if hs.is_file() else None
    actual_hash = sha256_bytes(text.encode("utf-8"))
    if expected_sidecar and expected_sidecar != actual_hash:
        print(
            f"evidence_run_sha256_manifest: {HASH_NAME} mismatch (manifest file was edited?)",
            file=sys.stderr,
        )
        print(f"  expected: {expected_sidecar}", file=sys.stderr)
        print(f"  actual:   {actual_hash}", file=sys.stderr)
        sys.exit(1)
    data = json.loads(text)
    if data.get("schema") != SCHEMA:
        print("evidence_run_sha256_manifest: unexpected schema", file=sys.stderr)
        sys.exit(1)
    bad = []
    for ent in data.get("files") or []:
        rel = ent.get("path")
        want = ent.get("sha256")
        if not rel or not want:
            bad.append((rel, "missing path/sha256"))
            continue
        fp = root / rel
        if not fp.is_file():
            bad.append((rel, "file missing"))
            continue
        got = sha256_file(fp)
        if got.lower() != str(want).lower():
            bad.append((rel, f"sha256 mismatch got={got}"))
    if bad:
        for rel, msg in bad:
            print(f"  FAIL {rel}: {msg}", file=sys.stderr)
        sys.exit(1)
    print(f"evidence_run_sha256_manifest: OK ({len(data.get('files') or [])} files)")


def main() -> None:
    if len(sys.argv) != 3:
        print(
            "usage: evidence_run_sha256_manifest.py generate|verify <run_dir>",
            file=sys.stderr,
        )
        sys.exit(2)
    cmd, d = sys.argv[1], resolve_dir(sys.argv[2])
    if cmd == "generate":
        generate(d)
    elif cmd == "verify":
        verify(d)
    else:
        print("usage: … generate|verify …", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
