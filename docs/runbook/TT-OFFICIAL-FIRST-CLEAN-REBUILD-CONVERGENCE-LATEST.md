# Official-First · Clean Rebuild Convergence（PRODUCT 平面）

**TRACK:** `OFFICIAL_FIRST_CLEAN_REBUILD_CONVERGENCE`  
**STATUS:** `ACTIVE`  
**Supersedes:** Local/Staging **考古修复** / overlay 逐项对齐  
**Gate:** `PRODUCT_AND_DOCUMENTATION_PARITY` = **FAIL** · **PASS NOT_ISSUED**  
**`TT_PRODUCTION_GO`:** NO_GO  

**Living SSOT (PRODUCT):** Official Production **OPS-2026.08.20-v9** · `git_sha=3e356617…`  
**Web3 (isolated):** Candidate `b19b85810…` · V9 Design Freeze · **≠** 官网旧 Web3 文案  

Machine: [`OFFICIAL_FIRST_CLEAN_REBUILD_STATUS.json`](../../evidence/GO_official_product_reality_capture/OFFICIAL_FIRST_CLEAN_REBUILD_STATUS.json)  
Registry: [`official-first-clean-rebuild-convergence.v1.yaml`](../../registry/official-first-clean-rebuild-convergence.v1.yaml)

---

## 原则（写死）

| # | 规则 |
|---|------|
| 1 | **Official Production = PRODUCT 活面唯一 SSOT** — Local/Staging 不是母版，不得继续考古修漂移 |
| 2 | **只读 Capture + 冻结** Official 真相 → **收回 Git**（可重复构建结构）— **禁止改 Production** |
| 3 | **彻底清理并从零重建** Local 与 Staging — 清除旧 overlay、runtime drift、fallback、历史缓存、旧产品引用 |
| 4 | **禁止复制** Production 用户/订单/钱包/私有业务数据 — 仅 **sanitized / seed** |
| 5 | **验证链：** `Official PRODUCT = Git = Local = Staging`（fresh rebuild 可重复）→ 四零闸 → 才 `PRODUCT_AND_DOCUMENTATION_PARITY_PASS` |
| 6 | **WEB3 平面隔离** — 不得用官网旧 Web3 覆盖 Candidate；Mainnet V9 真部署验证后再反向更新 Official Web3 |
| 7 | **Parity PASS 前禁止** CMS/UI/UX/功能优化 · POST_PARITY_FIX_QUEUE · Exact-Match/Mainnet/`TT_PRODUCTION_GO` |

---

## Phase A — Official Capture & Freeze（只读 · 已完成部分）

| Surface | Status | Artifact |
|---------|--------|----------|
| 代码/镜像身份 | **FROZEN** | Living Pin · `release-identity.json` · 1to1/plane-map PASS |
| DB schema + migration bookkeeping | **CAPTURED** | `OFFICIAL_PROD_SCHEMA_CAPTURE_LATEST.json` |
| Git migrations ↔ Prod `_sqlx` | **MATCH_1TO1** | `PROD_GIT_MIGRATION_VERIFY_LATEST.json` (157/157) |
| API / Auth / Admin (unauth depth) | **CAPTURED** | `RUNTIME_API_DEPTH_20260822.json` · `RUNTIME_AUTH_ADMIN_I18N_IDENTITY_20260822.json` |
| CMS/OCS/Assets inventory | **CAPTURED** | `RUNTIME_CMS_ASSETS_INVENTORY_20260822.json` |
| Config / Feature flags 结构 | **CAPTURED** | `RUNTIME_ENV_FLAGS_PARITY_20260822.json` |
| 非 Web3 文档真相 | **PARTIAL** | DOC_RETAG · Whitepaper align note · ED closures |
| **Official 母版冻结包** | **ISSUED** | `OFFICIAL_PRODUCT_MOTHERBOARD_FREEZE_LATEST.json` |

**禁止：** ACCEPT_ED 代替 Reality · Production DDL/DML/migration/repair

---

## Phase B — Git 收回 Official 可重复结构（进行中）

