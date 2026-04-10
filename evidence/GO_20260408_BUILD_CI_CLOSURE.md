# Build（`build.yml`）全绿收口留痕 · 2026-04-08

| 字段 | 值 |
|------|-----|
| **收口结论** | **GitHub Actions · `build.yml` 全绿**（`frontend` / `e2e` / `build` / `a11y` 等 job 均 success） |
| **权威 Run ID** | **`24139191178`** |
| **触发提交（tip）** | **`2364f55`**（`test(e2e): scope dispute intent alert assertions to main content`） |
| **工作流** | 仓库根 **[`.github/workflows/build.yml`](../.github/workflows/build.yml)** |

本文档为 **可进 git 的静态台账**：记录本轮为打通 **Build** 所串联的修复要点，供后续 **新卡从新问题起算**，**不回扫**本条已收口链。

---

## Baseline（回归参照）

**Baseline:** Build **24139191178** is the stable baseline.  
**Rule:** Any regression must be compared against this run.

**作用**：`build.yml` 再次失败时，以本 Run 为 **回退参照点**，优先判断是 **新问题** 还是 **相对 baseline 的回归**；必要时与 **`2364f55`**（或当时 tip）对照做 bisect。

### 稳定性附注（重复执行复验 · 2026-04-08）

- **方法**：对权威 Run **`24139191178`** 使用 `gh run rerun` **连续 3 次**（同一 commit **`2364f55`**，每次由独立 runner 执行完整 `build.yml`）。
- **观测**：三次 **workflow** 与 **`e2e` job** 结论均为 **success**，未发现非确定性失败。
- **工程判断**：在本样本下 baseline 从「单次偶然全绿」提升为 **重复执行仍全绿** 的 **stable baseline**；**无需**为 flakiness 单独开卡。后续 **新红链** 默认按 **相对 baseline 的新问题** 分流，**不**先怀疑 baseline 抖动。
- **限度**：样本量 **n=3** 不能证明绝对无 flake，但对当前阶段已足够作为日常回归参照。

**系统状态（摘录）**：Stable baseline run **`24139191178`** · SHA **`2364f55`** · Regression rule：新失败先按「相对 baseline 的新问题」分流 · Default policy：不回扫已收口链，除非明确做回归比对。

<a id="baseline-regression-hint-ci"></a>

### Baseline regression hint 已接入 CI

