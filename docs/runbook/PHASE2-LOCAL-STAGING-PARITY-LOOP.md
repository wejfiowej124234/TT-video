# Phase ② · S5/S6 编排实现（从属 SSOT · 非独立发布流程）

**生效：** 2026-06-06 · **主链修订：** 2026-06-30  
**唯一发布主链 SSOT：** **[TT-LOCAL-FIRST-CONVERGENCE.md](./TT-LOCAL-FIRST-CONVERGENCE.md)** — L0→L6→S5→S6→H1→Phase② CLOSED→③→Production GO。

> **已废止（勿再作流程 SSOT）：** 下文旧称 **S1–S4 六步闭环**、**Phase ②.8 HAT 暂停** 等 **平行流程描述** — 仅保留 **命令块** 作 **L4 / S5 / S6 实现参考**。验收职责：**L6** = 技术签字 · **S6** = 机读 · **H1** = 人工验收。

**旧 S1–S6 → 新主链映射：**

| 旧称（本文件） | 新主链步 | 说明 |
|----------------|----------|------|
| S1 拉齐真源 | **L3** 只读 + **S6** 硬验 | `check-staging-web-alignment.sh` |
| S2 本地对齐 env | **L4** 前置 | Sepolia env merge |
| S3 本地全功能测 | **L4** | `--local-test` |
| S4 本地修 + 再测 | **L0–L4** 迭代 | 非独立步 |
| S5 推 staging | **S5 Deploy** | `--deploy` |
| S6 复跑 Phase② | **S6 Technical Validation** | Deep Gate · alignment · R-003 |
| HAT / UAT 手测 | **H1 Human Acceptance** | [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md) |

**阶段纪律：** ① 本地 · ② 测试网 · ③ 生产 — **禁止跳阶**。

---

## 2 · S3 本地全功能测（**L4** · 命令块保留）

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

## 3 · S6 staging 机读验证（**S6 Technical Validation** · 命令块保留）

**前置（硬闸 · S6）：** [TT-PHASE2-DEEP-RELEASE-GATE](./TT-PHASE2-DEEP-RELEASE-GATE.md) **G01–G08 PASS** — FAIL 阻断 **H1** / Phase② CLOSED / ③。

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
