# TT · Phase 2 Production-Grade Architecture Gap Register（LATEST）

**STATUS:** `PHASE2_GAP_AUDIT_CLOSED`  
**Baseline（不可漂移）:** `PHASE_1_AS_IS_ARCHITECTURE_FROZEN` = **ISSUED**  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/phase2-production-grade-gap-register.v1.yaml`](../../registry/phase2-production-grade-gap-register.v1.yaml) · [`TT-PHASE2-PRODUCTION-GRADE-GAP-REGISTER-LATEST.json`](./TT-PHASE2-PRODUCTION-GRADE-GAP-REGISTER-LATEST.json)  
**Gate:** `python scripts/dev/check-phase2-production-grade-gap-audit.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**本波:** Gap Audit **CLOSED** · **PHASE_2A** 收敛 **ACTIVE** · Phase 2B **FORBIDDEN** · BATCH-A 两 GAP **CLOSED_REALITY** · `GAP-FE-BFF-BYPASS` **CLOSED_REALITY** · `WALLETCONNECT_OFFICIAL_BAKE_FORWARD_FIX` **CLOSED_REALITY**（Dockerfile ARG · Official `2ba08bd4` QR PASS · **不是**第 16 个 Gap） · `GAP-1USDC-HANDOFF` **CLOSED_REALITY**（Owner A · Track2 L7+L8 money-path） · `GAP-E2E-JOURNEY` **CLOSED_REALITY**（Official C2 非资金 Draft UUID `7d91f354-af9d-461c-8790-b70a597751af` · frozen www `/escrow/{uuid}` · **不是** USDC/TTG · **不是** Track2） · **`TT_PRODUCTION_GO=NO_GO`**

这是 Phase 2 的**唯一 Gap Register**。  
对照 Pack 01→14 与 `CAP → JNY → DEP/GATE → INC`，比较 **Current AS-IS** 与 **Production-Grade Requirement**。  
**不是**第 16 张产品矩阵。**不是**新 SSOT。冻结地图不重画。

---

## 0 · 本波铁律

**禁止** 修改 FTB / Web3 / 数据 / 权限 / 资金。  
**禁止** execute CI-02 / PM $25、部署 Seat/Vault。  
**历史 Login 405** 已 **CLOSED_REALITY**（Owner Official C2 Session）；**禁止**再为刷绿重置 Production 账号。  
**禁止** 把合法 **WAITING_TIMELOCK** 当故障。  
**禁止** 把 Target 当 Live。**Target ≠ Live**。  
**禁止** 审计过程中顺手修复。  
**禁止** 用地图完成度冒充 `OFFICIAL_LIVE` / `REALITY_VERIFIED` / `CLOSED_REALITY` / Production GO。

分类必须落在：`DEFECT` · `ARCHITECTURE_DEBT` · `PRODUCT_DEBT` · `WAITING_TIMELOCK` · `NOT_DEPLOYED` · `REALITY_EVIDENCE` · `EXPECTED_SOLO` · `ORTHOGONAL`。

Owner 选定批次后才走：`Local Fix → Tests → Staging → Official → Reality Evidence → Gap CLOSED`。

---

## 1 · 冻结平面（必须与 Pack 00 / Pack 14 一致）

| 平面 | 值 | 不得等于 |
|------|----|----------|
| ARCHITECTURE_MAP_COMPLETE | Pack 01–13 DEEP_PARTIAL **13/13** | 产品 100% |
| OFFICIAL_LIVE | **PARTIAL** | Reality |
| REALITY_VERIFIED | **false**（全局平面；Track2 1 USDC money-path hop 已闭 ≠ 此平面） | CLOSED_REALITY |
| CLOSED_REALITY | **false**（全局平面；`GAP-1USDC-HANDOFF` hop 闭 ≠ 此平面） | PRODUCTION_GO |
| PRODUCTION_GO | **NO_GO** | 地图完成 |

`OPEN_GAPS=23` · `OPEN_P0=0` · `CLOSED_GAPS=5` · `P2A_WAIT_CLASSIFIED_AS_DEFECT=0` · `P2A_TARGET_CLASSIFIED_AS_LIVE=0`。

---

## 2 · 分类纪律（写死）

