#!/usr/bin/env python3
"""
IMP-EV-001: Lightweight validation for evidence/GO_* bundle manifest.json.

Checks required fields per evidence/README.md (manifest 格式与必填字段).
Optional: manifest.sha256 sidecar vs manifest.json bytes; optional artifact file hashes.

Does NOT replace 08-4 legal sign-off or 08-2 review metadata.

Usage:
  python3 scripts/dev/validate_evidence_manifest.py validate [DIR] [--emit-summary]
  python3 scripts/dev/validate_evidence_manifest.py self-test

DIR defaults to current working directory (the GO bundle root).
With --emit-summary, stdout is a single JSON object (schema validate_summary.v1_1; machine-readable);
human OK line goes to stderr. See docs/runbook/evidence-gate.md.
"""

from __future__ import annotations

import argparse
import contextlib
import hashlib
import io
import json
import re
import sys
import tempfile
from pathlib import Path

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SHA256_HEX_RE = re.compile(r"^[0-9a-f]{64}$")


def _is_under_root(root: Path, candidate: Path) -> bool:
    root_r = root.resolve()
    try:
        cand_r = candidate.resolve()
    except OSError:
        return False
    return cand_r == root_r or root_r in cand_r.parents


def _fail(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def _read_json(path: Path) -> dict:
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as e:
        _fail(f"validate-evidence-manifest: cannot read {path}: {e}")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        _fail(f"validate-evidence-manifest: invalid JSON in {path}: {e}")
    if not isinstance(data, dict):
        _fail(f"validate-evidence-manifest: {path} root must be a JSON object")
    return data


def _parse_manifest_sha256(path: Path) -> str | None:
    if not path.is_file():
        return None
    line = path.read_text(encoding="utf-8").strip().splitlines()
    if not line:
        _fail(f"validate-evidence-manifest: empty {path}")
    # sha256sum format: "<hex>  manifest.json" or "<hex> *manifest.json"
    first = line[0].strip()
    parts = first.split()
    if not parts:
        _fail(f"validate-evidence-manifest: malformed {path}")
    hx = parts[0].lower()
    if not SHA256_HEX_RE.match(hx):
        _fail(f"validate-evidence-manifest: first token in {path} is not 64 hex chars")
    return hx


def validate_manifest_structure(data: dict, *, label: str) -> None:
    for key in ("gate", "date", "artifacts", "sign_off"):
        if key not in data:
            _fail(f"validate-evidence-manifest: {label} missing required key {key!r}")

    gate = data["gate"]
    if not isinstance(gate, str) or not gate.strip():
        _fail(f"validate-evidence-manifest: {label} gate must be a non-empty string")

    date = data["date"]
    if not isinstance(date, str) or not DATE_RE.match(date.strip()):
        _fail(
            f"validate-evidence-manifest: {label} date must be YYYY-MM-DD, got {date!r}"
        )

    arts = data["artifacts"]
    if not isinstance(arts, list) or len(arts) < 1:
        _fail(f"validate-evidence-manifest: {label} artifacts must be a non-empty array")

    for i, item in enumerate(arts):
        if not isinstance(item, dict):
            _fail(f"validate-evidence-manifest: {label} artifacts[{i}] must be an object")
        if "path" not in item or "sha256" not in item:
            _fail(
                f"validate-evidence-manifest: {label} artifacts[{i}] must have path and sha256"
            )
        p, h = item["path"], item["sha256"]
        if not isinstance(p, str) or not p.strip():
            _fail(f"validate-evidence-manifest: {label} artifacts[{i}].path invalid")
        if not isinstance(h, str) or not SHA256_HEX_RE.match(h.strip().lower()):
            _fail(
                f"validate-evidence-manifest: {label} artifacts[{i}].sha256 must be 64 lowercase hex chars"
            )
        if h.strip().lower() != h.lower():
            _fail(
                f"validate-evidence-manifest: {label} artifacts[{i}].sha256 must be lowercase hex"
            )

    so = data["sign_off"]
    if not isinstance(so, list) or len(so) < 1:
        _fail(f"validate-evidence-manifest: {label} sign_off must be a non-empty array")
    for i, s in enumerate(so):
        if not isinstance(s, str) or not s.strip():
            _fail(f"validate-evidence-manifest: {label} sign_off[{i}] must be non-empty string")

    if "dual_score" in data:
        ds = data["dual_score"]
        if not isinstance(ds, dict):
            _fail(f"validate-evidence-manifest: {label} dual_score must be object")
        if "path" not in ds or "sha256" not in ds:
            _fail(
                f"validate-evidence-manifest: {label} dual_score must have path and sha256"
            )
        dp, dh = ds["path"], ds["sha256"]
        if not isinstance(dp, str) or not dp.strip():
            _fail(f"validate-evidence-manifest: {label} dual_score.path invalid")
        if not isinstance(dh, str) or not SHA256_HEX_RE.match(dh.strip().lower()):
            _fail(
                f"validate-evidence-manifest: {label} dual_score.sha256 must be 64 lowercase hex chars"
            )
        if dh.strip().lower() != dh.lower():
            _fail(
                f"validate-evidence-manifest: {label} dual_score.sha256 must be lowercase hex"
            )


SUMMARY_SCHEMA = "traveltrust.evidence_manifest.validate_summary.v1_1"


def validate_bundle(root: Path, *, verify_artifact_files: bool, emit_summary: bool) -> None:
    manifest_path = root / "manifest.json"
    if not manifest_path.is_file():
        _fail(f"validate-evidence-manifest: missing {manifest_path}")

    data = _read_json(manifest_path)
    validate_manifest_structure(data, label=str(manifest_path))

    manifest_json_bytes = manifest_path.stat().st_size
    artifacts_declared_count = len(data["artifacts"])

    sidecar = root / "manifest.sha256"
    expected = _parse_manifest_sha256(sidecar)
    sidecar_present = expected is not None
    manifest_sidecar_hash_ok: bool | None
    if expected is not None:
        digest = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
        if digest != expected:
            _fail(
                f"validate-evidence-manifest: manifest.json sha256 mismatch: "
                f"computed {digest}, manifest.sha256 has {expected}"
            )
        manifest_sidecar_hash_ok = True
    else:
        manifest_sidecar_hash_ok = None

    artifact_paths_verified_count = 0
    total_bytes_artifacts = 0
    if verify_artifact_files:
        for i, item in enumerate(data["artifacts"]):
            rel = item["path"].strip()
            fp = (root / rel)
            if not _is_under_root(root, fp):
                _fail(
                    f"validate-evidence-manifest: artifacts[{i}] path escapes bundle root: {rel}"
                )
            fp = fp.resolve()
            if not fp.is_file():
                _fail(
                    f"validate-evidence-manifest: artifacts[{i}] path not found: {rel} (under {root})"
                )
            raw = fp.read_bytes()
            total_bytes_artifacts += len(raw)
            artifact_paths_verified_count += 1
            hx = hashlib.sha256(raw).hexdigest()
            want = item["sha256"].strip().lower()
            if hx != want:
                _fail(
                    f"validate-evidence-manifest: artifacts[{i}] sha256 mismatch for {rel}: "
                    f"computed {hx}, manifest has {want}"
                )

        if "dual_score" in data:
            ds = data["dual_score"]
            rel = ds["path"].strip()
            fp = root / rel
            if not _is_under_root(root, fp):
                _fail(
                    f"validate-evidence-manifest: dual_score.path escapes bundle root: {rel}"
                )
            fp = fp.resolve()
            if not fp.is_file():
                _fail(
                    f"validate-evidence-manifest: dual_score path not found: {rel} (under {root})"
                )
            hx = hashlib.sha256(fp.read_bytes()).hexdigest()
            want = ds["sha256"].strip().lower()
            if hx != want:
                _fail(
                    f"validate-evidence-manifest: dual_score sha256 mismatch for {rel}: "
                    f"computed {hx}, manifest has {want}"
                )

    # On success: structural checks passed; sidecar matched if present; artifact hashes if verified.
    all_hash_ok = True

    if emit_summary:
        # CI / 下游契约字段（见 docs/runbook/evidence-gate.md）；成功路径下无缺失文件。
        hash_verified = bool(verify_artifact_files and all_hash_ok)
        summary = {
            "schema": SUMMARY_SCHEMA,
            "bundle_root": str(root.resolve()),
            "status": "GO",
            "artifact_count": artifacts_declared_count,
            "hash_verified": hash_verified,
            "missing_files": [],
            "artifacts_declared_count": artifacts_declared_count,
            "artifact_paths_verified_count": artifact_paths_verified_count,
            "files_count": (
                artifact_paths_verified_count
                if verify_artifact_files
                else artifacts_declared_count
            ),
            "manifest_json_bytes": manifest_json_bytes,
            "manifest_sidecar_present": sidecar_present,
            "manifest_sidecar_hash_ok": manifest_sidecar_hash_ok,
            "total_bytes_artifacts": (
                total_bytes_artifacts if verify_artifact_files else None
            ),
            "total_bytes": manifest_json_bytes + (
                total_bytes_artifacts if verify_artifact_files else 0
            ),
            "verify_artifact_files": verify_artifact_files,
            "all_hash_ok": all_hash_ok,
        }
        print(json.dumps(summary, ensure_ascii=False), file=sys.stdout)

    ok_msg = f"validate-evidence-manifest: OK {root}"
    if emit_summary:
        print(ok_msg, file=sys.stderr)
    else:
        print(ok_msg, file=sys.stdout)


def cmd_self_test() -> None:
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        man = {
            "gate": "Gate-1",
            "date": "2026-04-15",
            "artifacts": [
                {
                    "path": "proof.txt",
                    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                }
            ],
            "sign_off": ["qa"],
        }
        (root / "proof.txt").write_bytes(b"")
        (root / "manifest.json").write_text(
            json.dumps(man, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        h = hashlib.sha256((root / "manifest.json").read_bytes()).hexdigest()
        (root / "manifest.sha256").write_text(f"{h}  manifest.json\n", encoding="utf-8")

        validate_bundle(root, verify_artifact_files=True, emit_summary=False)

    # invalid: missing gate (suppress expected stderr noise)
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        bad = {"date": "2026-04-15", "artifacts": [], "sign_off": ["x"]}
        (root / "manifest.json").write_text(json.dumps(bad), encoding="utf-8")
        buf = io.StringIO()
        with contextlib.redirect_stderr(buf):
            try:
                validate_bundle(root, verify_artifact_files=False, emit_summary=False)
            except SystemExit as e:
                if e.code != 1:
                    raise
            else:
                _fail("validate-evidence-manifest: self-test expected failure for bad manifest", 2)

    print("validate-evidence-manifest: self-test OK")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate evidence GO bundle manifest.json (IMP-EV-001)."
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_val = sub.add_parser("validate", help="Validate manifest.json under DIR (default: cwd)")
    p_val.add_argument(
        "dir",
        nargs="?",
        default=".",
        help="GO bundle root (directory containing manifest.json)",
    )
    p_val.add_argument(
        "--verify-artifact-files",
        action="store_true",
        help="Check each artifacts[].path exists under DIR and sha256 matches file content",
    )
    p_val.add_argument(
        "--emit-summary",
        action="store_true",
        help=(
            "Print one JSON line (validate_summary.v1_1, see docs/runbook/evidence-gate.md); "
            "human OK line goes to stderr. Does not change validation rules."
        ),
    )

    sub.add_parser("self-test", help="Run built-in positive/negative checks and exit 0")

    args = parser.parse_args()
    if args.cmd == "self-test":
        cmd_self_test()
        return

    root = Path(args.dir).resolve()
    if not root.is_dir():
        _fail(f"validate-evidence-manifest: not a directory: {root}")
    validate_bundle(
        root,
        verify_artifact_files=args.verify_artifact_files,
        emit_summary=args.emit_summary,
    )


if __name__ == "__main__":
    main()