| Item | Status |
|------|--------|
| `crates/api/migrations` (157) | **RESTORED** from `tt-api-prod` container (16 files: 3 missing + 13 checksum resync) |
| Official pin `3e356617…` product tree | **BASELINE** — Release WT / branch tip alignment |
| View expansion archaeology | **STOPPED** — 不再逐项修 Local 旧库；改由 **clean rebuild** 从 Official 母版复现 |
| CMS catalog / seed manifests | **PENDING** — 从 Capture 导出结构，非 Production 业务行 |

---

## Phase C — Local Clean Rebuild（DESTRUCTIVE · Local only）

**入口：** `TRAVELTRUST_OFFICIAL_FIRST_LOCAL_CLEAN_REBUILD_OK=1`

```bash
bash scripts/dev/official-first-clean-rebuild-local.sh
```

| Step | Action |
|------|--------|
| C1 | 销毁 Local Docker PG volume · 清除 `.env.local` 旧产品 overlay / fallback 键 |
| C2 | `docker compose up -d postgres` · `sqlx migrate run`（Git 157 · Official 收回字节） |
| C3 | 注入 **sanitized seed**（test accounts registry · 无 Production PII/订单/钱包） |
| C4 | Schema-only capture · 与 Official aggregate fingerprint 比对 |
| C5 | 清除 Local 历史缓存 / stale evidence overlay（脚本内清单） |

**≠** Production 数据复制 · **≠** Web3 Candidate 部署

---

## Phase D — Staging Clean Rebuild（DESTRUCTIVE · Staging only · Owner gate）

**入口：** `TRAVELTRUST_OFFICIAL_FIRST_STAGING_CLEAN_REBUILD_OK=1`

```bash
bash scripts/dev/official-first-clean-rebuild-staging.sh
```

| Step | Action |
|------|--------|
| D1 | Staging DB **drop/recreate schema** 或 fresh MPG branch（**禁止**动 Production MPG） |
| D2 | Deploy **Official pin** API/www 镜像（`align-staging-www-official-v9.sh` 同源） |
| D3 | `sqlx migrate run` 至 Git 157 · sanitized seed |
| D4 | Schema capture · 与 Official 1:1 比对 |
| D5 | 清除 Staging 旧 overlay / Candidate 误标为 LIVE 的 bake 残留（plane-map ED 保持） |

**前置：** Owner 书面 OK · Staging DSN / deploy 授权

---

## Phase E — Verify & PASS（仅四零全成立后）

| Check | Criterion |
|-------|-----------|
| `Official = Git` | migrations checksum 1:1 · pin identity · 可重复 build |
| `Git = Local` | fresh rebuild schema fingerprint match（application layer；MPG 扩展差登记 ED） |
| `Git = Staging` | 同上 |
| `RUNTIME_PARITY_GAPS` | **0** |
| 四零闸 | 全 **0** |
| → | `PRODUCT_AND_DOCUMENTATION_PARITY_PASS` |
| 然后 | POST_PARITY_FIX_QUEUE · CMS/UI/UX 优化 |

---

## WEB3 平面（正交 · 不阻塞 PRODUCT clean rebuild）

```
Local → Sepolia → Audit #2/#3 → Mainnet V9
→ 真部署验证后 → 反向更新 Official Web3 展示
```

- Candidate `b19b85810…` **protected**
- Sepolia ETA **P0 interrupt**
- **禁止** Exact-Match / Mainnet / `TT_PRODUCTION_GO` 在本轨偷跑

---

## Forbidden（本轨全程）

- 继续 Local/Staging **考古修复**旧漂移  
- 修改 Official Production DB  
- 复制 Production 用户/订单/钱包数据到 Local/Staging  
- 用官网旧 Web3 覆盖 Candidate / V9 Freeze  
- ACCEPT_ED 清零 RUNTIME  
- Parity PASS 前 CMS/UI/功能优化  

---

## Related

- [Execution Parity (prior track)](TT-OFFICIAL-FIRST-EXECUTION-PARITY-LATEST.md)  
- [Full Convergence](TT-OFFICIAL-FIRST-FULL-CONVERGENCE-LATEST.md)  
- [Dual Truth Planes](TT-TRAVELTRUST-DUAL-TRUTH-PLANES-LATEST.md)  
- [Product Reality Capture](TT-OFFICIAL-PRODUCT-REALITY-CAPTURE-LATEST.md)
