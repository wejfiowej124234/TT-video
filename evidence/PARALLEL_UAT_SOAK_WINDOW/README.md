# Parallel UAT · staging-soak 冻结窗口

**阶段**：**① 本地 / staging-dev** — **非** Fly staging-soak 变更  
**手册**：[180-Parallel-UAT-During-Soak-Sprint.md](../../docs/handbook/engineering/180-Parallel-UAT-During-Soak-Sprint.md)

## 窗口纪律

| 做 | 不做 |
|----|------|
| **运营视角人工 UAT**（十条业务场景） | 新增业务功能 |
| 登记 UI/交互/命名/流程/反馈/认知成本 → `findings.json` | 修 token debt |
| local `:8080` + `:3012` | **tt-api-staging** / **tt-web-staging** 任何变更 |

Soak 持续至 `evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json` → 33/33 GO → Token Debt Sprint → 下一轮测试网。

## 十条场景 SSOT

[operational-uat-scenarios.v1.json](./operational-uat-scenarios.v1.json)

CMS · Official OPS · Growth · Referral · Early Bird · Moderation · Merchant · Guide · Traveler · Admin

## 执行

```bash
# 本地 spine
export DATABASE_URL=postgres://traveltrust:traveltrust@localhost:5432/traveltrust
export SEED_TEST_ACCOUNTS=1
bash scripts/dev/start-api-for-playwright.sh
cd frontend && NEXT_PUBLIC_CATALOG_API_ENABLED=1 npm run dev

# 可选：新开 harness 会话
bash scripts/ops/parallel-uat-during-soak.sh
```

编辑 `run-*/findings.json`：

- `operational_uat.scenario_progress[]` — 场景完成度（`pending` → `reviewed`）
- `items[]` — 每条问题 `status: open`，含 `scenario_id` · `kind` · `cognitive_cost_notes`
- 截图 → `run-*/attachments/`
