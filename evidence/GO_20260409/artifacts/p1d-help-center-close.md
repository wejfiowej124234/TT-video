# P1-D 帮助中心 — 工程互证（08-4 /help / i18n）

**TT**：`TT-07-63B-P1D-HELP-CENTER-001` · **日期**：2026-04-09  

**范围**：仓库内**索引级**互证 — **不**新增页面/功能；**不**替代法务对 **08-4** 全文签字定稿或运营逐条审阅。

## 1. 页面与路由

| 项 | 落点 |
|----|------|
| 路由 | **`/help`**（Next.js `app` 路由） |
| 页面组件 | `frontend/app/help/page.tsx`（注释已声明与 **08-4** 第 1～6 章用户侧口径对齐） |
| 可及性 | `aria-label={t("help_title")}`；**`help_title`** zh「帮助中心」/ en「Help」 |

## 2. i18n 键（zh / en 成对）

源文件：`frontend/locales/zh.ts`、`frontend/locales/en.ts`。

| 键 | 用户可见用途（摘要） |
|----|---------------------|
| `help_title` | 页标题 |
| `help_desc` | 引导：与 ToS / 隐私 / **08-4** 一致；完整法务以定稿为准 |
| `help_platformBullet1` | 协议定位 + Escrow + **不托管** |
| `help_platformBullet2` | 多签 Pause/冻结 = 运维应急；Pause 不转移所有权 |
| `help_platformBullet3` | **混合治理态**；非「纯无许可、完全链上自治」— 见 ToS 与 **08-4** |
| `help_disputesParagraph` | 争议/证据/仲裁以 ToS 与 **08-4** 为准；**Pause** 期间可查看与提交申诉、不可新建单/链上转出；恢复见 **08-4 第 6 章** |
| `help_faqTitle` + `help_faqPayQ/A/Cta/...` 等 | FAQ（支付、质押、托管、FeeRouter、争议、社区等） |

**双语一致性**：同一键在 **zh** 与 **en** 语义对齐（非字面对译由运营可后精修；本 artifact 只记录键级成对存在）。

## 3. 与 08-4 第 1～6 章对应关系（索引）

| 08-4 章节 | 帮助页承载方式 |
|-----------|----------------|
| **第 1 章** 一句话 / 当前阶段 | `help_platformBullet1`（去中心化协议、Escrow、不托管）；`help_platformBullet3`（混合治理态） |
| **第 2 章** 不托管 / 多签与 Pause 边界 | `help_platformBullet1`～`3`、`help_disputesParagraph` |
| **第 3 章** 仲裁范围与流程总则 | `help_disputesParagraph`；FAQ **`help_faqDispute*`** 指向争议入口与 ToS/08-4 |
| **第 4～5 章** 统计披露 / 稳定币与冻结 | 帮助页**未**逐段展开；用户侧以 ToS + **08-4** 全文为准（与 `help_desc` 一致） |
| **第 6 章** Pause 期间能力 / 恢复 | `help_disputesParagraph` 明确 Pause 行为与「第 6 章」索引 |

**08-4 文档内索引**：`docs/spec/08-4-对外口径包.md` **§6** 末条「**P1-D 勾选互证索引**」指向本文件与同目录 **`manifest.json`** / **`manifest.sha256`**。

## 4. 缺口官方总表

[缺口与待补-官方总表.md](../../../docs/spec/缺口与待补-官方总表.md) **P1-D** 表「**帮助中心**」行：**☑ 2026-04-09 工程互证**，**TT** 同本文件文首。

## 5. 机读自检（本卡）

- `bash scripts/check-governance-doc-linkage.sh` — 文档链接门禁（本批修改 spec / evidence 路径后须绿）。

**不跑**：全量 `npm test` / E2E（非本卡范围；**help** 既有 `frontend/app/help/page.test.tsx` 未改）。
