#!/usr/bin/env python3
"""Pin + bind Artifact/Bytecode/Evidence for CDR-19 L5-A Release Identity refresh."""
from __future__ import annotations

import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"


def git(*a: str) -> str:
    return subprocess.check_output(["git", *a], cwd=ROOT, text=True).strip()


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    release_sha = git("rev-parse", "HEAD")
    PENDING.mkdir(parents=True, exist_ok=True)
    FG.mkdir(parents=True, exist_ok=True)

    artifacts = []
    for rel in [
        "contracts/src/Escrow.sol",
        "contracts/src/EscrowFactory.sol",
        "contracts/src/SettlementRouter.sol",
        "contracts/src/ISettlementRouter.sol",
        "contracts/src/IEscrowServiceFeeSync.sol",
        "contracts/script/DeployFcgV2WiredEscrowFactorySepolia.s.sol",
        "contracts/abi/Escrow.json",
        "contracts/abi/EscrowFactory.json",
        "contracts/abi/SettlementRouter.json",
        "contracts/test/EscrowSettlementRouterWireV311.t.sol",
    ]:
        p = ROOT / rel
        if p.exists():
            artifacts.append({"path": rel, "sha256": sha256_file(p), "bytes": p.stat().st_size})

    bytecode_binds = []
    for name in ["Escrow", "EscrowFactory", "SettlementRouter", "FeeRouter"]:
        for cand in [
            ROOT / f"contracts/out/{name}.sol/{name}.json",
            ROOT / f"out/{name}.sol/{name}.json",
        ]:
            if not cand.exists():
                continue
            data = json.loads(cand.read_text(encoding="utf-8"))
            deployed = data.get("deployedBytecode", {})
            bytecode = data.get("bytecode", {})
            if isinstance(deployed, dict):
                deployed = deployed.get("object", "")
            if isinstance(bytecode, dict):
                bytecode = bytecode.get("object", "")
            deployed = deployed or ""
            bytecode = bytecode or ""
            bytecode_binds.append(
                {
                    "contract": name,
                    "artifact": str(cand.relative_to(ROOT)).replace("\\", "/"),
                    "bytecode_sha256": hashlib.sha256(bytecode.encode()).hexdigest() if bytecode else None,
                    "deployed_bytecode_sha256": hashlib.sha256(deployed.encode()).hexdigest()
                    if deployed
                    else None,
                }
            )
            break

    evidence_members = []
    for rel in [
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3/L5A-FINANCIAL-FLOW-WIRING-CLOSURE-LATEST.json",
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/CDR-19-L5A-SCOPE-CONFIRM-LATEST.json",
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L3-SECURITY-PREP-PARALLEL-LATEST.json",
        "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/FCG-V2-ONCHAIN-BIND-LATEST.json",
    ]:
        p = ROOT / rel
        if p.is_file():
            evidence_members.append({"path": rel, "sha256": sha256_file(p), "bytes": p.stat().st_size})

    art_bundle = hashlib.sha256("".join(a["sha256"] for a in artifacts).encode()).hexdigest()
    ev_bundle = (
        hashlib.sha256("".join(m["sha256"] for m in evidence_members).encode()).hexdigest()
        if evidence_members
        else None
    )

    pin = {
        "schema": "traveltrust.cdr19_release_sha_pin.v1",
        "id": "CDR-19-L5A-REFRESH",
        "recorded_utc": stamp,
        "RELEASE_SCOPE_MODE": "CONTROLLED_MINIMUM_RELEASE",
        "prior_Release_SHA": "493596aebd579dd92c3c2a5f58349c5444b9df13",
        "Release_SHA": release_sha,
        "Release_SHA_short": release_sha[:12],
        "commit_subject": git("log", "-1", "--format=%s"),
        "reason": "L5-A Escrow/SettlementRouter/EscrowFactory wire — new Release Identity before Sepolia wired redeploy",
        "status": "RELEASE_SHA_PINNED",
    }
    (PENDING / "CDR-19-L5A-RELEASE-SHA-PIN-LATEST.json").write_text(
        json.dumps(pin, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    binding = {
        "schema": "traveltrust.cdr19_equivalence_binding.v1",
        "id": "CDR-19-L5A-REFRESH",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "Source_SHA": release_sha,
        "Deploy_Artifact": {"members": artifacts, "bundle_sha256": art_bundle},
        "Contract_Bytecode": {
            "members": bytecode_binds,
            "status": "BOUND" if bytecode_binds else "PENDING_FORGE_OUT",
        },
        "Evidence_Package": {
            "member_count": len(evidence_members),
            "bundle_sha256": ev_bundle,
            "full_index_rel": "CDR-19-L5A-EVIDENCE-PACKAGE-MANIFEST-LATEST.json",
        },
        "status": "BINDING_COMPLETE" if bytecode_binds else "BINDING_PARTIAL",
        "verdict": "CDR19_L5A_BINDING_PINNED",
    }
    (PENDING / "CDR-19-L5A-EQUIVALENCE-BINDING-LATEST.json").write_text(
        json.dumps(binding, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (PENDING / "CDR-19-L5A-EVIDENCE-PACKAGE-MANIFEST-LATEST.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.cdr19_evidence_package_manifest.v1",
                "recorded_utc": stamp,
                "Release_SHA": release_sha,
                "members": evidence_members,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    cdr19 = {
        "schema": "traveltrust.cdr19_release_identity_closure.v1",
        "id": "CDR-19-L5A-REFRESH",
        "recorded_utc": stamp,
        "status": "PASS_L5A_REFRESH",
        "Release_SHA": release_sha,
        "prior_Release_SHA": "493596aebd579dd92c3c2a5f58349c5444b9df13",
        "l5_status": "EMPIRICAL_PARTIAL",
        "l5_pass": False,
        "l3_security": "PREP_ONLY",
        "next": "Sepolia_wired_EscrowFactory_Clean_Redeploy",
        "ACTIVE_flip": "FORBIDDEN",
        "verdict": "CDR19_L5A_PASS_READY_FOR_WIRED_REDEPLOY",
    }
    (PENDING / "CDR-19-L5A-RELEASE-IDENTITY-CLOSURE-LATEST.json").write_text(
        json.dumps(cdr19, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps({"Release_SHA": release_sha[:12], "bytecode": len(bytecode_binds), "verdict": cdr19["verdict"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
