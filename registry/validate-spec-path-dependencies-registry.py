#!/usr/bin/env python3
"""
Lightweight structural validation for registry/spec-path-dependencies.v1.yaml

Checks: YAML parse, required top-level keys, per-entry id/classification/target_location/
        migration_prerequisites, classification in enum, consumer path strings (shape +
        existence where unambiguous). Does not migrate docs, delete spec, or touch CI.

Exit 0 on success; stderr + exit 1 on first error batch.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path, PurePosixPath
from typing import Any, Mapping

try:
    import yaml
except ImportError:  # pragma: no cover
    print("ERROR: PyYAML required (pip install pyyaml)", file=sys.stderr)
    sys.exit(1)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_YAML = ROOT / "registry" / "spec-path-dependencies.v1.yaml"

REQUIRED_TOP = ("registry_version", "source_inventory", "classification_enum", "entries")
CONSUMER_GROUPS = frozenset({"scripts", "workflows", "docs_areas"})
CLASSIFICATIONS = frozenset({"A", "B", "C"})


def _bad_path(p: str) -> str | None:
    if not isinstance(p, str) or not p.strip():
        return "empty consumer path"
    if "\n" in p or "\r" in p:
        return "consumer path contains newline"
    if p.startswith("/") or p.startswith("\\"):
        return "consumer path must be repo-relative"
    parts = PurePosixPath(p).parts
    if ".." in parts:
        return "consumer path must not contain '..'"
    return None


def _consumer_exists(root: Path, p: str) -> str | None:
    """Return error string if path looks like a single file but missing."""
    err = _bad_path(p)
    if err:
        return err
    if "*" in p or "**" in p or p.endswith("/"):
        base = p.split("*", 1)[0].rstrip("/")
        if not base:
            return None
        d = root / base
        if not d.exists():
            return f"glob/dir prefix missing: {p!r} (expected {d} to exist)"
        return None
    rel = root / p
    if not rel.exists():
        return f"missing path: {p!r}"
    return None


def _spec_path_ok(root: Path, entry: Mapping[str, Any], idx: int) -> list[str]:
    errs: list[str] = []
    sid = entry.get("id", f"<entry {idx}>")
    if entry.get("primary_spec_paths"):
        if not isinstance(entry["primary_spec_paths"], list):
            errs.append(f"{sid}: primary_spec_paths must be a list")
        else:
            for sp in entry["primary_spec_paths"]:
                if not isinstance(sp, str) or not sp.startswith("docs/spec/"):
                    errs.append(f"{sid}: invalid primary_spec_paths item: {sp!r}")
                elif not (root / sp).exists():
                    errs.append(f"{sid}: primary_spec_paths file missing: {sp}")
        return errs

    sp = entry.get("spec_path")
    if sp is None:
        return errs
    if not isinstance(sp, str):
        errs.append(f"{sid}: spec_path must be str or null")
        return errs
    if entry.get("path_pattern"):
        if "docs/spec" not in sp:
            errs.append(f"{sid}: path_pattern spec_path should mention docs/spec: {sp!r}")
        return errs
    if sp.startswith("prefix:"):
        pref = sp[len("prefix:") :].rstrip("/")
        if not pref.startswith("docs/spec/"):
            errs.append(f"{sid}: prefix must be under docs/spec/: {sp!r}")
        elif not (root / pref).is_dir():
            errs.append(f"{sid}: prefix directory missing: {pref}")
        return errs
    if not sp.startswith("docs/spec/"):
        errs.append(f"{sid}: spec_path must start with docs/spec/ or be prefix:/pattern: {sp!r}")
    elif "*" not in sp and not (root / sp).exists():
        errs.append(f"{sid}: spec file missing (expected on disk): {sp}")
    return errs


def validate(data: Mapping[str, Any], root: Path) -> list[str]:
    errs: list[str] = []
    for k in REQUIRED_TOP:
        if k not in data:
            errs.append(f"missing top-level key: {k!r}")

    ce = data.get("classification_enum")
    if not isinstance(ce, dict):
        errs.append("classification_enum must be a mapping")
    else:
        for c in CLASSIFICATIONS:
            if c not in ce:
                errs.append(f"classification_enum missing key: {c!r}")

    entries = data.get("entries")
    if not isinstance(entries, list):
        errs.append("entries must be a list")
        return errs

    for i, entry in enumerate(entries):
        if not isinstance(entry, dict):
            errs.append(f"entries[{i}] must be a mapping")
            continue
        sid = entry.get("id")
        if not isinstance(sid, str) or not sid.strip():
            errs.append(f"entries[{i}]: missing non-empty id")
        cl = entry.get("classification")
        if cl not in CLASSIFICATIONS:
            errs.append(f"{sid or i}: classification must be one of A,B,C, got {cl!r}")

        if "target_location" not in entry or not isinstance(entry["target_location"], str):
            errs.append(f"{sid or i}: target_location required (non-empty str)")
        elif not entry["target_location"].strip():
            errs.append(f"{sid or i}: target_location must be non-empty")

        mp = entry.get("migration_prerequisites")
        if mp is None:
            errs.append(f"{sid or i}: migration_prerequisites key missing (use [] if none)")
        elif not isinstance(mp, list) or not all(isinstance(x, str) for x in mp):
            errs.append(f"{sid or i}: migration_prerequisites must be a list of strings")

        errs.extend(_spec_path_ok(root, entry, i))

        consumers = entry.get("consumers")
        extra_docs = entry.get("docs_areas")
        if consumers is not None and not isinstance(consumers, dict):
            errs.append(f"{sid or i}: consumers must be a mapping or omitted")
        elif isinstance(consumers, dict):
            for ck, cv in consumers.items():
                if ck not in CONSUMER_GROUPS:
                    errs.append(f"{sid or i}: unknown consumers key: {ck!r}")
                    continue
                if not isinstance(cv, list):
                    errs.append(f"{sid or i}: consumers.{ck} must be a list")
                    continue
                for p in cv:
                    if not isinstance(p, str):
                        errs.append(f"{sid or i}: consumers.{ck} item must be str")
                        continue
                    e2 = _consumer_exists(root, p)
                    if e2:
                        errs.append(f"{sid or i}: consumers.{ck}: {e2}")

        if isinstance(extra_docs, list):
            for p in extra_docs:
                if not isinstance(p, str):
                    errs.append(f"{sid or i}: docs_areas item must be str")
                    continue
                e2 = _consumer_exists(root, p)
                if e2:
                    errs.append(f"{sid or i}: docs_areas: {e2}")

    cidx = data.get("consumer_index")
    if cidx is not None:
        if not isinstance(cidx, list):
            errs.append("consumer_index must be a list")
        else:
            for j, row in enumerate(cidx):
                if not isinstance(row, dict):
                    errs.append(f"consumer_index[{j}] must be a mapping")
                    continue
                c = row.get("consumer")
                if not isinstance(c, str) or not c.strip():
                    errs.append(f"consumer_index[{j}]: missing consumer path")
                else:
                    e2 = _consumer_exists(root, c)
                    if e2:
                        errs.append(f"consumer_index[{j}] ({c}): {e2}")

    return errs


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0].strip())
    ap.add_argument(
        "yaml_path",
        nargs="?",
        default=str(DEFAULT_YAML),
        help=f"path to registry YAML (default: {DEFAULT_YAML})",
    )
    args = ap.parse_args()
    path = Path(args.yaml_path)
    if not path.is_file():
        print(f"ERROR: file not found: {path}", file=sys.stderr)
        return 1
    try:
        text = path.read_text(encoding="utf-8")
        data = yaml.safe_load(text)
    except yaml.YAMLError as e:
        print(f"ERROR: YAML parse failed: {e}", file=sys.stderr)
        return 1
    except OSError as e:
        print(f"ERROR: read failed: {e}", file=sys.stderr)
        return 1

    if not isinstance(data, dict):
        print("ERROR: root YAML value must be a mapping", file=sys.stderr)
        return 1

    errs = validate(data, ROOT)
    if errs:
        for e in errs:
            print(f"REGISTRY-STRUCT: {e}", file=sys.stderr)
        print(f"REGISTRY-STRUCT: {len(errs)} error(s)", file=sys.stderr)
        return 1
    print(f"OK: registry structural validation ({path.relative_to(ROOT)})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
