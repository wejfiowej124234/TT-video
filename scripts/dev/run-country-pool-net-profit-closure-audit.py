#!/usr/bin/env python3
"""GAP-IDX-NP-004 · Country Pool Net Profit full pipeline closure audit (① local)."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVID_ROOT = Path(os.environ.get("NP004_EVID", ROOT / "evidence/GO_country_pool_net_profit_closure"))


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace") if p.is_file() else ""


def main() -> int:
    checks: list[tuple[str, bool, str, str]] = []
    indexer = ROOT / "crates/api/src/chain/country_pool_net_profit_indexer.rs"
    db_mod = ROOT / "crates/api/src/db/country_pool_net_profit.rs"
    migration = ROOT / "crates/api/migrations/20260712100000_country_pool_net_profit_events.sql"
    gov_api = ROOT / "crates/api/src/routes/governance/governance_net_profit_ledger.rs"
    admin_api = ROOT / "crates/api/src/routes/admin/admin_net_profit_ledger_http.rs"
    fe_page = ROOT / "frontend/app/governance/net-profit-ledger/page.tsx"
    reconcile = _read(ROOT / "crates/api/src/chain_off/reconcile.rs")
    tick = _read(ROOT / "crates/api/src/routes/internal/indexer/tick.rs")

    checks.append(("IDX-np-indexer-module", indexer.is_file(), str(indexer), "error"))
    checks.append(("DB-np-projection-module", db_mod.is_file(), str(db_mod), "error"))
    checks.append(("DB-np-migration", migration.is_file(), str(migration), "error"))
    checks.append(("API-governance-net-profit", gov_api.is_file(), str(gov_api), "error"))
    checks.append(("API-admin-net-profit", admin_api.is_file(), str(admin_api), "error"))
    checks.append(("FE-governance-net-profit-page", fe_page.is_file(), str(fe_page), "error"))
    checks.append(
        (
            "IDX-reconcile-topic0",
            "NetProfitSplit" in reconcile and "EpochOpened" in reconcile,
            "reconcile.rs event_name_from_topic0",
            "error",
        )
    )
    checks.append(
        (
            "IDX-tick-persist-hook",
            "persist_net_profit_indexer_event" in tick,
            "indexer tick NP-004 hook",
            "error",
        )
    )
    checks.append(
        (
            "REG-decoder-yaml",
            (ROOT / "registry/event-decoders/country-pool-net-profit-v1.yaml").is_file(),
            "country-pool-net-profit-v1.yaml",
            "error",
        )
    )

    cargo = shutil.which("cargo") or "cargo"
    ct = subprocess.run(
        [
            cargo,
            "test",
            "-p",
            "traveltrust-api",
            "country_pool_net_profit",
            "--",
            "--nocapture",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=600,
    )
    checks.append(
        (
            "TEST-np-indexer-unit",
            ct.returncode == 0,
            "cargo test country_pool_net_profit",
            "error",
        )
    )

    failed = [c for c in checks if not c[1]]
    critical = [c for c in failed if c[3] == "error"]
    verdict = "FAIL" if critical else ("WARN" if failed else "PASS")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = EVID_ROOT / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "gap_id": "GAP-IDX-NP-004",
        "verdict": verdict,
        "phase": "①",
        "timestamp_utc": stamp,
        "checks": [
            {"id": c[0], "pass": c[1], "detail": c[2], "severity": c[3]} for c in checks
        ],
        "pipeline": [
            "Contract Event",
            "Indexer",
            "Database",
            "API",
            "Frontend",
            "Accounting",
            "Audit",
        ],
    }
    (out_dir / "NP-004-CLOSURE-AUDIT.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    md = [
        "# GAP-IDX-NP-004 · Country Pool Net Profit Closure Audit",
        "",
        f"**Verdict:** {verdict}",
        f"**Phase:** ① local",
        "",
        "| Check | Pass | Detail |",
        "|-------|------|--------|",
    ]
    for c in checks:
        md.append(f"| {c[0]} | {'✅' if c[1] else '❌'} | {c[2]} |")
    md.append("")
    md.append("## Pipeline")
    for step in report["pipeline"]:
        md.append(f"- {step}")
    (out_dir / "NP-004-CLOSURE-AUDIT.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    latest = EVID_ROOT / "LATEST.json"
    latest.write_text(json.dumps({"stamp": stamp, "verdict": verdict}, indent=2) + "\n", encoding="utf-8")

    print(f"TT_NP004_AUDIT_SUMMARY: verdict={verdict} stamp={stamp} checks={len(checks)} failed={len(failed)}")
    return 0 if verdict != "FAIL" else 1


if __name__ == "__main__":
    sys.exit(main())
