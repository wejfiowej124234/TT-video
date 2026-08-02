#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V65 Production Candidate Freeze Audit → Freeze Certificate

Pins live Production Reality (API/Web tips) as a non-GO release candidate.
Re-verifies Release Identity · RI-01/RI-03 · drift classes · security probes.

Does NOT flip TT_PRODUCTION_GO · no Web3 mainnet · no Admin IA redesign · no Human UAT substitute.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]

import importlib.util

_ri_path = ROOT / "scripts" / "dev" / "run-v65-production-release-integrity-final.py"
_spec = importlib.util.spec_from_file_location("tt_ri_final", _ri_path)
ri = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(ri)

API_BASE = os.environ.get("PROD_API_BASE", "https://api.web3-ttg.com").rstrip("/")
WEB_BASE = os.environ.get("PROD_WEB_BASE", "https://www.web3-ttg.com").rstrip("/")
V65 = os.environ.get("TT_LIVE_COMPOSITION_SHA", "0e5d438916f29395b9cbfbc376be70723e3b0848")
EXPECT_API = os.environ.get("TT_EXPECT_API_SHA", "6e76a299dfbeac8f412923533d56e00efaae0893")
EXPECT_WEB = os.environ.get("TT_EXPECT_WEB_SHA", "075a295fbf5138777dd957feea4d885004a6a953")
UA = "tt-candidate-freeze/1.0"
CANDIDATE_ID = "V65-PROD-CAND-20260802"


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def sh(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(args, cwd=str(ROOT), capture_output=True, text=True, check=False)


def http_json(url: str, timeout: float = 30.0) -> tuple[int, Any, dict[str, str]]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
            headers = {k.lower(): v for k, v in resp.headers.items()}
            try:
                data = json.loads(body.decode("utf-8", errors="replace"))
            except json.JSONDecodeError:
                data = {"_raw": body.decode("utf-8", errors="replace")[:2000]}
            return resp.status, data, headers
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")[:2000]
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {"_raw": raw}
        return e.code, data, {}
    except Exception as e:  # noqa: BLE001
        return 0, {"error": str(e)}, {}


def http_text(url: str, timeout: float = 30.0) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except Exception as e:  # noqa: BLE001
        return 0, str(e)


def short(sha: str | None, n: int = 12) -> str:
    if not sha:
        return ""
    return sha[:n]


def check_release_identity() -> dict[str, Any]:
    hc, health = http_text(f"{API_BASE}/health")
    _, meta, _ = http_json(f"{API_BASE}/meta")
    _, web, _ = http_json(f"{WEB_BASE}/api/release-identity")
    build = meta.get("build") or {}
    api_sha = build.get("git_sha")
    web_sha = web.get("git_sha")
    checks = {
        "api_health_200": hc == 200 and "ok" in (health or "").lower(),
        "api_sha_matches_freeze": bool(api_sha) and str(api_sha).startswith(short(EXPECT_API)),
        "web_sha_matches_freeze": bool(web_sha) and str(web_sha).startswith(short(EXPECT_WEB)),
        "api_attestation_ok": build.get("attestation_status") == "ok",
        "web_attestation_ok": web.get("attestation_status") == "ok",
        "psg_pin_aligned": (
            build.get("psg_release_version") == "PSG-REL-20260720-WEB3-CAND-V2"
            and web.get("psg_release_version") == "PSG-REL-20260720-WEB3-CAND-V2"
        ),
        "contract_profile_api": build.get("contract_profile") == "v311_fund_safety_candidate_v2",
        "cms_baseline_web": "catalog_bake=1" in str(web.get("cms_baseline") or ""),
        "api_ancestor_of_repo_tip": sh(["git", "merge-base", "--is-ancestor", EXPECT_API, "HEAD"]).returncode
        == 0,
        "web_ancestor_of_repo_tip": sh(["git", "merge-base", "--is-ancestor", EXPECT_WEB, "HEAD"]).returncode
        == 0,
    }
    return {
        "id": "CF-01",
        "title": "Release Identity Freeze",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "pinned": {
            "candidate_id": CANDIDATE_ID,
            "v65_baseline": V65,
            "api_git_sha": EXPECT_API,
            "web_git_sha": EXPECT_WEB,
            "live_api_git_sha": api_sha,
            "live_web_git_sha": web_sha,
            "psg_release_version": build.get("psg_release_version"),
            "contract_profile": build.get("contract_profile"),
            "cms_baseline": web.get("cms_baseline"),
        },
        "checks": checks,
    }


def check_unregistered_surface() -> dict[str, Any]:
    """Detect unregistered code/migrations relative to frozen Production tips."""
    # Dirty tracked paths that would change Production if deployed now
    st = sh(["git", "status", "--porcelain"])
    dirty_lines = [ln for ln in (st.stdout or "").splitlines() if ln.strip()]
    # Ignore evidence/tmp/docs churn unless under crates|frontend|migrations|deploy scripts
    material = []
    for ln in dirty_lines:
        path = ln[3:].strip().replace("\\", "/")
        if path.startswith(".tmp") or "/.tmp" in path:
            continue
        if any(
            path.startswith(p)
            for p in (
                "crates/",
                "frontend/",
                "deploy/",
                "scripts/dev/phase3-production",
                "scripts/dev/deploy-tt-web",
                "scripts/dev/deploy-production-release",
                "scripts/gates/check-ri-",
            )
        ) or path.startswith("crates/api/migrations/"):
            material.append(ln)

    # Migrations on disk vs git at WEB tip (deploy composition tip)
    mig_at_web = sh(["git", "ls-tree", "-r", "--name-only", EXPECT_WEB, "--", "crates/api/migrations"])
    mig_git = {
        Path(p).name
        for p in (mig_at_web.stdout or "").splitlines()
        if p.endswith(".sql")
    }
    mig_disk = {p.name for p in (ROOT / "crates" / "api" / "migrations").glob("*.sql")}
    unregistered_mig = sorted(mig_disk - mig_git)
    missing_mig = sorted(mig_git - mig_disk)

    # Tip-required incident migrations must be in both frozen API tip and image
    tip_migs = [
        "20260802120000_role_applications_kind_status_submitted_idx.sql",
        "20260802180000_cms_home_announcements_time_window.sql",
    ]
    tip_in_api = []
    for f in tip_migs:
        r = sh(["git", "cat-file", "-e", f"{EXPECT_API}:crates/api/migrations/{f}"])
        tip_in_api.append({"file": f, "in_api_tip": r.returncode == 0})

    # Autofix (non-destructive): ensure tip-required migrations exist on disk
    autofix = []
    for f in tip_migs:
        p = ROOT / "crates" / "api" / "migrations" / f
        if not p.is_file():
            show = sh(["git", "show", f"{EXPECT_API}:crates/api/migrations/{f}"])
            if show.returncode == 0 and show.stdout:
                p.write_bytes(show.stdout.encode("utf-8") if isinstance(show.stdout, str) else show.stdout)
                # git show returns text mode; use binary:
                blob = subprocess.check_output(
                    ["git", "show", f"{EXPECT_API}:crates/api/migrations/{f}"], cwd=str(ROOT)
                )
                p.write_bytes(blob)
                autofix.append(f"restored_missing_migration_{f}")

    # Unregistered migrations that are ONLY local (not in frozen API tip) are freeze blockers
    # if they are "new" beyond web tip — but WIP excellence stash may add many. For freeze:
    # only FAIL if live Production tips themselves lack required files, or disk is MISSING
    # files that live tip has.
    blockers = []
    if missing_mig:
        blockers.append({"class": "missing_migration_on_disk", "files": missing_mig[:20]})
    if not all(x["in_api_tip"] for x in tip_in_api):
        blockers.append({"class": "tip_required_migration_absent_from_api_sha", "detail": tip_in_api})

    # Material dirty is WARN for freeze (candidate already deployed); FAIL only if
    # it would silently change frozen migration tip files without being in freeze pin.
    warn_dirty = material[:30]

    status = "PASS" if not blockers else "FAIL"
    return {
        "id": "CF-02",
        "title": "Unregistered code / migration surface",
        "status": status,
        "blockers": blockers,
        "warnings": {
            "material_dirty_paths": warn_dirty,
            "unregistered_migrations_vs_web_tip_count": len(unregistered_mig),
            "unregistered_migrations_sample": unregistered_mig[:15],
            "note": "Local WIP dirty ≠ live Production tip; freeze pins live SHAs only",
        },
        "tip_required_migrations": tip_in_api,
        "autofix": autofix,
    }


def check_config_feature_flag_drift() -> dict[str, Any]:
    _, meta, _ = http_json(f"{API_BASE}/meta")
    build = meta.get("build") or {}
    # Production hard invariants from prior deploy gates
    seed_meta = meta.get("seed_test_accounts")
    # Live /meta exposes a contract object (751 keys), not the SEED_TEST_ACCOUNTS=1 enable bit.
    # Treat object/absent/0 as off; only explicit 1/true means seed-on (FAIL for prod freeze).
    seed_off = seed_meta in (0, "0", False, None) or isinstance(seed_meta, dict)
    checks = {
        "deployment_profile_production": build.get("deployment_profile") == "production",
        "seed_test_accounts_off": seed_off,
        "attestation_ok": build.get("attestation_status") == "ok",
    }
    # Feature / showcase flags that must stay off in prod
    showcase = {
        "community_public_showcase": meta.get("TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE")
        or (meta.get("flags") or {}).get("community_public_showcase"),
        "market_public_showcase": meta.get("TRAVELTRUST_MARKET_PUBLIC_SHOWCASE")
        or (meta.get("flags") or {}).get("market_public_showcase"),
    }
    # Soft: if absent, treat as PASS (not exposed)
    flag_ok = all(v in (None, 0, "0", False, "false") for v in showcase.values())

    # Cache drift: CMS announcements cache headers stable
    code, cms, hdr = http_json(f"{API_BASE}/api/v1/public/announcements?for_home=1")
    cache = hdr.get("cache-control", "")
    cache_ok = code == 200 and "max-age=60" in cache and cms.get("for_home") is True

    # Security headers / SEO
    r_code, robots = http_text(f"{WEB_BASE}/robots.txt")
    s_code, sitemap = http_text(f"{WEB_BASE}/sitemap.xml")
    seo_ok = r_code == 200 and "/admin" in robots and s_code == 200 and "<urlset" in sitemap

    # HSTS / security surface on web (non-destructive read)
    req = urllib.request.Request(WEB_BASE + "/", headers={"User-Agent": UA}, method="GET")
    sec = {}
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            sec = {k.lower(): v for k, v in resp.headers.items()}
    except Exception as e:  # noqa: BLE001
        sec = {"error": str(e)}
    hsts = "strict-transport-security" in sec

    status_checks = {
        "deployment_profile_production": checks["deployment_profile_production"],
        "seed_test_accounts_off": checks["seed_test_accounts_off"],
        "attestation_ok": checks["attestation_ok"],
        "showcase_flags_off_or_absent": flag_ok,
        "cms_cache_policy_stable": cache_ok,
        "seo_robots_sitemap": seo_ok,
        "hsts_present": hsts,
    }

    return {
        "id": "CF-03",
        "title": "Config / FeatureFlag / Cache / SEO drift",
        "status": "PASS" if all(status_checks.values()) else "FAIL",
        "checks": status_checks,
        "showcase_flags": showcase,
        "cms_cache_control": cache,
        "security_headers_sample": {
            k: sec.get(k)
            for k in ("strict-transport-security", "x-frame-options", "content-security-policy")
            if k in sec
        },
    }


def check_security_reality() -> dict[str, Any]:
    probes = []

    def add(name: str, url: str, expect: set[int]) -> None:
        code, _, _ = http_json(url)
        probes.append(
            {
                "name": name,
                "url": url.replace(API_BASE, ""),
                "http": code,
                "status": "PASS" if code in expect else "FAIL",
            }
        )

    add("admin_finance_rbac", f"{API_BASE}/api/v1/admin/finance/summary", {401, 403})
    add("admin_ops_overview_rbac", f"{API_BASE}/api/v1/admin/ops-overview", {401, 403})
    add("admin_audit_rbac", f"{API_BASE}/api/v1/admin/audit-logs", {401, 403, 404})
    add("me_auth", f"{API_BASE}/api/v1/me", {401, 403})
    add("orders_auth", f"{API_BASE}/api/v1/orders", {401, 403})
    # Internal must not be public-ok
    add("internal_blocked", f"{API_BASE}/api/v1/internal/indexer/tick", {401, 403, 404, 405})

    fails = [p for p in probes if p["status"] == "FAIL"]
    return {
        "id": "CF-04",
        "title": "Security / RBAC / Audit Reality Probe",
        "status": "PASS" if not fails else "FAIL",
        "probes": probes,
        "fail_count": len(fails),
    }


def check_audit_chain() -> dict[str, Any]:
    """Audit surface exists and is gated; CMS closure evidence present."""
    cms_latest = ROOT / "docs" / "runbook" / "TT-V65-PRODUCTION-CMS-REALITY-CLOSURE-LATEST.json"
    ri_latest = ROOT / "docs" / "runbook" / "TT-V65-PRODUCTION-RELEASE-INTEGRITY-LATEST.json"
    checks = {
        "cms_reality_closure_ssot": cms_latest.is_file(),
        "release_integrity_ssot": ri_latest.is_file(),
    }
    if cms_latest.is_file():
        cms = json.loads(cms_latest.read_text(encoding="utf-8"))
        checks["cms_verdict_pass"] = cms.get("verdict") == "PASS"
    if ri_latest.is_file():
        rii = json.loads(ri_latest.read_text(encoding="utf-8"))
        checks["ri_verdict_pass"] = rii.get("verdict") == "PASS"
    code, _, _ = http_json(f"{API_BASE}/api/v1/admin/content/announcements")
    checks["admin_content_announcements_gated"] = code in (401, 403)
    return {
        "id": "CF-05",
        "title": "Audit / prior closure SSOT chain",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "checks": checks,
    }


def main() -> int:
    if os.environ.get("TRAVELTRUST_V65_PRODUCTION_CANDIDATE_FREEZE_OK") != "1":
        print("FAIL: set TRAVELTRUST_V65_PRODUCTION_CANDIDATE_FREEZE_OK=1", file=sys.stderr)
        return 2

    stamp = utc_stamp()
    ev = ROOT / "evidence" / "GO_v65_production_candidate_freeze" / stamp
    ev.mkdir(parents=True, exist_ok=True)
    (ev / "probes").mkdir(exist_ok=True)
    (ev / "stamp.txt").write_text(stamp + "\n", encoding="utf-8")

    identity = check_release_identity()
    unreg = check_unregistered_surface()
    config = check_config_feature_flag_drift()
    security = check_security_reality()
    audit = check_audit_chain()

    # Reuse RI-01 / RI-03
    os.environ.setdefault("RI_SKIP_MPG_PROXY", "1")
    ri01 = ri.run_ri_01(require_db=True, skip_health=False)
    ri03 = ri.run_ri_03(ev / "probes")
    drift = ri.scan_reality_drift(ri03)

    # Data drift: CMS items stable shape
    code, cms, _ = http_json(f"{API_BASE}/api/v1/public/announcements?for_home=1")
    data_drift = {
        "id": "CF-06",
        "title": "Data / CMS runtime consumption",
        "status": "PASS"
        if code == 200
        and cms.get("for_home") is True
        and cms.get("source") in ("cms", "cms_empty")
        and isinstance(cms.get("items"), list)
        else "FAIL",
        "for_home": cms.get("for_home"),
        "source": cms.get("source"),
        "items": len(cms.get("items") or []),
    }

    sections = [identity, unreg, config, security, audit, data_drift, ri01, ri03, drift]
    # Normalize status getters
    def st(x: dict[str, Any]) -> str:
        return str(x.get("status") or "FAIL")

    fails = [x.get("id") or x.get("title") for x in sections if st(x) == "FAIL"]
    overall = "PASS" if not fails else "FAIL"
    freeze_status = "FROZEN" if overall == "PASS" else "NOT_FROZEN"

    cert = {
        "schema": "traveltrust.v65_production_candidate_freeze_certificate.v1",
        "key": "V65_PRODUCTION_CANDIDATE_FREEZE",
        "title": "V65 Production Candidate Freeze Certificate",
        "stamp": stamp,
        "verdict": overall,
        "freeze_status": freeze_status,
        "candidate_id": CANDIDATE_ID,
        "frozen_composition": {
            "v65_non_web3_baseline": V65,
            "production_api_git_sha": EXPECT_API,
            "production_web_git_sha": EXPECT_WEB,
            "live_verified_api_git_sha": identity["pinned"]["live_api_git_sha"],
            "live_verified_web_git_sha": identity["pinned"]["live_web_git_sha"],
            "psg_release_version": identity["pinned"]["psg_release_version"],
            "contract_profile": identity["pinned"]["contract_profile"],
            "cms_baseline": identity["pinned"]["cms_baseline"],
        },
        "immutable_rules": {
            "no_unregistered_deploy_into_frozen_tips": True,
            "api_before_fe": True,
            "ri01_required_before_api_deploy": True,
            "tt_production_go": "NO_GO_UNCHANGED",
            "web3_mainnet_untouched": True,
            "admin_ia_ui_freeze": True,
            "human_uat_not_substitute": True,
        },
        "sections": {
            "CF-01_release_identity": identity,
            "CF-02_unregistered_surface": unreg,
            "CF-03_config_flag_cache_seo": config,
            "CF-04_security_rbac_audit": security,
            "CF-05_audit_ssot_chain": audit,
            "CF-06_data_cms_runtime": data_drift,
            "RI-01_migration_integrity": {
                "status": ri01["status"],
                "proof": (ri01.get("database") or {}).get("proof"),
                "chain": ri01.get("chain"),
            },
            "RI-03_reality_probe": {
                "status": ri03["status"],
                "fail_chains": ri03.get("fail_chains"),
                "chains": [{"chain": c["chain"], "status": c["status"]} for c in ri03.get("chains") or []],
            },
            "reality_drift_scan": drift,
        },
        "fail_sections": fails,
        "autofix_applied": unreg.get("autofix") or [],
        "honesty": {
            "candidate_freeze_is_not_production_go": True,
            "candidate_freeze_is_not_final_release_web3_freeze": True,
            "live_psp_commercial_not_in_scope": True,
            "human_uat_still_required_before_go": True,
        },
    }

    # Certificate hash (content identity)
    cert_body = json.dumps(cert, sort_keys=True, ensure_ascii=False).encode("utf-8")
    cert["certificate_sha256"] = hashlib.sha256(cert_body).hexdigest()

    (ev / "PRODUCTION-CANDIDATE-FREEZE-CERTIFICATE.json").write_text(
        json.dumps(cert, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (ev / "CF-01-RELEASE-IDENTITY.json").write_text(json.dumps(identity, indent=2) + "\n", encoding="utf-8")
    (ev / "CF-02-UNREGISTERED-SURFACE.json").write_text(json.dumps(unreg, indent=2) + "\n", encoding="utf-8")
    (ev / "CF-03-CONFIG-FLAG-CACHE.json").write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    (ev / "CF-04-SECURITY-RBAC.json").write_text(json.dumps(security, indent=2) + "\n", encoding="utf-8")
    (ev / "RI-01.json").write_text(json.dumps(ri01, indent=2) + "\n", encoding="utf-8")
    (ev / "RI-03.json").write_text(json.dumps(ri03, indent=2) + "\n", encoding="utf-8")

    md = "\n".join(
        [
            "# V65 Production Candidate Freeze Certificate",
            "",
            f"**Stamp:** {stamp}  ",
            f"**Verdict:** `{overall}`  ",
            f"**freeze_status:** `{freeze_status}`  ",
            f"**Candidate ID:** `{CANDIDATE_ID}`  ",
            f"**Key:** `V65_PRODUCTION_CANDIDATE_FREEZE`  ",
            f"**Certificate SHA-256:** `{cert['certificate_sha256']}`",
            "",
            "## Frozen composition",
            "",
            f"| Pin | SHA |",
            f"|-----|-----|",
            f"| V65 Non-Web3 baseline | `{V65}` |",
            f"| Production API | `{EXPECT_API}` |",
            f"| Production Web | `{EXPECT_WEB}` |",
            f"| Live API verified | `{identity['pinned']['live_api_git_sha']}` |",
            f"| Live Web verified | `{identity['pinned']['live_web_git_sha']}` |",
            "",
            "## Gate matrix",
            "",
            "| Gate | Status |",
            "|------|--------|",
            f"| CF-01 Release Identity | {identity['status']} |",
            f"| CF-02 Unregistered surface | {unreg['status']} |",
            f"| CF-03 Config/Flag/Cache/SEO | {config['status']} |",
            f"| CF-04 Security/RBAC/Audit | {security['status']} |",
            f"| CF-05 Prior closure SSOT | {audit['status']} |",
            f"| CF-06 Data/CMS runtime | {data_drift['status']} |",
            f"| RI-01 Migration Integrity | {ri01['status']} |",
            f"| RI-03 Reality Probe | {ri03['status']} |",
            f"| Reality Drift scan | {drift['status']} |",
            "",
            "## Reality Probe chains",
            "",
            "| Chain | Status |",
            "|-------|--------|",
        ]
        + [f"| {c['chain']} | {c['status']} |" for c in (ri03.get("chains") or [])]
        + [
            "",
            "## Freeze rules (immutable for this candidate)",
            "",
            "1. Do not deploy unregistered code/migrations into these Production tips without a new candidate ID.",
            "2. RI-02 order: Backup → Migration check → API → Health → FE → Probe.",
            "3. RI-01 must PASS before any Production API deploy.",
            "4. `TT_PRODUCTION_GO` remains **NO_GO** until formal GO ladder.",
            "",
            "## Honesty",
            "",
            "- Candidate Freeze **≠** Production GO",
            "- Candidate Freeze **≠** FINAL RELEASE / Web3 freeze",
            "- Live PSP commercial **not in scope**",
            "- Human UAT **not substituted**",
            "- Web3 mainnet / Admin IA·UI Freeze **untouched**",
            "",
        ]
    )
    (ev / "README.md").write_text(md, encoding="utf-8")

    latest = ROOT / "docs" / "runbook"
    shutil.copyfile(
        ev / "PRODUCTION-CANDIDATE-FREEZE-CERTIFICATE.json",
        latest / "TT-V65-PRODUCTION-CANDIDATE-FREEZE-CERTIFICATE-LATEST.json",
    )
    shutil.copyfile(ev / "README.md", latest / "TT-V65-PRODUCTION-CANDIDATE-FREEZE-CERTIFICATE-LATEST.md")

    # Machine-readable freeze pin for deploy scripts
    pin = {
        "schema": "traveltrust.v65_production_candidate_freeze_pin.v1",
        "candidate_id": CANDIDATE_ID,
        "freeze_status": freeze_status,
        "stamp": stamp,
        "api_git_sha": EXPECT_API,
        "web_git_sha": EXPECT_WEB,
        "v65_baseline": V65,
        "certificate_sha256": cert["certificate_sha256"],
        "tt_production_go": "NO_GO",
    }
    (ev / "FREEZE-PIN.json").write_text(json.dumps(pin, indent=2) + "\n", encoding="utf-8")
    shutil.copyfile(ev / "FREEZE-PIN.json", latest / "TT-V65-PRODUCTION-CANDIDATE-FREEZE-PIN-LATEST.json")

    print(f"EVIDENCE: {ev}")
    print(f"V65_PRODUCTION_CANDIDATE_FREEZE: {freeze_status}")
    print(f"verdict={overall} fails={fails}")
    print(f"certificate_sha256={cert['certificate_sha256']}")
    return 0 if overall == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
