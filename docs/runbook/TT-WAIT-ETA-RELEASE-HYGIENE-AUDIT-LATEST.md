# WAIT_ETA · Release Hygiene Audit（Track A · READ-ONLY）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Machine:** `TT_WAIT_ETA_RELEASE_HYGIENE_AUDIT`  
**Status:** `SUPERSEDED_SNAPSHOT` · `REPORT_ONLY` · `NO_MUTATION`  
**Recorded:** `2026-07-20`（WAIT_ETA · FG-15-B）  
**Pin:** `PSG-REL-20260720-WEB3-CAND-V2` · `v311_fund_safety_candidate_v2`  
**Companion:** [Production Feature Readiness](./TT-WAIT-ETA-PRODUCTION-FEATURE-READINESS-AUDIT-LATEST.md)

```text
本报告 = 扫描 + 分类 + 修复计划
禁止本轮：删除 Archive / Historical Evidence / Closed Incident
禁止本轮：改 Candidate v2 · L5 · S7 · Hard Gate · 合约 · schema
```

**诚实边界：** Hygiene prep ≠ PSG Complete ≠ Production GO。

---

## 0 · 执行摘要

| 轨 | 结论 |
|----|------|
| 现行 Web3 SSOT（Candidate LATEST / mainline registry） | **大体对齐** |
| 主要漂移 | FG-15-A **prep runbook 仍写 living 命令**；部分 registry 仍用 `active_*` 键名挂 clean baseline |
| Tokenomics | 宪章 V3.1.1 **KEEP**；个别旧「公众 20% / 六桶」文案需 UPDATE |
| 处置原则 | **只标记 · 不删除** · ETA 后再分批修文档指针 |

**抽样规模（非全仓穷举）：** runbook/spec 高信号 ~32 条 · FG-15 脚本族 ~12 · Candidate 脚本 ~8 · registry 基线键 ~20。

---

## 1 · DOC_DRIFT_REPORT

### 1.1 分类定义

| Class | 含义 | 本轮动作 |
|-------|------|----------|
| **DELETE_CANDIDATE** | 无读者价值、且已被 SUPERSEDED 文完全替代 | **仅列清单** · 禁止本轮删 |
| **ARCHIVE_ONLY** | 保留证据；停止当 living SOP | 加/强化 ARCHIVED 横幅 · 去掉可执行命令块 |
| **UPDATE_REQUIRED** | 仍被引用，但指针/数字过时 | ETA 后改指针到 Candidate |
| **KEEP_SSOT** | 与 V3.1.1 / Candidate 一致 | 不动 |

### 1.2 高价值条目（节选）

