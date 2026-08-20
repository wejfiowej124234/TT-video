# TT-V65-PROD-003 · Batch3 W2 Write-Path Hardening · Prep Matrix

**Stamp:** `20260805T043000Z`（Prep 原戳 · **已被 Design Confirm 承接**）  
**Wave:** `W2_WRITE_PATH_HARDENING`  
**Phase:** `PREP_SUPERSEDED_BY_DESIGN_CONFIRM`  
**Claim:** `W2_PREP_SUPERSEDED_DESIGN_CONFIRMED`  
**Design Confirm:** [`W2-WRITE-PATH-DESIGN-CONFIRM`](./TT-V65-PROD-003-BATCH3-W2-WRITE-PATH-DESIGN-CONFIRM-LATEST.md) · `20260805T043612Z` · **CODE UNLOCKED**  
**`TT_PRODUCTION_GO`:** **NO_GO**  
**Enterprise L5 Production Ready:** **false**  
**Machine:** [`TT-V65-PROD-003-BATCH3-W2-WRITE-PATH-PREP-LATEST.json`](./TT-V65-PROD-003-BATCH3-W2-WRITE-PATH-PREP-LATEST.json)

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 阶段口径

① Local → ② Staging → ③ Runtime Evidence → ④ Delta Cert  

本文件 = **W2 Prep（历史矩阵）**。契约真源已迁至 **Design Confirm**。  
**≠** Residual CLOSED · **≠** Staging PASS · **≠** W2 CLOSED · **≠** Production GO。

父轨：[`ENGINEERING-CLOSURE`](./TT-V65-PROD-003-BATCH3-ENGINEERING-CLOSURE-LATEST.md) · W1 **CLOSED**；R059–R062 仍 **OPEN**；实现闸已开。

---

## 诚实边界

| 项 | 状态 |
|----|------|
| W1 Country Catalog | **CLOSED**（禁止无回归重开） |
| W2 Design Confirm | **CONFIRMED** · `20260805T043612Z` |
| W2 代码闸 | **UNLOCKED** · **尚未开工** |
| R059–R062 | **OPEN** |
| Prep 文档 | **SUPERSEDED**（契约见 Design Confirm） |
| `TT_PRODUCTION_GO` | **NO_GO**（保持） |

**禁止用本包宣称：** W2 CLOSED · R059–R062 CLOSED · Enterprise L5 Ready · Production GO · Batch3 full CLOSED。

---

## 顺序（写死）

```
R059 → R060 → R061 → R062
```

设计确认闸通过后才允许产品代码；实现仍按上序，同波次收口（R061 分类器与 R059/R060 客户端配对）。

---

## 1 · Critical write surfaces

| Surface ID | Residual | Client / Route | Idempotency today | Classifier today |
|------------|----------|----------------|-------------------|------------------|
| `W2-S-STEWARD-REVIEW` | R059 | `adminStewardApplication.ts` PATCH | **MISSING** | 未入表 |
| `W2-S-ACQUISITION-SUSPEND` | R059 | `adminAcquisitionPublishSuspend.ts` | **MISSING** | 未入表 |
| `W2-S-GUIDE-REGISTRATION-ADMIN` | R059 | `adminGuideRegistration.ts` | **MISSING** | 未入表 |
| `W2-S-PROVIDER-APPLICATION-ADMIN` | R059 | `adminProviderApplication.ts` | 实现时核对 | 实现时核对 |
| `W2-S-CMS-ANNOUNCEMENT-CREATE` | R060 | `announcements.ts` POST | 有头但不稳定（每调用新 UUID） | 未入表 |
| `W2-S-CMS-ANNOUNCEMENT-PATCH` | R060 | `announcements.ts` PATCH | 同上 | 未入表 |
| `W2-S-CMS-ANNOUNCEMENT-WORKFLOW` | R060+R061 | publish/unpublish/submit-review/archive | 同上 | 未入表 |
| `W2-S-APPROVALS-REJECT` | R061 | `POST …/approvals/:id/reject` | 视客户端 | **漏**（approve 已入） |
| `W2-S-ROLE-CHANGE-REQUEST` | R062 | `POST …/users/:id/role-change-request` | 分类器已要求 | **已入表** · RBAC 欠写权限 |
| `W2-S-ROLE-CHANGE-APPROVE-EXECUTE` | R062 | `POST …/approvals/:id/approve` | 已入表 | 边界文档；不降权 |

**不重开：** R006（Provider/Guide approve 闭环）· R048/R057（FE 403 提示）· R063–R066（P2）。

---

## 2 · Idempotency-Key 生命周期

**Headers:** `Idempotency-Key` + `X-Idempotency-Key`  
**Helper:** `writeRequestHeaders(idempotencyKey?)` · `frontend/lib/apiClient/core.ts`  
**Server cache key:** `method + path + key` · middleware fail-closed 与 `is_admin_critical_write_path` **必须同表**。

