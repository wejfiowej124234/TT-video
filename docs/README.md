# docs 目录说明

## 文档总入口（B-179 · 优先）

**跨类导航**（母表 / TT / spec / Runbook / 临时文档）：**[`00-文档索引.md`](00-文档索引.md)** — **单一入口**；**重复入口裁断**见该文 **「重复入口说明」** 表。

---

## 权威技术文档（AI 与实现必读）

**所有权威技术文档在子目录 [`spec/`](spec/)** 中，便于 AI 与人类快速定位。

- **规范主序列入口**：[spec/00-文档索引.md](spec/00-文档索引.md) — 文档列表与阅读顺序、版本表、发版前必做清单。
- **顶栏五主路由 · ① 代码真源（企业级 · 2026-06-03）**：[FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603](../frontend/evidence/GO_local_marketing_front_closure/FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md)（十维矩阵 · **AF-01～13**）· **UI 冻结** [FIVE-MAIN-ROUTES](../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) → [frontend/app/*/README.md](../frontend/app/) → [spec/88 §一](spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)
- **`/` Web3旅行 + 自由市场三页（① · 代码/UI/数据链 SSOT）**：[LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · [`app/(home)/README`](../frontend/app/(home)/README.md) · [`app/market/README`](../frontend/app/market/README.md) · **① 剩余** [WEB3-LANDING-MARKET-LOCAL-REMAINING](../frontend/evidence/GO_local_web3_pages_closure/WEB3-LANDING-MARKET-LOCAL-REMAINING.md)
- **多重身份 · 商家入驻全链（① · 代码 SSOT）**：[frontend/app/provider/register/README.md](../frontend/app/provider/register/README.md) · [TT-9618 §2.1](runbook/TT-9618-onboarding-local-testnet.md) · [spec/04 §3.4](spec/04-后端与API.md) · **烟测** `bash scripts/dev/smoke-provider-onboarding-local.sh` · **文档对齐话术** [AI协作话术 §0.3a](AI协作话术-减负与边界.md#ai-collab-provider-onboarding-doc-only)
- **多重身份 · 旅行收购 PD-009（① · 代码 SSOT）**：Hub [frontend/app/me/identities/README.md](../frontend/app/me/identities/README.md) → 子站 [frontend/app/market/acquisition/README.md](../frontend/app/market/acquisition/README.md) · [acquisition-publish-trust-rules §8.1](spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27) · [spec/04 §读前](spec/04-后端与API.md) · **烟测** `bash scripts/dev/smoke-acquisition-pd009-local.sh` · **文档对齐话术** [AI协作话术 §0.3b](AI协作话术-减负与边界.md#ai-collab-acquisition-pd009-doc-only)
- **代码映射与时点快照（方案 A）**：[spec/code-maps/README.md](spec/code-maps/README.md)、[spec/snapshots/README.md](spec/snapshots/README.md) — **62/57/补充实装、58/60/61/67、28 审计·对照四篇、24/26、00 整理清单** 等；主链 **01/04/07/14/53/110** 与 **28-Cinematic…** 仍在 **spec/** 根。
- **内容**：00～27、08-0～08-5、13-1、企业级审计报告等均位于 `docs/spec/`（含上述子目录），实现与审计以该目录为准。

## 开发过程临时文档

开发过程中产生的**临时性、草稿、会议纪要、迭代笔记**等请直接放在 **`docs/` 根目录**（与 `spec/` 并列），不要放入 `spec/`。

- `spec/`：仅放已定稿/权威技术文档，保持可被 AI 稳定引用。
- `docs/` 根目录：可随意新增临时 .md，发版前按 15 与 00 决定是否纳入或归档。

## 导航子目录

- [runbook/](runbook/) — 运维阶梯与 Epic 收口（含 **[封口项目与 Epic 总索引](runbook/sealed-programs-and-epics-master-index.md)**）
- [spec/](spec/) — 权威技术文档（00～27、08 系列等；**[code-maps/](spec/code-maps/README.md)** / **[snapshots/](spec/snapshots/README.md)** 见子目录说明）
- [backend/](backend/) — 后端文档导航与架构目录
- [frontend/](frontend/) — 前端文档导航与架构目录
- [dapp/](dapp/) — DApp 文档导航与架构目录
