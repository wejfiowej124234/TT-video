#!/usr/bin/env python3
"""
Governance for docs/fundraising/: internal DC headers + investor-facing external cleanliness.

Investor-facing: docs/fundraising/external/**/*.md
  - No repo / registry / spec / internal-path leakage; no markdown links to internal/board/data-room/legal;
  - Layering frozen per docs/fundraising/internal/34-融资分层冻结与单向流转.md
  - CN phrase scan (CN + export-ready English filenames still use CN scan for root external);
  - EN phrase scan for external/en/**.

Maintainer paths: other docs/fundraising/**/*.md — full document-control table.

Fail-closed when --enforce or FUNDRAISING_IR_GATE_ENFORCE=1.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
_TOOLS = ROOT / "scripts" / "tools"
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))
import investor_handoff_layout as ihr  # noqa: E402

FUNDR = ROOT / "docs" / "fundraising"
HEAD_SCAN_LINES = 140
INVESTOR_HEAD_LINES = 55

REQUIRED_KEYS = (
    r"\|\s*\*\*Owner\*\*\s*\|",
    r"\|\s*\*\*Version\*\*\s*\|",
    r"\|\s*\*\*Status\*\*\s*\|",
    r"\|\s*\*\*Classification\*\*\s*\|",
    r"\|\s*\*\*Last Updated\*\*\s*\|",
    r"\|\s*\*\*SSOT\*\*\s*\|",
)

VERSION_CELL_RE = re.compile(
    r"\|\s*\*\*Version\*\*\s*\|\s*([^|]+?)\s*\|",
    re.MULTILINE,
)

RELEASE_BANNER_RE = re.compile(
    r"(?:版本|Release) \*\*([\d.]+)\*\*",
)

PCT_RE = re.compile(r"\d+(?:\.\d+)?%")

PROHIBITED_CN = (
    "承诺保本",
    "保证收益",
    "稳赚不赔",
    "无风险投资",
    "保本保息",
    "年化收益保证",
    "承诺无风险",
)

PROHIBITED_EN = (
    "guaranteed return",
    "guaranteed returns",
    "risk-free",
    "risk free",
    "no-risk investment",
    "can't lose",
    "cant lose",
)

INVESTOR_BANNED_SUBSTRINGS = (
    "docs/spec",
    "docs/fundraising/internal",
    "registry/",
    "scripts/gates",
    "scripts/tools",
    "`scripts/",
    "SSOT（",
    "**SSOT**",
    "| **SSOT** |",
    "法务签核",
    "资料室索引",
    "product-manager",
    "CONTRIBUTING",
    "AGENTS.md",
    ".cursor",
    "TT-96",
    "../internal",
    "/internal/",
    "机读闸",
    "check-fundraising-ir-governance",
    "fundraising-external-cn-en-pairs",
    "fundraising-external-numeric-anchors",
    "governance-doc-linkage",
    "`docs/",
    "**文档控制（IR）**",
    "| **Owner** |",
    "**Classification** |",
)

NUMERIC_REGISTRY = ROOT / "registry" / "fundraising-external-numeric-anchors.v1.json"

# Investor markdown must not link to non-investor layers (see internal/34).
EXTERNAL_FORBIDDEN_LINK_SNIPPETS = (
    "/internal/",
    "../internal",
    "/board/",
    "../board",
    "/data-room/",
    "../data-room",
    "/legal/",
    "../legal",
)


def _external_forbidden_link_errors(body: str, rel: Path) -> list[str]:
    errs: list[str] = []
    external_root = (FUNDR / "external").resolve()
    for m in re.finditer(r"\]\(([^)]+)\)", body):
        raw = m.group(1).strip()
        if not raw or raw.startswith("#") or raw.startswith("mailto:"):
            continue
        url = raw.split()[0].split('"')[0].strip()
        low = url.lower()
        for snip in EXTERNAL_FORBIDDEN_LINK_SNIPPETS:
            if snip in low:
                errs.append(
                    f"{rel.as_posix()}: cross-layer link ({snip!r}): {url!r}"
                )
                break
        else:
            if re.search(r"(?:^|/)\.\./\.\./", url):
                errs.append(
                    f"{rel.as_posix()}: link escapes external tree: {url!r}"
                )
                continue
            if url.startswith("../") or url.startswith("..\\"):
                try:
                    (rel.parent / url).resolve().relative_to(external_root)
                except ValueError:
                    errs.append(
                        f"{rel.as_posix()}: link leaves external/ (LP narrative must not "
                        f"point to maintainer docs): {url!r}"
                    )
    return errs


def _enforce() -> bool:
    v = os.environ.get("FUNDRAISING_IR_GATE_ENFORCE", "").strip().lower()
    if v in ("1", "true", "yes"):
        return True
    return "--enforce" in sys.argv


def _scan_head(text: str, n: int) -> str:
    return "\n".join(text.splitlines()[:n])


def _is_investor_external(rel: Path) -> bool:
    return rel.as_posix().replace("\\", "/").startswith("docs/fundraising/external/")


def _investor_en_compliance_lane(rel: Path) -> bool:
    p = rel.as_posix().replace("\\", "/")
    return "/external/en/" in p or "/export-ready/" in p


def _check_dc(text: str, rel: Path) -> list[str]:
    head = _scan_head(text, HEAD_SCAN_LINES)
    missing = []
    for pat in REQUIRED_KEYS:
        if not re.search(pat, head):
            missing.append(pat.strip("\\").replace("\\s*", " ").replace("\\|", "|"))
    return missing


def _extract_investor_release(text: str) -> str | None:
    head = _scan_head(text, INVESTOR_HEAD_LINES)
    m = RELEASE_BANNER_RE.search(head)
    return m.group(1).strip() if m else None


def _investor_leaks(text: str) -> list[str]:
    tl = text.lower()
    hits: list[str] = []
    for s in INVESTOR_BANNED_SUBSTRINGS:
        if s.isascii():
            if s.lower() in tl:
                hits.append(s)
        else:
            if s in text:
                hits.append(s)
    return sorted(set(hits))


def _prohibited_hit_negated(text: str, start: int) -> bool:
    if start > 0 and text[start - 1] in ("无", "不", "非", "勿", "莫", "未"):
        return True
    if start >= 2 and text[start - 2 : start] in ("不得", "没有", "并未", "不会", "禁止", "避免"):
        return True
    if start >= 3 and text[start - 3 : start] in ("不允许", "不构成", "不承诺"):
        return True
    return False


def _prohibited_hit_negated_en(text: str, start: int) -> bool:
    slab = text[max(0, start - 12) : start].lower()
    return any(
        slab.endswith(x) for x in ("no ", "not ", "without ", "isn't ", "aren't ", "never ")
    )


def _check_prohibited_cn(path: Path, text: str) -> list[str]:
    hits: list[str] = []
    for phrase in PROHIBITED_CN:
        idx = 0
        while True:
            i = text.find(phrase, idx)
            if i == -1:
                break
            if not _prohibited_hit_negated(text, i):
                hits.append(f"{phrase} (in {path.relative_to(ROOT).as_posix()})")
                break
            idx = i + len(phrase)
    return hits


def _check_prohibited_en(path: Path, text: str) -> list[str]:
    tl = text.lower()
    hits: list[str] = []
    for phrase in PROHIBITED_EN:
        pl = phrase.lower()
        idx = 0
        while True:
            i = tl.find(pl, idx)
            if i == -1:
                break
            if not _prohibited_hit_negated_en(text, i):
                hits.append(f"{phrase} (in {path.relative_to(ROOT).as_posix()})")
                break
            idx = i + len(phrase)
    return hits


def _load_cn_en_pair_paths() -> list[tuple[Path, Path]]:
    reg = ROOT / "registry" / "fundraising-external-cn-en-pairs.v1.json"
    if not reg.is_file():
        return []
    data = json.loads(reg.read_text(encoding="utf-8"))
    pairs: list[tuple[Path, Path]] = []
    for item in data.get("pairs", []):
        cn = item.get("cn")
        en = item.get("en")
        if isinstance(cn, str) and isinstance(en, str):
            pairs.append((FUNDR / cn.replace("\\", "/"), FUNDR / en.replace("\\", "/")))
    return pairs


def _check_cn_en_release_pairs(errors: list[str], registry_release: str) -> None:
    try:
        pairs = _load_cn_en_pair_paths()
    except json.JSONDecodeError as exc:
        errors.append(f"registry/fundraising-external-cn-en-pairs.v1.json: invalid JSON ({exc})")
        return
    if not pairs:
        errors.append("missing or empty CN/EN pair registry")
        return
    for cn, en in pairs:
        if not cn.is_file():
            errors.append(f"CN/EN pair: missing {cn.as_posix()}")
            continue
        if not en.is_file():
            errors.append(f"CN/EN pair: missing {en.as_posix()}")
            continue
        cn_rel = cn.relative_to(ROOT)
        en_rel = en.relative_to(ROOT)
        body_cn = cn.read_text(encoding="utf-8")
        body_en = en.read_text(encoding="utf-8")
        r_cn = _extract_investor_release(body_cn)
        r_en = _extract_investor_release(body_en)
        if not r_cn:
            errors.append(
                f"{cn_rel.as_posix()}: missing investor banner 版本 **X** / Release **X** "
                f"(first {INVESTOR_HEAD_LINES} lines)"
            )
        if not r_en:
            errors.append(
                f"{en_rel.as_posix()}: missing investor banner 版本 **X** / Release **X** "
                f"(first {INVESTOR_HEAD_LINES} lines)"
            )
        if r_cn and r_en and r_cn != r_en:
            errors.append(
                f"CN/EN Release mismatch: {cn_rel.as_posix()} ({r_cn!r}) vs {en_rel.as_posix()} ({r_en!r})"
            )
        if r_cn and r_cn != registry_release:
            errors.append(
                f"{cn_rel.as_posix()}: Release {r_cn!r} != numeric-anchors registry release {registry_release!r}"
            )
        if r_en and r_en != registry_release:
            errors.append(
                f"{en_rel.as_posix()}: Release {r_en!r} != numeric-anchors registry release {registry_release!r}"
            )


def _check_numeric_anchors(errors: list[str]) -> None:
    if not NUMERIC_REGISTRY.is_file():
        errors.append("missing registry/fundraising-external-numeric-anchors.v1.json")
        return
    try:
        data = json.loads(NUMERIC_REGISTRY.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"fundraising-external-numeric-anchors.v1.json: invalid JSON ({exc})")
        return

    allow = data.get("percentage_allowlists") or {}
    if not isinstance(allow, dict):
        errors.append("numeric anchors: percentage_allowlists must be an object")
        return

    for rel_str, allowed in allow.items():
        path = ROOT / rel_str.replace("\\", "/")
        if not path.is_file():
            errors.append(f"numeric anchors: listed file missing {rel_str}")
            continue
        if not isinstance(allowed, list):
            errors.append(f"numeric anchors: allowlist for {rel_str} must be a list")
            continue
        body = path.read_text(encoding="utf-8")
        found = set(PCT_RE.findall(body))
        allowed_set = set(str(x) for x in allowed)
        for pct in found:
            if pct not in allowed_set:
                errors.append(
                    f"{rel_str}: percentage {pct!r} not in allowlist (maintain registry or edit copy)"
                )

    for block in data.get("required_snippets") or []:
        if not isinstance(block, dict):
            continue
        need = block.get("each_path_must_contain_all") or []
        paths = block.get("paths") or []
        if not isinstance(need, list) or not isinstance(paths, list):
            continue
        for rel_str in paths:
            path = ROOT / rel_str.replace("\\", "/")
            if not path.is_file():
                errors.append(f"required_snippets: missing {rel_str}")
                continue
            body = path.read_text(encoding="utf-8")
            for snippet in need:
                if not isinstance(snippet, str) or snippet not in body:
                    errors.append(
                        f"{rel_str}: required snippet missing {snippet!r}"
                    )


def _registry_release_value() -> str:
    if not NUMERIC_REGISTRY.is_file():
        return ""
    try:
        data = json.loads(NUMERIC_REGISTRY.read_text(encoding="utf-8"))
        return str(data.get("release", ""))
    except json.JSONDecodeError:
        return ""


def _check_export_ready_demo_allowlist(errors: list[str]) -> None:
    demo = FUNDR / "external" / "export-ready" / "demo"
    if not demo.is_dir():
        return
    release = _registry_release_value()
    if not release:
        return
    allowed = ihr.handoff_demo_repo_allowlist(release)
    for child in demo.iterdir():
        if child.name.startswith("."):
            continue
        if child.name not in allowed:
            errors.append(
                f"{child.relative_to(ROOT)}: export-ready/demo/ allowlist violation "
                f"(allowed {sorted(allowed)}); remove or run investor_handoff_layout.prune_handoff_demo_to_allowlist"
            )
    if os.environ.get("FUNDRAISING_LP_ALLOW_PLACEHOLDER_DEMO") == "1":
        return
    mp4 = demo / f"TravelTrust-Product-Demo-v{release}.mp4"
    reason = ihr.demo_mp4_placeholder_reason(mp4)
    if reason:
        errors.append(f"{mp4.relative_to(ROOT)}: {reason}")


def _check_cn_pitch_pdf_text_layer(errors: list[str]) -> None:
    release = _registry_release_value()
    if not release:
        return
    pdf = FUNDR / "external" / "export-ready" / f"04-PitchDeck-v{release}-CN.pdf"
    if not pdf.is_file():
        return
    try:
        from pypdf import PdfReader
    except ImportError:
        try:
            from PyPDF2 import PdfReader
        except ImportError:
            return
    try:
        text = "".join(page.extract_text() or "" for page in PdfReader(str(pdf)).pages)
    except OSError as e:
        errors.append(f"{pdf.relative_to(ROOT)}: cannot read PDF ({e})")
        return
    for needle in ("托管", "FeeRouter", "治理"):
        if needle not in text:
            errors.append(
                f"{pdf.relative_to(ROOT)}: CN pitch PDF text extract missing {needle!r} "
                "(rebuild build-investor-pitch-deck.py; verify LibreOffice PDF export)"
            )


def _pdf_extract_text(pdf: Path) -> str | None:
    try:
        from pypdf import PdfReader
    except ImportError:
        try:
            from PyPDF2 import PdfReader
        except ImportError:
            return None
    try:
        return "".join(page.extract_text() or "" for page in PdfReader(str(pdf)).pages)
    except OSError:
        return None


def _check_export_ready_lp_surface(errors: list[str]) -> None:
    """LP-facing export-ready PDFs + 00-START-HERE.txt — no regressed IR jargon."""
    base = FUNDR / "external" / "export-ready"
    if not base.is_dir():
        return
    release = _registry_release_value()

    start = base / "00-START-HERE.txt"
    if start.is_file():
        body = start.read_text(encoding="utf-8")
        lp_main = body.split("--- IR only", 1)[0]
        for term in ("monorepo", "连招", "反杀", " SSOT", "SSOT（"):
            if term in lp_main:
                errors.append(
                    f"{start.relative_to(ROOT)}: LP main path must not contain {term!r} "
                    "(regenerate via build-investor-ir-pdf-pack.py / build-investor-pitch-deck.py)"
                )
        for term in ("连招", "Partner combo"):
            if term in body:
                errors.append(
                    f"{start.relative_to(ROOT)}: use Partner 深问顺序 / deep-dive order in IR block "
                    f"(found {term!r}; regenerate handoff txt)"
                )

    pdf_banned = (
        (re.compile(r"(?<![\w/])\S+\.md\b"), "bare .md filename"),
        (re.compile(r"monorepo", re.I), "monorepo"),
        (re.compile(r"连招"), "连招"),
        (re.compile(r"反杀"), "反杀"),
        (re.compile(r"combo navigation", re.I), "combo navigation"),
    )
    for pdf in sorted(base.glob("*.pdf")):
        if pdf.name.startswith("00-"):
            continue
        text = _pdf_extract_text(pdf)
        if text is None:
            continue
        rel = pdf.relative_to(ROOT)
        for pat, label in pdf_banned:
            if pat.search(text):
                errors.append(f"{rel}: LP PDF surface contains {label!r}")
        if release and pdf.name == f"04-PitchDeck-v{release}-CN.pdf":
            if re.search(r"[①②③④⑤]", text):
                errors.append(
                    f"{rel}: protocol stack legend must use 1–5 Arabic numerals, not circled numbers"
                )


def _check_export_ready_handoff_layout(errors: list[str]) -> None:
    base = FUNDR / "external" / "export-ready"
    if not base.is_dir():
        return
    for p in base.iterdir():
        if p.name.startswith("."):
            continue
        if p.is_dir():
            if ihr.export_ready_subdirectory_allowed(p.name):
                continue
            errors.append(
                f"{p.relative_to(ROOT)}: export-ready allows only demo/ as subdirectory; remove {p.name!r}"
            )
            continue
        if p.suffix.lower() == ".pptx":
            errors.append(
                f"{p.relative_to(ROOT)}: PPTX not allowed in export-ready (use internal/deck-editable/)"
            )
            continue
        if p.name.startswith("04-IC-Memo-"):
            errors.append(
                f"{p.relative_to(ROOT)}: 04-IC-Memo not shipped in export-ready (slot 04 = PitchDeck CN|EN PDF only)"
            )
            continue
        if ihr.export_ready_forbidden_legacy_name(p.name):
            errors.append(
                f"{p.relative_to(ROOT)}: forbidden legacy filename {p.name!r} "
                "(use numbered 01–08 PDF/PPTX only; run build-investor-* scripts)"
            )
            continue
        if not ihr.export_ready_root_filename_allowed(p.name):
            errors.append(
                f"{p.relative_to(ROOT)}: unexpected export-ready root file {p.name!r} "
                "(allowed: README.md, 00-START-HERE.txt, 01–08 PDF at root; 04 = 04-PitchDeck CN|EN only)"
            )

    handoff_like = [
        p
        for p in base.iterdir()
        if p.is_file()
        and p.suffix.lower() == ".pdf"
        and len(p.name) >= 2
        and p.name[0].isdigit()
        and p.name[1].isdigit()
    ]
    if handoff_like and not (base / "00-START-HERE.txt").is_file():
        errors.append(
            f"{base.relative_to(ROOT)}: handoff PDF/PPTX present but missing 00-START-HERE.txt "
            "(run scripts/tools/build-investor-ir-pdf-pack.py)"
        )


def main() -> int:
    enforce = _enforce()
    if not FUNDR.is_dir():
        print(f"FAIL: missing {FUNDR}", file=sys.stderr)
        return 2

    errors: list[str] = []
    registry_release = _registry_release_value()

    md_files = sorted(FUNDR.rglob("*.md"))
    for md in md_files:
        rel = md.relative_to(ROOT)
        try:
            body = md.read_text(encoding="utf-8")
        except OSError as e:
            errors.append(f"{rel}: cannot read ({e})")
            continue

        if _is_investor_external(rel):
            leaks = _investor_leaks(body)
            if leaks:
                errors.append(f"{rel.as_posix()}: investor leak: {', '.join(leaks[:15])}")
            if not _extract_investor_release(body):
                errors.append(
                    f"{rel.as_posix()}: missing banner with 版本 **1.1** or Release **1.1** pattern "
                    f"(first {INVESTOR_HEAD_LINES} lines)"
                )
            if _investor_en_compliance_lane(rel):
                errors.extend(_check_prohibited_en(md, body))
            else:
                errors.extend(_check_prohibited_cn(md, body))
            errors.extend(_external_forbidden_link_errors(body, rel))
            continue

        miss = _check_dc(body, rel)
        if miss:
            errors.append(f"{rel}: missing document-control row(s): {', '.join(miss)}")

    _check_numeric_anchors(errors)
    if registry_release:
        _check_cn_en_release_pairs(errors, registry_release)
    else:
        errors.append("numeric-anchors registry missing or has no release field")

    _check_export_ready_handoff_layout(errors)
    _check_export_ready_demo_allowlist(errors)
    _check_cn_pitch_pdf_text_layer(errors)
    _check_export_ready_lp_surface(errors)

    link_script = ROOT / "scripts" / "gates" / "check-doc-markdown-relative-links.py"
    if link_script.is_file():
        cmd = [sys.executable, str(link_script), "--docs-root", "docs/fundraising", "--enforce"]
        r = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
        if r.returncode != 0:
            errors.append(
                "Relative markdown link check failed under docs/fundraising/ "
                f"(exit {r.returncode}).\n{r.stderr or r.stdout}"
            )
    else:
        errors.append(f"missing link checker: {link_script}")

    if errors:
        print(
            f"{'FAIL' if enforce else 'WARN'}: fundraising governance ({len(errors)} issue(s))",
            file=sys.stderr,
        )
        for e in errors[:100]:
            print(f"  - {e}", file=sys.stderr)
        if len(errors) > 100:
            print(f"  ... and {len(errors) - 100} more", file=sys.stderr)
        if not enforce:
            print(
                "INFO: exiting 0 (warn-only). Set FUNDRAISING_IR_GATE_ENFORCE=1 or pass --enforce.",
                file=sys.stderr,
            )
            return 0
        return 1

    print(
        "OK: fundraising governance (investor external + internal DC, anchors, CN/EN Release, links)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
