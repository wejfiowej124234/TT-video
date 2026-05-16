"""
Shared hygiene and 00-START-HERE content for docs/fundraising/external/export-ready/.

Handoff root must contain only numbered PDFs (01–08), 00-START-HERE.txt, README.md,
and ``demo/``. Slot **04** = **one** CN + **one** EN PDF (`04-PitchDeck-v{release}-*.pdf` only).
PPTX and optional IC appendix live under ``internal/deck-editable/`` (not in export-ready).
Legacy names TravelTrust-IR-* and TravelTrust-PitchDeck-* are forbidden.
"""
from __future__ import annotations

import os
import re
import shutil
from pathlib import Path

_PLACEHOLDER = "________________"


def ir_contact_lines() -> tuple[str, str]:
    """IR contact in shipped 00-START-HERE; filled from env when name+email set."""
    name = (os.environ.get("FUNDRAISING_IR_CONTACT_NAME") or "").strip()
    email = (os.environ.get("FUNDRAISING_IR_CONTACT_EMAIL") or "").strip()
    phone = (os.environ.get("FUNDRAISING_IR_CONTACT_PHONE") or "").strip()
    if name and email:
        phone_en = phone if phone else "(not provided)"
        phone_cn = phone if phone else "（未提供）"
        en = f"Name: {name}    Email: {email}    Phone / Signal / Telegram (optional): {phone_en}"
        cn = f"（中文）IR 外发前填写（与中英包同栏）：姓名 {name} · 邮箱 {email} · 电话 / Signal / Telegram（可选）{phone_cn}"
        return en, cn
    en = (
        f"Name: {_PLACEHOLDER}    Email: {_PLACEHOLDER}    "
        f"Phone / Signal / Telegram (optional): {_PLACEHOLDER}"
    )
    cn = (
        f"（中文）IR 外发前填写（与中英包同栏）：姓名 {_PLACEHOLDER} · 邮箱 {_PLACEHOLDER} · "
        f"电话 / Signal / Telegram（可选）{_PLACEHOLDER}"
    )
    return en, cn

_VER = r"(?:\d+)(?:\.\d+)*"
# Repo-root-relative internal path (set by importers after Path is known)
_FUNDR_ROOT: Path | None = None


def set_fundraising_root(fundr: Path) -> None:
    global _FUNDR_ROOT
    _FUNDR_ROOT = fundr


def maintainer_deck_editable_dir() -> Path:
    """Internal PPTX workspace — never copied to export-ready or LP zip."""
    if _FUNDR_ROOT is None:
        root = Path(__file__).resolve().parents[2]
        return root / "docs" / "fundraising" / "internal" / "deck-editable"
    return _FUNDR_ROOT / "internal" / "deck-editable"


# export-ready root: 01–07 PDFs, 08 index; 04 = PitchDeck CN|EN only (no 04-IC-Memo)
_HANDOFF_PDF_RE = re.compile(
    rf"^(?:0[1-7]-.+?-v{_VER}-(?:CN|EN)\.pdf|08-Data-Room-Index-v{_VER}\.pdf|04-PitchDeck-v{_VER}-(?:CN|EN)\.pdf)$"
)
_HANDOFF_PPTX_RE = re.compile(
    rf"^(?:04-PitchDeck-v{_VER}-(?:CN|EN)\.pptx|04-IC-Memo-v{_VER}-(?:CN|EN)\.pptx)$"
)


