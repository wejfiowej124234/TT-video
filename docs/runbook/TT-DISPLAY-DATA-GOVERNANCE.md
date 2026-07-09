# TT-DISPLAY-DATA-GOVERNANCE · 展示数据治理

**Version:** 1.0.0 · **生效：** 2026-07-01  
**机读：** [`registry/display-data-governance.v1.yaml`](../../registry/display-data-governance.v1.yaml)  
**Gate：** `bash scripts/gates/check-display-data-governance-ssot.sh`

**互指：** [`TT-RELEASE-PIPELINE.md`](TT-RELEASE-PIPELINE.md) · **每次 Production 发布必跑**

---

## 0 · 阶段定位（强制）

**展示数据治理不是 Bug 修复，不是 Admin 开发，不是 PI3 / Mainnet。**

```text
TT_DISPLAY_DATA_GOVERNANCE: ENFORCED
TT_DISPLAY_DATA_GOVERNANCE_EVERY_RELEASE: true
```

```text
Product Capability Complete
        ↓
Display Data Governance   ← 本 Runbook（每次发布必跑）
        ↓
Business Manual UAT
        ↓
Production Infrastructure（PI3）
        ↓
Production GO
```

**每次上线前必须执行**（Local · Staging · Production 只读抽检）。

---

## 0.1 · 运营展示 vs 业务测试账号（绑定原则）

> **测试账号负责验证业务能力；官方运营账号负责承载用户可见内容；任何测试账号不得作为 Public Catalog 官方运营数据的一部分。**

两套**角色**，一套**公众展示数据**：

```text
【给用户看 · Public Catalog】
Official Accounts (@ocs.traveltrust.app)
  → Official Catalog → Public Catalog
  → Guide · Provider · Acquisition · Official Guide · Campaign
  → OCS · SOPCP · DDG 审计

【给开发/测试用 · 永不进 Public Catalog】
C1–C4: tourist@test · guide@test · merchant@test · multi-demo@test
  → 登录 · 下单 · 支付 · 工作台 · FTAE · E2E
  → 若出现在 Guide/Provider/Acquisition/Official Guide/Campaign 公众面
     = TEST_DATA_LEAKAGE → DDG FAIL（不是 Expected Difference）
```

| 你想… | 做法 |
|--------|------|
| 看展示效果 | **不用登录** · 打开 Guide/Provider/Acquisition → 全是 **OCS** |
| 测订单链 | 登录 `tourist@test` + `guide@test` |
| 测向导工作台 | 登录 `guide@test` |
| 测运营发布 | Admin → **Official Accounts** / Public Operations |

机读：`registry/display-data-governance.v1.yaml` → `public_catalog_boundary`

---

## 1 · 执行脚本

```bash
# ① Local
bash scripts/dev/run-display-data-governance.sh

# ② Staging
API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash scripts/dev/run-display-data-governance.sh

# 干跑（只列将要下架的项）
DRY_RUN=1 API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash scripts/dev/run-display-data-governance.sh
```

**Admin：** `tourist@test.com` / `Test123!`（seed promote_admin）  
**C3 探针：** `guide@test.com` / `Test123!` — 仅验证账号可登录；**不得**出现在 Public Catalog（出现即 FAIL）

默认 `POST_OCS_BASELINE=1`（OCS 已 CLOSED）：不发布 C3 到公众 catalog，不跑 legacy 杭州 canonical 矩阵。

---

## 2 · 验收标准（Governance PASS）

| # | 检查项 | 通过条件 |
|---|--------|----------|
| G-01 | Public Catalog 来源 | Guide/Provider/Acquisition/Campaign **仅 OCS**（SOPCP） |
| G-02 | 测试账号隔离 | C1–C4（含 `guide@test.com`）**不在**任何 Public Catalog 公众面 |
| G-03 | 测试账号泄漏 | 出现 → **TEST_DATA_LEAKAGE** · DDG **FAIL**（非 Expected Difference） |
| G-04 | Smoke/Demo | 无 smoke/demo/probe 公开泄漏 |
| G-05 | Admin stats | `filter_enabled: true` · `show_test_data: false` |
| G-06 | Legacy 模式 | 仅 `POST_OCS_BASELINE=0` 时启用 pre-OCS canonical 矩阵（不推荐） |

---

## 3 · 证据

```bash
UTC=$(date -u +%Y%m%dT%H%M%SZ)
EVID="evidence/GO_display_data_governance/${UTC}"
mkdir -p "$EVID"
EVIDENCE_JSON="$EVID/governance-report.json" \
  API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash scripts/dev/run-display-data-governance.sh
```

---

## 4 · 与 Business Manual UAT 的衔接

Governance **PASS** 后进入 [`TT-BUSINESS-MANUAL-UAT.md`](TT-BUSINESS-MANUAL-UAT.md) — 以真实角色验证 **用户看到的数据** 是否符合产品设计。

---

## 5 · 非目标

- 不修改 `market_public_surface.rs` 过滤逻辑（除非成为 Production 阻断）
- 不新增 Admin 功能
- 不强制 Local/Staging UUID 对齐

**TT_DISPLAY_DATA_GOVERNANCE: ENFORCED**
