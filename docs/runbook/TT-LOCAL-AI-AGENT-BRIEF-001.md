# TT-LOCAL-AI-AGENT-BRIEF-001 · 给 AI 的「① 本地全收敛」执行术语与硬约束

**Version:** 0.1.1  
**Status:** **可复制进任务卡 / 系统提示**；与 **[TT-LOCAL-CONVERGENCE-PHASE-AD-001](TT-LOCAL-CONVERGENCE-PHASE-AD-001.md)** **同轮执行**；**不**替代 **[CONTRIBUTING](../../CONTRIBUTING.md)**、**[AGENTS.md](../../AGENTS.md)**。  
**仓库路径：** `docs/runbook/TT-LOCAL-AI-AGENT-BRIEF-001.md`

---

## 0. 本页用途

把 **「先把本地按仓库纪律跑通」** 写成 **AI 可机读的专业句式**：**术语表** + **执行顺序** + **禁止项** + **产出**。人类 Owner 仍须对 **②③** 与 **P0 十二项** 签字表负责。

---

## 1. 术语表（中英 / 仓库专名）

| 术语 | 含义 / 用法 |
|------|----------------|
| **① 本地 / ② 测试网 / ③ 生产** | **验收阶次**（**须顺序**；**禁止跳阶**）。**①** = 本机/Docker、`cargo test`、Vitest、可选本机 E2E；**②** = 测试库、**Stripe test**、staging 回调；**③** = 生产 PSP、公网 webhook、主网、**Production GO**。 |
| **Phase A→D（96-20）** | **A** 后端契约（**04 §3.4** ↔ `crates/api`）；**B** DB/迁移/`sqlx`；**C** 链 / **`chain_off`** / **`GET /meta`**；**D** 前端页与 API 对齐（**96-20 §0.2 PASS**）。**A～C 未闭** 时 **D** 只能 **BLOCKED / N/A**。 |
| **机读绿 / 本地收敛** | 脚本 **`exit 0`**：**`cargo test -p traveltrust-api`**、**`bash scripts/run-check-04-routes.sh`**、按需 **`forge test`**、**`bash scripts/check-55-s13.sh`**、前端 **`npx tsc --noEmit`** + **`npm run test`** + **`npm run lint`** 等（**全文命令表**见 **TT-LOCAL-CONVERGENCE §3**）。 |
| **懒人一键（§3.0）** | **`bash scripts/dev-preflight.sh`** 和/或 **`bash scripts/gates/ci-local-delivery-minimum.sh`**；**AI 索引有 diff 时** **`unset SKIP_AI_TASK_CARD_INDEX_OVERVIEW CI_LOCAL_SKIP_AI_TASK_CARD_INDEX`**。 |
| **Handbook 机读（范围触发）** | 触达 **`docs/handbook/`** 时：**`check-handbook-frontmatter.sh`**；触达 **`docs/handbook/engineering/`**（**EVIDENCE-*** 等）时：**`check-handbook-engineering-content.sh`**。 |
| **`chain_off` / `chain_off_unavailable`** | 链下业务栈挂载；未挂载时写路径常 **503** 与 JSON **`chain_off_unavailable`** — **先 Phase C** 再要求用户路径全通。 |
| **`not_implemented` / `not_impl_json`** | **04 §三** 允许占位或未接线；**≠**「旧 API」；与 **501** 区分。 |
| **真数据口径（§3.24.3）** | 用户主路径 **默认 API + PG + 投影**；**mock 列表/写死统计** 不得冒充已接 API；**`P3_CHAIN_OFF` + mock-pay** 仅 **调试辅助**。 |
| **缺口索引（§3.25）** | **用户感受 · 数据互通** 五类速查（链/钱/页面/跨系统/扩展）；**细节真源** 仍打开 **96-18-未完成**、**96-20**、**缺口官方总表**。 |
| **禁止假完成** | **① 机读绿**、**窄切片 `report.json`**、**文档勾选** **不得** 冒充 **② staging 全矩阵** 或 **③ 生产** — **CONTRIBUTING#no-false-completion**、**TT-9628 §0.0.5**。 |
| **ISS-007 / `PARTIAL_GO`** | **`local-verify-r002-prereport-chain.sh`** 产物 **`release_gate` 常为 `PARTIAL_GO`**；**勿**对本品单独 **`--require-go`** 当 staging **GO**。 |
| **完成即标记（TT-9627 §0.c）** | 某判据 **PASS** 时须留 **日期 + commit + 命令 + `evidence/GO_YYYYMMDD/…`**。 |

---

## 2. 给 AI 的「标准任务句」（可直接粘贴）

