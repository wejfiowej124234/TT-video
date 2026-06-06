# Phase ② · 全站 Closing Gap 收口（Community 已闭 · 宽轨）

**生效：** 2026-05-31  
**前置：** Community **C1–C12 ALL PASS** · [`CLOSING-REVIEW.md`](../../evidence/GO_phase2_testnet_20260526/community/CLOSING-REVIEW.md) · **`TT_PHASE2_COMMUNITY_C1_C12_CLOSING: ALL_SLOTS_PASS`** · [TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION](./TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION.md) · **`TT_PHASE2_COMMUNITY_MATRIX_VERDICT: GO`**

**当前机读判定：** **`TT_PHASE2_GO_VERDICT: PHASE2_GO_READY`**（2026-06-06T10:14Z 复跑）→ 进入 **Phase ③ Production Preparation**（**≠ Production GO**）

**阶段纪律：** **① 本地 → ② 测试网 → ③ 公网/生产**；Closing Gap 项 **须** 在 **②** 可验证环境完成并留证；**禁止** 用 **①** 窄切片 / Community 槽 PASS / C7 社区 D 域 `report.json` 冒充 **全站 staging GO**。

---

## 0 · Community ② 封版（写死）

| 项 | 态 |
|----|-----|
| **31 §15.2 C1–C12** | **ALL PASS · 矩阵 GO** · [Final Attestation](./TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION.md) · 证据 [`community/`](../../evidence/GO_phase2_testnet_20260526/community/) |
| **新增 Community 功能** | **STOP** — 仅 **bugfix** · **证据复跑** · **Closing Gap 依赖的数据链**（非 UI 结构变更） |
| **UI** | 五主路由 + Community shell **冻结** — 见 [FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) |

---

## 1 · Gap 项索引（SSOT）

证据根：[`evidence/GO_phase2_testnet_20260526/closing-gap/`](../../evidence/GO_phase2_testnet_20260526/closing-gap/)

| Gap ID | 名称 | 真源 / 命令 | 证据子目录 | 完成标准（②） |
|--------|------|-------------|------------|---------------|
| **G1** | **R-003 宽矩阵** | [PHASE2-TESTNET-ACCEPTANCE §0–1](./PHASE2-TESTNET-ACCEPTANCE.md) · `run_r003_staging_evidence_chain.py` | `closing-gap/G1-r003-staging/` | `report.json` **`environment.name=staging`** · **`release_gate=GO`** · `validate-regression-report.py --require-go` **exit 0** |
| **G2** | **全站 staging report 收口** | 同 G1 · 根 [`report.json`](../../evidence/GO_phase2_testnet_20260526/report.json) | `closing-gap/G2-report-json/`（或根 +  symlink `latest-report.json`） | 与 G1 同源；**非** `community/C7/report.json` 窄切片 |
| **G3** | **C-GOV MANUAL-P1** | [PHASE2-TESTNET-ACCEPTANCE §3](./PHASE2-TESTNET-ACCEPTANCE.md) · 93 C-GOV-004/005/010 | `governance-manual-p1/` 或 `closing-gap/G3-c-gov/` | 投票/委托/Claim 证据 + 钱包日志或 **N/A** 说明 |
| **G4** | **G-4 Stripe 真收单** | [PHASE2-START-CHECKLIST · G-4](./PHASE2-START-CHECKLIST.md) · 非零 `amount_minor` | `closing-gap/G4-stripe-g4/` | staging **无** `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` · Dashboard/webhook 旁证 |
| **G5** | **Onboarding testnet smoke** | `smoke-onboarding-testnet.sh` · ONB-P2-006 | `onboarding-smoke/` · `closing-gap/G5-onboarding-smoke/` | `check-phase2-onboarding-staging-ready.sh` + smoke **exit 0** |
| **G6** | **Sepolia stake 验证** | [TT-9629](./TT-9629-protocol-convergence-steward-stake-testnet.md) · registry 填址 | [`GO_phase2_steward_stake_sepolia/`](../../evidence/GO_phase2_stake_sepolia/) | 部署地址 + readonly/broadcast smoke **exit 0** |
| **G7** | **Production CDN / HLS 前置** | Community **C4/C5 pending** · ③ 另闸 | `closing-gap/G7-cdn-hls-prep/` | 生产 CDN/HLS 配置清单 + staging 可复验脚本；**③ GO 另闸** |

**建议顺序：** **G-2 可达** → **G4/G5**（onboarding 窄轨）→ **G1/G2**（R-003 全矩阵）→ **G3** → **G6** → **G7**（可与 ③ 并行预研）

---

## 2 · 机读判定（Closing Gap → Phase ② GO Ready）

