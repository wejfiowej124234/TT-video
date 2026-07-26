# Batch-13 · FP-E 总验（Staging 复截 + 能力矩阵）

**Machine:** `TT_ADMIN_BATCH13_FP_E_TOTAL_VERIFY`  
**Stamp:** `20260726T082500Z`  
**Status:** **FP_E_IN_PROGRESS_STAGING_BLOCKED_DEPLOY**  
**Patch:** `PATCH-STG-017`  
**JSON:** [`TT-BATCH13-FP-E-TOTAL-VERIFY-LATEST.json`](./TT-BATCH13-FP-E-TOTAL-VERIFY-LATEST.json)  
**Probe:** [`TT-BATCH13-FP-E-STAGING-PROBE-LATEST.json`](./TT-BATCH13-FP-E-STAGING-PROBE-LATEST.json)  
**Session:** `evidence/manual-uat/sessions/20260726T081800Z-batch13-fp-e`

## 全局 LOCK（本轮未动）

| 项 | 状态 |
|----|------|
| tip cite | `ea71c577` **immobile** |
| Hard Gate | **LOCKED** |
| Cutover | **LOCKED** |
| `TT_PRODUCTION_GO` | **NO_GO** |
| `FINANCE_WRITE` | **FORBIDDEN** |

## 诚实边界

① FP-A～D **CODE_LANDED** ≠ ② Staging GO ≠ ③ Production GO  
当前 Staging bake **不含** FP-A～D UI markers（probe **0/8**）→ 正式 B13-06′～14′ / HU-495·487·490 **不得 PASS**。

## Bake

- Web `https://tt-web-staging.fly.dev` · API `https://tt-api-staging.fly.dev`
- `git_sha=892c20c830bb…` · pin `PSG-REL-20260720-WEB3-CAND-V2` · chain_id `11155111`
- tip≠staging SHA：**EXPECTED**（tip cite-only）

## Probe

- **verdict:** `FP_E_STAGING_DEPLOY_STALE_RESCREEN_BLOCKED`
- **fp_markers:** 0/8
- **rescreen_status:** BLOCKED_UNTIL_STAGING_DEPLOY_FP_CODE

## Capability matrix

- **verdict:** `FP_E_CAPABILITY_MATRIX_PARTIAL_AUTH_SPLIT`
- C2 API login → **admin_required** on admin list routes
- Browser SuperAdmin session（`traveltrust.test`）曾可读 UI；同域 fetch 对部分 admin 列表 **login_required**（proxy/auth split）
- 无 `TRAVELTRUST_ADMIN_TOKEN_SUPER` → Q1～Q6 **未闭**
- Artifact: `evidence/manual-uat/sessions/20260726T081800Z-batch13-fp-e/capability-api-matrix.json`

## PRE_DEPLOY 复截（非正式闭闸）

| Shot | 结论 |
|------|------|
| workbench | Sepolia badge · provider 13 · disputes 0 |
| orders | 只读 · meta.source 缺失 fail-closed |
| disputes | 只读裁决台 · HG LOCKED 文案 · 空列表 |
| onboarding | **Stripe 台账壳**（非 FP-D 审卡）→ deploy stale |
| content | Hub 瓷砖（FP-D strip/search 未确认） |
| official | 快捷瓷砖 + KPI |
| growth | 复登 C2 → **无管理后台权限** |

Screenshots: `evidence/manual-uat/sessions/20260726T081800Z-batch13-fp-e/batch13-screenshots/`

## Gates（仍 OPEN）

| Gate | Status |
|------|--------|
| HU-495 | OPEN |
| HU-487 | OPEN |
| HU-490 | OPEN · **禁止本会话签收** |

## Owner 下一步（唯一解锁复截路径）

1. PCR 部署 FP-A～D 到 Staging（**不动 tip**）
2. `node scripts/dev/probe-batch13-fp-e-staging.cjs` → markers 全命中
3. 恢复 Staging SuperAdmin 探针账号（ephemeral / 6b2 · **≠ Business GO**）
4. 正式复截 B13-06′～14′
5. 另口令再评 495/487；490 另口令 Owner Sign-off

## Verdict

**`FP_E_STAGING_DEPLOY_STALE_RESCREEN_BLOCKED`**