def _attachment_forward_chain_lines(release: str, *, zip_outer_readme: bool) -> list[str]:
    """IR copy/paste blocks for Pitch-only / IC-only / zip / IM forward chains (bilingual).

    ``zip_outer_readme=True`` tailors the zip-unpack line for the zip-root copy of this file
    (paths under ``signed-pdfs/``); ``False`` for ``export-ready/`` handoff folder.
    """
    zip_unpack_cn = (
        "解压后**先打开 ZIP 最外层**的 `00-START-HERE.txt`，再按其中 `signed-pdfs/` 路径打开 Pitch；"
        "**勿**按文件名从 06/07/08 冷启动；**08** 仅 NDA 后。"
        if zip_outer_readme
        else "解压完整包后**先打开**本目录 `00-START-HERE.txt`，再按本文件中的**建议读序**阅读；"
        "**勿**按文件名从 06/07/08 冷启动；**08** 仅 NDA 后。"
    )
    zip_unpack_en = (
        "After unzip, open **`00-START-HERE.txt` at the zip root** first, then follow `signed-pdfs/` paths to the Pitch; "
        "do **not** cold-open 06/07/08 by filename sort; **08** is post-NDA only."
        if zip_outer_readme
        else "After unzip, open **`00-START-HERE.txt` in this folder** first, then follow the **recommended read order** in this file; "
        "do **not** cold-open 06/07/08 by filename sort; **08** is post-NDA only."
    )
    return [
        "Optional cover notes (copy/paste for email / WeChat / IM)",
        "（中文）外发包盖注：单发 PDF / 仅 zip / 微信单文件时，收件人易错过「建议读序 + 演示片有则无 + 08 期望」。以下块可由发送方粘贴至邮件/IM，便于对齐；**不**构成对收件人的新增法律承诺。",
        "",
        "--- Snippet: Pitch PDF only (CN) — paste in email/IM body ---",
        f"【TravelTrust v{release} · 单发路演 Deck】附件为 `04-PitchDeck-v{release}-CN.pdf`，**不含**包内 `00-START-HERE.txt`。",
        "完整读序与 Demo 政策见完整材料包；若包内无 `demo/*.mp4` 即表示**无**默认录屏，勿推断「另有隐藏视频」。",
        "阶段口径：公开发布节奏与生产域名以**正式公告与环境标签**为准。",
        f"如需 FAQ / 导读 / 完整包，请向 IR 索取 `TravelTrust-Investor-Materials-v{release}.zip` 或说明需要的编号文件。",
        "",
        "--- Snippet: Pitch PDF only (EN) ---",
        f"[TravelTrust v{release} · Pitch only] Attached: `04-PitchDeck-v{release}-EN.pdf` — **no** in-pack `00-START-HERE.txt`.",
        "Default read order + demo policy live in the full zip; **if** `demo/*.mp4` is absent, **skip** video—do not assume withheld footage.",
        "Stage: cadence and production domains follow **published announcements + environment labels**.",
        f"Ask IR for the full `TravelTrust-Investor-Materials-v{release}.zip` (or specific numbered PDFs) for FAQ / guide.",
        "",
        "--- Snippet: Full zip (cover note when attaching zip) ---",
        f"[TravelTrust v{release} · investor pack] Attached zip `TravelTrust-Investor-Materials-v{release}.zip` (PDF pack only — no source-code repository).",
        f"（中文）附件为投资者材料 zip（仅 PDF），不含代码工程仓库。",
        zip_unpack_en,
        "If corporate mail blocks zip, use approved cloud **folder** view or ask IR for split PDFs + the snippets above.",
        f"（中文）完整包 zip：{zip_unpack_cn}企业邮箱若拦截 zip，请用合规网盘「目录」或请 IR 拆发单文件并粘贴上文「单发」模板。",
        "",
        "--- Snippet: WeChat / mobile — one-liner (CN) ---",
        f"【TravelTrust v{release}】先电脑解压 zip 打开根目录 `00-START-HERE.txt`；若仅收到单 PDF，回邮 IR 要完整包或 FAQ。手机端弱目录/易误触深读文件。",
        "",
        "--- Snippet: WeChat / mobile — one-liner (EN) ---",
        f"[TravelTrust v{release}] Prefer laptop: unzip → open root `00-START-HERE.txt`. If you only got one PDF, reply to IR for the full pack or FAQ. Mobile readers are weak on multi-doc navigation.",
        "",
    ]