- **脚本**：仓库根 **[`scripts/check-baseline-regression.sh`](../scripts/check-baseline-regression.sh)**（只读环境变量，**始终 exit 0**）。
- **工作流位置**：**`build.yml`** → **`e2e` job** → 步骤名 **`Baseline regression hint (informational, non-blocking)`**（紧随 **`E2E (Playwright)`**，**`if: always()`**）。
- **门禁性质**：**非阻断**；不改变 **`e2e`** 成败，仅追加日志。
- **日志字段（可复制检索）**：`baseline_run_id`、`baseline_sha`、`current_run_id`、`current_sha`、`e2e_step_outcome`、`diff_conclusion`（**`e2e` 失败**时为 **`REGRESSION_VS_BASELINE`**，成功时为 **`NO_REGRESSION_SIGNAL`**，其余为 **`UNCLASSIFIED`**）。
- **索引入口**（从总目录直达）：**[evidence/README.md — baseline-regression-hint-readme](README.md#baseline-regression-hint-readme)**。

<a id="go-no-go-hint-ci"></a>

### GO/NO-GO hint 已接入

- **脚本**：**[`scripts/check-go-no-go.sh`](../scripts/check-go-no-go.sh)**（**始终 exit 0**）；汇总 **`E2E (Playwright)` 步骤 outcome**（与 baseline hint 同源 **`diff_conclusion`** 推导）、**Build 十条并行 job** 的 **`needs.*.result`**，给出三态。
- **工作流位置**：**`build.yml`** 末尾 job **`go-no-go-hint`**（**`GO/NO-GO hint (informational)`**），**`if: always()`**，**`needs`** 与 **`ci-triage-hint`** 相同的十条 job；步骤 **`GO/NO-GO hint`** 调用脚本。
- **门禁性质**：**非阻断**；不改变 workflow 绿红。
- **Playwright outcome 传递**：**`e2e` job** 在 **`Export Playwright outcome for GO/NO-GO hint`** 中写入 **`e2e-playwright-outcome.txt`** 并 **`upload-artifact`**（**`e2e-playwright-outcome`**，短保留），供 **`e2e` 失败**时仍能读出 outcome（避免仅依赖 **`needs.e2e.outputs`** 的空洞传递）。
- **判定规则（摘要）**：**`e2e_playwright_outcome=failure`** 且 **`diff_conclusion=REGRESSION_VS_BASELINE`** → **`go_no_go_status=NO_GO`**；十条 job 均为 **`success`** → **`GO`**；其余 → **`REVIEW_REQUIRED`**。
- **日志字段（可复制检索）**：`e2e_playwright_outcome`、`diff_conclusion`、`all_required_jobs_success`、`go_no_go_status`（**`GO` \| `NO_GO` \| `REVIEW_REQUIRED`**）。

<a id="ci-hint-chain-usage-rules"></a>

## 使用规则 / 判读说明

### 什么时候看 regression hint

- **位置**：**`e2e` job** 日志里 **`===== BASELINE REGRESSION CHECK`** 一段（步骤 **`Baseline regression hint`**）。
- **何时优先看**：**`e2e` 红**或你怀疑 **Playwright / 前后端联调** 时；需要立刻知道「相对 **stable baseline（24139191178 / 2364f55）** 是否被标成回归」时。
- **看什么**：**`diff_conclusion`**（**`REGRESSION_VS_BASELINE`** / **`NO_REGRESSION_SIGNAL`** / **`UNCLASSIFIED`**）与 **`e2e_step_outcome`**；便于和 baseline 台账对齐口径，**不替代**具体失败用例栈。

### 什么时候看 go_no_go_status

- **位置**：workflow 末尾 job **`go-no-go-hint`** → 步骤 **`GO/NO-GO hint`**，日志 **`===== GO/NO-GO HINT`**。
- **何时看**：**任一条 Build 并行 job 非绿**或要做 **发布/合入前一眼判定** 时；在 **全 workflow 跑完**后读（该 job **`if: always()`**）。
- **与 regression hint 关系**：hint 侧重 **e2e 与 baseline 语义**；**`go_no_go_status`** 汇总 **十条 job + Playwright outcome**，给 **整次 Build** 的 **GO/NO-GO/待人工** 标签。

### GO / NO_GO / REVIEW_REQUIRED 各表示什么

| 值 | 含义（提示层，非替代人工裁决） |
|----|--------------------------------|
| **GO** | 十条并行 job 均为 **success**，且 Playwright 步骤为 **success**：本次 Build 在门禁语义下 **可视为通过**（与 GitHub 绿勾一致时的「可发布参考态」）。 |
| **NO_GO** | Playwright 步骤 **failure** 且推导为 **`REGRESSION_VS_BASELINE`**：**E2E 未过**，**默认按相对 baseline 的回归**做 triage（仍须结合具体断言/日志）。 |
| **REVIEW_REQUIRED** | 其它组合：例如 **非 e2e** job 失败、**e2e** 在 Playwright 前失败（outcome **skipped** / **UNCLASSIFIED**）、artifact 未取到、或 **取消/异常** — **不要**自动等同「baseline 抖动」，需 **人工看首个失败 job**。 |

### 新红链默认如何分流（相对 baseline）

- **固定判读顺序**以 **[新红链首诊流程](#new-red-chain-triage-flow)** 为准（**不要**先点开首个失败 job 再找 hint）。  
- **默认假设**：**stable baseline 已复验（n=3 重跑）**，新红链 **优先**按 **「当前变更 vs baseline」的新问题或回归** 处理；**不**默认回扫整条历史收口链，**除非**工单要求做 **baseline 对比**或 **bisect**。  
- **workflow 整体失败**时还可看 **`ci-triage-hint`**（若有）里的 baseline 指针与 **`scripts/ci-triage.sh`** 模板。

<a id="new-red-chain-triage-flow"></a>

### 新红链首诊流程

<a id="ci-red-chain-single-entry"></a>

**本流程为 Build（`build.yml`）CI 新红链唯一入口（single entry point）**；与协作侧 **`docs/AI协作话术-减负与边界.md` §7.2 / §7.3** 对齐——须先完成下列固定顺序（及可复制块），**再**开任务卡或进入代码级分析。**若未经过本流程直接分析代码，视为违规使用 CI 流程**（与 §7.3「违规示例与提示」一致）。

**固定顺序**（后续遇 **Build / `build.yml` 新红链** 时按此执行）：

1. **Baseline regression hint** — 打开 **`e2e` job** 日志，检索 **`===== BASELINE REGRESSION CHECK`**，记录 **`diff_conclusion`**（及 **`e2e_step_outcome`**）。  
2. **`go_no_go_status`** — 打开末尾 **`go-no-go-hint`** job → **`GO/NO-GO hint`**，检索 **`go_no_go_status=`**（及 **`diff_conclusion`** / **`all_required_jobs_success`**）。  
3. **首个失败 job** — 回到 Actions 总览，打开 **第一个失败的并行 job**，记下 **首个红色 step** 与 **stderr/日志锚点**（与上两步对照：是 **E2E** 还是 **其它门禁**）。  
4. **是否开新卡** — 若需跟踪修复：**单独开 TT/任务卡**（**默认不回扫**本条已收口链）；**仅信息不足**时先补 **复跑/截图** 再开卡，避免空卡。

**可复制（填完再开卡）**：

```
[Build 新红链 · 首诊]
- diff_conclusion（regression hint）：
- go_no_go_status：
- 首个失败 job / step：
- 是否开新卡（标题草稿）：
```

**索引回链**（从总目录进入）：**[evidence/README.md — build-ci-hint-chain-usage](README.md#build-ci-hint-chain-usage)**。

---

## 1. 本轮关键修复点（按链条顺序 · 摘要）

| # | 主题 | 要点 |
|---|------|------|
| 1 | **Gate / CI 脚本可移植性** | 工作流或门禁脚本中 **`rg` → `grep`** 等调整，避免在无 ripgrep 的 runner 上误伤（与 **check-invariants** / gate 步一致）。 |
| 2 | **regional-matrix** | 矩阵门禁与依赖安装/证据目录约定对齐，**Build** 并行 job 侧不再阻断。 |
| 3 | **E2E · API 8080** | Playwright 前 **traveltrust-api** 于 **8080** 启动链路稳定，与 **`PLAYWRIGHT_BASE_URL`** 前端联调一致。 |
| 4 | **Smoke · 主路径可访问** | **`smoke.spec.ts`** 等对 **53 主路径**区块的可见性/路由断言与当前 Next 页面对齐（含后续 **Link vs button** 修正，见下）。 |
| 5 | **Governance params · 标题可见** | 治理参数页 **reconcile** 相关 **heading** 在布局下保持可测可见（与前序 governance 门禁一致，**不回扩** escrow/traveltrust）。 |
| 6 | **TravelTrust · 段导航锚点** | **`TravelTrustSectionNav`** 增补 **`#problem` / `#solution`** 与 i18n，使 smoke 对 **Problem / 痛点** 等链路与落地页 IA 一致。 |
| 7 | **Escrow rate · 单测 locale** | **`page.test.tsx`**：**`beforeEach` 清理 `LOCALE_STORAGE_KEY`**；上传按钮用 **`findByRole`**，消除 Vitest worker 间 **`traveltrust_locale=en`** 污染导致的 **`提交审核`** / **`Submit for review`** 错配。 |
| 8 | **Smoke · 社区私信返回** | 占位 DM 线程：断言 **`getByRole('link')`** 而非 **`button`**（顶栏返回为 **`next/link`**，`aria-label` / 文案仍匹配 **Back / 返回**）。 |
| 9 | **trust-gate · 执行裁决意向** | **`trust-gate-dispute-execute-intent.spec.ts`**：告警断言改为 **`page.getByRole('main').getByRole('alert')`**，避开 **`#__next-route-announcer__`** 与业务 **`role="alert"`** 的 **strict mode** 双匹配（503 / 403 / 429 三用例同型一次修）。 |

---

## 2. 使用约定（给后续任务）

- **本条 Run** **`24139191178`** 视为本轮 **Build 闭环** 的 **可复核指针**（GitHub → Actions → 对应 run）。
- **新需求 / 新回归**：单独开卡；**默认不**再对本表所列路径做「预防性回扫」，除非 **04/07** 或工单明确要求同批。
- **并联索引**：通用 evidence 目录说明仍见 **[evidence/README.md](README.md)**（Build CI 提示链 **如何使用** 见 **[#build-ci-hint-chain-usage](README.md#build-ci-hint-chain-usage)**）；SSOT Guard 总览仍见 **[GO_20260407_SSOT_GUARDS.md](GO_20260407_SSOT_GUARDS.md)**。

---

**登记日**：2026-04-08（与 Run 触发日一致）。
