#!/usr/bin/env python3
"""Strict LP receiver-surface audit (phase 1). Fails on leaks in shipped PDF/txt/zip."""
from __future__ import annotations

import json
import re
import sys
import zipfile
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXPORT = ROOT / "docs/fundraising/external/export-ready"
ANCHORS = ROOT / "registry/fundraising-external-numeric-anchors.v1.json"

BANNED = [
    (re.compile(r"monorepo", re.I), "monorepo"),
    (re.compile(r"连招"), "连招"),
    (re.compile(r"反杀"), "反杀"),
    (re.compile(r"(?<![\w/])\S+\.md\b"), "bare .md filename"),
    (re.compile(r"\binternal/", re.I), "internal/"),
    (re.compile(r"docs/spec", re.I), "docs/spec"),
    (re.compile(r"scripts/", re.I), "scripts/"),
    (re.compile(r"PACK-RELEASE", re.I), "PACK-RELEASE maintainer doc id"),
    (re.compile(r"START-HERE-SSOT", re.I), "START-HERE-SSOT maintainer id"),
]
DRAFT_MARKERS = ("TODO", "WIP", "待补", "placeholder", "TBD", "FIXME")


def _release() -> str:
    return str(json.loads(ANCHORS.read_text(encoding="utf-8"))["release"])


def _pdf_text_from_reader(reader) -> str:
    return "".join(page.extract_text() or "" for page in reader.pages)


def _pdf_text(pdf: Path) -> str | None:
    try:
        from pypdf import PdfReader
    except ImportError:
        try:
            from PyPDF2 import PdfReader
        except ImportError:
            return None
    try:
        return _pdf_text_from_reader(PdfReader(str(pdf)))
    except OSError:
        return None


def _pdf_text_bytes(data: bytes) -> str | None:
    try:
        from pypdf import PdfReader
    except ImportError:
        try:
            from PyPDF2 import PdfReader
        except ImportError:
            return None
    try:
        return _pdf_text_from_reader(PdfReader(BytesIO(data)))
    except OSError:
        return None


def _scan_text(rel: str, text: str, errors: list[str]) -> None:
    for pat, label in BANNED:
        if pat.search(text):
            errors.append(f"{rel}: LP surface leak ({label})")
    for marker in DRAFT_MARKERS:
        if marker in text:
            errors.append(f"{rel}: draft marker {marker!r}")
    if "04-PitchDeck" in rel and rel.endswith("-CN.pdf"):
        if re.search(r"[①②③④⑤]", text):
            errors.append(f"{rel}: protocol legend must use 1-5 not circled numerals")


def audit_export_ready(errors: list[str]) -> None:
    if not EXPORT.is_dir():
        errors.append("missing export-ready/")
        return
    start = EXPORT / "00-START-HERE.txt"
    if not start.is_file():
        errors.append("missing export-ready/00-START-HERE.txt")
    else:
        body = start.read_text(encoding="utf-8")
        main = body.split("--- IR only", 1)[0]
        _scan_text(start.relative_to(ROOT).as_posix() + " (main)", main, errors)
        if "General information only" not in body and "一般性信息" not in body:
            errors.append(f"{start.relative_to(ROOT)}: missing disclaimer block")
    for pptx in sorted(EXPORT.glob("*.pptx")):
        errors.append(f"{pptx.relative_to(ROOT)}: export-ready must not contain PPTX")
    for ic in sorted(EXPORT.glob("04-IC-Memo-*.pdf")):
        errors.append(
            f"{ic.relative_to(ROOT)}: slot 04 is PitchDeck CN|EN only (remove 04-IC-Memo from export-ready)"
        )
    for pdf in sorted(EXPORT.glob("*.pdf")):
        text = _pdf_text(pdf)
        if text is None:
            continue
        _scan_text(pdf.relative_to(ROOT).as_posix(), text, errors)


def _zip_member_paths(names: list[str]) -> tuple[str, list[str]]:
    """Return (path_prefix, normalized member paths without outer folder)."""
    files = [n.replace("\\", "/") for n in names if n and not n.endswith("/")]
    if not files:
        return "", []
    top = files[0].split("/")[0]
    if top and all(f == top or f.startswith(top + "/") for f in files):
        norm: list[str] = []
        for f in files:
            if f == top:
                continue
            rest = f[len(top) + 1 :]
            if rest:
                norm.append(rest)
        return top + "/", norm
    return "", [n.lstrip("/") for n in files]


def audit_zip(errors: list[str], release: str) -> None:
    zp = ROOT / "dist" / f"TravelTrust-Investor-Materials-v{release}.zip"
    if not zp.is_file():
        errors.append(f"missing {zp.relative_to(ROOT)}")
        return
    with zipfile.ZipFile(zp) as z:
        raw = z.namelist()
        prefix, names = _zip_member_paths(raw)
        if not any(n.endswith("00-START-HERE.txt") for n in names):
            errors.append("zip: missing 00-START-HERE.txt")
        if not any(n == "signed-pdfs/00-START-HERE.txt" for n in names):
            errors.append("zip: missing signed-pdfs/00-START-HERE.txt")
        for n in names:
            if n.endswith(".mp4"):
                zi = z.getinfo(prefix + n)
                if zi.file_size < 800_000:
                    errors.append(f"zip: placeholder-sized demo {n} ({zi.file_size} B)")
        for n in names:
            if n.endswith(".pptx"):
                errors.append(f"zip: LP pack must not contain PPTX ({n})")
            if "/_editable/" in n or "04-IC-Memo" in n:
                errors.append(f"zip: non-LP path in pack ({n})")
        for n in names:
            if not n.startswith("signed-pdfs/") or not n.endswith(".pdf"):
                continue
            data = z.read(prefix + n)
            text = _pdf_text_bytes(data)
            if text is None:
                continue
            _scan_text(f"zip:{n}", text, errors)
        for key in ("00-START-HERE.txt", "signed-pdfs/00-START-HERE.txt"):
            if key not in names:
                continue
            body = z.read(prefix + key).decode("utf-8", errors="replace")
            main = body.split("--- IR only", 1)[0]
            _scan_text(f"zip:{key} (main)", main, errors)


def main() -> int:
    errors: list[str] = []
    release = _release()
    audit_export_ready(errors)
    audit_zip(errors, release)
    if errors:
        print(f"FAIL: LP receiver strict audit ({len(errors)} issue(s))", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1
    print("OK: LP receiver strict audit (export-ready PDF/txt + zip surface)")
    print(
        "HUMAN still required: Legal sign-off | final demo mp4 | distribution log rows | Pack A/B (phase 2)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
