#!/usr/bin/env python3
"""
Build institution-grade IR PDFs from docs/fundraising/external/*.md.

Narrative PDFs (01–03, 05–06): Pandoc → DOCX → LibreOffice PDF (TOC, tables, headings).
07-Protocol-Tokenomics + 08-Data-Room-Index: fpdf2 vector/text supplement (pip install fpdf2).
Deck: build-investor-pitch-deck.py (PPTX → PDF via LibreOffice only). Optional IC appendix: build-investor-ic-appendix.py (same folder, `04-IC-Memo-v*-CN|EN`).

Requires: Pandoc, LibreOffice (soffice); optional pip install python-docx (reference DOCX fonts).
Output: docs/fundraising/external/export-ready/ numbered handoff PDFs 01–08 (CN|EN).

Run after narrative edits; then export-investor-dataroom.py --omit-markdown.
Maintainer commands are listed in docs/fundraising/internal/33 (not duplicated in PDFs).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXTERNAL = ROOT / "docs" / "fundraising" / "external"
OUT = EXTERNAL / "export-ready"
ANCHORS = ROOT / "registry" / "fundraising-external-numeric-anchors.v1.json"

_TOOLS = Path(__file__).resolve().parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))
import investor_handoff_layout as ihr  # noqa: E402
import investor_ir_pandoc_pdf as irp  # noqa: E402

DISCLAIMER_EN = (
    "General information only. Not an offer to sell or solicitation to buy securities, "
    "virtual assets, or any investment product. Not investment, tax, or legal advice. "
    "Forward-looking statements are subject to risk; protocol economics and token features "
    "may change or never launch. Terms of any transaction are governed only by signed documents."
)
DISCLAIMER_CN = (
    "一般性信息；不构成在任何司法辖区出售或要约购买证券、虚拟资产或投资产品的要约或诱引，"
    "亦不构成投资、税务或法律建议。前瞻性表述受风险影响；协议参数与代币安排可能变更或不再推出。"
    "交易条款仅以双方签署文本为准。"
)

FONT_CN = Path(r"C:/Windows/Fonts/simhei.ttf")
if not FONT_CN.is_file():
    FONT_CN = Path(r"C:/Windows/Fonts/msyh.ttc")
FONT_EN = Path(r"C:/Windows/Fonts/arial.ttf")


def _release() -> str:
    data = json.loads(ANCHORS.read_text(encoding="utf-8"))
    r = data.get("release")
    if not r:
        raise SystemExit("fundraising-external-numeric-anchors.v1.json missing release")
    return str(r)


def _font_names() -> tuple[str, str]:
    try:
        from fpdf import FPDF  # noqa: F401
    except ImportError as e:
        raise SystemExit("pip install fpdf2") from e
    cn = "IR_CN"
    en = "IR_EN"
    return cn, en


def _register_fonts(pdf: object, cn_tag: str, en_tag: str) -> None:
    if FONT_CN.is_file():
        pdf.add_font(cn_tag, "", str(FONT_CN))
    else:
        raise SystemExit("need a Chinese-capable font (simhei.ttf or msyh) under C:/Windows/Fonts")
    if FONT_EN.is_file():
        pdf.add_font(en_tag, "", str(FONT_EN))
    else:
        pdf.add_font(en_tag, "", str(FONT_CN))


def _add_cover(pdf: object, title: str, release: str, lang: str, cn_tag: str, en_tag: str) -> None:
    pdf.add_page()
    pdf.set_fill_color(10, 22, 40)
    pdf.rect(0, 0, 220, 320, "F")
    pdf.set_text_color(255, 255, 255)
    tag = cn_tag if lang == "CN" else en_tag
    pdf.set_font(tag, size=22)
    pdf.set_y(88)
    pdf.multi_cell(0, 10, title, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(tag, size=12)
    pdf.set_text_color(45, 212, 191)
    pdf.ln(6)
    pdf.multi_cell(0, 8, f"TravelTrust · Investor Relations · Release {release}", align="C")
    pdf.set_text_color(200, 200, 200)
    pdf.ln(16)
    pdf.set_font(tag, size=9)
    pdf.multi_cell(0, 5, DISCLAIMER_EN if lang == "EN" else DISCLAIMER_CN, align="C")


def _add_disclaimer_page(pdf: object, lang: str, cn_tag: str, en_tag: str) -> None:
    pdf.add_page()
    tag = cn_tag if lang == "CN" else en_tag
    pdf.set_text_color(40, 40, 40)
    pdf.set_font(tag, size=14)
    pdf.multi_cell(0, 8, "Legal disclaimer" if lang == "EN" else "法律免责声明", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font(tag, size=10)
    pdf.multi_cell(0, 5, DISCLAIMER_EN, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    if lang == "CN":
        pdf.multi_cell(0, 5, DISCLAIMER_CN, new_x="LMARGIN", new_y="NEXT")


def build_from_markdown(
    md_rel: str,
    out_base: str,
    display_title: str,
    release: str,
    lang: str,
    cn_tag: str,
    en_tag: str,
) -> Path:
    path = EXTERNAL / md_rel
    if not path.is_file():
        raise SystemExit(f"missing {path}")
    OUT.mkdir(parents=True, exist_ok=True)
    suffix = "CN" if lang == "CN" else "EN"
    out = OUT / f"{out_base}-v{release}-{suffix}.pdf"
    chapter_breaks = out_base in ("05-Litepaper", "06-Whitepaper")
    return irp.export_markdown_to_pdf(
        path,
        out,
        display_title=display_title,
        doc_label=display_title,
        release=release,
        lang=lang,
        use_chapter_pagebreaks=chapter_breaks,
    )


def build_protocol_tokenomics_pdf(release: str, lang: str, cn_tag: str, en_tag: str) -> Path:
    """Fee routing & roles aligned to external Whitepaper boundaries (45/55/100% only in numbers)."""
    from fpdf import FPDF  # noqa: PLC0415

    class _P(FPDF):
        pass

    pdf = _P()
    pdf.set_margins(16, 18, 16)
    _register_fonts(pdf, cn_tag, en_tag)
    tag = cn_tag if lang == "CN" else en_tag

    pdf.set_auto_page_break(auto=True, margin=18)

    # Cover
    title = "Protocol economics & token boundary (overview)" if lang == "EN" else "协议经济与代币边界（概览）"
    _add_cover(pdf, title, release, lang, cn_tag, en_tag)
    _add_disclaimer_page(pdf, lang, cn_tag, en_tag)

    sections_cn = [
        (
            "1. 与投资人白皮书一致的边界",
            [
                "订单 Escrow 本金与协议费、治理资金路径隔离；结算以允许列表内稳定币等为主。",
                "治理代币（若发行）用于协议治理与生态预算议程，非旅行订单默认支付货币。",
                "可能不发行治理代币；任何效用与参数以最终披露为准。",
            ],
        ),
        (
            "2. 可分配手续费路由（已披露百分数）",
            [
                "进入 FeeRouter 的「可分配平台费用」闭合为 100%；不含用户自付链上 gas。",
                "第一层拆分（示例口径）：国家/区域可分配费用桶约 45%；Global Pool 约 55%。",
                "Global Pool 内部再分配（激励、储备、运营等）以正式经济附录为准；本页不展开未在对外白皮书中锁定的细分比例。",
                "争议仲裁费、履约罚没等与上述「可分配手续费」分母不同，不得混讲为同一饼图。",
            ],
        ),
        (
            "3. 协议分层（便于 DD 对话）",
            [
                "体验与增长：市场、订单、社区、帮助。",
                "应用与编排：API、状态机、争议与托管联动。",
                "结算：链上 Escrow 与释放规则。",
                "经济：订单手续费 → FeeRouter 路由（与 TTG 议程分域）。",
                "治理（路线图）：Timelock、投票/委托与参数变更。",
            ],
        ),
        (
            "4. 三账簿记忆（不加新百分数）",
            [
                "Escrow 账：用户订单本金与释放条件。",
                "费路由账：仅「可分配平台手续费」进入 FeeRouter；与仲裁费、罚没分母分离。",
                "治理/金库账：参数与预算程序；TTG（若启用）表达权，与单笔订单本金隔离。",
            ],
        ),
        (
            "5. TTG 边界（与投资人白皮书对齐）",
            [
                "治理表决、委托与生态预算程序；非默认旅行支付；非 Escrow 结算资产。",
                "可能永不发行；供应与解锁以终版披露为准。",
            ],
        ),
        (
            "6. 典型 DD 追问（示例）",
            [
                "公开材料是否分层展示 Escrow、FeeRouter、Treasury 三套现金流？",
                "争议仲裁与 45%/55% 是否使用脚注区分分母？",
                "RegionVault / Timelock / Governor 的部署完备度以何发布为准？",
            ],
        ),
    ]

    sections_en = [
        (
            "1. Boundary (aligned with investor Whitepaper)",
            [
                "Order Escrow principal is separate from protocol fees and treasury flows; settlement uses allowlisted stables.",
                "Governance token (if any) is for protocol governance and ecosystem budgeting—not default travel payment.",
                "A token may never launch; mechanics are forward-looking only.",
            ],
        ),
        (
            "2. Allocatable fee routing (published percentages)",
            [
                "Allocatable platform fees entering FeeRouter close to 100%; excludes user-paid L1/L2 gas.",
                "First layer (illustrative): national/regional bucket ~45%; Global Pool ~55%.",
                "Internal Global splits (incentive, reserve, ops) follow the executed economics addendum—not expanded here.",
                "Arbitration fees and performance slashing use different denominators—do not merge into one pie.",
            ],
        ),
        (
            "3. Protocol layering (for diligence dialog)",
            [
                "Experience & growth: market, orders, community, help.",
                "Application & orchestration: APIs, state machine, dispute/escrow linkage.",
                "Settlement: Escrow and release rules.",
                "Economics: order fees → FeeRouter (separate lane from governance agenda).",
                "Governance (roadmap): timelock, vote/delegate, parameter changes.",
            ],
        ),
        (
            "4. Three-ledger mnemonic (no new percentages)",
            [
                "Escrow ledger: traveler principal and release conditions.",
                "Fee-router ledger: allocatable platform fees only; separate from arbitration/slashing denominators.",
                "Governance/treasury ledger: parameters and budgets; TTG (if any) does not co-mingle per-order principal.",
            ],
        ),
        (
            "5. TTG boundary (aligned with investor whitepaper)",
            [
                "Votes, delegation, ecosystem budgeting; not default travel payment; not Escrow settlement.",
                "May never launch; supply/unlocks follow final disclosures.",
            ],
        ),
        (
            "6. Sample DD prompts",
            [
                "Are Escrow, FeeRouter, and treasury flows shown on separate slides/ledgers?",
                "Are dispute fees footnoted away from the 45%/55% first-layer story?",
                "Which shipped release is authoritative for RegionVault / timelock / governor?",
            ],
        ),
    ]

    for heading, lines in (sections_cn if lang == "CN" else sections_en):
        pdf.add_page()
        pdf.set_font(tag, size=13)
        pdf.multi_cell(0, 7, heading, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_font(tag, size=10)
        for line in lines:
            pdf.multi_cell(0, 5.5, line, new_x="LMARGIN", new_y="NEXT")
            pdf.ln(1)

    _tools = Path(__file__).resolve().parent
    if str(_tools) not in sys.path:
        sys.path.insert(0, str(_tools))
    import ir_brand_vector_charts as irv  # noqa: PLC0415

    heads_cn = [
        ("旅行交易主链（矢量示意）", "与对外一页材料主链一致"),
        ("协议栈（矢量示意）", "五层结构 · DD 对话参考"),
        ("FeeRouter · 第一层（矢量示意）", "仅披露 100% / 45% / 55%；与投资人白皮书对读"),
        ("资金流边界（矢量示意）", "Escrow / 可分配手续费 / 治理议程 · 不新增经济参数"),
    ]
    heads_en = [
        ("Travel deal loop (vector)", "Aligned with public one-pager narrative"),
        ("Protocol stack (vector)", "Five-layer reference for diligence"),
        ("FeeRouter layer 1 (vector)", "Only published 100% / 45% / 55%"),
        ("Capital-flow boundary (vector)", "Escrow / allocatable fees / governance — no new parameters"),
    ]
    for i, (ht, sub) in enumerate(heads_cn if lang == "CN" else heads_en):
        pdf.add_page()
        y = irv.fpdf_page_vector_heading(pdf, tag, ht, sub)
        if i == 0:
            irv.fpdf_travel_loop(pdf, tag, lang, y)
        elif i == 1:
            irv.fpdf_protocol_stack(pdf, tag, lang, y)
        elif i == 2:
            irv.fpdf_fee_router_layer1(pdf, tag, lang, y)
        else:
            irv.fpdf_tokenomics_lanes(pdf, tag, lang, y)

    OUT.mkdir(parents=True, exist_ok=True)
    suf = "CN" if lang == "CN" else "EN"
    out = OUT / f"07-Protocol-Tokenomics-v{release}-{suf}.pdf"
    pdf.output(str(out))
    return out


def build_data_room_pdf(release: str, cn_tag: str, en_tag: str) -> Path:
    from fpdf import FPDF  # noqa: PLC0415

    class _P(FPDF):
        pass

    pdf = _P()
    pdf.set_margins(16, 18, 16)
    _register_fonts(pdf, cn_tag, en_tag)

    _add_cover(pdf, "Investor Data Room — Index", release, "EN", cn_tag, en_tag)
    pdf.add_page()
    pdf.set_text_color(200, 60, 60)
    pdf.set_font(en_tag, size=11)
    pdf.multi_cell(
        0,
        6,
        "NDA / access first: this PDF is a public pack map only—no unaudited operating metrics, "
        "no cap table, no signed contracts inside the public zip.",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(2)
    pdf.set_text_color(40, 40, 40)
    pdf.set_font(en_tag, size=10)
    pdf.multi_cell(0, 5, DISCLAIMER_EN, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    rows = [
        ("00 — Pack entry (reading order)", f"../00-START-HERE.txt (zip root)"),
        ("01 — First touch / quick scan", f"01-OnePager-v{release}-CN.pdf / EN.pdf"),
        ("02 — Institutional screen", f"02-Executive-Summary-v{release}-CN.pdf / EN.pdf"),
        ("03 — Post-meeting Q&A", f"03-FAQ-v{release}-CN.pdf / EN.pdf"),
        ("04 — Main roadshow", f"04-PitchDeck-v{release}-CN.pdf / EN.pdf / pptx"),
        ("05 — Medium diligence", f"05-Litepaper-v{release}-CN.pdf / EN.pdf"),
        (
            "06 — Deep diligence (not cold-start)",
            f"06-Whitepaper-v{release}-CN.pdf / EN.pdf — legal / technical / fund DD",
        ),
        ("07 — Web3 / token readers (IC, legal, tech)", f"07-Protocol-Tokenomics-v{release}-CN.pdf / EN.pdf"),
        ("08 — This index (NDA / deeper DD)", f"08-Data-Room-Index-v{release}.pdf"),
        ("— Product demo", f"demo/TravelTrust-Product-Demo-v{release}.mp4"),
    ]
    pdf.set_font(en_tag, size=11)
    pdf.cell(0, 8, "Document map (signed-pdfs/)", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    for cat, names in rows:
        pdf.set_font(en_tag, size=9)
        pdf.multi_cell(0, 5, f"{cat}: {names}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    pdf.ln(4)
    pdf.set_font(en_tag, size=9)
    pdf.multi_cell(
        0,
        5,
        "Operational KPIs, cap table, and signed legal schedules are shared only under NDA and counsel-approved channels.",
        new_x="LMARGIN",
        new_y="NEXT",
    )

    # Page 2: transparency shell — question theme → typical NDA slice → public-pack pointer (no secrets).
    pdf.add_page()
    pdf.set_text_color(40, 40, 40)
    pdf.set_font(en_tag, size=13)
    pdf.multi_cell(
        0,
        7,
        "NDA-gated diligence — question theme → typical slice → start in the public pack",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(3)
    pdf.set_font(en_tag, size=9)
    pdf.multi_cell(
        0,
        5,
        "Categories only. Metrics, contracts, chain proofs, and partner identifiers ship under NDA—not inside this PDF.",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(4)
    bullets = [
        "Product / pilots — LOIs, pilot metrics, partner IDs — start: 01 OnePager · 04 Pitch · 05 Litepaper.",
        "On-chain proof — verified addresses, audit PDFs, upgrade runbooks — start in **06-Whitepaper** using the PDF table of contents: read from **trip lifecycle / escrow mechanics** through **risk factors and disclaimers**, then NDA room tables.",
        "Economics — cap table vs token mechanics, inner fee splits — start: 06 §06 + signed addenda (NDA).",
        "Ops metrics — GMV / orders / exports — IR metric tables after NDA (not in the public zip).",
        "Regulatory / marketing — promotion templates, geo blocks — start: 06 §11 + counsel workflows (NDA).",
    ]
    pdf.set_font(en_tag, size=9)
    for b in bullets:
        pdf.multi_cell(0, 5, f"• {b}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)
    pdf.ln(4)
    pdf.set_font(cn_tag, size=9)
    pdf.multi_cell(
        0,
        5,
        "（中文）本页仅列「问题类型 → NDA 下常见切片 → 公开包内先读哪几份」，不承载未授权经营数字；"
        "打开 08 前请确认已与 IR/法务完成 NDA 与访问授权。",
        new_x="LMARGIN",
        new_y="NEXT",
    )

    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"08-Data-Room-Index-v{release}.pdf"
    pdf.output(str(out))
    return out


def main() -> int:
    release = _release()
    cn_tag, en_tag = _font_names()
    OUT.mkdir(parents=True, exist_ok=True)
    ihr.purge_traveltrust_legacy_binaries(OUT)
    ihr.purge_dated_legacy_pdfs(OUT)
    ihr.purge_numbered_ir_pdfs_for_release(OUT, release)

    docs_cn = [
        ("01-OnePager.md", "01-OnePager", "One Pager"),
        ("02-Investor-Executive-Summary.md", "02-Executive-Summary", "Executive Summary"),
        ("03-FAQ.md", "03-FAQ", "FAQ"),
        ("05-Litepaper.md", "05-Litepaper", "Litepaper"),
        ("06-Whitepaper.md", "06-Whitepaper", "Whitepaper"),
    ]
    docs_en = [
        ("en/01-OnePager.md", "01-OnePager", "One Pager"),
        ("en/02-Investor-Executive-Summary.md", "02-Executive-Summary", "Executive Summary"),
        ("en/03-FAQ.md", "03-FAQ", "FAQ"),
        ("en/05-Litepaper.md", "05-Litepaper", "Litepaper"),
        ("en/06-Whitepaper.md", "06-Whitepaper", "Whitepaper"),
    ]

    built: list[Path] = []
    for md, base, label in docs_cn:
        built.append(build_from_markdown(md, base, label, release, "CN", cn_tag, en_tag))
    for md, base, label in docs_en:
        built.append(build_from_markdown(md, base, label, release, "EN", cn_tag, en_tag))

    for lang in ("CN", "EN"):
        built.append(build_protocol_tokenomics_pdf(release, lang, cn_tag, en_tag))
    built.append(build_data_room_pdf(release, cn_tag, en_tag))

    start = ihr.write_start_here(OUT, release)
    print("OK: IR PDF pack written:")
    for p in built:
        print(" ", p)
    print("OK:", start)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
