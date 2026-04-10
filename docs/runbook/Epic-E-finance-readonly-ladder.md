# Epic E：只读财务对账视角（Admin）— 阶梯稿（E-01～E-10）

**策略定位**：在 **不修改 B-115、B-116、P5、Epic A、Epic C、Epic D 已封口语义** 的前提下，以 **只读 API 为主入口**、**脚本仅为消费层**，提供一页 **「财务 / 对账视角」** 枢纽；**不新造第二套 Σ**（不在服务端或前端重算并行汇总）。行为约束以本 Runbook 为长期 SSOT，避免后续 AI 或人工误改。

**互证**：**[04 §3.4 / 契约段落](../spec/04-后端与API.md)**、**[200 · 财务阶段规格](../spec/200-阶段财务对账结算与报表.md)**、**[70 · 管理员系统](../spec/70-管理员系统开发文档.md)**、**[Epic D 阶梯](./Epic-D-indexer-ops-readonly-ladder.md)**（证据与 `traveltrust.ops_artifact.v1`）、**[Epic-D-ops-artifact.v1.example-d10-go-bundle](./Epic-D-ops-artifact.v1.example-d10-go-bundle/README.md)**。

---

## 体系层级（单向、无环路）

```text
链（SSOT）
  → DB projection
  → Epic D（对账 + 证据 / bundle_closure）
  → API（只读 contract）
  → Epic E（财务视角 UI）
  → script（连通性 / 形状验证）
```

---

## Epic E 全程硬边界

- **不修改** 已封口目录下的 **行为、路由契约或分配语义**（**B-115 / B-116 / P5 / Epic A / Epic C / Epic D**）。
- **主入口**：只读 **HTTP API**；**不得** 出现「仅脚本具备、无 API 对应」的对账真值。
- **无二 Σ**：展示与导出仅映射 **API 已返回字段** 或 **已持久化结构**；禁止为 Epic E 新增「另一套」服务端聚合或前端 `reduce` 业务合计。
- **脚本**：仅 **curl / jq / 文件读取**；**禁止** 跨接口数值对拍推导 drift 或一致性（见 **E-10**）。

---

## 分批执行与风险标记

| 批次 | 步骤 | 风险 | 说明 |
|------|------|------|------|
| 第 1 批 | E-01～E-03 | 低 | 纯文档 |
| 第 2 批 | E-04 | 低 | UI 壳与导航 |
| 第 3 批 | E-05～E-06 | **高** | **数据语义核心**；建议 **单独 PR + 单独审查** |
| 第 4 批 | E-07～E-08 | 中 | Epic D 对照说明 + contract 测 |
| 第 5 批 | E-09～E-10 | 中 | Runbook 操作说明 + smoke 脚本 |

**建议**：不要一次性让 AI 跑满十步；按上表分批合入。

---

## E-01～E-10 顺序与只读操作方式（运维速查）

**顺序（固定）**：**E-01 → E-02 → E-03 → E-04 → E-05 → E-06 → E-07 → E-08 → E-09 → E-10**。

下表仅描述**各步值班/审阅时如何只读操作**；**HTTP 真值以 API 为准**，**脚本与落盘 JSON 均非 SSOT**（与上文「体系层级」一致）。**禁止**在下表或附录中引入跨接口数值运算、差分或「推导 drift」。

