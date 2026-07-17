#!/usr/bin/env python3
"""
Generate machine-derived RCP scopes from Runtime Dependency Registry (UNIQUE SSOT).

  python scripts/dev/generate-rcp-registry-derived.py

Writes:
  registry/runtime-dependency-registry.derived.v1.json
  evidence/GO_psg_governance/RUNTIME_CHANGE_PROPAGATION/DERIVED-SCOPES-LATEST.json

Does NOT mutate Tag / Archive / Certification / TT_PRODUCTION_GO.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "registry" / "runtime-dependency-registry.v1.yaml"
OUT = ROOT / "registry" / "runtime-dependency-registry.derived.v1.json"
EVID = ROOT / "evidence" / "GO_psg_governance" / "RUNTIME_CHANGE_PROPAGATION"


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main() -> None:
    raw = SRC.read_bytes()
    doc = yaml.safe_load(raw)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    enforced_domains = {
        k: v
        for k, v in (doc.get("domains") or {}).items()
        if isinstance(v, dict) and v.get("enforced") is True
    }

    validation_scope = []
    probe_scope = set()
    change_class_index = {}
    owner_index = {}

    for domain_id, domain in enforced_domains.items():
        owner_index[domain_id] = domain.get("owner")
        for v in domain.get("required_validations") or []:
            validation_scope.append(
                {
                    "domain": domain_id,
                    "validation_id": v.get("id"),
                    "rule_id": v.get("rule_id"),
                    "probe_scope": v.get("probe_scope") or [],
                    "blocked_if": v.get("blocked_if"),
                    "waive": v.get("waive"),
                    "binds_domain": v.get("binds_domain"),
                    "binds_validation": v.get("binds_validation"),
                }
            )
            for p in v.get("probe_scope") or []:
                probe_scope.add(p)
        for side in ("producers", "consumers"):
            for node in domain.get(side) or []:
                for cc in node.get("change_classes") or []:
                    change_class_index.setdefault(cc, []).append(
                        {"domain": domain_id, "side": side, "id": node.get("id")}
                    )

    gap_matrix = {
        "enforced_domains": sorted(enforced_domains.keys()),
        "deferred_domains": [
            {"id": d.get("id"), "wave": d.get("wave"), "status": d.get("status")}
            for d in (doc.get("deferred_domains") or [])
        ],
        "sixteen_dimensions_complete": False,
        "wave_c_d_enforced": False,
        "dedup_notes": doc.get("governance_dedup_notes") or [],
        "p1_near_term": (doc.get("phased_evolution") or {}).get("P1_near_term") or [],
        "p2_mid_term": (doc.get("phased_evolution") or {}).get("P2_mid_term") or [],
        "p3_long_term": (doc.get("phased_evolution") or {}).get("P3_long_term") or [],
    }

    derived = {
        "schema": "traveltrust.runtime_dependency_registry.derived.v1",
        "machine_key": "TT_RUNTIME_DEPENDENCY_REGISTRY_DERIVED",
        "generated_utc": now,
        "source": "registry/runtime-dependency-registry.v1.yaml",
        "source_sha256": sha256_bytes(raw),
        "registry_status": doc.get("status"),
        "registry_version": doc.get("version"),
        "change_classes": doc.get("change_classes") or [],
        "owners": doc.get("owners") or {},
        "runtimes": doc.get("runtimes") or [],
        "waive_policy": doc.get("waive_policy") or {},
        "deploy_dependency_graph": doc.get("deploy_dependency_graph") or {},
        "compatibility_matrix": doc.get("compatibility_matrix") or {},
        "domains_enforced": enforced_domains,
        "validation_scope": validation_scope,
        "probe_scope": sorted(probe_scope),
        "change_class_index": change_class_index,
        "owner_index": owner_index,
        "gap_matrix": gap_matrix,
        "gate_binding": doc.get("gate_binding") or {},
        "phased_evolution": doc.get("phased_evolution") or {},
        "honest_boundary": doc.get("honest_boundary"),
    }

    OUT.write_text(json.dumps(derived, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    EVID.mkdir(parents=True, exist_ok=True)
    (EVID / "DERIVED-SCOPES-LATEST.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.rcp_derived_scopes.v1",
                "generated_utc": now,
                "source_sha256": derived["source_sha256"],
                "validation_scope": validation_scope,
                "probe_scope": derived["probe_scope"],
                "compatibility_matrix": derived["compatibility_matrix"],
                "deploy_dependency_graph": derived["deploy_dependency_graph"],
                "gap_matrix": gap_matrix,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"OK wrote {OUT.relative_to(ROOT)}")
    print(f"OK wrote {EVID.relative_to(ROOT)}/DERIVED-SCOPES-LATEST.json")
    print(f"source_sha256={derived['source_sha256']}")
    print(f"validations={len(validation_scope)} probes={len(probe_scope)}")


if __name__ == "__main__":
    main()
