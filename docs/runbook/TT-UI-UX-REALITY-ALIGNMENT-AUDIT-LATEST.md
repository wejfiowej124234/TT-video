# TT · UI/UX Reality Alignment Audit（用户真实路径一致性扫描）

**Machine key:** `TT_UI_UX_REALITY_ALIGNMENT_AUDIT`  
**Status:** `P0_CLOSED_P1_05_06_07_PENDING_WEB_BAKE` · **≠** GO · **≠** Inventory/Reality 恢复  
**Recorded UTC:** `2026-07-22T07:28:47Z` · **Remediation UTC:** `2026-07-22T07:45:00Z`  
**JSON:** [`TT-UI-UX-REALITY-ALIGNMENT-AUDIT-LATEST.json`](./TT-UI-UX-REALITY-ALIGNMENT-AUDIT-LATEST.json)  
**Policy:** [`TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY`](./TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md)

---

## 0 · 治理锚（唯一基准）

| 锚 | 值 |
|----|-----|
| PSG Pin | `PSG-REL-20260720-WEB3-CAND-V2` |
| Engineering / product tip | `6b85bde9773788638c4d8cf031dfe48ef56d1706` |
| Contract profile | `v311_fund_safety_candidate_v2` |
| FINAL RELEASE | `FROZEN` · PCR `PCR-20260722-UI-DELTA-MARKET-ESCROW-ACL-GATE-FREEZE` |
| Staging Web | **待烤** `6b85bde9`（此前探针 `1b622923`） |
| Staging API | Expected Difference · FE-only |

**本轮禁止：** 放宽后端 participant ACL · 自动开 Inventory/Reality/GO · 污染 FG-15-A / PSG GO Archive。

**本轮已做：** P0-01/02/03 产品 tip 入库 + Delta Freeze；下一步 Owner 烤 Staging Web 后再做八轴 dry-run。

---

## 0.1 · P0 修复状态（① 产品 tip）

| ID | 状态 | tip |
|----|------|-----|
| P0-01 Market Drawer escrow/pay | ✅ 产品 tip 已门禁 | `6b85bde9` |
| P0-02 OrderCard fallback `/escrow` | ✅ 已移除；Pay 仅 own-binding | `6b85bde9` |
| P0-03 Escrow 401/403 引导 | ✅ 401→login · 403→清 prefetch + 下一步 | `6b85bde9` |

**诚实：** tip 入库 ≠ Staging Web 已烤 ≠ ② GO。

---

## 1 · 扫描廊道（固定）

```text
首页 / 定制旅行
  → Market / Acquisition
  → Guide
  → Provider
  → Orders
  → Escrow
  → Payment
  → Community
  → Governance
  → Admin
```

每页八层：UI · UX · API · Auth/RBAC · DB · State Machine · SSOT · Evidence。

**Staging 探针（无登录写操作）：**

| 探针 | 结果 |
|------|------|
| Web release-identity | `1b622923` ok |
| API `/meta` | `f9c227de` ok |
| `GET /api/v1/discover/orders` | 200 |
| `GET /api/v1/orders/:id`（无 Bearer） | 401 STRICT_SESSION_GATE |
| `/` `/market` `/community` `/governance/proposals` | 200 |
| `/admin`（无 cookie） | 307 → `/auth/login?returnUrl=/admin` |
| `/discover` `/market/travel` | 307 → `/market`（legacy redirect OK） |

---

## 2 · 汇总

| 优先级 | 数量 | 含义 |
|--------|------|------|
| **P0 用户阻断** | **3** | 点击后 403/死路，或公开入口误导至无权资源 |
| **P1 功能错误** | **7** | 权限/状态/文案与真实 API 不一致 |
| **P2 体验问题** | **12** | 空态、占位、预检不足、路径别名 |
| **Legacy** | **4** | 旧路径已重定向或未挂导航（保留清理清单） |

**诚实边界：** ① 代码+Staging 探针 ≠ ② 全角色人工 UAT ≠ ③ Production GO。本审计 **不** 替代 Inventory / Reality Closure。

---

## 3 · P0 用户阻断（须人工确认后再修）

### P0-01 · Market 公开发现单 → 托管/支付入口 → GET `/orders/:id` 403

