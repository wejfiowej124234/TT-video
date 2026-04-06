# TravelTrust 前端 Release Readiness 技术说明

**文档性质**：内部评审 / 上线记录用技术摘要  
**范围**：Web 前端（`frontend/`）交互状态、错误与空态展示、一致性收口  
**版本说明**：反映截至「状态机 + UI 一致性 + 静默交互」收尾任务完成后的结论  
**不包含**：后端服务可用性、合约、链上数据真值、基础设施与发布流水线（除非另行引用运维文档）

---

## 0. Formal decision record（正式决议与签收）

以下段落为**可独立摘取**的英文决议与验证说明，供评审签字、发布工单或合规留痕使用。

### Decision Statement

Based on the completed state machine fixes, UI consistency alignment, and elimination of user-misleading behaviors, the frontend system of TravelTrust is considered **Production Ready** from an interaction correctness and user experience perspective.

**Scope of this decision:**

- Applies to frontend behavior only (loading / error / success / empty / feedback)
- Excludes backend availability, on-chain correctness, and infrastructure concerns

**Approval of this document** indicates acceptance of current frontend behavior as suitable for production release, within the scope above.

### Verification Method

The following validation approaches were used:

- **Type safety:** `cd frontend && npx tsc --noEmit`
- **Manual scenario validation:**
  - Error → Success transition (no stale error)
  - Submit → Refresh → UI unlock consistency
  - Loading / Error / Content mutual exclusivity
  - Empty state vs error state differentiation
- **Targeted mock testing:**
  - API failure and recovery
  - Partial data responses (missing fields / invalid shapes)

No automated E2E tests were added in this phase; validation is based on deterministic UI behavior and controlled manual scenarios.

### Frontend Behavior Invariants

The following invariants are enforced in the completed scope:

1. **Request lifecycle isolation** — Each request must clear previous error state before execution.
2. **Mutual exclusivity** — `loading`, `error`, and `content` must not render simultaneously (per page-level branching conventions).
3. **Action completion consistency** — UI must not unlock before dependent data refresh completes (where explicitly fixed, e.g. rating confirm flow).
4. **No silent failures** — User-triggered actions must produce visible feedback (e.g. deep link miss banner, FeeRouter loading placeholder).
5. **Semantic correctness** — Error ≠ Empty; Not loaded ≠ Loaded with zero data.

### Risk Acceptance

The remaining inconsistencies (e.g., toast system fragmentation, partial design system divergence) are acknowledged as **non-blocking** for production release under this decision. These items are classified as post-release improvements and do not affect interaction correctness or user trust within the declared scope.

### Future Standardization Direction

- Unified toast system  
- Design token consolidation  
- Global loading / empty component abstraction  

（中文对照见本文第 5、6 节及第 2 节工程约定。）

---

## 1. 本轮解决的问题分类

### 1.1 状态机（loading / error / success / empty）

| 主题 | 处理方式（摘要） |
|------|------------------|
| **错误跨请求残留** | 在 effect 或刷新入口**发起新请求前**清理 `error`（及必要时的分块 HTTP 错误）；避免「上一轮失败」绑定到「下一轮成功」的展示。 |
| **成功仍显示历史 error** | 成功写入数据的路径**显式** `setError(null)`（典型页：`/governance/params`）。 |
| **提交与数据不同步（partial ready）** | 评分确认等操作在成功后 **await** 订单再拉取，**submitting** 与 `finally` 与数据刷新对齐（典型页：`/escrow/[id]/rate` 的 `confirmRating` → `loadOrder`）。 |
| **三态互斥** | 保持既有条件渲染：`loading` 与全页/全表 `error`、主内容区不叠用；局部列表错误与全局错误按页面约定分支展示。 |

### 1.2 UI（组件与层级）

| 主题 | 处理方式（摘要） |
|------|------------------|
| **页面级 / 列表级 API 错误** | 优先统一为 **`ApiErrorAlert`**（含边框、底色、合规/网络类附加说明），替代裸 `<p class="text-danger">` 或与 reviews 不一致的自定义红块。已落地示例：治理首页、治理参数、admin reviews、admin schema 等。 |
| **整页 / 列表 loading** | 阻塞型首屏与工具列表统一倾向 **`LoadingText`**（`common_loading` + `role="status"`），减少「纯段落灰字」与骨架屏在同一用户路径内混用。已调整示例：治理参数、admin schema 迁移面板、社区发现（作者区 + 瀑布流组件）、订单/争议（原已采用 LoadingText 的保持）。 |
| **工具型 empty** | 列表无数据时统一为 **`text-body` + 低强调色（如 `text-ink-500` / slate 系）**，弱化营销向大卡片与玻璃空态在「工具列表」上的混用。已调整示例：订单列表空态、争议列表空态、发现页作者区与 `CommunityExplorePhotoMasonry` 空态。 |

### 1.3 误导风险（静默与不可区分状态）

| 主题 | 处理方式（摘要） |
|------|------------------|
| **市场深链无效却清 query** | 社区「约向导」深链：**仅匹配到向导时**从 URL 移除参数；未匹配时保留 query 并展示**可关闭的说明条**，避免「点了像没反应」。 |
| **FeeRouter 接线提示在 meta 加载中消失** | `loading && !meta` 时不再 `return null`，改为 **`LoadingText` 占位**，与「无此模块」区分。 |

