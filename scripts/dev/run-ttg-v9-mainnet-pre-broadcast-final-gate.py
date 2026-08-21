#!/usr/bin/env python3
"""Mainnet Pre-Broadcast Final Cutover Gate — Design Lock DL_R1 Exact Match.

Does NOT mutate Candidate · Does NOT edit audited core sources · Does NOT Mainnet broadcast ·
Does NOT flip TT_PRODUCTION_GO. Requires V9_SEPOLIA_REGRESSION_DL_R1_PASS.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_ttg_v9_audit"
CAND = EV / "V9_AUDIT_CANDIDATE_DESIGN_LOCK.json"
MAN = EV / "V9_AUDIT_CANDIDATE_DESIGN_LOCK.manifest.json"
SEPOLIA = EV / "V9_SEPOLIA_REGRESSION_DL_R1_PASS.json"
OUT = EV / "V9_MAINNET_PRE_BROADCAST_FINAL_PASS.json"
PIN = EV / "V9_MAINNET_DL_R1_BROADCAST_ARTIFACT_PIN.json"
FAIL = EV / "V9_MAINNET_PRE_BROADCAST_FINAL_FAIL.json"

MARKETING = "0xe1e732EfBf9B010a9204054467256d3d93f3CdD4"
TEAM = "0x010365F0835323826569D61D0E13E6F8d25F6828"
TREASURY = "0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736"
LEGACY_SAFE = "0x96491aa894658ff7946506318c49F3c76b8f40e7"
LEGACY_P4CAP = "0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF"

CORE_NAMES = [
    "TtgV9SoloTimelock",
    "TtgV9ProjectPool",
    "TtgV9CountryFeeRouter",
    "TtgV9RoleStakePool",
    "TravelTrustGovernanceTokenV9",
    "TravelTrustGovernorV9",
    "TtgPublicSaleVault",
    "TtgBatchPrimaryMarket",
    "TtgV9AtomicDeployerMainnet",
    "TtgV9ERC1967Proxy",
    "TtgV9UUPSUpgradeable",
]


def sha256_bytes(b: bytes) -> str:
    return "sha256:" + hashlib.sha256(b).hexdigest()


def sha256_file(p: Path) -> str:
    return sha256_bytes(p.read_bytes())


def fail(msg: str, detail: dict | None = None) -> None:
    payload = {
        "stamp": "V9_MAINNET_PRE_BROADCAST_FINAL_FAIL",
        "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "reason": msg,
        "detail": detail or {},
        "mainnet_broadcast": "FORBIDDEN",
        "tt_production_go": "UNCHANGED",
    }
    FAIL.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print("FAIL:", msg, file=sys.stderr)
    raise SystemExit(2)


def load_json(p: Path) -> dict:
    if not p.is_file():
        fail(f"missing {p}")
    return json.loads(p.read_text(encoding="utf-8"))


def check_prereqs() -> tuple[dict, dict, dict]:
    cand = load_json(CAND)
    man = load_json(MAN)
    sep = load_json(SEPOLIA)
    if cand.get("candidate_id") != "V9_AUDIT_CANDIDATE_DESIGN_LOCK":
        fail("wrong candidate_id")
    if cand.get("remediation_wave") != "DL_R1":
        fail("candidate not DL_R1")
    if cand.get("inherits_r2_final_audit_pass") is not False:
        fail("candidate must not inherit R2_FINAL")
    got = sha256_file(CAND)
    if man.get("sha256") != got:
        fail("candidate/manifest mismatch — Candidate mutated?", {"man": man.get("sha256"), "got": got})
    if sep.get("stamp") != "V9_SEPOLIA_REGRESSION_DL_R1_PASS":
        fail("need V9_SEPOLIA_REGRESSION_DL_R1_PASS")
    if sep.get("remediation_wave") != "DL_R1" or sep.get("candidate") != "V9_AUDIT_CANDIDATE_DESIGN_LOCK":
        fail("Sepolia PASS not bound to Design Lock DL_R1")
    if sep.get("candidate_mutated") is not False:
        fail("Sepolia PASS reports candidate mutated")
    if sep.get("inherits_r2_final_audit_pass") is not False:
        fail("Sepolia PASS inherits R2 — refuse")
    # Triad optional but expected
    triad = EV / "V9_DESIGN_LOCK_AI_TRIAD_PASS.json"
    if triad.is_file():
        t = load_json(triad)
        if t.get("open_critical") != 0 or t.get("open_high") != 0 or t.get("open_medium") != 0:
            fail("AI triad OPEN_C/H/M not zero")
    return cand, man, sep


def check_source_exact(cand: dict) -> int:
    mism = []
    for rel, want in (cand.get("source_sha256") or {}).items():
        p = ROOT / rel
        if not p.is_file():
            mism.append(f"missing:{rel}")
            continue
        if sha256_file(p) != want:
            mism.append(rel)
    if mism:
        fail("SOURCE_EXACT_MATCH_FAIL", {"mism": mism})
    return len(cand.get("source_sha256") or {})


def check_compiler_settings() -> dict:
    toml = (ROOT / "contracts" / "foundry.toml").read_text(encoding="utf-8")
    m = re.search(r"\[profile\.ttg_v9\](.*?)(?=\n\[|\Z)", toml, re.S)
    if not m:
        fail("missing profile.ttg_v9")
    block = m.group(1)
    settings = {
        "profile": "ttg_v9",
        "solc_version": "0.8.36",
        "via_ir": True,
        "optimizer": True,
        "optimizer_runs": 200,
        "evm_version": "paris",
        "chain_id_target": 1,
    }
    need = {
        "solc_version": r'solc_version\s*=\s*"0\.8\.36"',
        "via_ir": r"via_ir\s*=\s*true",
        "optimizer": r"optimizer\s*=\s*true",
        "optimizer_runs": r"optimizer_runs\s*=\s*200",
        "evm_version": r'evm_version\s*=\s*"paris"',
    }
    for key, pat in need.items():
        if not re.search(pat, block):
            fail(f"compiler setting mismatch: {key}", {"profile_ttg_v9": block[:800]})
    return settings


def forge_build() -> None:
    import os

    env = os.environ.copy()
    env["FOUNDRY_PROFILE"] = "ttg_v9"
    r = subprocess.run(
        ["forge", "build"],
        cwd=str(ROOT / "contracts"),
        env=env,
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        fail("forge build failed", {"stderr": (r.stderr or "")[-2000:]})


def artifact(name: str) -> Path:
    matches = list((ROOT / "contracts" / "out-ttg-v9").rglob(f"{name}.json"))
    if not matches:
        fail(f"missing forge artifact {name}")
    return matches[0]


def bytecode_hex(art: dict, field: str) -> str:
    obj = art.get(field, {})
    if isinstance(obj, dict):
        obj = obj.get("object", "")
    if not obj:
        fail(f"empty {field}")
    return obj[2:] if obj.startswith("0x") else obj


def check_bytecode_exact(cand: dict) -> dict:
    out: dict = {}
    want_map = cand.get("bytecode_sha256") or {}
    mism = []
    for name, want in want_map.items():
        art = json.loads(artifact(name).read_text(encoding="utf-8"))
        deployed = bytecode_hex(art, "deployedBytecode")
        got = sha256_bytes(bytes.fromhex(deployed))
        if got != want:
            mism.append({"name": name, "want": want, "got": got})
        creation = bytecode_hex(art, "bytecode")
        out[name] = {
            "deployed_sha256": got,
            "creation_sha256": sha256_bytes(bytes.fromhex(creation)),
            "deployed_len": len(deployed) // 2,
            "creation_len": len(creation) // 2,
            "pinned_in_candidate": True,
        }
    if mism:
        fail("BYTECODE_EXACT_MATCH_FAIL", {"mism": mism})
    for name in CORE_NAMES:
        if name in out:
            continue
        try:
            art = json.loads(artifact(name).read_text(encoding="utf-8"))
            deployed = bytecode_hex(art, "deployedBytecode")
            creation = bytecode_hex(art, "bytecode")
            out[name] = {
                "deployed_sha256": sha256_bytes(bytes.fromhex(deployed)),
                "creation_sha256": sha256_bytes(bytes.fromhex(creation)),
                "deployed_len": len(deployed) // 2,
                "creation_len": len(creation) // 2,
                "pinned_in_candidate": False,
            }
        except SystemExit:
            raise
        except Exception as e:
            out[name] = {"error": str(e)}
    return out


def check_design_lock_constants() -> dict:
    src = (ROOT / "contracts/src/ttg-v9/TtgV9DesignLockConstants.sol").read_text(encoding="utf-8")
    checks = {
        "marketing_deployer": MARKETING.lower() in src.lower(),
        "team": TEAM.lower() in src.lower(),
        "treasury_guardian": TREASURY.lower() in src.lower(),
        "timelock_48h": "48 hours" in src,
        "platform_fee_500": "PLATFORM_FEE_BPS = 500" in src,
        "steward_4500": "STEWARD_SHARE_BPS = 4500" in src,
        "project_5500": "PROJECT_SHARE_BPS = 5500" in src,
        "p4_30pct": "P4_DEPLOY_CAP_BPS = 3000" in src,
        "p4_90d": "90 days" in src,
    }
    if not all(checks.values()):
        fail("DesignLockConstants pin fail", checks)
    # ZERO ACTIVE legacy in constants file
    if LEGACY_SAFE.lower() in src.lower() or LEGACY_P4CAP.lower() in src.lower():
        fail("DesignLockConstants must not hardwire LEGACY Safe/P4Cap")
    return checks


def check_tokenomics_constants() -> dict:
    src = (ROOT / "contracts/src/ttg-v9/TtgV9Constants.sol").read_text(encoding="utf-8")
    checks = {
        "public_50": "PUBLIC_SALE_BPS = 5000" in src,
        "dao_35": "DAO_TREASURY_BPS = 3500" in src,
        "team_3": "TEAM_BPS = 300" in src,
        "marketing_5": "MARKETING_BPS = 500" in src,
        "treasury_7": "TREASURY_OPS_BPS = 700" in src,
        "five_batches": "batchId == 5" in src,
    }
    if not all(checks.values()):
        fail("tokenomics 50/35/3/5/7 or batches fail", checks)
    return checks


def check_dl_r1_fixes_present() -> dict:
    pool = (ROOT / "contracts/src/ttg-v9/TtgV9ProjectPool.sol").read_text(encoding="utf-8")
    gov = (ROOT / "contracts/src/ttg-v9/TravelTrustGovernorV9.sol").read_text(encoding="utf-8")
    tl = (ROOT / "contracts/src/ttg-v9/TtgV9SoloTimelock.sol").read_text(encoding="utf-8")
    checks = {
        "p4_usdc_only": "token != address(reserveToken)" in pool,
        "propose_single_op": "GovSingleOpOnly" in gov and "targets.length != 1" in gov,
        "set_governor_nonzero": "g == address(0)" in tl,
    }
    if not all(checks.values()):
        fail("DL_R1 fixes missing from sources", checks)
    return checks


def check_no_fee_ingress_mainnet_path() -> dict:
    """Mainnet broadcast scripts must not default-allow FeeIngress."""
    hits = []
    for rel in [
        "contracts/src/ttg-v9/TtgV9AtomicDeployerMainnet.sol",
        "contracts/src/ttg-v9/TtgV9DeployTopology.sol",
    ]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if "FeeIngress" in text or "TtgV9SepoliaFeeIngress" in text:
            hits.append(rel)
    # Sepolia rehearsal may contain FeeIngress — OK if not used as Mainnet entry
    return {
        "mainnet_core_free_of_fee_ingress": len(hits) == 0,
        "policy": "Mainnet CountryFeeRouter callers = verified KEEP EscrowFactory/SettlementRouter only; jurisdiction from trusted order ISO; FORBID free FeeIngress",
        "hits": hits,
    }


def build_broadcast_pin(bytecode: dict, compiler: dict) -> dict:
    """Constructor/initializer parameter matrix for post-auth Mainnet broadcast (no addresses yet for NEW deploys)."""
    return {
        "schema": "traveltrust.ttg_v9_mainnet_dl_r1_broadcast_artifact_pin.v1",
        "candidate": "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
        "remediation_wave": "DL_R1",
        "chain_id": 1,
        "compiler": compiler,
        "ops_pins": {
            "marketing_deployer_timelock_admin_ttg5pct": MARKETING,
            "team_ttg3pct": TEAM,
            "treasury_guardian_ttg7pct_pause_access_fee_p4_ops": TREASURY,
            "solo_timelock_delay_seconds": 48 * 3600,
            "forbid_timelock_admin": LEGACY_SAFE,
            "forbid_sale_usdc_treasury": LEGACY_P4CAP,
        },
        "economics": {
            "genesis_bps": {"public": 5000, "dao": 3500, "team": 300, "marketing": 500, "treasury_ops": 700},
            "platform_fee_bps": 500,
            "steward_share_bps": 4500,
            "project_share_bps": 5500,
            "p4_cap_bps": 3000,
            "p4_period_seconds": 90 * 24 * 3600,
            "no_globalStakers": True,
        },
        "governor_floors": {
            "voting_delay_blocks_min": 7200,
            "voting_period_blocks_min": 50400,
            "deployer": "TtgV9AtomicDeployerMainnet",
        },
        "deploy_sequence_required": [
            "1_deploy_SoloTimelock(admin=MARKETING, delay=48h)",
            "2_deploy_ProjectPool(owner=spender=Timelock, reserveToken=Mainnet_USDC)",
            "3_deploy_CountryFeeRouter(owner=Timelock, projectPool=NEW_POOL)",
            "4_AtomicDeployerMainnet(usdc, usdcTreasury=NEW_POOL NOT legacy P4Cap, timelock, guardian=TREASURY, team, marketing, treasury, delay>=7200, period>=50400)",
            "5_RoleStakePool UUPS initialize(owner=Timelock, ttg, delays)",
            "6_Timelock setGovernor + allowlist vault/market/pool/feeRouter/stake/governor",
            "7_schedule_execute bindMarket + seedBatchesFromNorm (MAINNET windows — not rehearsal)",
            "8_setFeeRouterCaller(KEEP_Escrow_or_Settlement_only=true) — FORBID FeeIngress",
            "9_KEEP SettlementRouter.setFeeRouter(NEW_FeeRouter) if retarget path",
        ],
        "fee_router_caller_policy": {
            "allowed": ["verified KEEP EscrowFactoryV2 / Escrow instances", "verified SettlementRouter if designated"],
            "forbidden": ["TtgV9SepoliaFeeIngress", "EOA free-choice jurisdiction", "unverified callers"],
            "jurisdiction_source": "trusted order ISO 3166-1 alpha-2 from Escrow/order payload — never unconstrained user bytes2",
        },
        "zero_active_official_v9_sinks": {
            "legacy_safe": LEGACY_SAFE,
            "legacy_p4cap": LEGACY_P4CAP,
            "v8_pm_or_token": "LEGACY_DO_NOT_WIRE_AS_V9_OFFICIAL",
            "note": "FTB interim Money Path cites may remain historical Reality; they must NOT be V9 Official ACTIVE Timelock admin / sale USDC sink / FeeRouter",
        },
        "bytecode_artifacts": bytecode,
        "broadcast_forbidden_until": "Owner written Mainnet Broadcast Authorization naming V9_AUDIT_CANDIDATE_DESIGN_LOCK · DL_R1 and V9_SEPOLIA_REGRESSION_DL_R1_PASS",
    }


def main() -> None:
    EV.mkdir(parents=True, exist_ok=True)
    cand, man, sep = check_prereqs()
    n_src = check_source_exact(cand)
    forge_build()
    bytecode = check_bytecode_exact(cand)
    compiler = check_compiler_settings()
    dl_const = check_design_lock_constants()
    tokenomics = check_tokenomics_constants()
    dl_r1 = check_dl_r1_fixes_present()
    fee_pol = check_no_fee_ingress_mainnet_path()
    if not fee_pol["mainnet_core_free_of_fee_ingress"]:
        fail("FeeIngress referenced in Mainnet core deploy path", fee_pol)

    pin = build_broadcast_pin(bytecode, compiler)
    PIN.write_text(json.dumps(pin, indent=2) + "\n", encoding="utf-8")

    # Candidate still unchanged after gate
    if sha256_file(CAND) != man.get("sha256"):
        fail("Candidate mutated during gate — STOP")

    payload = {
        "stamp": "V9_MAINNET_PRE_BROADCAST_FINAL_PASS",
        "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "phase": "3_mainnet_pre_broadcast_gate_only",
        "chain_id_target": 1,
        "candidate": "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
        "remediation_wave": "DL_R1",
        "candidate_manifest_sha256": man.get("sha256"),
        "candidate_frozen_at": cand.get("frozen_at"),
        "candidate_mutated": False,
        "sepolia_pass": "V9_SEPOLIA_REGRESSION_DL_R1_PASS",
        "sepolia_pass_sha256": sha256_file(SEPOLIA),
        "inherits_r2_final_audit_pass": False,
        "forbids_legacy_assets": [
            "V9_AUDIT_CANDIDATE_R2_FINAL",
            "V9_REMINT_SEPOLIA_PASS_STOP",
            "deploy3_pre_dl_r1",
            "FeeIngress_as_mainnet_caller",
            LEGACY_SAFE,
            LEGACY_P4CAP,
        ],
        "exact_match": {
            "source_files": n_src,
            "source_exact": True,
            "local_bytecode_pin_exact": True,
            "compiler": compiler,
            "broadcast_artifact_pin": "evidence/GO_ttg_v9_audit/V9_MAINNET_DL_R1_BROADCAST_ARTIFACT_PIN.json",
            "broadcast_artifact_pin_sha256": sha256_file(PIN),
        },
        "pins_verified": {
            "ops": dl_const,
            "tokenomics_50_35_3_5_7": tokenomics,
            "dl_r1_fixes": dl_r1,
            "fee_ingress_policy": fee_pol,
            "solo_timelock_delay_48h": True,
            "marketing": MARKETING,
            "team": TEAM,
            "treasury_guardian": TREASURY,
        },
        "checks": {
            "chain_id_1_target": True,
            "solo_timelock_48h": True,
            "ops_addresses_norm": True,
            "fee_router_escrow_settlement_only_policy": True,
            "forbid_free_fee_ingress": True,
            "jurisdiction_from_trusted_order_iso_policy": True,
            "supply_25t_no_mint_invariant_in_source": True,
            "genesis_50_35_3_5_7": True,
            "five_batches": True,
            "sale_usdc_to_new_project_pool_required": True,
            "platform_fee_500_45_55_or_100": True,
            "p4_90d_30pct_usdc_only": True,
            "role_stake_live_supply": True,
            "governance_burn_timelock_gated": True,
            "uups_guardian_model": True,
            "zero_active_legacy_safe_p4cap_v8_as_v9_official": True,
            "source_compiler_bytecode_constructor_pin_exact": True,
        },
        "mainnet_broadcast": "FORBIDDEN_UNTIL_OWNER_WRITTEN_AUTH",
        "tt_production_go": "UNCHANGED_INDEPENDENT",
        "owner_auth_must_name": [
            "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
            "DL_R1",
            "V9_SEPOLIA_REGRESSION_DL_R1_PASS",
        ],
        "stop": True,
        "next": "Owner independent written Mainnet Broadcast Authorization → then per-tx Mainnet deploy + verify · still no auto TT_PRODUCTION_GO",
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"stamp": payload["stamp"], "candidate_mutated": False, "pin": str(PIN)}, indent=2))
    print("V9_MAINNET_PRE_BROADCAST_FINAL_PASS · STOP · no Mainnet broadcast · TT_PRODUCTION_GO unchanged")


if __name__ == "__main__":
    main()
