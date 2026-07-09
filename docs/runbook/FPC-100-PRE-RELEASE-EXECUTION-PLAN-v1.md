# FPC-100 · Pre-Release Execution Plan

**Status:** ACTIVE · PLAN ONLY  
**Parent checklist:** [`FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md`](../spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md)  
**Machine registry:** [`registry/full-production-certification-checklist.v1.yaml`](../../registry/full-production-certification-checklist.v1.yaml)  
**Local anchor:** `e9df0a73` · **Local FREEZE**

---

## 1. 执行纪律

0. **Governance FROZEN @ v5** — 见 [`FPC-GOVERNANCE-FREEZE-v5.md`](../spec/governance-token/evidence/phase3-production-entry-baseline/FPC-GOVERNANCE-FREEZE-v5.md) · **只推进 Execution（B00–B41）**  
0b. **No Batch Skip** — 必须 B00→B01→…→B41 顺序 · `node scripts/dev/check-fpc-no-batch-skip.cjs`  
0c. **每日 rhythm** — 1 Batch → Dashboard → Commit · Owner 只看 **`TT_RELEASE_READINESS`**  
1. **不改 Local** — 除非 Diff / Staging-only / 新 P0/P1  
2. **一批一证据** — 无 `FPC-100-BATCH-{Bx}-LATEST.json` 不得标 PASS  
3. **批间顺序** — 见 §2；P0 批 FAIL 则停止下游 P0  
4. **阶次标注** — 每条结论标 ① / ② / ③  
5. **禁止假完成** — 窄切片 GO ≠ 全站 FPC PASS（[`CONTRIBUTING`](../../CONTRIBUTING.md#no-false-completion)）

---

## 2. 推荐执行顺序（甘特式）

```
Week-style blocks (Owner pacing — not calendar commitments)

Block 0 · Anchor
  B00 → B01

Block 1 · Consumer P0 spines
  B02 → B03 → B04 → B05

Block 2 · Extended surfaces
  B06 → B07 → B08

Block 3 · Platform depth
  B09 → B10 → B11

Block 4 · Cross-cutting (can parallelize B13–B19 after Block 1)
  B12 → B13 → B14 → B15 → B16 → B17 → B18 → B19

Block 5 · Web3 + infra + closure
  B20 → B21 (②) → B22 (②) → B23 → B24

─── One-shot Staging Deploy (e9df0a73) ───

Block 6 · Staging verification (no Local edits)
  B00' → B01' → Environment Diff → Staging PER spot check
```

---

## 3. 每批执行模板（复制用）

```bash
# 0. Confirm anchor clean
git rev-parse HEAD   # must be e9df0a73 during Local FPC unless new baseline committed
git status --porcelain  # should be empty

# 1. Run batch gates (from registry YAML batches[].gates)
bash scripts/gates/<gate>.sh

# 2. Record evidence
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
EVID=docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/Bxx-<name>
mkdir -p "$EVID"
# ... manual notes / screenshots / curl captures ...

# 3. Write FPC-100-BATCH-Bxx-LATEST.json + CLOSEOUT.md

# 4. Update rollup
# FPC-100-REGISTRY-LATEST.json
```

---

## 4. 批次 Gate 速查

| Batch | Primary command(s) |
|-------|-------------------|
| B00 | `bash scripts/dev/run-local-staging-full-alignment-audit.sh` |
| B01 | `bash scripts/dev/run-per-final-spot-check.sh` |
| B02 | `bash scripts/gates/five-main-routes-ui-antiregression-gate.sh` · `bash scripts/dev/run-web3-itinerary-l5-green.sh` |
| B03 | `bash scripts/gates/auth-contract-gate.sh` · `bash scripts/dev/smoke-provider-onboarding-local.sh` |
| B04 | `bash scripts/dev/run-market-guide-catalog-parity.sh` · `bash scripts/gates/check-display-data-governance-ssot.sh` |
| B05 | `bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh` |
| B06 | `bash scripts/dev/smoke-governance-proposals-l5-local.sh` |
| B07 | `bash scripts/gates/vertical-slice-04-community-explore-public-smoke.sh` |
| B08 | `bash scripts/dev/smoke-acquisition-pd009-local.sh` |
| B09 | `bash scripts/dev/smoke-admin-rbac-matrix-local.sh` |
| B10 | `node scripts/dev/run-production-readiness-master-checklist.cjs` |
| B11 | `bash scripts/gates/run-check-04-routes.sh` · `cargo test -p traveltrust-api` |
| B12 | `bash scripts/dev/run-display-data-governance.sh` |
| B13 | `cd frontend && npx vitest run lib/siteMetadataBase.test.ts` |
| B14 | Manual per `docs/spec/96-13-UI-UX-i18n-a11y-性能走查.md` |
| B15 | Manual 375px matrix |
| B16 | `bash scripts/gates/check-frontend-npm-build.sh` |
| B17 | `bash scripts/gates/check-invariants.sh` |
| B18 | `bash scripts/gates/check-production-ui-hygiene-gate.sh` + prod build walk |
| B19 | curl `/health` `/meta` both envs |
| B20 | `bash scripts/gates/check-web3-full-alignment-gate.sh` |
| B21 | Staging Stripe test webhook evidence |
| B22 | `bash scripts/gates/check-phase3-production-infrastructure-ssot.sh` |
| B23 | `bash scripts/dev/run-phase1-site-page-forensic.sh` |
| B24 | `bash scripts/gates/ci-local-delivery-minimum.sh` |

---

## 5. Staging 部署（Block 6 前置 · Owner-only）

```bash
# One-shot — do not split across days
# Requires: fly auth · staging secrets · optional TESTNET_FREEZE_OVERRIDE=1

bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh
# + web deploy per run-phase2-testnet-full-sync-deploy.sh if full stack needed
```

**Immediately after deploy:**

```bash
bash scripts/dev/run-local-staging-full-alignment-audit.sh

WEB_BASE=https://tt-web-staging.fly.dev \
API_BASE=https://tt-api-staging.fly.dev \
  bash scripts/dev/run-per-final-spot-check.sh
```

---

## 6. Rollup 更新

每批 CLOSEOUT 后更新：

- `FPC-100-REGISTRY-LATEST.json` — batches[].verdict · open_p0_p1_count  
- `FPC-100-REGISTRY-LATEST.md` — 人类可读进度表

**FPC-100 EXIT** 条件见 checklist §7。

---

## 7. 缺陷登记

FPC 发现的问题 **不得** 静默修复：

1. 登记 `evidence/manual-uat/summary/defects-registry.json` 或 FPC batch JSON `findings[]`  
2. 分类 DEFECT / DRIFT / BLOCKING_RISK  
3. 修复 → 回归 gate → 新 evidence → **若改代码需新 baseline commit**（打破 freeze 须 Owner 显式）

---

**Honest boundary:** 本 Runbook 编排检查 · **不** 代替 `go-live-checklist` ③ Production GO。
