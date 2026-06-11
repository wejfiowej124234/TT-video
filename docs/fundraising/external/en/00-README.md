# TravelTrust — Investor materials (English)

**TravelTrust · Investor materials** · Release **1.3** · May 2026

**Audience**: institutional investors, ICs, legal/technical diligence teams. **Ship** the zip built from **`export-ready/`** (often as `signed-pdfs/`)—**PDF/PPTX materials only**; **do not** share source-code repositories, internal workspaces, or unaudited legal schedules by default.

**Product demo / screen-recording engineering SSOT (internal · Phase ①)**: **`/`** Web3 travel home · **`/market`** (**`/discover`→`/market`**) — **[LANDING-MARKET-PAGES-CODE-SSOT](../../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** · **[PM demo script](../../product-manager/24-产品经理核心产品路径与演示脚本.md)** · **[internal/10 index](../internal/10-资料室索引.md)**. External FAQ items 5–6 narrative unchanged; diligence must match code—**do not** describe demo/testnet as production-closed.

## Single numbering: edit once, ship once

| Layer | Location | “Best” copy |
|-------|----------|-------------|
| **Working narrative (reviewable, diffable)** | `01`–`06` Markdown here and under **en/** (this folder) | **Markdown wins** on conflicts—edit `.md` first, then rebuild PDFs. |
| **Handoff binaries (print/PPT)** | **[export-ready/](../export-ready/README.md)** only | **Only these PDF/PPTX names** are the shipped set. **No** parallel `.pdf` copies next to `.md` in this tree. |

After narrative edits, rebuild `export-ready/` and zip per the **IR export checklist** (maintained on the team **internal** side).

## Default read order (canonical)

**Only one canonical “what to open first” for investors:** [**00-START-HERE.md**](../00-START-HERE.md) (Pitch → Memo → FAQ → **~90s** demo, etc.). Email, live briefings, and zip cover notes must match it.

The pack’s **[export-ready/00-START-HERE.txt](../export-ready/00-START-HERE.txt)** opens with a short **bilingual qualitative stage** line plus **DEFAULT READ ORDER** (written by the export/hygiene step, aligned to the same policy as `00-START-HERE.md`). **The table below is a filename catalog / rebuild order**, not a second mandatory read path.

## Reading order vs filenames (00→08)

The table lists **`export-ready/` artifact names** (same as the **READ IN ORDER** block in `00-START-HERE.txt`). **06 Whitepaper** is deep diligence—not a cold-start first read; deeper paths still follow **00-START-HERE.md**.

| # | Use case | Maintainer source (this folder) | Artifact in `export-ready/` |
|---|----------|----------------|---------------------------|
| 00 | Pack guide | — | `00-START-HERE.txt` |
| 01 | First touch | [01-OnePager.md](01-OnePager.md) | `01-OnePager-v{release}-CN.pdf` / `EN.pdf` |
| 02 | Screen | [02-Investor-Executive-Summary.md](02-Investor-Executive-Summary.md) | `02-Executive-Summary-v{release}-…` |
| 03 | FAQ | [03-FAQ.md](03-FAQ.md) | `03-FAQ-v{release}-…` |
| 04 | Roadshow | [04-PitchDeck-Storyboard.md](04-PitchDeck-Storyboard.md) | `export-ready/04-PitchDeck-v{release}-CN/EN.pdf`（PPTX: `internal/deck-editable/`) |
| 04b | Partner / IC appendix (**internal / IR only**) | Same narrative guardrails as the main deck / **06**; build on team checklist | `internal/deck-editable/04-IC-Memo-v{release}-CN/EN.pptx` (**not** in `export-ready/`) |
| 05 | Medium DD | [05-Litepaper.md](05-Litepaper.md) | `05-Litepaper-v{release}-…` |
| 06 | Deep DD | [06-Whitepaper.md](06-Whitepaper.md) (**skim**: Abstract → §06 → §11; full doc still not cold-start) | `06-Whitepaper-v{release}-…` |
| 07 | Web3 / protocol economics (vector PDF) | **Narrative authority remains [06-Whitepaper.md](../06-Whitepaper.md) + [03-FAQ.md](../03-FAQ.md)**—**not** a second economics story. Reader pointer (no new numbers): [07-Protocol-Tokenomics-Reader.md](../07-Protocol-Tokenomics-Reader.md) | `07-Protocol-Tokenomics-v{release}-…` |
| 08 | Post-NDA map | — (generated index) | `08-Data-Room-Index-v{release}.pdf` |

**Demo** (optional): `export-ready/demo/TravelTrust-Product-Demo-v{release}.mp4` — same **default path** as [**00-START-HERE.md**](../00-START-HERE.md): after **04 Pitch → 03 FAQ**; live briefings may jump to video right after Pitch (same beat sheet as [04-PitchDeck-Storyboard.md](04-PitchDeck-Storyboard.md) **Appendix A**). Target **~90s** (the 15p main deck has **no** dedicated Demo slide). **Current v1.3 zip** may ship **without** mp4 — state that in the cover email. **Before external send:** replace placeholder footage if needed; label **demo/testnet vs production**.

Use **01** for product/market audiences and **02** for protocol- and custody-focused investors.

**Chinese bundle** follows the same order; the banner **版本 / Release** lines must match across CN/EN.

Shipped zip uses `--omit-markdown`; terms are only in signed documents.
