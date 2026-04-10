# Epic C：Admin 对拍 / Drift 只读解释层 — 10 个连续 Task（Cursor 可执行）

**策略定位**：在已有 **`GET /api/v1/admin/cross-check`**（三槽对拍）与 **`GET /api/v1/admin/drift-summary`**（漂移摘要）之上，做 **Admin 内可读的只读 UI** 与 **来源语义（chain_ssot / projection / reference）** 展示。**不**新增 **`/api/v1/*` 路由**；**不**改 **`crates/api`** 对拍算法或 B-115/B-116/P5 封口路径；**不**从本 Epic 触发 **资金写入、索引器 execute、或「一键修复 drift」** 类交互。

**与 Epic A 的刻意边界（勿混）**

- **Epic A** 已钉死：**无 Timelock ETA / 块高 SSOT** → **`readiness ≠ 实际可执行`** → **Execute 仅 skeleton** → **不接钱包、不广播**。  
- **Epic C** 同样是 **解释层**：**`drift-summary` 与 `delta` 不是「自动纠偏指令」**；UI **不得**暗示点按钮即可上链修正，除非 **另开 Epic** 并走 Runbook/权限模型。  
- **Epic A2（执行交互层）**（钱包、真实 `execute`、引入 ETA 等）与 **Epic C** **正交**；未单独立项前 **禁止** 在本 Epic 内「顺手」接钱包或拼装交易。

**硬约束（每条 Task 遵守）**

- 单 Task **建议触及文件 ≤ 5**（含测试、i18n）；超出拆下一 Task。
- **不新增** Admin/Governance **GET**（路由已在 **`read_contract_route_guard`** 登记，见 **[read-contract-admin-read-apis.md](./read-contract-admin-read-apis.md)**）。
- **禁止**修改 **B-115 / B-116 / P5** 已封口实现文件（含专用 `governance` 深改路径）；仅允许 **Admin 前端** 与 **共用 apiClient** 中与上述域 **无耦合** 的增量。
- 合入前建议：`cd frontend && npm run lint && npx tsc --noEmit`；相关包：`npm test -- --run <pattern>`。

**Read Contract / 真形**

- **`GET …/admin/cross-check`**：外廓三槽；子体 **`source_kind`** 由后端校验 — 见 **read-contract-admin-read-apis.md** §`cross-check`。  
- **`GET …/admin/drift-summary`**：**projection** 摘要 — 见同文档 §`drift-summary`。  
- **代码索引**：`crates/api/src/routes/admin_cross_check.rs`、`get_admin_drift_summary`（`admin.rs`）。

---

## Task C-01 — 路由常量 + 只读客户端

**文件（≤5）**：`frontend/lib/api.ts`（`routes.adminCrossCheck`、`routes.adminDriftSummary`）、`frontend/lib/apiClient/adminCrossCheck.ts`（或并入现有 `admin` 客户端文件）、`frontend/lib/apiClient/index.ts`（导出）、（可选）`frontend/lib/apiClient/adminCrossCheck.test.ts`

**要点**

- `fetch` + `getAuthHeaders` + `parseResponse` / `throwUnlessApiOk` 与 **`finance/summary`** 等现有 Admin GET **同形**。  
- **不**在客户端「重算 drift」；**不**缓存作 SSOT。

**验收**

```bash
cd frontend && npx tsc --noEmit && npm run lint
npm test -- --run adminCrossCheck
```

---

## Task C-02 — 最小响应类型与「不伪造形状」策略

**文件（≤5）**：`frontend/lib/apiClient/adminCrossCheck.ts`（或 `types` 旁）、注释说明 **宽类型 + 运行时安全展示**

**要点**

- 对 **`cross-check`** 三槽：优先 **`unknown` + 按 key 安全读取** 或 **窄接口仅含文档已承诺字段**；**禁止**为通过 tsc 而编造未在 04/契约中承诺的字段。  
- **`drift-summary`**：`drift_detected`、`delta` 等与 **`admin_read_contract_contract_tests`** 对齐。