| 步骤 | 只读操作方式 |
|------|----------------|
| **E-01** | 打开 **[04 §3.4](../spec/04-后端与API.md)**，检索财务枢纽相关 **Admin GET** 与 **无二 Σ** 句；用 **`rg`** 验收（见该步「最小验收」）。 |
| **E-02** | 打开 **[200](../spec/200-阶段财务对账结算与报表.md)** 中 Epic E 边界短节；只读确认「只读入口 / 非结算流水线」。 |
| **E-03** | 打开 **[70](../spec/70-管理员系统开发文档.md)** 中读者路径表；只读核对 URL 与 API 列表。 |
| **E-04** | 浏览器在已登录 **Admin** 下 **GET** **`/admin/finance-reconciliation`**（壳与深链；无业务演算）。 |
| **E-05** | 同上页内 **`finance/summary`** 块，或 **curl** **`GET /api/v1/admin/finance/summary`**（见下文 **E-09**）；仅查看已返回字段，**不**自造合计。 |
| **E-06** | 页内 **`cross-check` / `drift-summary`** 块，或 **curl** 两路 **GET**（见 **E-09**）；**不**把两路响应做算术对拍。 |
| **E-07** | 阅读页内 **Epic D** 对照说明；本地只读打开 **`evidence/GO_YYYYMMDD/epic_d_go_bundle_closure.json`**（与 **[Epic D 阶梯](./Epic-D-indexer-ops-readonly-ladder.md)**、**[example-d10-go-bundle](./Epic-D-ops-artifact.v1.example-d10-go-bundle/README.md)** 同形）。 |
| **E-08** | 运行契约测试（形状 / 已用键路径）：**`cd frontend && npx vitest run lib/financeReconciliationHub.contract.test.ts`**（路径以仓库为准）。 |
| **E-09** | 以**本节 Runbook** 为操作 SSOT：**curl** 占位、**Authorization** 约定、**jq** 仅校验 **bundle** 文件结构（见下文 **「E-09 运维操作」**）。 |
| **E-10** | 若已合入：**`bash scripts/finance-readonly-smoke.sh`**（各 **GET** 独立、**exit** 仅表达连通性 + 单响应形状，**不**表达业务对账结论）；脚本**不得**改 **Epic D** 既有脚本语义。 |

---

## E-01 — 04 契约切片（API + Epic D 对齐，无二 Σ）

| 项 | 内容 |
|----|------|
| **目标** | 在 **04** 登记财务枢纽依赖的只读路径（与实现一致）：如 **`GET /api/v1/admin/finance/summary`**、**`GET /api/v1/admin/cross-check`**、**`GET /api/v1/admin/drift-summary`**、reconcile 列表 / 单条 / 导出；**Epic D** **`epic_d_go_bundle_closure.json`** 根级 **`bundle_closure`**（`epic` / `closure_status` / `artifact_version` / `included_tasks`）。写明禁止新并行汇总。 |
| **≤5 文件** | `docs/spec/04-后端与API.md` |
| **AI 执行话术** | 「只补 04 契约句；路径与现网路由一致；不写新 Σ；不动 B-115/B-116/P5/A/C/D 封口。」 |
| **最小验收** | `rg -n "finance/summary|cross-check|drift-summary|bundle_closure|Epic E" docs/spec/04-后端与API.md` |
| **产物** | `docs/spec/04-后端与API.md` |

---

## E-02 — 200 规格边界（Epic E 只读 vs 未来结算）

| 项 | 内容 |
|----|------|
| **目标** | 在 **200** 增加短节：Epic E = 只读入口 + 运维消费；非目标 = 新结算流水线、新账套、新聚合 Σ；指回 04。 |
| **≤5 文件** | `docs/spec/200-阶段财务对账结算与报表.md` |
| **AI 执行话术** | 「200 只划边界；不扩展已闭合财务叙事。」 |
| **最小验收** | `rg -n "Epic E|只读|bundle_closure" docs/spec/200-阶段财务对账结算与报表.md` |
| **产物** | `docs/spec/200-阶段财务对账结算与报表.md` |

---

## E-03 — 70 管理员文档（读者路径）

| 项 | 内容 |
|----|------|
| **目标** | 在 **70** 增加财务/对账只读导航：入口页 URL、对应 API、Epic D 证据目录约定（引用本 Runbook / Epic D ladder）。 |
| **≤5 文件** | `docs/spec/70-管理员系统开发文档.md` |
| **AI 执行话术** | 「70 只加读者路径表；不改 Admin 行为定义。」 |
| **最小验收** | `rg -n "finance-reconciliation|finance/summary|cross-check|drift-summary|Epic E" docs/spec/70-管理员系统开发文档.md` |
| **产物** | `docs/spec/70-管理员系统开发文档.md` |

---