| Phase | When | Rule |
|-------|------|------|
| **MINT** | 用户意图开始（提交 / 工作流动作点击） | **每意图一钥**，不是每次 HTTP |
| **ATTACH** | 组请求头 | 传入 `stableKey`；W2 范围内禁止裸 `writeRequestHeaders()` |
| **REUSE** | 重试 · 双击 · 超时未终态 | 成功前复用同一钥 |
| **ROTATE** | 2xx 已接受 · 取消 · **新**意图 · 校验失败后改稿再发 | 仅新意图才换钥 |
| **SERVER_REPLAY** | 同 method+path+key | 回放先前响应 · **禁止**二次副作用 |
| **FAIL_CLOSED** | 已入分类器路径缺钥 | **400** · 不静默放行 |

**文案诚实：** `admin_approvals_idempotency_hint` 不得再写「每次提交新钥」；改为「重试复用 · 新意图才换钥」。

---

## 3 · CMS retry 行为（R060）

**根因：** `adminAnnouncementsFetch` → `writeRequestHeaders()` 无参 → 每次新 UUID → retry ≠ replay。

| 场景 | 契约 |
|------|------|
| create / save / workflow | Hook 按意图持有稳定钥直至 2xx 或放弃 |
| 5xx / timeout 重试 | **复用**同一钥 |
| 双击 | 复用 in-flight 钥；UI 禁用或合并 |
| 校验 4xx 改稿后再发 | **新**意图 → 新钥 |
| 回放 2xx / 409 | 视为首次成功 · 不造第二行 |

**W2 不做：** CDN TTL（R063）· Publish→Live UX 扩面（R030）· 仅文档冒充 CLOSED。

---

## 4 · RBAC · request / approve / execute（R062）

| Phase | Endpoint | Today | Target |
|-------|----------|-------|--------|
| **request** | `POST …/role-change-request` | `require_admin_actor` only | + **`PERM_USERS_WRITE`**（或更严的 create 专权） |
| **approve** | `POST …/approvals/:id/approve` | 现有审批闸 | **保持更高权**；不与 create 合并 |
| **execute** | 审批事务内落库改角色 | 无独立公开 execute | **禁止**新增公开 execute 面 |

**铁规则：** create ≠ approve ≠ execute。缺 create 权 → **403**。不得用「缺按钮」（R048）顶替服端闸。

---

## 5 · Classifier 扩表（R061）

**SSOT:** `crates/api/src/middleware/rate_limit.rs#is_admin_critical_write_path`

**须新增：**

- `POST …/approvals/:id/reject`
- CMS announcement admin POST/PATCH + workflow 写
- R059 对应 steward / acquisition-suspend / guide-registration 写路径

**已在表（勿重复劳动）：** approve · role-change-request · flags/policies/scopes publish · 部分 community PATCH。

**配对：** 扩表后 Idempotency middleware 与限流/分类器同列表；`/meta` rate_limits 仍须真值。

---

## 6 · 实施矩阵（验收契约）

| ID | FE | API | ① Local | ② Staging |
|----|----|-----|---------|-----------|
| **R059** | 三/四客户端 `writeRequestHeaders(stableKey)` | 入分类器后缺钥 400 | client + missing-key + replay | 一条审阅写双击无双副作用 |
| **R060** | Hook 稳定钥 + 文案诚实 | CMS 写入分类器 | fixture：retry 钥不变 | announce publish 双击一行副作用 |
| **R061** | — | 扩 `is_admin_critical_write_path` + unit | classifier 正/负例 | burst → 429 可观测 |
| **R062** | 可选 403 诚实（不重开 R048） | create 强制 users-write | 缺权 403 / 有权 pending | Staging Users 角色变更烟测 |

**Residual Close 前必须：** ① Local PASS · ② Staging PASS · ③ Evidence 目录 `evidence/GO_v65_prod_003_batch3_w2_write_path/<stamp>/` · ④ Delta Cert 可后置但 **不翻 GO**。

---

## 7 · Owner 设计确认清单（已满足 · `20260805T043612Z`）

1. Critical write surfaces 清单接受（无静默加面） → **DC-01 CONFIRMED**  
2. Idempotency MINT→REUSE→ROTATE 接受 → **DC-02 CONFIRMED**  
3. CMS retry 稳定钥契约接受 → **DC-03 CONFIRMED**  
4. RBAC request≠approve≠execute 接受 → **DC-04 CONFIRMED**  
5. Classifier `must_add` 接受 → **DC-05 CONFIRMED**  
6. Regression 矩阵接受 → **DC-06 CONFIRMED** · **代码已解锁**（见 Design Confirm）  

---

## Next

**Design Confirm DONE**（[`DESIGN-CONFIRM`](./TT-V65-PROD-003-BATCH3-W2-WRITE-PATH-DESIGN-CONFIRM-LATEST.md) · DC-01～DC-06）。  
**Next = 按 R059→R060→R061→R062 实现** → Staging 靶向验 → Evidence → Residual Close。  

全程 **`TT_PRODUCTION_GO=NO_GO`** · **禁止** Production mutate · **禁止**新 Audit Pass · **禁止**跳阶 W3（R025/R050）直至 W2 Residual 收口 · **禁止** Enterprise L5 / Production Ready 宣称。
