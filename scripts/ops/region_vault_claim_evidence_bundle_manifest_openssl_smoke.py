#!/usr/bin/env python3
# B-374: non-interactive Ed25519 sign/verify smoke over bundle_merkle.json (OpenSSL 3; CI-friendly).
from __future__ import annotations

import argparse
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

IMPLEMENTATION_TT = "TT-B374-BUNDLE-MERKLE-MANIFEST-ED25519-OPENSSL-SMOKE-001"
MOTHER_TABLE = "B-374"


def _run(argv: list[str]) -> None:
    subprocess.run(argv, check=True, capture_output=True)


def run_smoke() -> dict[str, Any]:
    spec = importlib.util.spec_from_file_location(
        "merkle", Path(__file__).resolve().parent / "region_vault_claim_evidence_bundle_merkle.py"
    )
    assert spec and spec.loader
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)

    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        for name in m.DEFAULT_FILES:
            (d / name).write_bytes(b"{}\n")
        body, code = m.build_bundle(d, m.DEFAULT_FILES, allow_missing=False)
        if code != 0:
            raise RuntimeError(f"build_bundle failed: {body}")
        man_path = d / "bundle_merkle.json"
        man_path.write_text(json.dumps(body, ensure_ascii=False) + "\n", encoding="utf-8")

        key = d / "ed25519.pem"
        pub = d / "ed25519.pub.pem"
        sig = d / "bundle_merkle.sig"
        _run(["openssl", "genpkey", "-algorithm", "ED25519", "-out", str(key)])
        _run(["openssl", "pkey", "-in", str(key), "-pubout", "-out", str(pub)])
        _run(
            [
                "openssl",
                "pkeyutl",
                "-sign",
                "-inkey",
                str(key),
                "-rawin",
                "-in",
                str(man_path),
                "-out",
                str(sig),
            ]
        )
        _run(
            [
                "openssl",
                "pkeyutl",
                "-verify",
                "-pubin",
                "-inkey",
                str(pub),
                "-rawin",
                "-in",
                str(man_path),
                "-sigfile",
                str(sig),
            ]
        )
        return {
            "anchor": "14-REGIONVAULT-CLAIM-EVIDENCE-BUNDLE-MANIFEST-OPENSSL-SMOKE-V1",
            "implementation_tt": IMPLEMENTATION_TT,
            "mother_table": MOTHER_TABLE,
            "manifest_path": str(man_path),
            "merkle_root_sha256_hex": body.get("merkle_root_sha256_hex"),
            "openssl_verify_exit": 0,
        }


def _cmd_self_test(_: argparse.Namespace) -> int:
    out = run_smoke()
    assert out.get("implementation_tt") == IMPLEMENTATION_TT
    assert str(out.get("merkle_root_sha256_hex") or "")
    print("region_vault_claim_evidence_bundle_manifest_openssl_smoke: OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="B-374 OpenSSL Ed25519 manifest smoke")
    sub = ap.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("self-test")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
