# GO_95 · §11.1 · 辖区 / 司法账本 HTTP（旁证 · 2026-04-22）

## §1 双路由真值（禁止混读）

| 面 | 挂载 | HTTP | SSOT / 语义 |
|----|------|------|----------------|
| **B-1 · 模板命中** | **`api_router()`** **`.merge(country_ledger_jurisdiction::router())`**（**`routes/mod.rs`**，序位见 **59·B1** / **07 §零 0.6** / **§12.3** **域 17**） | **`GET /api/v1/country-ledger/:jurisdiction`** | **仅** **`JURISDICTION_COUNTRY_LEDGER_CONFIG_PATH`** 模板 **`entries[]`** 命中 → **`200`** 体 **仅** **`jurisdiction`** + **`data_source`=`chain_ssot`**；**不**读 **`ChainConfig`**、**不**读 **`p5_country_ledger_lines`**（**04** **§3.4** 表行；**`country_ledger_jurisdiction.rs`** 头注释）。 |
| **P5-1-C · 链上 view** | **`governance::router()`** **`.merge(governance_country_ledger::router())`**（**`routes/governance/router.rs`**） | **`GET /api/v1/governance/country-ledger/:jurisdiction`** | **`rule_version`=`country_ledger_ssot_v0`**；**`eth_call`** 与 **`COUNTRY_POOL_LEDGER_ADDRESS`** / **`COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS`** 分键；根级 **B-110 禁键** 由 **`country_ledger_response_has_forbidden_b110_root_key`** 守卫（**`governance_country_ledger.rs`**；**[P5-1](../../docs/spec/P5-1-逐国链上账本SSOT-一国辖区端到端.md)**、**04 §3.4**）。 |

## §2 与 **P5-1** / **域 J** / **governance_country_ledger**

- **P5-1** 台账封口 **C** 条对应 **governance** 路径（**非** **`/api/v1/country-ledger/*`** 模板面）；互证 **`../../evidence/GO_P5_1_CLOSE.md`**、**`../../docs/spec/P5-1-逐国链上账本SSOT-一国辖区端到端.md`**。
- **域 J**（**`/governance/*` UI**）消费 **`/api/v1/governance/*`** 族；**`GET …/governance/country-ledger/…`** 与 **fee-routes**/**vault-forwards** 同属 **治理只读面**，仍受 **§8.2**/**93·C**/**83/84 Target** 人验边界约束（**不**因本旁证闭合）。
- **`read_contract_route_guard.rs`**：登记 **`/api/v1/governance/country-ledger/:jurisdiction`**（**`governance_country_ledger.rs`**）；**`/api/v1/country-ledger/:jurisdiction`** **不在**该守卫字面量表（**与** **`governance_read_contract_contract_tests`** **分轨**）。

## §3 命令证据（本轮）

- **`bash scripts/run-check-04-routes.sh`** → **exit 0**（**04↔code** 表路径挂载）。
- **`cargo test -p traveltrust-api country_ledger_jurisdiction::`** → **2 passed**。
- **`cargo test -p traveltrust-api governance_country_ledger::`** → **2 passed**。

## §4 诚实边界

- **不**新增 **§3 F** 行：两路径已在 **04**/**14**/**P5-1** 分轨叙述；**不**替代 **S-4** 主批次全文审计。
- **前端**：仓库内 **未**检出 **`api.ts`** 对 **`/api/v1/country-ledger/`** 字面量（**可能**仅链上/运维 **`cast`**/**Admin** 消费）；**不**记为 **C-4** 闭证。
