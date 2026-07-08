# Phase 2 · Human Validation · Business Flow 执行清单

**Status:** PLAN ONLY · **未执行**  
**Recorded:** 2026-07-08  
**Owner track:** Human Validation Track · Phase 2  
**Prerequisite (met):** Phase 1 Matrix Evidence Sync · HAT Matrix v3 · Open RC=0

**Mode:** 执行计划 only · **不** 修改 Matrix · **不** 改代码 · **不** 改 staging 数据 · **不** 切 `TT_SPRINT_B_ACTIVE`

---

## 1. 基线（Master Checklist · Phase 1 后）

| 键 | 值 |
|----|-----|
| `TT_PRODUCTION_ENTRY_READY` | **NO_GO** |
| Blocking Checks | **54**（was 62 · Phase1 −8） |
| HAT blocking | **27** |
| **BFM blocking** | **17** ← Phase 2 主目标 |
| Manual blocking | 9 |
| BDR blocking | 0 |
| Open RC | 0 |
| `TT_SPRINT_B_ACTIVE` | **false** |

**SSOT refs:**

- BFM: `registry/business-flow-matrix.v1.yaml` · 17/17 steps **pending**
- HAT: `registry/hat-six-role-matrix.v1.yaml` · v3 · Phase1 synced 8 cells
- Checklist: `evidence/GO_production_readiness/PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json`
- Phase1: `evidence/GO_production_readiness/sprints/PHASE1-MATRIX-EVIDENCE-SYNC-EXECUTION-LATEST.json`

---

## 2. 验收纪律 · 五层链

每条 BFM step **必须** 记录以下五层 **一致**（SSOT: `verification_chain`）：

| 层 | 验证方式 | 记录字段 |
|----|----------|----------|
| **human_click** | 真人 UI 操作 · 截图/录屏 | `human.action` · `human.url` · `human.screenshot` |
| **api** | DevTools Network · 关键 endpoint HTTP + body | `api.method` · `api.path` · `api.status` · `api.request_id` |
| **database** | staging 只读核对（可选 SQL / admin 只读 API） | `db.table` · `db.row_id` · `db.field` · `db.value` |
| **page** | 页面状态 · toast · 列表刷新 | `page.selector` · `page.visible_text` |
| **final_outcome** | 业务终态 | `outcome.status` · `outcome.entity_id` |

**Step PASS 条件：** 五层链一致 · 无 blocking 异常 · 与 BFM step 语义匹配  
**Flow PASS 条件：** 该 flow 全部 step **pass** → flow `verdict: pass`  
**Matrix PASS 条件：** Guide + Provider + Acquisition 三 flow 全 **pass**

---

## 3. Staging 环境 · 固定入口

| 项 | 值 |
|----|-----|
| Web | `https://tt-web-staging.fly.dev` |
| API | `https://tt-api-staging.fly.dev` |
| Provider 子站 | `/market/provider` · onboarding `/provider/register` |
| Acquisition 子站 | `/market/acquisition` · Hub `/me/identities` |
| Guide 发现/预约 | `/market` · `/guides/[id]` |

**密码缺省：** `Test123!`（测试账号 SSOT · 见 `docs/测试账号与本地联调.md`）

---

## 4. 执行顺序（推荐）

| 序 | Flow | Steps | 理由 |
|----|------|-------|------|
| **1** | **Provider** | 5 | BD-005 API 全链 PASS · Phase1 HAT 5 cells synced · 最短闭环模板 |
| **2** | **Guide** | 8 | Sprint A HAT order/pay/complete 已有 API 证据 · BDR Day1 READY |
| **3** | **Acquisition** | 4 | BFM-001 API pilot-owned PASS · 真人层 NOT_EXECUTED · 走 fresh-owner 轨 |

**并行策略：** Provider 与 Guide 可在不同 Owner 会话并行 · Acquisition **建议** Provider 模板完成后执行（共享 market/escrow 语义）

---

## 5. Flow 1 · Provider（5 steps）

**Pilot 主账号：** `merchant@test.com`（active guide `627c8c31…` · BD-005）  
**对拍 Tourist：** `tourist@test.com`（HAT-003 persona PASS）  
**API 对拍（只读 · 不重跑 Fix Validation）：** `SPRINT-B-PROVIDER-HAT-ORDER-LATEST.json`

| # | BFM Step | 真人路径 | 验收标准（五层链） | HAT 交叉映射 |
|---|----------|----------|-------------------|--------------|
| 1 | **register** | `/auth/register?role=provider` → `/provider/register` → KYB/钱包/准入 | 新 provider 账号或 merchant  onboarding 终态 **approved** · API `POST /auth/register` 201/200 · DB `users.role=provider` | `provider.register` pending → **pass** |
| 2 | **product** | Provider 工作台 · 创建商品/listing 草稿 | Listing 草稿存在 · API `POST …/market/provider/listings` 200 · DB `listings.status=draft` | — |
| 3 | **publish** | 发布至 catalog · `/market/provider` 可见 | Published listing · catalog GET 含 production listing（**非** dev/smoke 过滤轨 · 见 BD-005 WARN） · 页面卡片可见 | `provider.browse` 已 pass · 本步强化 **page** 层 |
| 4 | **order** | Tourist 下单 · Provider 接单 | Order `accepted` · API create_order + accept 200 · 对拍 order_id 格式 | `provider.order` 已 pass · 本步补 **human+page** |
| 5 | **complete** | Mock pay → confirm completion | Order `completed` · escrowed → completed · 页面终态一致 | `provider.pay` · `provider.complete` 已 pass · 补 **human+page** |

