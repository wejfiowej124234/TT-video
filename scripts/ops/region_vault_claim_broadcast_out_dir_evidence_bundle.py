#!/usr/bin/env python3
# B-295: pack operator OUT_DIR into a tar plus JSON manifest (per-file sha256) and tar sidecar hash.
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import tarfile
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any

BUNDLE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-OUT-DIR-EVIDENCE-BUNDLE-V1"
BUNDLE_RULE_VERSION = "region_vault_claim_broadcast_out_dir_evidence_bundle_v1"
IMPLEMENTATION_TT = "TT-B295-EVIDENCE-BUNDLE-TAR-AND-MANIFEST-001"
MOTHER_TABLE = "B-295"

BUNDLE_TAR_BASENAME = "out_dir_evidence_bundle_b295.tar"
BUNDLE_MANIFEST_BASENAME = "out_dir_evidence_bundle_b295_manifest.json"
BUNDLE_TAR_SHA256_BASENAME = "out_dir_evidence_bundle_b295.tar.sha256"

EXCLUDED_RELATIVE_POSIX: frozenset[str] = frozenset(
    {
        BUNDLE_TAR_BASENAME,
        BUNDLE_MANIFEST_BASENAME,
        BUNDLE_TAR_SHA256_BASENAME,
    }
)


def _sha256_canonical_json(obj: dict[str, Any]) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(body).hexdigest()


