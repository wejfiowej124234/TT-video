# TT Full System Alignment & Stability Program

**Program ID:** `TT_FULL_SYSTEM_ALIGNMENT_STABILITY_PROGRAM`  
**Version:** v1-20260616  
**Phase:** ② Sepolia · GovFreeze V2 Clean Baseline  
**Mode:** **Alignment & stability only** — **≠** governance logic audit · **≠** Tokenomics · **≠** MTM 146 re-audit

---

## 唯一真源

| 层 | SSOT |
|----|------|
| **经济 / 合约** | [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md) |
| **146 行执行** | [TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md](../spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md) |
| **仓库清洁** | [TT-REPOSITORY-ALIGNMENT-CLEANUP-PROGRAM.md](TT-REPOSITORY-ALIGNMENT-CLEANUP-PROGRAM.md) |

---

## 禁止

- 治理币设计 · Tokenomics · GovFreeze V2 · MTM 146 **重复审计**
- Enterprise HAT / four-ledger reconcile **重跑**作为完成度
- 用本程序冒充 Cert Human/Ops/DR 或 ③ Production GO

---

## 执行

```bash
bash scripts/dev/run-tt-full-system-alignment-stability-program.sh
```

**产出：** `evidence/GO_full_system_alignment_stability/<stamp>/`

| 文件 | 内容 |
|------|------|
| `FULL-SYSTEM-ALIGNMENT-INVENTORY.v1.json` | 五类清单 + P0/P1/P2 队列 |
| `FULL-SYSTEM-ALIGNMENT-EXECUTION-CHECKLIST.md` | 分批执行清单 |
| `batch9-stability-probes.json` | API/缓存 probe 证据 |
| `REPOSITORY-ALIGNMENT-INVENTORY-LINK.v1.json` | Batch 8 子扫描链接 |

---

## 九批范围

| Batch | 范围 |
|-------|------|
| 1 | 路由 / UI / 页面入口 |
| 2 | 前端 API / DTO / 权限路径 |
| 3 | 后端 API / DB / migration |
| 4 | ABI / 合约地址 / env / registry / scripts |
| 5 | Admin / 多身份 / RBAC |
| 6 | 业务流程：注册、申请、购买、质押、提案、收益、退出 |
| 7 | 财务 / Treasury / Country Pool / Claim |
| 8 | 文档 / 脚本 / 证据 / 旧资产（含 repo-align 子扫描） |
| 9 | Playwright/API 缓存 probe · 本地 API 可选探针 |

---

## 五类定义

| Tier | 含义 |
|------|------|
| **ACTIVE** | 与当前实现/基线一致 |
| **LEGACY** | 归档 / superseded / 禁止重跑 audit 脚本 |
| **DELETE_CANDIDATE** | 须 Owner 确认后删 |
| **BROKEN** | 路由/API/表缺失 · 阻断对齐 |
| **NEEDS_FIX** | 漂移/别名/注释缺失 · 可维护性债 |

---

## 诚实边界

- Inventory **≠** 自动修复 · BROKEN/NEEDS_FIX 须按 P0→P2 队列执行
- DB **未** 穷举 93 域全矩阵 RBAC 交叉
- Batch 9 本地 API 探针 · API 未启动时为 NEEDS_FIX(P2) · **非** FAIL 全程序
- **① 五主 UI 冻结** — 修复不得触 layout lock