**Evidence 输出：**

- `evidence/GO_production_readiness/step3/bfm/BFM-PROVIDER-FLOW-LATEST.json`
- `evidence/GO_production_readiness/step3/bfm/BFM-PROVIDER-FLOW-LATEST.md`
- 每 step 子文件：`evidence/GO_production_readiness/step3/bfm/steps/provider-{step}-LATEST.json`

**探针参考（只读 · 执行期不重跑为 PASS 依据）：**

- `scripts/dev/run-sprint-b-provider-hat-order-validation.cjs`
- `scripts/dev/smoke-provider-onboarding-staging.sh`

---

## 6. Flow 2 · Guide（8 steps）

**Pilot 主账号：** `guide@test.com` 或 Sprint A 迪拜 pilot（order ref `e8be4517`）  
**对拍 Tourist：** `tourist@test.com`  
**BDR：** Guide Day1 **READY** · `GUIDE-BUSINESS-DATA-READINESS-DAY1-LATEST.json`

| # | BFM Step | 真人路径 | 验收标准（五层链） | HAT 交叉映射 |
|---|----------|----------|-------------------|--------------|
| 1 | **register** | `/auth/register?role=guide` → guide onboarding | `users.role=guide` · profile 创建 | `guide.register` pending → **pass** |
| 2 | **profile** | Guide 资料页 · 头像/简介/服务城市 | Profile 字段落库 · BDR profile probe 一致 | `guide.login` · `guide.browse` 可同步 |
| 3 | **review** | Admin/运营审核 · `/admin/…` 或 staging 免审路径 | `guides.status=active`（或 staging 等价） | — |
| 4 | **list** | 上架服务 · listing/guide catalog | 公开 discover/guides 可见 | — |
| 5 | **book** | Tourist `/market` 预约/询价 | Booking 请求创建 · API 200 | `tourist.order` 可联动 |
| 6 | **order** | Guide 接单 · 订单详情 | Order `accepted` · 对拍 Sprint A chain | `guide.order` 已 pass · 补 **human+page** |
| 7 | **complete** | Mock pay → 确认完成 | `completed` · 对拍 Sprint A | `guide.pay` · `guide.complete` 已 pass · 补 **human+page** |
| 8 | **review_post** | 完成后评价 | Review 记录存在 · 页面展示 | — |

**Evidence 输出：**

- `evidence/GO_production_readiness/step3/bfm/BFM-GUIDE-FLOW-LATEST.json`
- `evidence/GO_production_readiness/step3/bfm/BFM-GUIDE-FLOW-LATEST.md`
- 每 step：`evidence/GO_production_readiness/step3/bfm/steps/guide-{step}-LATEST.json`

**探针参考：**

- Sprint A HAT evidence（step1/step2 hat 目录）
- `scripts/dev/smoke-ab-core-chain.sh`（本地对拍语义 · staging 手测对照）

---

## 7. Flow 3 · Acquisition（4 steps）

**策略：** **pilot-owned fresh accounts**（BFM-001 `fresh_user_full_chain` PASS）· **非** OCS catalog 主路径  
**OCS catalog（`close_deal` PARTIAL）：** Phase 2 **Optional Extension** · 不阻塞三 flow PASS

**Owner 轨：** fresh owner email · fresh carrier email · 绑钱包 · `/me/identities` 进入子站

| # | BFM Step | 真人路径 | 验收标准（五层链） | HAT 交叉映射 |
|---|----------|----------|-------------------|--------------|
| 1 | **publish** | `/me/identities` → 绑钱包 → publish-bond → 创建 acquisition listing | Listing published · API `POST …/market/acquisition/listings` 200 | `acquisition.register` · `acquisition.login` · `acquisition.browse` |
| 2 | **respond** | Carrier `/market/acquisition` → 响应/创单 | `POST …/orders` 200 · order 创建 | `acquisition.order` |
| 3 | **close_deal** | Accept → mock pay → escrowed | Order `escrowed` · **owner=listing.owner** 约束满足 | `acquisition.pay` |
| 4 | **complete** | Confirm completion | Order `completed` | `acquisition.complete` |

**Evidence 输出：**

- `evidence/GO_production_readiness/step3/bfm/BFM-ACQUISITION-FLOW-LATEST.json`
- `evidence/GO_production_readiness/step3/bfm/BFM-ACQUISITION-FLOW-LATEST.md`
- 每 step：`evidence/GO_production_readiness/step3/bfm/steps/acquisition-{step}-LATEST.json`

**探针参考（只读）：**

