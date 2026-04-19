# docs 目录说明

## 文档总入口（B-179 · 优先）

**跨类导航**（母表 / TT / spec / Runbook / 临时文档）：**[`00-文档索引.md`](00-文档索引.md)** — **单一入口**；**重复入口裁断**见该文 **「重复入口说明」** 表。

---

## 权威技术文档（AI 与实现必读）

**所有权威技术文档在子目录 [`spec/`](spec/)** 中，便于 AI 与人类快速定位。

- **规范主序列入口**：[spec/00-文档索引.md](spec/00-文档索引.md) — 文档列表与阅读顺序、版本表、发版前必做清单。
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
