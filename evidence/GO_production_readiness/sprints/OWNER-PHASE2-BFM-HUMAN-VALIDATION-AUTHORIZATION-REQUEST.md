# OWNER-PHASE2-BFM-HUMAN-VALIDATION · Authorization 裁定请求

**Status:** ⏳ **PENDING Owner BFM Human Validation Authorization**  
**Recorded:** 2026-07-08  
**Owner:** Solo Founder  
**Phase:** Human Validation Track · Phase 2 — Business Flow Matrix  
**Prerequisite (met):** Phase 1 Matrix Evidence Sync · HAT Matrix v3 · Phase 2 Execution Plan · Open RC=0

**Mode:** Authorization request only · **bfm_human_validation_authorized=false** · **bfm_matrix_sync_authorized=false** · 本文 **不** 执行 Session · **不** 改 Matrix · **不** 切 ACTIVE

---

## 1. 请求裁定的范围

Owner 授权后，Assistant **允许** 按 **Session A → B → C** 顺序在 staging 执行 **真人五层链验证**，验证完成后 **允许** 将 PASS Evidence 同步至 `registry/business-flow-matrix.v1.yaml` 的 **step verdict**、**flow verdict** 与 **Evidence 引用**。

| 维度 | 授权 | 禁止 |
|------|------|------|
| Session A/B/C 真人五层验证 | ✅ 见 §4 | — |
| 写入 BFM Evidence（step3/bfm） | ✅ | — |
| BFM Matrix verdict + note 同步 | ✅ 见 §6（验证 PASS 后） | — |
| Master Checklist 复算 | ✅ 只读 | — |
| **代码修改** | — | ❌ |
| **业务数据修复**（persona/seed/guide/listing/onboarding Fix） | — | ❌ |
| Staging 结构性数据变更（除真人操作自然产生） | — | ❌ |
| HAT Matrix 同步 | — | ❌（须 **独立** Phase 2b 或 Owner 显式追加授权） |
| `TT_SPRINT_B_ACTIVE=true` | — | ❌ |
| 新开 Open RC / REDEFINE | — | ❌ |
| Manual / BDR 执行 | — | ❌（Phase 3–4） |

**性质：** 真人业务闭环验收 + Evidence → BFM Matrix **治理同步** · 非 Fix · 非 Sprint B 激活

---

## 2. 当前门禁基线

| 键 | 值 |
|----|-----|
| Registry | **v17** |
| Open RC | **0** |
| `TT_PRODUCTION_ENTRY_READY` | **NO_GO** |
| `TT_SPRINT_B` | **READY** |
| `TT_SPRINT_B_ACTIVE` | **false** |
| Blocking Checks | **54** |
| **BFM blocking** | **17**（17/17 steps pending） |
| HAT blocking | 27 |
| Manual blocking | 9 |

**Plan SSOT:** `evidence/GO_production_readiness/sprints/PHASE2-HUMAN-VALIDATION-BFM-EXECUTION-PLAN-LATEST.json`  
**Phase1 SSOT:** `evidence/GO_production_readiness/sprints/PHASE1-MATRIX-EVIDENCE-SYNC-EXECUTION-LATEST.json`

---

## 3. 五层链验收纪律（授权范围内涵）

每 BFM step **必须** 记录并一致：

| 层 | 要求 |
|----|------|
| **human_click** | 真人 UI 操作 · 截图/录屏 |
| **api** | DevTools Network · 关键 endpoint HTTP |
| **database** | staging 只读核对（SQL / admin 只读 API） |
| **page** | 页面状态 · toast · 列表刷新 |
| **final_outcome** | 业务终态 · entity_id |

**Step PASS：** 五层一致 · 符合 BFM step 语义  
**Step FAIL：** 记录 fail evidence · **不** 自动 Fix · **不** 新开 RC（除非 Owner 显式 reopen）  
**Session 阻塞：** 某 step FAIL → 该 Session 暂停 · 不进入下一 Session · 不报 PASS sync

---

## 4. 授权 Session 执行顺序

