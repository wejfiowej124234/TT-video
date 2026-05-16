#!/usr/bin/env python3
"""Verify dist/ investor zip or folder layout (--omit-markdown handoff)."""
from __future__ import annotations

import argparse
import json
import os
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "tools"))
import investor_handoff_layout as ihr  # noqa: E402
ANCHORS = ROOT / "registry" / "fundraising-external-numeric-anchors.v1.json"
LP_BANNED_IN_START = ("monorepo", "连招", "反杀", " SSOT")


def _release() -> str:
    data = json.loads(ANCHORS.read_text(encoding="utf-8"))
    r = data.get("release")
    if not r:
        raise SystemExit(f"missing release in {ANCHORS}")
    return str(r)


def _strip_zip_prefix(names: list[str]) -> list[str]:
    files = [n.replace("\\", "/") for n in names if n and not n.endswith("/")]
    if not files:
        return []
    top = files[0].split("/")[0]
    if top and all(f == top or f.startswith(top + "/") for f in files):
        out: list[str] = []
        for f in files:
            if f == top:
                continue
            rest = f[len(top) + 1 :]
            if rest:
                out.append(rest)
        return out
    return [n.lstrip("/") for n in files]


def _check_tree(names: list[str], errors: list[str]) -> None:
    norm = [n.replace("\\", "/").lstrip("/") for n in names]
    root_txt = "00-START-HERE.txt"
    if root_txt not in norm:
        errors.append(f"missing zip-root {root_txt}")
    spd_start = "signed-pdfs/00-START-HERE.txt"
    if spd_start not in norm:
        errors.append(f"missing {spd_start}")
    handoff_pdfs = [n for n in norm if n.startswith("signed-pdfs/") and n.endswith(".pdf")]
    if len(handoff_pdfs) < 10:
        errors.append(f"expected >=10 handoff PDFs under signed-pdfs/, found {len(handoff_pdfs)}")
    for n in norm:
        if n.startswith("signed-pdfs/") and n.endswith(".md"):
            errors.append(f"unexpected .md in handoff tree: {n}")
        if "/internal/" in n or "docs/spec" in n:
            errors.append(f"repo leak path in zip: {n}")
    demo_files = [n for n in norm if n.startswith("signed-pdfs/demo/")]
    for d in demo_files:
        base = d.split("/")[-1]
        if base.startswith(".") or base in ("README.md", "SCREEN-RECORDING-BRIEF.txt"):
            errors.append(f"demo/ allowlist violation: {d}")
        if base.endswith(".mp4") and not base.startswith("TravelTrust-Product-Demo-"):
            errors.append(f"unexpected demo mp4 name: {d}")


def _check_demo_mp4_sizes_zip(z: zipfile.ZipFile, names: list[str], prefix: str, errors: list[str]) -> None:
    if os.environ.get("FUNDRAISING_LP_ALLOW_PLACEHOLDER_DEMO") == "1":
        return
    for n in names:
        if not n.startswith("signed-pdfs/demo/") or not n.endswith(".mp4"):
            continue
        zi = z.getinfo(prefix + n)
        if zi.file_size < ihr.HANDOFF_DEMO_MP4_MIN_FINAL_BYTES:
            errors.append(
                f"{n}: mp4 size {zi.file_size} B < {ihr.HANDOFF_DEMO_MP4_MIN_FINAL_BYTES} "
                "(likely placeholder; omit from zip or set FUNDRAISING_LP_ALLOW_PLACEHOLDER_DEMO=1 for internal only)"
            )

def _read_zip_member(z: zipfile.ZipFile, name: str) -> str | None:
    try:
        return z.read(name).decode("utf-8", errors="replace")
    except KeyError:
        return None


def verify_zip(path: Path, errors: list[str]) -> None:
    with zipfile.ZipFile(path) as z:
        raw = z.namelist()
        names = _strip_zip_prefix(raw)
        _check_tree(names, errors)
        prefix = ""
        if raw and raw[0].endswith("/"):
            prefix = raw[0].rstrip("/") + "/"
        _check_demo_mp4_sizes_zip(z, names, prefix, errors)
        for key in ("00-START-HERE.txt", "signed-pdfs/00-START-HERE.txt"):
            body = _read_zip_member(z, prefix + key)
            if body is None:
                continue
            for term in LP_BANNED_IN_START:
                if term in body:
                    errors.append(f"{key}: contains banned LP term {term!r}")


def verify_dir(path: Path, errors: list[str]) -> None:
    names: list[str] = []
    for p in path.rglob("*"):
        if p.is_file():
            names.append(str(p.relative_to(path)).replace("\\", "/"))
    _check_tree(names, errors)
    for key in ("00-START-HERE.txt", "signed-pdfs/00-START-HERE.txt"):
        fp = path / Path(key)
        if fp.is_file():
            body = fp.read_text(encoding="utf-8")
            for term in LP_BANNED_IN_START:
                if term in body:
                    errors.append(f"{key}: contains banned LP term {term!r}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Verify investor materials zip/folder layout")
    ap.add_argument("--release", help="override registry release")
    ap.add_argument("--zip", type=Path, help="path to zip file")
    ap.add_argument("--dir", type=Path, help="path to extracted folder")
    args = ap.parse_args()
    release = args.release or _release()
    errors: list[str] = []
    if args.zip:
        if not args.zip.is_file():
            errors.append(f"zip not found: {args.zip}")
        else:
            verify_zip(args.zip, errors)
    elif args.dir:
        if not args.dir.is_dir():
            errors.append(f"dir not found: {args.dir}")
        else:
            verify_dir(args.dir, errors)
    else:
        base = ROOT / "dist" / f"TravelTrust-Investor-Materials-v{release}"
        zpath = base.with_suffix(".zip")
        if zpath.is_file():
            verify_zip(zpath, errors)
        elif base.is_dir():
            verify_dir(base, errors)
        else:
            errors.append(f"no zip or dir at {zpath} or {base}")
    if errors:
        print(f"FAIL: investor zip layout ({len(errors)} issue(s))", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1
    print("OK: investor zip/folder layout")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
