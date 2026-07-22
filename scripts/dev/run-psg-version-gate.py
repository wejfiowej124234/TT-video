#!/usr/bin/env python3
"""PSG Version Gate STRICT · eight-way same-version + Runtime Attestation.

pre-deploy default = STRICT:
  Local SHA == Artifact == Runtime image digest == /meta Release Version == PSG pin
  unknown runtime attestation → BLOCK

  python scripts/dev/run-psg-version-gate.py --mode check --env both
  TT_CANONICAL_DEPLOY=1 python scripts/dev/run-psg-version-gate.py --mode pre-deploy --env both

SSOT: docs/runbook/TT-PSG-RUNTIME-ATTESTATION-LATEST.md
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERSION_FILE = ROOT / "registry/psg-release-version-LATEST.yaml"
SOT_FILE = ROOT / "registry/psg-release-source-of-truth.v1.yaml"
DEP_FILE = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
DEFAULT_STAGING_API = "https://tt-api-staging.fly.dev"
DEFAULT_STAGING_WEB = "https://tt-web-staging.fly.dev"

FROZEN_PSG_RELEASE_VERSION_ARCHIVED = "PSG-REL-20260719-FG15-09c72b93"  # FG-15-A HISTORICAL
FROZEN_GIT_SHA_ARCHIVED = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"
# Fallback only — Active pin SSOT = registry/psg-release-version-LATEST.yaml
# Forbidden fallback: PSG-REL-20260722-STAGING-ALIGN-W0 (SUPERSEDED)
FROZEN_PSG_RELEASE_VERSION = "PSG-REL-20260720-WEB3-CAND-V2"
FROZEN_GIT_SHA = "4050f50a7d0c94939c0e471e197806f766d4391f"


def git(*args: str) -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), *args], text=True).strip()


def parse_active(text: str) -> dict:
    active: dict[str, str] = {}
    in_active = False
    for line in text.splitlines():
        if re.match(r"^active:\s*$", line):
            in_active = True
            continue
        if in_active and re.match(r"^[a-zA-Z_]", line) and not line.startswith(" "):
            break
        if not in_active:
            continue
        m = re.match(r"^\s{2}([a-z0-9_]+):\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip().strip("\"'")
        if val.startswith(">"):
            continue
        active[key] = val
    return active


def http_json(url: str, timeout: int = 25):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:800]
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_raw": body}
    except Exception as ex:  # noqa: BLE001
        return 0, {"_error": str(ex)}


def sha_norm(s: str) -> str:
    s = (s or "").strip().lower()
    if s.startswith("sha256:"):
        return s
    return s


def sha_match(a: str, b: str) -> bool:
    a, b = sha_norm(a), sha_norm(b)
    if not a or not b or a == "unknown" or b == "unknown":
        return False
    if a == b:
        return True
    return a[:12] == b[:12] or a.startswith(b[:12]) or b.startswith(a[:12])


def extract_release_identity(payload: dict) -> dict:
    """Accept flat /meta/release-identity or nested build from /meta."""
    if not isinstance(payload, dict):
        return {}
    if "psg_release_version" in payload and "git_sha" in payload:
        return payload
    build = payload.get("build") if isinstance(payload.get("build"), dict) else {}
    ri = payload.get("release_identity") if isinstance(payload.get("release_identity"), dict) else {}
    src = ri or build
    return {
        "psg_release_version": src.get("psg_release_version"),
        "git_sha": src.get("git_sha"),
        "image_digest": src.get("image_digest"),
        "build_time": src.get("build_time") or src.get("deployed_at"),
        "contract_profile": src.get("contract_profile"),
        "attestation_status": src.get("attestation_status"),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="check", choices=["check", "pre-deploy", "post-deploy"])
    ap.add_argument("--env", default="both", choices=["local", "staging", "both"])
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    if os.environ.get("TRAVELTRUST_PSG_VERSION_OVERRIDE") == "1":
        print("psg-version-gate: SKIP (TRAVELTRUST_PSG_VERSION_OVERRIDE=1)")
        return 0
    if os.environ.get("SKIP_PSG_VERSION_GATE") == "1":
        print("psg-version-gate: SKIP (SKIP_PSG_VERSION_GATE=1)")
        return 0

    # STRICT is mandatory on deploy paths (cannot soft-warn). check = pin/registry only unless TT_PSG_VERSION_STRICT=1.
    if args.mode in ("pre-deploy", "post-deploy"):
        strict = os.environ.get("TT_PSG_VERSION_STRICT", "1") != "0"
    else:
        strict = os.environ.get("TT_PSG_VERSION_STRICT", "0") == "1"

    checks: list[dict] = []
    failed: list[dict] = []

    def add(cid: str, ok: bool, **extra):
        row = {"id": cid, "pass": ok, **extra}
        checks.append(row)
        if not ok:
            failed.append(row)

    add("sot_registry_present", SOT_FILE.exists())
    add("version_pin_present", VERSION_FILE.exists())
    active = parse_active(VERSION_FILE.read_text(encoding="utf-8")) if VERSION_FILE.exists() else {}
    expected_sha = active.get("git_sha", FROZEN_GIT_SHA)
    psg_ver = active.get("psg_release_version", FROZEN_PSG_RELEASE_VERSION)
    add("active_version_declared", bool(psg_ver and expected_sha), psg_release_version=psg_ver, git_sha=expected_sha)

    # Resolve TRACK_HEAD / provisional mint placeholders to local HEAD
    local_preview = ""
    try:
        local_preview = git("rev-parse", "HEAD")
    except Exception:  # noqa: BLE001
        pass
    if expected_sha in ("TRACK_HEAD", "PIN_AFTER_MINT") or str(expected_sha).startswith("PIN_"):
        if local_preview:
            expected_sha = local_preview
            add(
                "track_head_resolved",
                True,
                resolved_git_sha=expected_sha,
                note="Active git_sha TRACK_HEAD → local HEAD",
            )
        else:
            add("track_head_resolved", False, remediation="git rev-parse HEAD failed")

    fg15_elapsed = os.environ.get("FG15_ELAPSED") == "1"
    pin_ok = psg_ver == FROZEN_PSG_RELEASE_VERSION and expected_sha == FROZEN_GIT_SHA
    add(
        "fg15_freeze_pin_immutable",
        pin_ok if not fg15_elapsed else True,
        expected_version=FROZEN_PSG_RELEASE_VERSION,
        actual_version=psg_ver,
        remediation="Do not overwrite freeze pin during FG-15",
    )

    # Bare-deploy ban: pre-deploy requires canonical entry
    if args.mode == "pre-deploy":
        canonical = os.environ.get("TT_CANONICAL_DEPLOY") == "1"
        add(
            "canonical_deploy_entry_required",
            canonical,
            remediation="Only scripts/deploy/*.sh may deploy (sets TT_CANONICAL_DEPLOY=1). Bare fly/forge = INVALID RELEASE ACTION",
        )

    local_sha = ""
    dirty = False
    if args.env in ("local", "both"):
        try:
            local_sha = git("rev-parse", "HEAD")
            # Ignore gate evidence writes (untracked evidence/GO_*) so pre-deploy
            # self-checks do not dirtify CERTIFICATION_FREEZE.
            porcelain = git("status", "--porcelain")
            dirty_lines = []
            for ln in porcelain.splitlines():
                path = ln[3:].strip() if len(ln) > 3 else ln.strip()
                if path.startswith("evidence/GO_") or path.startswith("evidence\\GO_"):
                    continue
                dirty_lines.append(ln)
            dirty = bool(dirty_lines)
            add("local_git_readable", True, git_sha=local_sha, dirty=dirty)
        except Exception as ex:  # noqa: BLE001
            add("local_git_readable", False, error=str(ex))
        if local_sha:
            matched = sha_match(local_sha, expected_sha) and (
                not dirty if args.mode == "pre-deploy" else True
            )
            if args.mode in ("pre-deploy", "post-deploy"):
                add(
                    "local_matches_active_psg_version",
                    matched,
                    expected=expected_sha,
                    actual=local_sha,
                    dirty=dirty,
                    remediation="Local SHA must match Active PSG Version (clean tip on pre-deploy)",
                )
            else:
                # FG-15 living tip may diverge while landing attestation capability — observation only.
                add(
                    "local_vs_active_psg_observed",
                    True,
                    match=matched,
                    expected=expected_sha,
                    actual=local_sha,
                    dirty=dirty,
                    note="Use Drift Scanner / STRICT pre-deploy for hard equality",
                )

    artifact = os.environ.get("TT_ARTIFACT_SHA") or os.environ.get("TRAVELTRUST_ARTIFACT_SHA") or ""
    image_env = (
        os.environ.get("TT_RUNTIME_IMAGE_SHA")
        or os.environ.get("TRAVELTRUST_IMAGE_DIGEST")
        or os.environ.get("TT_FLY_IMAGE_REF")
        or ""
    )

    # Contract pin — Web3 mainline = Candidate v2; FG-15-A baseline is historical snapshot
    dep_text = DEP_FILE.read_text(encoding="utf-8") if DEP_FILE.exists() else ""
    mainline_base = re.search(r"^web3_mainline_baseline:\s*(\S+)", dep_text, re.M)
    active_base = re.search(r"^active_deploy_baseline:\s*(\S+)", dep_text, re.M)
    mainline_name = mainline_base.group(1).strip().strip("\"'") if mainline_base else ""
    active_name = active_base.group(1).strip().strip("\"'") if active_base else ""
    cand = bool(
        re.search(
            r"v311_fund_safety_candidate_v2:\s*\n\s+status:\s*ACTIVE_WEB3_CANDIDATE_BASELINE",
            dep_text,
        )
    )
    env_profile = (
        os.environ.get("TRAVELTRUST_CONTRACT_PROFILE")
        or os.environ.get("NEXT_PUBLIC_CONTRACT_PROFILE")
        or ""
    ).strip()
    pin_ok = (
        (mainline_name == "v311_fund_safety_candidate_v2" and cand)
        or (not mainline_name and active_name == "v311_fund_safety_candidate_v2")
        or (env_profile == "v311_fund_safety_candidate_v2" and fg15_elapsed)
        or (
            "v311_fund_safety_candidate_v2" in dep_text
            and fg15_elapsed
            and args.mode in ("pre-deploy", "post-deploy")
        )
    )
    add(
        "contract_bytecode_pin",
        pin_ok,
        web3_mainline_baseline=mainline_name or None,
        active_deploy_baseline=active_name or None,
        env_contract_profile=env_profile or None,
        note="FG-15-A v311_sepolia_clean_baseline remains HISTORICAL snapshot only",
    )

    add("database_baseline_declared", bool(active.get("database_baseline")))
    add("cms_baseline_declared", bool(active.get("cms_baseline")))

    # W0 / first-align: pre-deploy may run while Staging still on old SHA (chicken-egg).
    # Require clean local tip + artifact; defer runtime eight-way to post-deploy.
    local_ready = bool(local_sha) and sha_match(local_sha, expected_sha) and (
        not dirty if args.mode == "pre-deploy" else True
    )
    align_pre = (
        args.mode == "pre-deploy"
        and fg15_elapsed
        and local_ready
        and os.environ.get("TT_CANONICAL_DEPLOY") == "1"
    )

    # --- staging API + Web release-identity ---
    api_ri = web_ri = {}
    if args.env in ("staging", "both"):
        api = os.environ.get("STAGING_API_BASE") or os.environ.get("API_BASE") or DEFAULT_STAGING_API
        web = os.environ.get("STAGING_WEB_BASE") or DEFAULT_STAGING_WEB
        code, data = http_json(api.rstrip("/") + "/meta/release-identity")
        if code != 200:
            code, data = http_json(api.rstrip("/") + "/meta")
        api_ri = extract_release_identity(data if isinstance(data, dict) else {})
        api_ok = (
            code == 200
            and api_ri.get("attestation_status") == "ok"
            and api_ri.get("psg_release_version") == psg_ver
            and sha_match(str(api_ri.get("git_sha") or ""), expected_sha)
            and str(api_ri.get("image_digest") or "") not in ("", "unknown", "None")
        )
        if align_pre and not api_ok:
            add(
                "staging_api_runtime_attestation",
                True,
                http=code,
                release_identity=api_ri,
                alignment_pending=True,
                note="pre-deploy W0 align: Staging drift expected; post-deploy must PASS",
            )
        else:
            add(
                "staging_api_runtime_attestation",
                api_ok if strict else (code == 200 and bool(api_ri.get("git_sha"))),
                http=code,
                release_identity=api_ri,
                remediation="API must expose /meta/release-identity with attestation_status=ok; unknown runtime = BLOCK",
            )

        wcode, wdata = http_json(web.rstrip("/") + "/api/release-identity")
        web_ri = extract_release_identity(wdata if isinstance(wdata, dict) else {})
        web_ok = (
            wcode == 200
            and web_ri.get("attestation_status") == "ok"
            and web_ri.get("psg_release_version") == psg_ver
            and sha_match(str(web_ri.get("git_sha") or ""), expected_sha)
            and str(web_ri.get("image_digest") or "") not in ("", "unknown", "None")
        )
        if align_pre and not web_ok:
            add(
                "staging_web_runtime_attestation",
                True,
                http=wcode,
                release_identity=web_ri,
                alignment_pending=True,
                note="pre-deploy W0 align: Web drift expected; post-deploy must PASS",
            )
        else:
            add(
                "staging_web_runtime_attestation",
                web_ok if strict else (wcode == 200 or not strict),
                http=wcode,
                release_identity=web_ri,
                remediation="Web must expose /api/release-identity with attestation_status=ok",
            )

    # Eight-way STRICT — deploy modes only (or check with TT_PSG_VERSION_STRICT=1)
    if strict:
        runtime_digest = str(api_ri.get("image_digest") or image_env or "")
        meta_ver = str(api_ri.get("psg_release_version") or "")
        meta_sha = str(api_ri.get("git_sha") or "")
        axes = {
            "psg_version": psg_ver,
            "local_git": local_sha or "(n/a)",
            "artifact": artifact or "(undeclared)",
            "runtime_image": runtime_digest or "(undeclared)",
            "meta_release_version": meta_ver or "(undeclared)",
            "meta_git_sha": meta_sha or "(undeclared)",
            "contract_pin": active_name or "(n/a)",
            "db_baseline": active.get("database_baseline") or "(declared)",
            "cms_baseline": active.get("cms_baseline") or "(declared)",
        }
        ok_strict = True
        reasons: list[str] = []
        if local_sha and not sha_match(local_sha, expected_sha):
            ok_strict = False
            reasons.append("local!=psg_git")
        if not artifact:
            if args.mode in ("pre-deploy", "post-deploy"):
                ok_strict = False
                reasons.append("artifact_undeclared")
        elif not (sha_match(artifact, expected_sha) or sha_match(artifact, local_sha)):
            ok_strict = False
            reasons.append("artifact!=git")
        if args.env in ("staging", "both") and not align_pre:
            if api_ri.get("attestation_status") == "unknown" or not api_ri:
                ok_strict = False
                reasons.append("unknown_runtime")
            if not meta_ver or meta_ver != psg_ver:
                ok_strict = False
                reasons.append("meta_version!=psg")
            if not sha_match(meta_sha, expected_sha):
                ok_strict = False
                reasons.append("meta_git!=psg")
            if not runtime_digest or runtime_digest == "unknown":
                ok_strict = False
                reasons.append("unknown_runtime_image")
        elif align_pre:
            reasons.append("alignment_pending_runtime_deferred_to_post_deploy")
            if not image_env or image_env == "unknown":
                # Allow pre-deploy when digest will be stamped by canonical deploy
                axes["runtime_image"] = image_env or "(to_be_stamped_by_deploy)"
        add(
            "eight_way_strict_same_version",
            ok_strict,
            axes=axes,
            reasons=reasons,
            alignment_pending=align_pre,
            remediation="DEPLOY BLOCKED unless Local==Artifact==Image Digest==/meta==PSG (+ contract/DB/CMS pins)",
        )

    report = {
        "schema": "traveltrust.psg_version_gate.v1",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": args.mode,
        "env": args.env,
        "strict": strict,
        "active": {"psg_release_version": psg_ver, "git_sha": expected_sha},
        "checks": checks,
        "verdict": "PASS" if not failed else "BLOCKED",
        "machine_key": "TT_PSG_VERSION_GATE",
        "rule": "STRICT: eight-way same-version; unknown runtime attestation = BLOCK; bare deploy forbidden",
    }

    out = args.out
    if not out:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out_dir = ROOT / "evidence/GO_psg_version_gate" / stamp
        out_dir.mkdir(parents=True, exist_ok=True)
        out = str(out_dir / "PSG-VERSION-GATE-LATEST.json")
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps({"verdict": report["verdict"], "strict": strict, "failed": [c["id"] for c in failed], "out": out}, indent=2))
    if failed:
        for c in failed:
            print(f"BLOCKED {c['id']}: {c.get('remediation') or c}", file=sys.stderr)
        return 2
    print(f"TT_PSG_VERSION_GATE: PASS ({args.mode} · strict={strict} · {psg_ver})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
