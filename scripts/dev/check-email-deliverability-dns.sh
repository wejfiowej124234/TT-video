#!/usr/bin/env bash
# 公网验证 web3-ttg.com 出站认证：SPF(send) · DKIM(resend._domainkey) · DMARC。
# 不改 DNS、不部署、不碰邮件模板。仓库根：bash scripts/dev/check-email-deliverability-dns.sh
# 写出：docs/runbook/TT-EMAIL-DELIVERABILITY-DNS-CHECK-LATEST.json
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
python - <<'PY'
from __future__ import annotations

import json
import re
import ssl
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

DOMAIN = "web3-ttg.com"
OUT = Path("docs/runbook/TT-EMAIL-DELIVERABILITY-DNS-CHECK-LATEST.json")
ctx = ssl.create_default_context()


def doh(name: str, typ: str = "TXT") -> dict:
    url = f"https://dns.google/resolve?name={name}&type={typ}"
    with urllib.request.urlopen(url, timeout=20, context=ctx) as r:
        data = json.load(r)
    answers = []
    for a in data.get("Answer") or []:
        d = a.get("data", "")
        if '"' in d:
            d = "".join(re.findall(r'"([^"]*)"', d)) or d
        answers.append(d)
    return {"status": data.get("Status"), "answers": answers}


rows: dict = {}
for name, typ in [
    (f"send.{DOMAIN}", "TXT"),
    (f"send.{DOMAIN}", "MX"),
    (f"resend._domainkey.{DOMAIN}", "TXT"),
    (f"_dmarc.{DOMAIN}", "TXT"),
    (f"default._bimi.{DOMAIN}", "TXT"),
    (DOMAIN, "TXT"),
]:
    try:
        rows[f"{name}|{typ}"] = doh(name, typ)
    except Exception as e:  # noqa: BLE001 — surface in JSON
        rows[f"{name}|{typ}"] = {"error": str(e)}


def pass_spf(block: dict) -> bool:
    return any(
        "v=spf1" in x and "amazonses.com" in x for x in (block.get("answers") or [])
    )


def pass_dkim(block: dict) -> bool:
    joined = " ".join(block.get("answers") or [])
    return "p=" in joined and len(joined) > 40


def pass_dmarc(block: dict) -> bool:
    return any(
        x.startswith("v=DMARC1") and ("p=quarantine" in x or "p=reject" in x)
        for x in (block.get("answers") or [])
    )


spf = rows.get(f"send.{DOMAIN}|TXT", {})
dkim = rows.get(f"resend._domainkey.{DOMAIN}|TXT", {})
dmarc = rows.get(f"_dmarc.{DOMAIN}|TXT", {})
apex = rows.get(f"{DOMAIN}|TXT", {})

verdict = {
    "spf_send": "PASS" if pass_spf(spf) else "FAIL",
    "dkim_resend": "PASS" if pass_dkim(dkim) else "FAIL",
    "dmarc": "PASS" if pass_dmarc(dmarc) else "FAIL",
    "apex_spf": (
        "CONFIRM_DESIGN_ABSENT"
        if not any("v=spf1" in x for x in (apex.get("answers") or []))
        else "PRESENT_REVIEW_CONFLICT"
    ),
    "bimi_vmc": "DEFERRED_NON_BLOCKING_HARD_GATE",
}

auth_keys = ("spf_send", "dkim_resend", "dmarc")
overall = "PASS" if all(verdict[k] == "PASS" for k in auth_keys) else "FAIL"

out = {
    "schema": "tt.email_deliverability_dns_check.v1",
    "checked_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "domain": DOMAIN,
    "from_example": f"TravelTrust <noreply@{DOMAIN}>",
    "dns": rows,
    "authentication_verdict": verdict,
    "overall_auth": overall,
    "policy": {
        "staging_domain_bind": "STOPPED_NOT_REQUIRED",
        "email_template_changes": "FROZEN_STOP",
        "bimi_vmc": "DEFERRED_NON_BLOCKING_HARD_GATE",
        "gmail_inbox_gate": "OWNER_ACCEPTANCE",
        "runbook": "docs/runbook/TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST.md",
    },
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(f"TT_EMAIL_DELIVERABILITY_DNS: {overall}")
for k in auth_keys:
    print(f"  {k}: {verdict[k]}")
print(f"  apex_spf: {verdict['apex_spf']}")
print(f"  bimi_vmc: {verdict['bimi_vmc']}")
print(f"wrote {OUT.as_posix()}")
raise SystemExit(0 if overall == "PASS" else 1)
PY
