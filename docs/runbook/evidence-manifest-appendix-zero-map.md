# Evidence `manifest.json` ↔ 15 附录〇 机读对读表 + GO 根聚合清单（IMP-EV-002 / IMP-EV-003）

**Version:** 0.1.0  
**Status:** Runbook — **单屏对读**与**发版 Owner 操作顺序**；**不**替代 **[15 附录〇 · 发版前勾选总表](../spec/15-多维度文档与技术检查报告.md#发版前勾选总表)**、**[B-309 · P0↔附录〇](../spec/code-maps/15-附录〇与缺口官方总表-P0行映射-B309.md)** 正文；**不**替代 **[IMP-EV-001](./evidence-gate.md)** 机读校验实现。

**登记来源**：[next-batch-gap-remediation-implementation-plan.md](./next-batch-gap-remediation-implementation-plan.md) **IMP-EV-002**、**IMP-EV-003**；审计母本 [TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP.md](./TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP.md) **§2.2**。

**仓库路径：** `docs/runbook/evidence-manifest-appendix-zero-map.md`

---

## 1. GO 根级 `manifest.json` 键（与校验脚本一致）

| JSON 键 | 含义（一句） | 可选 |
|---------|--------------|------|
| **`gate`** | 过门名 / Gate 标签（非空字符串） | 否 |
| **`date`** | `YYYY-MM-DD` | 否 |
| **`artifacts`** | 非空数组；每项须含 **`path`**（bundle 内相对路径）、**`sha256`**（64 位小写 hex） | 否 |
| **`sign_off`** | 非空字符串数组（**工程/过门**签字语义；**不**自动等价 **08-4** 法务签字 — 见 [TT-B325 · §2.3](./TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP.md)） | 否 |
| **`manifest.sha256`**（侧车文件） | 仅对 **`manifest.json`** 字节做 `sha256`；与 **`sha256sum -c`** 可验 | 强烈建议 |
| **`dual_score`** | 若存在，须为带 **`path`** / **`sha256`** 的对象，且文件在 bundle 内 | 是 |

实现真源：**`scripts/dev/validate_evidence_manifest.py`**；合并门槛见 **[evidence-gate.md](./evidence-gate.md)**、根 **[CONTRIBUTING.md](../../CONTRIBUTING.md)** **IMP-EV-001** 段。

---

## 2. 15 附录〇 序号 → `manifest` / bundle 落点（IMP-EV-002）

**读法**：「manifest 落点」= 该项勾选结果在 **`evidence/GO_YYYYMMDD/`** 包内的**典型**落点；**无单独键** = 不映射到某一固定 JSON 顶键，仍须在发版链路与 **08-2 Evidence** 列人工闭合。

| 附录〇 序号 | 勾选项（与 15 表标题一致，摘） | `manifest` / `artifacts[]` / bundle 落点 |
|-------------|-------------------------------|-------------------------------------------|
| **1** | 00 发版前快速核对 7 项 | **无单独键**；与 **00**、**08-2** 工单人工并联 |
| **2** | 00 发版前必做清单 6 项 | 同上 |
| **3** | 07 §四 4.3 开工前/发版前检查 | 同上 |
| **4** | 08-0 §八 13 行 | 同上 |
| **5** | 08-1 工程收口（宪法+Gate） | 同上 |
| **6** | 08-2 审查一 11 行 | 同上（**08-2** 元数据；非 `sign_off` 替代） |
| **7** | 08-2 审查二 Gate 矩阵 | 同上 |
| **8** | 08-4 定稿检查 | **无固定键**；**08-4** 文末签字须与 **`manifest`** 引用版本 **对读**（见 **15** 机器预检段、**TT-B325 §2.2** 行 **8**） |
| **9** | 08-3 26 key | 同上 |
| **10** | Runbook P0 九项 | **`artifacts[]`** 常登记 **`p0-runbook-nine-items-close.md`** 等（与 **15**「机器预检留痕」段同构） |
| **11** | evidence Gate 3 项 + **GO_YYYYMMDD** | **主承载**：**`manifest.json`** 四必填键 + **`manifest.sha256`** + **`artifacts[]`** 登记预检产物（日志、E2E、rollup 等）；见 **[evidence/README](../../evidence/README.md)**（若本地无读权限则以 **go-live §10**、**Runbook §12.6** 为准） |
| **12** | 02 §十三 | **无单独键**；架构勾选与 bundle **并联** |
| **13** | 06 §6.3 DApp | **无单独键** |
| **14** | 01 §10 / 17 条 | **`artifacts[]`** 可登记 **`checklist-17`** 相关 **`*.md`/`*.txt`** 与 **sha256**（例见 **15** 机器预检段 **P1-D #5**） |
| **15** | 11 开发前准备 M0～M5 | **无单独键** |
| **16** | 14 §4 合约-API-ABI | **无单独键**（实现期质量闸） |
| **17** | 12 提交前自检 3 项 | **无单独键** |
| **18** | Runbook §10 / check-08 / CORS | **`artifacts[]`** 与 **§10** 叙事并联；与 **11** 同属 **P0 #7** 族（见 **B-309**） |
| **19** | 25 顶级 UI（可选） | **无单独键** |
| **20** | 27 P0～P14 勾选清单 | **无单独键**（流程壳）；弱对应 **P0 #9** |
| **21** | 55 阶段 §八附续.9（条件） | **无单独键**；含 55 发版时与 **55** 文档联合勾选 |
| **22** | 56 阶段 §六附续（条件） | **无单独键**；含 56 发版时与 **56** 文档联合勾选 |

**与 B-309 关系**：**P0 十二项 ↔ 附录〇** 多对多仍以 **[B-309](../spec/code-maps/15-附录〇与缺口官方总表-P0行映射-B309.md)** 为准；本表仅增 **`manifest` 字段 / `artifacts[]`** 维度，供发版与审计 **对拍**。

---

## 3. 双层 manifest：GO 根聚合前端产物（IMP-EV-003）

**问题**：**`gen-frontend-manifest`** 生成 **`frontend-build-manifest.json`**（及侧车 **`.sha256`**），与 **`evidence/GO_YYYYMMDD/manifest.json`**（**GO 根 bundle**）是**两层**；须把前端产物**登记进 GO 根** **`artifacts[]`** 并统一 **`manifest.sha256`**。

**有序清单**（发版 Owner；与 **[ops/RUNBOOK · §12.6 A](../../ops/RUNBOOK.md)**、**[scripts/README · gen-frontend-manifest](../../scripts/README.md)** 同序）：

1. **准备目录**：`evidence/GO_YYYYMMDD/`（可由 **`evidence/GO_YYYYMMDD_template`** 复制）；确保存在 **`artifacts/`** 子目录。  
2. **前端构建**：`cd frontend && npm run build`。  
3. **生成前端 manifest**：在仓库根执行 **`./scripts/gen-frontend-manifest.sh`** 或 **`.\scripts\gen-frontend-manifest.ps1`**；若需直接写入 GO 目录，设 **`EVIDENCE_GO_DIR=evidence/GO_YYYYMMDD`**（PowerShell：`$env:EVIDENCE_GO_DIR='evidence/GO_YYYYMMDD'`）→ 将 **`frontend-build-manifest.json`**（及 **`.sha256`**）拷入该路径（与 **Runbook** 描述一致）。  
4. **聚合其它产物**：将 **`pre-release`** 日志、**E2E** **`artifacts/e2e-*.md`**、索引器 JSON 等放入 **`evidence/GO_YYYYMMDD/artifacts/`**（路径均相对 GO 根）。  
5. **编辑 GO 根 `manifest.json`**：为 **每个** 须过门的文件在 **`artifacts[]`** 增加 **`{ "path": "…", "sha256": "…" }`**（`path` 相对 GO 根；**`sha256`** 须与 **`sha256sum`** 一致、**小写 hex**）。**不得**只改 hash 不交文件。  
6. **侧车**：在 **`evidence/GO_YYYYMMDD/`** 执行 **`sha256sum manifest.json > manifest.sha256`**（或平台等价命令）。  
7. **机读自检**：`python3 scripts/dev/validate_evidence_manifest.py validate evidence/GO_YYYYMMDD --emit-summary --verify-artifact-files`（与 **[evidence-gate.md §3](./evidence-gate.md)** 一致）。

**说明**：**`pre-release-automation.sh`** **不替代** 第 2～3 步；**GO 根 `manifest.json`** 的 **`gate`/`date`/`sign_off`** 仍以当次过门语义填实，**不要**与前端子 manifest 的 **`gate`** 字符串混为单源（字段分层见 **Runbook §12.6** 缺口总表 **P1-C** 互证段）。

---

## 4. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-05-01 | 首版：**IMP-EV-002** 对读表 + **IMP-EV-003** 有序清单。 |