| # | Path | Issue | Class |
|---|------|--------|-------|
| 1 | `TT-FG15-PARALLEL-LAUNCH-PREP-LATEST.md` | **ARCHIVED_HISTORICAL**（已 demote · 2026-07-22） | CLOSED |
| 2 | `TT-FG15-SIX-PARALLEL-PREP-LATEST.md` | 同上 | UPDATE_REQUIRED |
| 3 | `TT-FG15-ANOMALY-EVIDENCE-MAINTENANCE-LATEST.md` | 指向 `run-fg15-running-maintain.sh` | UPDATE_REQUIRED → `run-web3-candidate-v2-fg15b-maintain.sh` |
| 4 | `TT-PSG-CLOSURE-READINESS-LATEST.md` | 仍列 FG-15-A maintain | UPDATE_REQUIRED |
| 5 | `TT-PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.md` | 横幅归档 · 正文仍有 `run-fg15-*` | UPDATE_REQUIRED / ARCHIVE_ONLY |
| 6 | `TT-PRODUCTION-READINESS-DOSSIER-LATEST.md` | 正文 refresh 仍 FG-15-A | ARCHIVE_ONLY |
| 7 | `TT-PRODUCTION-LAUNCH-FINAL-PACK-LATEST.md` | 横幅 OK · 正文 observation-running | UPDATE_REQUIRED |
| 8 | `TT-POST-FG15-GATE-SEQUENCE-LATEST.md` | FG-15-A 后序列 · 易被当成 FG-15-B 下一步 | ARCHIVE_ONLY |
| 9 | `docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md` | 「现行」仍 narrate clean | UPDATE_REQUIRED |
| 10 | `…/TTG-GENESIS-V2-UNIQUE-DRIFT-LIST-…LATEST.md` | 「现 ACTIVE=clean」 | UPDATE_REQUIRED |
| 11 | `…/protocol-ssot.v1.md` | changelog 缺 Candidate cutover 行 | UPDATE_REQUIRED |
| 12 | `…/GENESIS-GOVERNANCE-PHASE.md` | G-END-01「公众 20%」vs V3.1.1 Public **50%** | UPDATE_REQUIRED |
| 13 | `…/traveltrust-web3-protocol-master-matrix-v1.md` | 六桶 25/20/… 仍标 SSOT | UPDATE_REQUIRED / ARCHIVE_ONLY |
| 14 | `…/ttg-allocation-permissions-flows-ssot-v1.md` | SUPERSEDED 横幅正确 | KEEP_SSOT |
| 15 | `…/TTG-TOKENOMICS-FREEZE-V1.md` | ALLOCATION SUPERSEDED | KEEP_SSOT |
| 16 | `…/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md` | 10M · 15/5/30/50 | KEEP_SSOT |
| 17 | `TT-WEB3-CANDIDATE-V2-LATEST.md` | 禁写非 `_candidate_v2` 证据根 | KEEP_SSOT |
| 18 | `TT-FG15-A-HISTORICAL-ARCHIVE-LATEST.md` | 归档正确 | KEEP_SSOT |
| 19 | `TT-CLEAN-SEPOLIA-REDEPLOY-V311-LATEST.md` | HISTORICAL COMPLETE | ARCHIVE_ONLY |
| 20 | `TT-PSG-DOC-VS-DEPLOY-FRESHNESS-AUDIT-LATEST.md` | HEAD=`09c72b93` 易被当现行 tip | UPDATE_REQUIRED |
| 21 | Production Launch / Cert packs citing `09c72b93` | 横幅多为历史 | ARCHIVE_ONLY |
| 22 | `TT-MODULE-RELEASE-COCKPIT-LATEST.md` | Tag GO 旁证易被误读 | KEEP_SSOT（caveat 保持显眼） |
| 23 | `TT-CURRENT-FOCUS-DASHBOARD-LATEST.md` | FG-15-B ACTIVE | KEEP_SSOT |
| 24 | `TT-PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.md` | 历史 recalculate | ARCHIVE_ONLY |
| 25 | `registry/traveltrust-web3-protocol-master-matrix.v1.yaml` | EscrowFactoryV2=`FUTURE_MAINNET` 同时已有 Candidate Sepolia 地址 | UPDATE_REQUIRED |

**计数（本抽样）：** KEEP≈10 · UPDATE≈12 · ARCHIVE≈8 · DELETE_CANDIDATE≈0（本轮不建议删任何 Archive）。

**机读旁证：** `docs/runbook` 内仍引用 `run-fg15-running-maintain|observation-running` 的 md ≈ **5**；`*LATEST.md` 提及 `v311_sepolia_clean_baseline` ≈ **32**（多数应 ARCHIVE 语境）；提及 Candidate pin ≈ **55**。

---

## 2 · SCRIPT_USAGE_MAP

### 2.1 Living（KEEP · Candidate）

| Script | 被谁引用 | 替代谁 |
|--------|----------|--------|
| `scripts/dev/lib/web3-candidate-v2-mainline.sh` | Candidate 入口 / gates | 默认拒写 FG-15-A 证据根 |
| `run-web3-candidate-v2-fg15b-maintain.sh` | Maintain pipeline / LATEST | **替代** `run-fg15-running-maintain.sh` |
| `run-web3-candidate-v2-{money-path,live-money-path,settlement-finalize,sepolia-deploy,…}.sh` | `web3-mainline` entry points | Living ladder |
| `scripts/gates/check-web3-mainline-candidate-v2-gate.sh` | AGENTS / CI 旁证 | 强制 Candidate pin |
| `scripts/gates/check-web3-candidate-v2-gate.sh` | Consistency packs | 读 `_candidate_v2` 证据 |

### 2.2 DEPRECATED_SCRIPT_LIST（默认勿跑 · 法医需 `ALLOW_HISTORICAL=1`）

| Script | 状态 | 说明 |
|--------|------|------|
| `run-fg15-running-maintain.sh` | DEPRECATED living | → Candidate maintain |
| `run-fg15-observation-running.sh` | DEPRECATED living | 同上 |
| `run-fg15-observation-sample.py` | DEPRECATED | 被 maintain 链引用（历史） |
| `run-fg15-observation-48h-start.py` | DEPRECATED | `run-final-completion-closure.sh` 仍 `\|\| true` 软耦合 |
| `run-fg15-six-parallel-prep-packs.py` / `parallel-launch-prep*.py` | DEPRECATED living | FG-15-A 窗 prep |
| `run-fg15-close-prep.py` / `elapsed-eval` / `window-freeze` | ARCHIVED forensic | 勿作 FG-15-B ELAPSED 路径 |
| `run-post-fg15-gate-sequence.py` | ARCHIVE_ONLY | **≠** FG-15-B 满窗梯子 |

