# Batch-13 · FP-E 总验（Staging 复截 + 能力矩阵）

**Machine:** `TT_ADMIN_BATCH13_FP_E_TOTAL_VERIFY`  
**Stamp:** `20260726T090354Z`  
**Status:** **FP_E_RESCREEN_CAPTURED_GATES_STILL_OPEN**  
**Patch:** `PATCH-STG-017`  
**PCR:** `PCR-20260726-BATCH13-FP-A-D-STAGING-DEPLOY`  
**JSON:** [`TT-BATCH13-FP-E-TOTAL-VERIFY-LATEST.json`](./TT-BATCH13-FP-E-TOTAL-VERIFY-LATEST.json)  
**Probe:** [`TT-BATCH13-FP-E-STAGING-PROBE-LATEST.json`](./TT-BATCH13-FP-E-STAGING-PROBE-LATEST.json)  
**Session:** `evidence/manual-uat/sessions/20260726T081800Z-batch13-fp-e`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 全局 LOCK（本轮未动）

| 项 | 状态 |
|----|------|
| tip cite | `ea71c577` **immobile** |
| Hard Gate | **LOCKED** |
| Cutover | **LOCKED** |
| `TT_PRODUCTION_GO` | **NO_GO** |
| `FINANCE_WRITE` | **FORBIDDEN** |

## 诚实边界

① FP-A～D **已部署 Staging**（bake `67a6ccba` · markers **8/8**）≠ ② Staging GO ≠ ③ Production GO  
正式复截已采集 · **HU-495 / 487 / 490 仍 OPEN**（本会话**不**关闸、不签收 490）。

## Bake

- Web `https://tt-web-staging.fly.dev` · API `https://tt-api-staging.fly.dev`
- `git_sha=67a6ccba716d…` · pin `PSG-REL-20260720-WEB3-CAND-V2` · chain_id `11155111`
- tip≠staging SHA：**EXPECTED**（tip cite-only · tip 未移动）

## Probe

- **verdict:** `FP_E_STAGING_MARKERS_8_OF_8_SHA_DIVERGES_TIP_CITE_OK`
- **fp_markers:** **8/8**
- **rescreen_status:** CAPTURED_POST_DEPLOY

## SuperAdmin 探针

- 账号类：ephemeral Staging SuperAdmin（`adm-10x4-…@traveltrust.test`）
- **≠** Immutable C2 Business · **≠** Business GO
- Browser UI：`超级管理员（账号）`

## POST_DEPLOY 正式复截（B13-06′～14′）

| Shot | 结论 |
|------|------|
| workbench | SuperAdmin · Sepolia · provider 13 |
| users (06′) | 可写 · FP users honesty markers · meta.source fail-closed |
| orders (07′) | 只读 · `data-tt-admin-orders-q` · meta.source fail-closed |
| disputes (08′) | 裁决台 · meta.source fail-closed |
| onboarding (09′) | **FP-D** review cards + Stripe 台账壳 |
| content (10′) | Hub strip/search · 可写 |
| official (11′) | 快捷瓷砖 + KPI · 只读 |
| growth (12′) | SuperAdmin 增长中心（替代 PRE_DEPLOY 无权限截） |
| finance (13′) | finance-suite 只读 · `FINANCE_WRITE` 禁写文案 |
| config (14′) | 平台设置 hub · 只读 |

Screenshots: `evidence/manual-uat/sessions/20260726T081800Z-batch13-fp-e/batch13-screenshots/`  
Canonical names: `B13-06p-workbench` · `B13-06p-users` · `B13-07p-orders` · `B13-08p-disputes` · `B13-09p-onboarding` · `B13-10p-content` · `B13-11p-official` · `B13-12p-growth` · `B13-13p-finance` · `B13-14p-config`

## Gates（仍 OPEN · 禁止提前关闭）

| Gate | Status |
|------|--------|
| HU-495 | **OPEN** |
| HU-487 | **OPEN** |
| HU-490 | **OPEN** · **禁止本会话签收** |

## Owner 下一步

1. ~~PCR 部署 FP-A～D~~ **DONE**（tip 不动）
2. ~~markers 8/8~~ **DONE**
3. ~~SuperAdmin 探针 + B13-06′～14′ 复截~~ **DONE（采集）**
4. **另口令**再评 495/487；**另口令** Owner Sign-off 490
5. 可选：`TRAVELTRUST_ADMIN_TOKEN_SUPER` 补齐 capability API 矩阵

## Verdict

**`FP_E_RESCREEN_CAPTURED_GATES_STILL_OPEN`**