| Class | 本 Register 样例 | 禁止误判 |
|-------|------------------|----------|
| **DEFECT** | `GAP-LOGIN-WWW-405` · `GAP-FE-BFF-BYPASS` · `GAP-LEGAL-404` · `GAP-SEC-TOKEN-LOCALSTORAGE` | 账号/DB 故障；CI-02 代码坏了；`content_main.js` 扩展噪声 |
| **WAITING_TIMELOCK** | `GAP-CI02-FR-CUTOVER` · `GAP-PM25-UPGRADE` | DEFECT / 现在就该切 |
| **NOT_DEPLOYED** | `GAP-STEWARD-SEAT-VAULT` | Official Live；DEFECT |
| **REALITY_EVIDENCE** | `GAP-1USDC-HANDOFF` | 缺页面；未部署 |
| **EXPECTED_SOLO** | `GAP-SAFE-1OF1` | 缺第二 Approver |
| **ORTHOGONAL** | `GAP-PROPOSAL-3` · Future App · Staging pin · CMS≠GP | 并进资金主链 |
| **PRODUCT_DEBT** | SCREEN_PARTIAL · E2E · responsive | 单一 FAIL 刷绿 |
| **ARCHITECTURE_DEBT** | Admin 118 · FTB stamp lag · 2FA wiring | 用 `/meta` 改 FTB |

对齐政策：[TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY](./TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md) — Expected Difference = **CONFIRM_DESIGN**，禁止 FIX_TO_MATCH。

---

## 3 · Gap Register（23 OPEN · 5 CLOSED_REALITY）

### 3.1 · P0

| GAP ID | Class | Pack / Layer | CAP / JNY | Current Reality | Expected Production State |
|--------|-------|--------------|-----------|-----------------|---------------------------|
| **GAP-LOGIN-WWW-405** | DEFECT | 02 / L3 | `CAP-AUTH-SESSION` / `JNY-TRAVELER-LOGIN` | **CLOSED_REALITY** · 历史 www POST **405** SUPERSEDED · Owner C2 **200** HttpOnly | Official www 登录 Action Works |
| **GAP-1USDC-HANDOFF** | REALITY_EVIDENCE | 06 / L7 | `CAP-ESCROW-USDC` / `JNY-TRAVELER-GUIDE-BOOK` | **CLOSED_REALITY** Owner A · GATE-1USDC = Track2 L7+L8 PASS（25759530≥25759423 · status=3 · 1e6=950000+50000）· Official book/UI **不在本 Gap** | Track2 money-path Reality PASS（tx+Indexer checkpoint）。Official book hop **CLOSED_REALITY** |

**Login 405：** **CLOSED_REALITY**（BATCH-A Owner Official C2）。历史 L3 405 已 SUPERSEDED。  
**禁止** 用 Staging seed 冒充 Official；**禁止** 为过测试重置 Production 账号。

**1 USDC 影响：** 本 Gap hop **CLOSED_REALITY**（Owner A · 2026-08-17）。Living `P0_COMMERCIAL_MONEY_PATH_BLOCKER=false`。独立于 CI-02。  
**GATE-1USDC money Reality：** Track2 L7 receipt + L8 checkpoint ≥ tx。escrow `0x45B28A…` · release block **25759423** · status **3 Completed** · 守恒 **1e6=950000+50000** · checkpoint **25759530**。  
**禁止重复真钱。禁止**把 Track2 escrow 绑进 Official `orders`。  
**Official traveler book/UI：** **`GAP-E2E-JOURNEY` CLOSED_REALITY hop**（Official C2 非资金 Draft UUID `7d91f354-af9d-461c-8790-b70a597751af` · frozen www `/escrow/{uuid}` 200）。**不是** USDC/TTG。**不是** Track2 `0x45B28A…`。08-17 只读映射缺 UUID 已由本 hop 补上。  
见 [Owner classify A](./TT-GAP-1USDC-HANDOFF-OWNER-CLASSIFY-A-LATEST.md) · [BATCH-B L7 Reality](./TT-BATCH-B-1USDC-L7-REALITY-LATEST.md)。  
**修复边界：** Reality Evidence 梯子，不是缺 `FE-ESCROW` 页面。  
**Closure：** 本 Gap hop CLOSED_REALITY ≠ 全局 CLOSED_REALITY ≠ Production GO。

### 3.2 · P1（含合法 WAIT / Target）

