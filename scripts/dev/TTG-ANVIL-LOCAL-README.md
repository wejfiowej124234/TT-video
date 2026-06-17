# TTG Anvil 本地（①）— 索引页

**唯一 SSOT 已合并至：** [`docs/runbook/TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT.md`](../../docs/runbook/TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT.md)

本文件替代历史缺失的 `TTG-ANVIL-LOCAL-README.md` 引用，避免链接断裂。

## 快速命令

```bash
# 对齐 FundStack + TTG（默认 reuse 池 · 保留 stake）
bash scripts/dev/align-anvil-local-stack.sh

# 强制重部署 TTG 池（地址碰撞修复 · 须重质押）
TTG_ANVIL_FORCE_DEPLOY=1 bash scripts/dev/align-anvil-local-stack.sh

# 日常重启 API/FE · 不重质押
# Windows: set SKIP_ANVIL_ALIGN=1 && scripts\start-api-with-seed.bat
```

## 机读 Gate

```bash
bash scripts/gates/check-steward-admission-chain-state-ssot.sh
```

## 实现真源

- `scripts/dev/lib/ttg-anvil-common.sh` — deploy · reuse · fund wallets
- `scripts/dev/deploy-ttg-anvil-local.sh`
- `scripts/dev/LOCAL-ANVIL-STACK-README.md`
