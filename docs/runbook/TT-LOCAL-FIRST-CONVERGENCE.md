# TravelTrust · 唯一企业级发布流程 SSOT



**生效：** 2026-06-30  

**地位：** 仓库 **唯一发布治理主链**。Runbook · 脚本 · Gate · 证据目录 **均须映射到本页步骤**；**禁止**保留与本主链平行的第二套「发布 / 验收 / GO」流程描述。  

**阶段：** ① 本地 → ② 测试网（Phase② CLOSED）→ ③ 生产（Production GO · 另闸）



---



## 0 · 一句话



**本地仓库 = 唯一开发真源。** 按 **L0→L6→S5→S6→H1→Phase② CLOSED→③ Production Entry Review→Production GO** 顺序推进；**禁止跳阶**；**禁止**用 staging 旧 SHA 或 ① 本地绿冒充 ②/③ GO。



**从属文档（消费本主链 · 非平行轨）：** [PHASE2-LOCAL-STAGING-PARITY-LOOP](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md)（S5/S6 编排实现）· [TT-PHASE2-DEEP-RELEASE-GATE](./TT-PHASE2-DEEP-RELEASE-GATE.md)（S6）· [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md)（H1）· [go-live-checklist](../go-live-checklist.md)（③）· TT-9626/9627（竖切/段勾选 · **不替代**本主链）。

**Certification 语义层（互补 · 非平行轨 · v1.1）：** [TT-CERTIFICATION-FRAMEWORK.md](./TT-CERTIFICATION-FRAMEWORK.md) — **L0 Requirements → L1 Engineering → L2 Reality → L3 Production → L4 Operations（框架）**；Phase② CLOSED = **L2 Certificate**（Web3：[TT-WEB3-REALITY-CERTIFICATION.md](./TT-WEB3-REALITY-CERTIFICATION.md)）。



---



## 1 · 真源分层



| 层 | 含义 | 当前锚点（示例） |

|----|------|------------------|

| **本地 HEAD** | 开发 + 配置 SSOT | `31a45b74`（governance SSOT · L6 已签 · S5/S6 执行中） |

| **Staging runtime** | 已部署镜像 | `9979b35e`（Local First closure slice） |

| **Graduation / Soak** | 历史冻结证据 | `fc9266ce`（**只读** · **不覆写**） |

| **Phase③ WIP** | stash / 未跟踪 | **隔离** · **不混入** S5 deploy |



**LOCAL_AHEAD_UNDEPLOYED** ≠ **RUNTIME_DRIFT**。



---



## 1a · 唯一发布主链（写死）



```text

① Local First

──────────────────────────────

L0  Root Cause Analysis

        ↓

L1  Complexity Convergence

        ↓

L2  Target Regression

        ↓

L3  Local First Convergence Gate

        ↓

L4  Local Smoke

        ↓

L5  Commit + SSOT + Runbook + Evidence

        ↓

L6  Technical Sign-off（技术签字 · 批准 S5 Deploy）

──────────────────────────────

S5  Deploy → Staging

        ↓

S6  Technical Validation（自动验证 + 部署后一致性）

        ↓

H1  Human Acceptance（人工验收）

        ↓

Phase② CLOSED

──────────────────────────────

③ Production Entry Review

        ↓

Production GO

```



### 阻断条件（写死）



| 闸 | 条件 |

|----|------|

| **S5** | L0–L5 ✅ + **L6 Technical Sign-off** |

| **H1** | **S6** 全绿 |

| **Phase② CLOSED** | **H1** Owner 验收签字 |

| **Production GO** | **Phase② CLOSED** + **③ Production Entry Review** 通过 |



### 三类闸 · 不得混读



| 步 | 类型 | 定义 | **不是** |

|----|------|------|----------|

| **L6** | 技术签字 | 本地 L0–L5 是否 **可 S5 Deploy** | 测试 · staging 一致 · H1 验收 |

| **S6** | 机读/自动 | Deploy 后 SHA / Runtime / Config / Env / API / Web / Deep Gate / R-003 / UAT 自动项 | ① 替代 · L6 · H1 |

| **H1** | 人工验收 | staging 五角色/走廊/体验 **Owner 可接受** | L6 · S6 替代 · Production GO |



**P1 一致性问题（LOCAL_AHEAD、PD-009 staging 404、Deep Gate WARN 等）** → **S5 → S6** 闭合 · **不是 L6**。