| 层 | 结论 |
|----|------|
| **UI** | `OrderDetailDrawer` 页脚 **始终** 链到 `/escrow/:id`；符合条件时还有 `/pay?orderId=`（`OrderDetailDrawer.tsx` ~833–846） |
| **UX** | 任意用户可在 `/market` 打开**他人**公开草稿 → 点「托管详情」→ Escrow 报 `escrow_403_message` |
| **API** | `GET /api/v1/orders/:id` → `order_get_impl`：**登录 + participant**；非参与方 **403 `forbidden`**（`crates/api/src/chain_off/orders.rs`） |
| **Auth** | Discover 列表 **公开**；订单详情 **私有** — UI 未按 ownership 隐藏 CTA |
| **DB** | 订单存在；拒绝原因为权限而非缺失 |
| **State** | 发现浏览 ≠ 可进入托管读写 |
| **SSOT** | 与参与方闸一致；**与 UI 暴露不一致** |
| **Evidence** | 代码路径 + Staging：无 Bearer 401；登录非参与方预期 403 |

**建议修复方向（确认后再做）：** Drawer/Card 仅在 `getOrder` 成功或 `is_participant`/`is_owner` 时展示 escrow/pay；否则「接单/抢单」或「登录后查看我的订单」。

---

### P0-02 · `OrderCard` 无 `onViewDetail` 时直链 `/escrow/:id`

| 层 | 结论 |
|----|------|
| **UI** | `OrderCard.tsx` fallback 直接 `href=/escrow/...` |
| **UX** | 次级代码路径跳过抽屉 enrichment，直接死路 |
| **API/Auth** | 同 P0-01 |

**建议：** 删除/禁用 fallback 直链；统一经 ownership 门闸。

---

### P0-03 · 跨账号 / 会话切换后首页「查看订单详情」仍可指向无权单

| 层 | 结论 |
|----|------|
| **UI** | 解锁成功后展示 `landing_view_order_detail` → `/escrow/:id` |
| **UX** | 同会话同账号：应 200；**换账号**或 **localStorage 预取壳** 后二次 GET 可 403 |
| **API** | 同 participant 闸 |
| **State** | `aiGenerateCommitted` 已收紧磨砂态；**已解锁卡**仍可能跨会话残留感知 |
| **SSOT** | Home AI 闸（`1b622923`）已改善未生成即露入口；**不**覆盖跨账号 |

**建议：** Escrow 加载 403 时清 stale prefetch；可选：链接前再验 `getOrder`；401 对齐 `/pay` 做 login redirect。

---

## 4 · P1 功能错误

| ID | 廊道 | 问题 | UI→API→SSOT 差异 |
|----|------|------|------------------|
| P1-01 | Home | Unlock 诚实徽章 + 非支付文案 | ✅ tip（待下一轮 Web bake） |
| P1-02 | Escrow | 401→login | ✅ 已随 P0 tip `6b85bde9` |
| P1-03 | Market→Pay | 非参与方 Pay CTA | ✅ 已随 P0 tip `6b85bde9` |
| P1-04 | Governance | 链下投票闸 `can_cast_vote` | ✅ tip（待下一轮 Web bake） |
| P1-05 | Admin | UI RBAC advisory：按钮可见 → 写操作 API 403 | 设计已知 · 仍是用户阻断感 |
| P1-06 | Community | Dev showcase 空库注入「真」社交图；写失败 | ① 诚实风险 |
| P1-07 | Acquisition/Provider | Bond/Studio/Publish 可先点后 API 失败，预检不全 | 状态机后置 |

---

## 5 · P2 体验问题（摘录）