### Session A · Provider（**必须先完成**）

| 字段 | 值 |
|------|-----|
| Flow | `provider` |
| Steps | register → product → publish → order → complete（5） |
| Pilot | `merchant@test.com` |
| Counterparty | `tourist@test.com` |
| Web 入口 | `/market/provider` · `/provider/register` |
| API 对拍（只读） | `SPRINT-B-PROVIDER-HAT-ORDER-LATEST.json` |
| 预估时长 | 45–60 min |

**Evidence 输出：**

- `evidence/GO_production_readiness/step3/bfm/BFM-PROVIDER-FLOW-LATEST.json`
- `evidence/GO_production_readiness/step3/bfm/steps/provider-{step}-LATEST.json`

---

### Session B · Guide（**Session A 全 step PASS 后**）

| 字段 | 值 |
|------|-----|
| Flow | `guide` |
| Steps | register → profile → review → list → book → order → complete → review_post（8） |
| Pilot | `guide@test.com`（或 Sprint A 迪拜 pilot） |
| Counterparty | `tourist@test.com` |
| Web 入口 | `/market` · guide onboarding |
| BDR 对拍 | `GUIDE-BUSINESS-DATA-READINESS-DAY1-LATEST.json`（READY） |
| 预估时长 | 60–90 min |

**Evidence 输出：**

- `evidence/GO_production_readiness/step3/bfm/BFM-GUIDE-FLOW-LATEST.json`
- `evidence/GO_production_readiness/step3/bfm/steps/guide-{step}-LATEST.json`

---

### Session C · Acquisition（**Session B 全 step PASS 后**）

| 字段 | 值 |
|------|-----|
| Flow | `acquisition` |
| Steps | publish → respond → close_deal → complete（4） |
| 策略 | **pilot-owned fresh accounts**（BFM-001 `fresh_user_full_chain`） |
| Web 入口 | `/me/identities` → `/market/acquisition` |
| API 对拍（只读） | `BFM-001-ACQUISITION-CHAIN-DISCOVERY-LATEST.json` |
| OCS catalog 轨 | **Optional Extension** · 不阻塞 Session C PASS |
| 预估时长 | 45–60 min |

**Evidence 输出：**

- `evidence/GO_production_readiness/step3/bfm/BFM-ACQUISITION-FLOW-LATEST.json`
- `evidence/GO_production_readiness/step3/bfm/steps/acquisition-{step}-LATEST.json`

---

## 5. Staging 环境（固定 · 授权内不可改 infra）

| 项 | 值 |
|----|-----|
| Web | `https://tt-web-staging.fly.dev` |
| API | `https://tt-api-staging.fly.dev` |
| 缺省密码 | `Test123!` |

**禁止：** 部署变更 · seed 脚本 · persona restore · guide 补齐 Fix · onboarding 规则变更

---

## 6. BFM Matrix 同步授权（验证 PASS 后 · §4 全 Session 完成或分 Session sync）

Owner 授权 **Matrix sync 子范围** 与 Session 执行绑定：

### 6.1 Step 级映射（17 steps）

| Flow | Step | 当前 | 授权后（Evidence PASS 时） |
|------|------|------|---------------------------|
| provider | register | pending | **pass** + E ref |
| provider | product | pending | **pass** + E ref |
| provider | publish | pending | **pass** + E ref |
| provider | order | pending | **pass** + E ref |
| provider | complete | pending | **pass** + E ref |
| guide | register | pending | **pass** + E ref |
| guide | profile | pending | **pass** + E ref |
| guide | review | pending | **pass** + E ref |
| guide | list | pending | **pass** + E ref |
| guide | book | pending | **pass** + E ref |
| guide | order | pending | **pass** + E ref |
| guide | complete | pending | **pass** + E ref |
| guide | review_post | pending | **pass** + E ref |
| acquisition | publish | pending | **pass** + E ref |
| acquisition | respond | pending | **pass** + E ref |
| acquisition | close_deal | pending | **pass** + E ref |
| acquisition | complete | pending | **pass** + E ref |

