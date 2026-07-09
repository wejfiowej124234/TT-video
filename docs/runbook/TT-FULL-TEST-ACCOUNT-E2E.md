# Full Test Account E2E · 全账号端到端验证

**生效：** 2026-07-02  
**机读：** [`registry/full-test-account-e2e.v1.yaml`](../../registry/full-test-account-e2e.v1.yaml)  
**性质：** 产品验收封顶验证 — 遵守 `TT_PRODUCT_DEVELOPMENT_FREEZE` · **不是**新的常驻审计维度

## 机读键

```text
TT_FULL_TEST_ACCOUNT_E2E: CLOSED | IN_PROGRESS
```

## 范围

使用 **全部业务测试账号**（`registry/test-accounts-business-immutable.v1.yaml` · staging: C1–C4, E2）在 staging 执行：

| 层 | 验证 |
|----|------|
| UI 操作 | 各角色工作台 / 市场 / 订单 / 治理等页面可访问且主内容可见 |
| API 调用 | 登录、`/me`、角色端点 200 且身份一致 |
| DB 状态 | 经 API 代理核对订单数、挂牌、向导 catalog 等持久化数据 |
| 前端展示 | UI 卡片/列表 id 与 API 返回一致 |
| 业务结果 | 非仅 endpoint 存在 — 数据可对拍 |

## 运行

```bash
bash scripts/dev/run-full-test-account-e2e-validation.sh
```

产物：`evidence/GO_full_test_account_e2e/<UTC>/ftae-ledger.json`

## 问题分类

| 类 | Phase①/② 预期 |
|----|---------------|
| **PRODUCT_DEFECT** | **0** |
| **TEST_AUTOMATION_ISSUE** | **0 open**（修复后重跑 CLOSED） |
| **PRODUCTION_BLOCKER** | PI3 主线排队 |
| **EXPECTED_DIFFERENCE** | 确认设计 |
| **ENHANCEMENT** | Post-GO 延期 |

## 与主线边界

`TT_FULL_TEST_ACCOUNT_E2E: CLOSED` 确认 **全账号业务流真实可用**；`TT_RELEASE_DECISION: NO_GO` 直至 PI3-001～006 闭合。

**Current Mainline：** PI3 → Production GO（不变）
