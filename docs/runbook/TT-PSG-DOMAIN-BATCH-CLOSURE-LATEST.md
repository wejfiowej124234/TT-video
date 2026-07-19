# PSG · Domain Batch Closure（域批闭环）

**Machine:** `TT_PSG_DOMAIN_BATCH_CLOSURE`  
**Status:** **ACTIVE** · `2026-07-19`  
**机读：** [`registry/psg-domain-batch-closure.v1.yaml`](../../registry/psg-domain-batch-closure.v1.yaml)  
**Consistency（硬闸）：** [Consistency Control](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md)  
**Closure Board：** [Consistency Closure Board](./TT-PSG-COVERAGE-CONSISTENCY-CLOSURE-BOARD-LATEST.md)  
**Register：** [Production Readiness Register](./TT-PRODUCTION-READINESS-REGISTER-LATEST.md)

> **唯一执行模式（本窗）：** 按域批量闭环 · **禁止**跨域堆问题 · **禁止**单点修复频繁 Staging 部署。  
> 每域必须走完 Consistency Alignment Loop，才进入下一域。  
> **LOCAL_PASS ≠ ALIGNED_PASS** · **禁止伪造 ALIGNED**。

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Domain Batch:        ACTIVE
Active Domain:       (see registry / §3)
Consistency:         NOT_ALIGNED until domain batch ALIGNED
```

---

## 0 · 域序（写死 · 禁止跳序）

```text
RBAC → Journey → Data → UI → Web3
```

| # | Domain | Measurement cite | 本窗默认 |
|---|--------|------------------|----------|
| 1 | **RBAC** | RBAC cells | 先闭 Staging ALIGNED（既有 LOCAL 格） |
| 2 | **Journey** | User_Journey J1–J5 | RBAC ALIGNED 后 |
| 3 | **Data** | Data_Lifecycle | Journey ALIGNED 后 |
| 4 | **UI** | UI_UX_P0 | Data ALIGNED 后 |
| 5 | **Web3** | Security/Web3 · Fix Required | **HOLD** · 仅 Release Window / Fix=8 · **本模式不提前开** |

**禁止：** 为刷 RBAC 96/96 扩测（36×N/A 结构问题另裁定）· 跳到 Web3「顺手修」。

---

## 1 · 单域闭环（Domain Loop）

每个域 **只允许一轮** Staging 部署（除非 COMPILE/DEPLOY 硬失败重试同 SHA）：

```text
① 覆盖测试（仅本域格 / 本域探针）
        ↓
② 问题自动挂 PSG Register（Issue ID · Cell · Owner）—— 本域内可积压多条
        ↓
③ 最小修复（本域批内合并 · 禁止边修边部署）
        ↓
④ Local PASS（本域复验整批）
        ↓
⑤ Git SHA 固化（本域一批一个 tip SHA · Coverage 路径 clean）
        ↓
⑥ Staging 同 SHA 部署（本域一次）
        ↓
⑦ meta / migration / environment 对拍
        ↓
⑧ Evidence：coverage_run（environment=staging · ALIGNED_PASS）
        ↓
⑨ Coverage Recalculate（仅 ALIGNED 分子）
        ↓
⑩ 下一域（仅当本域 Consistency L1–L5 对该域目标 PASS）
```

### 批内允许 vs 禁止

| 允许 | 禁止 |
|------|------|
| 本域多 Finding → 一批 Register | 跨域同时开修 |
| 本域多 min-fix → 一次 commit tip | 每修一个小点就 `fly deploy` |
| 同 SHA 部署失败后同 tip 重试 | 未 Register 静默改代码 |
| Consistency Gate 审计 NOT_ALIGNED | 本地 PASS 写 Acceptance PASS |
| Web3 仅记入 Register / HOLD | 本模式触碰 Fix=8 / Web3 Min-Fix |

---

## 2 · 与 Consistency Control 的关系

| 层 | 职责 |
|----|------|
| **Domain Batch** | 决定 **做哪个域、何时部署、如何批修** |
| **Consistency Control** | 裁决 **能否 ALIGNED_PASS**（五层一致） |
| **Measurement FINAL** | 分母/本地分子记账 |
| **Register** | Finding / Drift 唯一池 |

**冲突时：** Consistency Control 优先 — 无 Staging 同 SHA Evidence → **不得**域批宣称 CLOSED。

---

## 3 · 当前裁决（诚实）

| 项 | 状态 |
|----|------|
| Active Domain | **RBAC**（首域 · Staging ALIGNED 目标） |
| Coverage content | `50682517…`（Phase3 LOCAL） |
| Build-aligned tip | `0a0265d3…` / pin tip `179cf7c3…` |
| Staging deploy | **进行中或待 meta 对拍**（见 Closure Board） |
| Journey / Data / UI Batch | **未开**（等 RBAC 域批 ALIGNED） |
| Web3 Batch | **HOLD** · Fix=8 不动 |
| Gate Verdict | **CONDITIONAL_GO** · **未改** |

---

## 4 · 效率规则（防抖动）

1. **一域一部署：** 域内 Finding 收齐 → 批修 → 一 SHA → 一 Staging。  
2. **部署失败：** 同 tip 重试；若需新代码 → 记 Register → 仍算本域批内，**不**开下一域。  
3. **跨域依赖：** 若 RBAC 修复偶然触及 Data 探针脚本，只允许 **探针/证据** 变更；产品逻辑跨域 → 拆到对应域批。  
4. **Recalculate：** 每域 ALIGNED 后跑一次；禁止无 SHA 变更刷表。

---

## 5 · 命令入口（复用 · 不扩测）

```bash
# Consistency 审计（默认允许 NOT_ALIGNED）
bash scripts/gates/check-psg-coverage-consistency-control.sh

# 域批状态（机读）
# registry/psg-domain-batch-closure.v1.yaml → active_domain / domain_status

# 本域 Staging Evidence（仅当 meta SHA == tip）
python scripts/dev/stamp-psg-coverage-run.py \
  --environment staging --consistency-verdict ALIGNED_PASS \
  --api-base https://tt-api-staging.fly.dev \
  --web-base https://tt-web-staging.fly.dev \
  --git-sha <TIP_SHA> --staging-meta-git-sha <TIP_SHA>
```

Phase3 探针（**不扩格**）：`scripts/dev/smoke-coverage-measurement-phase3-local.sh`（Staging 时设 `API_BASE`/`FE_BASE`）。

---

## 6 · 完成判定（单域）

| 检查 | 必须 |
|------|------|
| Register 本域 OPEN Finding | 0（或 Owner 书面 DEFER 且不挡 ALIGNED） |
| Local PASS | 本域目标格 |
| Git tip 含本域修复 | clean Coverage 路径 |
| Staging meta `git_sha` | == tip |
| `coverage_run` | staging · ALIGNED_PASS · api_sha/web_sha/migration_state |
| Consistency Gate `--require-aligned` | 对本域目标 exit 0（或域子集策略见 Registry） |
| Recalculate | 已刷新 · 仍不改 Fix=8 / Gate |

**全五域 ALIGNED ≠ Production GO**（仍受 Fix=8 / PSG Gate 约束）。
