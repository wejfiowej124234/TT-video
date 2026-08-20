# TT-V65-PROD-003 · Batch3 W2 Write-Path · Design Confirmation

**Stamp:** `20260805T045955Z`  
**Wave:** `W2_WRITE_PATH_HARDENING`  
**Phase:** `LOCAL_CODE_LANDED_RESIDUALS_OPEN`  
**Claim:** `W2_LOCAL_CODE_LANDED_R059_R062_OPEN`  
**Design Confirm:** `20260805T043612Z` · DC-01～DC-06 **CONFIRMED**（不变）  
**`TT_PRODUCTION_GO`:** **NO_GO**  
**Enterprise L5 Production Ready:** **false**  
**Prep:** [`W2-WRITE-PATH-PREP`](./TT-V65-PROD-003-BATCH3-W2-WRITE-PATH-PREP-LATEST.md) · `20260805T043000Z`  
**Machine:** [`TT-V65-PROD-003-BATCH3-W2-WRITE-PATH-DESIGN-CONFIRM-LATEST.json`](./TT-V65-PROD-003-BATCH3-W2-WRITE-PATH-DESIGN-CONFIRM-LATEST.json)

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 阶段口径

① Local → ② Staging → ③ Runtime Evidence → ④ Delta Cert  

本文件 = **W2 Design Confirmation（契约锁定）** + **① Local code landed** 诚实记录。  
**≠** Residual CLOSED · **≠** Staging PASS · **≠** W2 CLOSED · **≠** Production GO · **≠** Enterprise L5 Ready。

---

## 诚实边界

| 项 | 状态 |
|----|------|
| W1 Country Catalog | **CLOSED**（禁止无回归重开） |
| W2 Design Confirm | **CONFIRMED** · `20260805T043612Z` |
| W2 代码闸 | **UNLOCKED** · **STARTED** · **① Local landed**（`20260805T045955Z`） |
| R059–R062 | **OPEN**（保持 · 本地绿 ≠ CLOSED） |
| Staging / Evidence | **未**（下一阶） |
| `TT_PRODUCTION_GO` | **NO_GO**（保持） |
| Enterprise L5 Ready | **false**（保持） |

**禁止用本包宣称：** W2 CLOSED · R059–R062 CLOSED · Staging PASS · Enterprise L5 Ready · Production GO · Batch3 full CLOSED。

---

## 逐项确认（DC-01～DC-06）

| # | 主题 | 清单项 | 结论 |
|---|------|--------|------|
| **DC-01** | Critical Write Registry 范围 | surfaces 清单接受 · 无静默加面 | **CONFIRMED** |
| **DC-02** | Idempotency-Key 生命周期 | MINT→ATTACH→REUSE→ROTATE→SERVER_REPLAY→FAIL_CLOSED | **CONFIRMED** |
| **DC-03** | CMS retry 规则 | 每意图稳定钥 · 禁止裸 `writeRequestHeaders()` | **CONFIRMED** |
| **DC-04** | RBAC request/approve/execute | create=`PERM_USERS_WRITE` · approve 更高 · 无公开 execute | **CONFIRMED** |
| **DC-05** | Classifier `must_add` | reject + CMS 写 + R059 路径；与 Idempotency 同表 | **CONFIRMED** |
| **DC-06** | 回归测试矩阵 | ① Local · ② Staging · ③ Evidence · ④ Delta Cert（不翻 GO） | **CONFIRMED** |

### DC-01 · Critical Write Registry（范围写死）

**In-scope surfaces（仅此 10）：**

`W2-S-STEWARD-REVIEW` · `W2-S-ACQUISITION-SUSPEND` · `W2-S-GUIDE-REGISTRATION-ADMIN` · `W2-S-PROVIDER-APPLICATION-ADMIN` · `W2-S-CMS-ANNOUNCEMENT-CREATE` · `W2-S-CMS-ANNOUNCEMENT-PATCH` · `W2-S-CMS-ANNOUNCEMENT-WORKFLOW` · `W2-S-APPROVALS-REJECT` · `W2-S-ROLE-CHANGE-REQUEST` · `W2-S-ROLE-CHANGE-APPROVE-EXECUTE`

