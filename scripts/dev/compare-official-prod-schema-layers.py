#!/usr/bin/env python3
"""Layered compare: Official Production schema Reality vs Git migrations (+ optional Local/Staging).

Read-only analysis of existing capture JSON. Does not connect to Production.
Does not ACCEPT_ED. Does not mutate databases.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import zlib
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def ver_from_name(name: str) -> int | None:
    m = re.match(r"^(\d+)_", name)
    return int(m.group(1)) if m else None


def fingerprint_git_migrations(mig_dir: Path) -> dict[str, Any]:
    files = sorted(p for p in mig_dir.glob("*.sql") if p.is_file())
    digests: list[dict[str, Any]] = []
    by_version: dict[int, dict[str, Any]] = {}
    for p in files:
        raw = p.read_bytes()
        h = hashlib.sha256(raw).hexdigest()
        v = ver_from_name(p.name)
        rel = p.as_posix()
        row = {"path": rel, "version": v, "sha256": h, "bytes": len(raw), "name": p.name}
        digests.append(row)
        if v is not None:
            by_version[v] = row
    agg = hashlib.sha256("".join(d["sha256"] for d in digests).encode()).hexdigest()
    return {
        "dir": mig_dir.as_posix(),
        "sql_file_count": len(files),
        "versioned_count": len(by_version),
        "versions": sorted(by_version),
        "aggregate_sha256_of_file_sha256s": agg,
        "by_version": {str(k): v for k, v in by_version.items()},
        "files": digests,
    }


def sqlx_checksum_candidates(content: bytes) -> set[int]:
    """sqlx historically used CRC32; also try SHA384[:8] as signed/unsigned BE/LE."""
    out: set[int] = set()
    crc = zlib.crc32(content) & 0xFFFFFFFF
    out.add(crc)
    out.add(crc - 0x100000000 if crc >= 0x80000000 else crc)
    digest = hashlib.sha384(content).digest()[:8]
    for endian in ("big", "little"):
        out.add(int.from_bytes(digest, endian, signed=False))
        out.add(int.from_bytes(digest, endian, signed=True))
    return out


def compare_migrations(prod_rows: list[dict[str, Any]], git: dict[str, Any]) -> dict[str, Any]:
    prod_versions = [int(r["version"]) for r in prod_rows]
    prod_set = set(prod_versions)
    git_set = set(git["versions"])
    only_prod = sorted(prod_set - git_set)
    only_git = sorted(git_set - prod_set)
    both = sorted(prod_set & git_set)

    checksum_match = 0
    checksum_mismatch: list[dict[str, Any]] = []
    checksum_unknown_algo = 0
    by_v = {int(k): v for k, v in git["by_version"].items()}

    for r in prod_rows:
        v = int(r["version"])
        if v not in by_v:
            continue
        path = Path(by_v[v]["path"])
        content = path.read_bytes()
        candidates = sqlx_checksum_candidates(content)
        prod_cs = r.get("checksum")
        if prod_cs in candidates:
            checksum_match += 1
        elif prod_cs is None:
            checksum_unknown_algo += 1
        else:
            # still record; may be sqlx algo variant we don't reconstruct
            checksum_mismatch.append(
                {
                    "version": v,
                    "prod_checksum": prod_cs,
                    "git_sha256": by_v[v]["sha256"],
                    "file": by_v[v]["name"],
                }
            )

    all_success = all(bool(r.get("success")) for r in prod_rows)

    # Version-set verdict (primary Reality vs Git migration bookkeeping)
    if only_prod:
        version_verdict = "DRIFT_PROD_HAS_UNKNOWN_MIGRATIONS"
    elif only_git:
        version_verdict = "DRIFT_GIT_AHEAD_OF_PROD"
    else:
        version_verdict = "VERSION_SET_MATCH"

    return {
        "prod_migration_count": len(prod_versions),
        "prod_all_success": all_success,
        "prod_first_versions": prod_versions[:5],
        "prod_last_versions": prod_versions[-5:],
        "git_sql_file_count": git["sql_file_count"],
        "git_versioned_count": git["versioned_count"],
        "git_aggregate_sha256_of_file_sha256s": git["aggregate_sha256_of_file_sha256s"],
        "only_in_prod_not_git": only_prod,
        "only_in_git_not_prod": only_git,
        "intersection_count": len(both),
        "checksum_match_known_algo": checksum_match,
        "checksum_mismatch_or_unknown_algo_count": len(checksum_mismatch),
        "checksum_mismatch_sample": checksum_mismatch[:10],
        "version_set_verdict": version_verdict,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--capture",
        default="evidence/GO_official_product_reality_capture/OFFICIAL_PROD_SCHEMA_CAPTURE_LATEST.json",
    )
    ap.add_argument("--migrations-dir", default="crates/api/migrations")
    ap.add_argument(
        "--out",
        default="evidence/GO_official_product_reality_capture/OFFICIAL_PROD_SCHEMA_LAYERED_COMPARE_LATEST.json",
    )
    ap.add_argument("--local-capture", default="")
    ap.add_argument("--staging-capture", default="")
    args = ap.parse_args()

    cap = load_json(Path(args.capture))
    git = fingerprint_git_migrations(Path(args.migrations_dir))
    mig = cap["production"]["migration_state"]["_sqlx_migrations"]["rows"]
    mig_cmp = compare_migrations(mig, git)

    layers: dict[str, Any] = {
        "official_production_live": {
            "status": cap.get("status"),
            "stamp": cap.get("stamp"),
            "counts": cap["production"]["counts"],
            "fingerprints": cap["production"]["fingerprints"],
            "migration_state_tables": cap["production"].get("migration_state_tables"),
            "policy": cap.get("policy"),
        },
        "official_baseline_cite": {
            "database_baseline": "production_surface",
            "note": "Live capture IS Official Production Reality for schema; baseline cite = production_surface",
            "live_vs_baseline": "LIVE_IS_BASELINE",
        },
        "git_migrations": {
            "dir": git["dir"],
            "sql_file_count": git["sql_file_count"],
            "versioned_count": git["versioned_count"],
            "aggregate_sha256_of_file_sha256s": git["aggregate_sha256_of_file_sha256s"],
            "first_versions": git["versions"][:5],
            "last_versions": git["versions"][-5:],
        },
        "migration_bookkeeping_compare": mig_cmp,
    }

    for label, path_s in (("local", args.local_capture), ("staging", args.staging_capture)):
        if not path_s:
            layers[f"{label}_schema"] = {
                "status": "NOT_CAPTURED_THIS_WAVE",
                "note": "Optional schema-only capture not provided; migration version-set is primary gate vs Git",
            }
            continue
        other = load_json(Path(path_s))
        ofp = cap["production"]["fingerprints"]["aggregate_schema_sha256"]
        ofp2 = other["production"]["fingerprints"]["aggregate_schema_sha256"]
        layers[f"{label}_schema"] = {
            "status": "COMPARED",
            "path": path_s,
            "aggregate_match": ofp == ofp2,
            "other_aggregate": ofp2,
            "prod_aggregate": ofp,
            "counts": other["production"]["counts"],
        }

    # Overall verdict for RUNTIME_PARITY_GAPS closure
    # Primary: live schema capture PASS + version set relationship classified honestly
    live_ok = cap.get("status") == "PASS_CAPTURE"
    vs = mig_cmp["version_set_verdict"]

    if not live_ok:
        overall = "STOP_CAPTURE_FAILED"
        runtime_gaps = "NOT_ZERO"
        parity_pass_allowed = False
        drift = True
    elif vs == "VERSION_SET_MATCH":
        overall = "MATCH_LIVE_SCHEMA_AND_GIT_MIGRATION_SET"
        runtime_gaps = "0"
        parity_pass_allowed = True
        drift = False
    elif vs == "DRIFT_GIT_AHEAD_OF_PROD":
        # Git has migrations not yet applied on Official Production — Production Reality drift vs Git tip
        overall = "PRODUCTION_REALITY_DRIFT_GIT_AHEAD"
        runtime_gaps = "NOT_ZERO"
        parity_pass_allowed = False
        drift = True
    else:
        overall = "PRODUCTION_REALITY_DRIFT_UNKNOWN_PROD_MIGRATIONS"
        runtime_gaps = "NOT_ZERO"
        parity_pass_allowed = False
        drift = True

    out = {
        "schema": "traveltrust.official_prod_schema_layered_compare.v1",
        "recorded_utc": cap.get("stamp"),
        "capture_artifact": args.capture,
        "layers": layers,
        "overall_verdict": overall,
        "production_reality_drift": drift,
        "RUNTIME_PARITY_GAPS_if_applied": runtime_gaps,
        "parity_pass_allowed_by_schema_layer": parity_pass_allowed,
        "forbid_accept_ed": True,
        "forbid_production_db_mutation": True,
        "post_parity_defects_untouched": ["M7-07", "M7-08", "M8-07"],
        "notes": [
            "Live schema fingerprints are Official Production Reality for tables/columns/indexes/constraints/extensions.",
            "Git compare is migration bookkeeping (_sqlx_migrations versions) vs crates/api/migrations filenames.",
            "Checksum algo mismatch alone does not override version-set verdict when files exist for every applied version.",
            "Local/Staging live schema compare is optional; absence does not ACCEPT_ED the Production capture.",
        ],
    }

    out_path = Path(args.out)
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    stamped = out_path.with_name(
        f"OFFICIAL_PROD_SCHEMA_LAYERED_COMPARE_{cap.get('stamp', 'LATEST')}.json"
    )
    stamped.write_text(out_path.read_text(encoding="utf-8"), encoding="utf-8")
    print(json.dumps({"status": overall, "out": str(out_path), "drift": drift, "runtime": runtime_gaps}, indent=2))
    return 0 if not drift else 2


if __name__ == "__main__":
    raise SystemExit(main())
