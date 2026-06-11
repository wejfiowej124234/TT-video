# Frontend 文档入口（前端 / Web / 可验证发布）

本目录用于**前端相关文档的导航**。为避免破坏既有引用，现阶段不移动既有文档文件（仍以 `docs/spec/05-前端总览.md` 为权威正文），这里只提供稳定入口与跳转。

## 主要文档

- **顶栏五主路由 · ① UI 壳冻结（单一前端版本 SSOT）**：[../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) → 各 `frontend/app/*/README.md` → [88 §一](../spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)（**`/`** · **`/traveltrust`** · **`/market`** · **`/did-rank`** · **`/community/*`**；**非** `archive/ui-v1`）
- **`/` Web3旅行 + 自由市场三页 · ① 代码/UI/数据链 SSOT**：[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · [`app/(home)/README`](../../frontend/app/(home)/README.md) · [`app/market/README`](../../frontend/app/market/README.md)
- **`/did-rank` 排行榜 · ① 代码/数据链 SSOT**：[DID-RANK-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/DID-RANK-PHASE1-FREEZE.md) · [`app/did-rank/README`](../../frontend/app/did-rank/README.md)（五端点 HTTP · SSR **`is_me`** · devPreview 生产硬关）· [30-DID](../spec/30-DID排行榜-页面规范.md) · `bash scripts/dev/run-did-rank-l5-green.sh`
- **`/community/*` TT社区 · ① 代码/数据链 SSOT**：[COMMUNITY-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE1-FREEZE.md) · [`app/community/README`](../../frontend/app/community/README.md)（**`feed?q=`** · **`me/activity`** · **`explore/destinations`** · feedback server-only）· [31-TT社区](../spec/31-TT社区页面设计.md) **v2.13** · `bash scripts/dev/run-community-l5-green.sh`
- **五主路由 · 企业级代码真源对拍（2026-06-03）**：[FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md)（十维矩阵 · AF 勘误 · ① 分轨验收）
- **五页 L5 审计总表（① P1 · ②③ backlog）**：[FIVE-PAGES-L5-AUDIT-TASKS](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-PAGES-L5-AUDIT-TASKS.md) · [GO_local README 文档↔代码表](../../frontend/evidence/GO_local_marketing_front_closure/README.md)
- **多重身份 · 商家入驻（① · 非五主 · L5 冻结）**：[../../frontend/app/provider/register/README.md](../../frontend/app/provider/register/README.md) · [PROVIDER-REGISTER-UI-FREEZE](../../frontend/evidence/GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md) · [88 §1.2](../spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) · [13-1 表 1 Identity 行](../spec/13-1-UI产品级SSOT与页面规范.md)
- 协议级 UI 设计宪法（UI/UX 最高约束，优先）：[../spec/13-协议级UI设计宪法.md](../spec/13-协议级UI设计宪法.md)
- UI 产品级 SSOT 与页面规范（页面地图/RBAC/Zone Control/异常态，避免 AI 跑偏）：[../spec/13-1-UI产品级SSOT与页面规范.md](../spec/13-1-UI产品级SSOT与页面规范.md)
- UI+3D 融合规范（旅游+Web3，视觉/动效/3D/组件/验收门禁）：[../spec/21-UI-3D-旅游Web3融合规范-v1.0.md](../spec/21-UI-3D-旅游Web3融合规范-v1.0.md)
- Design Tokens + UI 数值体系（可直接实现）：[../spec/22-Design-Tokens-旅游Web3融合体系-v1.0.md](../spec/22-Design-Tokens-旅游Web3融合体系-v1.0.md)
- UI 交付物（Tailwind/Figma/Landing/Escrow 模板）：[../spec/23-UI交付物-Figma-Landing-Escrow模板.md](../spec/23-UI交付物-Figma-Landing-Escrow模板.md)
- 前端总览（权威正文）：[../spec/05-前端总览.md](../spec/05-前端总览.md)
- DApp 架构总览（钱包/签名/链交互）：[../spec/06-DApp架构总览.md](../spec/06-DApp架构总览.md)
- 合约与 ABI 对齐（实现时）：[../spec/14-合约-API-ABI-前后端对齐.md](../spec/14-合约-API-ABI-前后端对齐.md)

## 架构目录（本目录补充）

- 前端架构目录（中文命名）：[架构目录.md](架构目录.md)

## 可验证发布

- 前端构建产物 manifest：按 [evidence/README](../../evidence/README.md) 可验证发布段落手工生成 manifest.json、manifest.sha256（原 build-frontend-manifest.sh 已移除）
- deterministic 验证（本地自检）：按 evidence/README 与发版前核对执行（原 verify-frontend-deterministic-build.sh 已移除）

## 代码落点（仓库结构）

- 前端（Next.js + React + TypeScript）：`frontend/`。技术栈以 [09 §2.6 标准分层表](../spec/09-技术架构总览-v1.0.md)、§2.7 DApp+3D 定稿方案 为准。
- 页面：`frontend/app/`（App Router）或 `frontend/pages/`
- API / 状态：`frontend/lib/`；DApp：`frontend/dapp/`（wagmi + viem）

文档索引与版本表见 [00-文档索引](../spec/00-文档索引.md)。
