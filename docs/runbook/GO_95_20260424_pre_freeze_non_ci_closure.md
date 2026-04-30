# Pre-Freeze Non-CI Closure — 冻结审计编排（95 · §12.4）

**模式**：**Pre-Freeze Non-CI Closure**（不依赖 GitHub Actions `e2e` runner；**禁止**将仓库内 **`PARTIAL_GO`** 的 **`report.json`** 当作 **§9·ISS-007** 主行闭证）。

**登记日期**：2026-04-24  
**95 Version**：**v1.4.306**（本 Runbook 同路径增补 **Freeze Declaration**；矩阵基线 **v1.4.305** 起算不变）  

---

## Freeze Declaration · Baseline Lock（v1.4.306）

**逻辑冻结基线 ID**：**`baseline-95-full-complete-pre-ci`** — 与 **git tag** 无强制同名；**物理锚**仍以 **§1 · commit SHA** 为准，**Release** 可另打 **`baseline-*` / SemVer** tag。

**冻结前矩阵真值（承 v1.4.305）**

- **§3 / §3.1 / §8.2 / §10**：**100%** 叙事口径内已完成（见 **95 §0.2** 四分项）。
- **§7 / §11**：**无**游离未收敛项（**§7.7** 未勾行 **并入 ISS-009**；**§11.2 umbrella** 为周期任务，**不归并** **ISS-007/008/009**）。
- **§9**：**仅** **ISS-007** / **ISS-008** / **ISS-009** 三行 **`- [ ]]`** 保留。

**冻结语义（ISS 分层）**

1. **ISS-007**  
   - **原因**：GitHub Actions **Billing / spending limit** → **`e2e` runner 未执行**。  
   - **影响**：**无** **`conclusion=success`** 的 **`build.yml`·`e2e` `run_id`**（及/或 **staging 全矩阵 `report.json` PASS** 主闭证）。  
   - **性质**：**外部系统阻塞**（**非**仓库内业务逻辑缺陷）。

2. **ISS-008**  
   - **状态**：**降级为外部运维风险**（对象存储 / CORS / 密钥 / 生产桶 / **[270](../spec/270-阶段文件媒体证据存储系统.md)** 人签等）。  
   - **范围**：**不**阻断本地与测试环境闭环（MinIO opt-in、契约测已登记）。

3. **ISS-009**  
   - **状态**：**降级为架构 / 部署决策风险**（多实例、**`SCHEDULE_SLOTS_PATH`**、**`schedule_engine`** 文件锁语义）。  
   - **范围**：**当前单 API 实例**编排下**可运行**；多副本须另择 **(A)/(B)/(C)** 并登记 Runbook。

**就绪结论（对外口径）**

| 维度 | 状态 |
|------|------|
| **Functional Completeness** | **满足**（**F-001～033** 矩阵内 **READY*** 与 **§3/§8.2** 对读）。 |
| **Test Completeness**（本地 / 窄切片 / 契约） | **满足**至 **Pre-CI** 文档登记边界；**全矩阵 CI `e2e`** **未跑通**（**ISS-007**）。 |
| **Documentation Completeness** | **满足**（**§12.4** + 本 Runbook + **95/00** 台账）。 |
| **Release Evidence Completeness** | **不满足** — **缺** **CI `e2e` success `run_id`** **或** **staging 全矩阵 `report.json` PASS**。 |

**产品态命名**：**RC-READY（Release Candidate Ready）** — **GO 条件**：**关闭 ISS-007**（Billing 恢复 → **Build → `e2e` 成功** → 登记 **`run_id`** → **最终 Release Gate**）。**RC-READY ≠ GO**。

**执行限制（流程 / 分支策略 — 文档登记）**

- **`main`**：**冻结**语义下 **禁止**合入**新增功能**与**已完成 F-001～F-033 业务面**的非必要修改；**修补**须走 **评审** 并限于 **ISS-007/008/009** 闭证、安全、或 **Release Gate** 明确要求之变更。  
- **新开发**：**默认** **`feature/*`** 分支；**合回 `main`** 须在 **ISS-007** 主闭证策略与 **Release** 节奏下执行。

**解锁检查清单**

1. GitHub **Billing / quota** 恢复。  
2. **`build.yml`** → **`e2e`** **`conclusion=success`**，登记 **`run_id`**（**或** **staging** 全矩阵 **`report.json` PASS** 与 **§0.2** 证据格一致）。  
3. **§9·ISS-007** 主行 **`[x]`**。  
4. **最终 Release Gate**（**go-live-checklist** / **缺口 P0** / **Owner 会签** 按组织流程）。

---

## 0. Pre-Freeze 归类（与「仅保留 ISS-007·Billing-Gated」对读）

- **依赖 GitHub CI / Billing 的唯一条目**：**§9·ISS-007**（**`e2e` `run_id`** 或 **staging 全矩阵 `report.json`**）。
- **ISS-008 / ISS-009**：**不**属 Billing/CI 阻塞；**Pre-Freeze 口径下已明确降级为「外部运维 / 架构与编排风险」** — 代码与文档侧可本地闭环项**已收敛**；**§9 主行仍 `- [ ]]`** 仅表示 **「运维签收 / 方案落地前持续跟踪」**，**不**再视为仓库内可继续用纯本地开发关闭的同一类缺口。
- **§11.2 umbrella**、**§12 主批次**：属**过程审计**，**不归入** **ISS-007/008/009**。

