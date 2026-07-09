# TT-BUSINESS-MANUAL-UAT · 业务人工验收

**Version:** 1.0.0 · **生效：** 2026-07-01  
**前置：** [`TT-DISPLAY-DATA-GOVERNANCE.md`](TT-DISPLAY-DATA-GOVERNANCE.md) **PASS**  
**互指：** [`TT-RELEASE-PIPELINE.md`](TT-RELEASE-PIPELINE.md) · **每次 Production 发布必跑**  
**机读：** `TT_BUSINESS_MANUAL_UAT: PENDING | PASS | FAIL`

---

## 0 · 阶段定位

```text
Product Capability Complete
        ↓
Display Data Governance (PASS)
        ↓
Business Manual UAT   ← 本 Runbook（每次发布必跑）
        ↓
PI3 → Production GO
```

**目标：** 测试人员以 **真实角色** 走完核心业务流程，确认 **公众可见数据** 符合产品设计。

| 环境 | Web | API |
|------|-----|-----|
| Local | http://localhost:3012 | http://127.0.0.1:8080 |
| Staging | https://tt-web-staging.fly.dev | https://tt-api-staging.fly.dev |

**账号：** [`registry/test-accounts-business-immutable.v1.yaml`](../../registry/test-accounts-business-immutable.v1.yaml)

---

## 1 · 场景清单

| ID | 角色 | 流程 | 通过标准 |
|----|------|------|----------|
| UAT-01 | 游客 C2 | 自由市场找向导 · 杭州 | 列表无重复脏 production；C3 带 `[TEST]`；可选 canonical production 向导 |
| UAT-02 | 游客 C2 | 市场搜索 / 筛选 | 城市、语言、服务类型筛选结果与 API 一致 |
| UAT-03 | 向导 C3 | 工作台 · 档案 | bio 仍为 canonical；不污染 smoke 文案 |
| UAT-04 | 商家 C4 | 商家发布 / provider 面 | 无 test 数据泄漏到公众 provider 列表 |
| UAT-05 | Admin | Official Ops · 公众运营 | stats 五轨分桶正确；publish/unpublish 与治理后一致 |
| UAT-06 | Admin | Campaign 六类 | Homepage / Market / Community / Festival / Holiday / Regional 可预览且无 demo 泄漏 |
| UAT-07 | 公众 | 首页 cold-start | Campaign 展示与 Admin 配置一致 |
| UAT-08 | 游客 C2 | Discover 订单墙 | 无 smoke/demo 订单；production 订单可读 |

---

## 2 · 快速探针（可脚本化）

```bash
# Governance 已 PASS 的前提下
bash scripts/dev/run-business-manual-uat-probes.sh
```

---

## 3 · Sign-off

手验完成后写入：

`evidence/manual-uat/signoff/BUSINESS-MANUAL-UAT-SIGNOFF-<UTC>.md`

```text
TT_BUSINESS_MANUAL_UAT: PASS
TT_BUSINESS_MANUAL_UAT_SIGNOFF_UTC: <ISO8601>
```

**TT_BUSINESS_MANUAL_UAT: PENDING** 直至 sign-off 落盘。