---

## 2. 已建立的前端行为规范（工程约定）

以下为**当前代码已体现**的约定，供后续迭代与 Code Review 对齐；**非**独立 npm 包或运行时强制框架。

### 2.1 Error（页面级 / 列表级）

- **首选组件**：`frontend/components/ApiErrorAlert.tsx`。  
- **入参**：`message: string | null`；深色壳页面可使用 `tone="dark"`（若该页已采用）。  
- **不做**：表单字段下方校验错误不强制改用 `ApiErrorAlert`（保持行内、近控件）。

### 2.2 Loading（整页 / 面板 / 列表首屏）

- **首选组件**：`frontend/components/LoadingText.tsx`。  
- **语义**：`role="status"`、`aria-live="polite"`、文案走 i18n `common_loading`。  
- **深色背景**：通过 `className` 覆盖字色（如 `text-slate-300`），避免对比度不足。  
- **与骨架**：同一「用户任务路径」内避免骨架与 LoadingText 混用；若保留骨架，应在该路径内统一为一种方案并文档化例外原因。

### 2.3 Empty（工具型列表）

- **结构**：主文案一行 **`text-body` + `text-ink-500`（或社区壳下 slate 等价层级）**；次要说明可用 `text-meta` 或同级低强调色。  
- **CTA**：可保留，但视觉层级从属于主文案，避免空态块与整页营销 hero 同级竞争。

### 2.4 Toast / 固定底栏反馈

- **不强制全站单一 toast 库**；**同一页面**避免多种无关的 timer toast 视觉体系并存。  
- **当前市场页**：底部固定区 success 条（接单成功 / 自定义行程发布）已保持同一套卡片样式；社区深链未命中为 **inline 警告条 + 关闭**，不新增第三套 toast 组件。

### 2.5 占位符（空单元格）

- **用户可见「无值」**：优先 **`t("ui_em_dash")`**，避免硬编码 `"—"` 与 `String(x ?? "—")` 在 admin 等表格中新开分叉（部分 admin 页已示例替换）。

---

## 3. 当前系统已满足的生产标准（前端维度）

在**不讨论后端与链上**的前提下，与 **第 0 节 Decision Statement** 一致：**从交互正确性与用户体验维度，当前前端可认定为 Production Ready**（仅限 loading / error / success / empty / 反馈行为）。

支撑性结论如下：

1. **关键路径状态一致**：新请求清错、成功清错、提交态与刷新完成对齐，避免出现「成功仍报错文」或「按钮已可点但数据未更新」的短窗口误导。  
2. **错误层级可预期**：已收口页面级/列表级错误走 `ApiErrorAlert`，便于合规与「检查后端」类提示统一呈现。  
3. **加载与空态可读**：典型列表与发现页加载/空态不再依赖静默空白或难以区分的骨架混排。  
4. **已知静默路径收敛**：市场深链与 FeeRouter 加载态具备可感知反馈。  
5. **类型与构建**：相关改动经 `npx tsc --noEmit` 校验通过（以仓库当前脚本为准）。  

**签收含义**：产品/工程负责人对第 0 节「Approval of this document」的确认，即表示接受上述范围内前端行为可随版本发布；**不**等同于全栈或链上生产就绪。

---

## 4. 不涉及后端的说明

本文档**不声明**也不验证：

- API 契约完整性、响应时序、幂等与重试策略；  
- 数据库、索引、任务队列、合约部署与链 ID 配置；  
- 鉴权真实性与生产密钥管理；  
- CDN、WAF、速率限制与 DDoS 防护；  
- 性能指标（LCP、TTI）、SEO、国际化翻译覆盖率。

上述项需在**独立的后端 / 运维 / 安全 / 性能**检查清单中结论。

---

## 5. 风险声明与非阻塞事项

以下事项**不阻塞**以「当前前端收口范围」为边界的发布决策，但应在路线图或技术债台账中跟踪：

| 项 | 说明 |
|----|------|
| **全站 toast 统一** | 市场、社区、反馈等仍存在各自 timer / 底栏实现；未抽象为单一组件或库。后续若产品要求全局一致，再立项。 |
| **Design Tokens / 设计系统** | 社区壳（slate/cyan）与产品壳（ink/travel）仍为多套视觉；本轮仅做行为与关键组件对齐，未做设计系统级重构。 |
| **未逐页替换的页面** | `ApiErrorAlert` / `LoadingText` / 工具型 empty 未对 `frontend/app` 全量扫描替换；新页面与旧页可能短期并存差异。 |
| **竞态与严格顺序** | 多请求并发下的严格顺序与取消（Abort）未作为本轮目标；仅消除「明显的用户可见错误残留与误导」。 |
| **无障碍与国际化细测** | 组件已带基础 `role` / `aria-live`；未替代专项 a11y 审计与全量文案走查。 |

---

## 6. 文档维护

- **更新时机**：下一轮大规模前端 UX 收口、或引入统一 toast / 设计系统时，修订第 **0**（决议与不变量）、**2**、**5** 节并与 PR / 发布说明互链。  
- **决议修订**：若 Production Ready 范围或不变量发生变更，须同步更新第 0 节并保留修订日期与审批记录（可在发布工单中引用 commit / tag）。  
- **责任边界**：以前端负责人维护；与 `docs/spec` 中产品规格互补，不替代 SSOT 中的业务与接口定义。