**结构冻结：** **禁止**新增与 **L0–L6 / S5 / S6 / H1 / Phase② CLOSED / ③ Production Entry Review / Production GO** **平行的**流程名或独立门闸。新检查项只能 **归入某步** 或 **在该步内调用脚本**。



---



## 1e · 步骤 ↔ 脚本 / Gate / 证据（映射 SSOT）



| 步 | 典型脚本 / Gate | 证据目录（示例） | 机读末行（示例） |

|----|-----------------|------------------|------------------|

| **L1** | `validate-complexity-convergence-ledger-sync.sh` | — | `TT_COMPLEXITY_CONVERGENCE_SYNC: PASS` |

| **L2** | `cargo test -p traveltrust-api -- --test-threads=1` | gate 内 `l2-cargo-test.log` | 1197 pass / 0 fail |

| **L3** | `run-local-first-convergence-gate.sh --full-pre-deploy` | `evidence/GO_phase2_testnet_graduation/local-first-convergence-gate/<stamp>/` | `TT_LOCAL_FIRST_CONVERGENCE_GATE: PASS` |

| **L4** | `run-phase2-local-staging-parity-gate.sh --local-test` | 同上 · `l4-local-smoke.log` | `TT_PHASE2_LOCAL_STAGING_PARITY: PASS` |

| **L5** | git commit · runbook §1c 快照 | 同上 `SUMMARY.md` | HEAD SHA |

| **L6** | 证据目录 **Technical Sign-off** 表 | 同上 `SUMMARY.md` §L6 | 人工签字 |

| **S5** | `run-phase2-local-staging-parity-gate.sh --deploy --staging-retest` | `evidence/GO_phase2_testnet_20260526/local-staging-parity/<stamp>/` | deploy log |

| **S6** | `run-phase2-deep-release-gate.sh` · `check-staging-web-alignment.sh` · R-003 staging · PD-009 staging smoke | deep-gate / alignment 子目录 | `TT_PHASE2_DEEP_RELEASE_GATE: PASS` |

| **H1** | 五角色手验 · FRCA · phase28 HAT | [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md) · `evidence/…/phase28/` | HAT overall PASS + Owner 签 |

| **Phase② CLOSED** | Graduation / soak 时间闸（若适用） | `evidence/GO_phase2_testnet_graduation/` | 项目 Phase② 收口声明 |

| **③ Review** | `run-phase3-production-go-audit.sh` · PI3 清单 | `evidence/GO_phase2_testnet_20260526/phase3-production-prep/` | `TT_PHASE3_PRODUCTION_GO_AUDIT` |

| **Production GO** | [go-live-checklist](../go-live-checklist.md) | `go-audit-*/go_no_go.json` | `PRODUCTION_GO_DECISION: GO` |



**D1–D12** 仅为各步 **内部对拍清单**（见 §1d）· **不是**平行主链。



---



## 1d · D1–D12（步内清单 · 非独立流程）



| D | 检查项 | 归属步 |

|---|--------|--------|

| D1 | Git / SHA · LOCAL_AHEAD | **L5** · **S6** |

| D2 | Runtime DRIFT | **L3** |

| D3 | chain_id / 链模式 | **L4**（①）· **S5/S6**（Sepolia） |

| D4–D6 | 合约 · NEXT_PUBLIC · CORS | **L3** 只读 · **S6** 硬验 |

| D7 | DB migrations | **L2** · **S6** |

| D8 | Stripe test vs live | **S6** · **③** |

| D9 | smoke / UAT | **L4** · **S6** · **H1** |

| D10 | 运维 env | **L2/L4** · **S5** |

| D11 | build git_sha | **L5** · **S5** |

| D12 | Phase③ WIP 隔离 | **L3** · **L5** |



---



## 1b · 跨层纪律



| 问题 | 归属 | 禁止 |

|------|------|------|

| 本地 IT / smoke FAIL | **L2 / L4** | 改 staging 冒充 ① |

| LOCAL_AHEAD / PD-009 staging 差 | **S5 → S6** | 在 **L6** 要求 staging 一致 |

| Deep Gate / alignment FAIL | **S6** | **H1** 手测代替 |

| 体验 / 五角色 FAIL | **H1** | 在 **S6** 用文档冒充 |