| GAP ID | Class | Current Reality | Expected | 依赖/阻塞 |
|--------|-------|-----------------|----------|-----------|
| **GAP-CI02-FR-CUTOVER** | WAITING_TIMELOCK | NEW FR 已部署 · `done=false` · ETA `2026-08-16T13:42:11Z` · Official 仍 OLD FR | ETA 后 Owner execute · L7+L8 NEW FR | **TIMELOCK_ETA** · **禁止当 DEFECT** |
| **GAP-PM25-UPGRADE** | WAITING_TIMELOCK | live GOV-04 **10→10** · $25 impl 已 schedule · ETA `2026-08-16T16:20:23Z` | ETA 后独立梯子 · **禁止画 10→0.4 Live** | **正交 CI-02** |
| **GAP-STEWARD-SEAT-VAULT** | NOT_DEPLOYED | Seat CI-01 / Vault CI-03 **无地址** · `TARGET_NOT_LIVE` | 先部署再接线再 Official 再 Reality | Owner deploy · **Target ≠ Live** |
| **GAP-E2E-JOURNEY** | PRODUCT_DEBT | **CLOSED_REALITY hop** · Official C2 Draft UUID `7d91f354-af9d-461c-8790-b70a597751af` · frozen www `/escrow/{uuid}` · 非 USDC/TTG · 非 Track2 | Official traveler book→order→escrow UI hop | 依赖已闭；**不是**全局 `END_TO_END_CLOSED_REALITY` / Production GO |
| **GAP-SEC-TOKEN-LOCALSTORAGE** | DEFECT | **CLOSED_REALITY** · HttpOnly cookie · JSON `token=null` · localStorage 非权威 | 抗 XSS 会话 | 与 Login 同批已闭 |
| **GAP-FE-BFF-BYPASS** | DEFECT | **CLOSED_REALITY** · Official www 同源 `/api/v1/*` · Owner C2 `/me` bookmarks orders **200** · `/market` discover/guides 走 www | www 同源 BFF | **禁止**重开 BATCH-A Session；catalog/cold-start 仍可直连 API origin（非本 Gap） |
| **GAP-SEC-CORS** | ARCHITECTURE_DEBT | 代码 unset → `very_permissive()` | Official CORS 白名单须被证明 | 先 Verify；若 Official unset 再升 DEFECT |

### 3.3 · P2 Frontend / Admin / Security / Release

| GAP ID | Class | Current Reality | 修复边界 |
|--------|-------|-----------------|----------|
| **GAP-FE-SCREEN-PARTIAL** | PRODUCT_DEBT | SCREEN_PARTIAL **20** · 无 E2E_CLOSED | **禁止** FIVE-MAIN 结构回流 |
| **GAP-ADMIN-118** | ARCHITECTURE_DEBT | 118 路由存在 · 未逐屏 E2E · 未登录 307 | **禁止** 第 16 矩阵 |
| **GAP-RESPONSIVE** | PRODUCT_DEBT | Official mobile **NOT_PROBED** | 先探针再修真缺陷 |
| **GAP-LEGAL-404** | DEFECT | `/legal/privacy|terms` **404**；`/privacy` `/terms` 200 | 重定向或退役别名 |
| **GAP-SEC-ADMIN-2FA** | ARCHITECTURE_DEBT | 2FA storage 在 · enforce 未接 | 接到 Official Admin |
| **GAP-SEC-CONSOLE-OVERRIDE** | ARCHITECTURE_DEBT | 本地可 remap console role | Official env 必须 unset |
| **GAP-REL-IDENTITY-STAMP** | ARCHITECTURE_DEBT | V65 RI SHA ≠ `/meta` git_sha · API/FE SHA 分裂 | 新 stamp；**禁止**改 PSG Archive |
| **GAP-FTB-SR-STAMP-LAG** | ARCHITECTURE_DEBT | FTB 锁表仍 Track1 SR；活 L7+L8 = SR-FT | **新 FTB stamp** · **禁止** `/meta` 覆盖 FTB |
| **GAP-META-PM-NULL** | ARCHITECTURE_DEBT | Official `/meta` **NOW** 发布 NEW PM `0x882Ad`（历史 null omit **SUPERSEDED** 为活 remainder）。剩余债 = FTB overlay 仍锁 OLD PM vs 活 `/meta` · www chrome **10→10** ED | **保持 OPEN** · **不是** PM 未上线 · **禁止** bake 对齐 |
| **GAP-ORDER-ID-JOIN** | PRODUCT_DEBT | 行程草稿未接到 `order_id` | 登录可用之后 |
| **GAP-GUIDE-STAKE-PROJECTION** | ARCHITECTURE_DEBT | Guide stake DB ≠ chain（`INC-L8-VS-L7`） | 投影对齐 L7 · **禁止**用 DB 改链 |

### 3.4 · P3 Confirm / Orthogonal

| GAP ID | Class | 处置 |
|--------|-------|------|
| **GAP-ME-PAYMENTS-404** | PRODUCT_DEBT | `/me/payments` 404 · 补页或退役 |
| **GAP-ENG-SSOT-STALE** | ARCHITECTURE_DEBT | 工程文仍写 GOV-04 未 live · 改指针不改 FTB |
| **GAP-ACQUISITION-DOMAIN** | ARCHITECTURE_DEBT | Pack 01 `ORDERS` 过粗 vs PD-009 · 只改 join 标签 |
| **GAP-SAFE-1OF1** | EXPECTED_SOLO | Safe 1/1 Solo · **CONFIRM_DESIGN** · 禁止当缺 Approver |
| **GAP-PROPOSAL-3** | ORTHOGONAL | 不并入 CI-02 / PM25 / 1 USDC |
| **GAP-STAGING-PIN** | ORTHOGONAL | Staging ≠ Official |
| **GAP-FUTURE-APP** | ORTHOGONAL | 另一个 L0 · 不挡当前 www GO |
| **GAP-CMS-NO-GP** | ORTHOGONAL | CMS 是 ops · 禁止造 GP-09 |