> 你是本仓库开发代理。**阶次**：本轮只做 **① 本地**，**禁止**宣称 **②③** 已验收。  
> **必读执行单**：[TT-LOCAL-CONVERGENCE-PHASE-AD-001](TT-LOCAL-CONVERGENCE-PHASE-AD-001.md) **§3.0～§3.25**、**§4**；术语与硬约束：[TT-LOCAL-AI-AGENT-BRIEF-001](TT-LOCAL-AI-AGENT-BRIEF-001.md)。  
> **执行顺序**：  
> 1. 若环境未声明：确认 **Docker Postgres**、**`DATABASE_URL`**、**`PORT` / `NEXT_PUBLIC_API_BASE_URL`**（**`scripts/dev/sync-frontend-env-local-from-root.sh`**）。  
> 2. **§3.0（A）**：`bash scripts/dev-preflight.sh` **或** `unset SKIP_AI_*` 后 `bash scripts/gates/ci-local-delivery-minimum.sh`（按本轮 scope 二选一或先后）。  
> 3. **§3.1～§3.4**：`cargo test -p traveltrust-api`、`bash scripts/run-check-04-routes.sh`、`bash scripts/check-runbook-golive-doclink-gate.sh`；若动 **spec 路径依赖** 则 `python registry/validate-spec-path-dependencies-registry.py`。  
> 4. **触达合约/ABI**：`cd contracts && forge test`；`bash scripts/check-55-s13.sh`。  
> 5. **前端**：`cd frontend && npx tsc --noEmit && npm run lint && npm run test`；按需 `npm run build`。  
> 6. **触达 PG/准入费/段闸**：按 **TT-LOCAL §3.5～§3.8** 与 **`DATABASE_URL`**；**勿**设 **`SKIP_AI_*`** 除非用户显式写明理由。  
> 7. **触达 handbook**：跑 **§3.0（B）** 两脚本。  
> 8. **用户路径与缺口自检（文档级）**：读完 **§3.24～§3.25**，在回复中说明 **是否仍属 Phase C BLOCKED**、**有无 mock 主路径风险**；**不**改 spec 正文除非用户写明「台账同批」。  
> **禁止**：跳阶宣称、用 **①** 冒充 **②③**、盲设 **`SKIP_AI_*`**、无证据宣称 **GO**。  
> **产出**：列出已跑命令与 **`exit 0`**；失败贴 **首条 stderr**；若 PASS 新判据，建议 **`evidence/GO_YYYYMMDD/README.md`** 一行路径。

### 2.1 **Owner 可复制口令（你怎么跟 AI 说）**

**极简（一条）：**

> 按仓库 **`docs/runbook/TT-LOCAL-AI-AGENT-BRIEF-001.md`** 做 **① 本地全收敛**：先读该文件 **§2 标准任务句** 并照做；命令细节打开 **`TT-LOCAL-CONVERGENCE-PHASE-AD-001.md` §3～§4**；**禁止跳阶**、**禁止假完成**、**不要设 `SKIP_AI_*`**（除非我本条写明）。

**标准（推荐，开新对话第一条）：**

> 本轮只做 **① 本地**。请你：  
> 1）打开并遵守 **`docs/runbook/TT-LOCAL-AI-AGENT-BRIEF-001.md`**（术语 + **§2** 整段任务句）；  
> 2）按 **`docs/runbook/TT-LOCAL-CONVERGENCE-PHASE-AD-001.md` §3.0～§3.25** 跑命令，**§4** 作 UI/数据排查参考；  
> 3）**unset** `SKIP_AI_TASK_CARD_INDEX_OVERVIEW` **与** `CI_LOCAL_SKIP_AI_TASK_CARD_INDEX`（除非我写明跳过理由）；  
> 4）回复里列出 **已执行命令 + exit 码**；失败给 **第一条可行动错误**；**不要**用 **①** 冒充 **② 测试网** 或 **③ 生产**。

**带范围（你改了某块时）：**

> 在 **「标准」口令** 基础上加一句：**本轮 git diff 主要触及 `___`（路径或模块）**，请按 **TT-LOCAL-CONVERGENCE §3.17** 裁剪：与 diff **无关** 的重闸可说明 **skipped + 理由**；**handbook / spec 路径依赖 / 合约 ABI** 若触达则 **不得** 跳过对应脚本。

---

## 3. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-05-01 | 首版：术语表 + 可复制任务句 + 互指 **TT-LOCAL-CONVERGENCE** |
| 0.1.1 | 2026-05-01 | **§2.1**：**Owner 可复制口令**（极简 / 标准 / 带范围） |

---

**文档结束**
