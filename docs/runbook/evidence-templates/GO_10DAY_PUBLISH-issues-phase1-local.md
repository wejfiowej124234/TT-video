# 阶段一 · ① 本地问题清单（PI-1）

**真源路径：** `evidence/GO_YYYYMMDD/issues-phase1-local.md`（本模板复制后改名使用）  
**TravelTrust v6 闭卷表（docs 镜像，可入仓）：** [issues-phase1-local-traveltrust-v6.md](../issues-phase1-local-traveltrust-v6.md) · [issues-phase1-ui-ux-traveltrust-v6.md](../issues-phase1-ui-ux-traveltrust-v6.md) · [TT-PH1 审计](../TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md)  
**主表：** [TT-MASTER · PI-1](../TT-MASTER-PUBLISH-GO-CHECKLIST-001.md#tt-master-publish-pi1-gate)  
**可选并行登记：** `issues-phase1-ui-ux.md`（UI 手验专表）；**闭卷判据以本文件为准**，两文件须互链或合并，避免 P0 状态不一致。  
**签字前硬条件：** 本表所有 **P0** 行 `状态=closed`；**P1** 已 `closed` 或 **defer** 列写明目标阶段与理由。

## 图例

| 优先级 | 含义 |
|--------|------|
| **P0** | 挡 **PH-1**（主路径不可用 / 严重误导 / 严重可读性） |
| **P1** | 应修；可 defer 到阶段二/三并登记 |
| **P2** | backlog；不挡 PH-1 |

| 状态 | 含义 |
|------|------|
| open | 未处理 |
| fix | 修复中 |
| verify | 待手验 |
| closed | 已闭 |
| defer | 延期（须填 defer 列） |

---

## 问题登记

| ID | 优先级 | 页面/路由 | 现象 | 处理 / 证据 | defer | 状态 |
|----|--------|-----------|------|-------------|-------|------|
| | | | | | | open |

---

## 阶段一出口核对（签 PH-1 前）

- [x] 上表 **P0** 全部为 **closed** — 闭卷见 [issues-phase1-local-traveltrust-v6.md](../issues-phase1-local-traveltrust-v6.md)
- [x] **P1** 无未说明的 **open**（defer 已登记 **②**）
- [x] `local-smoke.md` 已更新 — [dev-local-smoke-baseline.md](../../dev-local-smoke-baseline.md)
- [x] `phase-signoff.md` **PH-1** — **Sebastian Ward** · 2026-06-03（本模板 + [GO_10DAY_PUBLISH-phase-signoff.md](./GO_10DAY_PUBLISH-phase-signoff.md)）

**清单维护者签字：** **Sebastian Ward（塞巴斯蒂安·沃德）**　日期：2026-06-03
