# GO_95 — §7.8 代码结构（对拍 · 2026-04-22）

**95**：`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` **§7.8**  
**环境**：Git Bash；仓库根计行。

## §1 超长 `handler` / `route`（>`800` 行）— **§7.8 本条 `[x]`（清册 + 48 §14.5 计划落款 · v1.4.104）**

**排除**（本清册）：`**/tests/**`、**`*_tests.rs`** 专测大文件；**不**从「是否应拆」中免除 **`admin/mod.rs` 等生产路径** 的风险叙述。

**机读**（`find … ! -path '*/tests/*' ! -name '*_tests.rs'`，`wc -l`，降序 **Top 12**）：

| 行数 | 路径 |
|------|------|
| 9785 | `crates/api/src/routes/admin/mod.rs` |
| 1602 | `crates/api/src/routes/governance/mod.rs` |
| 1427 | `crates/api/src/routes/governance_voting_power.rs` |
| 1315 | `crates/api/src/routes/internal/reconcile/indexer_reconcile.rs` |
| 1294 | `crates/api/src/routes/governance_proposals.rs` |
| 1261 | `crates/api/src/routes/investor_distribution.rs` |
| 1226 | `crates/api/src/routes/community/posts.rs` |
| 1159 | `crates/api/src/routes/health_meta/handlers.rs` |
| 1074 | `crates/api/src/routes/internal/indexer/tick.rs` |
| 1020 | `crates/api/src/routes/health_meta/meta_contract_keys.rs` |
| 1003 | `crates/api/src/routes/me.rs` |
| 995 | `crates/api/src/routes/did_rank.rs` |

**对读**：[48-后端模块化拆分与落地清单](../../docs/spec/48-后端模块化拆分与落地清单.md) **§14.5**（**P0～P2 拆分里程碑**；**纠 §14.1～14.2** 与本文机读一致）、**95 §12.2·C-1**；**不**在本文代替 **各阶段 PR 执行后** 的 **`wc -l`** 重数与 **§12.4** 登记。

## §2 JSON 形状与 **04** 契约测试 — **本条 `[x]`（狭义：机读+契约子集测）**

- **`read_contract_route_guard.rs`**：登记路径与 `GET` smoke 扫描。  
- **`governance_read_contract_contract_tests.rs`** / **`admin_read_contract_contract_tests.rs`**：只读成功体/占位形状与 `SourceKind` 等断言。  
- **`health_meta/meta_contract_keys.rs`**：与 `GET /meta` 等键契约相关。  
- 合并前路由：**`bash scripts/run-check-04-routes.sh` exit 0**（**04 §3.4** 窗 vs `api_router`）。  
- **§7.3 旁证**：`evidence/GO_95_20260421_section7_3_api_ts_vs_04/README.md`、`check-04-api-ts-routes-vs-doc-34.py`。

**边界（必须读）**：**不**表示全部 **`POST/PUT` body** 与 **04** 文内示例 **逐字段人审** 已毕；**§8.2** 行级 **`[ ]`**、**93** 全站仍独立。

**命令**：

```bash
cargo test -p traveltrust-api read_contract
bash scripts/run-check-04-routes.sh
```

（本轮 **13** `read_contract` 过滤测 **passed**；以本地/CI 全输出为准。）

## §3 超长 `page.tsx`（>`500` 行）— **§7.8 本条 `[x]`（机读 Top + 43 §2.7 计划落款 · v1.4.105）**

`find frontend/app -name 'page.tsx' -type f -exec wc -l {} + | sort -n` **尾部**（**>**500**；**2026-04-22**）：

| 行数 | 路径 |
|------|------|
| 992 | `frontend/app/admin/indexer/reconcile-reports/page.tsx` |
| 963 | `frontend/app/community/user/[id]/page.tsx` |
| 954 | `frontend/app/orders/page.tsx` |
| 953 | `frontend/app/community/friends/page.tsx` |
| 832 | `frontend/app/admin/community/reports/page.tsx` |
| 798 | `frontend/app/community/feedback/page.tsx` |
| 711 | `frontend/app/pay/page.tsx` |
| 701 | `frontend/app/admin/flags/page.tsx` |

**对读**：[43-阶段-前端UI模块化拆解与最佳实践](../../docs/spec/43-阶段-前端UI模块化拆解与最佳实践.md) **§2.7**（**P0～P2 里程碑**）、**95 §12.2·C-4**；**不**以本表替代 **C-4 主批次** 或 **各页已 ≤500 行** 终局验收。

## §4 与 95 **§7.8** 勾选

| 行 | 结果 |
|----|------|
| 拆分计划 `>800` | **`[x]`**（§1 + **[48 §14.5](../../docs/spec/48-后端模块化拆分与落地清单.md)**） |
| JSON·04 契约测试 | **`[x]`**（§2） |
| `page.tsx` `>500` 拆 | **`[x]`**（§3 + **[43 §2.7](../../docs/spec/43-阶段-前端UI模块化拆解与最佳实践.md)**） |

**U / C / 总 %（以 95 §0.2 现行真值为准）**：本证据包 **§4** 表仅作 **§7.8 子节** 旁证；**v1.4.105** 起 **§7.8** **3/3 `[x]`** 时请以 **`docs/spec/95-…md` §0.2** 的 **U/C/总完成度 %** 为准（**机读扇面 ≠ 闭证**，见 **95 §8.1**）。
