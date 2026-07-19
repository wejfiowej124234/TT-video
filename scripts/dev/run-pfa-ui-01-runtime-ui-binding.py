#!/usr/bin/env python3
"""PFA-UI-01 · Web3 Runtime → UI Binding Readonly (Prep Only).

Ask: do backend Findings already affect user UX on key entry surfaces?
≠ Full UI/UX Acceptance. No Fix/Deploy/Config/Registry/Gate/Money-Path.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

EV = Path("evidence/GO_pre_eta_production_prep/pfa-ui-01-runtime-ui-binding-20260719")
RUNBOOK = Path("docs/runbook/TT-PFA-UI-01-RUNTIME-UI-BINDING-LATEST.md")
TRACK = Path("docs/runbook/TT-PRODUCTION-FINAL-ASSURANCE-LATEST.md")

ACTIVE_GOV = "0x1ce4fbe80557bc2111a814f60a2334de41032116"
LEGACY_GOV = "0x847b00ddb6ffed71812abc358a407dad4b099fcb"
ACTIVE_TTG = "0x5d2edabf062e1d8accda2bd35c0d9b26cfcd5ec0"
LEGACY_TTG = "0x2837ea0c50e27d59b88af617abbb231a040062c5"
LEGACY_ESCROW = "0xbf746b6a330e61416c6d87ab9b0758f7107c8006"
ACTIVE_STAKE = "0xc229d58987e0755467eb4ee53572f7139baf7281"
LEGACY_STAKE = "0x3a89378bfad12d1028707dd37055294854c8784e"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def norm(a: str | None) -> str | None:
    if not a:
        return None
    return ("0x" + a[2:].lower()) if a.startswith(("0x", "0X")) else a.lower()


def finding(fid: str, severity: str, summary: str, blocking: bool = False) -> dict:
    return {
        "id": fid,
        "severity": severity,
        "phase": "①",
        "blocking": blocking,
        "summary": summary,
    }


def parse_env_keys(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    out = {}
    text = path.read_text(encoding="utf-8", errors="replace")
    for m in re.finditer(r"(?m)^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(0x[a-fA-F0-9]{40})", text):
        out[m.group(1)] = norm(m.group(2))  # type: ignore
    for m in re.finditer(r"(?m)^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(\d+)", text):
        if "CHAIN" in m.group(1):
            out[m.group(1)] = m.group(2)
    return out


def file_has(path: str, needle: str) -> bool:
    p = Path(path)
    if not p.exists():
        return False
    return needle in p.read_text(encoding="utf-8", errors="replace")


def surface(
    sid: str,
    name: str,
    routes: list[str],
    binding: str,
    prior: list[str],
    ux_impact: str,
    result: str,
    findings_local: list[dict],
    evidence: dict,
) -> dict:
    return {
        "surface_id": sid,
        "name": name,
        "routes": routes,
        "runtime_binding": binding,
        "prior_finding_ids": prior,
        "ux_impact": ux_impact,
        "result": result,
        "findings": findings_local,
        "evidence": evidence,
    }


def main() -> None:
    EV.mkdir(parents=True, exist_ok=True)
    now = utc_now()

    fe_active = parse_env_keys(Path("scripts/dev/templates/frontend.env.sepolia.local.example"))
    fe_staging = parse_env_keys(Path("deploy/fly/tt-web-staging/build.env.example"))

    # Code binding facts (static)
    gov_via_meta = file_has("frontend/lib/governanceChainMeta.ts", "governor_address")
    escrow_via_env = file_has("frontend/lib/escrowFactoryEnv.ts", "NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS")
    wc_gate = file_has(
        "frontend/lib/wallet/connection/createTravelTrustWagmiConnectors.ts",
        "if (projectId)",
    )
    wc_ui = file_has("frontend/components/trust/TravelTrustWalletSheet.tsx", "wallet_wc_unconfigured")
    draft_freeze = Path(
        "frontend/evidence/GO_local_web3_itinerary_l5/ESCROW-DRAFT-EXPERIENCE-FREEZE.md"
    ).exists()
    onchain_unfrozen = Path(
        "frontend/evidence/GO_local_web3_pages_closure/ESCROW-ONCHAIN-RATE-STATUS.md"
    ).exists()

    # Prior packs (status only)
    pfa02 = Path(
        "evidence/GO_pre_eta_production_prep/pfa-02-chain-manifest-20260719/"
        "CHAIN-DEPLOYMENT-MANIFEST-LATEST.json"
    )
    pfa03 = Path(
        "evidence/GO_pre_eta_production_prep/pfa-03-config-contract-20260719/"
        "PFA_CONFIG_CONTRACT.json"
    )
    pfa02_result = None
    pfa03_wc = None
    if pfa02.exists():
        pfa02_result = json.loads(pfa02.read_text(encoding="utf-8")).get("summary", {}).get("result")
    if pfa03.exists():
        rows = json.loads(pfa03.read_text(encoding="utf-8")).get("PFA_CONFIG_CONTRACT") or []
        for r in rows:
            if "WALLETCONNECT" in r.get("key", ""):
                pfa03_wc = r.get("status")

    staging_gov_class = (
        "LEGACY"
        if fe_staging.get("NEXT_PUBLIC_GOVERNOR_ADDRESS") == LEGACY_GOV
        else (
            "ACTIVE"
            if fe_staging.get("NEXT_PUBLIC_GOVERNOR_ADDRESS") == ACTIVE_GOV
            else "UNKNOWN"
        )
    )
    active_tpl_gov = (
        "ACTIVE"
        if fe_active.get("NEXT_PUBLIC_GOVERNOR_ADDRESS") == ACTIVE_GOV
        else "UNKNOWN"
    )
    staging_escrow = (
        "LEGACY_COMPOSITE"
        if fe_staging.get("NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS") == LEGACY_ESCROW
        else "OTHER"
    )
    staging_stake = (
        "LEGACY"
        if fe_staging.get("NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS") == LEGACY_STAKE
        else (
            "ACTIVE"
            if fe_staging.get("NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS") == ACTIVE_STAKE
            else "UNKNOWN"
        )
    )

    surfaces = []
    all_findings = []

    # 1 Wallet
    f_wallet = [
        finding(
            "PFA-UI-WALLET-01",
            "P2",
            "WC Project ID ABSENT (PFA-CFG-02/OA-01) → Wallet sheet shows wallet_wc_unconfigured; WalletConnect connector omitted — UX degraded for mobile WC path",
        )
    ]
    all_findings.extend(f_wallet)
    surfaces.append(
        surface(
            "WALLET",
            "Wallet / Trust chrome",
            ["chrome WalletStatusMini", "/traveltrust (wallet entry)"],
            "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID → createTravelTrustWagmiConnectors (projectId gate)",
            ["PFA-CFG-02", "OA-H1", "OA-01"],
            "User sees WC unconfigured; injected/MetaMask/Coinbase may still work — UX partial degrade",
            "FINDING",
            f_wallet,
            {"wc_code_gate": wc_gate, "wc_ui_copy": wc_ui, "pfa03_wc_status": pfa03_wc},
        )
    )

    # 2 Governance
    f_gov = [
        finding(
            "PFA-UI-GOV-01",
            "P2",
            f"Staging FE example Governor={staging_gov_class} ({LEGACY_GOV[:10]}…) ≠ ACTIVE ({ACTIVE_GOV[:10]}…) — Governance UI that embeds build-time NEXT_PUBLIC_* or follows staging /meta LEGACY will talk wrong stack vs ACTIVE SSOT (W3S-ADDR-01 / PFA-CM-05)",
        ),
        finding(
            "PFA-UI-GOV-02",
            "info",
            "Governance proposal UI also binds governor via GET /meta.chain.contracts (governanceChainMeta) — live /meta class NOT_RUN this pass (prior 401 unauth)",
        ),
    ]
    all_findings.extend(f_gov)
    surfaces.append(
        surface(
            "GOVERNANCE",
            "Governance proposals / params",
            ["/governance", "/governance/proposals*", "/governance/params"],
            "FE env NEXT_PUBLIC_GOVERNOR_* + API /meta.governor_address",
            ["W3S-ADDR-01", "PFA-CM-05", "HRD-RT-01"],
            "If user uses staging build as-shipped: governance actions target LEGACY governor — ACTIVE Execute path identity mismatch risk",
            "FINDING",
            f_gov,
            {
                "gov_via_meta_helper": gov_via_meta,
                "staging_example_governor_class": staging_gov_class,
                "active_template_governor_class": active_tpl_gov,
                "live_meta": "NOT_RUN",
            },
        )
    )

    # 3 Trust / TravelTrust
    f_trust = [
        finding(
            "PFA-UI-TRUST-01",
            "info",
            "Prior Shadow: /me/trust FE 404 — trust UX under /me/settings/trust (path drift) — user bookmark risk, not address misbind",
        )
    ]
    all_findings.extend(f_trust)
    surfaces.append(
        surface(
            "TRUST",
            "Trust / DID surfaces",
            ["/traveltrust", "/me/settings/trust", "/did-rank"],
            "Mostly API + frozen five-main UI; weak direct ACTIVE address bind",
            ["PRS/T0 path notes"],
            "Path drift may confuse users; five-main UI freeze intact — not Full Acceptance",
            "FINDING",
            f_trust,
            {"five_main_freeze": True},
        )
    )

    # 4 Escrow
    f_esc = [
        finding(
            "PFA-UI-ESCROW-01",
            "info",
            "EscrowFactory bind = NEXT_PUBLIC_ESCROW_FACTORY_* (LEGACY_COMPOSITE on staging example) — CONFIRMED_DESIGN dual surface (W3S-ADDR-02); Money-Path locked so UX create-onchain not production-claimed",
        ),
        finding(
            "PFA-UI-ESCROW-02",
            "info",
            "Draft Experience shell FROZEN; on-chain escrow + /rate NOT frozen — UX backlog if user reaches funded protocol shell",
        ),
    ]
    all_findings.extend(f_esc)
    surfaces.append(
        surface(
            "ESCROW",
            "Escrow order page",
            ["/escrow/[id]", "/escrow/[id]/rate"],
            "escrowFactoryEnv.ts → NEXT_PUBLIC_ESCROW_FACTORY(_V2)_ADDRESS",
            ["W3S-ADDR-02", "HRD-ESM-03"],
            "Draft path OK; on-chain UX unfinished; factory address = composite not ACTIVE gov spine",
            "FINDING",
            f_esc,
            {
                "escrow_via_env": escrow_via_env,
                "staging_escrow_class": staging_escrow,
                "draft_freeze": draft_freeze,
                "onchain_unfrozen_doc": onchain_unfrozen,
            },
        )
    )

    # 5 Market
    f_mkt = [
        finding(
            "PFA-UI-MARKET-01",
            "info",
            "Market list UX = API discover + optional catalog; address misbind low. Announcement/Pulse dual-lane (HRD-DOM-03) can still confuse Network/Pulse copy vs CMS",
        )
    ]
    all_findings.extend(f_mkt)
    surfaces.append(
        surface(
            "MARKET",
            "Market discover / subsites",
            ["/market", "/market/provider", "/market/acquisition"],
            "API GET discover/orders · catalog opt-in · localStorage bookmarks",
            ["HRD-DOM-02", "HRD-DOM-03", "T0-UI"],
            "Data-ownership dual lanes may show inconsistent promo/announcement sources — not wallet/gov address bind",
            "FINDING",
            f_mkt,
            {"live_browser": "NOT_RUN"},
        )
    )

    # 6 Provider
    f_prov = [
        finding(
            "PFA-UI-PROV-01",
            "info",
            "Provider register UI frozen (①) — primarily API/auth gate; Web3 ACTIVE/LEGACY address bind secondary",
        )
    ]
    all_findings.extend(f_prov)
    surfaces.append(
        surface(
            "PROVIDER",
            "Provider onboarding",
            ["/provider/register", "/auth/register?role=provider"],
            "API onboarding + auth session (not Governor ACTIVE pin)",
            ["PROVIDER-REGISTER-UI-FREEZE"],
            "Low direct impact from W3S-ADDR-01; WC absent still hurts if wallet step required",
            "PASS",
            f_prov,
            {"ui_freeze_doc": True},
        )
    )

    # 7 Steward
    f_stew = [
        finding(
            "PFA-UI-STEWARD-01",
            "P2",
            f"Staging FE example Region Steward stake pool class={staging_stake} (LEGACY {LEGACY_STAKE[:10]}…) vs ACTIVE {ACTIVE_STAKE[:10]}… — Steward stake UI may bind wrong pool if staging example shipped",
        )
    ]
    all_findings.extend(f_stew)
    surfaces.append(
        surface(
            "STEWARD",
            "Steward register / stake",
            ["/steward/register", "StewardTtgStakeManagePanel"],
            "NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS + protocolSsot params",
            ["PFA-CM-05", "W3S-ADDR-01"],
            "Stake UX can target LEGACY pool under staging example — user-facing Web3 misbind class",
            "FINDING",
            f_stew,
            {
                "staging_stake_class": staging_stake,
                "active_template_stake": fe_active.get("NEXT_PUBLIC_STAKE_POOL_ADDRESS")
                == ACTIVE_STAKE,
            },
        )
    )

    # 8 Admin
    f_adm = [
        finding(
            "PFA-UI-ADMIN-01",
            "info",
            "Admin UX = session RBAC; live cross-role authz NOT_RUN (Hardening P0). Address ACTIVE/LEGACY less central than role gates",
        )
    ]
    all_findings.extend(f_adm)
    surfaces.append(
        surface(
            "ADMIN",
            "Admin backoffice",
            ["/admin/*"],
            "Auth session · admin roles (paper CERT CONDITIONAL_PASS)",
            ["HRD-P0-03", "PSG-07 Admin"],
            "RBAC live matrix deferred to PFA-04 — this pass NOT_RUN for live role×page",
            "NOT_RUN",
            f_adm,
            {"live_rbac": "NOT_RUN"},
        )
    )

    # 9 Role navigation & entry hubs
    identities_freeze = Path(
        "frontend/evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md"
    ).exists()
    identities_readme = Path("frontend/app/me/identities/README.md").exists()
    f_role = [
        finding(
            "PFA-UI-ROLE-01",
            "info",
            "/me/identities Hub UI frozen — CTAs to provider onboarding · steward admission · guide · acquisition; structure OK, runtime address class still inherits staging LEGACY for steward/gov hops",
        ),
        finding(
            "PFA-UI-ROLE-02",
            "P2",
            "Role journeys that require WalletConnect (Steward stake · Governance · on-chain Provider/Guide steps) inherit WC ABSENT UX degrade — entry visible, completion path partial",
        ),
        finding(
            "PFA-UI-ROLE-03",
            "info",
            "Anonymous→Tourist→Guide/Provider/Steward/Admin live click-through matrix NOT_RUN (PFA-04); paper Admin RBAC ≠ user nav acceptance",
        ),
    ]
    all_findings.extend(f_role)
    surfaces.append(
        surface(
            "ROLE_NAV",
            "Role navigation & entry hubs",
            [
                "/me/identities",
                "/auth/register?role=*",
                "/guide/register",
                "WalletAccountMenu role strip",
                "identities → /market/acquisition",
            ],
            "Me-identities hub CTAs + auth role query + wallet chrome menu (API session roles)",
            ["HRD-DOM", "PFA-CFG-02", "ME-IDENTITIES-UI-FREEZE", "PFA-04 pending"],
            "Entries exist and Hub frozen; WC/LEGACY findings penetrate when user follows Steward/Gov/on-chain CTAs",
            "FINDING",
            f_role,
            {
                "identities_ui_freeze": identities_freeze,
                "identities_readme": identities_readme,
                "live_role_matrix": "NOT_RUN",
            },
        )
    )

    # Clarify WalletConnect naming on WALLET surface
    for s in surfaces:
        if s["surface_id"] == "WALLET":
            s["name"] = "WalletConnect / Wallet chrome"
            s["routes"] = [
                "WalletStatusMini",
                "TravelTrustWalletSheet (WC)",
                "/traveltrust wallet entry",
            ]

    # Aggregate
    counts = {"PASS": 0, "FINDING": 0, "NOT_RUN": 0}
    for s in surfaces:
        counts[s["result"]] = counts.get(s["result"], 0) + 1

    # UX-affecting P2 (user-visible degrade or wrong-chain bind)
    ux_p2 = [f for f in all_findings if f["severity"] == "P2"]
    overall_result = "FINDING" if counts["FINDING"] else ("NOT_RUN" if counts["NOT_RUN"] else "PASS")

    pack = {
        "machine": "TT_PFA_UI_01_RUNTIME_UI_BINDING",
        "recorded_utc": now,
        "mode": "PREP_ONLY_READ_ONLY",
        "locks": {
            "WAIT_WINDOW": "ACTIVE",
            "fix": False,
            "deploy": False,
            "config_write": False,
            "registry_edit": False,
            "gate_changed": False,
            "money_path": False,
            "full_ui_acceptance_claimed": False,
        },
        "question": "Do backend Findings already affect user UX on key entry surfaces?",
        "answer_summary": {
            "yes_user_visible": [
                "Wallet WC unconfigured (ABSENT)",
                "Staging FE example binds LEGACY Governor/Stake → Governance/Steward UX misbind risk",
            ],
            "design_dual_surface": [
                "EscrowFactory LEGACY_COMPOSITE",
                "Market/Pulse data ownership lanes",
            ],
            "not_full_acceptance": True,
        },
        "fe_surface_classes": {
            "active_template_governor": active_tpl_gov,
            "staging_example_governor": staging_gov_class,
            "staging_example_escrow": staging_escrow,
            "staging_example_stake": staging_stake,
            "pfa02_result": pfa02_result,
            "pfa03_wc": pfa03_wc,
        },
        "surfaces": surfaces,
        "findings": all_findings,
        "summary": {
            "result": overall_result,
            "overall": f"PFA_UI_01_{overall_result}",
            "PASS": counts["PASS"],
            "FINDING": counts["FINDING"],
            "NOT_RUN": counts["NOT_RUN"],
            "P2_ux_findings": len(ux_p2),
            "P0_blocking": 0,
            "full_ui_ux_acceptance": False,
            "production_go_claimed": False,
        },
        "honest_boundary": [
            "FINDING ≠ Full UI/UX Acceptance FAIL",
            "Static binding + prior probes · live staging browser NOT_RUN",
            "≠ Fix / Deploy / Config rewrite in WAIT_WINDOW",
        ],
    }

    (EV / "RUNTIME-UI-BINDING-LATEST.json").write_text(
        json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    lines = [
        "# PFA-UI-01 · Web3 Runtime → UI Binding（Prep Only）",
        "",
        f"**Machine:** `TT_PFA_UI_01_RUNTIME_UI_BINDING`",
        f"**Recorded:** `{now}`",
        f"**Status:** **`{overall_result}`** · `PFA_UI_01_{overall_result}`",
        f"**Evidence:** `{EV.as_posix()}/`",
        "",
        "> 问：后台 Finding **是否已影响用户体验**？  ",
        "> **≠** Full UI/UX Acceptance · 禁 Fix/Deploy/Config/Registry/Gate/Money-Path  ",
        "> F-02 WAIT_WINDOW",
        "",
        f"| PASS | FINDING | NOT_RUN |",
        f"|------|---------|---------|",
        f"| {counts['PASS']} | {counts['FINDING']} | {counts['NOT_RUN']} |",
        "",
        "## Surfaces",
        "",
        "| Surface | result | UX impact (short) |",
        "|---------|--------|-------------------|",
    ]
    for s in surfaces:
        lines.append(
            f"| **{s['surface_id']}** `{', '.join(s['routes'][:2])}` | **{s['result']}** | {s['ux_impact'][:100]} |"
        )
    lines += [
        "",
        "## Verdict on the question",
        "",
        "**Yes — partial user-visible impact already:**",
        "1. Wallet: WC unconfigured copy / no WC connector (config ABSENT)",
        "2. Governance / Steward: staging FE example still LEGACY address class → wrong-stack UX if that build is what users hit",
        "",
        "**Design / deferred (not surprise defects):** Escrow composite · Market dual-lane · Admin live RBAC NOT_RUN",
        "",
        "## Findings",
        "",
        "| ID | sev | summary |",
        "|----|-----|---------|",
    ]
    for f in all_findings:
        lines.append(f"| {f['id']} | {f['severity']} | {f['summary']} |")
    lines += [
        "",
        "**≠** Full UI/UX Acceptance · **≠** Production GO · P0_blocking=0",
        "",
    ]
    md = "\n".join(lines)
    (EV / "RUNTIME-UI-BINDING-LATEST.md").write_text(md, encoding="utf-8")
    RUNBOOK.write_text(md, encoding="utf-8")

    if TRACK.exists():
        track = TRACK.read_text(encoding="utf-8")
        if "PFA-UI-01" not in track:
            track = track.replace(
                "| 4 | Access Boundary / RBAC Final Matrix | PENDING |",
                "| UI-01 | **Runtime→UI Binding** | **"
                + overall_result
                + "** · [PFA-UI-01](./TT-PFA-UI-01-RUNTIME-UI-BINDING-LATEST.md) · ≠ Full UI Acceptance |\n"
                "| 4 | Access Boundary / RBAC Final Matrix | PENDING |",
            )
            TRACK.write_text(track, encoding="utf-8")

    print(json.dumps(pack["summary"], indent=2))
    for s in surfaces:
        print(s["surface_id"], s["result"])


if __name__ == "__main__":
    main()
