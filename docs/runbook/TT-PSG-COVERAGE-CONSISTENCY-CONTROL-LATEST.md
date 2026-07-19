# PSG · Coverage Consistency Control（Alignment Loop）

**Machine:** `TT_PSG_COVERAGE_CONSISTENCY_CONTROL`  
**Status:** **ACTIVE** · `2026-07-19`  
**机读：** [`registry/psg-coverage-consistency-control.v1.yaml`](../../registry/psg-coverage-consistency-control.v1.yaml)  
**Gate：** `bash scripts/gates/check-psg-coverage-consistency-control.sh`  
**Stamp：** `python scripts/dev/stamp-psg-coverage-run.py`  
**关联：** [Measurement Recalculate](./TT-PSG-COVERAGE-MEASUREMENT-RECALCULATE-LATEST.md) · [Measurement FINAL](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md) · [Register](./TT-PRODUCTION-READINESS-REGISTER-LATEST.md)

> **原则（写死）：** 任何 Coverage Gap 修复必须完成  
> **Local PASS → Git Commit SHA 固化 → Staging 同 SHA 部署 → Staging Evidence 验证 → Coverage Recalculate**  
> 五点一致，否则 **不得计入 Coverage PASS**（Threshold / Acceptance / GO 层）。  
> **本地测试通过 ≠ 测试网通过 ≠ Git 版本一致 ≠ 生产可发布。**

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED          ← 可含 LOCAL 证据
Coverage Metrics:    FINAL             ← 分母可本地填满
Consistency Control: OPEN / NOT_ALIGNED  ← 未闭环前禁止 ALIGNED_PASS
```

---

## 0 · 两层 Coverage 状态（防假 PASS）

| 层 | 含义 | 可否写「维 PASS / 计入 Threshold」 |
|----|------|-----------------------------------|
| **LOCAL_PASS** | 本机 API/FE 探针成功 · 有本地 Evidence | ❌ **仅**证明本机跑通 |
| **ALIGNED_PASS** | 五点一致性闭环完成 · `coverage_run` 绑定同 SHA | ✅ **唯一**可计入 Coverage Acceptance |

**规则：** Measurement 格可暂记 `LOCAL_PASS`；**Threshold Rollup / Coverage Acceptance / Production 叙事** 只认 `ALIGNED_PASS`。

---

## 1 · Alignment Loop（唯一合法修复序）

```text
Coverage 发现问题
        ↓
定位根因
        ↓
PSG Register（Issue ID · Owner · Cell cite）—— 禁止静默改
        ↓
最小修复
        ↓
本地验证（LOCAL_PASS）
        ↓
Git 提交 + SHA 固定（Working Tree clean · HEAD = commit）
        ↓
Staging 部署同 SHA
        ↓
Staging 验证（parity + 同格复验）
        ↓
Evidence 更新（coverage_run 绑定版本）
        ↓
Coverage Recalculate（仅 ALIGNED 分子）
```

---

## 2 · Gate 1 · Git Source Integrity

必须同 SHA：

| 节点 | 要求 |
|------|------|
| Working Tree | Coverage 修复相关路径 **clean**（或明确列入本轮 commit） |
| Local HEAD | `git rev-parse HEAD` = **Commit SHA** |
| Registry | `coverage_run.git_sha` / Consistency Control `pinned_sha` = 同上 |
| Evidence | `coverage_run.json` · CELL 日志 · FINAL compact 引用同一 SHA |
| Staging Deploy | `/meta`（或 deploy stamp）`git_sha` = 同上 |

**禁止：** Local=`abc123` · Staging=`old999` · Registry 未钉 · Evidence 无 SHA。

---

## 3 · Gate 2 · Environment Parity

Local PASS 后 **不得**直接宣称通过。必须：

| 环境项 | 检查 |
|--------|------|
| Local | 目标格 LOCAL_PASS |
| Staging | **同 SHA** 部署 |
| Staging DB | migration / schema 与该 SHA 一致 |
| Env | 关键配置键一致（非密钥明文对比 · 比存在性与模式） |
| API | `health` + `/meta` 一致（含 `git_sha` / build） |

---

## 4 · Gate 3 · Evidence 必须绑定版本

每个可计入 ALIGNED 的 Coverage 运行须有：

```yaml
coverage_run:
  schema: traveltrust.psg_coverage_run.v1
  git_sha: "<40-hex>"            # tip under test / deployed
  environment: local | staging   # ALIGNED 要求 staging
  api_sha: "<from API /meta build.git_sha>"
  web_sha: "<from Web /meta build.git_sha>"
  migration_state: matched | unknown | drift
  api_version: "<from /meta>"
  frontend_version: "<from FE build / package>"
  timestamp: "<UTC ISO8601>"
  evidence_path: "evidence/.../..."
  cell_refs: []
  register_issue_ids: []
  consistency_verdict: LOCAL_ONLY | ALIGNED_PASS | FAIL
