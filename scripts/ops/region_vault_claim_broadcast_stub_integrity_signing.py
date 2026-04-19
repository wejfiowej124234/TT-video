#!/usr/bin/env python3
# B-301: optional detached-signature gate for broadcast_request_stub.json (minisign or GPG).
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

B301_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-STUB-INTEGRITY-SIGNING-V1"
B301_RULE_VERSION = "region_vault_claim_broadcast_stub_integrity_signing_v1"
IMPLEMENTATION_TT = "TT-B301-STUB-INTEGRITY-SIGNING-OPTIONAL-001"
MOTHER_TABLE = "B-301"


def _default_minisig_path(stub_path: Path) -> Path:
    return stub_path.with_name(stub_path.name + ".minisig")


def _default_gpg_asc_path(stub_path: Path) -> Path:
    return stub_path.with_name(stub_path.name + ".asc")


def verify_minisign(*, stub_path: Path, signature_path: Path) -> dict[str, Any]:
    exe = shutil.which("minisign")
    if not exe:
        raise ValueError("minisign not found on PATH (install minisign for B-301 minisign mode)")
    if not stub_path.is_file():
        raise ValueError(f"stub not found: {stub_path}")
    if not signature_path.is_file():
        raise ValueError(f"minisign signature not found: {signature_path}")
    cp = subprocess.run(
        [exe, "-V", "-m", str(stub_path), "-x", str(signature_path)],
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    ok = cp.returncode == 0
    tail = ((cp.stderr or "") + (cp.stdout or ""))[-4000:]
    return {
        "anchor": B301_ANCHOR,
        "rule_version": B301_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "tool": "minisign",
        "stub_path": str(stub_path.resolve()),
        "signature_path": str(signature_path.resolve()),
        "exit_code": cp.returncode,
        "verify_verdict": "GO" if ok else "NO_GO",
        "output_tail": tail,
    }


def verify_gpg_detached(*, stub_path: Path, asc_path: Path) -> dict[str, Any]:
    gpg = shutil.which("gpg") or shutil.which("gpg2")
    if not gpg:
        raise ValueError("gpg not found on PATH (install GnuPG for B-301 gpg mode)")
    if not stub_path.is_file():
        raise ValueError(f"stub not found: {stub_path}")
    if not asc_path.is_file():
        raise ValueError(f"GPG detached signature not found: {asc_path}")
    cp = subprocess.run(
        [gpg, "--verify", "--batch", "--status-fd", "1", str(asc_path), str(stub_path)],
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    out = ((cp.stderr or "") + (cp.stdout or ""))
    ok = cp.returncode == 0
    tail = out[-4000:]
    return {
        "anchor": B301_ANCHOR,
        "rule_version": B301_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "tool": "gpg",
        "stub_path": str(stub_path.resolve()),
        "signature_path": str(asc_path.resolve()),
        "exit_code": cp.returncode,
        "verify_verdict": "GO" if ok else "NO_GO",
        "output_tail": tail,
    }


def verify_stub_integrity(
    *,
    stub_path: Path,
    mode: str,
    signature_path: Path | None = None,
) -> dict[str, Any]:
    """
    mode: minisign | gpg | auto — auto prefers .minisig beside stub, else .asc.
    Raises ValueError when mode is invalid or verification cannot run.
    """
    m = mode.strip().lower()
    if m not in ("minisign", "gpg", "auto"):
        raise ValueError("mode must be minisign, gpg, or auto")
    stub_path = stub_path.resolve()

    if m == "auto":
        ms = _default_minisig_path(stub_path)
        asc = _default_gpg_asc_path(stub_path)
        if ms.is_file():
            return verify_minisign(stub_path=stub_path, signature_path=ms)
        if asc.is_file():
            return verify_gpg_detached(stub_path=stub_path, asc_path=asc)
        raise ValueError(
            f"B-301 auto: no {_default_minisig_path(stub_path).name} or {_default_gpg_asc_path(stub_path).name} next to stub"
        )

    if m == "minisign":
        sig = signature_path.resolve() if signature_path is not None else _default_minisig_path(stub_path)
        return verify_minisign(stub_path=stub_path, signature_path=sig)

    sig = signature_path.resolve() if signature_path is not None else _default_gpg_asc_path(stub_path)
    return verify_gpg_detached(stub_path=stub_path, asc_path=sig)


def _cmd_verify(args: argparse.Namespace) -> int:
    rep = verify_stub_integrity(
        stub_path=Path(args.stub),
        mode=str(args.mode),
        signature_path=Path(args.signature) if args.signature else None,
    )
    print(json.dumps(rep, indent=2, ensure_ascii=False))
    if rep.get("verify_verdict") != "GO":
        print("stub_integrity_signing: verify NO_GO", file=sys.stderr)
        return 1
    print("stub_integrity_signing: verify OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        stub = root / "broadcast_request_stub.json"
        stub.write_text("{}\n", encoding="utf-8")
        try:
            verify_stub_integrity(stub_path=stub, mode="auto")
        except ValueError:
            pass
        else:
            raise AssertionError("auto verify without sig should fail")

        ms = shutil.which("minisign")
        if ms:
            sec = root / "minisign.key"
            pub = root / "minisign.pub"
            # Non-interactive keygen (empty password)
            p1 = subprocess.run(
                [ms, "-G", "-p", str(pub), "-s", str(sec)],
                input="\n\n",
                capture_output=True,
                text=True,
                timeout=60,
                check=False,
            )
            if p1.returncode != 0 and not sec.is_file():
                print(
                    "stub_integrity_signing: self-test skip minisign keygen "
                    f"(exit={p1.returncode} stderr={p1.stderr!r})",
                    file=sys.stderr,
                )
            else:
                sigf = root / "broadcast_request_stub.json.minisig"
                p2 = subprocess.run(
                    [ms, "-S", "-s", str(sec), "-m", str(stub), "-x", str(sigf)],
                    input="\n",
                    capture_output=True,
                    text=True,
                    timeout=60,
                    check=False,
                )
                if p2.returncode == 0 and sigf.is_file():
                    rep = verify_stub_integrity(stub_path=stub, mode="minisign", signature_path=sigf)
                    assert rep.get("verify_verdict") == "GO", rep
                else:
                    print(
                        "stub_integrity_signing: self-test skip minisign sign "
                        f"(exit={p2.returncode} stderr={p2.stderr!r})",
                        file=sys.stderr,
                    )

    print(f"region_vault_claim_broadcast_stub_integrity_signing self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=f"{MOTHER_TABLE}: stub detached-signature verify ({IMPLEMENTATION_TT}).")
    sub = ap.add_subparsers(dest="cmd", required=True)

    vf = sub.add_parser("verify", help="verify minisign or gpg detached signature for stub JSON")
    vf.add_argument("--stub", required=True, metavar="PATH", help="broadcast_request_stub.json")
    vf.add_argument("--mode", choices=("minisign", "gpg", "auto"), required=True)
    vf.add_argument("--signature", metavar="PATH", help="override signature path (default: stub.minisig or stub.asc)")
    vf.set_defaults(func=_cmd_verify)

    st = sub.add_parser("self-test", help="structural checks + optional minisign round-trip")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"stub_integrity_signing: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
