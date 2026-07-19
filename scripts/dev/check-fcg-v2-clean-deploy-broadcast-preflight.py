#!/usr/bin/env python3
"""FCG v2 Clean Deploy Broadcast Preflight.

Verifies only:
  Release SHA · GOVERNANCE_RC_CLOSED · TRAVELTRUST_FCG_V2_BROADCAST_OK
  deploy env · Evidence binding
Does NOT broadcast. Exit 0 only when broadcast_preflight_pass=True.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"


def expected_release_sha_prefix() -> str:
    """Prefer latest L5-A pin, else prior CDR-19 pin, else legacy Clean Deploy SHA."""
    for name in (
        "CDR-19-L5A-RELEASE-SHA-PIN-LATEST.json",
        "CDR-19-RELEASE-SHA-PIN-LATEST.json",
    ):
        p = PENDING / name
        if p.is_file():
            try:
                sha = str(json.loads(p.read_text(encoding="utf-8")).get("Release_SHA") or "")
                if len(sha) >= 8:
                    return sha[:8]
            except Exception:
                pass
    return "493596ae"


def git(*a: str) -> str:
    return subprocess.check_output(["git", *a], cwd=ROOT, text=True).strip()


def env_flag(name: str) -> dict:
    raw = os.environ.get(name)
    if raw is None:
        return {"set": False, "equals_1": False}
    return {"set": True, "equals_1": raw.strip() == "1", "raw_repr": "1" if raw.strip() == "1" else "SET_NON_1"}


def env_present(name: str, secret: bool = False) -> dict:
    raw = os.environ.get(name)
    if raw is None:
        return {"set": False, "nonempty": False}
    if secret:
        return {"set": True, "nonempty": bool(raw.strip()), "len": len(raw.strip())}
    return {"set": True, "nonempty": bool(raw.strip()), "value": raw.strip()}


def load_dotenv_keys(path: Path) -> set[str]:
    """Return key names only — never values."""
    keys: set[str] = set()
    if not path.is_file():
        return keys
    for ln in path.read_text(encoding="utf-8", errors="replace").splitlines():
        s = ln.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k = s.split("=", 1)[0].strip()
        if k:
            keys.add(k)
    return keys


def main() -> int:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    head = git("rev-parse", "HEAD")
    expected_prefix = expected_release_sha_prefix()
    sha_ok = head.startswith(expected_prefix)

    # G-RC: env OR Owner declaration evidence
    gov_env = env_flag("GOVERNANCE_RC_CLOSED")
    decl_path = PENDING / "G-RC-CLOSED-OWNER-DECLARATION-LATEST.json"
    decl_ok = False
    if decl_path.is_file():
        try:
            decl = json.loads(decl_path.read_text(encoding="utf-8"))
            decl_ok = bool(decl.get("g_rc_closed") is True)
        except Exception:
            decl_ok = False
    gov_closed = gov_env["equals_1"] or decl_ok

    broadcast_ok = env_flag("TRAVELTRUST_FCG_V2_BROADCAST_OK")
    want_broadcast = env_flag("FCG_V2_WANT_BROADCAST")

    rpc = env_present("SEPOLIA_RPC_URL")
    if not rpc["set"]:
        rpc = env_present("ETH_RPC_URL")
    if not rpc["set"]:
        rpc = env_present("RPC_URL")
    pk = env_present("PRIVATE_KEY", secret=True)
    usdc = env_present("USDC_TOKEN_ADDRESS")

    dotenv_files = [
        ROOT / "scripts/dev/.env.phase2-chain-deploy.local",
        ROOT / ".env",
        ROOT / "contracts/.env",
    ]
    dotenv_key_sets = {str(p.relative_to(ROOT)).replace("\\", "/"): sorted(load_dotenv_keys(p)) for p in dotenv_files if p.is_file()}
    required_deploy_keys = {
        "PRIVATE_KEY",
        "USDC_TOKEN_ADDRESS",
    }
    rpc_keys = {"SEPOLIA_RPC_URL", "ETH_RPC_URL", "RPC_URL"}
    all_dotenv_keys = set()
    for ks in dotenv_key_sets.values():
        all_dotenv_keys.update(ks)
    dotenv_has_required = required_deploy_keys.issubset(all_dotenv_keys) and bool(all_dotenv_keys & rpc_keys)

    # process env OR dotenv keys present (Owner must export before forge)
    deploy_env_ready = (
        pk["nonempty"]
        and usdc["nonempty"]
        and rpc.get("nonempty", False)
    ) or (
        # dotenv present is not enough for forge unless sourced — flag separately
        False
    )

    # CDR-19 / evidence binding (prefer L5-A refresh artifacts)
    cdr19_path = PENDING / "CDR-19-L5A-RELEASE-IDENTITY-CLOSURE-LATEST.json"
    if not cdr19_path.is_file():
        cdr19_path = PENDING / "CDR-19-RELEASE-IDENTITY-CLOSURE-LATEST.json"
    pin_path = PENDING / "CDR-19-L5A-RELEASE-SHA-PIN-LATEST.json"
    if not pin_path.is_file():
        pin_path = PENDING / "CDR-19-RELEASE-SHA-PIN-LATEST.json"
    bind_path = PENDING / "CDR-19-L5A-EQUIVALENCE-BINDING-LATEST.json"
    if not bind_path.is_file():
        bind_path = PENDING / "CDR-19-EQUIVALENCE-BINDING-LATEST.json"
    ev_manifest = PENDING / "CDR-19-L5A-EVIDENCE-PACKAGE-MANIFEST-LATEST.json"
    if not ev_manifest.is_file():
        ev_manifest = PENDING / "CDR-19-EVIDENCE-PACKAGE-MANIFEST-LATEST.json"
    cdr19 = json.loads(cdr19_path.read_text(encoding="utf-8")) if cdr19_path.is_file() else {}
    pin = json.loads(pin_path.read_text(encoding="utf-8")) if pin_path.is_file() else {}
    bind = json.loads(bind_path.read_text(encoding="utf-8")) if bind_path.is_file() else {}

    cdr19_pass = (
        cdr19.get("status") in ("PASS", "PASS_L5A_REFRESH")
        or str(cdr19.get("verdict") or "").startswith("CDR19")
        and "PASS" in str(cdr19.get("verdict") or "")
    )
    pin_sha = str(pin.get("Release_SHA") or "")
    pin_matches = bool(pin_sha) and pin_sha == head and pin_sha.startswith(expected_prefix)
    bind_ok = (
        bind_path.is_file()
        and ev_manifest.is_file()
        and str(bind.get("Source_SHA") or head).startswith(expected_prefix)
        and bind.get("Deploy_Artifact", {}).get("bundle_sha256")
        and bind.get("Evidence_Package", {}).get("bundle_sha256")
        and bind.get("Contract_Bytecode", {}).get("status") == "BOUND"
    )

    gates = {
        "release_sha": {
            "expected_prefix": expected_prefix,
            "head": head,
            "pin_sha": pin_sha,
            "pass": sha_ok and (pin_matches or (sha_ok and not pin_sha)),
        },
        "governance_rc_closed": {
            "env": gov_env,
            "owner_declaration_file": decl_ok,
            "pass": gov_closed,
            "note": "env GOVERNANCE_RC_CLOSED=1 preferred for forge; Owner declaration accepted for preflight authorship",
        },
        "traveltrust_fcg_v2_broadcast_ok": {
            "env": broadcast_ok,
            "pass": broadcast_ok["equals_1"],
            "note": "MUST be Owner-exported in shell; not inferred from docs",
        },
        "fcg_v2_want_broadcast": {
            "env": want_broadcast,
            "pass": want_broadcast["equals_1"],
        },
        "deploy_environment": {
            "PRIVATE_KEY": pk,
            "USDC_TOKEN_ADDRESS": {"set": usdc["set"], "nonempty": usdc["nonempty"]},
            "RPC": {"set": rpc.get("set"), "nonempty": rpc.get("nonempty")},
            "dotenv_files_key_names_only": dotenv_key_sets,
            "dotenv_has_required_key_names": dotenv_has_required,
            "process_env_ready_for_forge": deploy_env_ready,
            "pass": deploy_env_ready,
            "note": "Forge needs vars in process env; dotenv file alone is NOT enough until sourced",
        },
        "evidence_binding": {
            "cdr19_pass": cdr19_pass,
            "pin_matches_head": pin_matches,
            "binding_complete": bind_ok,
            "pass": cdr19_pass and pin_matches and bind_ok,
        },
        "active_flip": {
            "forbidden_in_deploy_script": True,
            "pass": True,
        },
    }

    all_pass = all(g["pass"] for g in gates.values())
    blockers = [k for k, g in gates.items() if not g["pass"]]

    pack = {
        "schema": "traveltrust.fcg_v2_clean_deploy_broadcast_preflight.v1",
        "recorded_utc": stamp,
        "baseline": "fcg_full_capability_v2_sepolia",
        "Release_SHA": head,
        "gates": gates,
        "broadcast_preflight_pass": all_pass,
        "blockers": blockers,
        "next_if_pass": [
            "source_deploy_env",
            "export GOVERNANCE_RC_CLOSED=1 TRAVELTRUST_FCG_V2_BROADCAST_OK=1 FCG_V2_WANT_BROADCAST=1",
            "forge script DeployFcgFullCapabilityV2Sepolia --rpc-url $SEPOLIA_RPC_URL --broadcast",
            "bind broadcast_json + on_chain addresses to Release_SHA",
            "enter TT_PSG_PRODUCTION_COMPLETION_MATRIX L1-L5 empirical (no premature PASS/GO)",
        ],
        "forbid": [
            "claim_L1_L5_PASS",
            "claim_Production_GO",
            "ACTIVE_flip_in_this_script",
        ],
        "verdict": "BROADCAST_PREFLIGHT_PASS" if all_pass else "BROADCAST_PREFLIGHT_BLOCKED",
    }

    out = PENDING / "CLEAN-DEPLOY-BROADCAST-PREFLIGHT-LATEST.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(pack["verdict"])
    print("Release_SHA", head[:12], "sha_ok", sha_ok)
    print("blockers", blockers)
    print("gov_closed", gov_closed, "broadcast_ok", broadcast_ok["equals_1"], "want", want_broadcast["equals_1"])
    print("deploy_env_ready", deploy_env_ready, "dotenv_keys_ok", dotenv_has_required)
    print("evidence_binding", gates["evidence_binding"]["pass"])
    return 0 if all_pass else 2


if __name__ == "__main__":
    raise SystemExit(main())
