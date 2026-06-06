# Protocol Convergence · Steward 全链 · ① 本地验收

**阶段：** **① 本地** — **非** ② 测试网链上 stake · **非** ③ 生产 GO

**SSOT：** [protocol-convergence-P1-memo.md](../../../docs/spec/governance-token/protocol-convergence-P1-memo.md) · [app/steward/register/README.md](../../app/steward/register/README.md)

---

## 推送前命令（须自留 exit 0）

```bash
# ② 本地治理币 + Anvil stake pool（一键 · 写入 .env 并 smoke）
bash scripts/dev/start-ttg-anvil-local.sh

# 仓库根 · API 已起（SEED_TEST_ACCOUNTS=1 · PORT=8080）
bash scripts/dev/smoke-steward-onboarding-local.sh

# ② Anvil 链上 stake（非 ① chain_off）
ANVIL_ALREADY_RUNNING=1 bash scripts/dev/smoke-steward-stake-anvil.sh

bash scripts/gates/check-protocol-convergence-pregate.sh
bash scripts/gates/check-governance-doc-linkage.sh

cargo test -p traveltrust-api steward
cd contracts && forge test --match-contract "RegionSteward|CountryPoolRedemption"

cd frontend && npm run test -- protocolSsot.v1 stewardRegisterL5 adminSteward adminStewardApplicationReviewCard adminUserDetailPage --run
```

**烟测成功末行：** `TT_SMOKE_STEWARD_ONBOARDING: OK full local chain (① only)`

---

## 覆盖范围

| 域 | 路径 / 命令 |
|----|-------------|
| SSOT 收敛闸 | `check-protocol-ssot-convergence.sh` |
| API 只读 | `GET /governance/state-machines` · `/steward/stake-quote` · `/redemption/quote` |
| 申请链 | `POST /steward/applications` · `GET /me/steward-application` |
| Admin | `GET /admin/steward-applications` · `PATCH …/steward-application-review` |
| 角色 | approve 后 `GET /me` → `region_steward` |
| 96-18 | `GET /onboarding/quote?role=region_steward` |
| 合约 | `RegionStewardStakePool` · `CountryPoolRedemptionEpochV0` forge |
| 前端 | `/steward/register` · `/admin/steward-applications` · `AdminStewardApplicationReviewCard` |

---

## 诚实边界（勿跳阶）

| 项 | 阶段 |
|----|------|
| LEGAL-SIGNOFF R4/R5 | 法务签字 |
| 84 §四 募资列定稿 | [84-valuation-anchor-P1-memo](../../../docs/spec/governance-token/84-valuation-anchor-P1-memo.md) Option C 工程默认 · 法务待确认 |
| 链上 stake 真值 | **② Anvil**（[`TTG-ANVIL-LOCAL-README`](../../../scripts/dev/TTG-ANVIL-LOCAL-README.md)）· **② 测试网** |
| Production GO | **③** |
