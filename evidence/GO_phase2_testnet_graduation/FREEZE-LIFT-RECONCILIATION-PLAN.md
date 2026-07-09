# Phase② · Freeze-Lift Reconciliation Plan

**Status:** ACTIVE · **Planning-only** · Reliability Freeze until `COMPLETED.json`  
**Stamp:** 20260614T083420Z  
**grep:** `TT_FREEZE_LIFT_RECON_PLAN: ACTIVE 20260614T083420Z`

## 纪律
- ✅ 四层差异梳理 · FLB 计划
- ❌ deploy · 功能变更 · 重跑已关闭项 · 杀 soak

## 四层模型
`WT → HEAD → Staging → Evidence` · 目标：同一 git SHA

## RECON-001～003（优先）

| ID | WT | HEAD/Staging | Evidence | FLB |
|----|-----|--------------|----------|-----|
| RECON-001 | 2000+ 未提交 | Staging=HEAD `5ab1f8ba2229…` | TN-P1/D6 PASS | 001–004, 006–007, 009 |
| RECON-002 | 正确 selector | HEAD 错误 selector | TN-P1-010 PASS | **001, 006, 010** |
| RECON-003 | 10 migrations 未跟踪 | git 缺文件 | D6/D10 PASS | **002** |

### Migrations（FLB-002）
- `crates/api/migrations/20260607120000_cms_catalog_p1.sql`
- `crates/api/migrations/20260607120100_cms_official_ops_p2.sql`
- `crates/api/migrations/20260607120200_cms_growth_p3.sql`
- `crates/api/migrations/20260607130000_cms_catalog_s2_004_pricing_tiers_media.sql`
- `crates/api/migrations/20260607140000_growth_early_bird_g_s3.sql`
- `crates/api/migrations/20260607150000_growth_airdrop_g_s6.sql`
- `crates/api/migrations/20260608120000_sprint168_business_expansion.sql`
- `crates/api/migrations/20260609120000_guides_hourly_rate_avatar_url.sql`
- `crates/api/migrations/20260612120000_guides_public_title.sql`
- `crates/api/migrations/20260613120000_guide_exit_requests.sql`

## Post-Graduation 顺序
`CLOSED` → FLB-001+002 (commit) → FLB-003+004 → FLB-005+006+007 (deploy) → FLB-009+010

**诚实边界：** ② Freeze-Lift ≠ ③ Production GO
