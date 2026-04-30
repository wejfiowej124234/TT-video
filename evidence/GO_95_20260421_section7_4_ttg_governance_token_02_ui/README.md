# GO_95 · §7.4 · **治理币 TTG（若部署）· governance-token/02 · `/governance` UI** · 2026-04-21

## 口径（SSOT）

- **[governance-token/02-对内技术规格-草案.md](../../docs/spec/governance-token/02-对内技术规格-草案.md)**（**v0.1.13-draft**）：**§1.3** 本地链优先与上真实链门槛；**§2.5** TTG 供应 100% 分解占位（与 **84 §1.5** 互链）；**§3.2** 后端 **`crates/api/src/routes/governance/`**；**§3.3** 前端 **`frontend/app/governance/`** 与 **[13-1](../../docs/spec/13-1-UI产品级SSOT与页面规范.md)** **表 2、表 2-续**；**§4.1～§4.3** To-Be（**ERC20Votes / Governor / Timelock**、索引、API 演进）。
- **[82-治理币-文档总览.md](../../docs/spec/82-治理币-文档总览.md)**、**[89-治理UI-全球旅游市场治理控制台设计规格.md](../../docs/spec/89-治理UI-全球旅游市场治理控制台设计规格.md)** 读前对读（产品 IA vs 实现面）。

## 工程真值（文档 ↔ API ↔ UI）

| 主题 | 位置 |
|------|------|
| **Governance 子路由聚合** | **`crates/api/src/routes/governance/router.rs`**（**pool/rewards**；**merge** **proposals** / **investor_distribution** / **delegate** / **voting_power** / **country_ledger**；**fee-routes** / **vault-forwards** / **fee-pool-aggregates** / **protocol-reference** / **params**） |
| **84 文档镜像与版本锁** | **`crates/api/src/routes/governance_doc_reference.rs`**（**`DOC_VERSION`** ↔ **84** 文首；**`check-governance-doc-linkage.sh`** 断言） |
| **治理 UI 页面树** | **`frontend/app/governance/**`**（**proposals**、**delegate**、**distribution-***、**fee-routes**、**vault-forwards**、**params** 等） |
| **B-432 治理闭环 UI 面** | **`scripts/gates/check-b432-governance-ui-ssot-surface.py`**（**`run-check-04-routes.sh`** 末步） |

## 命令结果（仓库根 / `frontend`）

```bash
bash scripts/check-governance-doc-linkage.sh
```

- **结果**：**exit 0**（**governance-token/02** 等存在；**84** ↔ **`governance_doc_reference::DOC_VERSION`** 同号）。

```bash
cargo test -p traveltrust-api governance_doc_reference::
```

- **结果**：**7 passed**。

```bash
cd frontend && npx vitest run governance --reporter=dot
```

- **结果**：**18** test files，**66** tests **passed**（**`app/governance/*`**、**`components/governance/*`**、**`lib/governance*`**、**`lib/apiClient/governance.proposal-status.test.ts`** 等）。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（含 **`check-b432-governance-ui-ssot-surface.py` OK**）。

## 边界

- **不**替代 **主网 TTG** 部署与 **浏览器字节码** 终验；**不**替代 **Governor / Timelock** **`queue→execute`** 生产级全链验收（见 **02 §1.3**、**B-407/B-408** 任务母表）。
- **不**替代 **LEGAL-SIGNOFF** 与对外白皮书定稿；机读绿 **≠** **95 §0.1.1** 所述 **P0 已闭** 或 **资金域终验**。
