# TT-B435-EXTERNAL-AUDIT-SIMULATION-001 · 外部审计模拟（证据答辩表）

**定位**：在 **TT-B435** 全栈测试网封口与相邻治理/金库证据已落盘时，用「一问一证据指针」模拟外部审计或投尽调提问。**不能**替代对 `evidence/.../run_<UTC>/` 与区块浏览器的实查。

**交叉引用**：[TT-B435](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md) §3.8、[TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001](./TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001.md)（**未证域 / 下一批 TT**）、[TT-TREASURY-SPEND-MINI-EVIDENCE-001](./TT-TREASURY-SPEND-MINI-EVIDENCE-001.md)、[`evidence/b435_fullstack_fund_testnet_closeout/README.md`](../../evidence/b435_fullstack_fund_testnet_closeout/README.md)、[`evidence/timelock_truth_arbitration/README.md`](../../evidence/timelock_truth_arbitration/README.md)、[`evidence/b417_governance_execution_runs/README.md`](../../evidence/b417_governance_execution_runs/README.md)。

---

## 1. 真值与双套 Timelock

| 审计问题 | 用哪份证据答 | 合格线 |
|----------|----------------|--------|
| 为何相信环境里只有一套治理 Timelock？ | `evidence/timelock_truth_arbitration/decision_record.v3.json`（B-434 裁断 B）；与 `GET /meta` → `chain.contracts.timelock_address` 一致 | 裁断文件 + meta + Explorer 同地址 |
| 若有人用旧 `Deploy.s.sol` 整包广播出第二套 Timelock，如何发现？ | 台账 / `.env` / `meta` 七键单一来源；Runbook 禁止混写（TT-B435 §1 / §2.1） | 无两套地址并行写入同一套对外叙事 |

---

## 2. FeeRouter · 分轨 · 观测

| 审计问题 | 用哪份证据答 | 合格线 |
|----------|----------------|--------|
| FeeRouter `owner` 是否为 Timelock？ | `bash scripts/ops/runtime-chain-ssot-cast-verify.sh` 输出（`ssot.txt` 入 `run_<UTC>/`） | `feeRouter.owner() == TIMELOCK_ADDRESS` |
| 平台费入库与索引/DB 是否一致？ | `reconcile.json` / `overview.json`；B-383 等键（Runbook §2.55） | 机读对拍无持续漂移告警（或已台账解释） |
| 线 A（FeeRouter + `/meta` + 分轨）是否 PASS？ | `evidence/GO_20260417_line_a_minimal/`（`CONCLUSION.md` + `capture.log`） | Runbook §7.1 六条判据 |

---

## 3. 真实扣款与 mock 隔离

| 审计问题 | 用哪份证据答 | 合格线 |
|----------|----------------|--------|
| 是否用 `mock-pay` 冒充链上扣款？ | 环境 `P3_CHAIN_OFF`；TT-B435 §3.3 | 非 mock 路径须 `P3_CHAIN_OFF=0` 或未设 |
| 真实扣款 tx 在哪？ | `tx_hashes.json` · `first_payment`（或等价键）+ Explorer | 可打开哈希核对方法与收款合约 |

---

## 4. 治理执行 · 金库支出（Treasury.spend）

| 审计问题 | 用哪份证据答 | 合格线 |
|----------|----------------|--------|
| queue / execute 是否真实链上成功？ | `evidence/b417_governance_execution_runs/run_<UTC>/` · `b417-chain-step-*.json` + `b417-governance-execution-report.json` | `execution_verdict=GO`，`dry_run=false`，`b417-evidence-pack-verify` exit 0 |
| 如何证明提案不是 `token.transfer` 冒充 `Treasury.spend`？ | `SepoliaProposeTreasurySpend.s.sol` 构造；execute 收据中 `TreasurySpent` / `TreasuryEthSpent` | target = `TREASURY_ADDRESS`，事件与参数一致（TT-TREASURY §6） |
| `Treasury.spender` 是谁？ | `cast call` `spender()`（线 B Step 3 R3） | `spender() == TIMELOCK_ADDRESS` |

---

## 5. 业务 · 前端 · API 一致性

| 审计问题 | 用哪份证据答 | 合格线 |
|----------|----------------|--------|
| 浏览器调的合约与后端是否同一套地址？ | 前端 `NEXT_PUBLIC_*`；`GET /meta`；可选截图/构建日志（TT-B435 §3.8 表 B） | 关键路由地址与 `meta.chain.contracts` 一致 |
| API 元数据是否反映当前部署？ | `meta_chain_contracts.json` 或同批 `curl` 入 `run_<UTC>/` | 与 `.env` 重启后进程一致 |

---

## 6. 收口陈述（示例 · 须与证据同批）

测试网已完成从 **FeeRouter** 收入分配到 **GovernanceTreasury**、再以 **Treasury.spend** 专用提案经 **Timelock** 控制执行支出的全链路验证，含 **B-417** 证据包与 **TT-B435** `run_<UTC>/` 观测收口；结果可按本表逐条复核。

---

**文档版本**：1.0.0 · 2026-04-17
