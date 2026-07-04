# TT-PRODUCTION-RUNTIME-IDENTITY-GUARD

**Machine key：** `TT_PRODUCTION_RUNTIME_IDENTITY` · Configuration：`TT_CONFIGURATION_TRUTH`  
**SSOT：** [`registry/runtime-identity-ssot.v1.json`](../../registry/runtime-identity-ssot.v1.json)  
**Platform module：** [`TT-RUNTIME-IDENTITY.md`](TT-RUNTIME-IDENTITY.md) · `RuntimeIdentity.current()`

---

## 问题定义

`deployment_profile=null` 意味着系统**无法证明这是 Production**。

Seed 已关但 profile 为空，在企业项目里仍属 **Production Readiness Blocker** — 这不是 Security 问题，是 **Production Runtime Identity** 问题。

---

## Guard 规则（production profile）

| 键 | Fly / meta | 生产期望 |
|----|------------|----------|
| `deployment_profile` | `TRAVELTRUST_DEPLOYMENT_PROFILE` · `GET /meta/build` | `production` |
| `profile` | alias of deployment_profile | `production` |
| `seed` | `SEED_TEST_ACCOUNTS` · `meta.seed_test_accounts.enabled` | `0` / false |
| `community_showcase` | `TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE` | unset 或 `0` |
| `market_showcase` | `TRAVELTRUST_MARKET_PUBLIC_SHOWCASE` | unset 或 `0` |
| `demo` | `DID_RANK_SEED_MARKET_DEMO` | unset 或 `0` |
| `public_content_profile` | derived | `production` |

**交叉校验：**

- Staging `deployment_profile=staging` · 与 prod **可区分**
- `POST /auth/seed-test-accounts` on prod → **403**

---

## 命令

```bash
# 独立 Guard（证据：evidence/GO_production_readiness/production-runtime-identity/<stamp>/）
bash scripts/dev/run-production-runtime-identity-guard.sh

# 裁定
node scripts/dev/validate-production-runtime-identity-guard.cjs \
  --evidence-dir evidence/GO_production_readiness/production-runtime-identity/<stamp> \
  --profile production
```

**写入 Fly（解除 blocker）：**

```bash
bash scripts/dev/phase3-production-fly-deploy-and-sync.sh --secrets-only
```

---

## Release Train 集成

| Gate | Identity 要求 |
|------|---------------|
| G1 | Staging profile = `staging`（informational） |
| G2 | **Production identity PASS 强制** |
| G3 | **Production identity PASS 强制** |

Verification FAIL → 自动 **REOPEN** `PRM-SEC-B002` → `TT_WAVE*_FORMAL_ACCEPTANCE: BLOCKED`

---

## 证据文件

`production-runtime-identity.json` — 含逐项 `checks` · `meta_deployment_profile` · `verdict`
