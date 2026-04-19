# R-003 · 首轮 staging 实战证据落盘区

## 给有 staging 权限的执行人（严格按序 · 可转发）

1. 在 **真实 staging** 上按 **[R-003](../../docs/spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md)** 跑完 **0 → 1 → 门禁 → 2**（**A 域停机线**：任一 **FAIL/BLOCKED** 即停，**不得**继续 B）。  
2. 在 **`evidence/r003_staging_first/run_<UTC>/`** 落盘 **四件套**（见下节 **`report.json`** + **`ENV-DB-PROOF/notes.md`** + **`requests/`** + **`summary.md`**）。  
3. 仓库根执行：**`python scripts/validate-regression-report.py evidence/r003_staging_first/run_<UTC>/report.json --fail-on-no-go`**，须 **exit 0**。  
4. **放行登记**（与 **[go-live-checklist §0.3](../../docs/go-live-checklist.md)** 一致，**四样齐**）：**①** `report.json` **路径** **②** **`sha256`** **③** **`release_gate`** 与 **`release_gate_reason`** **④** **Release Owner 双签**。  
5. **A+B 主链与三条验收（硬性）**：按 **[R-003 · #r003-ab-core-acceptance](../docs/spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md#r003-ab-core-acceptance)** 在 **可控环境**完成主链**实测**并提交 **四件套**；须**同时**满足 **API 成功 + 落库 + 可回读一致**。**未同时满足三条 → 整轮 `release_gate` = `NO_GO`，阻断发布**；须在证据与 **`report.json` `cases[].notes`** 如实记录（**不得**用 **GO/PARTIAL_GO** 掩盖主链缺口）。

**SLA（团队可改）**：收到本说明后 **24 小时内**完成首轮 **0→1→门禁→2**、**四件套**落盘、**`validate … --fail-on-no-go`** 通过，并给出 **GO / PARTIAL_GO / NO_GO** 会签结论。

**完成定义**：未同时提供 **`report.json` 路径**、**`sha256`**、**`release_gate` / `release_gate_reason`**、**Release Owner 双签** 的，**视为未完成**；**不得进入 go-live**（**[go-live-checklist §0.3](../../docs/go-live-checklist.md)**）。

**工单用语（可复制 · 两段）**

1. **【阻断 go-live】R-003 未完成：当前仓库未发现 `evidence/r003_staging_first/run_<UTC>/` 四件套。请 @执行人 在 SLA（24 小时）内补交 `report.json` 路径、`sha256`、`release_gate`/`release_gate_reason` 与 Release Owner 双签，或书面说明无法执行原因；SLA 自本条发出并 @ 之时起算（UTC：____），到点仍未满足则自动按 NO_GO 处理并维持 go-live 阻断（go-live-checklist §0.3、evidence/r003_staging_first/README.md）。**  
2. **到点后若仍未满足，将直接在工单中标记为 NO_GO 并关闭本次发布尝试，需新开 `run_id` 重新执行 R-003。**

**工单负责人（可复制 · 一句话）**

即由 **工单负责人** 将上列 **「工单用语」两段**（及本 README 链接）发至工单并 **@执行人** 启动执行；待 **四件套** 提交后 **立刻**在仓库根执行 **`python scripts/validate-regression-report.py evidence/r003_staging_first/run_<UTC>/report.json --fail-on-no-go`**，并按 **R-003** **[#r003-ab-core-acceptance](../docs/spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md#r003-ab-core-acceptance)** **主链三条**完成 **会签决策**（**不达标即整轮 NO_GO 并持续阻断发布**；**PARTIAL_GO** 不得掩盖主链缺口）。会签后按 **[go-live-checklist §0.3](../../docs/go-live-checklist.md)** 登记 **路径 + sha256 + `release_gate`/`release_gate_reason` + 双签**。

---

本目录用于存放 **R-003** **阶段 0→1→门禁→2** 完成后产出的 **第一份真实** **`report.json`** 及侧车证据。**A+B 主链**（注册→登录→`/me`→市场→下单→订单→消息）**是否「真实跑通」**以 **[R-003 · A+B 核心链路验收标准](../docs/spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md#r003-ab-core-acceptance)**（**API + 落库 + 回读** 三条同时成立）为准。

## 约束（必读）

- **仓库内不预置「真实 staging 回归结果」**：未在 **真实 staging** 上跑完的 **`report.json`** **不得**冒充首轮结论；执行人完成流水线后，将 **`report.json`** 放入 **`run_<UTC>/`** 或团队约定的 **`evidence/GO_YYYYMMDD/`** 路径。
- **发布决策**（**GO / PARTIAL_GO / NO_GO**）以该 **`report.json`** 的 **`release_gate`** + **`release_gate_reason`** 为准，并须经 **Release Owner** 会签（**R-002 §1**）。

## 最小证据清单（首轮 R-003 · 避免「有 report 不可复核」）

**`run_<UTC>/` 下至少包含**：

```text
evidence/r003_staging_first/run_<UTC>/
  report.json
  ENV-DB-PROOF/notes.md    # DB 自证：查询/说明/可附脱敏截图
  requests/                  # 关键请求与响应（脱敏；可按用例分子目录）
  summary.md                 # 人读摘要：FAIL/BLOCKED 与 Gate 判定依据
```

**原则**：任一 **FAIL/BLOCKED** 须能被 **第三人**依据本目录材料复核（**`report.json` 的 `notes` + 上述证据**）。可另加 **`A-LOG-001/`** 等按用例子目录。

## 机读闸（跑完后必跑）

```bash
python scripts/validate-regression-report.py evidence/r003_staging_first/run_<UTC>/report.json --fail-on-no-go
```

可选登记哈希（发版工单 / PR）：

```bash
sha256sum evidence/r003_staging_first/run_<UTC>/report.json
```

## 与模板的关系

从 **[`templates/regression-report.staging.min.json`](../../templates/regression-report.staging.min.json)** 复制壳子起步；**禁止**将未填 **`cases[]`**、未改 **`release_gate_reason`** 的模板直接当作首轮结论提交为「已完成 R-003」。
