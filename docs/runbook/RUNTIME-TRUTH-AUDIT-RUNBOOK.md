# TravelTrust · Runtime Truth Audit Runbook

**Status:** **ACTIVE** · **2026-07-04**  
**Machine key:** `TT_RUNTIME_TRUTH_AUDIT: ACTIVE`  
**Gap report:** [RUNTIME-TRUTH-GAP-REPORT.md](RUNTIME-TRUTH-GAP-REPORT.md)  
**Master Matrix:** [TT-PRODUCTION-READINESS-MASTER-MATRIX.md](TT-PRODUCTION-READINESS-MASTER-MATRIX.md)

---

## 0. 三层审计模型（Production GO 前置）

Production GO 须 **三份审计齐备**，且 **不得跳层**：

```text
① Implementation Audit     — 代码 / 迁移 / 视图 / Builder 模块是否存在
        ↓
② Runtime Truth Audit      — 用户路径是否真正运行该实现（Call Graph · 唯一事实来源）
        ↓
③ Production Readiness Audit — G1/G2/G3 Gate · Evidence · Matrix · GO 裁定
```

| 层 | 回答的问题 | 典型方法 | 典型误判 |
|----|-----------|----------|----------|
| **Implementation** | 有没有？ | 仓库树 · migration · governed view · 单元测试 | 「有 Builder 文件」≠「路由在用 Builder」 |
| **Runtime Truth** | 有没有真正跑？ | Frontend → API → Builder/DB Adapter → Governed View → DB Call Graph | `route.rs` 无 `use pcp::builder` ≠ Builder 未使用（可能是 re-export / db adapter） |
| **Production Readiness** | 能否 GO？ | Matrix · Gate validators · committed evidence | G2 **Gate 脚本不存在** ≠ Security **领域未实现** |

**诚实边界：** ① 绿 **≠** ② 全路径统一 **≠** ③ Production GO。

---

## 1. Runtime Truth Audit 范围（六大公开域）

| 域 | 前端入口（代表） | API 前缀 | Builder / Adapter | Governed View / SSOT |
|----|------------------|----------|-------------------|----------------------|
| **Community** | `/community*` · `routesCommunity` | `/api/v1/community/*` | `pcp::feed_builder` → `db::list_feed*` | `governed_community_posts_v1` |
| **Market Discover** | `/market` · `getDiscoverOrders` | `/api/v1/discover/orders` | `chain_off::discover_orders_list_impl` | `governed_discover_orders_v1`（**存在但未用于列表**） |
| **Official Guide** | `/market` guides | `/api/v1/guides` | `chain_off::guides_list_impl` → `db::list_governed_market_guides` | `governed_market_guides_v1` |
| **Campaign / Official** | `coldStartCampaign` client | `/api/v1/official/cold-start/surfaces/:surface` | `db::get_deployed_campaign_for_surface` → `get_governed_campaign_for_surface` | governed campaign catalog |
| **Provider** | `/market/provider*` | `/api/v1/market/provider/listings` | `db::list_market_listings_by_variant` | `governed_market_listings_v1`（production profile 时） |
| **Acquisition** | `/market/acquisition*` | `/api/v1/market/acquisition/listings` | 同上 | 同上 |

---

## 2. Call Graph 方法论（禁止仅用 grep）

### 2.1 正确链路

```text
User
  → Frontend (lib/apiClient · hooks)
  → HTTP route handler (routes/*)
  → Builder 或 DB Adapter (pcp/* 或 db::*)
  → Governed View / 策略过滤 (chain_off::* · SQL view)
  → Database
```

### 2.2 Builder 判定规则

- **`pcp::*_builder.rs` 可以是 thin re-export**（例：`feed_builder` → `db::list_feed`）。
- **结论须来自调用链**，不得来自「handler 是否 `use pcp::feed_builder`」单点 grep。
- **DB Adapter 直连 governed view** 且 handler 调用该 adapter → 视为 **Builder 契约已履行**（模块边界 ≠ 运行时边界）。

### 2.3 绕过类型（登记 Master Matrix）

| 类型 | 含义 |
|------|------|
| **BYPASS_GOV_VIEW** | 公开读路径直查业务表 |
| **BYPASS_BUILDER** | 公开读路径跳过 Builder/Adapter 契约层（若架构要求经 pcp） |
| **BYPASS_FILTER** | Governed View 已用，但缺少与 Feed 同级的 JSON/媒体过滤 |
| **DUAL_PATH** | 生产 profile 与 dev profile 两套读路径并存 |
| **EVIDENCE_UNREPRODUCIBLE** | Registry CLOSED 但 evidence 未入库 |

---

## 3. 执行命令

**静态 Call Graph 审计（仓库内 · ①+② 衔接）：**

```bash
node scripts/dev/audit-runtime-truth-call-graph.cjs
```

**Matrix 对拍（③ 登记后）：**

```bash
node scripts/dev/validate-production-readiness-master-matrix.cjs
```

**Community 运行时抽检（① 本地 · 非 ②③ GO）：**

```bash
bash scripts/dev/run-community-production-ready-runtime-closure.sh
```

---

## 4. 与 G1/G2/G3 的关系

| Gate | 常见误导表述 | 正确表述 |
|------|-------------|----------|
| **G2** | 「G2 没实现」 | **G2 Gate 自动验证脚本尚未实现**（`validate-production-readiness-g2-gate.cjs` 不存在）；Security/Performance **实现**可能在 Rust/API/测试中已存在 |
| **G3** | 「G3 没实现」 | **G3 Gate 自动验证尚未 START**；Deployment/Stripe **runbook** 可能已就绪 |

Runtime Truth Audit **不替代** G1 Browser UAT · **不冒充** ② staging 或 ③ Production GO。

---

## 5. 登记规则

1. 发现绕过 / 双路径 → 登记 `PRM-RT-*`（Runtime Truth）或 `PRM-EVID-*` / `PRM-REG-*`（Implementation Reality）于 [`registry/production-readiness-master-matrix.v1.yaml`](../../registry/production-readiness-master-matrix.v1.yaml)。
2. **P0 运行时缺口** → `classification: BLOCKER` · 更新 domain `blocking_count`。
3. **P1 工程缺口**（CI/Guard/Migration）→ `classification: DEFECT`。
4. **设计性双路径**（例：作者 `me/posts` 读 `community_posts` 含 private）→ `EXPECTED_DIFFERENCE` + `CONFIRM_DESIGN`。

---

**Owner:** Sebastian Ward · **Review ID:** `RT-AUDIT-20260704`
