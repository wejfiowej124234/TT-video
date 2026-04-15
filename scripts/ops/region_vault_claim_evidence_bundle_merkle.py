#!/usr/bin/env python3
# B-368: canonical Merkle root over B-262/B-263/B-264/B-266 JSON artifacts in a directory (tamper-evident bundle).
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import tempfile
from pathlib import Path
from typing import Any

ANCHOR = "14-REGIONVAULT-CLAIM-EVIDENCE-BUNDLE-MERKLE-V1"
RULE_VERSION = "region_vault_claim_evidence_bundle_merkle_v1"
IMPLEMENTATION_TT = "TT-B368-B262-B266-CANONICAL-MERKLE-ROOT-001"
MOTHER_TABLE = "B-368"

DEFAULT_FILES = (
    "execution_report.json",
    "receipt_archive.json",
    "onchain_reconcile.json",
    "production_go_report.json",
)


def _leaf_hash(rel_path: str, content: bytes) -> str:
    payload = rel_path.encode("utf-8") + b"\x00" + content
    return hashlib.sha256(payload).hexdigest()


def _merkle_root_hex(leaf_hashes_hex: list[str]) -> str:
    if not leaf_hashes_hex:
        return hashlib.sha256(b"").hexdigest()
    level = [bytes.fromhex(h) for h in leaf_hashes_hex]
    while len(level) > 1:
        nxt: list[bytes] = []
        for i in range(0, len(level), 2):
            a = level[i]
            b = level[i + 1] if i + 1 < len(level) else a
            nxt.append(hashlib.sha256(a + b).digest())
        level = nxt
    return level[0].hex()


def build_bundle(
    directory: Path,
    files: tuple[str, ...],
    *,
    allow_missing: bool,
) -> tuple[dict[str, Any], int]:
    missing: list[str] = []
    leaves: list[dict[str, Any]] = []
    leaf_hexes: list[str] = []
    for name in files:
        p = directory / name
        if not p.is_file():
            missing.append(name)
            continue
        raw = p.read_bytes()
        lh = _leaf_hash(name, raw)
        leaf_hexes.append(lh)
        leaves.append(
            {
                "relative_path": name,
                "leaf_sha256_hex": lh,
                "file_sha256_of_bytes_hex": hashlib.sha256(raw).hexdigest(),
            }
        )
    if missing and not allow_missing:
        return (
            {
                "anchor": ANCHOR,
                "error": "missing_required_files",
                "missing_files": missing,
            },
            1,
        )
    root = _merkle_root_hex(leaf_hexes)
    body: dict[str, Any] = {
        "anchor": ANCHOR,
        "rule_version": RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "bundle_directory": str(directory.resolve()),
        "ordered_files": list(files),
        "leaves": leaves,
        "missing_files": missing,
        "merkle_root_sha256_hex": root,
        "notes": "Leaf = SHA256(relative_path UTF-8 + NUL + raw file bytes); pair-wise SHA256 up the tree.",
    }
    return body, 0


def verify_bundle(directory: Path, manifest: dict[str, Any], files: tuple[str, ...]) -> tuple[bool, str]:
    if manifest.get("anchor") != ANCHOR:
        return False, "manifest.anchor mismatch"
    if str(manifest.get("rule_version") or "") != RULE_VERSION:
        return False, "manifest.rule_version mismatch"
    expected_root = str(manifest.get("merkle_root_sha256_hex") or "").lower()
    if not expected_root:
        return False, "missing merkle_root_sha256_hex"
    rebuilt, _ = build_bundle(directory, files, allow_missing=False)
    if rebuilt.get("error"):
        return False, str(rebuilt.get("error"))
    got = str(rebuilt.get("merkle_root_sha256_hex") or "").lower()
    if got != expected_root:
        return False, f"root mismatch: recomputed {got} vs manifest {expected_root}"
    return True, ""


def _cmd_build(args: argparse.Namespace) -> int:
    body, code = build_bundle(Path(args.dir), tuple(args.files), allow_missing=bool(args.allow_missing))
    outp = Path(args.output)
    outp.write_text(json.dumps(body, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}", file=sys.stderr)
    return code


def _cmd_verify(args: argparse.Namespace) -> int:
    man_path = Path(args.manifest)
    manifest = json.loads(man_path.read_text(encoding="utf-8"))
    files = tuple(args.files)
    ok, msg = verify_bundle(Path(args.dir), manifest, files)
    if not ok:
        print(f"verify: FAIL: {msg}", file=sys.stderr)
        return 1
    print("region_vault_claim_evidence_bundle_merkle: verify OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        for name, blob in [
            ("execution_report.json", b'{"anchor":"x","n":1}\n'),
            ("receipt_archive.json", b'{"anchor":"y","n":2}\n'),
            ("onchain_reconcile.json", b'{"anchor":"z","n":3}\n'),
            ("production_go_report.json", b'{"anchor":"w","n":4}\n'),
        ]:
            (d / name).write_bytes(blob)
        body, c = build_bundle(d, DEFAULT_FILES, allow_missing=False)
        assert c == 0, body
        assert body["merkle_root_sha256_hex"]
        man_path = d / "bundle_merkle.json"
        man_path.write_text(json.dumps(body, indent=2), encoding="utf-8")
        ok, msg = verify_bundle(d, body, DEFAULT_FILES)
        assert ok, msg
        # tamper one byte
        p = d / "execution_report.json"
        p.write_bytes(p.read_bytes() + b"!")
        ok2, msg2 = verify_bundle(d, body, DEFAULT_FILES)
        assert not ok2, "expected tamper fail"

    print("region_vault_claim_evidence_bundle_merkle self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="B-368 evidence bundle Merkle root (build | verify)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build", help="write bundle_merkle.json for a directory")
    b.add_argument("dir", help="directory containing evidence JSON files")
    b.add_argument("-o", "--output", required=True, help="output manifest path")
    b.add_argument(
        "--file",
        dest="files",
        action="append",
        help=f"relative file name (repeatable; default {list(DEFAULT_FILES)})",
    )
    b.add_argument("--allow-missing", action="store_true", help="allow absent files (CI fixtures only)")
    b.set_defaults(func=_cmd_build, files=None)

    v = sub.add_parser("verify", help="recompute Merkle root and compare to manifest")
    v.add_argument("dir", help="directory containing evidence files")
    v.add_argument("manifest", help="bundle_merkle.json from build")
    v.add_argument("--file", dest="files", action="append", help="override ordered file list")
    v.set_defaults(func=_cmd_verify, files=None)

    st = sub.add_parser("self-test", help="embedded tamper test")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    if getattr(args, "files", None) is None:
        args.files = list(DEFAULT_FILES)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
