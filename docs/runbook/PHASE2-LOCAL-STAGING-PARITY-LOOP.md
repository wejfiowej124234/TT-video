# Phase ② · 本地 ↔ 测试网对齐闭环（效率 SSOT）

**生效：** 2026-06-06  
**问题：** 本地绿 → 上 staging 大量不通 → 在 staging 改很多 → 本地又落后 → 来回慢。  
**解法（Local First · 2026-06-30）：** **本地仓库 = 唯一开发真源** → **本地收敛 + 文档/脚本同步** → **S5 再推 staging 验证** → **全绿才进 Phase ③ 宽表**。测试网已部署 SHA 是 **runtime 验收锚**，不是开发回退目标。见 [TT-LOCAL-FIRST-CONVERGENCE](./TT-LOCAL-FIRST-CONVERGENCE.md)。

**阶段纪律：** ① 本地开发 · ② 测试网验收 · ③ 公网/生产 — **禁止跳阶**；**禁止**用 staging 窄切片或 ① 绿集冒充 **Phase ② GO**。

> **当前状态（2026-06-06）：** **Phase ② staging 部署 / Phase ②.8 HAT 暂停**。须先完成 **① `ci-local-delivery-minimum` 0 FAIL**（已完成）→ **S3 本地烟测** → **证据归档** → 再 **S5 `--deploy`** → **S6 UAT/HAT**。见 [TT-LOCAL-CI-DELIVERY-GATE-001 §2](./TT-LOCAL-CI-DELIVERY-GATE-001.md)。

---

## 0 · 一句话流程

```text
staging 已部署 runtime ──► ① 本地为 SSOT 收敛 ──► ② 本地全功能测 ──► ③ 本地修 + 文档/脚本 ──► ④ 再跑 ②
                                                              │
                                                              ▼
                    Phase ③ ◄── ⑥ 复跑 Phase ② 全闸 ◄── ⑤ 推 staging（S5 · 正式 deploy）
```

**铁律：** **不在 staging 上直接改功能**（staging 只允许 **bugfix 部署 / env / CORS / 证据复跑**）；新逻辑 **必须** 在本地先过闸再上 staging。

---

## 1 · 六步闭环（Phase ② 收尾必跑）

| 步 | 名称 | 做什么 | 通过标准 |
|----|------|--------|----------|
| **S1** | **拉齐真源** | `git` 与 staging 同 commit；Sepolia/Stripe/env 与 staging 对拍 | `check-staging-web-alignment.sh` **FAIL=0**；本地 `GET /meta` chain_id 与 staging 一致 |
| **S2** | **本地对齐 env** | 合并 Sepolia 地址、同步 `frontend/.env.local`、本地 PG + API | `phase2-staging-merge-sepolia-env.sh` + `sync-frontend-env-local-from-root`；`curl localhost:8080/health` **200** |
| **S3** | **本地全功能测** | 走廊烟测 + 域绿集 +（可选）R-003 本地链 | 见 §2 命令块 · 全部 **exit 0** |
| **S4** | **本地修 + 再测** | 只修 FAIL 项；**禁止** 扩 scope / 改五主路由 UI | S3 **复跑全绿** |
| **S5** | **推 staging** | API → Web 顺序部署；部署后 alignment + **deep release gate** | **须先** [Deployment 三态分类](./TT-DEPLOYMENT-THREE-STATE-GOVERNANCE.md)（`sync` 或 `fix`）→ `run-deployment-three-state.sh` → `phase2-staging-fly-deploy-and-sync.sh` + `deploy-tt-web-staging.sh`；alignment **FAIL=0**；[TT-PHASE2-DEEP-RELEASE-GATE](./TT-PHASE2-DEEP-RELEASE-GATE.md) **PASS** |
| **S6** | **复跑 Phase ②** | **Deep release gate (G01–G08)** → Closing Gap + UAT 六大域 + Phase 2.5 | 见 §3 · **`TT_PHASE2_DEEP_RELEASE_GATE: PASS`** 且 UAT **0 FAIL** |

**Phase ③ 入口：** **✅ READY** · **Production Preparation ACTIVE** — 见 [PHASE3-PRODUCTION-PREPARATION](./PHASE3-PRODUCTION-PREPARATION.md)。**≠ Production GO**。

---

## 2 · S3 本地全功能测（与 staging 同契约 · 不同 host）

在 **仓库根**、**本地 API 已起**（`docker compose` + `cargo run -p traveltrust-api` 或 `start-api-with-seed.bat`）：

```bash
# 编排（推荐）
bash scripts/dev/run-phase2-local-staging-parity-gate.sh --local-test

# 或逐项：
export API_BASE_URL=http://127.0.0.1:8080
export DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust
bash scripts/smoke-ab-core-chain.sh
bash scripts/dev/smoke-onboarding-full-chain-local.sh    # 须本地 Stripe 或 SKIP 说明
bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh
bash scripts/dev/smoke-acquisition-pd009-local.sh
bash scripts/dev/run-web3-itinerary-l5-green.sh
bash scripts/dev/run-admin-l5-green.sh                   # 若有 admin 改动
```

**边界：**

- 本地 **HTTP host** = `127.0.0.1:8080`；**链 ID / 合约地址 / fee_schedule** 应与 staging **同 Sepolia 快照**（S1/S2）。
- `R003_LOCAL_CHAIN=1` 仅调试矩阵，**不得**写入 **`TT_PHASE2_GO_VERDICT: PHASE2_GO_READY`**。

