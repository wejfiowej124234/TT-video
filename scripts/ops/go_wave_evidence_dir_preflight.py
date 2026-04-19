#!/usr/bin/env python3
# B-308: wave / release-candidate evidence directory naming ↔ spec/15 附录〇 · evidence/README GO_YYYYMMDD 口径（机读预检 + 可选 scaffold）。
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Literal

ANCHOR = "15-APPENDIX-O-GO-WAVE-DIR-PREFLIGHT-V1"
IMPLEMENTATION_TT = "TT-B308-WAVE-EVIDENCE-GO-DIR-TEMPLATE-ALIGN-001"
MOTHER_TABLE = "B-308"

# 非日历 GO 包（模板 / 本地演练）；仍须在 evidence/ 下，不参与 GO_YYYYMMDD 机读命名。
_SPECIAL_EVIDENCE_DIR_NAMES = frozenset(
    {
        "GO_YYYYMMDD_template",
        "GO_test_local",
        "GO_placeholder",
    }
)

# evidence/README.md：正式过门目录 evidence/GO_YYYYMMDD/；波浪 / 专题可加后缀段。
_RE_GO_WAVE = re.compile(
    r"^GO_(?P<ymd>\d{8})(?:_(?P<suf>[A-Za-z0-9][A-Za-z0-9_.-]*))?$"
)
# 与仓内 GO_RC_20260414_IndexerReleaseProof 等一致：GO_RC_<YYYYMMDD>_<Slug>
_RE_GO_RC = re.compile(
    r"^GO_RC_(?P<ymd>\d{8})_(?P<suf>[A-Za-z0-9][A-Za-z0-9_-]*)$"
)


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def classify_basename(name: str) -> tuple[Literal["wave", "rc", "reject"], str]:
    m = _RE_GO_WAVE.fullmatch(name)
    if m:
        return "wave", m.group("ymd")
    m = _RE_GO_RC.fullmatch(name)
    if m:
        return "rc", m.group("ymd")
    return "reject", ""