## E-04 — 财务视角枢纽页骨架 + Admin 导航

| 项 | 内容 |
|----|------|
| **目标** | 新增 **`/admin/finance-reconciliation`**（或仓库内统一命名）**layout + page**：标题、只读说明、深链 **`/admin/finance`**、**`/admin/cross-check`**、**`/admin/drift-summary`**、indexer reconcile 相关现有路由。**不** 复制业务逻辑。在 **AdminShellBar** / **AdminHomeClient** 增加一条入口。 |
| **≤5 文件** | `frontend/app/admin/finance-reconciliation/page.tsx`、`layout.tsx`、`frontend/components/admin/AdminShellBar.tsx`、`frontend/components/admin/AdminHomeClient.tsx`（子集，总数 ≤5） |
| **AI 执行话术** | 「仅壳与链接；数据块留给 E-05/E-06。」 |
| **最小验收** | `cd frontend && npx tsc --noEmit` |
| **产物** | 上述 frontend 路径 |

---

## E-05 — 接入 `finance/summary`（展示已有 meta；三道防线）

| 项 | 内容 |
|----|------|
| **目标** | 用与 **`/admin/finance`** 相同模式 **`adminFetchJson`** 调用 **`GET /api/v1/admin/finance/summary`**，展示 **已有** `meta` 与最近 projection reconcile 摘要；深链 reconcile 列表/详情。 |
| **防线 A — 禁止 fallback / 假合计** | 若依赖字段 **缺失** / **`null`** / 未返回：**不得** fallback 为 `0`；**不得** 默认合计；**不得** `items.reduce(...)` 推导业务总额或条数。必须显示 **`data_unavailable`**（或统一 i18n key）。 |
| **防线 B — 字段级来源锁** | **每个**展示指标必须标注其 **API JSON path**（如 `meta.db_order_count`）。**禁止** 将多个 API 字段 **拼接 / 合并** 成新的业务字段（**禁止** 如 `meta.completed + meta.pending` 式「隐式 Σ」）。合法：单路径 `meta.total_orders`（若 API 原生提供）。 |
| **≤5 文件** | `page.tsx`、可选 `FinanceReconciliationSummaryCard.tsx`、`frontend/lib/api.ts`（路由常量） |
| **AI 执行话术** | 「E-05 只做 1:1 映射 + 来源 path 标签；缺字段一律 `data_unavailable`；禁止拼接多字段造新指标。」 |
| **最小验收** | `cd frontend && npx tsc --noEmit` |
| **产物** | 上述 frontend 文件 |

---

## E-06 — 接入 `cross-check` + `drift-summary`（投影语义 + 不可绿灯默认）

| 项 | 内容 |
|----|------|
| **目标** | 枢纽页增加只读块：请求 **`GET /api/v1/admin/cross-check`**、**`GET /api/v1/admin/drift-summary`**，展示 **`drift_detected` / `delta`**（或现有字段）**摘要**；完整交互链到 **`/admin/cross-check`**、**`/admin/drift-summary`**。**不** 改 `admin_cross_check` 等后端语义。 |
| **语义标签（继承 Epic C）** | **projection ≠ chain truth**。展示须带 **数据源** 说明（如 **`data_source: "projection"`** 或等价文案）。**`chain_alignment_status`**：若 API 已有同义字段则绑定现有关键字；否则用固定枚举（**`aligned` / `not_aligned` / `unknown`**），且 **`unknown` 不得当作健康**。 |
| **防线 — drift UI 不可绿灯默认** | 当 drift 相关字段 **缺失** 或状态为 **`unknown`**：**不得** 使用绿色或「正常」语义；须 **中性（灰）** 或 **警示（黄）**，避免「API 未返回 → UI 像 OK」。 |
| **≤5 文件** | `page.tsx` 或独立小组件、`frontend/lib/api.ts` 等，≤5 |
| **AI 执行话术** | 「E-06 必须标注 projection 数据源与链对齐语义；禁止无标签裸展示；禁止缺省绿。」 |
| **最小验收** | `cd frontend && npx tsc --noEmit` |
| **产物** | 上述 frontend 文件 |

