# TT-DISPLAY-DATA-GOVERNANCE · 展示数据治理

**Version:** 1.0.0 · **生效：** 2026-07-01  
**机读：** [`registry/display-data-governance.v1.yaml`](../../registry/display-data-governance.v1.yaml)  
**Gate：** `bash scripts/gates/check-display-data-governance-ssot.sh`

---

## 0 · 阶段定位（强制）

**展示数据治理不是 Bug 修复，不是 Admin 开发，不是 PI3 / Mainnet。**

```text
TT_DISPLAY_DATA_GOVERNANCE: ENFORCED
TT_DISPLAY_DATA_GOVERNANCE_PHASE: PRE_BUSINESS_UAT
```

```text
Admin Platform Complete
        ↓
Display Data Governance   ← 本 Runbook
        ↓
Business Manual UAT
        ↓
Production Infrastructure（PI3）
        ↓
Production GO
```

**每次上线前必须执行**（Local · Staging · Production 只读抽检）。

| 维度 | 范围 |
|------|------|
| **Canonical Seed** | Trust Gate `f0e0b101-*` · Showcase `000…0311–0314` |
| **Production Data** | 每城仅保留 canonical production；下架重复/脏 production |
| **Test Data Policy** | C3 `guide@test.com` 按规则可见 + `[TEST]`；其它 test/demo 不公开 |
| **Market Display** | `/market?view=guides` · discover · listings |
| **Community Display** | 社区 feed 无 smoke/demo 泄漏 |
| **Official Display** | Campaign / 首页 cold-start 仅 production 轨 |

**Local 与 Staging 不要求 UUID 相同**（不同数据库）；要求 **规则一致、结构一致、canonical 语义一致、测试策略一致**。

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
**C3 探针：** `guide@test.com` / `Test123!` · canonical bio `测试向导账号，用于联调`

---

## 2 · 验收标准（Governance PASS）

| # | 检查项 | 通过条件 |
|---|--------|----------|
| G-01 | Hangzhou 市场 | C3 **可见**；production **1–3** 条且均为 canonical |
| G-02 | 北京 / 上海 / 京都 | 各 **1** 条 canonical production showcase |
| G-03 | 无重复 production | 非 canonical 的 published production 已 unpublish |
| G-04 | Test 策略 | 除 C3（+ 本地 C1 walkthrough 例外）外无 test/demo 公开 |
| G-05 | Admin stats | `filter_enabled: true` · `show_test_data: false` |
| G-06 | `[TEST]` 标签 | C3 卡片带 `[TEST]`（见 [`TT-MARKET-DISPLAY-DATA-MANUAL-UAT.md`](TT-MARKET-DISPLAY-DATA-MANUAL-UAT.md) AC-0.2） |

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