| 键 | 含义 |
|----|------|
| **`TT_PHASE2_GO_VERDICT: NOT_MET`** | 默认；Community 或宽轨任一项未满足 |
| **`TT_PHASE2_GO_VERDICT: PARTIAL`** | ≥1 Gap **PASS** · 未全绿 |
| **`TT_PHASE2_GO_VERDICT: PHASE2_GO_READY`** | **G1–G7 全部 PASS**（G7 可为 **PREP_PASS** · 生产 CDN 本身属 ③）· Owner 书面确认 |
| **Phase ③** | **`PHASE2_GO_READY` 之后** 另开 Production Preparation · **≠** ③ Production GO |

汇总文件：[`closing-gap/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/closing-gap/STATUS.txt)（由 `record-phase2-closing-gap-status.sh` 刷新）

---

## 3 · 每项证据包（统一）

每项 **PASS** 须含：

| 文件 | 说明 |
|------|------|
| `STATUS.txt` | `status: PASS` · `last_run` · `api_base` · `note` |
| `run.log` | 主命令 **exit 0** 完整日志 |
| `report.json` | 适用时（G1/G2）· **`release_gate`** · **`environment.name`** |
| `*-summary.md` | 人读摘要 · 边界说明 |

---

## 4 · 快速命令

```bash
# 刷新 Closing Gap 总 STATUS（读各 Gap 子目录 STATUS.txt）
bash scripts/dev/record-phase2-closing-gap-status.sh

# G1 · R-003（staging · 填 scripts/dev/.env.r003.local 后）
python scripts/dev/check_r003_staging_env_ready.py --env-file scripts/dev/.env.r003.local
python scripts/dev/run_r003_staging_evidence_chain.py --from-env --env-file scripts/dev/.env.r003.local

# G5 · Onboarding testnet
bash scripts/dev/check-phase2-onboarding-staging-ready.sh
bash scripts/dev/smoke-onboarding-testnet.sh

# 机读收口（G1/G2 GO 时）
python scripts/validate-regression-report.py \
  evidence/GO_phase2_testnet_20260526/report.json --require-go
```

**本机预演（≠ staging GO）：** `R003_LOCAL_CHAIN=1` · 证据 **`evidence/R003_local_evidence_chain/`** — 仅调试矩阵，**不得** 写入 **`TT_PHASE2_GO_VERDICT: PHASE2_GO_READY`**。

---

## 5 · 当前阻塞（2026-06-06）

| ID | 项 | 态 |
|----|-----|-----|
| P2-BLK-001 | R-003 staging GO | **CLOSED** · [`G1-r003-staging/`](../../evidence/GO_phase2_testnet_20260526/closing-gap/G1-r003-staging/) |
| P2-BLK-004 | G-2 staging HTTPS Fly | **CLOSED** · `tt-api-staging.fly.dev` |
| P2-BLK-005 | G-4 staging 非零 Stripe | **CLOSED** · [`G4-stripe-g4/`](../../evidence/GO_phase2_testnet_20260526/closing-gap/G4-stripe-g4/) |
| P2-BLK-006 | Sepolia registry / stake | **CLOSED** · [`GO_phase2_steward_stake_sepolia/`](../../evidence/GO_phase2_steward_stake_sepolia/) |
| P2-BLK-007 | PD-009 staging 收购链 | **CLOSED** · [`PD-009-staging/`](../../evidence/GO_phase2_testnet_20260526/closing-gap/PD-009-staging/) |

**Phase ③ 仍 OPEN：** 生产域 · CDN · Mainnet · WAF · RBAC · go-live 十二项 — **禁止** 回拉 Phase ②。

---

## 5.1 · Phase ② 收尾闭环（本地 ↔ staging · **进 ③ 前必跑**）

**痛点：** 本地绿 → 上 staging 不通 → 在 staging 改很多 → 本地又落后 → 效率低。

**SSOT：** **[PHASE2-LOCAL-STAGING-PARITY-LOOP](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md)**

| 步 | 动作 |
|----|------|
| 1 | staging 已修版本 = 真源 → **拉齐本地** code + Sepolia/Stripe env |
| 2 | **本地全功能测** → 修 bug → **本地再测全绿** |
| 3 | **再推 staging** → **复跑** Closing Gap + UAT 六大域 + Phase 2.5 |
| 4 | 全绿 → 才开 **Phase ③ Production Preparation** |

```bash
bash scripts/dev/run-phase2-local-staging-parity-gate.sh --pull --local-test
# 本地修完后再：
bash scripts/dev/run-phase2-local-staging-parity-gate.sh --deploy --staging-retest
```

机读：`TT_PHASE2_LOCAL_STAGING_PARITY: PASS`（**≠** 替代 `TT_PHASE2_GO_VERDICT`；二者都绿才可进 ③）。

---

## 6 · 互指

| 读者 | 入口 |
|------|------|
| 仓库总态 | [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) |
| 宽 ② 六轨 | [PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md) |
| 窄 ② G 闸 | [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) |
| Community 已闭 | [COMMUNITY-PHASE-2-3-ROADMAP §封版](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) |
