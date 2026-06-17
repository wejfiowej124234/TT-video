#!/usr/bin/env python3
"""Apply cert step overrides and mark ledger rows (Windows-safe)."""
from __future__ import annotations

import argparse
import datetime
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_cert_steps() -> dict:
    spec_path = ROOT / "scripts/dev/gen-ttg-cert-execution-ledger.py"
    spec = importlib.util.spec_from_file_location("ledger", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.CERT_STEPS  # type: ignore[attr-defined]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cert", type=int, required=True)
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--signer", default="")
    ap.add_argument("--evidence-dir", default="")
    args = ap.parse_args()

    evid = args.evidence_dir or f"evidence/GO_ttg_cert/{args.stamp}"
    ledger_path = ROOT / evid / "CERT-EXECUTION-LEDGER.v1.json"
    overrides_path = ROOT / "docs/spec/governance-token/artifacts/ttg-governance-tier-overrides.v1.json"

    if not ledger_path.is_file():
        print(f"complete-cert: missing {ledger_path}", file=sys.stderr)
        sys.exit(2)

    ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    data = json.loads(overrides_path.read_text(encoding="utf-8"))
    cert = args.cert
    if str(cert) not in ledger.get("cert_steps", {}):
        print(f"complete-cert: unknown cert step {cert}", file=sys.stderr)
        sys.exit(2)

    cert_steps = load_cert_steps()
    meta = cert_steps[cert]
    target = meta["target_tier"]

    for cid in meta["ids"]:
        data.setdefault("overrides", {})[cid] = target

    done = data.setdefault("cert_queue_completed", [])
    if cert not in done:
        done.append(cert)
        done.sort()

    data.setdefault("signoffs", {})[str(cert)] = {
        "cert": cert,
        "name": meta["name"],
        "target_tier": target,
        "signed_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "signer": args.signer or None,
        "evidence_dir": evid.replace("\\", "/"),
    }
    overrides_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    for row in ledger["rows"]:
        if row.get("cert_step") == cert:
            row["execution_status"] = "DONE"
    ledger_path.write_text(json.dumps(ledger, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"TTG_CERT_COMPLETE: cert={cert} ids={len(meta['ids'])} tier={target}")


if __name__ == "__main__":
    main()