def _ir_only_sender_lines(release: str) -> list[str]:
    """IR copy/paste only — not part of the LP default read path."""
    return [
        "--- IR only (sender — do not expect LPs to read this block) ---",
        f"Partner 深问顺序（FAQ，发件人备忘）：`03-FAQ-v{release}-*.pdf` 与 Deck ~p13 / IC Notes 同序 — 28→3→23→29→30·p13·18→20→31→16（条目 28–31）。",
        f"Partner deep-dive order (FAQ, sender memo): `03-FAQ-v{release}-*.pdf` — 28→3→23→29→30·p13·18→20→31·16 (items 28–31), aligned with Deck ~p13 / IC notes.",
        "",
    ]


def purge_traveltrust_legacy_binaries(out_dir: Path) -> None:
    for pat in ("TravelTrust-IR-*", "TravelTrust-PitchDeck-*"):
        for p in out_dir.glob(pat):
            if p.is_file():
                try:
                    p.unlink()
                except OSError:
                    pass


def purge_dated_legacy_pdfs(out_dir: Path) -> None:
    for p in out_dir.glob("2026-05-15_TravelTrust*.pdf"):
        if p.is_file():
            try:
                p.unlink()
            except OSError:
                pass


def purge_numbered_ir_pdfs_for_release(out_dir: Path, release: str) -> None:
    for pat in (
        f"01-OnePager-v{release}-*.pdf",
        f"02-Executive-Summary-v{release}-*.pdf",
        f"03-FAQ-v{release}-*.pdf",
        f"05-Litepaper-v{release}-*.pdf",
        f"06-Whitepaper-v{release}-*.pdf",
        f"07-Protocol-Tokenomics-v{release}-*.pdf",
        f"08-Data-Room-Index-v{release}.pdf",
    ):
        for p in out_dir.glob(pat):
            if p.is_file():
                try:
                    p.unlink()
                except OSError:
                    pass


def purge_ic_memo_for_release(out_dir: Path, release: str) -> None:
    """Remove IC memo artifacts from export-ready (LP pack does not ship 04-IC-Memo)."""
    bases = [out_dir, maintainer_deck_editable_dir()]
    for base in bases:
        if not base.is_dir():
            continue
        for p in base.glob(f"04-IC-Memo-v{release}.*"):
            if p.is_file() and p.suffix.lower() in (".pdf", ".pptx"):
                try:
                    p.unlink()
                except OSError:
                    pass


def purge_pitch_deck_for_release(out_dir: Path, release: str) -> None:
    bases = [out_dir, maintainer_deck_editable_dir()]
    for base in bases:
        if not base.is_dir():
            continue
        for prefix in ("03-PitchDeck", "04-PitchDeck"):
            for p in base.glob(f"{prefix}-v{release}.*"):
                if p.is_file() and p.suffix.lower() in (".pdf", ".pptx"):
                    try:
                        p.unlink()
                    except OSError:
                        pass


def purge_export_ready_handoff_extras(out_dir: Path, release: str) -> list[str]:
    """Enforce export-ready hygiene: no IC memo, no PPTX, no legacy _editable/."""
    removed: list[str] = []
    legacy = out_dir / "_editable"
    if legacy.is_dir():
        shutil.rmtree(legacy, ignore_errors=True)
        removed.append("_editable/")
    for p in sorted(out_dir.glob("*.pptx")):
        try:
            p.unlink()
            removed.append(p.name)
        except OSError:
            pass
    for p in sorted(out_dir.glob(f"04-IC-Memo-v{release}.*")):
        if p.is_file():
            try:
                p.unlink()
                removed.append(p.name)
            except OSError:
                pass
    return removed


