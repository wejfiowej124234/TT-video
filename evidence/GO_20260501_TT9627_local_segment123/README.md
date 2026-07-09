# TT-9627 · ① 本地机读证据（段 1～6 子集 · 2026-05-01）

**覆盖 commit 上界：** `e1ddff2`（`git log -1` → 2026-05-01 +0800）  
**环境：** **① 本地** · API `BASE=http://127.0.0.1:8080`（跑竖切时在本机已监听）  
**范围：** TT-9627 **段 1～2** API 竖切、`cargo test`、**段 3** ISS-007 窄切片软链 + `report.json` 校验、**段 4～6** 真源文件在位、**B-421** 机读。**不含** **③ 生产**；**② 测试网**真链路与 **§0.b 治理四项** 本条 **未执行**（须单独窗口 + env）。

---

## 96-15 · 本轮深度多维

**本轮无对外「深度审计」/ 合同 DPA·安全附录级触发**（对照 **96-15 §0「何时必跑」**）。**§3 P0 手工全表本轮标 N/A**：独立开发期仅补齐 **Tier A · A3**：`bash scripts/check-runbook-golive-doclink-gate.sh` **exit 0**（见下）。**Tier B/C**（59 九维逐行、96-13/96-16 全量走查等）**未**在本目录留全覆盖证据。

---

## 命令与产物（均为 exit 0）

| 顺序 | 命令 | 说明 |
|------|------|------|
| 1 | `cargo test -p traveltrust-api` | **1181 passed**，约 1.28s |
| 2 | `BASE=http://127.0.0.1:8080 bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh` | 段 **1**：VS02 +（chain_off mounted）VS01 |
| 3 | `BASE=http://127.0.0.1:8080 bash scripts/gates/vertical-slice-tt9627-segment2-hub-public-smoke.sh` | 段 **2**：VS03+VS04（market + community 公开读面） |
| 4 | `bash scripts/gates/vertical-slice-tt9627-segment3-r002-prereport-chain.sh` | 段 **3** 软链：无 `DATABASE_URL` 时生成 ISS-007 `report.json`，`release_gate=PARTIAL_GO` |
| 5 | `bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh evidence/GO_local_r002_verify/r002_iss007_prereport/report.json` | 段 **3** 机读校验（软路径一致） |
| 6 | `bash scripts/gates/vertical-slice-tt9627-segment4-spec-presence.sh` | 段 **4**：96-13 / 96-16 / 29 路径在位 |
| 7 | `bash scripts/gates/vertical-slice-tt9627-segment5-spec-presence.sh` | 段 **5**：TT-9624 / 96-21 / 96-17 路径在位 |
| 8 | `bash scripts/gates/vertical-slice-tt9627-segment6-spec-presence.sh` | 段 **6**：TT-9626 / go-live / 缺口总表 / TT-MAINNET / 96-15 / RUNBOOK 在位 |
| 9 | `bash scripts/check-runbook-golive-doclink-gate.sh` | **B-421** / go-live 互指机读 |

**段 3 产物路径：** `evidence/GO_local_r002_verify/r002_iss007_prereport/report.json`（与 **`evidence/GO_local_r002_verify/README.md`** 同源说明：**ISS-007 43 锚全 PASS 仍可 `PARTIAL_GO`**，**禁止**单独冒充 staging 全矩阵 **GO**）。

---

## ② 测试网 · 下一优先级（本轮未在本目录收口）

按 **[TT-9627 §0.a](docs/runbook/TT-9627-delivery-order-spine-then-full-site.md)**，在具备 **测试网 RPC、`DATABASE_URL`、部署地址与 env** 后顺序补齐：

1. **主脊 / 准入费 / 索引等对卡**：对齐 **[TT-9618](docs/runbook/TT-9618-onboarding-local-testnet.md)** 与任务卡真值，留 **`CHAIN_ID`、合约表、curl/HAR**。
2. **若 scope 含治理②闭环**： **[TT-9627 §0.b](docs/runbook/TT-9627-delivery-order-spine-then-full-site.md)** 表四项全 ☑，建议 **`evidence/GO_gov_testnet_<YYYYMMDD>/README.md`**（§0.b.1）。
3. **段 3 strict**：设置 `DATABASE_URL`（及脚本头所载链/env）后重跑 **`local-verify-r002-prereport-chain.sh`**，使 **43 锚** 从 **NOT_RUN** 走到 **`--fail-on-no-go`** 可接受状态；仍须遵守 **93 / R-002** 全矩阵语义，**窄切片 GO** 不等价 **② 全站**。

---

## 禁止假完成（与 CONTRIBUTING / TT-9628 §0.0.5 一致）

本 README **仅**记录 **①** 上述脚本通过及 **`PARTIAL_GO`** 机读事实；**不**等价 **② 测试网全矩阵已闭**、**③ Production GO**、或 **`validate-regression-report.py --require-go`** 在 staging 全量意义上的 **GO**。

---

## 追加 · 2026-05-01（本轮补齐）