---

## E-07 — Epic D 产物对照区（说明 + i18n）

| 项 | 内容 |
|----|------|
| **目标** | 页内静态说明：**`evidence/GO_YYYYMMDD/epic_d_go_bundle_closure.json`** 的 **`bundle_closure.included_tasks`** 与「本页链接的只读能力」对照表；外链 **Epic D ladder**、**example-d10-go-bundle**。**不** 在页内用第二套算法重算任务列表。 |
| **≤5 文件** | `page.tsx` 或 `FinanceReconciliationEpicDHint.tsx`、`frontend/locales/en.ts`、`frontend/locales/zh.ts` |
| **AI 执行话术** | 「仅说明与外链；与 ladder 字段名一致。」 |
| **最小验收** | `cd frontend && npx tsc --noEmit` |
| **产物** | 上述 frontend 文件 |

---

## E-08 — `apiClient` 契约测试（形状，不断言业务 Σ）

| 项 | 内容 |
|----|------|
| **目标** | 为枢纽消费的 JSON 增加 **contract test**（与仓库 `*.contract.test.ts` 一致）：断言**已用键路径存在**；**不断言**金额或自定义聚合。 |
| **≤5 文件** | `frontend/lib/financeReconciliationHubPaths.ts`、`frontend/lib/financeReconciliationHub.contract.test.ts`、枢纽 `page.tsx` 等，≤5 |
| **AI 执行话术** | 「契约只 stabilise 形状；mock 对齐现有 admin/governance contract。」 |
| **最小验收** | **`cd frontend && npx vitest run lib/financeReconciliationHub.contract.test.ts`** |
| **产物** | `frontend/lib/financeReconciliationHub*.ts` 等 |

---

## E-09 — 本 Runbook 操作节（curl / 验收命令）

| 项 | 内容 |
|----|------|
| **目标** | 在本文件或同目录补充 **「操作」** 小节：`curl` 示例（`Authorization` 占位）、可选本地 **`jq`** 校验 **`bundle_closure`** 结构；明确脚本 **不能** 替代 API 为 SSOT。 |
| **≤5 文件** | 以本文件为主；可加 `examples/` 下静态片段，总数 ≤5 |
| **AI 执行话术** | 「操作说明与 04 路径一致；不改 Epic D 脚本语义。」 |
| **最小验收** | 本文件含 **「操作 / 验收命令」** 段落 |
| **产物** | `docs/runbook/Epic-E-finance-readonly-ladder.md`（及可选示例） |

---

## E-10 — `finance-readonly-smoke.sh` + exit code 语义锁

| 项 | 内容 |
|----|------|
| **目标** | **`scripts/finance-readonly-smoke.sh`**（Git Bash）：对 **`finance/summary`**、**`cross-check`**、**`drift-summary`** **分别** GET，检查 HTTP 与**各接口自有**约定顶层键；可选对本地 **`epic_d_go_bundle_closure.json`** 仅 **`jq` 结构**校验。 |
| **禁止 — 第三套对账** | **不得** 对 **多接口响应** 做差值、比值或交叉推导；**不得** 由脚本 **推导** drift 或「数据是否一致」。 |
| **防线 — exit code 语义锁** | **0**：接口可达且**单接口**结构符合约定；**非 0**：不可达或结构不符。**不得** 用 exit code 表达「数据是否一致」或「drift 是否存在」（**禁止** 如 `drift_detected=true` → `exit 1`）。 |
| **≤5 文件** | `scripts/finance-readonly-smoke.sh`、`evidence/GO_EPIC_E_FINANCE_READONLY_CLOSE.md`（可选）、`scripts/README.md` 索引一行 |
| **AI 执行话术** | 「脚本 = 连通性 + 单接口形状 + 可选 jq 文件结构；exit 不含业务对账结论。」 |
| **最小验收** | **`FINANCE_READONLY_SMOKE_SKIP=1 bash scripts/finance-readonly-smoke.sh`**（占位 **exit 0**）；全量：**`bash scripts/finance-readonly-smoke.sh`**（须 **`ADMIN_BEARER_TOKEN`** + **jq** + 可达 API）；**`cd frontend && npx vitest run lib/financeReconciliationHub.contract.test.ts`**；仓库默认后端 **`cargo test -p traveltrust-api`**；**`cd frontend && npx tsc --noEmit`** |
| **产物** | `scripts/finance-readonly-smoke.sh` 等 |