def prune_handoff_editable_from_ship_tree(signed_pdfs: Path, release: str = "") -> bool:
    """Strip non-LP artifacts from ``signed-pdfs/`` copy (PPTX, _editable/, 04-IC-Memo)."""
    removed = False
    for name in ("_editable",):
        d = signed_pdfs / name
        if d.is_dir():
            shutil.rmtree(d, ignore_errors=True)
            removed = True
    for p in signed_pdfs.glob("*.pptx"):
        if p.is_file():
            try:
                p.unlink()
                removed = True
            except OSError:
                pass
    if release:
        for p in signed_pdfs.glob(f"04-IC-Memo-v{release}.*"):
            if p.is_file():
                try:
                    p.unlink()
                    removed = True
                except OSError:
                    pass
    return removed


def handoff_demo_repo_allowlist(release: str) -> frozenset[str]:
    """Filenames allowed under ``export-ready/demo/`` in the repository."""
    return frozenset(
        {
            "README.md",
            "SCREEN-RECORDING-BRIEF.txt",
            f"TravelTrust-Product-Demo-v{release}.mp4",
        }
    )


def handoff_demo_allowlist(release: str) -> frozenset[str]:
    """Filenames allowed under demo/ in **shipped** investor zips (final mp4 only)."""
    return frozenset({f"TravelTrust-Product-Demo-v{release}.mp4"})


# Final ~90s screen captures are usually much larger; title-card placeholder from build-investor-demo-video.py is smaller.
HANDOFF_DEMO_MP4_MIN_FINAL_BYTES = 800_000


def demo_mp4_placeholder_reason(path: Path) -> str | None:
    """Return human-readable reason if mp4 looks like a non-final placeholder, else None."""
    if not path.is_file() or path.suffix.lower() != ".mp4":
        return None
    size = path.stat().st_size
    if size < HANDOFF_DEMO_MP4_MIN_FINAL_BYTES:
        return (
            f"size {size} B < {HANDOFF_DEMO_MP4_MIN_FINAL_BYTES} (likely placeholder from "
            "build-investor-demo-video.py); omit from zip or replace with final ~90s capture"
        )
    return None


def prune_handoff_demo_to_allowlist(demo_dir: Path, release: str) -> list[str]:
    """Remove demo/ children not in the allowlist (e.g. _frames, _segments, stray binaries)."""
    allowed = handoff_demo_allowlist(release)
    removed: list[str] = []
    if not demo_dir.is_dir():
        return removed
    for child in sorted(demo_dir.iterdir(), key=lambda p: p.name.lower()):
        if child.name.startswith(".") or child.name in allowed:
            continue
        rel = child.name
        try:
            if child.is_dir():
                shutil.rmtree(child, ignore_errors=True)
            else:
                child.unlink()
        except OSError:
            pass
        removed.append(rel)
    return removed


