# PSG · Coverage Measurement Recalculate（可计算分母）

**Machine:** `TT_PSG_COVERAGE_MEASUREMENT_RECALCULATE`  
**Status:** **FRAMEWORK_ACTIVE** · 填格产出 → [**Measurement FINAL**](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md) · `2026-07-19`  
**机读：** [`registry/psg-coverage-measurement-recalculate.v1.yaml`](../../registry/psg-coverage-measurement-recalculate.v1.yaml) · [`psg-coverage-measurement-final.v1.yaml`](../../registry/psg-coverage-measurement-final.v1.yaml)  
**输入：** [Authenticity Audit](./TT-PSG-COVERAGE-GAP-NON-WEB3-AUTHENTICITY-AUDIT-LATEST.md) · [Non-Web3 Gap](./TT-PSG-COVERAGE-GAP-COMPLETION-NON-WEB3-LATEST.md) · [Metrics Baseline](./TT-PSG-COVERAGE-METRICS-BASELINE-LATEST.md) · [Threshold Matrix](./TT-PSG-COVERAGE-ACCEPTANCE-THRESHOLD-MATRIX-LATEST.md)

> **纪律：** 禁止估算覆盖率（`~88%` / `RBAC 95%` 等）。  
> **允许写：** `Evidence VERIFIED` · 正式 Recalculate 后的 `pass_count / denom`（见 FINAL）。  
> **禁止：** 为刷覆盖改产品代码 · 改 Gate · 动 Web3/Min-Fix · 改 Fix Required=8 · 随机扩测刷 %。  
> **例外（Phase3）：** Register 关联漂移的最小修复（`ΔFix=0`）见 FINAL discipline · **仍禁止** Web3。  
> **Consistency Control（硬闸）：** [Consistency Control](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md) —  
> **仅 ALIGNED_PASS**（Local→Git SHA→Staging 同 SHA→Evidence→Recalculate）计入 Coverage PASS；**禁止仅本地通过计入。**
---

