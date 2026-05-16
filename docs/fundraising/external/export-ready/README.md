# Signed materials (PDF / PPTX / MP4)

**TravelTrust · Investor materials** · Release **1.3** · May 2026

**Full map (reading order, CN/EN sources, audience)**：see **[../00-README.md](../00-README.md)**（中文总览与单表 00→08）。

**Maintainer · preview send (phase 1):** run the confidential **IR preview-send preflight** at repo root before emailing the zip; rebuild the investor zip when PDFs here are newer than `dist/`. Distribution log stays **off-repo / internal** (not in investor zip).

`export-ready/` is the **sole external artifact staging folder** (no legacy `TravelTrust-IR-*` / `TravelTrust-PitchDeck-*` names). The investor zip renames this tree to **`signed-pdfs/`**. Maintainer workflow does **not** duplicate handoff PDFs beside `external/*.md`; Markdown sources sit in the parent `external/` folder.

**Allowed at this folder root:** `README.md` (maintainers only — **not** in `--omit-markdown` zip), **`00-START-HERE.txt`** (opens with **DEFAULT READ ORDER** matching **`external/00-START-HERE.md`**; includes **LP-facing** email/IM copy/paste snippets; **Partner deep-dive order** sender memo is under **`IR only`** at the end of the `.txt`), numbered **`01`–`08`** PDFs/PPTX as below, optional **`04-IC-Memo-v{release}-CN|EN.{pptx,pdf}`** (Partner Summary / IC appendix), and **`demo/`** (**final `.mp4` only** in shipped zips). Export hygiene rejects stray root files and legacy names.

**Zip layout (`--omit-markdown`):** a second **`00-START-HERE.txt`** is written at the **zip root** with `signed-pdfs/`-prefixed paths so recipients can start from the outer folder; the canonical copy remains **`signed-pdfs/00-START-HERE.txt`** (identical order, relative paths). The generated file opens with the same **RECOMMENDED READ ORDER** as **`external/00-START-HERE.md`**, including a short **bilingual qualitative stage** block (English + one Chinese line: **published announcements + environment labels**; demos/test hosts are not full production unless stated).

## Primary roadshow

| File | Role |
|------|------|
| `04-PitchDeck-v{release}-CN.pptx` / `-EN.pptx` | **15** slides (compressed live deck): same design system + **vector** travel loop, protocol stack, FeeRouter (published **100% / 45% / 55%** layer-1 only) + positioning / roadmap / matrix / close |
| `04-PitchDeck-v{release}-CN.pdf` / `-EN.pdf` | Same deck as print/PDF-friendly export |
| `04-IC-Memo-v{release}-CN.pptx` / `-EN.pptx` | **Optional** Partner Summary / IC memo (**8** slides); same chrome; **no** new economics; run `build-investor-ic-appendix.py` or default tail of `build-investor-pitch-deck.py` |
| `04-IC-Memo-v{release}-CN.pdf` / `-EN.pdf` | IC appendix print export |
| `demo/TravelTrust-Product-Demo-v{release}.mp4` | **~90s** one-take walkthrough target (same beat sheet as [04-PitchDeck-Storyboard.md](../04-PitchDeck-Storyboard.md) **附录 A** / `en/04` **Appendix A**; main 15p deck has **no** dedicated Demo slide). **Shipped zips include only the final mp4** (no maintainer brief/README under `demo/`). **Only include** when capture is final; **omit** if not ready and say so in email; label **demo/testnet vs production** in-frame or VO. Maintainer recording notes: `demo/SCREEN-RECORDING-BRIEF.txt` (maintainer workspace only; not in shipped zip). |

Regenerate Deck: maintainer IR checklist (confidential).

## Institutional IR PDF pack (01–08)

Brand-consistent A4 PDFs (cover, disclaimer, headers): narrative is rendered from the **`external/*.md`** investor Markdown sources; PDFs use **in-pack PDF cross-refs** (no `.md` paths). Protocol/token boundary supplement **does not** add economic percentages beyond the published investor Whitepaper (45% / 55% / 100% closure).

| File | Source |
|------|--------|
| `01-OnePager-v{release}-CN.pdf` / `-EN.pdf` | `01-OnePager.md` / `en/01-OnePager.md` |
| `02-Executive-Summary-v{release}-CN.pdf` / `-EN.pdf` | `02-Investor-Executive-Summary.md` / `en/02-…` |
| `03-FAQ-v{release}-CN.pdf` / `-EN.pdf` | `03-FAQ.md` / `en/03-FAQ.md` |
| `05-Litepaper-v{release}-CN.pdf` / `-EN.pdf` | `05-Litepaper.md` / `en/05-Litepaper.md` |
| `06-Whitepaper-v{release}-CN.pdf` / `-EN.pdf` | `06-Whitepaper.md` / `en/06-Whitepaper.md` |
| `07-Protocol-Tokenomics-v{release}-CN.pdf` / `-EN.pdf` | Narrative §1–3 from maintainer brief + **four vector diagram pages** (loop, stack, FeeRouter, three-lane boundary); **no new %** beyond published Whitepaper |
| `08-Data-Room-Index-v{release}.pdf` | Generated: **cover** + pack map / NDA banner + **NDA slice transparency** (categories only—no secrets); typically **3** pages; not a substitute for counsel-approved data-room contents |

Regenerate IR PDFs: maintainer tooling (name in confidential IR export checklist).

**Slug `release`** must match the **Release** version governed by maintainer numeric-anchor policy (same number as this pack header).

## Slides narrative source

Markdown **`04` / `en/04`** remains the slide-by-slide content source; there is **no** separate storyboard PDF.

## Maintainer navigation (repo workspace)

| Need | Open |
|------|------|
| **Edit narrative** | Parent `external/*.md` and `external/en/*.md` — **not** PDF alone |
| **Ship / preview PDFs** | This folder (`export-ready/`) |
| **Recommended read order** | `00-START-HERE.txt` (also in zip as `signed-pdfs/00-START-HERE.txt`) |
| **Deep DD whitepaper** | `06-Whitepaper-v{release}-CN.pdf` / `-EN.pdf` (**~15–25 pages**; **06** is not cold-start) |
| **Outbound zip only** | `dist/TravelTrust-Investor-Materials-v{release}.zip` — see `dist/README.txt` |
| **Retired zips** | `dist/archive/` — **do not** send to LPs |

**IDE PDF preview:** Cursor/VS Code may show only the first few pages and a **More Pages** control; use Acrobat/Edge for full page count. Workspace **file nesting** collapses `*-EN.pdf` under `*-CN.pdf` in the explorer (display only; zip layout unchanged; **expand defaults on** in root `.vscode/settings.json`).

**Monorepo Git vs mirror:** Signed PDFs/PPTX live at **this folder root** (not under `demo/`). They must be **`git add`**’d in TravelTrust; mirror push is `bash scripts/push-fundraising-to-yinhang744.sh` → `yinhang744-dev/fundraising`. Gate: `bash scripts/gates/check-fundraising-monorepo-tracked.sh`.
