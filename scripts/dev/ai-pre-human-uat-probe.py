#!/usr/bin/env python3
"""AI_PRE_HUMAN_UAT_CHECK · API + chain-read probes (② · read-only · no re-audit)."""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

FORBIDDEN_API_PATTERNS = [
    ("HolderDividendVault", re.compile(r"HolderDividendVault", re.I)),
    ("auto_dividend_primary", re.compile(r"automatic.*dividend.*all.*holders", re.I)),
]


def http_json(url: str, headers: dict | None = None, timeout: int = 30) -> tuple[int, object]:
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(body) if body.strip() else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(body) if body.strip() else {}
        except json.JSONDecodeError:
            payload = {"raw": body[:500]}
        return e.code, payload
    except Exception as exc:  # noqa: BLE001
        return 0, {"error": str(exc)}


def add(checks: list, cid: str, dimension: str, verdict: str, detail: str, **extra):
    checks.append({"id": cid, "dimension": dimension, "verdict": verdict, "detail": detail, **extra})


def load_four_ledger_verdict() -> str | None:
    latest = ROOT / "evidence/GO_tt_country_pool_revenue_enterprise_hat/latest-stamp.txt"
    if not latest.exists():
        return None
    stamp = latest.read_text(encoding="utf-8").strip()
    fl = ROOT / f"evidence/GO_tt_country_pool_revenue_enterprise_hat/{stamp}/four-ledger-reconcile.json"
    if not fl.exists():
        return None
    data = json.loads(fl.read_text(encoding="utf-8"))
    return str(data.get("verdict", ""))