## 0 · Release Gate 戳（本文件不改裁决）

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Coverage Metrics:    FINAL
Consistency Control: ALIGNED_PASS
Pass Tier:           ALIGNED_PASS
Threshold Rollup:    NEED_FIX
```
---

## 1 · 三态（写死）

| 态 | 含义 | 可否写「维 PASS / xx%」 |
|----|------|------------------------|
| **Evidence VERIFIED** | Authenticity Audit：脚本+日志存在且成功信号真实 | ❌ 仅证明「跑过」 |
| **Coverage Metric GAP** | 分母已定义 · 分子未齐 · **禁止**估 % | ❌ |
| **Coverage Metric FINAL** | 本表分母填满 · `pass/denom` 已算 · 对照 Threshold | ✅ 仅此态可写 % / PASS |

**公式（唯一合法）：**

```text
Coverage_% = pass_cells / denom_cells × 100
```

`pass_cells` = 有独立可 cite 成功证据的单元格。  
`PARTIAL` smoke ≠ 填满该单元格。

---

## 2 · 四维 FINAL（填格后 · 见 FINAL 文）

| 维 | Evidence | Metric | pass/denom | Threshold |
|----|----------|--------|------------|-----------|
| **RBAC** | VERIFIED | **FINAL** | **7/96** | NEED_FIX |
| **Journey** | VERIFIED | **FINAL** | **1/5** | NEED_FIX |
| **Data** | VERIFIED | **FINAL** | **5/20** | NEED_FIX |
| **UI P0** | VERIFIED | **FINAL** | **5/24** | NEED_FIX |
| API | Baseline 族级 | 沿用 | — | 保持 |
| Security/Web3 | 未刷新 | （Fix=8） | — | **不碰** |

估数 ~88–100%：**作废**。细节与 PASS 索引 → [Measurement FINAL](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md)。

---

## 3 · RBAC 分母（必须可算）

### 3.1 角色集（6）

| ID | 角色 | 账号锚 |
|----|------|--------|
| R1 | Tourist | C2 |
| R2 | Guide | C3 |
| R3 | Provider | C4 |
| R4 | Steward | C1 hub |
| R5 | Admin | Admin 档 |
| R6 | DAO/Gov | 治理窗 |

### 3.2 每角色权限点（最小核心 · 4）

| Cap | 含义 |
|-----|------|
| CAP_OWN | 本角色正常能力（正向） |
| CAP_CROSS_DENY | 越权到他角色关键面（反向） |
| CAP_ADMIN_DENY | 非 Admin 调 Admin API/页（反向；Admin 行改为「非超权资金」） |
| CAP_UI_BOUND | UI 可见/隐藏与角色一致 |

### 3.3 验证面（4）

| Face | 含义 |
|------|------|
| F_ALLOW_API | 正向 API 成功 |
| F_DENY_API | 反向 API 401/403 |
| F_ALLOW_UI | 正向 UI 可操作/可见 |
| F_DENY_UI | 反向 UI 不可见或拒 |

### 3.4 分母

```text
denom_rbac = 6 roles × 4 caps × 4 faces = 96 cells
Coverage_RBAC_% = pass_rbac / 96
```

**Acceptance 硬门槛（Threshold）：** 核心矩阵 `pass_rbac / 96 = 100%`（或 Owner 书面缩核表 · 须改本分母后重算）。

### 3.5 已有证据 → 可计分子（当前 · 只读盘点）

| 单元格簇 | 证据 | 可计？ |
|----------|------|--------|
| Admin × CAP_* × F_*（CS deny/allow 子集） | `smoke-rbac-matrix.log` | **PARTIAL 簇** · **≠** 96 格全满 |
| Tourist/Guide/Provider/Steward/DAO 全脸 | Authenticity：**GAP** | **0** 正式格 |
| Vitest admin permission | 契约 | 可作旁证 · **默认不计** live 格除非映射表写明 |

**当前：** `pass_rbac = UNCOUNTED` · **Metric = GAP** · **禁止写 95%。**

### 3.6 补齐清单（Recalculate 前 · 不现跑）

- [ ] 六角色 × 能做（F_ALLOW_API + F_ALLOW_UI）  
- [ ] 六角色 × 不能做（F_DENY_API + F_DENY_UI）  
- [ ] 每格 Evidence 路径写入 [`registry/psg-coverage-measurement-recalculate.v1.yaml`](../../registry/psg-coverage-measurement-recalculate.v1.yaml) `cells`  
- [ ] 跑公式 → 更新 Metrics Baseline → Metric FINAL

---

## 4 · Journey 分母

### 4.1 核心生产旅程步（非链上执行 · 首次切片）

| ID | 步 | 角色 |
|----|-----|------|
| J1 | Tourist 创建需求 | C2 |
| J2 | Guide 接单 | C3 |
| J3 | Provider 发布 | C4 |
| J4 | Order 生命周期（列表→详情→态迁移切片 · 非 Money-Path） | C2/C3 |
| J5 | Escrow **页面状态**（草稿/预链上壳 · **非**上链 execute） | C2 |

```text
denom_journey = 5
Coverage_Journey_% = pass_journey / 5
```

Threshold：核心旅程 ≥90% → 至少 **5/5 或 4.5 规则不适用** → **须 5 格均有 PASS 证据** 才宣称 ≥90%（整数格：5/5）。

### 4.2 已有 vs GAP

| ID | Evidence | 计分 |
|----|----------|------|
| J1 创建需求 | Authenticity：**GAP**（无专用证） | 未计 |
| J2 Guide 接单 | guide workbench smoke **PARTIAL**（接单闭环未单列） | 未计正式 PASS |
| J3 Provider 发布 | provider onboarding **PARTIAL** | 未计正式 PASS |
| J4 Order 生命周期 | orders API OK · FE `/orders` **SKIP** | 未计正式 PASS |
| J5 Escrow 页态 | enterability **未含 /escrow** · UI 态未测 | 未计 |

**当前：** `pass_journey = 0`（正式格）· Evidence 旁证 VERIFIED · **Metric = GAP**。

---

## 5 · Data 分母

### 5.1 链（写死）

```text
Create → DB → API → UI
```

### 5.2 Surface × 链环

| Surface | Create | DB | API | UI |
|---------|--------|----|-----|-----|
| Market/Catalog | ☐ | ☐ | ☐ | ☐ |
| Provider | ☐ | ☐ | ☐ | ☐ |
| Guide | ☐ | ☐ | ☐ | ☐ |
| Announcement | ☐ | ☐ | ☐ | ☐ |
| Community | ☐ | ☐ | ☐ | ☐ |

```text
denom_data = 5 surfaces × 4 rings = 20 cells
Coverage_Data_% = pass_data / 20
```

### 5.3 已有

| 簇 | 证据 | 计分 |
|----|------|------|
| Market/Catalog · API+UI 读 | catalog-consumer / ops | **最多 2/4** 该 Surface · Create/DB 未独证 |
| 其余 Surface 全链 | Authenticity GAP | 0 |

**当前：** Metric **GAP** · **禁止** ~88%。

---

## 6 · UI P0 分母

### 6.1 P0 页（6）

| Page | Path |
|------|------|
| Home | `/` |
| Market | `/market` |
| Orders | `/orders` |
| Escrow | `/escrow/[id]` 或草稿入口 |
| Auth/Profile | `/auth/login` + `/me`（计 1 逻辑页簇或拆 2 · 见机读 `ui_p0_pages`） |
| Governance | `/governance/proposals` |

机读默认 **6 pages**（login+me 合并为 Profile 簇）或 **7** 若拆分 — **以 registry `denom_ui` 为准**。

### 6.2 每页四态

| State |
|-------|
| loading |
| error |
| empty |
| success |

```text
denom_ui = N_pages × 4 states
Coverage_UI_% = pass_ui / denom_ui
```

### 6.3 已有

| 项 | 证据 | 计分 |
|----|------|------|
| 多页 HTTP 200 | `ui-p0-enterability.log` | **仅 success 进入旁证** · **≠** 四态 |
| Escrow | **NOT_FOUND** in enterability | 0 |
| loading/error/empty | **NOT_FOUND** | 0 |

**当前：** Metric **GAP**。

---

## 7 · Recalculate 流程（解锁后 · 非现在）

```text
1. 填 cells 证据路径（本 YAML）
2. pass_* = count(cells.status==PASS)
3. Coverage_% = pass / denom
4. 写 Metrics Baseline（替换估数 · 标 Metric FINAL）
5. 对照 Threshold Matrix → meets true/false
6. PSG Final Gate（仍须 Fix=0 · Owner · Rollback）
```

**WAIT_WINDOW：** 只维护本分母与状态戳 · **不**跑随机测试刷分子。

---

## 8 · 与旧 Metrics Baseline 关系

| 产物 | 角色 |
|------|------|
| Metrics Baseline（2026-07-19 Evidence Sync） | **LAST_FORMAL** 映射分（PARTIAL→W%）· **仍有效作历史** |
| Non-Web3「~88%」估数 | **SUPERSEDED / VOID** |
| 本 Measurement Recalculate | **唯一**通向 Metric FINAL 的路径 |

正式 Recalculate 完成前，对外统一口径：

```text
Coverage:  Evidence VERIFIED
Metrics:   NOT FINAL
```