def start_here_text(release: str) -> str:
    """Paths are relative to the handoff folder (export-ready/ or signed-pdfs/ in zip)."""
    return "\n".join(
        [
            "TravelTrust — Investor Materials",
            f"Release: {release}",
            f"Sole external handoff artifact: TravelTrust-Investor-Materials-v{release}.zip (PDF pack only — no source-code repository).",
            f"（中文）对外仅交付本材料包（**PDF** 等），**不含**代码工程仓库或内部文档树。",
            "",
            "Qualitative stage: public launch cadence and production domains follow published announcements plus environment labels (do not imply full production rollout from demos or test hosts).",
            "（中文）阶段定性：公开发布节奏与生产域名以正式公告与环境标签为准；演示/测试环境不可替代为已全面生产上线。",
            "",
            f"Demo recording (if included): demo/TravelTrust-Product-Demo-v{release}.mp4 should be your final ~90s walk-through. Label demo/testnet vs production in-frame or VO. If the mp4 is absent, skip video—IR will confirm whether a recording is available.",
            "（中文）演示片（若有）：上述 mp4 应为约 90 秒终版一镜；画面或口播须标明演示/测试网与生产。包内无该文件则跳过，可向 IR 确认是否另有录屏。",
            "",
            "IR contact (fill before external send — same fields for CN/EN packs):",
            *ir_contact_lines(),
            "",
            "OPTIONAL FIRST PASS (unfamiliar LPs): 01 OnePager → 04 Pitch Deck (CN or EN), then follow the recommended read order below.",
            "（中文）陌生 LP 可选先读：01 一页摘要 → 04 路演 Deck，再进入下方建议读序。",
            "",
            "RECOMMENDED READ ORDER: 04 Pitch Deck (CN or EN) → 03 FAQ; optional skim 02 Executive Summary before deep DD. "
            f"If and only if demo/TravelTrust-Product-Demo-v{release}.mp4 is present in this folder, watch it after Pitch/FAQ (~90s one-take; label demo/testnet vs production in-frame or VO). "
            "If the mp4 is absent, skip video—do not assume one was withheld.",
            "（中文）建议读序：04 路演 Deck（中或英）→ 03 FAQ；深度前可选扫 02 执行摘要；仅当本目录存在 mp4 时再观看演示片，否则跳过。",
            "The READ IN ORDER section below is an alphabetical file index for this folder; it is not the recommended reading path.",
            "",
        ]
        + _attachment_forward_chain_lines(release, zip_outer_readme=False)
        + _ir_only_sender_lines(release)
        + [
            "READ IN ORDER (paths relative to this folder)",
            "00 — This file — recommended read order above + file index below; 08 is a post-NDA semantic index PDF (not executed originals; open only after NDA/access terms with IR/legal).",
            f"01 — 01-OnePager-v{release}-CN.pdf / EN.pdf — first touch / quick scan",
            f"02 — 02-Executive-Summary-v{release}-CN.pdf / EN.pdf — institutional screen",
            f"03 — 03-FAQ-v{release}-CN.pdf / EN.pdf — post-meeting Q&A",
            f"04 — 04-PitchDeck-v{release}-CN.pdf / EN.pdf — roadshow only (one CN + one EN PDF)",
            f"05 — 05-Litepaper-v{release}-CN.pdf / EN.pdf — medium due diligence",
            f"06 — 06-Whitepaper-v{release}-CN.pdf / EN.pdf — deep DD only (NOT cold-start); legal / technical / fund partners",
            f"07 — 07-Protocol-Tokenomics-v{release}-CN.pdf / EN.pdf — Web3/token-aware IC, legal, tech partners",
            f"08 — 08-Data-Room-Index-v{release}.pdf — post-NDA directory/semantic index (not executed originals; no unaudited ops detail in the public pack)",
            f"—  demo/TravelTrust-Product-Demo-v{release}.mp4 — optional ~90s walkthrough when present; label demo/testnet vs production in-frame or VO",
            "",
            "This handoff set is PDF and (when included) one short demo video. Slot 04 = Pitch Deck CN|EN only.",
            "",
            "General information only. Not an offer to sell securities or any investment product.",
            "",
        ]
    )