**Out-of-scope（禁止借 W2 重开）：** R006 · R048 · R057 · R015 · R030 · R063–R066 · R025/R050（W3）。

Provider application：实现时按 steward/guide 模式核对；**不**重开 R006。

### DC-02 · Idempotency-Key 生命周期

| Phase | 规则 |
|-------|------|
| **MINT** | 每用户意图一钥 · **不是**每次 HTTP |
| **ATTACH** | `writeRequestHeaders(stableKey)` · W2 关键写禁止裸调用 |
| **REUSE** | 2xx 前复用（重试 / 双击 / 超时） |
| **ROTATE** | 仅终态成功 · 取消 · **新**意图 · 校验改稿后再发 |
| **SERVER_REPLAY** | 同 method+path+key → 回放 · 无二次副作用 |
| **FAIL_CLOSED** | R061 扩表后缺钥 → **400** |

文案：`admin_approvals_idempotency_hint` → 「重试复用 · 新意图才换钥」。

### DC-03 · CMS retry（R060）

| 场景 | 契约 |
|------|------|
| create / save / workflow | Hook 持稳定钥至 2xx 或放弃 |
| 5xx / timeout | **复用** |
| 双击 | 复用 in-flight · UI 禁用或合并 |
| 校验 4xx 改稿 | **新钥** |
| 回放 2xx/409 | 视为首次成功 |

### DC-04 · RBAC 边界（R062）

| Phase | Target |
|-------|--------|
| **request** | `require_admin_actor` + **`admin.users.write` (`PERM_USERS_WRITE`)** |
| **approve** | 保持更高独立闸 · 不与 create 合并 |
| **execute** | 审批事务内 · **禁止**新增公开 execute |

铁规则：create ≠ approve ≠ execute。缺权 → **403**。不得用 R048「缺按钮」顶替服端闸。

### DC-05 · Classifier（R061）

**须新增：** reject · CMS announcement 写+workflow · R059 steward/acquisition-suspend/guide 写路径。  
**已在表：** approve · role-change-request · flags/policies/scopes publish · 部分 community PATCH。  
**配对：** Idempotency fail-closed 与分类器同列表；`/meta` rate_limits 真值。

### DC-06 · 回归矩阵（关闭前硬闸）

| 阶 | 要求 |
|----|------|
| ① Local | classifier + RBAC fixtures · FE stable-key contract |
| ② Staging | CMS/R059 双击无双副作用 · 缺钥 400 · role-change 403/201 · burst 429 |
| ③ Evidence | `evidence/GO_v65_prod_003_batch3_w2_write_path/<stamp>/` |
| ④ Delta Cert | GO 前可后置 · **不翻** `TT_PRODUCTION_GO` |

---

## 代码解锁 / ① Local landed

| 项 | 值 |
|----|-----|
| Unlocked | **true** · `20260805T043612Z` |
| Started | **true** · `20260805T045000Z` |
| Local landed | **true** · `20260805T045955Z` · slice = **R059–R062_LOCAL_LANDED** |
| Order | **R059 → R060 → R061 → R062**（① 均已落地） |
| Local verify | R059/R060/R062 vitest PASS · R061 `admin_critical_write_paths_are_detected` cargo PASS |
| Residuals | **OPEN**（直至 ② Staging + ③ Evidence） |

---

## Next

② Staging smoke（DC-06）→ ③ `evidence/GO_v65_prod_003_batch3_w2_write_path/<stamp>/` → Residual Close（逐 ID）。  

全程 **`TT_PRODUCTION_GO=NO_GO`** · **禁止** Production mutate · **禁止**新 Audit Pass · **禁止**跳阶 W3 · **禁止**宣称 Enterprise L5 / Production Ready。
