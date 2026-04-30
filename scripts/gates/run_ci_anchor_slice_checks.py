#!/usr/bin/env python3
"""
Run CI anchor checks for one slice of registry/ci-anchor-manifest.v1.yaml

Default: grep -nF pattern target_file (or -nE when check.match == regex).
Writes evidence log + shell-env for workflow continuation.

Per-slice ``evidence``: routes_log, counts_env, header (list of lines).

Optional:
  failure_model: anchors_plus_rates (default) | anchors_only
  kind: route | policy | role  (role → ROLE_* env; policy → POLICY_*; route → ROUTE_*)
  match: fixed (default) | regex  (regex → grep -nE)

community-governance-gate: set community_branching: true with core_checks,
  placeholder_checks, implemented_checks, branch_selector (threshold, regex, search_dir).

Optional on the same block: allow_empty_core_checks: true (core_checks may be []),
  always_checks: [...] (run after branch; e.g. doc anchors that apply in both modes).
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    print("ERROR: PyYAML required (pip install pyyaml)", file=sys.stderr)
    sys.exit(1)


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "registry" / "ci-anchor-manifest.v1.yaml"


def _evidence_paths(block: dict, slice_key: str) -> tuple[Path, Path, list[str], Path | None]:
    ev_cfg = block.get("evidence")
    if not isinstance(ev_cfg, dict):
        raise ValueError(f"slice {slice_key!r}: missing evidence: mapping with routes_log, counts_env, header")

    rl = ev_cfg.get("routes_log")
    ce = ev_cfg.get("counts_env")
    hdr = ev_cfg.get("header")
    meta = ev_cfg.get("meta_env")
    if not isinstance(rl, str) or not rl.strip():
        raise ValueError(f"slice {slice_key!r}: evidence.routes_log required")
    if not isinstance(ce, str) or not ce.strip():
        raise ValueError(f"slice {slice_key!r}: evidence.counts_env required")
    if not isinstance(hdr, list) or not hdr or not all(isinstance(x, str) for x in hdr):
        raise ValueError(f"slice {slice_key!r}: evidence.header must be non-empty list of strings")

    meta_path = Path(meta) if isinstance(meta, str) and meta.strip() else None
    return Path(rl), Path(ce), hdr, meta_path


def _grep_one(pattern: str, rel: Path, *, use_regex: bool) -> tuple[int, str]:
    cmd = ["grep", "-nE" if use_regex else "-nF", pattern, str(rel)]
    r = subprocess.run(
        cmd,
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if r.returncode == 0 and r.stdout:
        return 0, r.stdout.rstrip()
    return 1, ""


def _community_branch_line_count(sel: dict) -> int:
    """Replicate finance/community gate: count matching lines under search_dir."""
    if not isinstance(sel, dict):
        return 0
    rx_s = sel.get("regex")
    sdir = sel.get("search_dir", "crates/api/src/routes")
    glob_pat = sel.get("include_glob", "*.rs")
    if not isinstance(rx_s, str) or not rx_s.strip():
        return 0
    try:
        rx = re.compile(rx_s)
    except re.error as e:
        print(f"ERROR: branch_selector.regex invalid: {e}", file=sys.stderr)
        return -1

    base = ROOT / sdir
    if not base.is_dir():
        return 0
    n = 0
    for p in base.rglob(glob_pat):
        if not p.is_file():
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for line in text.splitlines():
            if rx.search(line):
                n += 1
    return n


def _run_check_row(
    row: dict,
    lines: list[str],
    counters: dict,
) -> int:
    """Run one check; bump counters and return anchor_failures increment (0 or 1)."""
    kind = row.get("kind")
    pattern = row.get("pattern")
    target = row.get("target_file")
    match_mode = row.get("match") or "fixed"
    use_regex = match_mode == "regex"

    if kind not in ("route", "policy", "role"):
        print(f"ERROR: invalid kind {kind!r}", file=sys.stderr)
        return 1
    if not isinstance(pattern, str) or not pattern:
        print("ERROR: pattern required", file=sys.stderr)
        return 1
    if not isinstance(target, str) or not target:
        print("ERROR: target_file required", file=sys.stderr)
        return 1

    rel = ROOT / target
    if not rel.is_file():
        print(f"ERROR: target_file missing: {target}", file=sys.stderr)
        return 1

    rc, out = _grep_one(pattern, rel, use_regex=use_regex)
    if rc == 0 and out:
        lines.append(out)
        if kind == "route":
            counters["route_passed"] += 1
        elif kind == "policy":
            counters["policy_passed"] += 1
        else:
            counters["role_passed"] += 1
        return 0
    return 1


def _write_env(
    env_path: Path,
    *,
    route_total: int,
    route_passed: int,
    policy_total: int,
    policy_passed: int,
    role_total: int,
    role_passed: int,
    failure_model: str,
) -> int:
    route_pass_rate = (route_passed * 100 // route_total) if route_total else 100
    policy_pass_rate = (policy_passed * 100 // policy_total) if policy_total else 100
    role_pass_rate = (role_passed * 100 // role_total) if role_total else 100

    anchor_failures = (
        (route_total - route_passed)
        + (policy_total - policy_passed)
        + (role_total - role_passed)
    )
    failures = anchor_failures
    if failure_model == "anchors_plus_rates":
        if route_total and route_pass_rate != 100:
            failures += 1
        if policy_total and policy_pass_rate != 100:
            failures += 1
        if role_total and role_pass_rate != 100:
            failures += 1

    env_lines = [
        f"ROUTE_CHECKS_TOTAL={route_total}",
        f"ROUTE_CHECKS_PASSED={route_passed}",
        f"POLICY_CHECKS_TOTAL={policy_total}",
        f"POLICY_CHECKS_PASSED={policy_passed}",
        f"ROLE_CHECKS_TOTAL={role_total}",
        f"ROLE_CHECKS_PASSED={role_passed}",
        f"ROUTE_PASS_RATE={route_pass_rate}",
        f"POLICY_PASS_RATE={policy_pass_rate}",
        f"ROLE_PASS_RATE={role_pass_rate}",
        f"ANCHOR_FAILURES={failures}",
    ]
    env_path.write_text("\n".join(env_lines) + "\n", encoding="utf-8")
    return failures


def run_community_branching(
    block: dict,
    slice_key: str,
    ev: Path,
    log_path: Path,
    env_path: Path,
    header_lines: list[str],
    meta_path: Path | None,
) -> int:
    sel = block.get("branch_selector")
    threshold = int(sel.get("threshold", 5)) if isinstance(sel, dict) else 5
    core = block.get("core_checks")
    ph = block.get("placeholder_checks")
    impl = block.get("implemented_checks")
    always = block.get("always_checks")
    allow_empty_core = bool(block.get("allow_empty_core_checks"))

    if not isinstance(core, list):
        print(f"ERROR: slice {slice_key!r}: core_checks must be a list", file=sys.stderr)
        return 1
    if not isinstance(ph, list) or not isinstance(impl, list):
        print(f"ERROR: slice {slice_key!r} needs placeholder_checks, implemented_checks as lists", file=sys.stderr)
        return 1
    if not core and not allow_empty_core:
        print(
            f"ERROR: slice {slice_key!r}: core_checks empty; set allow_empty_core_checks: true or add core_checks",
            file=sys.stderr,
        )
        return 1
    if always is None:
        always = []
    if not isinstance(always, list):
        print(f"ERROR: slice {slice_key!r}: always_checks must be a list when set", file=sys.stderr)
        return 1

    n = _community_branch_line_count(sel) if isinstance(sel, dict) else 0
    if n < 0:
        return 1
    implemented_mode = n >= threshold
    branch = impl if implemented_mode else ph
    coverage_mode = "implemented" if implemented_mode else "target-placeholder"

    commit = os.environ.get("GITHUB_SHA", "local")
    lines: list[str] = list(header_lines)
    lines.append(f"- slice: {slice_key}")
    lines.append(f"- commit_sha: {commit}")
    lines.append(f"- branch_line_count: {n} (threshold={threshold})")
    lines.append(f"- coverage_mode: {coverage_mode}")

    counters = {"route_passed": 0, "policy_passed": 0, "role_passed": 0}
    anchor_failures = 0
    for group_name, group in (("core", core), ("branch", branch), ("always", always)):
        if not isinstance(group, list):
            continue
        for i, row in enumerate(group):
            if not isinstance(row, dict):
                print(f"ERROR: {group_name} check[{i}] must be mapping", file=sys.stderr)
                return 1
            anchor_failures += _run_check_row(row, lines, counters)

    log_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # anchors_only: totals = all checks for bookkeeping; pass rates not used by workflow
    total_checks = len(core) + len(branch) + len(always)
    passed = counters["route_passed"] + counters["policy_passed"] + counters["role_passed"]
    # Map all into ROUTE_* for env compatibility (workflow only reads ANCHOR_FAILURES + meta)
    env_path.write_text(
        "\n".join(
            [
                f"ROUTE_CHECKS_TOTAL={total_checks}",
                f"ROUTE_CHECKS_PASSED={passed}",
                f"POLICY_CHECKS_TOTAL=0",
                f"POLICY_CHECKS_PASSED=0",
                f"ROLE_CHECKS_TOTAL=0",
                f"ROLE_CHECKS_PASSED=0",
                f"ROUTE_PASS_RATE={(passed * 100 // total_checks) if total_checks else 100}",
                f"POLICY_PASS_RATE=100",
                f"ROLE_PASS_RATE=100",
                f"ANCHOR_FAILURES={anchor_failures}",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    if meta_path:
        imp = "true" if implemented_mode else "false"
        meta_path.write_text(
            f"ANCHOR_FAILURES={anchor_failures}\nCOVERAGE_MODE={coverage_mode}\nIMPLEMENTED_MODE={imp}\n",
            encoding="utf-8",
        )

    if anchor_failures:
        print(f"[run_ci_anchor_slice_checks] failures={anchor_failures} (see {log_path})", file=sys.stderr)
        return 1
    print(f"OK: slice={slice_key} branch anchors passed (coverage_mode={coverage_mode})")
    return 0


def run_flat_slice(
    block: dict,
    slice_key: str,
    checks: list,
    ev: Path,
    log_path: Path,
    env_path: Path,
    header_lines: list[str],
) -> int:
    failure_model = block.get("failure_model", "anchors_plus_rates")
    if failure_model not in ("anchors_plus_rates", "anchors_only"):
        print(f"ERROR: invalid failure_model {failure_model!r}", file=sys.stderr)
        return 1

    parsed: list[dict] = []
    for i, row in enumerate(checks):
        if not isinstance(row, dict):
            print(f"ERROR: check[{i}] must be a mapping", file=sys.stderr)
            return 1
        kind = row.get("kind")
        if kind not in ("route", "policy", "role"):
            print(f"ERROR: check[{i}].kind must be route|policy|role", file=sys.stderr)
            return 1
        match_mode = row.get("match", "fixed")
        if match_mode not in ("fixed", "regex"):
            print(f"ERROR: check[{i}].match must be fixed|regex", file=sys.stderr)
            return 1
        pattern = row.get("pattern")
        target = row.get("target_file")
        if not isinstance(pattern, str) or not pattern:
            print(f"ERROR: check[{i}].pattern required", file=sys.stderr)
            return 1
        if not isinstance(target, str) or not target:
            print(f"ERROR: check[{i}].target_file required", file=sys.stderr)
            return 1
        parsed.append({"kind": kind, "pattern": pattern, "target_file": target, "match": match_mode})

    commit = os.environ.get("GITHUB_SHA", "local")
    lines: list[str] = list(header_lines)
    lines.append(f"- slice: {slice_key}")
    lines.append(f"- commit_sha: {commit}")

    counters = {"route_passed": 0, "policy_passed": 0, "role_passed": 0}
    anchor_failures = 0
    for row in parsed:
        anchor_failures += _run_check_row(row, lines, counters)

    routes = [x for x in parsed if x["kind"] == "route"]
    policies = [x for x in parsed if x["kind"] == "policy"]
    roles = [x for x in parsed if x["kind"] == "role"]
    route_total, policy_total, role_total = len(routes), len(policies), len(roles)

    log_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # Recompute passed per bucket
    rp = counters["route_passed"]
    pp = counters["policy_passed"]
    lp = counters["role_passed"]

    route_pass_rate = (rp * 100 // route_total) if route_total else 100
    policy_pass_rate = (pp * 100 // policy_total) if policy_total else 100
    role_pass_rate = (lp * 100 // role_total) if role_total else 100

    failures = anchor_failures
    if failure_model == "anchors_plus_rates":
        if route_total and route_pass_rate != 100:
            failures += 1
        if policy_total and policy_pass_rate != 100:
            failures += 1
        if role_total and role_pass_rate != 100:
            failures += 1

    env_lines = [
        f"ROUTE_CHECKS_TOTAL={route_total}",
        f"ROUTE_CHECKS_PASSED={rp}",
        f"POLICY_CHECKS_TOTAL={policy_total}",
        f"POLICY_CHECKS_PASSED={pp}",
        f"ROLE_CHECKS_TOTAL={role_total}",
        f"ROLE_CHECKS_PASSED={lp}",
        f"ROUTE_PASS_RATE={route_pass_rate}",
        f"POLICY_PASS_RATE={policy_pass_rate}",
        f"ROLE_PASS_RATE={role_pass_rate}",
        f"ANCHOR_FAILURES={failures}",
    ]
    env_path.write_text("\n".join(env_lines) + "\n", encoding="utf-8")

    if failures:
        print(f"[run_ci_anchor_slice_checks] failures={failures} (see {log_path})", file=sys.stderr)
        return 1
    print(f"OK: slice={slice_key} routes {rp}/{route_total} policy {pp}/{policy_total} role {lp}/{role_total}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0].strip())
    ap.add_argument("--slice", required=True, help="slice key under slices:")
    ap.add_argument("--evidence-dir", required=True, type=Path, help="evidence directory (created if needed)")
    args = ap.parse_args()

    if not MANIFEST.is_file():
        print(f"ERROR: missing manifest {MANIFEST}", file=sys.stderr)
        return 1

    data = yaml.safe_load(MANIFEST.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or "slices" not in data:
        print("ERROR: manifest root must contain 'slices'", file=sys.stderr)
        return 1

    slices = data["slices"]
    if not isinstance(slices, dict) or args.slice not in slices:
        print(f"ERROR: unknown slice {args.slice!r}", file=sys.stderr)
        return 1

    block = slices[args.slice]
    if not isinstance(block, dict):
        print(f"ERROR: slice {args.slice!r} must be a mapping", file=sys.stderr)
        return 1

    try:
        routes_log_name, counts_env_name, header_lines, meta_path = _evidence_paths(block, args.slice)
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    ev = args.evidence_dir
    ev.mkdir(parents=True, exist_ok=True)
    log_path = ev / routes_log_name
    env_path = ev / counts_env_name
    meta_file = ev / meta_path if meta_path else None

    if block.get("community_branching"):
        return run_community_branching(block, args.slice, ev, log_path, env_path, header_lines, meta_file)

    checks = block.get("checks")
    if not isinstance(checks, list) or not checks:
        print(f"ERROR: slice {args.slice!r} must have 'checks' list", file=sys.stderr)
        return 1

    return run_flat_slice(block, args.slice, checks, ev, log_path, env_path, header_lines)


if __name__ == "__main__":
    raise SystemExit(main())