**验收**

```bash
cd frontend && npx tsc --noEmit
```

---

## Task C-03 — `/admin/cross-check` 页壳（加载 / 错 / 重试 / 只读声明）

**文件（≤5）**：`frontend/app/admin/cross-check/page.tsx`、`loading.tsx`（若与全站一致可复用）、`frontend/locales/en.ts`、`frontend/locales/zh.ts`

**要点**

- **Admin 鉴权**与现有 admin 页 **同模式**（未登录 / 非 admin → 既有处理）。  
- **`ApiErrorAlert` + `common_retry`**；页首 **只读** 说明：三槽为 **对拍视图**，**非**链上写入入口。

**验收**

```bash
cd frontend && npm test -- --run adminCrossCheckPage.contract
# 若无契约文件：先 C-08 补最小契约或本 Task 末尾补 smoke 断言源文件字符串
```

---

## Task C-04 — 三槽展示（结构优先，避免整页裸 JSON）

**文件（≤5）**：`frontend/components/admin/AdminCrossCheckSlots.tsx`（或同级）、`frontend/app/admin/cross-check/page.tsx`（接线）、`frontend/locales/en.ts`、`frontend/locales/zh.ts`

**要点**

- 三槽命名与 **read-contract** 一致：**fee_pool_projection**（projection）、**governance_pool_chain**（chain_ssot）、**protocol_reference**（reference）。  
- 每槽展示 **`source_kind`** / **`data_source`**（若槽内存在）等 **契约允许** 的字段；大段 body 可用 **`<details>`** 或折叠 **`<pre>`**。  
- **禁止**根级冒充 **`chain_read` SSOT**（与 Admin Read Contract 全局禁令一致）。

**验收**

```bash
cd frontend && npm test -- --run AdminCrossCheckSlots
# 或组件 + contract 二选一
```

---

## Task C-05 — `/admin/drift-summary` 页（漂移摘要 + delta）

**文件（≤5）**：`frontend/app/admin/drift-summary/page.tsx`、`frontend/locales/en.ts`、`frontend/locales/zh.ts`、（可选）小组件 `AdminDriftSummaryPanel.tsx`

**要点**

- 突出 **`drift_detected`**（或等价布尔）与 **`delta`** 列表；**明确标注 projection / 非链上单一真值**。  
- **无**「应用修复」「提交链上」类 CTA；若需指向运维，仅 **文档链接**（Runbook / internal-tools）。

**验收**

```bash
cd frontend && npm test -- --run adminDriftSummaryPage.contract
```

---

## Task C-06 — i18n：槽名、来源枚举、错误与免责声明

**文件（≤5）**：`frontend/locales/en.ts`、`frontend/locales/zh.ts`、（可选）与 C-03/C-04/C-05 同批微调

**要点**

- 与 **Epic A** 的 **`GovExecReadOnlyI18n`** 类似：关键句 **集中键名**，避免列表/详情/Admin **口径漂移**。  
- 免责声明：**delta 仅观测**；**不**等价于财务关账或自动调账。

**验收**

```bash
cd frontend && npm run test:i18n:ci
```

---

## Task C-07 — Admin 首页 / 导航入口

**文件（≤5）**：`frontend/components/admin/AdminHomeClient.tsx`（或 70 规范规定的导航组件）、`frontend/app/admin/cross-check/page.tsx`（`metadata` 若需要）、`frontend/app/admin/drift-summary/page.tsx`

**要点**

- 在 **Admin 内可见**位置增加 **Cross-check**、**Drift summary** 链（与 **finance**、**indexer** 并列层级由产品决定）。  
- **不**在公共顶栏曝光。

**验收**

```bash
cd frontend && npm test -- --run AdminHomeClient
# 若无单测：契约断言 AdminHomeClient 源文件含 href 或路由常量
```

---

## Task C-08 — 契约测试（页面 / 客户端字符串锚点）

