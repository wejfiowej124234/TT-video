# Phase ② · G-1 环境隔离决策书（模板）

**Status:** **Solo Owner 已确认（2026-05-31）** — **staging 专用库** `traveltrust_staging` 与 ① `traveltrust` **库名隔离**；**Stripe `sk_test`/`whsec`** 须写入 `scripts/dev/.env.staging-secrets.local`（**勿提交**）后 **`check-phase2-onboarding-staging-ready.sh` exit 0** 方算 **G-1 机读绿**  
**阶段：** **② 测试网** — **非** ③ Production GO  
**互指：** [PHASE2-START-CHECKLIST · G-1](./PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前) · [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) · [96-03 §轮换](../spec/96-03-安全密钥与供应链.md)

---

## 1 · 决策摘要（签字栏）

| 项 | 决策（勾选） | Owner | 日期 |
|----|--------------|-------|------|
| **Stripe 账户** | ☑ 专用 **test mode** 账户（与 **live** 物理隔离） | Sebastian Ward（塞巴斯蒂安·沃德） | 2026-06-03 |
| **`sk_test` / `pk_test`** | ☑ 仅注入 **staging** `.env.staging-secrets.local`（**不**进 git） | Sebastian Ward（塞巴斯蒂安·沃德） | 2026-06-03 |
| **`whsec_*`** | ☑ **每环境独立** Dashboard 端点或 `stripe listen`（**禁止** 与 ① 本地 IT 共用） | Sebastian Ward（塞巴斯蒂安·沃德） | 2026-06-03 |
| **`DATABASE_URL`** | ☑ **staging 专用 PG** `traveltrust_staging`（与 ① `traveltrust` / prod **零共享**） | Sebastian Ward（塞巴斯蒂安·沃德） | 2026-06-03 |
| **`TRAVELTRUST_ONBOARDING_LOCAL_DEV`** | ☑ staging **= 0 / 未设置**（**禁止** 零金额覆盖） | Sebastian Ward（塞巴斯蒂安·沃德） | 2026-06-03 |
| **`SEED_TEST_ACCOUNTS`** | ☑ staging **仅** 允许；prod **禁止** | Sebastian Ward（塞巴斯蒂安·沃德） | 2026-06-03 |
| **密钥轮换** | ☑ 已登记轮换窗口（见 §3） | Sebastian Ward（塞巴斯蒂安·沃德） | 2026-06-03 |

**签字：** **Sebastian Ward（塞巴斯蒂安·沃德）**  **角色：** Owner / 安全负责人（单人维护者自检）  **日期：** 2026-06-03

---

## 2 · 环境矩阵（须填满）

| 密钥 / 配置 | ① 本地 dev | ② staging | ③ prod |
|-------------|------------|-----------|--------|
| `DATABASE_URL` | 本地 Docker PG · DB `traveltrust` | `traveltrust_staging` @ `127.0.0.1:5432`（或远端 staging host） | *禁止与 staging 混用* |
| `TRAVELTRUST_STRIPE_SECRET_KEY` | 空或 stub | `sk_test_…` | `sk_live_…`（③ 另闸） |
| `TRAVELTRUST_STRIPE_WEBHOOK_SECRET` | IT 合成 `whsec` | Dashboard / listen 真 `whsec` | ③ 另闸 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 空 | `pk_test_…` | ③ |
| `INTERNAL_API_SECRET` | 本地 | staging 独立值 | prod 独立值 |
| `CHAIN_RPC_URL` | Anvil / 空 | Sepolia RPC | 主网（③） |
| `REGION_STEWARD_STAKE_POOL_ADDRESS` | Anvil smoke | Sepolia 部署后 | ③ |

**模板文件：** [`scripts/dev/staging-onboarding.env.example`](../../scripts/dev/staging-onboarding.env.example)（复制为 `scripts/dev/.env.staging-onboarding.local`，**gitignore**）

---

## 3 · 轮换与泄露响应（摘要）

| 事件 | 动作 | 时限 |
|------|------|------|
| `sk_test` 疑似泄露 | 轮换 Stripe test key + 更新 staging `.env` + 重启 API | 24h |
| `whsec` 轮换 | Dashboard 新端点 → 更新 `TRAVELTRUST_STRIPE_WEBHOOK_SECRET` → 重放测试 | 同上 |
| staging PG 误连 prod | **立即** 停 API · 审计写入 · 恢复备份策略按 96-03 | 立即 |

---

## 4 · G-1 机读预检（签字后）

```bash
cp scripts/dev/staging-onboarding.env.example scripts/dev/.env.staging-onboarding.local
cp scripts/dev/staging-secrets.env.example scripts/dev/.env.staging-secrets.local
# 编辑两文件 + 可选 STAGING_API_BASE 或 STAGING_USE_LOCAL_TUNNEL=1
bash scripts/dev/record-phase2-g2-staging-sqlx-migrate-evidence.sh
bash scripts/dev/bootstrap-phase2-g1-g2.sh
# exit 0 → G-1/G-2 机读绿 + transition READY_FOR_C1_C12（仍 ≠ C1～C12 GO）
```

---

## 5 · 变更记录

| Date | Note |
|------|------|
| 2026-05-28 | 初版：G-1 决策书模板（Phase ① Freeze · 证据补充） |
| 2026-05-31 | Solo Owner 签字 · `traveltrust_staging` 隔离 · bootstrap / migrate 证据脚本 |

---

**End of PHASE2-G1-ENV-ISOLATION-DECISION · 已签字 · Sebastian Ward（塞巴斯蒂安·沃德）2026-06-03（Stripe 密钥仍仅本地文件）**
