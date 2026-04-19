#!/usr/bin/env python3
"""
Check-G (Runbook §2.7.4): validate dual_score_signoff.v1 JSON.

Staged G2 floors (each of 7 dimensions): test_internal ≥7, pre_go ≥8, go_external ≥9.
If score < floor: risk_acceptances[] must contain an entry for that dimension_id
with non-empty reason + approver.

Optional P0/P1 fields: meta (manifest bind), g1_snapshot, evidence_refs.
Optional --bundle-root DIR: verify meta.sha256 ↔ manifest.json and manifest.dual_score ↔ this file.

Usage:
  python3 scripts/dev/validate_dual_score_signoff.py PATH.json [--emit-summary] [--bundle-root DIR]
  python3 scripts/dev/validate_dual_score_signoff.py self-test
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SCHEMA_ID = "traveltrust.dual_score_signoff.v1"

STAGE_FLOORS: dict[str, int] = {
    "test_internal": 7,
    "pre_go": 8,
    "go_external": 9,
}

SHA256_HEX_RE = re.compile(r"^[0-9a-f]{64}$")


def _fail(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def _read_json(path: Path) -> dict:
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as e:
        _fail(f"dual-score: cannot read {path}: {e}", 2)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        _fail(f"dual-score: invalid JSON in {path}: {e}", 2)
    if not isinstance(data, dict):
        _fail(f"dual-score: {path} root must be a JSON object", 2)
    return data


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def validate_optional_ssot_fields(data: dict, *, label: str) -> None:
    """meta, g1_snapshot, evidence_refs — format only."""
    meta = data.get("meta")
    if meta is not None:
        if not isinstance(meta, dict):
            _fail(f"{label}: meta must be object")
        mr = meta.get("manifest_ref")
        if mr is not None:
            if not isinstance(mr, str) or not mr.strip():
                _fail(f"{label}: meta.manifest_ref must be non-empty string when set")
        hx = meta.get("sha256")
        if hx is not None:
            if not isinstance(hx, str) or not SHA256_HEX_RE.match(hx.strip().lower()):
                _fail(f"{label}: meta.sha256 must be 64 lowercase hex chars")
            if hx.strip().lower() != hx.lower():
                _fail(f"{label}: meta.sha256 must be lowercase hex")

    g1s = data.get("g1_snapshot")
    if g1s is not None:
        if not isinstance(g1s, dict):
            _fail(f"{label}: g1_snapshot must be object")
        for k in ("spec_version", "overall_percent", "source"):
            if k not in g1s:
                _fail(f"{label}: g1_snapshot missing {k!r}")
        sp = g1s["spec_version"]
        src = g1s["source"]
        if not isinstance(sp, str) or not sp.strip():
            _fail(f"{label}: g1_snapshot.spec_version must be non-empty string")
        if not isinstance(src, str) or not src.strip():
            _fail(f"{label}: g1_snapshot.source must be non-empty string")
        pct = g1s["overall_percent"]
        if not isinstance(pct, (int, float)) or pct < 0 or pct > 100:
            _fail(f"{label}: g1_snapshot.overall_percent must be number in [0,100]")

    refs = data.get("evidence_refs")
    if refs is not None:
        if not isinstance(refs, list) or len(refs) < 1:
            _fail(f"{label}: evidence_refs must be non-empty array when set")
        for i, r in enumerate(refs):
            if not isinstance(r, str) or not r.strip():
                _fail(f"{label}: evidence_refs[{i}] must be non-empty string")


def validate_bundle_coherence(
    data: dict,
    *,
    dual_path: Path,
    bundle_root: Path,
) -> list[str]:
    """
    P0 (authoritative): manifest.dual_score.path + sha256 ↔ this file bytes.

    Optional: meta.sha256 must equal sha256(manifest.json) when set (same bytes as on disk).
    Note: adding meta changes the dual file → usually update manifest.dual_score.sha256 once;
    then meta.sha256 must match the *final* manifest.json (see Runbook §2.7.4).
    """
    msgs: list[str] = []
    manifest_path = bundle_root / "manifest.json"
    if not manifest_path.is_file():
        _fail(f"dual-score: --bundle-root set but missing {manifest_path}")

    man = _read_json(manifest_path)
    ds = man.get("dual_score")
    if ds is not None:
        if not isinstance(ds, dict):
            _fail("dual-score: manifest.json dual_score must be object")
        for k in ("path", "sha256"):
            if k not in ds:
                _fail(f"dual-score: manifest.json dual_score missing {k!r}")
        rel = ds["path"]
        mhx = ds["sha256"]
        if not isinstance(rel, str) or not rel.strip():
            _fail("dual-score: manifest.dual_score.path invalid")
        if (
            not isinstance(mhx, str)
            or not SHA256_HEX_RE.match(mhx.strip().lower())
            or mhx.lower() != mhx
        ):
            _fail("dual-score: manifest.dual_score.sha256 must be 64 lowercase hex")
        expected_file = (bundle_root / rel).resolve()
        if expected_file.resolve() != dual_path.resolve():
            _fail(
                f"dual-score: manifest.dual_score.path {rel!r} resolves to {expected_file}, "
                f"expected dual file {dual_path.resolve()}"
            )
        fh = _sha256_file(dual_path)
        if fh != mhx:
            _fail(
                f"dual-score: manifest.dual_score.sha256 != file digest: file={fh} manifest={mhx}"
            )
        msgs.append("OK: manifest.dual_score.sha256 matches dual_score_signoff file")

    meta = data.get("meta") or {}
    if "sha256" in meta:
        hx = meta["sha256"]
        if isinstance(hx, str) and SHA256_HEX_RE.match(hx.strip().lower()) and hx.lower() == hx:
            manifest_digest = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
            if hx != manifest_digest:
                _fail(
                    f"dual-score: meta.sha256 != manifest.json digest: "
                    f"computed={manifest_digest} meta={hx}"
                )
            msgs.append("OK: meta.sha256 matches manifest.json")

    return msgs


def validate_document(data: dict, *, label: str) -> tuple[dict, list[str]]:
    """
    Returns (summary_detail, stderr_messages).
    Raises SystemExit on hard schema errors.
    """
    msgs: list[str] = []

    if data.get("schema_id") != SCHEMA_ID:
        _fail(f"{label}: schema_id must be {SCHEMA_ID!r}")

    validate_optional_ssot_fields(data, label=label)

    stage = data.get("stage")
    if stage not in STAGE_FLOORS:
        _fail(f"{label}: stage must be one of {list(STAGE_FLOORS.keys())}")

    floor = STAGE_FLOORS[stage]

    dims = data.get("dimensions")
    if not isinstance(dims, list) or len(dims) != 7:
        _fail(f"{label}: dimensions must be an array of exactly 7 items")

    seen: set[int] = set()
    by_id: dict[int, float] = {}
    for i, d in enumerate(dims):
        if not isinstance(d, dict):
            _fail(f"{label}: dimensions[{i}] must be object")
        did = d.get("id")
        if not isinstance(did, int) or did < 1 or did > 7:
            _fail(f"{label}: dimensions[{i}].id must be integer 1..7")
        if did in seen:
            _fail(f"{label}: duplicate dimension id {did}")
        seen.add(did)
        sc = d.get("score")
        if not isinstance(sc, (int, float)):
            _fail(f"{label}: dimensions[{i}].score must be number")
        sc = float(sc)
        if sc < 0 or sc > 10:
            _fail(f"{label}: dimensions[{i}].score must be in [0,10]")
        by_id[did] = sc

    if seen != set(range(1, 8)):
        _fail(f"{label}: dimension ids must be exactly 1..7 once each")

    ras = data.get("risk_acceptances") or []
    if not isinstance(ras, list):
        _fail(f"{label}: risk_acceptances must be array or omitted")

    ra_by_dim: dict[int, dict] = {}
    for j, ra in enumerate(ras):
        if not isinstance(ra, dict):
            _fail(f"{label}: risk_acceptances[{j}] must be object")
        did = ra.get("dimension_id")
        if not isinstance(did, int) or did < 1 or did > 7:
            _fail(f"{label}: risk_acceptances[{j}].dimension_id must be 1..7")
        for k in ("reason", "approver"):
            v = ra.get(k)
            if not isinstance(v, str) or not v.strip():
                _fail(f"{label}: risk_acceptances[{j}].{k} must be non-empty string")
        ra_by_dim[did] = ra

    under = [d for d in range(1, 8) if by_id[d] < floor]
    missing_ra = [d for d in under if d not in ra_by_dim]

    if missing_ra:
        msgs.append(
            f"G2 FAIL: stage={stage!r} floor={floor}: dimensions {missing_ra} "
            f"below floor — add risk_acceptances[] or raise scores"
        )
        g2_effective_pass = False
    elif under:
        msgs.append(
            f"G2 RISK_ACCEPTED: stage={stage!r} floor={floor}: dimensions {under} "
            f"below floor, covered by risk_acceptances[]"
        )
        g2_effective_pass = True
    else:
        g2_effective_pass = True

    if not data.get("g1_pass", False):
        msgs.append("WARN: g1_pass is false — G1 (execution %) must be satisfied for release")

    detail = {
        "stage": stage,
        "floor": floor,
        "dimension_scores": {str(k): by_id[k] for k in sorted(by_id)},
        "under_floor": under,
        "g2_effective_pass": g2_effective_pass,
    }
    return detail, msgs


def cmd_self_test() -> None:
    import tempfile

    ok = {
        "schema_id": SCHEMA_ID,
        "date": "2026-04-17",
        "stage": "test_internal",
        "execution_snapshot": {"combined_percent": 56.0, "source_note": "self-test"},
        "g1_pass": True,
        "dimensions": [{"id": i, "score": 8.0} for i in range(1, 8)],
        "risk_acceptances": [],
        "sign_off": ["self-test"],
    }
    d, _ = validate_document(ok, label="self-test-ok")
    assert d["g2_effective_pass"] is True

    bad = {
        **ok,
        "dimensions": [{"id": i, "score": 5.0} for i in range(1, 8)],
        "risk_acceptances": [],
    }
    d2, m2 = validate_document(bad, label="self-test-bad")
    assert d2["g2_effective_pass"] is False
    assert any("G2 FAIL" in x for x in m2)

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        art = root / "artifacts"
        art.mkdir()
        dual = art / "dual_score_signoff.v1.json"
        payload = {
            **ok,
            "g1_snapshot": {
                "spec_version": "1.0.837",
                "overall_percent": 56,
                "source": "docs/spec/07-开发流程与顺序.md §六 6.3",
            },
            "evidence_refs": ["self-test-bundle"],
        }
        dual.write_text(json.dumps(payload), encoding="utf-8")
        fh = _sha256_file(dual)
        man = {
            "gate": "Gate-X",
            "date": "2026-04-17",
            "artifacts": [
                {
                    "path": "artifacts/dual_score_signoff.v1.json",
                    "sha256": fh,
                }
            ],
            "sign_off": ["t"],
            "dual_score": {
                "path": "artifacts/dual_score_signoff.v1.json",
                "sha256": fh,
            },
        }
        (root / "manifest.json").write_text(json.dumps(man), encoding="utf-8")
        data_b = _read_json(dual)
        validate_optional_ssot_fields(data_b, label="bundle")
        coh = validate_bundle_coherence(data_b, dual_path=dual, bundle_root=root)
        assert any("OK: manifest.dual_score" in x for x in coh)

    ra_ok = {
        **ok,
        "dimensions": [{"id": 1, "score": 6.0}] + [{"id": i, "score": 8.0} for i in range(2, 8)],
        "risk_acceptances": [
            {
                "dimension_id": 1,
                "score": 6.0,
                "min_required": 7.0,
                "reason": "self-test RA",
                "approver": "plant",
            }
        ],
    }
    d4, m4 = validate_document(ra_ok, label="ra-ok")
    assert d4["g2_effective_pass"] is True
    assert any("RISK_ACCEPTED" in x for x in m4)

    print("dual-score self-test: OK", file=sys.stderr)


def main() -> None:
    ap = argparse.ArgumentParser(description="Validate dual_score_signoff.v1 for Check-G")
    ap.add_argument(
        "path",
        nargs="?",
        help="dual_score_signoff.v1.json or 'self-test'",
    )
    ap.add_argument("--emit-summary", action="store_true")
    ap.add_argument(
        "--bundle-root",
        type=str,
        default=None,
        help="GO bundle root (directory containing manifest.json); verifies P0 hashes",
    )
    args = ap.parse_args()

    if not args.path:
        ap.print_help()
        _fail("dual-score: missing PATH or self-test", 2)

    if args.path == "self-test":
        cmd_self_test()
        return

    path = Path(args.path)
    data = _read_json(path)
    detail, msgs = validate_document(data, label=str(path))

    bundle_msgs: list[str] = []
    if args.bundle_root:
        root = Path(args.bundle_root)
        bundle_msgs = validate_bundle_coherence(data, dual_path=path, bundle_root=root)

    for m in msgs + bundle_msgs:
        print(m, file=sys.stderr)

    hx = _sha256_file(path)
    summary = {
        "validate_kind": "traveltrust.dual_score_validate.v1",
        "file": str(path).replace("\\", "/"),
        "sha256": hx,
        "g1_pass_bool": bool(data.get("g1_pass")),
        "g2_effective_pass": detail["g2_effective_pass"],
        "detail": detail,
        "messages": msgs + bundle_msgs,
        "bundle_root": str(Path(args.bundle_root).resolve()).replace("\\", "/")
        if args.bundle_root
        else None,
    }

    if not detail["g2_effective_pass"]:
        if args.emit_summary:
            print(json.dumps(summary, ensure_ascii=False))
        _fail(f"dual-score: validation failed for {path}", 1)

    print(f"dual-score: OK {path} sha256={hx}", file=sys.stderr)
    if args.emit_summary:
        print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