**文件（≤5）**：`frontend/app/admin/cross-check/adminCrossCheckPage.contract.test.ts`、`frontend/app/admin/drift-summary/adminDriftSummaryPage.contract.test.ts`、`frontend/lib/apiClient/adminCrossCheck.contract.test.ts`

**要点**

- 断言 **`getAdminCrossCheck` / `getAdminDriftSummary`**（或实际函数名）与 **`routes.admin*`** 出现；**断言无** `sendTransaction` / `writeContract` / `POST` drift-fix 等字样（与 **GovernancePreExecutionHint.contract** 同思路）。

**验收**

```bash
cd frontend && npm test -- --run adminCrossCheckPage.contract
cd frontend && npm test -- --run adminDriftSummaryPage.contract
```

---

## Task C-09 — 横向链出（可选 · 只读）

**文件（≤5）**：`frontend/app/admin/finance/page.tsx` 或 `frontend/app/admin/indexer/reconcile-reports/page.tsx`、i18n 各 1 条

**要点**

- **一行**「另见：Drift summary / Cross-check」**链接**；**不**改变原有 GET 与业务逻辑。

**验收**

```bash
cd frontend && npx tsc --noEmit
```

---

## Task C-10 — Epic C 收口

**文件（≤5）**：本文件（勾选清单）、`docs/任务母表.md`（**Epic-C** 行，选做）、`evidence/GO_EPIC_C_*.md`（选做）、`frontend/README.md`（验收命令一行，选做）

**要点**

- 勾选 **C-01～C-09**；重申 **未新增 GET**、**未触 B-115/B-116/P5**、**无资金写入 UI**。  
- 与 **Epic A** 边界：**本 Epic 不引入钱包、不引入 Timelock ETA、不将 drift 解释为「可一键执行」**。

**验收**

```bash
cd frontend && npm run lint && npx tsc --noEmit
npm run test:i18n:ci
npm test -- --run adminCrossCheck
npm test -- --run cross-check/page
npm test -- --run drift-summary/page
npm test -- --run page.c08-contract
npm test -- --run AdminShellBar
npm test -- --run AdminHomeClient
npm test -- --run AdminAuditCompareLinks
```

**收口文档**：本文件 **Epic C 完成清单** 勾选 + **[docs/任务母表.md](../任务母表.md)** **Epic-C** 行 + **[evidence/GO_EPIC_C_ADMIN_CROSS_CHECK_DRIFT_UI_CLOSE.md](../../evidence/GO_EPIC_C_ADMIN_CROSS_CHECK_DRIFT_UI_CLOSE.md)** + **[evidence/README.md](../../evidence/README.md)** §Epic C。

---

## Epic C 完成清单（执行后勾选）

- [x] C-01～C-09 已合入且对应 **验收命令** 通过  
- [x] **未**新增 **`/api/v1/*` GET**  
- [x] **未**修改 **B-115 / B-116 / P5** 封口代码路径  
- [x] **未**引入 **钱包连接 / 链上交易提交 / drift 自动修复**（保留只读解释层）  
- [x] 与 **Epic A / Epic A2** 边界在文案与交互上 **未被突破**（见 **GO_EPIC_C** §边界）

**母表 / 索引**：**Epic-C** 行 + **`TT-DOC-EPIC-C-ADMIN-CROSS-CHECK-DRIFT-UI-CLOSE-001`** — [docs/任务母表.md](../任务母表.md)；证据 **[evidence/GO_EPIC_C_ADMIN_CROSS_CHECK_DRIFT_UI_CLOSE.md](../../evidence/GO_EPIC_C_ADMIN_CROSS_CHECK_DRIFT_UI_CLOSE.md)**。

---

## 纯文档小习惯

- 相对链接可点开；**read-contract-admin-read-apis.md** 与 **本 ladder** 互链保持最新。  
- **70-管理员系统开发文档**：若规定 Admin IA，更新 **目录/权限** 与 Epic C 路由一致。
