#!/usr/bin/env bash
# TT-TESTNET：新建测试网封口证据目录 run_<UTC>/（骨架 + tx_hashes 模板）。
# 与 docs/runbook/TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST.md 五步一致。
#
# 用法（仓库根）：
#   bash scripts/ops/tt-testnet-fullstack-new-run-dir.sh
#   # 或指定 UTC 目录名（须匹配 run_<UTC> 形式）：
#   TT_TESTNET_RUN_ID=run_20260417T120000Z bash scripts/ops/tt-testnet-fullstack-new-run-dir.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

RUN_ID="${TT_TESTNET_RUN_ID:-run_$(date -u +%Y%m%dT%H%M%SZ)}"
if [[ ! "$RUN_ID" =~ ^run_[0-9]{8}T[0-9]{6}Z$ ]]; then
  echo "tt-testnet-fullstack-new-run-dir: TT_TESTNET_RUN_ID must look like run_YYYYMMDDTHHMMSSZ, got: $RUN_ID" >&2
  exit 1
fi

EV_BASE="evidence/b435_fullstack_fund_testnet_closeout"
RUN_DIR="$EV_BASE/$RUN_ID"
mkdir -p "$RUN_DIR"

GIT_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"

if [[ -f "$RUN_DIR/README.md" ]]; then
  echo "Already exists: $RUN_DIR/README.md (refuse to overwrite)" >&2
  exit 1
fi

cat >"$RUN_DIR/tx_hashes.json" <<EOF
{
  "chain_id": 11155111,
  "explorer_base": "https://sepolia.etherscan.io/tx/",
  "deploy_governance_stack_token_create": "",
  "deploy_fund_stack_escrow_factory_create": "",
  "first_payment": "",
  "notes": "TT-TESTNET / TT-B435：将各部署与 first_payment 的 0x… 填入；first_payment 也可用 scripts/ops/b435-merge-first-payment-tx.example.sh 合并。然后运行 scripts/ops/tt-testnet-fullstack-seal.sh。"
}
EOF

cat >"$RUN_DIR/README.md" <<EOF
# TT-TESTNET · 测试网全栈封口证据包

**UTC 目录**：\`$RUN_ID\`  
**清单入口**：[docs/runbook/TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST.md](../../../docs/runbook/TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST.md)  
**资金栈 Runbook（母表 B-435）**：[docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md](../../../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)  
**仓库 commit（创建本目录时）**：\`$GIT_SHA\`

## 状态

- [ ] 一、治理栈 \`DeployGovernanceStack\` + 资金栈 \`DeployFundStackUnderTimelock\` + 业务/工厂（同一 Sepolia RPC）
- [ ] 二、根 \`.env\` / \`frontend/.env.local\` 与 \`GET /meta\` 同源；\`P3_CHAIN_OFF\` 未误开 mock
- [ ] 三、本地前端联调（CORS + 钱包网络 + 页面可读）
- [ ] 四、真实链上交易 + \`indexer-tick\` / \`indexer-reconcile\` / \`admin/observability/overview\` + \`runtime-chain-ssot-cast-verify.sh\`
- [ ] 五、本目录 \`tx_hashes.json\` 填齐；\`indexer_tick.json\` / \`reconcile.json\` / \`overview.json\` 已由收口脚本落盘；可选 \`broadcast/\`、\`ssot.txt\`

## 收口命令（API 已启动且 INTERNAL_API_SECRET / ADMIN 可用）

\`\`\`bash
export B435_EVIDENCE_RUN_DIR=$RUN_DIR
export B435_FIRST_PAYMENT_TX=0x…   # 真实扣款/资金路径 tx
bash scripts/ops/tt-testnet-fullstack-seal.sh
\`\`\`

**母表 B-435**：仅当 [TT-B435 §3.7](../../../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md#37-回写台账与母表仅当整条链成立) 整条链成立后再标「已做」。
EOF

echo "Created: $RUN_DIR"
echo "  README.md  tx_hashes.json"
echo "Next: deploy on Sepolia, fill tx_hashes.json, then: bash scripts/ops/tt-testnet-fullstack-seal.sh"
