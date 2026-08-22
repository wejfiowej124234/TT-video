# Official-First · Clean Rebuild Convergence（PRODUCT 平面）

**TRACK:** `OFFICIAL_FIRST_CLEAN_REBUILD_CONVERGENCE`  
**STATUS:** `PRODUCT_AND_DOCUMENTATION_PARITY_PASS` **ISSUED** (`2026-08-22T06:06:51Z`)  
**Gate:** `PRODUCT_AND_DOCUMENTATION_PARITY` = **PASS** · `RUNTIME_PARITY_GAPS=0` · 四零闸全 **0**  
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
| 7 | **Runtime Parity PASS 前禁止** CMS/UI/UX/功能优化 · POST_PARITY_FIX_QUEUE · Exact-Match/Mainnet/`TT_PRODUCTION_GO` |
| 8 | **Runtime Parity PASS 后** → [`POST_PARITY_FIX_QUEUE`](TT-OFFICIAL-FIRST-POST-PARITY-FIX-QUEUE-LATEST.md)（Local → Staging · 非目标 0-drift） |

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
| View expansion archaeology | **CLOSED** — post-migrate governed view refresh (`official-first-refresh-governed-views.sql`) |
| CMS catalog / seed manifests | **POST_PASS** — OCS sanitized seed optional (`TRAVELTRUST_OFFICIAL_FIRST_STAGING_OCS_SEED_OK`) |

---

## Phase C — Local Clean Rebuild（DESTRUCTIVE · Local only · **COMPLETE**）

**入口：** `TRAVELTRUST_OFFICIAL_FIRST_LOCAL_CLEAN_REBUILD_OK=1`

```bash
bash scripts/dev/official-first-clean-rebuild-local.sh
```

| Step | Action |
|------|--------|
| C1 | 销毁 Local Docker PG volume · 清除 `.env.local` 旧产品 overlay / fallback 键 |
| C2 | `docker compose up -d postgres` · `sqlx migrate run`（Git 157）· governed view refresh |
| C3 | 注入 **sanitized seed**（test accounts registry · 无 Production PII/订单/钱包） |
| C4 | Schema-only capture · 与 Official aggregate fingerprint 比对 |
| C5 | 清除 Local 历史缓存 / stale evidence overlay（脚本内清单） |

**≠** Production 数据复制 · **≠** Web3 Candidate 部署

---

## Phase D — Staging Clean Rebuild（DESTRUCTIVE · Staging only · **COMPLETE** `20260822T060547Z`）

**入口：** `TRAVELTRUST_OFFICIAL_FIRST_STAGING_CLEAN_REBUILD_OK=1`

```bash
bash scripts/dev/official-first-clean-rebuild-staging.sh
```

| Step | Action |
|------|--------|
| D1 | Pre-rebuild read-only backup → `staging_pre_rebuild_backup_*` |
| D2 | Staging DB `DROP SCHEMA public CASCADE` + recreate（**禁止**动 Production MPG） |
| D3 | `sqlx migrate run` 至 Git 157 · governed view refresh |
| D4 | Schema capture · `official-first-product-reality-compare.py`（HOSTING_ED 排除） |
| D5 | Staging API/www restart（runtime cache flush） |

**Evidence:** `STAGING_REBUILD_MIGRATION_VERIFY_LATEST.json` · `STAGING_SCHEMA_CAPTURE_LATEST.json` · `OFFICIAL_PRODUCT_REALITY_COMPARE_LATEST.json`

---

## Phase E — Verify & PASS（**ISSUED** `2026-08-22T06:06:51Z`）

| Check | Result |
|-------|--------|
| `Official = Git` | migrations checksum **MATCH_1TO1** (157/157) |
| `Git = Local` | application layer **match** · HOSTING_ED excluded |
| `Git = Staging` | application layer **match** · HOSTING_ED excluded |
| `RUNTIME_PARITY_GAPS` | **0** |
| 四零闸 | 全 **0** |
| → | **`PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS` ISSUED** |
| 然后 | [`POST_PARITY_FIX_QUEUE`](TT-OFFICIAL-FIRST-POST-PARITY-FIX-QUEUE-LATEST.md) Batch 1 CMS/OCS（M7-07 · M7-08）→ Admin/Auth → UI/UX → 功能 → Assets/i18n |

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
