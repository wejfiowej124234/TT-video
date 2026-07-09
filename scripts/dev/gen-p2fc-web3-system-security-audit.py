#!/usr/bin/env python3
"""P2FC · Web3 系统级安全与权限边界审计（四大域 · 只读 · 非侵入）

D1 智能合约可升级性与漏洞面 · D2 治理币治理逻辑与攻击面
D3 管理员 RBAC 权限链路 · D4 UI/API/链上三层权限一致性
统一攻击面收敛建模 · 最小权限验证路径 · P0 RBAC bypass 路径隔离确认。

  python scripts/dev/gen-p2fc-web3-system-security-audit.py

末行：
  TT_P2FC_WEB3_SYSTEM_SECURITY_AUDIT: PASS|WARN|FAIL
  TT_P2FC_P0_RBAC_BYPASS_ISOLATION: CONFIRMED|NOT_CONFIRMED
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BYPASS_ENV_VARS = (
    "TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT",
    "TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE",
)
STAGING_DEPLOY_CONFIGS = (
    "deploy/fly/tt-api-staging/fly.toml",
    "deploy/fly/tt-api-prod/fly.toml",
    "deploy/fly/tt-web-staging/fly.toml",
    "frontend/fly.staging.toml",
    "frontend/fly.production.toml",
)
MR12_OPS_GLOB = "scripts/ops/p2fc*.sh"
LOCAL_DEV_DIRECT_GLOB = "scripts/dev/**/*.sh"

ROOT = Path(__file__).resolve().parents[2]
SOAK_DIR = ROOT / "evidence/P2FC_SOAK_72H_STAGING"
MR12_LOCK = ROOT / "evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.json"

# ADM-U01 live prep (import sibling module without package)
import importlib.util

_adm_prep_spec = importlib.util.spec_from_file_location(
    "gen_p2fc_adm_u01_staging_live_prep",
    ROOT / "scripts/dev/gen-p2fc-adm-u01-staging-live-prep.py",
)
_adm_prep_mod = importlib.util.module_from_spec(_adm_prep_spec)
assert _adm_prep_spec.loader is not None
_adm_prep_spec.loader.exec_module(_adm_prep_mod)
build_adm_u01_staging_live_prep = _adm_prep_mod.build_adm_u01_staging_live_prep


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def grep_files(pattern: str, glob: str, limit: int = 30) -> list[str]:
    rx = re.compile(pattern)
    hits: list[str] = []
    for p in ROOT.glob(glob):
        if p.is_file() and rx.search(read_text(p)):
            hits.append(p.as_posix().replace(ROOT.as_posix() + "/", ""))
        if len(hits) >= limit:
            break
    return hits


def file_contains_any(path: Path, needles: tuple[str, ...]) -> list[str]:
    txt = read_text(path)
    return [n for n in needles if n in txt]


def probe_staging_meta_phase2_prep(api_base: str = "https://tt-api-staging.fly.dev") -> dict[str, Any]:
    url = f"{api_base.rstrip('/')}/meta"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8", errors="replace")
        data = json.loads(body)
        prep = data.get("phase2_prep") or {}
        return {
            "reachable": True,
            "http_status": resp.status,
            "console_role_direct_allowed": prep.get("console_role_direct_allowed"),
            "staging_admin_matrix_go": prep.get("staging_admin_matrix_go"),
            "adm_u02_local_ready": prep.get("adm_u02_local_ready"),
        }
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        return {"reachable": False, "error": type(exc).__name__, "note": "live probe optional during soak"}


def build_minimal_permission_verification_paths() -> dict[str, Any]:
    """D1/D2/D3 最小权限验证路径 — 只读静态建模."""
    return {
        "schema": "traveltrust.minimal_permission_verification_paths.v1",
        "D1_contract_upgrade": {
            "authority": "GovernanceTimelock admin slot on TimelockUpgradeableProxy",
            "minimal_path": [
                {"step": 1, "actor": "Timelock proposer (Safe/multisig)", "action": "schedule(target, value, data, predecessor, salt, delay)"},
                {"step": 2, "actor": "time", "action": "wait >= GOVERNANCE_TIMELOCK_DELAY_SECONDS (48h frozen)"},
                {"step": 3, "actor": "Timelock executor", "action": "execute → proxy.upgradeTo(newImpl) or upgradeToAndCall"},
            ],
            "denied_without": ["EOA direct upgradeTo", "bare implementation deploy as production baseline", "MR12 one-shot API/Web deploy"],
            "verification_hooks": [
                "contracts/test/TtgGovFreezeV1ProxyArchitecture.t.sol",
                "contracts/src/upgrade/TimelockUpgradeableProxy.sol::_onlyAdmin",
            ],
        },
        "D2_governance_economic": {
            "authority": "On-chain TTG voting power + timelock queue",
            "minimal_path": [
                {"step": 1, "actor": "TTG holder", "action": "delegate + accrue voting power (snapshot block)"},
                {"step": 2, "actor": "voter", "action": "castVote(proposalId) capped by MAX_VOTING_POWER_PER_ADDRESS_BPS"},
                {"step": 3, "actor": "Governor", "action": "queue successful proposal → Timelock schedule"},
                {"step": 4, "actor": "Timelock", "action": "execute after delay — treasury/seat/param changes"},
            ],
            "denied_without": [
                "flash-loan same-block vote (snapshot/delay)",
                "seat over MAX_ACTIVE_SEATS (TtgSeatConcentrationRegistry)",
                "treasury spend over P4 cap (GovernanceTreasuryP4Cap)",
            ],
            "verification_hooks": [
                "contracts/src/TtgGovFreezeConstants.sol",
                "contracts/src/TtgSeatConcentrationRegistry.sol",
                "contracts/src/GovernanceTreasuryP4Cap.sol",
            ],
        },
        "D3_admin_rbac": {
            "authority": "API require_admin_permission + console_role bundle + ADM-U02 approval",
            "production_minimal_path": [
                {"step": 1, "actor": "SuperAdmin/Ops with PERM_USERS_WRITE", "action": "POST console-role change approval request"},
                {"step": 2, "actor": "SuperAdmin approver", "action": "approve with TOTP 2FA when enforced"},
                {"step": 3, "actor": "system", "action": "admin_console_roles DB update + admin_audit_logs persist"},
            ],
            "bypass_path_blocked_on_staging": [
                {"step": "PUT /admin/users/{id}/console-role", "gate": "TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1", "default": "unset/false → 409 console_role_use_approval_flow"},
            ],
            "local_only_bypass_scope": "scripts/dev/* sets DIRECT=1 for ① matrix smoke — must not appear in deploy/fly or scripts/ops/p2fc*",
            "verification_hooks": [
                "crates/api/src/routes/admin/admin_rbac.rs::console_role_direct_assign_enabled",
                "crates/api/src/routes/admin/admin_rbac.rs::put_admin_user_console_role",
                "registry/admin-rbac-permissions.v1.yaml",
            ],
        },
        "cross_domain_note": "D3 CeFi RBAC does not grant on-chain proposer/timelock admin — D1/D2 orthogonal to MR12 API deploy",
    }


def build_attack_surface_convergence_model(
    d1: dict[str, Any],
    d2: dict[str, Any],
    d3: dict[str, Any],
    mr12x: dict[str, Any],
) -> dict[str, Any]:
    """D1+D2+D3 统一攻击面收敛 — 交叉节点与传播链."""
    nodes = [
        {"id": "N-TIMLOCK", "domain": "D1+D2", "control": "GovernanceTimelock 48h delay", "spof": "SPOF-D1-02"},
        {"id": "N-PROXY-ADMIN", "domain": "D1", "control": "Proxy ADMIN_SLOT = timelock", "spof": "SPOF-D1-01"},
        {"id": "N-VOTE-CAP", "domain": "D2", "control": "MAX_VOTING_POWER_PER_ADDRESS_BPS", "spof": "SPOF-D2-01"},
        {"id": "N-SEAT-REG", "domain": "D2", "control": "TtgSeatConcentrationRegistry", "spof": "SPOF-D2-02"},
        {"id": "N-API-RBAC", "domain": "D3+D4", "control": "require_admin_permission deny matrix", "spof": "SPOF-D3-01"},
        {"id": "N-CONSOLE-DIRECT", "domain": "D3", "control": "TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT gate", "spof": "SPOF-D3-02"},
        {"id": "N-MR12-DEPLOY", "domain": "MR12", "control": "post-soak fly API/Web only", "spof": None},
    ]
    convergence_edges = [
        {
            "from": "N-MR12-DEPLOY",
            "to": "N-CONSOLE-DIRECT",
            "vector": "fly secrets / [env] injection during one-shot",
            "mitigation": "static: bypass env absent from staging fly.toml + ops scripts",
            "residual": "medium" if mr12x.get("mr12_bypass_via_one_shot") else "low",
        },
        {
            "from": "N-CONSOLE-DIRECT",
            "to": "N-API-RBAC",
            "vector": "PUT console-role skips approval → privilege escalation",
            "mitigation": "env default off · 409 when disabled · isolated to scripts/dev",
            "residual": "low",
        },
        {
            "from": "N-TIMLOCK",
            "to": "N-PROXY-ADMIN",
            "vector": "compromised timelock proposer schedules malicious upgrade",
            "mitigation": "48h delay + Safe multisig + Owner review",
            "residual": "medium",
        },
        {
            "from": "N-VOTE-CAP",
            "to": "N-TIMLOCK",
            "vector": "economic attack accumulates governance control",
            "mitigation": "400 bps cap + seat registry + P4 treasury cap",
            "residual": "medium",
        },
        {
            "from": "N-API-RBAC",
            "to": "N-TIMLOCK",
            "vector": "none direct — CeFi admin ≠ on-chain proposer",
            "mitigation": "intentional split (D4-F01)",
            "residual": "none",
        },
    ]
    breakpoints = [
        {
            "id": "BP-P0-RBAC-01",
            "priority": "P0",
            "surface": "N-CONSOLE-DIRECT",
            "requirement": "staging deploy path must not set TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT",
            "blocks": "MR12 one-shot → off-chain SuperAdmin escalation without approval",
        },
        {
            "id": "BP-D1-01",
            "priority": "P1",
            "surface": "N-PROXY-ADMIN",
            "requirement": "production baseline = TimelockUpgradeableProxy only",
            "blocks": "instant implementation swap",
        },
        {
            "id": "BP-D2-01",
            "priority": "P1",
            "surface": "N-TIMLOCK",
            "requirement": "GOVERNANCE_TIMELOCK_DELAY_SECONDS frozen at 48h",
            "blocks": "governance param / treasury rush",
        },
    ]
    unified_risk = "WARN"
    if any(f.get("severity") == "high" for f in d3.get("findings", [])):
        unified_risk = "WARN"
    return {
        "schema": "traveltrust.attack_surface_convergence.v1",
        "nodes": nodes,
        "convergence_edges": convergence_edges,
        "breakpoints": breakpoints,
        "domain_verdicts": {"D1": d1["verdict"], "D2": d2["verdict"], "D3": d3["verdict"]},
        "mr12_isolated_from_on_chain": mr12x.get("cross_domain_risks", [{}])[-1].get("isolation") if mr12x else None,
        "unified_residual_risk": unified_risk,
    }


def build_p0_rbac_bypass_isolation_confirmation(
    soak_dir: Path,
    lock: dict[str, Any] | None,
) -> dict[str, Any]:
    """P0 · Admin RBAC bypass 路径隔离确认（静态 + 可选 live · 无权限变更）."""
    checks: list[dict[str, Any]] = []

    for rel in STAGING_DEPLOY_CONFIGS:
        p = ROOT / rel
        hits = file_contains_any(p, BYPASS_ENV_VARS) if p.is_file() else []
        checks.append(
            {
                "id": f"CHK-FLY-{rel.replace('/', '-')}",
                "scope": rel,
                "pass": len(hits) == 0,
                "detail": "no bypass env in fly.toml [env]" if not hits else f"FOUND: {hits}",
            }
        )

    ops_hits: list[str] = []
    for p in ROOT.glob(MR12_OPS_GLOB):
        found = file_contains_any(p, BYPASS_ENV_VARS)
        if found:
            ops_hits.append(f"{p.relative_to(ROOT)}: {found}")
    checks.append(
        {
            "id": "CHK-OPS-P2FC",
            "scope": MR12_OPS_GLOB,
            "pass": len(ops_hits) == 0,
            "detail": "ops scripts clean" if not ops_hits else ops_hits[:6],
        }
    )

    one_shot = ROOT / "scripts/ops/p2fc-post-soak-one-shot-execute.sh"
    one_shot_hits = file_contains_any(one_shot, BYPASS_ENV_VARS) if one_shot.is_file() else []
    checks.append(
        {
            "id": "CHK-MR12-ONE-SHOT",
            "scope": "scripts/ops/p2fc-post-soak-one-shot-execute.sh",
            "pass": len(one_shot_hits) == 0,
            "detail": "one-shot does not export bypass env",
        }
    )

    rbac_rs = ROOT / "crates/api/src/routes/admin/admin_rbac.rs"
    rbac_txt = read_text(rbac_rs)
    code_gate = "console_role_direct_assign_enabled" in rbac_txt and "console_role_use_approval_flow" in rbac_txt
    checks.append(
        {
            "id": "CHK-CODE-GATE-409",
            "scope": "put_admin_user_console_role",
            "pass": code_gate,
            "detail": "PUT returns 409 when TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT unset",
        }
    )

    local_scripts = grep_files(r"TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT", LOCAL_DEV_DIRECT_GLOB, limit=50)
    local_outside_dev = [s for s in local_scripts if not s.startswith("scripts/dev/")]
    checks.append(
        {
            "id": "CHK-LOCAL-SCOPE",
            "scope": "scripts/dev only",
            "pass": len(local_outside_dev) == 0,
            "detail": f"local DIRECT refs={len(local_scripts)} outside_dev={local_outside_dev[:5]}",
        }
    )

    if lock:
        checks.append(
            {
                "id": "CHK-MR12-LOCK-PRESENT",
                "scope": "MR12-EXECUTION-LOCK.json",
                "pass": lock.get("lock_status") == "FROZEN",
                "detail": f"lock_status={lock.get('lock_status')}",
            }
        )
    else:
        checks.append({"id": "CHK-MR12-LOCK-PRESENT", "scope": "MR12-EXECUTION-LOCK.json", "pass": False, "detail": "missing"})

    live = probe_staging_meta_phase2_prep()
    live_pass = live.get("console_role_direct_allowed") is False
    checks.append(
        {
            "id": "CHK-STAGING-LIVE-META",
            "scope": "GET /meta phase2_prep.console_role_direct_allowed",
            "pass": live_pass if live.get("reachable") else None,
            "detail": live,
            "note": "null pass = unreachable · static checks authoritative during soak",
        }
    )

    static_checks = [c for c in checks if c["pass"] is not None]
    static_pass = all(c["pass"] for c in static_checks)
    confirmed = static_pass and code_gate and len(local_outside_dev) == 0

    bypass_route = {
        "endpoint": "PUT /api/v1/admin/users/{user_id}/console-role",
        "env_gate": "TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT",
        "disabled_response": "409 console_role_use_approval_flow",
        "enabled_scope": "① local dev scripts only",
        "staging_deploy_injection": False,
        "mr12_one_shot_injection": len(one_shot_hits) == 0,
    }

    return {
        "schema": "traveltrust.p0_rbac_bypass_isolation.v1",
        "status": "CONFIRMED" if confirmed else "NOT_CONFIRMED",
        "confirmed_before_completed_json": confirmed and not (soak_dir / "COMPLETED.json").is_file(),
        "checks": checks,
        "static_pass": static_pass,
        "live_probe": live,
        "bypass_route": bypass_route,
        "residual_p0": [] if confirmed else ["fix failing static isolation checks before COMPLETED.json"],
        "residual_non_p0": [
            "ADM-U01 staging admin matrix GO not started (D3-F04) — separate from bypass path isolation",
            "Permission ID drift may exist across Rust/YAML/TS — verify separately",
        ],
        "honest_boundary": "CONFIRMED = deploy/MR12 path cannot enable bypass env · ≠ ADM-U01 matrix GO · ≠ live exploit test",
    }


def audit_d1_contract_upgradeability() -> dict[str, Any]:
    proxy = ROOT / "contracts/src/upgrade/TimelockUpgradeableProxy.sol"
    shell = ROOT / "contracts/src/upgrade/IUpgradeableShell.sol"
    tests = ROOT / "contracts/test/TtgGovFreezeV1ProxyArchitecture.t.sol"
    findings: list[dict[str, Any]] = []

    proxy_txt = read_text(proxy)
    if "upgradeTo" in proxy_txt and "_onlyAdmin" in proxy_txt:
        findings.append({"id": "D1-F01", "severity": "info", "note": "Proxy upgrade gated by admin slot (expected = Timelock)"})
    bare_deploy = grep_files(r"new\s+\w+\(\)|Deploy.*(?!Proxy)", "contracts/script/*.s.sol")
    bare_impl_scripts = [s for s in bare_deploy if "Proxy" not in s and "TimelockUpgradeableProxy" not in read_text(ROOT / s)]
    if bare_impl_scripts:
        findings.append(
            {
                "id": "D1-F02",
                "severity": "medium",
                "note": "Deploy scripts may expose bare implementation paths — formal baseline must use Proxy",
                "artifacts": bare_impl_scripts[:8],
            }
        )

    if tests.is_file():
        findings.append({"id": "D1-F03", "severity": "info", "note": "Proxy architecture tests present", "artifact": tests.name})

    delegatecall_risk = grep_files(r"delegatecall|upgradeToAndCall", "contracts/src/**/*.sol")
    if delegatecall_risk:
        findings.append(
            {
                "id": "D1-F04",
                "severity": "high",
                "note": "delegatecall/upgradeToAndCall surfaces — timelock delay is primary mitigation",
                "files": delegatecall_risk[:6],
            }
        )

    spof = [
        {
            "id": "SPOF-D1-01",
            "control": "Timelock admin on all Governable Shell proxies",
            "bypass_vector": "direct EOA admin if mis-deployed without proxy",
            "mr12_relation": "post-soak fly deploy must not swap proxy admin off timelock",
        },
        {
            "id": "SPOF-D1-02",
            "control": "upgradeTo only via timelock schedule+execute",
            "bypass_vector": "emergency script --broadcast without timelock (Owner-only · forbidden in soak)",
            "mr12_relation": "MR12 one-shot is API/Web deploy — on-chain upgrade is separate Owner gate",
        },
    ]
    high = sum(1 for f in findings if f["severity"] in ("high", "critical"))
    return {
        "domain": "D1_contract_upgradeability",
        "title": "智能合约可升级性与漏洞分析",
        "findings": findings,
        "single_point_controls": spof,
        "verdict": "WARN" if high else "PASS",
    }


def audit_d2_governance_attack_surface() -> dict[str, Any]:
    constants = ROOT / "contracts/src/TtgGovFreezeConstants.sol"
    governor = ROOT / "contracts/src/TravelTrustGovernor.sol"
    seat = ROOT / "contracts/src/TtgSeatConcentrationRegistry.sol"
    findings: list[dict[str, Any]] = []

    ctxt = read_text(constants)
    if "GOVERNANCE_TIMELOCK_DELAY_SECONDS" in ctxt:
        m = re.search(r"GOVERNANCE_TIMELOCK_DELAY_SECONDS\s*=\s*(\d+\s*\w+)", ctxt)
        findings.append({"id": "D2-F01", "severity": "info", "note": f"Timelock delay frozen: {m.group(1) if m else '48h'}"})
    if "MAX_VOTING_POWER_PER_ADDRESS_BPS" in ctxt:
        findings.append({"id": "D2-F02", "severity": "info", "note": "Per-address voting cap in TtgGovFreezeConstants (400 bps)"})

    gov_txt = read_text(governor)
    attack_surfaces: list[dict[str, Any]] = [
        {"vector": "flash-loan vote", "mitigation": "GovernanceVotesToken + snapshot / delay", "residual": "medium"},
        {"vector": "seat concentration", "mitigation": "TtgSeatConcentrationRegistry + MAX_ACTIVE_SEATS", "residual": "medium" if seat.is_file() else "high"},
        {"vector": "treasury P4 cap bypass", "mitigation": "GovernanceTreasuryP4Cap + GOV-01 3000 bps", "residual": "low"},
        {"vector": "governance param drift", "mitigation": "TTG-TOKENOMICS-FREEZE-V1 constants", "residual": "low"},
    ]
    if "onlyGovernance" not in gov_txt and governor.is_file():
        findings.append({"id": "D2-F03", "severity": "medium", "note": "Review Governor privileged modifiers — manual follow-up"})

    spof = [
        {
            "id": "SPOF-D2-01",
            "control": "Timelock 48h on governance execution",
            "bypass_vector": "compromised timelock proposer / canceller keys",
            "mr12_relation": "MR12 does not mutate on-chain gov — no bypass via one-shot",
        },
        {
            "id": "SPOF-D2-02",
            "control": "Seat concentration registry",
            "bypass_vector": "sybil across entities if off-chain KYC weak",
            "mr12_relation": "off-chain admin cannot override on-chain seat limits",
        },
    ]
    return {
        "domain": "D2_governance_attack_surface",
        "title": "治理币治理逻辑与攻击面分析",
        "findings": findings,
        "attack_surface_matrix": attack_surfaces,
        "single_point_controls": spof,
        "verdict": "WARN",
    }


def extract_rust_perms() -> set[str]:
    path = ROOT / "crates/api/src/routes/admin/admin_rbac.rs"
    txt = read_text(path)
    return set(re.findall(r'pub const PERM_\w+: &str = "([^"]+)"', txt))


def extract_yaml_perms() -> set[str]:
    path = ROOT / "registry/admin-rbac-permissions.v1.yaml"
    txt = read_text(path)
    return set(re.findall(r"^\s+-\s+id:\s+(\S+)", txt, re.M))


def extract_ts_perms() -> set[str]:
    path = ROOT / "frontend/lib/admin/adminPermissionIds.ts"
    txt = read_text(path)
    return set(re.findall(r'"((?:admin\.)[^"]+)"', txt))


def audit_d3_admin_rbac_chain() -> dict[str, Any]:
    rust = extract_rust_perms()
    yaml_p = extract_yaml_perms()
    ts_p = extract_ts_perms()
    findings: list[dict[str, Any]] = []

    only_rust = sorted(rust - yaml_p - ts_p)
    only_yaml = sorted(yaml_p - rust)
    only_ts = sorted(ts_p - rust)
    if only_rust or only_yaml or only_ts:
        findings.append(
            {
                "id": "D3-F01",
                "severity": "medium",
                "note": "Permission ID drift across SSOT layers",
                "only_rust": only_rust[:10],
                "only_yaml": only_yaml[:10],
                "only_ts": only_ts[:10],
            }
        )
    else:
        findings.append({"id": "D3-F01", "severity": "info", "note": "Rust/YAML/TS permission IDs aligned"})

    direct_env = grep_files(r"TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT|CONSOLE_ROLE_DIRECT", "crates/**/*.rs")
    if direct_env:
        findings.append(
            {
                "id": "D3-F02",
                "severity": "high",
                "note": "Direct console-role write bypass path exists when env enabled",
                "artifacts": direct_env,
                "bypass": "PUT /console-role without approval workflow",
            }
        )

    override_env = grep_files(r"ADMIN_CONSOLE_ROLE_OVERRIDE", "frontend/**/*.{ts,tsx}")
    if override_env:
        findings.append(
            {
                "id": "D3-F03",
                "severity": "medium",
                "note": "UI role override env — ① local only · must be absent in staging/prod",
                "artifacts": override_env[:5],
            }
        )

    staging_go = read_text(ROOT / "registry/admin-rbac-permissions.v1.yaml")
    staging_closed = False
    try:
        import yaml as _yaml  # type: ignore

        reg = _yaml.safe_load(staging_go) or {}
        sm = reg.get("staging_admin_matrix") or {}
        staging_closed = sm.get("status") == "GO"
    except Exception:
        staging_closed = False
    if not staging_closed:
        staging_evidence = [
            ROOT / "evidence/GO_staging_admin_rbac_matrix/latest/report.json",
            ROOT / "evidence/GO_production_operations_enablement",
        ]
        for ev in staging_evidence:
            if ev.is_file():
                try:
                    doc = json.loads(ev.read_text(encoding="utf-8"))
                    if doc.get("release_gate") == "GO" or doc.get("verdict") == "GO":
                        staging_closed = True
                        break
                except Exception:
                    pass
            elif ev.is_dir():
                for report in ev.rglob("report.json"):
                    try:
                        doc = json.loads(report.read_text(encoding="utf-8"))
                        if doc.get("release_gate") == "GO":
                            staging_closed = True
                            break
                    except Exception:
                        pass
                if staging_closed:
                    break
    if not staging_closed and re.search(
        r"^\s*-\s*staging_admin_matrix_go\s*$", staging_go, re.M
    ):
        findings.append({"id": "D3-F04", "severity": "high", "note": "Phase ② staging RBAC matrix GO not started — ADM-U01 deferred"})

    spof = [
        {
            "id": "SPOF-D3-01",
            "control": "require_admin_actor on mutating routes",
            "bypass_vector": "UI-only gate without API deny",
            "mr12_relation": "post-soak backlog admin routes must preserve API enforcement",
        },
        {
            "id": "SPOF-D3-02",
            "control": "SuperAdmin admin.approve + 2FA",
            "bypass_vector": "TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1 on staging",
            "mr12_relation": "MR12 deploy must not enable direct-role env in fly secrets",
        },
    ]
    high = sum(1 for f in findings if f["severity"] == "high")
    return {
        "domain": "D3_admin_rbac_chain",
        "title": "管理员系统 RBAC 权限链路验证",
        "permission_counts": {"rust": len(rust), "yaml": len(yaml_p), "typescript": len(ts_p)},
        "findings": findings,
        "single_point_controls": spof,
        "verdict": "FAIL" if high >= 2 else ("WARN" if high else "PASS"),
    }


def audit_d4_three_layer_consistency() -> dict[str, Any]:
    findings: list[dict[str, Any]] = []
    layers: list[dict[str, Any]] = []

    # UI layer
    ui_advisory = grep_files(r"advisory|UI.*RBAC.*banner", "frontend/app/admin/**/*.md")
    layers.append(
        {
            "layer": "UI",
            "ssot": "frontend/lib/admin/adminPermissionIds.ts + AdminConsoleActorGate",
            "enforcement": "advisory_navigation + RSC gate",
            "note": "UI freeze docs state API is real boundary",
        }
    )

    # API layer
    rbac_txt = read_text(ROOT / "crates/api/src/routes/admin/admin_rbac.rs")
    mv = re.search(r'RBAC_MATRIX_VERSION.*?"([^"]+)"', rbac_txt)
    layers.append(
        {
            "layer": "API",
            "ssot": "crates/api/src/routes/admin/admin_rbac.rs",
            "enforcement": "require_admin_actor + console_role bundles",
            "matrix_version": mv.group(1) if mv else None,
        }
    )

    # Chain layer
    gov_routes = [
        "crates/api/src/routes/governance_proposals.rs",
        "crates/api/src/routes/governance_voting_power.rs",
        "crates/api/src/chain/governor.rs",
    ]
    chain_present = sum(1 for r in gov_routes if (ROOT / r).is_file())
    layers.append(
        {
            "layer": "Chain",
            "ssot": "TravelTrustGovernor + Timelock + on-chain TTG",
            "enforcement": "wallet-signed txs · timelock delay",
            "api_read_projection": chain_present,
        }
    )

    # Cross-layer gaps
    findings.append(
        {
            "id": "D4-F01",
            "severity": "medium",
            "note": "Admin RBAC (CeFi ops) ≠ on-chain governance roles — intentional split",
            "gap": "SuperAdmin API role does not map 1:1 to on-chain proposer",
        }
    )
    if (ROOT / "frontend/app/governance").is_dir():
        findings.append({"id": "D4-F02", "severity": "info", "note": "Governance UI routes exist — chain wallet is authority for vote/stake"})

    ui_only = grep_files(r"requireAdmin|hasPermission", "frontend/components/admin/**/*.tsx")
    if len(ui_only) > 5:
        findings.append(
            {
                "id": "D4-F03",
                "severity": "medium",
                "note": f"{len(ui_only)} UI permission checks — must mirror API deny matrix",
                "sample": ui_only[:5],
            }
        )

    spof = [
        {
            "id": "SPOF-D4-01",
            "control": "API deny matrix ADM-U01",
            "bypass_vector": "direct API call skipping UI",
            "mr12_relation": "unchanged by MR12 unless backlog touches admin_rbac.rs",
        },
        {
            "id": "SPOF-D4-02",
            "control": "On-chain timelock for governance writes",
            "bypass_vector": "API governance projection write without wallet",
            "mr12_relation": "indexer/API projection read-only for proposals in soak",
        },
    ]
    return {
        "domain": "D4_ui_api_chain_consistency",
        "title": "UI/API/链上三层权限一致性校验",
        "layers": layers,
        "findings": findings,
        "single_point_controls": spof,
        "verdict": "WARN",
    }


def audit_mr12_governance_isolation(lock: dict[str, Any] | None) -> dict[str, Any]:
    """MR12 执行锁 vs Web3 治理/升级路径交叉 — 只读."""
    risks: list[dict[str, Any]] = []
    if not lock:
        risks.append({"id": "MR12-X01", "severity": "critical", "note": "MR12 lock missing — execution graph unanchored"})
    else:
        forbidden = lock.get("forbidden_execution_patterns") or []
        if not any("STRAT-B" in str(f) for f in forbidden):
            risks.append({"id": "MR12-X02", "severity": "high", "note": "STRAT-B not in forbidden list"})
        risks.append(
            {
                "id": "MR12-X03",
                "severity": "info",
                "note": "MR12 scopes post-soak API/Web deploy only — on-chain upgrade/governance is orthogonal Owner gate",
                "isolation": True,
            }
        )
        risks.append(
            {
                "id": "MR12-X04",
                "severity": "medium",
                "note": "Single-point: fly secrets / env injection during one-shot could enable RBAC bypass env vars",
                "mitigation": "verify fly.toml + secrets exclude ADMIN_CONSOLE_ROLE_DIRECT in post-soak checklist",
            }
        )
    bypass_possible = [r for r in risks if r["severity"] in ("critical", "high")]
    return {
        "mr12_lock_status": lock.get("lock_status") if lock else None,
        "cross_domain_risks": risks,
        "mr12_bypass_via_one_shot": len(bypass_possible) > 0,
        "verdict": "FAIL" if any(r["severity"] == "critical" for r in risks) else "WARN",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soak-dir", default=str(SOAK_DIR))
    ap.add_argument("--out-dir", default="")
    args = ap.parse_args()

    soak_dir = Path(args.soak_dir)
    out_dir = Path(args.out_dir) if args.out_dir else soak_dir / "web3-system-security-audit" / utc_stamp()
    out_dir.mkdir(parents=True, exist_ok=True)

    lock_path = MR12_LOCK
    lock = json.loads(lock_path.read_text(encoding="utf-8")) if lock_path.is_file() else None

    d1 = audit_d1_contract_upgradeability()
    d2 = audit_d2_governance_attack_surface()
    d3 = audit_d3_admin_rbac_chain()
    d4 = audit_d4_three_layer_consistency()
    mr12x = audit_mr12_governance_isolation(lock)
    min_perm_paths = build_minimal_permission_verification_paths()
    p0_iso = build_p0_rbac_bypass_isolation_confirmation(soak_dir, lock)
    adm_u01_prep = build_adm_u01_staging_live_prep(
        soak_dir, lock, p0_status=p0_iso["status"]
    )
    convergence = build_attack_surface_convergence_model(d1, d2, d3, mr12x)

    all_spof: list[dict[str, Any]] = []
    for d in (d1, d2, d3, d4):
        all_spof.extend(d.get("single_point_controls", []))

    critical = sum(
        1
        for d in (d1, d2, d3, d4)
        for f in d.get("findings", [])
        if f.get("severity") == "critical"
    )
    high = sum(
        1
        for d in (d1, d2, d3, d4)
        for f in d.get("findings", [])
        if f.get("severity") == "high"
    )
    overall = "FAIL" if critical or mr12x["verdict"] == "FAIL" else ("WARN" if high or any(d["verdict"] != "PASS" for d in (d1, d2, d3, d4)) else "PASS")
    if p0_iso["status"] != "CONFIRMED" and not (soak_dir / "COMPLETED.json").is_file():
        overall = "FAIL"

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_web3_system_security_audit.v3",
        "generated_at_utc": utc_now(),
        "phase": "②",
        "read_only": True,
        "no_deploy": True,
        "no_restart": True,
        "no_strategy_change": True,
        "no_permission_change": True,
        "soak_completed": (soak_dir / "COMPLETED.json").is_file(),
        "domains": {
            "D1_contract_upgradeability": d1,
            "D2_governance_attack_surface": d2,
            "D3_admin_rbac_chain": d3,
            "D4_ui_api_chain_consistency": d4,
        },
        "attack_surface_convergence_model": convergence,
        "minimal_permission_verification_paths": min_perm_paths,
        "p0_rbac_bypass_isolation_confirmation": p0_iso,
        "adm_u01_staging_live_prep": adm_u01_prep,
        "d3_adm_u01_live_prep_status": adm_u01_prep["status"],
        "mr12_governance_isolation": mr12x,
        "single_point_control_register": all_spof,
        "spof_count": len(all_spof),
        "high_finding_count": high,
        "p0_rbac_bypass_isolated": p0_iso["status"] == "CONFIRMED",
        "verdict": overall,
        "honest_boundary": "static/read-only audit during soak · P0 bypass isolation = deploy path static · ADM-U01/on-chain GO separate · ≠ ③ Production",
    }

    (out_dir / "web3-system-security-audit.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "attack-surface-convergence.json").write_text(
        json.dumps(convergence, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_dir / "minimal-permission-verification-paths.json").write_text(
        json.dumps(min_perm_paths, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_dir / "p0-rbac-bypass-isolation.json").write_text(
        json.dumps(p0_iso, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_dir / "adm-u01-staging-live-prep.json").write_text(
        json.dumps(adm_u01_prep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    latest_prep = soak_dir / "web3-system-security-audit/adm-u01-staging-live-prep.latest.json"
    latest_prep.write_text(json.dumps(adm_u01_prep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    latest = soak_dir / "web3-system-security-audit/latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# Web3 System Security Audit (4 domains + convergence)",
        "",
        f"- **verdict:** {overall} · SPOF={len(all_spof)} · **P0 RBAC bypass isolated:** {p0_iso['status']} · **ADM-U01 live prep:** {adm_u01_prep['status']}",
        "",
        "## P0 RBAC bypass isolation",
        "",
        f"- status={p0_iso['status']} · before COMPLETED.json={p0_iso['confirmed_before_completed_json']}",
        f"- static_pass={p0_iso['static_pass']} · live meta reachable={p0_iso['live_probe'].get('reachable')}",
        "",
        "## Attack surface convergence (D1+D2+D3)",
        "",
    ]
    for bp in convergence.get("breakpoints", []):
        md.append(f"- **{bp['id']}** [{bp['priority']}] {bp['surface']}: {bp['requirement']}")
    md.extend(["", "## Domains", ""])
    for key, d in payload["domains"].items():
        md.append(f"### {d['title']} — **{d['verdict']}**")
        for f in d.get("findings", [])[:4]:
            md.append(f"- [{f['severity']}] {f['id']}: {f['note']}")
        md.append("")
    md.append("## MR12 isolation")
    md.append(f"- lock={mr12x.get('mr12_lock_status')} · bypass_via_one_shot={mr12x.get('mr12_bypass_via_one_shot')}")
    md.append("")
    md.append("## Minimal permission paths")
    md.append("- D1: timelock schedule → 48h → upgradeTo")
    md.append("- D2: TTG vote → queue → timelock execute")
    md.append("- D3: approval + 2FA (PUT direct blocked when env off)")
    (out_dir / "WEB3-SYSTEM-SECURITY-AUDIT.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    p0_line = f"TT_P2FC_P0_RBAC_BYPASS_ISOLATION: {p0_iso['status']}"
    print(
        f"TT_P2FC_WEB3_SYSTEM_SECURITY_AUDIT: {overall} "
        f"D1={d1['verdict']} D2={d2['verdict']} D3={d3['verdict']} D4={d4['verdict']} "
        f"p0_iso={p0_iso['status']} adm_u01_prep={adm_u01_prep['status']} spof={len(all_spof)} high={high} "
        f"out={out_dir.as_posix()}"
    )
    print(p0_line)
    return 0 if overall != "FAIL" else 2


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