---

## 连续顺序（Epic E 内）

与上文 **「E-01～E-10 顺序与只读操作方式」** 相同：**E-01 → … → E-10**。

---

## E-09 运维操作：`curl`、Authorization、本地 `jq`（仅结构）

本节为 **Epic E** 值班**可复制**的只读操作说明；**不**新增对账逻辑；**不**修改 **[Epic D 阶梯](./Epic-D-indexer-ops-readonly-ladder.md)** 或 **`write-indexer-evidence.*` / `internal-indexer-ops.*`** 等脚本的语义与行为。

### Authorization 占位（与现有运维脚本一致）

- **头格式**：**`Authorization: Bearer <Admin JWT>`**。
- **环境变量**：与 **`scripts/indexer-public-snapshot.sh`**（可选 **`ADMIN_BEARER_TOKEN`**）、**`scripts/vault-forwarded-export-fetch.sh`**（**`ADMIN_BEARER_TOKEN`**）同源；文档中可写 **`${ADMIN_BEARER_TOKEN}`** 或占位 **`<ADMIN_BEARER_TOKEN>`**。
- **基址**：与上列脚本一致，默认 **`API_BASE_URL=http://127.0.0.1:8080`**（可按环境改写）。
- **安全**：**勿**将真实 token 写入仓库、Runbook 定稿或 **evidence** 包；本地临时 **`export ADMIN_BEARER_TOKEN='…'`** 即可。

### `curl` 示例（三路 Admin 只读 GET，各自独立）

**仅**检查各端点可达性与**单路**响应是否为 JSON；**禁止**对两路及以上响应做差、比、或推导一致性。

**1）HTTP 状态码（最小）**

```bash
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
# export ADMIN_BEARER_TOKEN='…'   # 本地填写；勿入库

curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
  "${API_BASE_URL}/api/v1/admin/finance/summary"

curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
  "${API_BASE_URL}/api/v1/admin/cross-check"

curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
  "${API_BASE_URL}/api/v1/admin/drift-summary"
```

**2）仅看 JSON 顶层键名（结构窥探，不断言金额/条数）**

```bash
curl -sS -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
  "${API_BASE_URL}/api/v1/admin/finance/summary" | jq -c 'keys'

curl -sS -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
  "${API_BASE_URL}/api/v1/admin/cross-check" | jq -c 'keys'

curl -sS -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
  "${API_BASE_URL}/api/v1/admin/drift-summary" | jq -c 'keys'
```

### 本地 `jq`：仅检查 `epic_d_go_bundle_closure.json` 结构

下列命令**只**用于确认 **Epic D-10** 落盘文件里 **`bundle_closure`** 的**形状**（键是否存在、类型粗看）；**不是** API SSOT；**禁止**与上一节 **`curl`** 结果做跨源数值对拍或运算。

```bash
CLOSURE_JSON="evidence/GO_20260409/epic_d_go_bundle_closure.json"
# 按当日 GO 目录改路径；静态样例见 ./Epic-D-ops-artifact.v1.example-d10-go-bundle/

# 根级 bundle_closure 四键是否存在（结构）
jq -e '.bundle_closure | type == "object"
  and (has("epic") and has("closure_status") and has("artifact_version") and has("included_tasks"))' \
  "$CLOSURE_JSON" >/dev/null && echo "bundle_closure shape ok"

# 人读：四键摘要（不暗示与 Admin API 数值一致）
jq '.bundle_closure | {epic, closure_status, artifact_version, included_tasks}' \
  "$CLOSURE_JSON"
```

**验收本文件存在**（CI/本地）：**`test -f docs/runbook/Epic-E-finance-readonly-ladder.md`**