| ID | 廊道 | 问题 |
|----|------|------|
| P2-01 | Guides | `GET /guides` 公开，列表页对 `login_required` 仍可能 redirect 分支 |
| P2-02 | Guides | Stake CTA 无登录预闸 |
| P2-03 | Provider | 非商家进 `/provider` 锁态缺「去入驻」CTA（steward 有 apply） |
| P2-04 | Provider | Register ↔ onboarding 跳转（文档已记） |
| P2-05 | Community | `/community/feed` 逻辑引用但无 `page.tsx` → 直链 404 |
| P2-06 | Community | Explore static fallback / feedback localStorage merge |
| P2-07 | Governance | Hub pool/rewards `placeholder` 已标 · 仍易误解为链上实数 |
| P2-08 | Governance | 创建提案 CTA 公开，门槛在钱包侧 |
| P2-09 | Admin | SSR 403 → `/market?admin_access=denied` 着陆突兀 |
| P2-10 | Admin | Console role 70 vs `users.role=admin` 顶栏入口不一致 |
| P2-11 | Home/Pay/Escrow | phase1-mock / mock-pay 诚实属性多在 DOM，少在可见文案 |
| P2-12 | Escrow | 草稿状态机长链（选导→接单→双边→锁计划→付）缺进度导航时易「卡住感」 |

---

## 6 · Legacy / 旧入口清理

| ID | 项 | 状态 | 处置建议 |
|----|-----|------|----------|
| L-01 | `/discover` → `/market` | middleware 307 | 保留；文档注明 |
| L-02 | `/market/travel` → `/market` | middleware 307 | 保留；文档注明 |
| L-03 | `archive/ui-v1` | **未**挂 live nav | 禁止回流；无需本轮删树 |
| L-04 | `/orders/new` vs 首页 `POST /itineraries` | 双创建路径 | 预期差异或统一文案（非 P0） |

---

## 7 · 廊道矩阵（一页一句话）

| 廊道 | 有无收口风险 | 最严重项 | 未完成应在哪阶 |
|------|--------------|----------|----------------|
| 首页定制旅行 | 磨砂闸已钉 tip；跨账号仍险 | P0-03 / P1-01 | ① 修后烤 Staging |
| Market | **公开→托管死路** | P0-01 / P0-02 | ① |
| Acquisition | 预检不足 | P1-07 | ① |
| Guide | 登录预闸弱 | P2-01/02 | ① |
| Provider | 锁态缺 CTA | P2-03 | ① |
| Orders | 本人列表相对安全 | — | — |
| Escrow | 403/401 UX | P0 / P1-02 | ① |
| Payment | forbidden 有面板 | P1-03 | ① |
| Community | feed 404 / showcase | P2-05 / P1-06 | ① |
| Governance | 链下投票 RBAC | P1-04 | ① / ② 链上 |
| Admin | advisory RBAC | P1-05 | ① |

---

## 8 · UI→API→DB→SSOT 差异清单（机读摘要）

见同目录 JSON · `findings[]`。

**核心冲突模式（写死）：**

```text
公开列表 / 预览卡 / Drawer
    ↓ 展示「托管详情 / 支付 / 查看订单」
私有 GET /orders/:id（participant）
    ↓
403 forbidden  →  用户以为功能坏了
```

修法原则：**先藏入口或改成合法下一动作，再谈补 API** — 禁止「点了 403 再临时开权限」制造新漂移。

---

## 9 · Owner 确认清单（修复前）

请勾选后再开修复 Delta（每次一主题 · tip 入库 · Delta Recertify · Runtime 对齐）：

- [ ] **同意 P0-01/02**：Market Drawer/Card 对非参与方隐藏 escrow/pay（或改为「接单/登录」）
- [ ] **同意 P0-03**：Escrow 401→login；403→清 prefetch + 明确下一步
- [ ] **P1 排序**：建议 Home Unlock 文案 → Escrow 401 → Governance 投票闸 → Admin 写按钮预禁用
- [ ] **明确不做**：本轮不修 Inventory/Reality/Hard Gate；不部署污染 API tip（除非同批 FE+API）
- [ ] **验收账号**：按 `registry/test-accounts-business-immutable.v1.yaml` 用 **C1/C2** 复现 P0（禁止混验 E1 on Staging）

---

## 10 · 下一步（确认后）

```text
Owner Confirm P0 set
  → feature branch from tip 1b622923（或当前 product tip）
  → 最小 diff 修入口闸（禁止顺手扩 scope）
  → vitest/contracts 绿
  → commit → PCR Delta → Engineering tip 对齐
  → Staging Web bake @ tip → Delta dry-run P0=0
  → 人工用 C1/C2 复验廊道
```

**禁止：** 脏 worktree 烤包 · 未入库临时代码 · 旧路径重新挂导航 · 用文档-only 宣称已修。
