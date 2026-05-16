# Data Room — Markdown originals templates

| **文档控制（IR）** | |
|------|------|
| **Owner** | IR / Legal |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | confidential |
| **Last Updated** | 2026-05-15 |
| **SSOT** | [internal/13-投资人数据室索引.md](../../internal/13-投资人数据室索引.md) · [internal/18-文档治理与生命周期规范.md](../../internal/18-文档治理与生命周期规范.md) |

These **Markdown templates** are the “text originals” for what often becomes **PDF** in `../company/`, `../finance/`, etc. Fill in **redacted** facts only; keep **raw** cap tables and bank statements **out of git** (see [../.gitignore](../.gitignore)).

| Template | Use |
|----------|-----|
| [TEMPLATE-company-overview.md](TEMPLATE-company-overview.md) | Incorporation, jurisdiction, group chart (high level) |
| [TEMPLATE-cap-table-summary-redacted.md](TEMPLATE-cap-table-summary-redacted.md) | Fully diluted **ranges** or classes — no raw sheet |
| [TEMPLATE-financial-summary.md](TEMPLATE-financial-summary.md) | Revenue / burn summary with period labels |
| [TEMPLATE-token-allocation-summary.md](TEMPLATE-token-allocation-summary.md) | Align to `docs/spec/84` + governance-token |

After completion, register the **exported PDF** version and **Version** in [13](../../internal/13-投资人数据室索引.md) and [export-ready](../../external/export-ready/README.md).