| Production 问题 | **③** | 回头改 Phase② CLOSED 证据 |



---



## 1c · 当前位置（快照 · 2026-06-30）



| 步 | 状态 |

|----|------|

| L0–L5 | ✅ |

| L6 | ⏳ Technical Sign-off |

| S5 / S6 / H1 | 未开始 |

| Phase② | 未 CLOSED |

| ③ / Production GO | 未开始 |



证据：`evidence/GO_phase2_testnet_graduation/local-first-convergence-gate/20260630T075325Z/`



---



## 2 · 命令与通过标准



| 步 | 命令 / 动作 | 通过标准 |

|----|-------------|----------|

| **L0** | RCA 文档/注释 | 根因可复述 |

| **L1** | `bash scripts/dev/validate-complexity-convergence-ledger-sync.sh` | `TT_COMPLEXITY_CONVERGENCE_SYNC: PASS` |

| **L2** | `cargo test -p traveltrust-api -- --test-threads=1` | **1197/0** · 见 gate env |

| **L3** | `bash scripts/dev/run-local-first-convergence-gate.sh --full-pre-deploy` | `TT_LOCAL_FIRST_CONVERGENCE_GATE: PASS` |

| **L4** | （含于 L3）`--local-test` | `TT_PHASE2_LOCAL_STAGING_PARITY: PASS` |

| **L5** | commit + runbook + evidence | HEAD = SSOT |

| **L6** | `SUMMARY.md` Technical Sign-off 表 | L0–L5 ✅ · 批准 S5 |

| **S5** | `run-phase2-local-staging-parity-gate.sh --deploy --staging-retest` | staging 已部署 |

| **S6** | 见 **§2a** | Deep Gate + alignment + R-003 + staging smoke 全 PASS |

| **H1** | [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md) | S6 全绿后 · Owner 签 |

| **Phase② CLOSED** | Graduation / 项目收口声明 | H1 完成 |

| **③ Review** | [PHASE3-PRODUCTION-PREPARATION](./PHASE3-PRODUCTION-PREPARATION.md) · PI3 | Entry Review PASS |

| **Production GO** | [go-live-checklist](../go-live-checklist.md) | Owner **GO** 决定 |



**L3 一键：**



```bash

bash scripts/dev/run-local-first-convergence-gate.sh --full-pre-deploy

```



### §2a · S6 Technical Validation 清单



| 项 | 命令 / 真源 |

|----|-------------|

| SHA | staging `/meta` = deploy HEAD |

| Runtime | `emit-local-first-alignment-audit.mjs` · `runtime_drift: false` |

| Config / Env | `check-staging-web-alignment.sh` |

| API / Web | health · CORS · 合约 · `NEXT_PUBLIC_*` |

| Deep Gate | `run-phase2-deep-release-gate.sh` G01–G08 |

| R-003 | `run_r003_staging_evidence_chain.py` |

| UAT 自动 | `--staging-retest` · PD-009 staging smoke |



```bash

bash scripts/dev/run-phase2-local-staging-parity-gate.sh --staging-retest

bash scripts/dev/run-phase2-deep-release-gate.sh

bash scripts/dev/check-staging-web-alignment.sh

```



**L2 注意：** 全量 PG IT 须 `DATABASE_URL` + 停 :8080 API + `API_RATE_LIMIT_PER_MINUTE=0`。



---



## 2b · 漂移分类



| 信号 | 含义 | Deploy? |

|------|------|---------|

| `GAP-LOCAL-AHEAD-UNDEPLOYED` | 本地领先 | **否** — S5 后 S6 闭 |

| `GAP-RUNTIME-DRIFT` | SHA 非祖先 | **停** — L0 RCA |

| `TT_LOCAL_FIRST_RUNTIME_DRIFT: NONE` | 无漂移 | 可进 L6 评审 |



---



## 3 · 禁止



- 无 **L6** 即 **S5** · 无 **S6** 全绿即 **H1** · 无 **H1** 即 **Phase② CLOSED**

- 用 ①/② 结果冒充 **③ Production GO**

- 新增平行发布流程 / 门闸 / 阶段名

- 为清 WT 而 deploy（须 **L6 → S5**）

- 跨层修复 / 验收 / 改文档（§1b）



**诚实边界：** L6 ≠ S6 ≠ H1 ≠ Phase② CLOSED ≠ Production GO。