```

**RBAC 注意：** 60/96 NEED_FIX 因阈值 `pass/96==100` 且 36×N/A 不计 PASS — **禁止**为刷数字扩测；先 Owner 裁定有效格 vs N/A / Acceptance 规则。

**无 `coverage_run` 绑定 → 不得 ALIGNED_PASS。**

模板生成：

```bash
python scripts/dev/stamp-psg-coverage-run.py \
  --environment local \
  --evidence-path evidence/GO_pre_eta_production_prep/coverage-gap-non-web3-20260719/phase3
```

---

## 5 · Gate 4 · 发现 FAIL / 漂移时（禁止静默改）

```text
RBAC / Data cell FAIL 或漂移
        ↓
PSG Register（既有 ID 或新增行 · Owner · Sev）
        ↓
Issue ID 可 cite
        ↓
最小 Fix（ΔFix 规则仍受 Release Gate 约束 · Web3 Min-Fix 另窗）
        ↓
Regression Evidence（同格复验）
        ↓
再进 Alignment Loop（Git → Staging → Recalculate）
```

覆盖率分子 **只在 ALIGNED_PASS 后** 增加。

---

## 6 · 五点一致性检查表（硬闸）

| # | 点 | PASS 条件 |
|---|----|-----------|
| 1 | **Local** | 目标格探针 exit 0 / CELL_PASS |
| 2 | **Git** | Commit 存在 · HEAD=该 SHA · 修复已入 commit |
| 3 | **Staging Deploy** | 同 SHA 部署可证 |
| 4 | **Staging Evidence** | 同格复验 · `coverage_run.environment=staging` · 同 `git_sha` |
| 5 | **Recalculate** | FINAL / Registry 分子仅计 ALIGNED · 文档互指 |

任一 ❌ → Consistency Control = **NOT_ALIGNED** · 该格 **不得**计入 Coverage PASS。

---

## 7 · 当前裁决（诚实 · Consistency Closure）

| 项 | 状态 |
|----|------|
| Phase3 Local Measurement | 分母格已填 · Metric FINAL（本地） |
| Coverage content commit | **`50682517b71171129700eeac130ecbdace274bb4`** |
| Build-aligned tip / `pinned_sha` | **`0a0265d32da36874d1c373b90b14bd6d496f9ac0`** |
| Staging 同 SHA | **未**证（部署进行中/待证） |
| Consistency Control | **NOT_ALIGNED**（等 Staging ALIGNED） |
| ALIGNED 分子 | **0**（直至 L3–L5） |
| Fix Required / Gate | **8** / **CONDITIONAL_GO**（未改） |

> 本文件 **不**把 Phase3 本地 PASS 升格为 Staging/Acceptance PASS。  
> Closure Board：[TT-PSG-COVERAGE-CONSISTENCY-CLOSURE-BOARD-LATEST](./TT-PSG-COVERAGE-CONSISTENCY-CLOSURE-BOARD-LATEST.md)

---

## 8 · 机读与命令

```bash
# 状态审计（默认：报告 OPEN/NOT_ALIGNED 不伪绿）
bash scripts/gates/check-psg-coverage-consistency-control.sh

# 硬要求五点 ALIGNED（未闭环应 exit ≠ 0）
bash scripts/gates/check-psg-coverage-consistency-control.sh --require-aligned

# 钉 coverage_run（本地或 staging）
python scripts/dev/stamp-psg-coverage-run.py --environment staging --git-sha <SHA>
```

---

## 9 · 纪律

| 允许 | 禁止 |
|------|------|
| 本地先证 LOCAL_PASS | 仅本地通过写 Threshold PASS |
| Register 关联最小修复 | 静默改代码刷格 |
| Staging 同 SHA 复验后 Recalculate | Local SHA ≠ Staging SHA 仍宣称 PASS |
| Evidence 绑 `coverage_run` | 无版本绑定的「覆盖率」叙事 |
| Solo Owner Self Review | 跳过 Git/Staging「因为 Solo」 |

**不**改变 Fix=8 · **不**宣称 Production GO · **不**随机扩测。