**磁盘修改未提交时**：以下命令须在 **`git commit` 后** 将 **`git rev-parse --short HEAD`** 刷新为本段证据的 commit 上界。

### ① 段 3 strict（本地 Postgres）

前提：`docker compose up -d postgres`，且  
`DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`  
`P3_CHAIN_OFF=1`  

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export P3_CHAIN_OFF=1
bash scripts/gates/local-verify-r002-prereport-chain.sh
```

**本轮实测**：**exit 0**，**`summary.PASS==43`**、**`NOT_RUN==0`**，`release_gate` 仍为 ISS-007 设计下的 **`PARTIAL_GO`**；**`e2e_core_report.passed=true`**。

### ① TT-9618 §3.5.3 一键（PG 机读，对齐测试网步骤 5～7 同源命令）

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
unset INTERNAL_API_SECRET  # 或 export INTERNAL_API_SECRET=
bash scripts/gates/tt-9618-onboarding-pg-evidence.sh
```

**本轮实测**：**`tt-9618-onboarding-pg-evidence: OK`**（promtool / `CHECK_FRONTEND_NPM_BUILD` 未启用）。

### 代码修正摘要（支撑上述绿色）

1. **`auth_placeholder_layer`**：`/api/v1/hooks/*` **不经 Bearer**；**`GET /api/v1/onboarding/quote`** 公开读；**401** 前对 onboarding 路径 **`record_onboarding_gate_401_before_handler`**（到达计数 + 4xx 桶，避免先于 handler 拦掉导致 metrics 缺项）。
2. **`GET /metrics`**：写出 **`onboarding_counters`** 与 **`snapshot_onboarding_webhook_queue_counts_for_metrics`**（96-09 队列 gauge）。

### ② 测试网（仍为缺口）

在 **`API_BASE_URL=https://<测试网 API>`**、**测试网 `DATABASE_URL`**、密钥与 **TT-9618 §3.1** 一致前提下，复跑 **`tt-9618-onboarding-pg-evidence.sh`** 与 **竖切 BASE=测试网**；单独目录留 **`CHAIN_ID` / 合约表 / 脱敏 curl**。**本条 README 不宣称 ② 已闭**。

## 环境纪律（避免误红）

- **`cargo test -p traveltrust-api`（默认 1181）**：须在 **未全局 export `DATABASE_URL`** 的会话中执行。若在终端里长期设置 **`DATABASE_URL`** 指向本机 Docker PG，再跑全量测试，可能出现 **大批量失败**（与若干用例的 skip/隔离假设冲突）。
- **需要 Postgres 的脚本**（**`local-verify-r002-prereport-chain.sh`** strict、**`tt-9618-onboarding-pg-evidence.sh`**）：仅在**子进程或单行**内导出 `DATABASE_URL`，跑完后 **`unset DATABASE_URL`** 再跑全量单元测试。

---

## ② 测试网执行清单（待填真值 · 非③）

以下 **不**宣称已在本文档所在提交闭环节；具备 **测试网 HTTPS API**、**测试库 `DATABASE_URL`**、与部署一致的 **`INTERNAL_API_SECRET` / 链 env** 后按序执行。

| 优先级 | 动作 | 命令或产物 |
|--------|------|------------|
| P0 | 对齐 Runbook | **[TT-9618](docs/runbook/TT-9618-onboarding-local-testnet.md)** **§3.1**（步 1～4 手工程序；步 5～7 机读） |
| P0 | PG 机读（同源本地一键） | `export DATABASE_URL='<测试网 Postgres>'`；`unset INTERNAL_API_SECRET`；`bash scripts/gates/tt-9618-onboarding-pg-evidence.sh` |
| P1 | API 竖切（② Base） | `BASE='https://<测试网 API 主机>' bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh`（及 segment2，视窗口） |
| P1 | 证据目录 | 新建 **`evidence/GO_tt9618_testnet_<YYYYMMDD>/README.md`**：填写 **`CHAIN_ID`**、RPC 主机（可脱敏）、**`GET /meta`** 摘要、脱敏 **curl**；与 **TT-9627 §0.c** 互指 |

**禁止假完成**：② 闭环 **不得**仅用 **①** 本地 Docker PG 机读代替；但 **①** 已验证的脚本与 **②** 使用 **同一迁移集与镜像** 时，可将 **①** 命令作为 **②** 的预演。

### ② 一键脚本（本轮新增）

**`bash scripts/gates/tt-9627-testnet-segment12-smoke-pack.sh`** — **`BASE=https://<测试网 API>`** 串跑 **TT-9627 段 1+2**；可选 **`RUN_TT9618_PG=1`** + **`DATABASE_URL=<测试网 PG>`** 串 **TT-9618**。索引见 **`scripts/README.md`**（**TT-9627 · ② 测试网** 行）。**① 本机** 验证脚本本身：`TRAVELTRUST_ALLOW_LOCAL_BASE=1 BASE=http://127.0.0.1:8080 bash scripts/gates/tt-9627-testnet-segment12-smoke-pack.sh`。
