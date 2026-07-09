#!/usr/bin/env python3
"""P2FC · ADM-U01 staging RBAC matrix — 非侵入式 live 验证前置核查与最小权限路径准备。

Soak 只读窗口 · 不 deploy · 不重启 · 不改权限 · 保持 P0 RBAC bypass CONFIRMED。

  python scripts/dev/gen-p2fc-adm-u01-staging-live-prep.py

末行：TT_P2FC_ADM_U01_STAGING_LIVE_PREP: READY|BLOCKED
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

ROOT = Path(__file__).resolve().parents[2]
SOAK_DIR = ROOT / "evidence/P2FC_SOAK_72H_STAGING"
MR12_LOCK = ROOT / "evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.json"
PROBES_YAML = ROOT / "registry/admin-rbac-staging-probes.v1.yaml"
RBAC_RS = ROOT / "crates/api/src/routes/admin/admin_rbac.rs"
DEFAULT_API = "https://tt-api-staging.fly.dev"
DEFAULT_FE = "https://tt-web-staging.fly.dev"
ROLES = ["SuperAdmin", "Ops", "CS", "Risk", "Finance", "Auditor"]
SHELL_DOMAINS = ["workbench", "onboarding", "operations", "community", "finance", "governance", "more"]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def load_probes_registry() -> dict[str, Any]:
    txt = read_text(PROBES_YAML)
    if not txt:
        return {}
    try:
        import yaml  # type: ignore

        return yaml.safe_load(txt) or {}
    except Exception:
        probes = len(re.findall(r"^\s+-\s+id:\s+", txt, re.M))
        mv = re.search(r"^matrix_version:\s*(\S+)", txt, re.M)
        return {"matrix_version": mv.group(1) if mv else None, "probe_count_estimate": probes}


def extract_rust_matrix_version() -> str | None:
    m = re.search(r'RBAC_MATRIX_VERSION.*?"([^"]+)"', read_text(RBAC_RS))
    return m.group(1) if m else None


def http_probe(method: str, url: str, timeout: int = 15) -> dict[str, Any]:
    try:
        req = urllib.request.Request(url, method=method, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            code = resp.status
            body = resp.read(4096).decode("utf-8", errors="replace")
        parsed: Any = body
        try:
            parsed = json.loads(body) if body.strip().startswith("{") else body[:200]
        except json.JSONDecodeError:
            pass
        return {"reachable": True, "http_status": code, "body_sample": parsed}
    except urllib.error.HTTPError as exc:
        sample = exc.read(512).decode("utf-8", errors="replace") if exc.fp else ""
        return {"reachable": True, "http_status": exc.code, "body_sample": sample[:200]}
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return {"reachable": False, "error": type(exc).__name__}


def build_static_preconditions(lock: dict[str, Any] | None, p0_status: str) -> list[dict[str, Any]]:
    checks: list[dict[str, Any]] = []
    required_scripts = [
        "scripts/gates/run-admin-rbac-staging-matrix.py",
        "scripts/gates/smoke-admin-rbac-staging-matrix.sh",
        "scripts/dev/record-adm-u01-staging-evidence.sh",
        "scripts/dev/lib/staging-adm-u01-env.sh",
        "scripts/dev/lib/adm-staging-host-guard.sh",
        "frontend/e2e/admin-rbac-staging-six-roles.spec.ts",
    ]
    missing = [s for s in required_scripts if not (ROOT / s).is_file()]
    checks.append(
        {
            "id": "PRE-01-SCRIPT-INVENTORY",
            "pass": len(missing) == 0,
            "detail": missing or "all ADM-U01 live scripts present",
        }
    )

    migrations = [
        "crates/api/migrations/20260603120000_admin_console_roles_security_policy.sql",
        "crates/api/migrations/20250313000019_admin_approval_requests.sql",
        "crates/api/migrations/20250312000018_admin_audit_logs.sql",
    ]
    mig_missing = [m for m in migrations if not (ROOT / m).is_file()]
    checks.append(
        {
            "id": "PRE-02-DB-MIGRATIONS",
            "pass": len(mig_missing) == 0,
            "detail": mig_missing or "admin_console_roles + approval + audit migrations on disk",
        }
    )

    reg = load_probes_registry()
    rust_mv = extract_rust_matrix_version()
    yaml_mv = reg.get("matrix_version")
    mv_aligned = bool(rust_mv and yaml_mv and rust_mv == yaml_mv)
    checks.append(
        {
            "id": "PRE-03-MATRIX-VERSION-ALIGN",
            "pass": mv_aligned,
            "detail": {"rust": rust_mv, "yaml": yaml_mv},
        }
    )

    probe_count = len(reg.get("probes") or [])
    if probe_count == 0:
        probe_count = int(reg.get("probe_count_estimate") or 0)
    checks.append(
        {
            "id": "PRE-04-PROBE-REGISTRY",
            "pass": probe_count >= 10,
            "detail": f"probes={probe_count} registry={PROBES_YAML.name}",
        }
    )

    checks.append(
        {
            "id": "PRE-05-P0-BYPASS-CONFIRMED",
            "pass": p0_status == "CONFIRMED",
            "detail": f"p0_rbac_bypass_isolation={p0_status} (must stay CONFIRMED)",
        }
    )

    checks.append(
        {
            "id": "PRE-06-MR12-LOCK-FROZEN",
            "pass": (lock or {}).get("lock_status") == "FROZEN",
            "detail": f"lock_status={(lock or {}).get('lock_status')}",
        }
    )

    tunnel_only = ROOT / "evidence/GO_staging_admin_rbac_matrix/run_adm_u01_close_20260603/report.json"
    tunnel_note = "tunnel pre-run exists — not valid ② GO"
    if tunnel_only.is_file():
        try:
            tr = json.loads(tunnel_only.read_text(encoding="utf-8"))
            dk = (tr.get("environment") or {}).get("deployment_kind")
            tunnel_note = f"existing evidence deployment_kind={dk} — persistent Fly re-run required post-soak"
        except json.JSONDecodeError:
            pass
    checks.append(
        {
            "id": "PRE-07-NO-TUNNEL-GO-CLAIM",
            "pass": True,
            "detail": tunnel_note,
            "note": "informational — prior tunnel pre-run must not substitute live Fly matrix",
        }
    )

    return checks


def build_minimal_permission_paths_live(reg: dict[str, Any]) -> dict[str, Any]:
    probes = reg.get("probes") or []
    by_role: dict[str, dict[str, Any]] = {}
    for role in ROLES:
        by_role[role] = {"allow_probes": [], "deny_probes": [], "domains": {}}

    for probe in probes:
        pid = probe.get("id", "?")
        domain = probe.get("domain", "unknown")
        method = probe.get("method", "GET")
        path = probe.get("path", "")
        expect = probe.get("expect") or {}
        for role in ROLES:
            codes = expect.get(role) or []
            entry = {"id": pid, "method": method, "path": path, "expect_http": codes}
            is_deny_probe = method in ("POST", "PUT", "PATCH", "DELETE") or "deny" in pid or "forbidden" in pid
            if is_deny_probe and codes == [403]:
                by_role[role]["deny_probes"].append(entry)
            elif codes and 403 not in codes:
                by_role[role]["allow_probes"].append(entry)
            by_role[role]["domains"].setdefault(domain, {"allow": 0, "deny": 0})
            if 403 in codes:
                by_role[role]["domains"][domain]["deny"] += 1
            else:
                by_role[role]["domains"][domain]["allow"] += 1

    role_paths = {}
    for role in ROLES:
        bundle_map = {
            "SuperAdmin": "all_write_and_approve + PERM_USERS_WRITE approval path",
            "Ops": "legacy_admin_bundle — no SuperAdmin-only approve",
            "CS": "read_assist — deny publish/finance write",
            "Risk": "moderate_and_disputes_no_publish",
            "Finance": "finance_and_orders_read",
            "Auditor": "read_only_audit — all mutating writes 403",
        }
        role_paths[role] = {
            "console_role_70": role,
            "permission_bundle": bundle_map.get(role, "see admin_rbac.rs"),
            "live_verification": [
                f"Bearer TRAVELTRUST_ADMIN_TOKEN_{role.upper()} or DB admin_console_roles={role}",
                "GET /api/v1/admin/capabilities → console_role_70 matches",
                f"Run {len(by_role[role]['allow_probes']) + len(by_role[role]['deny_probes'])} registry probes",
            ],
            "probe_summary": {
                "allow_count": len(by_role[role]["allow_probes"]),
                "deny_count": len(by_role[role]["deny_probes"]),
                "domains": by_role[role]["domains"],
            },
            "minimal_path": {
                "auth": "login → Bearer token (staging seeded account)",
                "matrix": "run-admin-rbac-staging-matrix.py deny/pass per probe",
                "shell": "playwright admin-rbac-staging-six-roles.spec.ts per Shell domain",
                "console_role_change": "approval flow only (TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT unset)",
            },
        }

    return {
        "schema": "traveltrust.adm_u01_minimal_permission_paths.v1",
        "roles": ROLES,
        "shell_domains": SHELL_DOMAINS,
        "matrix_version": reg.get("matrix_version"),
        "per_role": role_paths,
        "global_minimal_path": [
            "STAGING_API_BASE + STAGING_FE_BASE (HTTPS Fly, not localhost/tunnel)",
            "STAGING_DATABASE_URL or six pre-provisioned Bearer tokens",
            "ADM_U01_REQUIRE_PERSISTENT_HOST=1 · ADM_U01_STRICT=1",
            "bash scripts/dev/record-adm-u01-staging-evidence.sh",
            "Expected: TT_ADM_U01_EVIDENCE: PASS · report.json release_gate=GO",
        ],
    }


def build_non_invasive_live_probes(api_base: str, fe_base: str) -> dict[str, Any]:
    probes: list[dict[str, Any]] = []
    probes.append({"id": "LIVE-01-HEALTH", "url": f"{api_base}/health", **http_probe("GET", f"{api_base}/health")})
    probes.append({"id": "LIVE-02-META", "url": f"{api_base}/meta", **http_probe("GET", f"{api_base}/meta", timeout=20)})
    meta = probes[-1]
    if meta.get("reachable") and isinstance(meta.get("body_sample"), dict):
        prep = (meta["body_sample"].get("phase2_prep") or {})
        meta["phase2_prep_extract"] = {
            "console_role_direct_allowed": prep.get("console_role_direct_allowed"),
            "staging_admin_matrix_go": prep.get("staging_admin_matrix_go"),
            "admin_console_role_db": prep.get("admin_console_role_db"),
        }
    probes.append(
        {
            "id": "LIVE-03-ADMIN-CAPABILITIES-UNAUTH",
            "url": f"{api_base}/api/v1/admin/capabilities",
            **http_probe("GET", f"{api_base}/api/v1/admin/capabilities"),
            "note": "expect 401/403 — confirms route exists without granting access",
        }
    )
    probes.append(
        {
            "id": "LIVE-04-FE-ADMIN-SHELL",
            "url": f"{fe_base}/admin",
            **http_probe("GET", f"{fe_base}/admin"),
            "note": "expect 200/307/308 for Playwright shell matrix entry",
        }
    )
    return {
        "schema": "traveltrust.adm_u01_non_invasive_probes.v1",
        "api_base": api_base,
        "fe_base": fe_base,
        "probes": probes,
        "honest_boundary": "read-only GET · no account registration · no console_role writes · no fly proxy side effects in this generator",
    }


def build_post_completed_activation_playbook() -> dict[str, Any]:
    return {
        "trigger": "evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json present + MR12 one-shot complete",
        "orchestrators": {
            "master": "scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh --watch",
            "mr12_one_shot": "scripts/ops/p2fc-post-soak-one-shot-execute.sh --watch",
            "admin_live_chain": "scripts/ops/p2fc-run-post-soak-admin-staging-live-chain.sh",
            "p0_runtime": "scripts/ops/p2fc-verify-p0-rbac-bypass-runtime.sh",
            "closure_evidence": "scripts/dev/gen-p2fc-post-soak-staging-live-closure-evidence.py",
        },
        "sequence_after_mr12": [
            {
                "step": 1,
                "action": "MR12 one-shot (8 steps) — existing frozen entrypoint",
                "gate": "TT_P2FC_POST_SOAK_ONE_SHOT: PASS",
            },
            {
                "step": 2,
                "action": "ADM-U01 live six-role RBAC matrix (persistent Fly)",
                "gate": "TT_ADM_U01_EVIDENCE: PASS + report.json release_gate GO",
            },
            {
                "step": 3,
                "action": "P0 RBAC bypass runtime re-verify (/meta + unauth PUT)",
                "gate": "TT_P2FC_P0_RBAC_BYPASS_RUNTIME: CONFIRMED",
            },
            {
                "step": 4,
                "action": "ADM-U02 staging 2FA/approval chain",
                "gate": "TT_ADM_U02_STAGING_EVIDENCE: PASS",
            },
            {
                "step": 5,
                "action": "B1–B4 blocker convergence from live checkpoint + evidence",
                "gate": "TT_P2FC_POST_SOAK_STAGING_LIVE_CLOSURE: PASS (open_blocker_count=0)",
            },
        ],
        "forbidden_during_prep": [
            "TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1 on staging",
            "direct PUT /admin/users/{id}/console-role without approval",
            "tunnel (*.loca.lt) or localhost as STAGING_API_BASE for GO claim",
            "claiming prep READY as ADM-U01 GO",
        ],
        "evidence_output": "evidence/P2FC_SOAK_72H_STAGING/post-soak-staging-live-closure/",
    }


def build_adm_u01_staging_live_prep(
    soak_dir: Path,
    lock: dict[str, Any] | None,
    p0_status: str = "CONFIRMED",
    api_base: str = DEFAULT_API,
    fe_base: str = DEFAULT_FE,
) -> dict[str, Any]:
    reg = load_probes_registry()
    static = build_static_preconditions(lock, p0_status)
    static_pass = all(c["pass"] for c in static if c.get("pass") is not None)
    live_probes = build_non_invasive_live_probes(api_base, fe_base)
    min_paths = build_minimal_permission_paths_live(reg)
    playbook = build_post_completed_activation_playbook()

    health_ok = any(
        p.get("http_status") == 200 for p in live_probes["probes"] if p["id"] == "LIVE-01-HEALTH"
    )
    live_blockers: list[str] = []
    if not health_ok:
        live_blockers.append("staging /health not 200 — defer live matrix until post-MR12 API stable")
    meta_probe = next((p for p in live_probes["probes"] if p["id"] == "LIVE-02-META"), {})
    if not meta_probe.get("reachable"):
        live_blockers.append("staging /meta unreachable (soak-known) — use static prep until API meta stable")

    ready = static_pass and p0_status == "CONFIRMED" and (lock or {}).get("lock_status") == "FROZEN"
    status = "READY" if ready else "BLOCKED"

    return {
        "schema": "traveltrust.adm_u01_staging_live_prep.v1",
        "generated_at_utc": utc_now(),
        "phase": "②",
        "read_only": True,
        "no_deploy": True,
        "no_restart": True,
        "no_permission_change": True,
        "mr12_unchanged": True,
        "p0_rbac_bypass_status": p0_status,
        "p0_rbac_bypass_unchanged": p0_status == "CONFIRMED",
        "soak_completed": (soak_dir / "COMPLETED.json").is_file(),
        "live_verification_deferred_until": "COMPLETED.json + MR12 one-shot (if not yet run)",
        "status": status,
        "static_preconditions": static,
        "static_preconditions_pass": static_pass,
        "non_invasive_live_probes": live_probes,
        "live_readiness_blockers": live_blockers,
        "minimal_permission_verification_paths": min_paths,
        "post_completed_activation_playbook": playbook,
        "d3_adm_u01_note": "D3-F04 open = matrix GO not started; this prep enables post-soak live run without changing bypass isolation",
        "honest_boundary": "READY = static prep complete · live matrix still requires STAGING_DATABASE_URL + record-adm-u01-staging-evidence.sh · ≠ ③ Production GO",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soak-dir", default=str(SOAK_DIR))
    ap.add_argument("--api-base", default=DEFAULT_API)
    ap.add_argument("--fe-base", default=DEFAULT_FE)
    ap.add_argument("--p0-status", default="")
    ap.add_argument("--merge-web3-ssot", action="store_true")
    args = ap.parse_args()

    soak_dir = Path(args.soak_dir)
    lock_path = MR12_LOCK
    lock = json.loads(lock_path.read_text(encoding="utf-8")) if lock_path.is_file() else None

    p0_status = args.p0_status.strip()
    if not p0_status:
        latest_web3 = soak_dir / "web3-system-security-audit/latest.json"
        if latest_web3.is_file():
            try:
                w3 = json.loads(latest_web3.read_text(encoding="utf-8"))
                p0_status = (w3.get("p0_rbac_bypass_isolation_confirmation") or {}).get("status") or "UNKNOWN"
            except json.JSONDecodeError:
                p0_status = "UNKNOWN"
        else:
            p0_status = "UNKNOWN"

    payload = build_adm_u01_staging_live_prep(soak_dir, lock, p0_status, args.api_base, args.fe_base)

    out_root = soak_dir / "web3-system-security-audit"
    out_root.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    stamp_dir = out_root / stamp
    stamp_dir.mkdir(parents=True, exist_ok=True)

    (stamp_dir / "adm-u01-staging-live-prep.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_root / "adm-u01-staging-live-prep.latest.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    if args.merge_web3_ssot:
        latest = out_root / "latest.json"
        if latest.is_file():
            try:
                w3 = json.loads(latest.read_text(encoding="utf-8"))
                w3["adm_u01_staging_live_prep"] = payload
                w3["d3_adm_u01_live_prep_status"] = payload["status"]
                latest.write_text(json.dumps(w3, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            except json.JSONDecodeError:
                pass

    print(f"TT_P2FC_ADM_U01_STAGING_LIVE_PREP: {payload['status']} static_pass={payload['static_preconditions_pass']} p0={p0_status} live_blockers={len(payload['live_readiness_blockers'])}")
    return 0 if payload["status"] == "READY" else 2


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
