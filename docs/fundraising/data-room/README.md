# data-room — 投资人数据室（文件仓）

| **文档控制（IR）** | |
|------|------|
| **Owner** | IR / Legal |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | confidential |
| **Last Updated** | 2026-05-15 |
| **SSOT** | `docs/fundraising/internal/13-投资人数据室索引.md` · `docs/fundraising/internal/18-文档治理与生命周期规范.md` · `docs/fundraising/internal/19-对外分发与访问登记.md` |

**索引台账**（状态、版本、分享记录）：[internal/13-投资人数据室索引.md](../internal/13-投资人数据室索引.md)

**生命周期 / 归档**：见 [internal/18-文档治理与生命周期规范.md](../internal/18-文档治理与生命周期规范.md)。**对外分发留痕**：见 [internal/19-对外分发与访问登记.md](../internal/19-对外分发与访问登记.md)。

## 目录约定

| 子目录 | 用途 |
|--------|------|
| `company/` | 注册、股权摘要 |
| `team/` | 团队简历 |
| `finance/` | 报表与对账摘要 |
| `token/` | 分配与经济学摘录 |
| `audit/` | 审计与安全报告 |
| `product/` | 脱敏演示与截图 |
| `evidence/` | 测试网/验收证据（索引 [evidence/README.md](evidence/README.md)） |

本目录根 **`.gitignore`**：默认不提交 PDF、表格、压缩包等原件（防误入库）；各子目录以 **`.gitkeep`** 占位。

**Markdown 原件模板**（脱敏填写后再导出 PDF）：[templates/README.md](templates/README.md)

签核 PDF 对外定稿亦可复制至 [external/export-ready/](../external/export-ready/README.md) 并在 [10-资料室索引](../internal/10-资料室索引.md) 登记。

**勿**将 spec 技术正文复制进本目录 — 链接 `docs/spec/` SSOT 即可。