---

## 3 · S6 复跑 Phase ②（staging · 真实数据链）

**前置（硬闸）：** [TT-PHASE2-DEEP-RELEASE-GATE](./TT-PHASE2-DEEP-RELEASE-GATE.md) **G01–G08 PASS** — `--staging-retest` 编排内自动跑；FAIL 阻断 S6 / HAT / Phase ③。

```bash
# 0) Deep multidimensional release gate（S6 编排内自动；可单独跑）
bash scripts/dev/run-phase2-deep-release-gate.sh

# 1) 环境 + 宽矩阵
bash scripts/dev/check-staging-web-alignment.sh
python scripts/dev/check_r003_staging_env_ready.py --env-file scripts/dev/.env.r003.local
python scripts/dev/run_r003_staging_evidence_chain.py --from-env --env-file scripts/dev/.env.r003.local

# 2) 浏览器六大域 UAT
bash scripts/dev/run-staging-uat-six-domains.sh

# 3) Phase 2.5 写路径补证
bash scripts/dev/run-phase25-coverage-hardening-staging.sh

# 4) Admin L5（若本轮动过 admin）
bash scripts/dev/run-admin-l5-staging-audit.sh

# 5) Closing Gap 机读
bash scripts/dev/record-phase2-closing-gap-status.sh
python scripts/validate-regression-report.py \
  evidence/GO_phase2_testnet_20260526/report.json --require-go
```

**收口键：**

| 键 | 含义 |
|----|------|
| `TT_PHASE2_DEEP_RELEASE_GATE: PASS` | 八维 staging release gate（G01–G08） |
| `TT_PHASE2_LOCAL_STAGING_PARITY: PASS` | S1–S4 本地闭环通过（脚本末行） |
| `TT_PHASE2_GO_VERDICT: PHASE2_GO_READY` | Closing Gap G1–G7（见 [PHASE2-CLOSING-GAP](./PHASE2-CLOSING-GAP.md)） |
| Staging UAT 六大域 | [PHASE2-STAGING-UAT-PRODUCTION-READINESS-MATRIX](./PHASE2-STAGING-UAT-PRODUCTION-READINESS-MATRIX.md) **0 FAIL** |

---

## 4 · S5 推 staging（本地绿之后）

```bash
# API secrets + 部署（勿含 PRIVATE_KEY）
bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh

# 前端（build-time NEXT_PUBLIC_* 与 build.env.local 一致）
bash scripts/dev/deploy-tt-web-staging.sh

# 部署后对拍
bash scripts/dev/check-staging-web-alignment.sh
```

Windows Fly CLI 需代理时：`export HTTPS_PROXY=http://127.0.0.1:15715`（见 [PHASE2-STAGING-FRONTEND-HOSTING](./PHASE2-STAGING-FRONTEND-HOSTING.md)）。

---

## 5 · 与现有文档关系

| 文档 | 关系 |
|------|------|
| [PHASE2-CLOSING-GAP](./PHASE2-CLOSING-GAP.md) | G1–G7 = **S6** 机读子集 |
| [PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md) | 宽轨验收清单 |
| [PHASE2-STAGING-FRONTEND-HOSTING](./PHASE2-STAGING-FRONTEND-HOSTING.md) | tt-web-staging env/CORS |
| [PHASE2.5-COVERAGE-HARDENING](./PHASE2.5-COVERAGE-HARDENING.md) | S6 写路径补证 |
| [PHASE29-RELEASE-POLISH](./PHASE29-RELEASE-POLISH.md) | **Phase ③ 入口暂停** · ②.9 UI/UX polish SSOT |
| [TT-PHASE2-DEEP-RELEASE-GATE](./TT-PHASE2-DEEP-RELEASE-GATE.md) | **S6/HAT/Phase③ 前** 八维 staging gate |
| [solo-dev-rhythm §6.5](../solo-dev-rhythm.md) | ① 日常本地子集 |
| [dev-local-smoke-baseline](../dev-local-smoke-baseline.md) | S3 走廊真源 |

---

## 6 · 禁止项（防再踩坑）

1. **禁止** 本地代码旧、staging 新，却在 staging 上继续堆功能 patch。  
2. **禁止** 只跑 ① 绿集就宣称 ② GO。  
3. **禁止** staging 修完不回灌本地 env（Sepolia 地址、Stripe test、CORS 清单）。  
4. **禁止** S6 未复跑就进入 Phase ③ Production Preparation 实施。  
5. **禁止** deep release gate FAIL 仍跑 S6 / HAT / Phase ③。  
6. **禁止** 五主路由 UI 结构变更（见 FIVE-MAIN-PHASE1-FREEZE）。

---

## 7 · 一键入口

```bash
# 全流程（S1→S4 本地；S5/S6 需显式加 --deploy --staging-retest）
bash scripts/dev/run-phase2-local-staging-parity-gate.sh

# 仅拉齐 + 本地测
bash scripts/dev/run-phase2-local-staging-parity-gate.sh --pull --local-test

# 本地已绿，推 staging 并复跑 ②（含 deep gate + S6）
bash scripts/dev/run-phase2-local-staging-parity-gate.sh --deploy --staging-retest

# 仅 deep release gate（deploy 后、HAT 前）
bash scripts/dev/run-phase2-local-staging-parity-gate.sh --deep-release-gate
```

证据建议目录：`evidence/GO_phase2_testnet_20260526/local-staging-parity/<UTC-stamp>/`