def _validate_manifest_skeleton(path: Path) -> tuple[bool, str]:
    mf = path / "manifest.json"
    if not mf.is_file():
        return True, "no manifest.json (optional)"
    try:
        data = json.loads(mf.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"manifest.json: invalid JSON ({e})"
    if not isinstance(data, dict):
        return False, "manifest.json: root must be an object"
    for key in ("gate", "date", "artifacts", "sign_off"):
        if key not in data:
            return False, f"manifest.json: missing key {key!r} (see evidence/GO_YYYYMMDD_template)"
    if not isinstance(data.get("artifacts"), list):
        return False, "manifest.json: artifacts must be a list"
    if data.get("gate") == "Gate-X" and data.get("date") == "YYYY-MM-DD":
        return False, "manifest.json: still template placeholders (gate/date)"
    return True, ""


def validate_evidence_go_dir(root: Path, *, check_manifest: bool) -> tuple[bool, str]:
    if not root.is_dir():
        return False, f"not a directory: {root}"
    repo = repo_root_from_here()
    evidence_root = (repo / "evidence").resolve()
    try:
        resolved = root.resolve()
    except OSError as e:
        return False, f"resolve failed: {e}"
    if evidence_root not in resolved.parents and resolved != evidence_root:
        return False, f"path must be under {evidence_root} (got {resolved})"
    if resolved.name in _SPECIAL_EVIDENCE_DIR_NAMES:
        if check_manifest:
            print(
                "go_wave_evidence_dir_preflight: note: --manifest skipped for special template/local dir",
                file=sys.stderr,
            )
        return True, f"OK ({ANCHOR}; special; {IMPLEMENTATION_TT})"
    kind, _ymd = classify_basename(resolved.name)
    if kind == "reject":
        return (
            False,
            "basename must match GO_YYYYMMDD or GO_YYYYMMDD_<slug> or "
            "GO_RC_YYYYMMDD_<slug> (see docs/spec/15 evidence/README GO_ section)",
        )
    if check_manifest:
        ok, msg = _validate_manifest_skeleton(resolved)
        if not ok:
            return False, msg
    return True, f"OK ({ANCHOR}; {kind}; {IMPLEMENTATION_TT})"


def _resolve_user_path(raw: Path) -> Path:
    """Prefer repo-relative path when cwd is not repo root."""
    p = raw.expanduser()
    if p.is_absolute():
        return p
    repo = repo_root_from_here()
    cand = (repo / p).resolve()
    if cand.exists():
        return cand
    return p.resolve()


def cmd_validate(args: argparse.Namespace) -> int:
    target = _resolve_user_path(Path(args.path))
    ok, msg = validate_evidence_go_dir(target, check_manifest=bool(args.manifest))
    if not ok:
        print(f"go_wave_evidence_dir_preflight: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"go_wave_evidence_dir_preflight: {msg}", file=sys.stderr)
    return 0


def cmd_init(args: argparse.Namespace) -> int:
    repo = repo_root_from_here()
    evidence = repo / "evidence"
    name = args.basename.strip().strip("/").strip("\\")
    if "/" in name or "\\" in name or name != Path(name).name:
        print("go_wave_evidence_dir_preflight: FAIL: basename must be a single path segment", file=sys.stderr)
        return 1
    kind, _ = classify_basename(name)
    if kind == "reject":
        print(
            "go_wave_evidence_dir_preflight: FAIL: basename does not match GO_ / GO_RC_ naming rules",
            file=sys.stderr,
        )
        return 1
    dest = evidence / name
    if dest.exists():
        if args.force and dest.is_dir():
            shutil.rmtree(dest)
        else:
            print(f"go_wave_evidence_dir_preflight: FAIL: already exists: {dest}", file=sys.stderr)
            return 1
    template = evidence / "GO_YYYYMMDD_template"
    if not template.is_dir():
        print(f"go_wave_evidence_dir_preflight: FAIL: missing template {template}", file=sys.stderr)
        return 1
    shutil.copytree(template, dest)
    print(f"go_wave_evidence_dir_preflight: init OK -> {dest}", file=sys.stderr)
    return 0


def cmd_self_test(_: argparse.Namespace) -> int:
    repo = repo_root_from_here()
    assert classify_basename("GO_20260328") == ("wave", "20260328")
    assert classify_basename("GO_20260407_ESCROW") == ("wave", "20260407")
    assert classify_basename("GO_RC_20260414_IndexerReleaseProof") == ("rc", "20260414")
    assert classify_basename("GO_placeholder")[0] == "reject"
    assert classify_basename("GO_20260")[0] == "reject"

    ok, msg = validate_evidence_go_dir(repo / "evidence" / "GO_20260328", check_manifest=False)
    assert ok, msg

    ok2, msg2 = validate_evidence_go_dir(
        repo / "evidence" / "GO_RC_20260414_IndexerReleaseProof", check_manifest=False
    )
    assert ok2, msg2

    ok4, msg4 = validate_evidence_go_dir(repo / "evidence" / "GO_20260409", check_manifest=True)
    assert ok4, msg4

    import tempfile

    with tempfile.TemporaryDirectory() as td:
        bad = Path(td) / "not_under_evidence" / "GO_20260101"
        bad.parent.mkdir(parents=True)
        bad.mkdir()
        ok3, _ = validate_evidence_go_dir(bad, check_manifest=False)
        assert not ok3

    print("go_wave_evidence_dir_preflight self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=(
            "B-308: validate evidence/GO_* directory naming for 15 appendix O / "
            "evidence/README GO_YYYYMMDD wave layout."
        )
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    v = sub.add_parser("validate", help="check directory path and optional manifest.json")
    v.add_argument("path", type=Path, help="e.g. evidence/GO_20260328")
    v.add_argument(
        "--manifest",
        action="store_true",
        help="if manifest.json exists, require non-placeholder gate/date and required keys",
    )
    v.set_defaults(func=cmd_validate)

    i = sub.add_parser(
        "init",
        help="copy evidence/GO_YYYYMMDD_template/ into evidence/<basename>/ (basename must pass naming rules)",
    )
    i.add_argument("basename", help="e.g. GO_20260420 or GO_20260420_P1C_Closeout")
    i.add_argument(
        "--force",
        action="store_true",
        help="remove existing target directory before copy",
    )
    i.set_defaults(func=cmd_init)

    st = sub.add_parser("self-test", help="assert naming rules + validate committed fixtures")
    st.set_defaults(func=cmd_self_test)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
