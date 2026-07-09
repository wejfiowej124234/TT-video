# TL#1 · Wave1 · Owner 预备清单（② · Sepolia · 测试 ETH only）

刷新 TL#1：`bash scripts/dev/probe-phase-b-timelock-countdown.sh`

## 日常（TL#1 前）

```bash
bash scripts/dev/run-phase-b-daily-maintenance.sh
```

## 环境自检（不碰 staging 冻结基线）

| # | 项 | 检查 |
|---|-----|------|
| B-1 | Sepolia RPC | `CHAIN_RPC_URL` · `CHAIN_ID=11155111` |
| B-2 | 签名钱包 | 测试账户 · 勿混主网 |
| B-3 | Gas | Sepolia ETH ≥ 2 笔 tx 余量 |
| B-4 | HAT 证据 | `evidence/GO_hat_r1_sepolia/*/EXECUTE_EARLIEST_UNIX.txt` |
| B-5 | Cert 会话 | `evidence/GO_ttg_cert/latest-stamp.txt` |
| B-6 | Phase B | 维护期 `HAT_R1_PHASE_B_PAUSED=1` |
| B-7 | Soak | `p2fc-soak-attest.sh` → alive=1 |

## TL#1 后 Wave1（一次性）

```bash
export HAT_R1_LIVE_WALLET_OK=1 HAT_R1_PHASE_B_PAUSED=0
bash scripts/dev/run-phase-b-post-timelock-wave1.sh --signer "Sebastian Ward"
```

期望：`TT_PHASE_B_WAVE1: OK`

## Cert #10–#12 素材

| Cert | 证据子目录 | signoff |
|------|------------|---------|
| 10 | incidents/tabletop/ | INCIDENT-TABLETOP-SIGNOFF.json |
| 11 | drills/ | DR-DRILL-SIGNOFF.json |
| 12 | gorp/ | GORP-SIGNOFF.json |

录屏后：`complete-ttg-cert-step.sh --cert N --stamp <stamp> --signer "Sebastian Ward"`

## 禁止

- TN-P1-010 / graduation gate（须 COMPLETED.json）
- staging redeploy / migrate 冻结 SHA
- 业务逻辑 / 合约参数变更
