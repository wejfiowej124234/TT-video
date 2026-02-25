# Frontend 文档入口（前端 / Web / 可验证发布）

本目录用于**前端相关文档的导航**。为避免破坏既有引用，现阶段不移动既有文档文件（仍以 `docs/spec/05-前端总览.md` 为权威正文），这里只提供稳定入口与跳转。

## 主要文档

- 协议级 UI 设计宪法（UI/UX 最高约束，优先）：[../13-协议级UI设计宪法.md](../13-协议级UI设计宪法.md)
- UI 产品级 SSOT 与页面规范（页面地图/RBAC/Zone Control/异常态，避免 AI 跑偏）：[../13-1-UI产品级SSOT与页面规范.md](../13-1-UI产品级SSOT与页面规范.md)
- UI+3D 融合规范（旅游+Web3，视觉/动效/3D/组件/验收门禁）：[../21-UI-3D-旅游Web3融合规范-v1.0.md](../21-UI-3D-旅游Web3融合规范-v1.0.md)
- Design Tokens + UI 数值体系（可直接实现）：[../22-Design-Tokens-旅游Web3融合体系-v1.0.md](../22-Design-Tokens-旅游Web3融合体系-v1.0.md)
- UI 交付物（Tailwind/Figma/Landing/Escrow 模板）：[../23-UI交付物-Figma-Landing-Escrow模板.md](../23-UI交付物-Figma-Landing-Escrow模板.md)
- 前端总览（权威正文）：[../05-前端总览.md](../05-前端总览.md)
- DApp 架构总览（钱包/签名/链交互）：[../06-DApp架构总览.md](../06-DApp架构总览.md)
- 合约与 ABI 对齐（实现时）：[../14-合约-API-ABI-前后端对齐.md](../14-合约-API-ABI-前后端对齐.md)

## 架构目录（本目录补充）

- 前端架构目录（中文命名）：[架构目录.md](架构目录.md)

## 可验证发布

- 前端构建产物 manifest：脚本位于 `scripts/build-frontend-manifest.sh`
- deterministic 验证（本地自检）：脚本位于 `scripts/verify-frontend-deterministic-build.sh`

## 代码落点（仓库结构）

- 前端（Next.js + React + TypeScript）：`frontend/`。技术栈以 [09 §2.6 标准分层表](../09-技术架构总览-v1.0.md)、§2.7 DApp+3D 定稿方案 为准。
- 页面：`frontend/app/`（App Router）或 `frontend/pages/`
- API / 状态：`frontend/lib/`；DApp：`frontend/dapp/`（wagmi + viem）

文档索引与版本表见 [00-文档索引](../00-文档索引.md)。