### 2.3 危险模式（未删 · 仅标记）

| Finding | 风险 |
|---------|------|
| Living LATEST 仍 **命令** refuse-gated FG-15-A 脚本 | 操作者困惑 / 误开 `ALLOW_HISTORICAL` |
| `run-final-completion-closure.sh` → `run-fg15-observation-48h-start.py \|\| true` | 软孤儿耦合 |
| 双 gate：`check-web3-candidate-v2` vs `check-web3-mainline-candidate-v2` | 需文档一句分清「一致性 vs 硬闸」 |

**未发现：** Candidate 默认脚本写入 `evidence/GO_fg15_observation_48h`（非 `_candidate_v2`）。

---

## 3 · Registry 分类建议（标记 · 不删）

| 项 | Suggested tag | 备注 |
|----|---------------|------|
| `web3-mainline.v1.yaml` · Candidate | **ACTIVE** | OK |
| `web3-candidate-v2.v1.yaml` | **ACTIVE** | OK |
| `web3-active-execution-matrix.v1.yaml` | **ACTIVE** | OK |
| `protocol-convergence-deployments` · Candidate | **ACTIVE** | OK |
| `fg15-a-historical-archive.v1.yaml` | **ARCHIVED** | OK |
| `psg-release-version` · `…CAND-V2` | **ACTIVE** | OK |
| `…FG15-09c72b93` | **ARCHIVED** | 须保留 |
| `psg-clean-sepolia-redeploy-v311` · `active_baseline_key=clean` | **DEPRECATED alias** | 键名误导 · 注释已 deprecate |
| `psg-v311-sepolia-clean-baseline-cert` | **ARCHIVED** | OK |
| `v311-sepolia-address-matrix-freeze` | **ARCHIVED** | FG-15-A |
| `mainnet-release-freeze` · `registry_active_baseline=clean` | **ARCHIVED** stamp | 建议改名债务 |
| `traveltrust-web3-protocol-master-matrix` · FactoryV2 FUTURE vs Candidate 地址 | **UPDATE_REQUIRED** | 叙事冲突 |
| `psg-dual-wait-phases` | **ARCHIVED** | SUPERSEDED |
| `psg-09-web3-phase1-audit-20260716` | **ARCHIVED** | snapshot |

**原则遵守：** 不删除 Archive / Historical Evidence / Closed Incident；只建议 tag。

---

## 4 · 修复计划（ETA 后分批 · 仍非 Candidate 代码）

### Batch H1 · 文档指针（低风险）

1. 凡 `TT-FG15-*-LATEST` 仍教 `run-fg15-running-maintain` → 顶部改 **ARCHIVED** + 指向 Candidate maintain。  
2. Production Launch / Cert / Dossier 正文 **去掉可执行 FG-15-A 命令**（保留证据叙事）。  
3. Tokenomics 旧「20% / 六桶 SSOT」→ 指向 V3.1.1 + SUPERSEDED。

### Batch H2 · Registry 命名债

1. 将误导性 `active_baseline_key`（clean）改为 `historical_baseline_key`（或并列显式 `active_web3_ssot`）。  
2. Master matrix：Sepolia Candidate FactoryV2 标 ACTIVE；FUTURE 仅限主网 Wave。

### Batch H3 · 脚本（仍不删文件）

1. FG-15-A 脚本头注释统一：`DEPRECATED_DEFAULT · ALLOW_HISTORICAL only`。  
2. `run-final-completion-closure.sh` 去掉或守卫 `observation-48h-start` 软调用。  
3. Runbook 一句分清两个 Candidate gate。

### 明确不做（本窗）

- 物理删除脚本 / registry / evidence  
- 改 Candidate digest / 合约 / S7 Reader  
- 宣称 Hygiene = PSG Complete

---

## 5 · 产出物

| 文件 | 角色 |
|------|------|
| 本文件 | Track A SSOT（LATEST） |
| [Track B](./TT-WAIT-ETA-PRODUCTION-FEATURE-READINESS-AUDIT-LATEST.md) | 生产级功能缺口 |
| [Backlog](./TT-WAIT-ETA-PRODUCTION-READINESS-BACKLOG-LATEST.md) | 下一阶段排队 |

**扫描方法：** `rg` 高信号抽样 + 子代理并行只读审计 · **非**全文件删除清单。
