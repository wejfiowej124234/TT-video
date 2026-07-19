#!/usr/bin/env python3
"""
V3.1.1 Full-System Drift Audit (Timelock read-only).

Compares Protocol · Runtime · Registry · CMS · Catalog · OCS · Search ·
API Projection · Docs · Package against ACTIVE = v311_sepolia_clean_baseline.

Does NOT mutate contracts / ACTIVE matrix / Runtime / Registry cutover.
"""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_phase2_v311_final_release"
ACTIVE = "v311_sepolia_clean_baseline"
CHAIN = 11155111
LEGACY = "gov_freeze_v2_clean_baseline"


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _norm(addr: str | None) -> str | None:
    if not addr or not isinstance(addr, str):
        return None
    a = addr.strip()
    if not a.startswith("0x") or len(a) != 42:
        return None
    return a.lower()


def _load_yaml(path: Path):
    if yaml is None:
        raise RuntimeError("PyYAML required")
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _http_json(url: str, timeout: float = 12.0):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return None, {"error": f"{type(e).__name__}: {e}"}


def main() -> int:
    EV.mkdir(parents=True, exist_ok=True)
    findings: list[dict] = []
    layers: dict = {}

    freeze = json.loads(
        (ROOT / "registry/v311-sepolia-address-matrix-freeze.v1.json").read_text(
            encoding="utf-8"
        )
    )
    freeze_addrs = {
        k: _norm(v) for k, v in (freeze.get("addresses") or {}).items() if _norm(v)
    }

    pcd = _load_yaml(ROOT / "registry/protocol-convergence-deployments.v1.yaml")
    active_baseline = pcd.get("active_deploy_baseline")
    v311 = (pcd.get("environments") or {}).get(ACTIVE) or {}
    pcd_addrs_raw = v311.get("addresses") or {}
    # map PCD keys → freeze keys
    key_map = {
        "timelock_address": "timelock",
        "governor_address": "governor",
        "treasury_p4_cap_address": "treasury_p4_cap",
        "primary_market_address": "primary_market",
        "seat_registry_address": "seat_registry",
        "stake_pool_proxy_address": "stake_pool",
        "governance_token_address": "governance_token",
        "usdc_sink_address": "usdc_sink",
    }
    pcd_addrs = {
        key_map[k]: _norm(v) for k, v in pcd_addrs_raw.items() if k in key_map and _norm(v)
    }

    # --- Protocol / Registry ACTIVE ---
    proto_ok = (
        active_baseline == ACTIVE
        and v311.get("status") == "ACTIVE"
        and int(v311.get("chain_id") or 0) == CHAIN
        and freeze.get("baseline") == ACTIVE
        and int(freeze.get("chain_id") or 0) == CHAIN
    )
    addr_mismatches = []
    for k, fv in freeze_addrs.items():
        if k == "timelock_admin_safe":
            continue  # may be outside PCD address block
        pv = pcd_addrs.get(k)
        if pv and pv != fv:
            addr_mismatches.append({"key": k, "freeze": fv, "pcd": pv})
    for k, pv in pcd_addrs.items():
        fv = freeze_addrs.get(k)
        if fv and pv != fv:
            if not any(m["key"] == k for m in addr_mismatches):
                addr_mismatches.append({"key": k, "freeze": fv, "pcd": pv})

    layers["protocol_registry"] = {
        "status": "PASS" if proto_ok and not addr_mismatches else "FAIL",
        "active_deploy_baseline": active_baseline,
        "freeze_baseline": freeze.get("baseline"),
        "pcd_env_status": v311.get("status"),
        "chain_id": v311.get("chain_id"),
        "address_mismatches": addr_mismatches,
    }
    if not proto_ok or addr_mismatches:
        findings.append(
            {
                "sev": "P0",
                "layer": "protocol_registry",
                "id": "DRIFT-PROTO-01",
                "text": "ACTIVE baseline or address pin mismatch",
                "detail": layers["protocol_registry"],
            }
        )

    # Execution matrix (regex — YAML file has known non-strict list/note syntax)
    w3_text = (
        ROOT / "registry/web3-active-execution-matrix.v1.yaml"
    ).read_text(encoding="utf-8")
    m_base = re.search(r"address_authority:[\s\S]*?baseline:\s*(\S+)", w3_text)
    m_active = re.search(r"active_addresses:\s*(\S+)", w3_text)
    w3_baseline = (m_base.group(1).strip() if m_base else None)
    w3_active = (m_active.group(1).strip() if m_active else None)
    w3_ok = w3_baseline == ACTIVE and ACTIVE in str(w3_active or "")
    layers["execution_matrix"] = {
        "status": "PASS" if w3_ok else "FAIL",
        "address_authority_baseline": w3_baseline,
        "active_addresses": w3_active,
        "parse_mode": "regex_soft",
        "note": "Full YAML parse skipped (file has non-strict sequence/note block)",
    }
    if not w3_ok:
        findings.append(
            {
                "sev": "P0",
                "layer": "execution_matrix",
                "id": "DRIFT-MATRIX-01",
                "text": "web3-active-execution-matrix not pinned to v311",
            }
        )

    # Deployment inventory vs freeze (overlap)
    inv = json.loads(
        (ROOT / "registry/v311-web3-deployment-inventory.v1.json").read_text(
            encoding="utf-8"
        )
    )
    inv_map = {
        "TIMELOCK": "timelock",
        "GOVERNOR": "governor",
        "P4CAP": "treasury_p4_cap",
        "PRIMARY_MARKET": "primary_market",
        "SEAT": "seat_registry",
        "STAKE": "stake_pool",
        "TTG": "governance_token",
        "SAFE": "timelock_admin_safe",
    }
    inv_drift = []
    for c in inv.get("components") or []:
        cid = c.get("id")
        fk = inv_map.get(cid)
        if not fk:
            continue
        ia = _norm(c.get("address"))
        fa = freeze_addrs.get(fk)
        if ia and fa and ia != fa:
            inv_drift.append({"component": cid, "inventory": ia, "freeze": fa})
    inv_ok = (
        inv.get("baseline") == ACTIVE
        and int(inv.get("chain_id") or 0) == CHAIN
        and not inv_drift
    )
    layers["deployment_inventory"] = {
        "status": "PASS" if inv_ok else "FAIL",
        "baseline": inv.get("baseline"),
        "chain_id": inv.get("chain_id"),
        "address_drift": inv_drift,
    }
    if not inv_ok:
        findings.append(
            {
                "sev": "P0",
                "layer": "deployment_inventory",
                "id": "DRIFT-INV-01",
                "text": "inventory baseline/address drift vs freeze",
            }
        )

    # Runtime (best-effort local API)
    api = "http://127.0.0.1:8080"
    rt = {"api_base": api, "checks": {}}
    # health
    try:
        with urllib.request.urlopen(api + "/health", timeout=5) as r:
            rt["checks"]["health"] = {"http": r.status, "body": r.read()[:40].decode()}
    except Exception as e:
        rt["checks"]["health"] = {"error": str(e)[:120]}
    # guides + discover (public)
    g_code, g_body = _http_json(api + "/api/v1/guides")
    d_code, d_body = _http_json(api + "/api/v1/discover/orders")
    rt["checks"]["guides"] = {
        "http": g_code,
        "count": len((g_body or {}).get("items") or []) if isinstance(g_body, dict) else None,
        "status": (g_body or {}).get("status") if isinstance(g_body, dict) else None,
    }
    rt["checks"]["discover_orders"] = {
        "http": d_code,
        "count": len((d_body or {}).get("items") or []) if isinstance(d_body, dict) else None,
        "status": (d_body or {}).get("status") if isinstance(d_body, dict) else None,
    }
    # /meta often slow/auth — soft
    m_code, m_body = _http_json(api + "/meta", timeout=8.0)
    rt["checks"]["meta"] = {
        "http": m_code,
        "note": "soft — may timeout under load",
        "has_body": isinstance(m_body, dict),
    }
    if isinstance(m_body, dict):
        # try extract chain_id
        chain = None
        for path in (
            ("chain", "chain_id"),
            ("chain_id",),
            ("web3", "chain_id"),
            ("contracts", "chain_id"),
        ):
            cur = m_body
            ok = True
            for p in path:
                if isinstance(cur, dict) and p in cur:
                    cur = cur[p]
                else:
                    ok = False
                    break
            if ok:
                chain = cur
                break
        rt["checks"]["meta"]["chain_id"] = chain
        if chain is not None and int(chain) != CHAIN:
            findings.append(
                {
                    "sev": "P0",
                    "layer": "runtime",
                    "id": "DRIFT-RT-01",
                    "text": f"runtime /meta chain_id={chain} != {CHAIN}",
                }
            )

    guides_ok = (
        g_code == 200
        and isinstance(g_body, dict)
        and g_body.get("status") == "ok"
        and len(g_body.get("items") or []) == 10
    )
    disc_ok = (
        d_code == 200 and isinstance(d_body, dict) and d_body.get("status") == "ok"
    )
    rt_status = "PASS" if guides_ok and disc_ok else "PARTIAL"
    if not guides_ok or not disc_ok:
        findings.append(
            {
                "sev": "P1",
                "layer": "runtime",
                "id": "DRIFT-RT-02",
                "text": "guides/discover public surface not healthy for drift pin",
                "detail": rt["checks"],
            }
        )
    layers["runtime"] = {"status": rt_status, **rt}

    # CMS — 10 country CLOSED files
    cms_root = ROOT / "evidence/GO_cms_operation"
    closures = sorted(cms_root.glob("CMS-*-COUNTRY-CLOSURE-LATEST.json"))
    closed_isos = []
    for p in closures:
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        iso = (j.get("country") or {}).get("country_iso")
        verdict = j.get("verdict") or ""
        if iso and "CLOSED" in str(verdict):
            closed_isos.append(iso)
    ambient_path = cms_root / "CMS-AMBIENT-RUNTIME-WIRING-LATEST.json"
    ambient = (
        json.loads(ambient_path.read_text(encoding="utf-8"))
        if ambient_path.exists()
        else {}
    )
    cms_ok = len(set(closed_isos)) >= 10 and ambient.get(
        "TT_CMS_AMBIENT_RUNTIME_WIRING"
    ) in ("PASS", "pass", True)
    layers["cms"] = {
        "status": "PASS" if cms_ok else "PARTIAL",
        "country_closed_isos": sorted(set(closed_isos)),
        "country_closed_count": len(set(closed_isos)),
        "ambient_runtime": ambient.get("destination_ambient_runtime"),
        "ambient_verdict": ambient.get("TT_CMS_AMBIENT_RUNTIME_WIRING"),
    }
    if not cms_ok:
        findings.append(
            {
                "sev": "P1",
                "layer": "cms",
                "id": "DRIFT-CMS-01",
                "text": "CMS country/ambient closure incomplete for drift pin",
            }
        )

    # Catalog — ambient countries vs CMS closed set
    amb_matrix = (ROOT / "data/catalog/destination-ambient-matrix.v1.yaml").read_text(
        encoding="utf-8"
    )
    cat_isos = sorted(set(re.findall(r"country_iso:\s*([A-Z]{2})", amb_matrix)))
    listings = (ROOT / "data/catalog/listings-wave1-matrix.v1.yaml").read_text(
        encoding="utf-8"
    )
    m_total = re.search(r"total_rows:\s*(\d+)", listings)
    m_pass = re.search(r"matrix_pass:\s*(\d+)", listings)
    cat_ok = (
        set(cat_isos) == set(closed_isos)
        or (len(cat_isos) >= 10 and len(set(closed_isos)) >= 10)
    ) and m_total and m_pass and m_total.group(1) == m_pass.group(1)
    layers["catalog"] = {
        "status": "PASS" if cat_ok else "PARTIAL",
        "ambient_country_isos": cat_isos,
        "listings_total_rows": int(m_total.group(1)) if m_total else None,
        "listings_matrix_pass": int(m_pass.group(1)) if m_pass else None,
        "cms_closed_alignment": sorted(set(cat_isos) & set(closed_isos)),
        "cms_only": sorted(set(closed_isos) - set(cat_isos)),
        "catalog_only": sorted(set(cat_isos) - set(closed_isos)),
    }
    if set(cat_isos) - set(closed_isos) or set(closed_isos) - set(cat_isos):
        findings.append(
            {
                "sev": "P1",
                "layer": "catalog",
                "id": "DRIFT-CAT-01",
                "text": "Catalog ambient ISO set vs CMS country CLOSED set not identical",
                "detail": {
                    "cms_only": layers["catalog"]["cms_only"],
                    "catalog_only": layers["catalog"]["catalog_only"],
                },
            }
        )

    # OCS — guides public count 10 + align cite
    ocs_cite = (
        ROOT
        / "evidence/GO_official_cold_start_dataset/20260703T044855Z/guides-catalog-align.json"
    )
    ocs_align = (
        json.loads(ocs_cite.read_text(encoding="utf-8")) if ocs_cite.exists() else {}
    )
    ocs_ok = guides_ok and int(ocs_align.get("ocs_guide_count") or 0) == 10
    layers["ocs"] = {
        "status": "PASS" if ocs_ok else "PARTIAL",
        "live_guides_count": rt["checks"]["guides"].get("count"),
        "ocs_align_guide_count": ocs_align.get("ocs_guide_count"),
        "cite": str(ocs_cite.relative_to(ROOT)).replace("\\", "/"),
    }
    if not ocs_ok:
        findings.append(
            {
                "sev": "P1",
                "layer": "ocs",
                "id": "DRIFT-OCS-01",
                "text": "OCS guides public count drift (expect 10)",
            }
        )

    # Search + API Projection — cite prior machine evidence + live
    search_ev = EV / "P2.5-SEARCH-API-PROJECTION-LATEST.json"
    i01 = (
        ROOT
        / "evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state/I-01-indexer-reconcile-live.json"
    )
    search_j = (
        json.loads(search_ev.read_text(encoding="utf-8")) if search_ev.exists() else {}
    )
    i01_j = json.loads(i01.read_text(encoding="utf-8")) if i01.exists() else {}
    search_ok = (
        disc_ok
        and (search_j.get("search_index") or {}).get("verdict") == "PASS"
        and i01_j.get("status") == "PASS"
        and int(i01_j.get("chain_id") or 0) == CHAIN
    )
    layers["search"] = {
        "status": "PASS" if disc_ok else "FAIL",
        "discover_live": rt["checks"]["discover_orders"],
        "cite": "evidence/GO_phase2_v311_final_release/P2.5-SEARCH-API-PROJECTION-LATEST.json",
    }
    layers["api_projection"] = {
        "status": "PASS" if search_ok else "PARTIAL",
        "i01_status": i01_j.get("status"),
        "i01_chain_id": i01_j.get("chain_id"),
        "projection_reconcile_clean": i01_j.get("projection_reconcile_clean"),
        "guides_discover_live_ok": guides_ok and disc_ok,
    }
    if not search_ok:
        findings.append(
            {
                "sev": "P1",
                "layer": "api_projection",
                "id": "DRIFT-PROJ-01",
                "text": "Search/API projection not fully pinned",
            }
        )

    # Docs — ACTIVE narrative drift (V2 as ACTIVE is FAIL; LEGACY label OK)
    doc_paths = [
        ROOT / "AGENTS.md",
        ROOT / "docs/runbook/TT-WEB3-ACTIVE-EXECUTION-MATRIX.md",
        ROOT / "docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md",
        ROOT / "docs/runbook/TT-V311-FINAL-RELEASE-ENGINEERING-LATEST.md",
    ]
    doc_issues = []
    for p in doc_paths:
        if not p.exists():
            continue
        t = p.read_text(encoding="utf-8", errors="replace")
        # bad: ACTIVE paired with gov_freeze_v2 without LEGACY/SUPERSEDED or v311 pin on same line
        for line in t.splitlines():
            if "gov_freeze_v2_clean_baseline" not in line or "ACTIVE" not in line:
                continue
            if "LEGACY" in line or "SUPERSEDED" in line:
                continue
            if ACTIVE in line:
                continue  # v311 ACTIVE with V2 mentioned as contrast
            doc_issues.append(
                {
                    "file": str(p.relative_to(ROOT)).replace("\\", "/"),
                    "snippet": line.strip()[:160],
                }
            )
        # require v311 mention in ACTIVE matrix / AGENTS / FRE
        if p.name in (
            "AGENTS.md",
            "TT-WEB3-ACTIVE-EXECUTION-MATRIX.md",
            "TT-V311-FINAL-RELEASE-ENGINEERING-LATEST.md",
        ):
            if ACTIVE not in t:
                doc_issues.append(
                    {
                        "file": str(p.relative_to(ROOT)).replace("\\", "/"),
                        "snippet": "missing v311_sepolia_clean_baseline",
                    }
                )
    # Master Map §6 still contains legacy table — expected if header marks LEGACY
    mm = (ROOT / "docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md").read_text(
        encoding="utf-8", errors="replace"
    )
    mm_legacy_ok = "LEGACY_SUPERSEDED" in mm and ACTIVE in mm
    layers["docs"] = {
        "status": "PASS" if not doc_issues and mm_legacy_ok else "PARTIAL",
        "active_narrative_issues": doc_issues,
        "master_map_legacy_table_marked": mm_legacy_ok,
        "note": "Master Map §6 table body may still list V2 rows — must remain labeled LEGACY_SUPERSEDED",
    }
    if doc_issues:
        findings.append(
            {
                "sev": "P1",
                "layer": "docs",
                "id": "DRIFT-DOC-01",
                "text": "Docs still assert V2 as ACTIVE without LEGACY label",
                "detail": doc_issues,
            }
        )

    # Package
    pkg_path = EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.json"
    notes_path = EV / "P7.5-RELEASE-NOTES-V311-RC1-LATEST.md"
    pkg = json.loads(pkg_path.read_text(encoding="utf-8")) if pkg_path.exists() else {}
    notes_ok = notes_path.exists()
    pkg_ok = (
        pkg.get("label_candidate") == "TravelTrust V3.1.1 RC1"
        and pkg.get("tt_release_package") == "NOT_LOCKED"
        and notes_ok
    )
    layers["package"] = {
        "status": "PASS" if pkg_ok else "PARTIAL",
        "tt_release_package": pkg.get("tt_release_package"),
        "label_candidate": pkg.get("label_candidate"),
        "release_notes_present": notes_ok,
        "note": "NOT_LOCKED until Function Cert 54/0/0 — expected pre-Execute",
    }

    # Config baseline pin
    cfg_path = ROOT / "registry/v311-configuration-baseline.v1.json"
    cfg = json.loads(cfg_path.read_text(encoding="utf-8")) if cfg_path.exists() else {}
    cfg_base = (
        ((cfg.get("pins") or {}).get("address_matrix") or {}).get("baseline")
        if cfg
        else None
    )
    layers["configuration_baseline"] = {
        "status": "PASS" if cfg_base == ACTIVE else "PARTIAL",
        "pinned_baseline": cfg_base,
        "tt_configuration_baseline": cfg.get("tt_configuration_baseline"),
    }

    # Aggregate
    layer_statuses = {k: v.get("status") for k, v in layers.items()}
    fail = [k for k, s in layer_statuses.items() if s == "FAIL"]
    partial = [k for k, s in layer_statuses.items() if s == "PARTIAL"]
    if fail:
        verdict = "FAIL"
    elif partial:
        verdict = "PARTIAL"
    else:
        verdict = "PASS"

    out = {
        "schema": "traveltrust.v311_full_system_drift_audit.v1",
        "machine_key": "TT_V311_FULL_SYSTEM_DRIFT_AUDIT",
        "recorded_utc": _utc(),
        "active_baseline": ACTIVE,
        "chain_id": CHAIN,
        "legacy_baseline": LEGACY,
        "mode": "TIMELOCK_READONLY",
        "forbid": [
            "mutate_contracts",
            "mutate_active_address_matrix",
            "mutate_runtime",
            "mutate_registry_active_cutover",
        ],
        "verdict": verdict,
        "tt_v311_full_system_drift_audit": verdict,
        "layer_statuses": layer_statuses,
        "layers": layers,
        "findings": findings,
        "finding_counts": {
            "total": len(findings),
            "p0": sum(1 for f in findings if f.get("sev") == "P0"),
            "p1": sum(1 for f in findings if f.get("sev") == "P1"),
        },
        "execute_after_utc": "2026-07-20T11:37:37Z",
        "purpose": (
            "Pin all layers to the same ACTIVE + ops dataset before Function Cert "
            "54/0/0 so RC-02 is not interrupted by forgotten drift."
        ),
    }

    (EV / "FULL-SYSTEM-DRIFT-AUDIT-LATEST.json").write_text(
        json.dumps(out, indent=2) + "\n", encoding="utf-8"
    )

    lines = [
        "# V3.1.1 Full-System Drift Audit",
        "",
        f"**Machine:** `TT_V311_FULL_SYSTEM_DRIFT_AUDIT`",
        f"**Verdict:** **{verdict}**",
        f"**Recorded:** {out['recorded_utc']}",
        f"**ACTIVE:** `{ACTIVE}` · chain `{CHAIN}`",
        f"**Mode:** Timelock read-only · no contracts / ACTIVE / Runtime / Registry cutover",
        "",
        "## Layer matrix",
        "",
        "| Layer | Status |",
        "|-------|--------|",
    ]
    for k, s in layer_statuses.items():
        lines.append(f"| {k} | **{s}** |")
    lines += [
        "",
        f"**Findings:** total={len(findings)} · P0={out['finding_counts']['p0']} · P1={out['finding_counts']['p1']}",
        "",
    ]
    if findings:
        lines += ["## Findings", ""]
        for f in findings:
            lines.append(
                f"- **{f.get('id')}** ({f.get('sev')}) · {f.get('layer')} — {f.get('text')}"
            )
        lines.append("")
    lines += [
        "## Expected non-blockers (pre-Execute)",
        "",
        "- Package `NOT_LOCKED` until Function Cert 54/0/0",
        "- Config Baseline ENV secrets not pinned (OWNER)",
        "- Master Map §6 historical address table = LEGACY_SUPERSEDED body",
        "",
        "## After Execute",
        "",
        "1. Function Cert **54/0/0**",
        "2. Re-run this Drift Audit (expect PASS / no new P0)",
        "3. Close residual OPEN → Phase 8 → RC-02 → Manual → P10.5 → Freeze → GO",
        "",
        f"JSON: `evidence/GO_phase2_v311_final_release/FULL-SYSTEM-DRIFT-AUDIT-LATEST.json`",
    ]
    (EV / "FULL-SYSTEM-DRIFT-AUDIT-LATEST.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )

    print(f"TT_V311_FULL_SYSTEM_DRIFT_AUDIT: {verdict}")
    print(json.dumps(layer_statuses, indent=2))
    print(f"findings={len(findings)}")
    return 0 if verdict != "FAIL" else 1


if __name__ == "__main__":
    raise SystemExit(main())
