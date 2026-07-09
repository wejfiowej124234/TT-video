# Phase① 收敛执行纪律（Convergence Execution Discipline）

**Status:** **ACTIVE · FINAL CONVERGENCE · STRUCTURE FROZEN v1.14.0**  
**Standard:** [TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md](TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md) **v1.14.0**（**结构/域/维度冻结** — 见 [最终收敛冻结](TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md)）  
**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产 — **须顺序，禁止跳阶**

---

## 1 · 政策（写死）

| 禁止 | 允许 |
|------|------|
| 新增 DOMAIN / D77+ / 扩标准 § | Sprint-A 关 RC · bugfix · 数据链 · 收敛修复 |
| 无 MASTER 合并 main | MASTER 全绿 + 基线 PASS + Readiness 不下降 |
| Readiness 下降仍合并 | Readiness ↑  toward **90** / **95** |

## 2 · 适用范围（任何本地代码改动）

开发 · 重构 · UI（含五主冻结域内数据链）· 权限 · DB · API/ABI · Admin · 多身份 · 发布中心 · 订单 · 治理 · 社区 · 商家工作台 · 脚本/文档机读路径 等 **全部** 改动。

## 3 · 固定闭环

```
开发 → FULL MASTER → PEB/EX 再生 → 基线对比 → 修复 → 复审 → 归档
```

## 4 · 必跑命令（合并 main 前）

```bash
bash scripts/dev/run-phase1-convergence-post-change-gate.sh
```

**内含：**

1. `run-phase1-convergence-full-master.sh` — PF · DOA · LFC · PGX · AG · MA · FZ · QA2 · PEB · EX（**无 `SKIP_DOMAIN_*`**）
2. 再生 **Executive Freeze Dashboard** · Top10 Root Causes · Top20 Blockers · Closure Roadmap · Readiness
3. `compare-phase1-convergence-baseline.py` — 对比 `evidence/GO_phase1_convergence/baseline/`

**成功 grep：**

- `TT_PHASE1_CONVERGENCE_POST_CHANGE: OK`
- `TT_FULL_SYSTEM_AUDIT_MASTER: READY`
- `TT_PHASE1_CONVERGENCE_BASELINE: PASS`

## 5 · 合并闸（Merge Gate）

| 条件 | 要求 |
|------|------|
| FULL MASTER | **全绿** exit 0 |
| Readiness | **≥ 上次基线**（不可下降） |
| Open P0 | **无新增** · 计数不可增 |
| 回归 | 无权限/文档/架构/治理退化（MASTER 子闸覆盖） |
| UI/UX | 五主/冻结域内 **仅数据链**；结构变更 **禁止** |

**失败：** `TT_PHASE1_CONVERGENCE_POST_CHANGE: FAIL` → **禁止** 合并 main。

## 6 · Sprint-A 目标（直至 FREEZE）

| 根因 | 域 | 目标 |
|------|-----|------|
| **RC-01** | PF · CX · UXA | IA 重复 MERGE |
| **RC-02** | DOA | 路径/registry UPDATE |
| **RC-03** | AG | RBAC 边界 REFACTOR |

**Readiness 里程碑：**

| Band | Score | 含义 |
|------|-------|------|
| FREEZE_CANDIDATE | **≥90** | 可评审 Phase① 冻结 |
| PHASE1_EXIT_READY | **≥95** | Owner 签字候选 |

## 7 · 基线管理

```bash
# 首次或 Owner 批准重置基线
bash scripts/dev/run-phase1-convergence-post-change-gate.sh --init-baseline

# 仅从已有 PEB 目录更新基线
bash scripts/dev/record-phase1-convergence-baseline.sh evidence/.../peb
```

证据：`evidence/GO_phase1_convergence/` — 见 [README](../evidence/GO_phase1_convergence/README.md)

## 8 · 诚实边界

- 本纪律 = **① 本地收敛**；**≠** ② staging 全矩阵 GO · **≠** ③ Production GO
- `SKIP_*_ROUTES=1` 仅用于 ① 重路由探针；**不**等于跳过 DOMAIN 包
- ISS-007 / 窄切片 `report.json` GO **不得** 冒充 ②③ — [CONTRIBUTING · 禁止假完成](../CONTRIBUTING.md#no-false-completion)

## 9 · 最终收敛（结构冻结 · 逐页法证）

见 **[TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md](TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md)** — **v1.14.0 结构冻结** · P0 追踪 · 全站逐页法证（**非新 DOMAIN**）：

```bash
bash scripts/dev/run-phase1-site-page-forensic.sh
```

**grep:** `TT_PHASE1_FINAL_CONVERGENCE: ACTIVE` · `TT_PHASE1_STANDARD_STRUCTURE: FROZEN_v1.14.0`

**末行 grep：** `TT_PHASE1_CONVERGENCE_DISCIPLINE: ACTIVE`
