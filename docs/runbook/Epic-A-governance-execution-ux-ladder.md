# Epic A：治理执行 UX — 收口稿（A-01～A-10）

**策略定位**：在已有 **`/governance/proposals`** 与 **`/governance/proposals/[id]`** 上，强化**执行态只读可读性**、**来源标识（链上 SSOT / 投影）**、**Timelock 与 Queued 限制说明**、**列表↔详情叙事连续**，**不**引入钱包发交易、**不**伪造状态。

**硬约束（全程遵守）**

- **不新增** `GET /api/v1/*` 路由；**不修改** `crates/api` 业务语义与已登记契约。
- **不修改** **B-115 / B-116 / P5** 封口代码路径（含 fee-pool / country-ledger / distribution-claim 等专项与对应前端深改）。
- 前端为主；复用既有 **`GET …/governance/proposal-status/:id`** 与 **`GET …/governance/proposals/:id`** 已有字段。

**刻意保留边界（未单独立「Epic A2 / 执行交互」前禁止突破）**

- **无时间维度**：页内 **无 Timelock ETA、无可执行块高 SSOT**；**`readiness` 分桶 ≠ 链上此刻一定可成功 `execute`**。  
- **Execute 区仅 skeleton**：可点占位 **不** 接钱包、**不** 组装广播交易。  
- **推荐下一层只读叙事**：**Epic C**（Admin **`cross-check` / `drift-summary`** UI）见 **[Epic-C-admin-cross-check-drift-ui-ladder.md](./Epic-C-admin-cross-check-drift-ui-ladder.md)**；与 **Epic A2**（钱包、真实执行、ETA 等）**正交**，勿混做。

**与初版 10-Task 稿的差异（存档说明）**

- 初版 ladder 中部分 Task（如详情再拉 `proposal-status`、calldata **复制**钮、区块浏览器外链、投票权 JSON 折叠等）**未按原字面落地**；实际交付以**下表「已交付」**为准。若后续要补初版项，**单开 Epic / TT**，勿与本收口混读。

---

## 已交付（A-01～A-09）

| 段 | 摘要 |
|----|------|
| **A-01** | `getGovernanceProposalStatus` 统一客户端；非 2xx / 缺字段 → `null`，列表批量并行不打断。 |
| **A-02** | `GovernanceProposalExecStatusBadge`：药丸态 + 链上/投影来源 + 只读脚注。 |
| **A-03** | 列表行透传 `data_source` / `note`；链上 SSOT 与投影徽标二选一、无「无来源」态。 |
| **A-04** | 详情 `GovernancePreExecutionHint` 前移区块 + Timelock / 阶段说明；仅文案。 |
| **A-05** | `deriveGovernanceExecutionReadiness` + 面板 + 投票区脚注；按钮仍只读。 |
| **A-06** | `deriveExecutionActionSurface` + Timelock **Queue / Execute** 骨架钮（可点占位无广播）。 |
| **A-07** | 执行区 **Queued ≠ 可成功 execute**、**无页内 ETA/块高** 风险说明。 |
| **A-08** | `GovExecReadOnlyI18n` + `governance_exec_shared_*` 键；列表与详情共用 Queued/只读/骨架口径。 |
| **A-09** | 列表桥接文案 + 提案链 `title` / `aria-describedby`；详情承接段（`gov-exec-detail-bridge`）。 |

**关键前端文件（索引）**

- `frontend/lib/apiClient/governance.ts`（`getGovernanceProposalStatus`）
- `frontend/lib/governanceExecutionReadiness.ts`、`frontend/lib/governanceExecReadOnlyNarrative.ts`
- `frontend/components/governance/GovernanceProposalExecStatusBadge.tsx`
- `frontend/components/governance/GovernancePreExecutionHint.tsx`
- `frontend/components/governance/GovernanceProposalExecutionReadinessPanel.tsx`
- `frontend/components/governance/GovernanceProposalExecutionActionsSkeleton.tsx`
- `frontend/app/governance/proposals/page.tsx`、`frontend/app/governance/proposals/[id]/page.tsx`
- 契约/单测：`*.contract.test.ts`、`governance.proposal-status.test.ts` 等

---

## A-10 — 收口（本稿）

- 本文件勾选、母表登记、evidence 指针、`frontend/README.md` 验收命令。
- **排除项**：任何 **B-115 / B-116 / P5** 目录与契约内已封口模块的**行为或 API 形状**变更；任何**新增** governance/admin **GET** 路由（否则须走 [ai-template-read-only-api.md](./ai-template-read-only-api.md)）。

---

## 前端验收命令（Epic A 建议一键串）

在仓库 **`frontend/`** 下执行（**不**默认 `npm test -- --run` 全量，与仓库惯例一致）：

```bash
cd frontend
npm run test:i18n:ci
npm test -- --run governance.proposal-status
npm test -- --run GovernanceProposalExecStatusBadge
npm test -- --run governanceProposalsPage.contract
npm test -- --run governanceExecutionReadiness
npm test -- --run GovernanceProposalExecutionReadinessPanel
npm test -- --run GovernanceProposalExecutionActionsSkeleton
npm test -- --run governanceExecReadOnlyNarrative
npm test -- --run governanceProposalDetailPage.contract
npm test -- --run GovernancePreExecutionHint.contract
```

合入前质量（可选加严）：

```bash
cd frontend && npm run lint && npx tsc --noEmit
```

**未触** `READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS` 新增登记（本 Epic **未**新增 GET 路由）。

---

## Epic A 完成清单（A-10 勾选）

- [x] A-01～A-09 交付项已合入（见上表）
- [x] A-10：文档 / 母表 / evidence / README 收口
- [x] 未修改 **B-115 / B-116 / P5** 封口代码路径（Epic 约束内）
- [x] 未新增 **`/api/v1/governance/*` / `/api/v1/admin/*` GET**

**母表**：`docs/任务母表.md`（Epic-A 行）。**Evidence**：`evidence/GO_EPIC_A_GOVERNANCE_EXEC_UX_CLOSE.md`。

---

## 纯文档 / README 收口小习惯（非系统）

- 相对链接在预览里能否点开；**README 宣称的入口**是否指向真实路径。
- 是否引用了**不存在的文件名**（含大小写与 `.md` 后缀）。
