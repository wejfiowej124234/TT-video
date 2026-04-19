# TT-TESTNET · 测试网全栈封口证据包

**UTC 目录**：`run_20260417T021846Z`  
**清单入口**：[docs/runbook/TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST.md](../../../docs/runbook/TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST.md)  
**资金栈 Runbook（母表 B-435）**：[docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md](../../../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)  
**仓库 commit（创建本目录时）**：`f267483c8db3aaefb500618168333d0daafbf05d`

## 状态

- [ ] 一、治理栈 `DeployGovernanceStack` + 资金栈 `DeployFundStackUnderTimelock` + 业务/工厂（同一 Sepolia RPC）
- [ ] 二、根 `.env` / `frontend/.env.local` 与 `GET /meta` 同源；`P3_CHAIN_OFF` 未误开 mock
- [ ] 三、本地前端联调（CORS + 钱包网络 + 页面可读）
- [ ] 四、真实链上交易 + `indexer-tick` / `indexer-reconcile` / `admin/observability/overview` + `runtime-chain-ssot-cast-verify.sh`
- [ ] 五、本目录 `tx_hashes.json` 填齐；`indexer_tick.json` / `reconcile.json` / `overview.json` 已由收口脚本落盘；可选 `broadcast/`、`ssot.txt`

## 收口命令（API 已启动且 INTERNAL_API_SECRET / ADMIN 可用）

```bash
export B435_EVIDENCE_RUN_DIR=evidence/b435_fullstack_fund_testnet_closeout/run_20260417T021846Z
export B435_FIRST_PAYMENT_TX=0x…   # 真实扣款/资金路径 tx
bash scripts/ops/tt-testnet-fullstack-seal.sh
```

**母表 B-435**：仅当 [TT-B435 §3.7](../../../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md#37-回写台账与母表仅当整条链成立) 整条链成立后再标「已做」。
