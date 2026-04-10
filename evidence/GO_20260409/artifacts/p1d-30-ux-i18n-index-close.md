# P1-D · 30-UX i18n — 工程索引互证（30 §5 / §8 ↔ locales）

**TT**：`TT-07-63B-P1D-30-UX-I18N-INDEX-001` · **日期**：2026-04-09  

**范围**：仓库内**索引级**互证 — **不**新增页面/路由；**不**填运营长文案或替代法务对 **08-4** 等全文定稿；**不**修改 **07** 文首完成度百分比。

## 1. 规范 SSOT

| 文档 | 用途 |
|------|------|
| [30-UI-UX全方位检查报告.md](../../../docs/spec/30-UI-UX全方位检查报告.md) **§5** | 首轮建议 key 与组件落点（**历史归档**；实现态以 **§8** 为准） |
| 同文 **§8** | 与代码同步的**已闭环**项（根 error/loading、`empty_*`、`escrow_*`、`common_*`、社区/did-rank error、`html lang`、`prefer-reduced-motion` 等） |
| 同文 **读前摘要** | **§2～§7** 与 **§8** 防误读说明 |

## 2. 消息真源与机读门禁

| 项 | 落点 |
|----|------|
| 中文消息 | `frontend/locales/zh.ts`（`export default { … }` 扁平键） |
| 英文消息 | `frontend/locales/en.ts`（与 **zh** 同键集合；CI 校验覆盖） |
| 键覆盖 CI | `frontend/package.json` → **`npm run test:i18n:ci`** → `scripts/check-i18n-coverage.mjs`；报告 **`frontend/.i18n-coverage.json`**（根目录亦有同名报告文件时可并存，以 **`frontend/`** 下为准） |

**不替代**：`test:i18n:ci` 绿只表示 **zh/en 键对齐**，**不**保证文案法务合格或全站无漏网硬编码。

## 3. 键空间（前缀）→ 页面 / 模块映射（摘要）

下列按 **`键名首段`（`_` 前）** 聚类，计数来自 **`zh.ts` 顶层键** 扫描（**2026-04-09** 仓库快照；新键会随迭代变化）。**路由**为工程常见挂载面，**非**完整 `t("…")` 反查表。

| 前缀族（示例） | 量级（约） | 主要页面 / 模块 |
|----------------|-----------|-----------------|
| `common_*` | ~26 | 根 **`app/error.tsx`**、**`app/loading.tsx`**、**LoadingText**、通用按钮与限流提示（与 **30 §8**「根 error/loading」一致） |
| `empty_*` | ~15 | **`components/market/EmptyState.tsx`**、空态导航 aria（与 **30 §5** 表 · **§8** EmptyState 行一致） |
| `escrow_*` | ~308 | **`app/escrow/**`**、**`EscrowDetail`**、**`app/escrow/error.tsx`**（与 **30 §5** · **§8** 托管域一致） |
| `market_*` | ~172 | **`app/market/**`**、市场 error（**`market_errorTitle`** 等） |
| `community_*` | ~525 | **`app/community/**`**、**`community/error.tsx`**、Feed 等（**§8** 社区 error/壳层） |
| `didRank_*` | ~91 | **`app/did-rank/**`**、**`did-rank/error.tsx`** |
| `governance_*` | ~301 | **`app/governance/**`** 各子页 metadata 与 UI 键 |
| `help_*` | ~38 | **`/help`** — 细目见 **`p1d-help-center-close.md`**（本文件不重复键表） |
| `admin_*` | ~1473 | **`app/admin/**`** 运营控制台文案主体 |
| `orders_*` / `order_*` / `pay_*` / `dispute_*` 等 | 若干 | 订单主链、支付、争议、评分等（与 **01/04/53** 页面并存） |
| `*_meta_title` / `*_meta_description` | 分散在多前缀下 | 各 **`layout.tsx` / `generateMetadata`** 与 SEO 摘要（**非** **30 §5** 表逐项列出） |

## 4. 缺失 / 占位（工程口径）

| 类型 | 说明 |
|------|------|
| **新页面 / 新可见串** | 须按 **30 §5** 命名习惯在 **zh/en** 同步加键；合并前跑 **`npm run test:i18n:ci`**（见 §2）。 |
| **法务/运营待定** | 部分 **`*_meta_description`** 或正文键保留「摘要 / 待法务」类表述（例：**`community_guidelines_meta_description`**）— **不**在本 artifact 展开逐条；定稿责任仍在产品/法务与 **08-4** 流程。 |
| **§2～§7 历史表** | **30** 篇首已声明以 **§1 + §8** 为验收态；**勿**将旧「可优化点」表当作当前缺口清单。 |
| **硬编码抽检** | 缺口官方总表 **核查流水** 步骤 6 仍建议对 `frontend/app/itinerary/**` 等路径抽检；**不**替代本索引。 |

## 5. `manifest.json` / `manifest.sha256` 互证

本文件路径 **`artifacts/p1d-30-ux-i18n-index-close.md`** 登记于同目录 **`manifest.json`** 的 **`artifacts[]`**（含 **`path`** + **`sha256`**）；**`manifest.json`** 本体由 **`manifest.sha256`** 校验。**`bundle_note`** 含 **TT-07-63B-P1D-30-UX-I18N-INDEX-001** 摘要句。

## 6. 缺口官方总表

[缺口与待补-官方总表.md](../../../docs/spec/缺口与待补-官方总表.md) **P1-D** 表「**30-UX i18n**」行：**☑ 2026-04-09 工程互证**（本文件 + **`manifest`**），**TT** 同文首。

## 7. 机读自检（本卡）

- `bash scripts/check-governance-doc-linkage.sh` — 文档链接门禁（改 spec / evidence 路径后须绿）。

**不跑**：全量 `npm test` / `npm run test:i18n:ci`（非本卡必跑；发版流水线或本地改 locales 时建议执行）。
