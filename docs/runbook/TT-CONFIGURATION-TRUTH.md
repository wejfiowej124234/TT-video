# TT-CONFIGURATION-TRUTH · 第六真源

**Machine key：** `TT_CONFIGURATION_TRUTH`  
**SSOT：** [`registry/configuration-truth-ssot.v1.json`](../../registry/configuration-truth-ssot.v1.json)  
**Module：** `scripts/dev/lib/configuration-truth.cjs`

---

## 问题定义 · Configuration Drift

Registry 写的是 `deployment_profile=production`，Fly Secret 也是 `production`，`.env.production` 也是 `production`，但 Runtime `/meta/build` 返回 **`null`**。

这不是 Runtime 故障 alone，也不是 Registry 错误 — 是 **Configuration Drift**（配置注入链断裂）。

---

## 六层 Configuration 对拍

| Layer | 来源 |
|-------|------|
| **registry** | `registry/runtime-identity-ssot.v1.json` |
| **fly_secrets** | Fly secrets list + `printenv` 探针 |
| **fly_config** | `deploy/fly/tt-api-prod/fly.toml` |
| **env_production** | `.env.production.example` · `.env.production.local`（键存在性） |
| **github_actions** | `.github/workflows/*.yml` 声明扫描 |
| **runtime_meta** | `GET /meta/build` · `deployment_profile` |

---

## Release Train 中的位置

**六真源顺序（写死）：**

```text
Evidence → Matrix → Registry → Configuration → Runtime → Call Graph
```

G2/G3 Verification **强制** `TT_CONFIGURATION_TRUTH: PASS`。  
FAIL → REOPEN `PRM-SEC-B002` → 禁止 Formal。

---

## 证据

`configuration-truth.json` — `layers{}` · `drifts[]` · `kind: secret_without_runtime`