def write_start_here(out_dir: Path, release: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "00-START-HERE.txt"
    path.write_text(start_here_text(release) + "\n", encoding="utf-8", newline="\n")
    return path


def zip_root_start_here_text(release: str) -> str:
    """00-START-HERE at zip root: prefix paths with signed-pdfs/."""
    s = "signed-pdfs/"
    return "\n".join(
        [
            "TravelTrust — Investor Materials",
            f"Release: {release}",
            f"Sole external handoff artifact: TravelTrust-Investor-Materials-v{release}.zip (PDF pack only — no source-code repository).",
            f"（中文）对外仅交付本材料包（**PDF** 等），**不含**代码工程仓库或内部文档树。",
            "",
            "Qualitative stage: public launch cadence and production domains follow published announcements plus environment labels (do not imply full production rollout from demos or test hosts).",
            "（中文）阶段定性：公开发布节奏与生产域名以正式公告与环境标签为准；演示/测试环境不可替代为已全面生产上线。",
            "",
            f"Demo recording (if included): signed-pdfs/demo/TravelTrust-Product-Demo-v{release}.mp4 should be your final ~90s walk-through. Label demo/testnet vs production in-frame or VO. If absent, skip video—ask IR.",
            "（中文）演示片（若有）：终版 mp4 须约 90 秒真一镜；标明演示/测试网与生产。包内无文件则跳过，可向 IR 确认。",
            "",
            "IR contact (fill before send — CN/EN packs):",
            *ir_contact_lines(),
            "",
            "OPTIONAL FIRST PASS (unfamiliar LPs): 01 OnePager → 04 Pitch Deck, then follow the recommended read order below.",
            "（中文）陌生 LP 可选先读：01 一页摘要 → 04 Deck，再进入建议读序。",
            "",
            "RECOMMENDED READ ORDER: 04 Pitch Deck (CN or EN) → 03 FAQ; optional skim 02 Executive Summary before deep DD. "
            f"If and only if {s}demo/TravelTrust-Product-Demo-v{release}.mp4 exists in the pack, watch it after Pitch/FAQ (~90s one-take; label demo/testnet vs production). "
            "If absent, skip video.",
            "（中文）建议读序：04 路演 Deck（中或英）→ 03 FAQ；深度前可选扫 02 执行摘要；仅当 zip 内含 mp4 时再观看演示片，否则跳过。",
            f"The READ IN ORDER section below lists files under {s} in alphabetical order; it is not the recommended reading path.",
            "",
        ]
        + _attachment_forward_chain_lines(release, zip_outer_readme=True)
        + _ir_only_sender_lines(release)
        + [
            "READ IN ORDER (under signed-pdfs/ for PDFs and the in-folder 00 guide)",
            f"00 — Open {s}00-START-HERE.txt — recommended read order above + file index below",
            f"01 — {s}01-OnePager-v{release}-CN.pdf / EN.pdf — first touch / quick scan",
            f"02 — {s}02-Executive-Summary-v{release}-CN.pdf / EN.pdf — institutional screen",
            f"03 — {s}03-FAQ-v{release}-CN.pdf / EN.pdf — post-meeting Q&A",
            f"04 — {s}04-PitchDeck-v{release}-CN.pdf / EN.pdf — roadshow only (one CN + one EN PDF)",
            f"05 — {s}05-Litepaper-v{release}-CN.pdf / EN.pdf — medium due diligence",
            f"06 — {s}06-Whitepaper-v{release}-CN.pdf / EN.pdf — deep DD only (NOT cold-start); legal / technical / fund partners",
            f"07 — {s}07-Protocol-Tokenomics-v{release}-CN.pdf / EN.pdf — Web3/token-aware IC, legal, tech partners",
            f"08 — {s}08-Data-Room-Index-v{release}.pdf — post-NDA directory/semantic index (not executed originals)",
            f"—  {s}demo/TravelTrust-Product-Demo-v{release}.mp4 — optional walkthrough when present; label demo/testnet vs production",
            "",
            "This handoff set is PDF and (when included) one short demo video. Slot 04 = Pitch Deck CN|EN only.",
            "",
            "General information only. Not an offer to sell securities or any investment product.",
            "",
        ]
    ) + "\n"


def export_ready_subdirectory_allowed(name: str) -> bool:
    return name == "demo"


def export_ready_root_filename_allowed(name: str) -> bool:
    if name in ("README.md", "00-START-HERE.txt"):
        return True
    if name.lower().endswith(".pdf"):
        return bool(_HANDOFF_PDF_RE.match(name))
    return False


def export_ready_forbidden_legacy_name(name: str) -> bool:
    return name.startswith("TravelTrust-IR-") or name.startswith("TravelTrust-PitchDeck-")
