# Phase ② · Git ↔ Staging 基线纪律

**生效：** 2026-06-06  
**最新同步：** 20260617T015222Z · **`GIT_STAGING_BASELINE_SYNC: PASS`**  
**基线冻结：** 20260617T021847Z · **`TESTNET_STAGING_FREEZE: ACTIVE`** · TL#1 Wave 1 wait

| 端 | SHA / 状态 |
|----|------------|
| **git HEAD** | `8dcd304afae1bafe5a4de738175e171256a9501e` |
| **tt-api-staging `/meta`** | `8dcd304afae1bafe5a4de738175e171256a9501e` ✅ |
| **tt-web-staging** | `FLY_WEB_NO_CACHE=1` @ `8dcd304` ✅ |
| **TESTNET_STAGING_FREEZE** | **ACTIVE** · `evidence/TESTNET_STAGING_FREEZE/ACTIVE.json` |
| **Baseline consistency audit** | `evidence/GO_phase2_baseline_consistency_audit/20260617T020824Z` · **0 DIFF** |

**机读键：**

```text
GIT_STAGING_BASELINE_SYNC: PASS
GIT_SHA_LOCAL_STAGING_MATCH: YES (8dcd304afae1bafe5a4de738175e171256a9501e)
TT_PHASE2_DEEP_RELEASE_GATE: PASS
TT_PHASE2_BASELINE_CONSISTENCY_AUDIT: OK (diffs=0)
TT_TESTNET_STAGING_FREEZE: ACTIVE
```

---

## 2 · 20260606 同步摘要

### 前置

- 起始 HEAD `9747e1c`（frontend + Phase ② 脚本基线）
- **禁止 dirty tree 部署**：`crates/` WIP 先 stash，仅自 committed tree 构建

### 追加 commit（部署所需）

| Commit | 内容 |
|--------|------|
| `67a22387` | Dockerfile：复制 migrations + spec artifacts |
| `d077071f` | `.dockerignore`：放行 `docs/spec/artifacts` |
| `c1a38d54` | 19 条 staging PG 已应用 migrations 入库 |
| `deb38a97` | Admin L5 / Phase ② API 路由层 |
| `96c739e1` | 其余 staging API 模块（可编译完整镜像） |

### 部署

```bash
export HTTPS_PROXY=http://127.0.0.1:15715
export NO_PROXY=localhost,127.0.0.1,tt-api-staging.fly.dev,tt-web-staging.fly.dev

bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh          # API
FLY_WEB_NO_CACHE=1 bash scripts/dev/deploy-tt-web-staging.sh   # Web
```

### 复验（全部 PASS）

| 闸 | 证据 |
|----|------|
| SHA 对拍 | `git rev-parse HEAD` = staging `/meta.build.git_sha` |
| 六大域 UAT | `staging-uat-six-domains/20260606T144405Z` · 8 passed / 0 failed |
| Admin L5 | `GO_staging_admin_l5_audit/20260606T152813Z` · verdict=PASS |
| Phase 2.5 | `phase25-coverage-hardening/20260606T153032Z` · 5/5 PASS |

**证据目录：** `evidence/GO_phase2_testnet_20260526/git-staging-baseline-sync/20260606T140150Z/`

---

## 3 · 纪律（Phase ③ 前强制）

1. **先 commit，再 deploy** — 禁止「staging 有、git 无」。
2. **API + Web 同批部署** — 禁止只部署 web。
3. **Web 换真源时 `FLY_WEB_NO_CACHE=1`** — 避免 Docker 层误用旧 frontend。
4. **部署前检查**：`frontend/`、`deploy/fly/`、`Dockerfile`、将参与 API 构建的 `crates/` **无未提交运行时代码**。
5. **Production 仅来自 tagged commit** — 禁止 dirty working tree 构建。

---

## 4 · 标准对拍命令

```bash
git rev-parse HEAD
curl -sS https://tt-api-staging.fly.dev/meta | jq -r '.build.git_sha'
# 须完全一致

bash scripts/dev/run-staging-uat-six-domains.sh
bash scripts/dev/run-admin-l5-staging-audit.sh
bash scripts/dev/run-phase25-coverage-hardening-staging.sh
```

---

## 5 · 相关文档

- [PHASE2-DUAL-LOOP-COMPLETION-REPORT.md](./PHASE2-DUAL-LOOP-COMPLETION-REPORT.md)
- [PHASE2-LOCAL-STAGING-PARITY-LOOP.md](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md)
- [TTG-CERT-EXECUTION-SESSION-RUNBOOK.md](./TTG-CERT-EXECUTION-SESSION-RUNBOOK.md) §3 Phase B

---

## 6 · Phase B 冻结纪律（Owner · 2026-06-17）

**冻结 SHA：** `8dcd304afae1bafe5a4de738175e171256a9501e`（`TESTNET_STAGING_FREEZE: ACTIVE`）  
**禁止：** redeploy · restart · migrations · fly secrets · 功能扩面 — **仅**阻塞性 P0 缺陷可破例（`TESTNET_FREEZE_OVERRIDE=1` + Owner 书面决策）

| 阶段 | 允许动作 | 禁止 |
|------|----------|------|
| **TL#1 前** | **仅** `run-phase-b-daily-maintenance.sh` | Wave 1 · Soak · redeploy |
| **TL#1 后 · Wave 1** | **Owner 钱包** · Cert #7 + Cert #8 queue · **写入 TL#2** | spend execute · redeploy |
| **Wave 1 后** | **全新** 72h Soak（`P2FC_SOAK_SUPERSEDE=1`） | 沿用僵死旧 job |
| **Soak COMPLETED** | **复跑** TN-P1-010 | — |
| **其后（依次）** | HAT-R1 → Cert #10–#12 → Graduation Review | redeploy |

**序（Owner · 写死）：** maintenance → TL#1 Wave 1（Cert #7 + Cert #8 queue · 写入 TL#2 倒计时）→ **全新 Soak** → TN-P1-010 复跑 → HAT-R1 → Cert #10–#12 → Phase ② Graduation。（Cert #8 TL#2 spend execute **不在**本轮毕业序。）

**每日唯一入口（当前 · PRE_TL1）：**

```bash
export HTTPS_PROXY=http://127.0.0.1:15715
bash scripts/dev/run-phase-b-daily-maintenance.sh
bash scripts/dev/run-phase2-graduation-closure-program.sh --status
```

**毕业闭环总程序 SSOT：** [PHASE2-GRADUATION-CLOSURE-PROGRAM.md](./PHASE2-GRADUATION-CLOSURE-PROGRAM.md)

**TL#1 到期后（Owner 钱包 · 不在 Agent 默认代跑）：**

```bash
export HAT_R1_LIVE_WALLET_OK=1 HAT_R1_PHASE_B_PAUSED=0
bash scripts/dev/run-phase-b-post-timelock-wave1.sh --signer "Sebastian Ward"
export P2FC_SOAK_SUPERSEDE=1
bash scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh
```