def _file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _collect_data_files(out_dir: Path) -> list[tuple[str, Path]]:
    """Return sorted (posix_relative, absolute_path) for regular files, excluding bundle outputs."""
    rows: list[tuple[str, Path]] = []
    for p in sorted(out_dir.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(out_dir).as_posix()
        if rel in EXCLUDED_RELATIVE_POSIX:
            continue
        rows.append((rel, p))
    return rows


def build_manifest_body(
    *,
    out_dir: Path,
    files: list[tuple[str, Path]],
) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    for rel, p in files:
        raw = p.read_bytes()
        entries.append(
            {
                "path": rel,
                "sha256_hex": hashlib.sha256(raw).hexdigest(),
                "size_bytes": len(raw),
            }
        )
    body: dict[str, Any] = {
        "anchor": BUNDLE_ANCHOR,
        "rule_version": BUNDLE_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": _utc_now(),
        "out_dir": str(out_dir.resolve()),
        "manifest_filename": BUNDLE_MANIFEST_BASENAME,
        "tar_filename": BUNDLE_TAR_BASENAME,
        "tar_sha256_sidecar_filename": BUNDLE_TAR_SHA256_BASENAME,
        "files": entries,
        "notes": (
            "B-295: files[] hashes content before bundling; tar contains these members plus the manifest JSON; "
            "tar_sha256_hex is recorded only in the sidecar .tar.sha256 (GNU sha256sum format)."
        ),
    }
    canon = {k: v for k, v in body.items() if k != "bundle_manifest_canonical_sha256_hex"}
    body["bundle_manifest_canonical_sha256_hex"] = _sha256_canonical_json(canon)
    return body


def pack_out_dir(out_dir: Path) -> dict[str, Any]:
    root = out_dir.resolve()
    if not root.is_dir():
        raise ValueError(f"OUT_DIR is not a directory: {root}")
    data_files = _collect_data_files(root)
    manifest_path = root / BUNDLE_MANIFEST_BASENAME
    tar_path = root / BUNDLE_TAR_BASENAME
    sidecar_path = root / BUNDLE_TAR_SHA256_BASENAME

    body = build_manifest_body(out_dir=root, files=data_files)
    manifest_text = json.dumps(body, indent=2, ensure_ascii=False) + "\n"
    manifest_path.write_text(manifest_text, encoding="utf-8")

    buf = BytesIO()
    with tarfile.open(fileobj=buf, mode="w", format=tarfile.PAX_FORMAT) as tf:
        for rel, p in data_files:
            tf.add(p, arcname=rel, recursive=False)
        tf.add(manifest_path, arcname=BUNDLE_MANIFEST_BASENAME, recursive=False)
    tar_bytes = buf.getvalue()
    tar_path.write_bytes(tar_bytes)

    tar_sha = hashlib.sha256(tar_bytes).hexdigest()
    sidecar_line = f"{tar_sha}  {BUNDLE_TAR_BASENAME}\n"
    sidecar_path.write_text(sidecar_line, encoding="utf-8")

    return {
        "out_dir": str(root),
        "wrote_manifest": str(manifest_path),
        "wrote_tar": str(tar_path),
        "wrote_tar_sha256_sidecar": str(sidecar_path),
        "data_file_count": len(data_files),
        "tar_sha256_hex": tar_sha,
        "bundle_manifest_canonical_sha256_hex": body.get("bundle_manifest_canonical_sha256_hex"),
        "implementation_tt": IMPLEMENTATION_TT,
        "mother_table": MOTHER_TABLE,
    }


def verify_out_dir(out_dir: Path) -> dict[str, Any]:
    root = out_dir.resolve()
    manifest_path = root / BUNDLE_MANIFEST_BASENAME
    tar_path = root / BUNDLE_TAR_BASENAME
    sidecar_path = root / BUNDLE_TAR_SHA256_BASENAME
    if not manifest_path.is_file():
        raise ValueError(f"missing manifest: {manifest_path}")
    if not tar_path.is_file():
        raise ValueError(f"missing tar: {tar_path}")
    if not sidecar_path.is_file():
        raise ValueError(f"missing tar sha256 sidecar: {sidecar_path}")

    man: dict[str, Any] = json.loads(manifest_path.read_text(encoding="utf-8"))
    if man.get("anchor") != BUNDLE_ANCHOR:
        raise ValueError("manifest.anchor mismatch")
    if str(man.get("rule_version") or "") != BUNDLE_RULE_VERSION:
        raise ValueError("manifest.rule_version mismatch")
    stored = str(man.get("bundle_manifest_canonical_sha256_hex") or "")
    body = {k: v for k, v in man.items() if k != "bundle_manifest_canonical_sha256_hex"}
    want = _sha256_canonical_json(body)
    if not stored or stored.lower() != want.lower():
        raise ValueError("bundle_manifest_canonical_sha256_hex mismatch (manifest edited or corrupt)")

    files = man.get("files")
    if not isinstance(files, list):
        raise ValueError("manifest.files must be a list")
    for ent in files:
        if not isinstance(ent, dict):
            raise ValueError("manifest.files entries must be objects")
        rel = str(ent.get("path") or "")
        hx = str(ent.get("sha256_hex") or "").lower()
        if not rel or len(hx) != 64:
            raise ValueError(f"invalid manifest.files entry: {ent!r}")
        p = root / rel
        if not p.is_file():
            raise ValueError(f"missing file listed in manifest: {rel}")
        got = _file_sha256(p).lower()
        if got != hx:
            raise ValueError(f"sha256 mismatch for {rel}: disk {got} vs manifest {hx}")

    sc = sidecar_path.read_text(encoding="utf-8").strip().split()
    if len(sc) < 2:
        raise ValueError("tar.sha256 sidecar must be '<hex>  <filename>'")
    want_tar_sha = sc[0].lower()
    if len(want_tar_sha) != 64:
        raise ValueError("tar.sha256 sidecar: bad hash length")
    got_tar = _file_sha256(tar_path).lower()
    if got_tar != want_tar_sha:
        raise ValueError(f"tar sha256 mismatch: disk {got_tar} vs sidecar {want_tar_sha}")

    with tarfile.open(tar_path, mode="r") as tf:
        names = set(tf.getnames())
    for ent in files:
        rel = str(ent.get("path") or "")
        if rel not in names:
            raise ValueError(f"tar missing member for manifest.files path: {rel}")
    if BUNDLE_MANIFEST_BASENAME not in names:
        raise ValueError(f"tar missing manifest member: {BUNDLE_MANIFEST_BASENAME}")

    return {
        "verify": "OK",
        "out_dir": str(root),
        "data_files_verified": len(files),
        "implementation_tt": IMPLEMENTATION_TT,
    }


def _cmd_pack(args: argparse.Namespace) -> int:
    root = Path(args.out_dir).resolve()
    summary = pack_out_dir(root)
    print(json.dumps(summary, indent=2, ensure_ascii=False), file=sys.stdout)
    print("region_vault_claim_broadcast_out_dir_evidence_bundle: pack OK", file=sys.stderr)
    return 0


def _cmd_verify(args: argparse.Namespace) -> int:
    root = Path(args.out_dir).resolve()
    rep = verify_out_dir(root)
    print(json.dumps(rep, indent=2, ensure_ascii=False), file=sys.stdout)
    print("region_vault_claim_broadcast_out_dir_evidence_bundle: verify OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    import tempfile

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        (root / "alpha.txt").write_text("a\n", encoding="utf-8")
        sub = root / "nested"
        sub.mkdir()
        (sub / "beta.json").write_text("{}\n", encoding="utf-8")

        s1 = pack_out_dir(root)
        assert s1.get("data_file_count") == 2
        assert (root / BUNDLE_TAR_BASENAME).is_file()
        v1 = verify_out_dir(root)
        assert v1.get("verify") == "OK"

        # tamper detection
        p_alpha = root / "alpha.txt"
        p_alpha.write_text("b\n", encoding="utf-8")
        try:
            verify_out_dir(root)
        except ValueError:
            pass
        else:
            raise AssertionError("expected verify failure after tamper")

    print(f"region_vault_claim_broadcast_out_dir_evidence_bundle self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=f"{MOTHER_TABLE}: OUT_DIR tar archive + per-file sha256 manifest ({IMPLEMENTATION_TT})."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    pk = sub.add_parser("pack", help=f"write {BUNDLE_TAR_BASENAME}, manifest JSON, and tar sha256 sidecar under OUT_DIR")
    pk.add_argument("--out-dir", required=True, metavar="OUT_DIR", help="operator evidence directory root")
    pk.set_defaults(func=_cmd_pack)

    vf = sub.add_parser("verify", help="verify manifest canonical hash, per-file shas, tar integrity, tar membership")
    vf.add_argument("--out-dir", required=True, metavar="OUT_DIR", help="directory that contains bundle outputs")
    vf.set_defaults(func=_cmd_verify)

    st = sub.add_parser("self-test", help="offline pack+verify+tamper guard")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"out_dir_evidence_bundle: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