## 1. baseline tag / commit 锚

| 项 | 值 |
|----|-----|
| **逻辑冻结基线 ID** | **`baseline-95-full-complete-pre-ci`**（**v1.4.306** 登记；**≠** 必须等于 git tag 名） |
| **baseline tag** | *待发版由 Release 打 tag；在 tag 落地前以 **commit SHA** 为物理冻结锚。* |
| **worktree HEAD（登记时）** | `58b0b4d0a0e50a2ad470af7e79815c974b64f1d2` |

## 2. ISS-007（Billing-Gated CI — **主行不闭**）

- **原因**：GitHub **Billing / Actions spending limit** → **runner 未起**；**`build.yml`·`e2e`** 无 **`conclusion=success`** 的 **`run_id`**。
- **闭证仍须**：**CI `e2e` 成功 `run_id`** **或** **staging 全矩阵 `report.json` PASS**（与 **95 §9·ISS-007** 正文一致）。
- **本地 R-002 窄切片**：**不**替代上列主闭证；见下节。

## 3. 本地 R-002 · ISS-007 窄切片 — **43 anchors**

- **生成器**：`scripts/gen-r002-iss007-prereport.py`（**`ANCHORS` 元组长度 = 43**；**v1.4.303** 起）。
- **本地校验链**：`scripts/gates/local-verify-r002-prereport-chain.sh`（**期望 `summary.PASS == 43`**；须 **`DATABASE_URL`** + **`P3_CHAIN_OFF=1`** 等脚本前置）。
- **说明**：窄切片 **PARTIAL_GO** 仅收窄 **ISS-007** 子面不确定度；**§9·ISS-007** **`- [ ]`** **不变**。

## 4. ISS-008（F-007 · 对象存储运维残余）— **最终状态：仍开放 · P4**

- **代码侧已闭环**：`A-AVA-001` / `A-AVA-002`（**MinIO opt-in** **`presign→PUT→commit`**）、`me_profile_avatar_http_contract_tests` 负例；见 **95 §9·ISS-008** 历史进展句。
- **文档 / 配置侧本轮互证**：根 **`.env.example`**（**`PROFILE_AVATAR_*` / `AWS_*` / 本机回退**）↔ **`docs/runbook/PROFILE-AVATAR-OBJECT-STORAGE.md`**（**CORS / 桶策略 / 密钥 / 生命周期 / MinIO IT**）↔ **`ops/RUNBOOK.md` §2.5** 运维交叉引用（**v1.4.305** 起）。
- **仍属运维终验（不闭主行）**：生产桶 **浏览器直传 CORS**、**CDN 公网前缀**、**密钥轮换**、**[270](../spec/270-阶段文件媒体证据存储系统.md)** 人签等 — **§9·ISS-008** **`- [ ]`** **直至**上列之一按组织流程签收或显式风险接受单。

## 5. ISS-009（多实例 / 档期 SSOT）— **最终状态：仍开放 · P4**

- **工程真值**：**§7.7**「多实例内存 SSOT」**唯一未勾行**（**U=44/45**）；**`SCHEDULE_SLOTS_PATH`** = 单机文件持久化 + **`schedule_engine`** 进程内锁；**不**等价多副本分布式一致。
- **文档 / 运维互证**：**`ops/RUNBOOK.md` §2.5**（档期/Hydrate）↔ **95 §7.7** / **§9·ISS-009** 闭证条件（共享卷 **或** PG **或** 分布式锁 + 证据）。
- **本地双实例**：仓库内**无**强制双进程竞态 **API·IT** 闭证；历史旁证 **`evidence/GO_95_20260422_section7_7_multinstance_ssot_reaudit/README.md`**（**不**证双实例）。
- **§9·ISS-009** **`- [ ]`** **直至**架构/编排择 **(A)/(B)/(C)** 之一落地并登记 Runbook。

## 6. §7 / §11 本轮结论（无游离能力）

- **§7**：**V=45**，**U=44** — 唯一 **`[ ]]`** = **§7.7 · 多实例内存 SSOT**（已并入 **ISS-009** 叙事，**无**游离未勾项）。
- **§11.1**：卫星行 **全 `[x]`**（已并入 **§3/§8.2** 或明确边界）；**无**新增游离 API。
- **§11.2**：**umbrella**「全量 spec 对拍」仍为 **`- [ ]`**（周期性 **§10.1** 任务；**不归并 ISS-007/008/009**）。

## 7. baseline tag / 00 台账

- **逻辑冻结基线 ID**：**`baseline-95-full-complete-pre-ci`** — 见 **§Freeze Declaration**；**git tag** 仍 *待 Release*。
- **00 台账**：**v1.4.306** **台账同批** 更新 **95** 行摘要（见 **95 §6**）；**v1.4.305** 行保留 **Pre-Freeze** 技术登记。
