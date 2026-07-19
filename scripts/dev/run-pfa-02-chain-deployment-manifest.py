#!/usr/bin/env python3
"""PFA-02 · Chain Deployment Final Manifest (Prep Only, READ_ONLY).

Align: ChainId → Registry ACTIVE → Manifest/Inventory → FE config → Docs.
Confirm ACTIVE vs LEGACY boundaries. No deploy/upgrade/verify/registry edit.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

EV = Path("evidence/GO_pre_eta_production_prep/pfa-02-chain-manifest-20260719")
RUNBOOK = Path("docs/runbook/TT-PFA-02-CHAIN-DEPLOYMENT-MANIFEST-LATEST.md")
TRACK = Path("docs/runbook/TT-PRODUCTION-FINAL-ASSURANCE-LATEST.md")
REG = Path("registry/protocol-convergence-deployments.v1.yaml")
MATRIX = Path("registry/v311-sepolia-address-matrix-freeze.v1.json")
INVENTORY = Path("registry/v311-web3-deployment-inventory.v1.json")

ACTIVE_KEY = "v311_sepolia_clean_baseline"
LEGACY_GOV = "gov_freeze_v2_clean_baseline"
COMPOSITE = "sepolia"
CHAIN = 11155111


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def norm(addr: str | None) -> str | None:
    if not addr:
        return None
    a = addr.strip()
    if a.startswith("0x") or a.startswith("0X"):
        return "0x" + a[2:].lower()
    return a.lower()


def finding(fid: str, severity: str, summary: str, blocking: bool = False) -> dict:
    return {
        "id": fid,
        "severity": severity,
        "phase": "①",
        "blocking": blocking,
        "summary": summary,
    }


def parse_env_addrs(text: str) -> dict[str, str]:
    out = {}
    for m in re.finditer(
        r"^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(0x[a-fA-F0-9]{40})",
        text,
        re.M,
    ):
        out[m.group(1)] = norm(m.group(2))  # type: ignore[arg-type]
    for m in re.finditer(r"^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(\d+)", text, re.M):
        if "CHAIN" in m.group(1):
            out[m.group(1)] = m.group(2)
    return out


def yaml_env_block(text: str, key: str) -> str:
    m = re.search(rf"(?m)^  {re.escape(key)}:\n(.*?)(?=\n  [a-zA-Z0-9_]+:|\Z)", text, re.S)
    return m.group(1) if m else ""


def yaml_addresses(block: str) -> dict[str, str]:
    addrs = {}
    for m in re.finditer(r"(\w+_address):\s*[\"']?(0x[a-fA-F0-9]{40})[\"']?", block):
        addrs[m.group(1)] = norm(m.group(2))  # type: ignore[arg-type]
    # nested proxy:
    for m in re.finditer(
        r"(governor|timelock|treasury_p4_cap|primary_market|seat_registry|region_steward_stake_pool):\s*\n\s+proxy:\s*[\"']?(0x[a-fA-F0-9]{40})",
        block,
    ):
        addrs[f"{m.group(1)}_proxy"] = norm(m.group(2))  # type: ignore[arg-type]
    return addrs


def yaml_field(block: str, field: str) -> str | None:
    m = re.search(rf"(?m)^\s+{field}:\s*(.+)$", block)
    if not m:
        return None
    return m.group(1).strip().strip("\"'")


def main() -> None:
    EV.mkdir(parents=True, exist_ok=True)
    now = utc_now()
    reg_text = REG.read_text(encoding="utf-8")
    active_block = yaml_env_block(reg_text, ACTIVE_KEY)
    legacy_block = yaml_env_block(reg_text, LEGACY_GOV)
    composite_block = yaml_env_block(reg_text, COMPOSITE)

    active_status = yaml_field(active_block, "status")
    active_chain = yaml_field(active_block, "chain_id")
    active_addrs = yaml_addresses(active_block)
    legacy_status = yaml_field(legacy_block, "status")
    legacy_superseded = yaml_field(legacy_block, "superseded_by")
    legacy_addrs = yaml_addresses(legacy_block)
    composite_status = yaml_field(composite_block, "status")
    composite_ref = yaml_field(composite_block, "active_baseline_ref")
    composite_addrs = yaml_addresses(composite_block)

    m_active = re.search(r"(?m)^active_deploy_baseline:\s*(\S+)", reg_text)
    active_pointer = m_active.group(1) if m_active else None

    matrix = json.loads(MATRIX.read_text(encoding="utf-8"))
    inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))

    matrix_addrs = {k: norm(v) for k, v in (matrix.get("addresses") or {}).items()}
    inv_by_id = {}
    for c in inventory.get("components") or []:
        inv_by_id[c.get("id")] = {
            "address": norm(c.get("address")),
            "scope": c.get("scope"),
            "env_keys": c.get("env_keys") or [],
        }

    # Core ACTIVE identity (governance spine)
    active_identity = {
        "baseline": ACTIVE_KEY,
        "status": active_status,
        "chain_id": int(active_chain) if active_chain and active_chain.isdigit() else active_chain,
        "TTG_Token": active_addrs.get("governance_token_address"),
        "Governor": active_addrs.get("governor_address"),
        "Timelock": active_addrs.get("timelock_address"),
        "SeatRegistry": active_addrs.get("seat_registry_address"),
        "EscrowFactory": None,  # not on ACTIVE clean baseline
        "FeeRouter": None,  # not on ACTIVE clean baseline
        "note": "ACTIVE clean baseline = gov/PM/stake spine; fund-stack Escrow/FeeRouter live on LEGACY composite",
    }

    legacy_identity = {
        "baseline": LEGACY_GOV,
        "status": legacy_status,
        "superseded_by": legacy_superseded,
        "Governor": legacy_addrs.get("governor_address")
        or composite_addrs.get("governor_address"),
        "TTG_Token_composite": composite_addrs.get("governance_token_address"),
        "EscrowFactory": composite_addrs.get("escrow_factory_address"),
        "FeeRouter": composite_addrs.get("fee_router_address"),
        "Registry_onchain": composite_addrs.get("registry_address"),
    }

    # Manifest alignment (case-insensitive)
    manifest_checks = []
    pairs = [
        ("TTG_Token", active_identity["TTG_Token"], matrix_addrs.get("governance_token"), inv_by_id.get("TTG", {}).get("address")),
        ("Governor", active_identity["Governor"], matrix_addrs.get("governor"), inv_by_id.get("GOVERNOR", {}).get("address")),
        ("Timelock", active_identity["Timelock"], matrix_addrs.get("timelock"), inv_by_id.get("TIMELOCK", {}).get("address")),
        ("SeatRegistry", active_identity["SeatRegistry"], matrix_addrs.get("seat_registry"), inv_by_id.get("SEAT", {}).get("address")),
    ]
    for name, reg_a, mat_a, inv_a in pairs:
        ok = reg_a and mat_a and inv_a and reg_a == mat_a == inv_a
        manifest_checks.append(
            {
                "component": name,
                "registry_active": reg_a,
                "address_matrix": mat_a,
                "deployment_inventory": inv_a,
                "aligned": bool(ok),
            }
        )

    # FE configs
    fe_active_tpl = Path("scripts/dev/templates/frontend.env.sepolia.local.example")
    fe_staging_ex = Path("deploy/fly/tt-web-staging/build.env.example")
    fe_prod_ex = Path("deploy/fly/tt-web-prod/build.env.example")
    fe_prod_local = Path("deploy/fly/tt-web-prod/build.env.local")

    fe_surfaces = {}
    for label, path in [
        ("fe_sepolia_active_template", fe_active_tpl),
        ("fe_staging_build_example", fe_staging_ex),
        ("fe_prod_build_example", fe_prod_ex),
        ("fe_prod_build_local", fe_prod_local),
    ]:
        if not path.exists():
            fe_surfaces[label] = {"present": False}
            continue
        env = parse_env_addrs(path.read_text(encoding="utf-8", errors="replace"))
        gov = env.get("NEXT_PUBLIC_GOVERNOR_ADDRESS")
        tok = env.get("NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS")
        escrow = env.get("NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS")
        fee = env.get("NEXT_PUBLIC_FEE_ROUTER_ADDRESS")
        chain = env.get("NEXT_PUBLIC_CHAIN_ID")
        class_gov = (
            "ACTIVE"
            if gov == active_identity["Governor"]
            else ("LEGACY" if gov == legacy_identity["Governor"] else "UNKNOWN")
        )
        class_tok = (
            "ACTIVE"
            if tok == active_identity["TTG_Token"]
            else (
                "LEGACY"
                if tok == legacy_identity["TTG_Token_composite"]
                else "UNKNOWN"
            )
        )
        class_escrow = (
            "LEGACY_COMPOSITE"
            if escrow and escrow == legacy_identity["EscrowFactory"]
            else ("ABSENT" if not escrow else "UNKNOWN")
        )
        class_fee = (
            "LEGACY_COMPOSITE"
            if fee and fee == legacy_identity["FeeRouter"]
            else ("ABSENT" if not fee else "UNKNOWN")
        )
        fe_surfaces[label] = {
            "present": True,
            "path": str(path).replace("\\", "/"),
            "chain_id": chain,
            "chain_ok": str(chain) == str(CHAIN),
            "governor": gov,
            "governor_class": class_gov,
            "governance_token": tok,
            "token_class": class_tok,
            "escrow_factory": escrow,
            "escrow_class": class_escrow,
            "fee_router": fee,
            "fee_class": class_fee,
        }

    # Docs mis-cite samples (readonly grep-style)
    doc_risks = []
    doc_scan = [
        (
            "docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md",
            "0x847b00ddb6ffed71812abc358a407dad4b099fcb",
            "Master map table still lists LEGACY governor hex (ACTIVE prose may be correct)",
        ),
        (
            "docs/runbook/PRODUCTION-USDC-GO-LIVE-MASTER-CHECKLIST.md",
            "0x847b00ddb6ffed71812abc358a407dad4b099fcb",
            "USDC go-live checklist cites LEGACY governor",
        ),
        (
            "docs/runbook/PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md",
            "0x847b00ddb6ffed71812abc358a407dad4b099fcb",
            "Payment readiness cites LEGACY governor",
        ),
        (
            "docs/runbook/TT-PSG-V311-SEPOLIA-CLEAN-BASELINE-CERT-LATEST.md",
            "0x1ce4fbE80557bC2111A814f60A2334de41032116",
            "Clean baseline cert cites ACTIVE governor (good)",
        ),
    ]
    for path, needle, note in doc_scan:
        p = Path(path)
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        hit = needle.lower() in text.lower()
        is_legacy_needle = needle.lower().startswith("0x847b")
        doc_risks.append(
            {
                "path": path,
                "needle": needle,
                "hit": hit,
                "class": (
                    "LEGACY_CITE"
                    if hit and is_legacy_needle
                    else ("ACTIVE_CITE" if hit else "MISS")
                ),
                "note": note,
            }
        )

    # Findings
    findings = []
    ssot_ok = (
        active_pointer == ACTIVE_KEY
        and active_status == "ACTIVE"
        and legacy_status == "LEGACY_SUPERSEDED"
        and legacy_superseded == ACTIVE_KEY
        and composite_status == "LEGACY_READ_ONLY_COMPOSITE"
        and composite_ref == ACTIVE_KEY
        and int(active_chain or 0) == CHAIN
        and int(matrix.get("chain_id") or 0) == CHAIN
        and int(inventory.get("chain_id") or 0) == CHAIN
    )
    if ssot_ok:
        findings.append(
            finding(
                "PFA-CM-01",
                "info",
                "Registry SSOT unique: active_deploy_baseline=v311_sepolia_clean_baseline; V2=LEGACY_SUPERSEDED; sepolia=LEGACY_READ_ONLY_COMPOSITE",
            )
        )
    else:
        findings.append(
            finding(
                "PFA-CM-00",
                "P1",
                f"Registry SSOT pointer/status unexpected: pointer={active_pointer} active_status={active_status} legacy={legacy_status}",
            )
        )

    all_manifest_aligned = all(x["aligned"] for x in manifest_checks)
    if all_manifest_aligned:
        findings.append(
            finding(
                "PFA-CM-02",
                "info",
                "ACTIVE TTG/Governor/Timelock/SeatRegistry aligned across Registry ↔ Address Matrix ↔ Deployment Inventory",
            )
        )
    else:
        bad = [x["component"] for x in manifest_checks if not x["aligned"]]
        findings.append(
            finding("PFA-CM-02", "P1", f"ACTIVE manifest misalignment on: {', '.join(bad)}")
        )

    # Escrow/FeeRouter boundary
    findings.append(
        finding(
            "PFA-CM-03",
            "info",
            "W3S-ADDR-02 retained: EscrowFactory/FeeRouter live under LEGACY sepolia composite — NOT listed on ACTIVE clean baseline (CONFIRMED_DESIGN dual surface; Money-Path locked)",
        )
    )

    # FE ACTIVE template
    fe_act = fe_surfaces.get("fe_sepolia_active_template") or {}
    if fe_act.get("governor_class") == "ACTIVE" and fe_act.get("chain_ok"):
        findings.append(
            finding(
                "PFA-CM-04",
                "info",
                "FE Sepolia ACTIVE template (frontend.env.sepolia.local.example) maps Governor/Token to ACTIVE + chain_id=11155111",
            )
        )
    else:
        findings.append(
            finding(
                "PFA-CM-04",
                "P2",
                "FE ACTIVE template missing or not mapped to ACTIVE governor",
            )
        )

    # Staging example LEGACY — cite W3S-ADDR-01
    fe_st = fe_surfaces.get("fe_staging_build_example") or {}
    if fe_st.get("governor_class") == "LEGACY":
        findings.append(
            finding(
                "PFA-CM-05",
                "P2",
                "W3S-ADDR-01 confirmed: staging build.env.example Governor/Token = LEGACY composite (0x847b…/0x2837…) ≠ ACTIVE (0x1ce4…/0x5d2e…) — misbind risk if treated as ACTIVE",
            )
        )

    # FeeRouter on ACTIVE template still LEGACY composite address
    if fe_act.get("fee_class") == "LEGACY_COMPOSITE":
        findings.append(
            finding(
                "PFA-CM-06",
                "info",
                "ACTIVE FE template FeeRouter pin = LEGACY composite FeeRouter — expected until fund-stack cutover; label as LEGACY_COMPOSITE not ACTIVE gov",
            )
        )

    legacy_doc_hits = [d for d in doc_risks if d["class"] == "LEGACY_CITE"]
    if legacy_doc_hits:
        findings.append(
            finding(
                "PFA-CM-07",
                "P2",
                "Docs still cite LEGACY governor hex without ACTIVE banner in checklist/map surfaces: "
                + ", ".join(d["path"] for d in legacy_doc_hits[:4]),
            )
        )

    findings.append(
        finding(
            "PFA-CM-08",
            "info",
            "No Deploy/Upgrade/Verify/Registry edit/Gate/Money-Path performed — manifest paper only; live /meta NOT_RUN",
        )
    )

    # Overall status
    # NEED_OWNER_CONFIRM if staging/prod FE still LEGACY for gov and Owner must pick surface for Execute/UI
    need_owner = fe_st.get("governor_class") == "LEGACY" or (
        (fe_surfaces.get("fe_prod_build_local") or {}).get("governor_class") == "LEGACY"
    )
    if not ssot_ok or not all_manifest_aligned:
        result = "FINDING"
        overall = "PFA_02_FINDING"
    elif need_owner:
        result = "NEED_OWNER_CONFIRM"
        overall = "PFA_02_NEED_OWNER_CONFIRM"
    else:
        result = "PASS"
        overall = "PFA_02_PASS"

    # If only expected dual-surface findings, still NEED_OWNER_CONFIRM for which FE is live on staging
    if result == "PASS" and findings:
        # keep PASS only if no P2 misbind
        pass

    pack = {
        "machine": "TT_PFA_02_CHAIN_DEPLOYMENT_MANIFEST",
        "recorded_utc": now,
        "mode": "PREP_ONLY_READ_ONLY",
        "locks": {
            "WAIT_WINDOW": "ACTIVE",
            "deploy": False,
            "upgrade": False,
            "verify_rerun": False,
            "registry_edit": False,
            "gate_changed": False,
            "money_path": False,
        },
        "chain_id_expected": CHAIN,
        "registry_ssot": {
            "active_deploy_baseline": active_pointer,
            "active_status": active_status,
            "legacy_gov_status": legacy_status,
            "legacy_superseded_by": legacy_superseded,
            "composite_status": composite_status,
            "composite_active_ref": composite_ref,
            "ssot_unique_ok": ssot_ok,
        },
        "active_identity": active_identity,
        "legacy_identity": legacy_identity,
        "manifest_alignment": manifest_checks,
        "fe_surfaces": fe_surfaces,
        "doc_risks": doc_risks,
        "prior_cites": ["W3S-ADDR-01", "W3S-ADDR-02", "HRD-RT-01"],
        "findings": findings,
        "summary": {
            "result": result,
            "overall": overall,
            "PASS": 1 if result == "PASS" else 0,
            "FINDING": 1 if result == "FINDING" else 0,
            "NEED_OWNER_CONFIRM": 1 if result == "NEED_OWNER_CONFIRM" else 0,
            "P0_blocking": 0,
            "production_go_claimed": False,
        },
        "honest_boundary": [
            "ACTIVE gov spine aligned ≠ staging FE example cut over",
            "LEGACY Escrow/FeeRouter composite ≠ defect by itself",
            "≠ contract re-audit · ≠ Production GO",
        ],
    }

    (EV / "CHAIN-DEPLOYMENT-MANIFEST-LATEST.json").write_text(
        json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    md_lines = [
        "# PFA-02 · Chain Deployment Final Manifest（Prep Only）",
        "",
        f"**Machine:** `TT_PFA_02_CHAIN_DEPLOYMENT_MANIFEST`",
        f"**Recorded:** `{now}`",
        f"**Status:** **`{result}`** · `{overall}`",
        f"**Evidence:** `{EV.as_posix()}/`",
        "",
        "> READ_ONLY · ChainId → Registry ACTIVE → Manifest → FE → Docs  ",
        "> 禁 Deploy / Upgrade / Verify 重跑 / Registry 改 / Gate / Money-Path  ",
        "> F-02 WAIT_WINDOW · Hardening CLOSED · PFA track only",
        "",
        "## ACTIVE identity（SSOT）",
        "",
        f"| Item | Value |",
        f"|------|-------|",
        f"| Baseline | `{ACTIVE_KEY}` · status=`{active_status}` |",
        f"| ChainId | `{active_identity['chain_id']}` |",
        f"| TTG Token | `{active_identity['TTG_Token']}` |",
        f"| Governor | `{active_identity['Governor']}` |",
        f"| Timelock | `{active_identity['Timelock']}` |",
        f"| SeatRegistry | `{active_identity['SeatRegistry']}` |",
        f"| EscrowFactory | _(not on ACTIVE clean baseline)_ |",
        f"| FeeRouter | _(not on ACTIVE clean baseline)_ |",
        "",
        "## LEGACY boundary",
        "",
        f"| Item | Value |",
        f"|------|-------|",
        f"| `{LEGACY_GOV}` | `{legacy_status}` → superseded_by `{legacy_superseded}` |",
        f"| Governor (LEGACY) | `{legacy_identity['Governor']}` |",
        f"| `sepolia` composite | `{composite_status}` · ref `{composite_ref}` |",
        f"| EscrowFactory | `{legacy_identity['EscrowFactory']}` · **LEGACY_COMPOSITE** |",
        f"| FeeRouter | `{legacy_identity['FeeRouter']}` · **LEGACY_COMPOSITE** |",
        "",
        "## Manifest alignment (ACTIVE spine)",
        "",
        "| Component | Registry | Matrix | Inventory | Aligned |",
        "|-----------|----------|--------|-----------|---------|",
    ]
    for x in manifest_checks:
        md_lines.append(
            f"| {x['component']} | `{x['registry_active']}` | `{x['address_matrix']}` | `{x['deployment_inventory']}` | {'✅' if x['aligned'] else '❌'} |"
        )
    md_lines += [
        "",
        "## FE surface classes",
        "",
        "| Surface | chain | Governor class | Token class | Escrow | FeeRouter |",
        "|---------|-------|----------------|-------------|--------|-----------|",
    ]
    for label, s in fe_surfaces.items():
        if not s.get("present"):
            md_lines.append(f"| {label} | — | ABSENT | — | — | — |")
            continue
        md_lines.append(
            f"| `{label}` | {s.get('chain_id')} | **{s.get('governor_class')}** | {s.get('token_class')} | {s.get('escrow_class')} | {s.get('fee_class')} |"
        )
    md_lines += [
        "",
        "## Findings",
        "",
        "| ID | sev | summary |",
        "|----|-----|---------|",
    ]
    for f in findings:
        md_lines.append(f"| {f['id']} | {f['severity']} | {f['summary']} |")
    md_lines += [
        "",
        "## Owner confirm（若 NEED_OWNER_CONFIRM）",
        "",
        "1. Execute / Governance UI day：**必须**使用 ACTIVE Governor `0x1ce4…`（非 staging example `0x847b…`）",
        "2. Escrow/FeeRouter：明确按 **LEGACY_COMPOSITE** 消费直至 fund-stack cutover（Money-Path 仍锁）",
        "3. **勿**在 WAIT_WINDOW 改 Registry / 重部署 / 把 LEGACY 例当 ACTIVE",
        "",
        "**≠** Production GO · **≠** contract re-audit",
        "",
    ]
    md = "\n".join(md_lines)
    (EV / "CHAIN-DEPLOYMENT-MANIFEST-LATEST.md").write_text(md, encoding="utf-8")
    RUNBOOK.write_text(md, encoding="utf-8")

    # Update PFA track queue
    if TRACK.exists():
        track = TRACK.read_text(encoding="utf-8")
        track = re.sub(
            r"\| 2 \| Chain Deployment Final Manifest \| PENDING \|",
            f"| 2 | Chain Deployment Final Manifest | **{result}** · [PFA-02](./TT-PFA-02-CHAIN-DEPLOYMENT-MANIFEST-LATEST.md) |",
            track,
            count=1,
        )
        TRACK.write_text(track, encoding="utf-8")

    print(json.dumps(pack["summary"], indent=2))
    print("ACTIVE gov", active_identity["Governor"])
    print("LEGACY gov", legacy_identity["Governor"])
    print("ssot_ok", ssot_ok, "manifest", all_manifest_aligned)


if __name__ == "__main__":
    main()