**Note 模板：** `BFM-{FLOW} · {step} · human 5-layer PASS · E: step3/bfm/steps/{flow}-{step}-LATEST.json`

### 6.2 Flow 级 verdict

| Flow | 当前 | 授权后（该 flow 全 step pass） |
|------|------|-------------------------------|
| provider | not_started | **pass** |
| guide | not_started | **pass** |
| acquisition | not_started | **pass** |

**BFM Gate：** 三 flow 全 pass → `TT_BUSINESS_FLOW_MATRIX: PASS` · blocking **17 → 0**

### 6.3 同步纪律

- **仅** 更新 `registry/business-flow-matrix.v1.yaml` 的 `flows[*].steps[*].verdict` · `flows[*].verdict` · 可选 `effective_utc` / `version`
- **不** 修改 HAT Matrix（除非 Owner 另授 Phase 2b）
- 同步后 **必须** 重跑 `run-production-readiness-master-checklist.cjs`

---

## 7. 授权后执行边界（Assistant ONLY）

**允许（按序）：**

1. **Session A** 真人验证 → 写 Provider Evidence
2. **Session B**（A 全 PASS 后）→ 写 Guide Evidence
3. **Session C**（B 全 PASS 后）→ 写 Acquisition Evidence
4. 各 Session 或全部完成后：**BFM Matrix sync**（§6）
5. `run-production-readiness-master-checklist.cjs` 复算
6. 写入：
   - `PHASE2-BFM-HUMAN-VALIDATION-EXECUTION-LATEST.json`
   - `OWNER-PHASE2-BFM-HUMAN-VALIDATION-AUTHORIZATION-GRANTED-LATEST.json`

**禁止：**

| 项 | 说明 |
|----|------|
| 代码变更 | auth · market · order · onboarding · UI |
| 业务数据 Fix | persona restore · active guide 补齐 · seed · promote · listing 规则 |
| 重跑 Fix Validation 作为 PASS 依据 | BD-005 / HAT-003 仅 API 对拍 |
| 跳过 Session 顺序 | 不得 B→A 或 C→B |
| `TT_SPRINT_B_ACTIVE=true` | 须 Owner 独立 toggle |
| HAT Matrix sync | 不在本授权 |
| REDEFINE / 新 Open RC | 禁止 |

**Session FAIL 时：** 停该 Session · 写 fail evidence · **不** sync Matrix · **不** 自动 Fix

---

## 8. 预期 Gate 影响（估算 · 以 checklist 复算为准）

| 指标 | 当前 | Phase 2 全完成后（估） |
|------|------|------------------------|
| BFM blocking | 17 | **0** |
| Total blocking | 54 | **~37** |
| HAT blocking | 27 | 27（本授权不含 HAT sync） |
| Manual blocking | 9 | 9 |
| `TT_PRODUCTION_ENTRY_READY` | NO_GO | **NO_GO** |

---

## 9. Owner 裁定选项

| 选项 | 含义 |
|------|------|
| **A — 全额授权（推荐）** | Session A→B→C 全执行 + 17 step + 3 flow BFM sync |
| **B — Session 分授** | 仅授权指定 Session（如仅 A Provider）· 须书面列出 |
| **C — 仅验证不 sync** | 允许 Session · Matrix sync 另授 |
| **D — 拒绝** | 保持 BFM pending · 改后续计划 |

**默认推荐：A**

---

## 10. Owner 签核

| 字段 | 值 |
|------|-----|
| `bfm_human_validation_authorized` | ☐ true · ☐ false |
| `bfm_matrix_sync_authorized` | ☐ true · ☐ false |
| 选定方案 | ☐ A · ☐ B · ☐ C · ☐ D |
| 若 B · 授权 Sessions | ☐ A · ☐ B · ☐ C |
| 签核人 | Solo Founder |
| 签核 UTC | _pending_ |

**签核后第一步 ONLY：** Session A Provider 真人验证 · 写 Evidence · **不** 切 ACTIVE · **不** Fix 数据