- `scripts/dev/run-bfm-001-acquisition-chain-discovery.cjs`
- `scripts/dev/smoke-acquisition-pd009-staging.sh`

---

## 8. Matrix 映射计划（执行后 · 需 Owner 授权）

Phase 2 **执行完成并写入 Evidence 后**，按 Phase 1 同纪律进行 Matrix sync（**本文不执行**）：

### 8.1 Business Flow Matrix

| Flow | Registry 字段 | 触发条件 |
|------|---------------|----------|
| guide | `flows[guide].steps[*].verdict` | 每 step Evidence 五层链 PASS |
| guide | `flows[guide].verdict` | 8/8 steps pass → `pass` |
| provider | 同上 | 5/5 → `pass` |
| acquisition | 同上 | 4/4 → `pass` |

**BFM Gate：** 三 flow 全 `pass` → `TT_BUSINESS_FLOW_MATRIX: PASS` · blocking **17 → 0**

### 8.2 HAT Matrix 交叉映射（Phase 2 附带收口）

| BFM Flow | BFM Steps 完成 | 建议 HAT cells（执行后 sync） |
|----------|----------------|------------------------------|
| Guide | register/profile/review/list/book | `guide.register` · `guide.login` · `guide.browse` |
| Guide | order/complete | 已有 pass · 更新 note 含 BFM Evidence ref |
| Provider | register | `provider.register` |
| Provider | order/complete（human 层） | 已有 pass · note 追加 BFM human ref |
| Provider | — | `provider.logout` 若会话手测 PASS |
| Acquisition | 全链 | `acquisition.*` 七步中 applicable cells（order/pay/complete/login/browse） |
| Tourist | book/order（Guide 对拍） | `tourist.order` · `tourist.pay` · `tourist.complete` |

**预估 Gate 影响（执行 + 双 Matrix sync 后）：**

| 指标 | 当前 | Phase 2 后（估） |
|------|------|-----------------|
| BFM blocking | 17 | **0** |
| HAT blocking | 27 | **~15–20**（视交叉映射范围） |
| Total blocking | 54 | **~37–42** |
| `TT_PRODUCTION_ENTRY_READY` | NO_GO | **NO_GO**（仍缺 Manual/BDR/HAT 余量） |

---

## 9. 执行会话清单（Owner / QA）

### Session A · Provider（~45–60 min）

1. [ ] Chrome 登录 `merchant@test.com`
2. [ ] 走 register/onboarding（或确认已 approved）
3. [ ] 工作台创建 + 发布 listing
4. [ ] `/market/provider` 确认 catalog 可见
5. [ ] `tourist@test.com` 下单 · merchant 接单
6. [ ] Mock pay · 确认完成
7. [ ] 导出 Network HAR + 截图 → `BFM-PROVIDER-FLOW-LATEST.json`

### Session B · Guide（~60–90 min）

1. [ ] Guide 注册/资料/审核/上架
2. [ ] Tourist 预约
3. [ ] 接单 → mock pay → 完成 → 评价
4. [ ] 导出 Evidence → `BFM-GUIDE-FLOW-LATEST.json`

### Session C · Acquisition（~45–60 min）

1. [ ] Fresh owner 注册 · `/me/identities` 绑钱包
2. [ ] Publish bond + listing
3. [ ] Fresh carrier 响应创单
4. [ ] Accept · mock pay · complete
5. [ ] 导出 Evidence → `BFM-ACQUISITION-FLOW-LATEST.json`

### 执行后（需授权）

1. [ ] Owner 审阅三份 Flow Evidence
2. [ ] BFM Matrix sync（17 steps + 3 flow verdicts）
3. [ ] 可选 HAT Matrix 交叉 sync
4. [ ] `run-production-readiness-master-checklist.cjs` 复算
5. [ ] 写 `PHASE2-BFM-HUMAN-VALIDATION-EXECUTION-LATEST.json`

---

## 10. 明确不做

| 项 | 说明 |
|----|------|
| 修改 Matrix | 本文 plan only · sync 须 Phase 2 Owner Authorization |
| 代码 / staging 数据 | 禁止 · 仅真人操作现有环境 |
| 重跑 BD-005 / HAT-003 Fix Validation | Phase1 已 sync · 仅作 API 对拍 |
| `TT_SPRINT_B_ACTIVE=true` | 不在 Phase 2 范围 |
| REDEFINE / 新 Open RC | 禁止 |
| OCS catalog 主路径 | Optional · 不阻塞 Phase 2 exit |

---

## 11. Phase 2 执行前提（待 Owner）

| 字段 | 当前 | 执行前需 |
|------|------|----------|
| `bfm_human_validation_authorized` | false | Owner 签核 Phase 2 Authorization |
| `matrix_sync_authorized` | Phase1 only | Phase 2 BFM sync 可合并或分文档授权 |

**推荐下一步：** 起草 `OWNER-PHASE2-BFM-HUMAN-VALIDATION-AUTHORIZATION-REQUEST` · Owner 签核后按 §4 顺序执行 Session A→B→C