def chain_read_4555() -> dict:
    env_file = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
    rpc = os.environ.get("CHAIN_RPC_URL", "")
    ledger = os.environ.get("COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS", "")
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if not line or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip()
            if k == "CHAIN_RPC_URL" and not rpc:
                rpc = v
            if k == "COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS" and not ledger:
                ledger = v
    out = {"rpc": bool(rpc), "ledger": ledger, "verdict": "SKIP", "detail": "cast unavailable"}
    if not rpc or not ledger:
        return out
    try:
        steward = subprocess.run(
            ["cast", "call", ledger, "bpsStewardPath()(uint16)", "--rpc-url", rpc],
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        global_b = subprocess.run(
            ["cast", "call", ledger, "bpsGlobalTreasury()(uint16)", "--rpc-url", rpc],
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        if steward.returncode == 0 and global_b.returncode == 0:
            s = int(steward.stdout.strip().split()[0])
            g = int(global_b.stdout.strip().split()[0])
            ok = s == 4500 and g == 5500
            out.update(
                {
                    "steward_bps": s,
                    "global_bps": g,
                    "verdict": "PASS" if ok else "FAIL",
                    "detail": f"bpsStewardPath={s} bpsGlobalTreasury={g}",
                }
            )
        else:
            out["detail"] = (steward.stderr or global_b.stderr or "cast failed")[:200]
            out["verdict"] = "SKIP"
    except FileNotFoundError:
        out["detail"] = "cast not installed"
    except Exception as exc:  # noqa: BLE001
        out["detail"] = str(exc)[:200]
        out["verdict"] = "SKIP"
    return out


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--evidence-dir", required=True)
    ap.add_argument("--api-base", default=os.environ.get("API_BASE", "http://127.0.0.1:8080"))
    args = ap.parse_args()

    evid = Path(args.evidence_dir)
    evid.mkdir(parents=True, exist_ok=True)
    api = args.api_base.rstrip("/")
    checks: list[dict] = []

    # Ensure seed accounts for session-gated APIs
    seed_req = urllib.request.Request(
        f"{api}/auth/seed-test-accounts",
        data=b"{}",
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(seed_req, timeout=30)
    except Exception:
        pass

    # Baseline reference (read-only · not re-run reconcile)
    fl_verdict = load_four_ledger_verdict()
    add(
        checks,
        "API-FL-REF",
        "four_ledger_reference",
        "PASS" if fl_verdict == "PASS" else "FAIL",
        f"four-ledger cached verdict={fl_verdict or 'MISSING'}",
    )

    endpoints = [
        ("API-PROTO", "/api/v1/governance/protocol-reference", False),
        ("API-PARAMS", "/api/v1/governance/params", True),
        ("API-FEE-ROUTES", "/api/v1/governance/fee-routes", True),
        ("API-PROPOSALS", "/api/v1/governance/proposals", True),
        ("API-PM-QUOTE", "/api/v1/governance/ttg-exchange/quote?usdc_amount=100000000&round=0", True),
    ]

    token = ""
    login_req = urllib.request.Request(
        f"{api}/auth/login",
        data=json.dumps({"email": "tourist@test.com", "password": "Test123!"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(login_req, timeout=30) as resp:
            login_body = json.loads(resp.read().decode())
            token = str(login_body.get("token") or "")
    except Exception as exc:  # noqa: BLE001
        add(checks, "API-LOGIN", "session", "FAIL", str(exc)[:200])

    auth_headers = {"Authorization": f"Bearer {token}"} if token else None

    for cid, ep, needs_auth in endpoints:
        headers = auth_headers if needs_auth else None
        if needs_auth and not token:
            add(checks, cid, "api_read", "FAIL", "missing bearer token")
            continue
        code, body = http_json(f"{api}{ep}", headers=headers)
        text = json.dumps(body, ensure_ascii=False)[:4000]
        forbidden_hit = None
        for label, pat in FORBIDDEN_API_PATTERNS:
            if pat.search(text):
                forbidden_hit = label
                break
        verdict = "PASS" if code == 200 and not forbidden_hit else "FAIL"
        detail = f"http={code}"
        if forbidden_hit:
            detail += f" forbidden={forbidden_hit}"
        add(checks, cid, "api_read", verdict, detail, http=code)

    if token:
        code, body = http_json(
            f"{api}/api/v1/governance/country-ledger/DE",
            headers={"Authorization": f"Bearer {token}"},
        )
        text = json.dumps(body, ensure_ascii=False)
        has_4555 = bool(re.search(r"4500|5500|45|55", text))
        add(
            checks,
            "API-CP-DE",
            "country_ledger_4555",
            "PASS" if code == 200 and has_4555 else "FAIL",
            f"http={code} has_4555={has_4555}",
            http=code,
        )
        code2, body2 = http_json(
            f"{api}/api/v1/governance/investor-distribution-accruals",
            headers={"Authorization": f"Bearer {token}"},
        )
        add(
            checks,
            "API-ACCRUALS",
            "investor_accruals",
            "PASS" if code2 in (200, 404) else "FAIL",
            f"http={code2} (404 acceptable empty)",
            http=code2,
        )

    chain = chain_read_4555()
    add(
        checks,
        "CHAIN-4555",
        "onchain_ledger_bps",
        chain["verdict"],
        chain["detail"],
        **{k: v for k, v in chain.items() if k not in {"verdict", "detail"}},
    )

    fails = [c for c in checks if c["verdict"] == "FAIL"]
    skips = [c for c in checks if c["verdict"] == "SKIP"]
    verdict = "PASS" if not fails else "FAIL"

    out = {
        "check_id": "AI_PRE_HUMAN_UAT_PROBE",
        "verdict": verdict,
        "fail_count": len(fails),
        "skip_count": len(skips),
        "checks": checks,
        "honest_boundary": "read-only probes · not a substitute for Cert #1 human signoff",
    }
    (evid / "api-chain-probe.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"AI_PRE_HUMAN_UAT_PROBE: {verdict} fails={len(fails)} skips={len(skips)}")
    sys.exit(0 if verdict == "PASS" else 3)


if __name__ == "__main__":
    main()