Phase 1 历史 STOP（`P2-PACK02-NOT-STARTED` · `P2-PHASE2-NOT-STARTED` · Pack 11/12/13 independent）= **SUPERSEDED**，不是本表 OPEN 缺口。

---

## 4 · Critical Path（建议 · Owner 后选）

1. `GAP-LOGIN-WWW-405` — 打开 Official 旅行者 Action  
2. `GAP-SEC-TOKEN-LOCALSTORAGE` — 与登录同批  
3. `GAP-1USDC-HANDOFF` — **CLOSED_REALITY** Owner A Track2 L7+L8 · **独立于 CI-02**  
4. `GAP-E2E-JOURNEY` — **CLOSED_REALITY hop** Official C2 非资金 book→escrow UI；禁止绑 Track2 / 禁止真金 / 禁止 www bake  
5. `GAP-CI02-FR-CUTOVER` — 合法 WAIT，ETA 后独立梯子  
6. `GAP-PM25-UPGRADE` — 合法 WAIT，**正交** CI-02  
7. `GAP-STEWARD-SEAT-VAULT` — NOT_DEPLOYED · Owner 部署 CI-01/CI-03  
8. `GAP-FE-SCREEN-PARTIAL` — 登录之后 · 不重开 FIVE-MAIN  
9. `GAP-SEC-CORS` — 先 Verify Official env  
10. `GAP-REL-IDENTITY-STAMP` — 新 stamp · 永不 FTB←`/meta`
11. `GAP-FE-BFF-BYPASS` — Official 全站同源 BFF · Golden Path PASS ≠ Full-Surface

---

## 5 · 修复批次建议（本波不执行）

| Batch | Class | Gaps | 何时 |
|-------|-------|------|------|
| **BATCH-A-SESSION** | DEFECT | Login 405 · token localStorage | **CLOSED_REALITY** 2026-08-15 Owner C2 |
| **BATCH-2A-SURFACE-BFF** | DEFECT | `GAP-FE-BFF-BYPASS` | **CLOSED_REALITY** 2026-08-15 Official C2 www hop |
| **BATCH-B-MONEY-REALITY** | REALITY_EVIDENCE | 1 USDC money-path **CLOSED_REALITY** Owner A · Official book hop = `GAP-E2E-JOURNEY` **CLOSED_REALITY** | 独立于 CI-02 |
| **BATCH-C-TIMELOCK** | WAITING_TIMELOCK | CI-02 · PM25 | 各自 ETA + Owner auth · **两梯独立** |
| **BATCH-D-DEPLOY-REGION** | NOT_DEPLOYED | Seat/Vault | Owner deploy |
| **BATCH-E-FRONTEND** | PRODUCT/ARCH/DEFECT | SCREEN_PARTIAL · Admin118 · Responsive · Legal 404 · me/payments · order_id | 多在 A 之后 |
| **BATCH-F-SECURITY** | ARCHITECTURE_DEBT | 2FA · console override · CORS verify | CORS 先探针 |
| **BATCH-G-RELEASE-STAMP** | ARCHITECTURE_DEBT | RI/SHA · FTB SR lag · meta PM · 文档指针 · stake 投影 · acquisition 标签 | 新 stamp；禁止改锁表地址冒充 live |
| **BATCH-H-CONFIRM** | EXPECTED_SOLO / ORTHOGONAL | Safe 1/1 · Proposal #3 · Staging · Future App · CMS≠GP | **CONFIRM_DESIGN only** |

每批执行链：Local Fix → Tests → Staging → Official → Reality Evidence → Gap CLOSED。BATCH-A 已走完该链（两 GAP CLOSED_REALITY）。余批 **尚未** CLOSED。

---

## 6 · STOP

**Phase 2 Gap Audit 已 CLOSED。BATCH-A 两 GAP CLOSED_REALITY。`GAP-1USDC-HANDOFF` hop CLOSED_REALITY（Owner A）。**  
**全局 `CLOSED_REALITY=false`。`TT_PRODUCTION_GO=NO_GO`。**  
禁止 execute CI-02 hop B / 禁止 bake Official www。PM $25 L7 已历史 CLOSED。禁止部署 Seat/Vault。禁止改 FTB。禁止用 Staging seed 冒充 Official 身份。  
**STOP**（`GAP-E2E-JOURNEY` hop **CLOSED_REALITY**；Cycle2 `READY_FOR_OWNER_PRODUCTION_GO_VERDICT`；全局 `CLOSED_REALITY=false`；Production GO **未**重开；下一步 = Owner 书面 **GO** 或 **继续 NO_GO**）。
