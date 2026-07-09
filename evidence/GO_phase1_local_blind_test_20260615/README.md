# ① 本地真人盲测 · Anvil 对齐后（2026-06-15）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（本包仅 **①**；**不改** **② soak**）

**分支：** fix/local-anvil-stack-phase1 · **commit 0de2ee9d**（759/meta + verify + ABI + Anvil）  
**前置：** align-anvil-local-stack.sh → sync-frontend-env-local-from-root.sh → API :8080 + Next :3012 + Anvil :8545

## 当前运行态

| 服务 | 状态 |
|------|------|
| API :8080 chain-on | **保留** — 真人 UI 质押 / 多身份 |
| API :8081 chain-off | **已停**（2026-06-15T06:06:39Z）— 防双轨混用 |
| Next :3012 | 指向 **8080** |

详见 **05-session-closure.txt**。

## 机读烟测

| 链路 | 证据 | 结果 |
|------|------|------|
| Guide 质押 | 01-guide-stake-smoke.log | PASS |
| Provider 质押 | smoke-provider-identity-stake-anvil.sh | PASS |
| 多身份 | 03-multi-identity-smoke.log | ALL PASS |
| Chain B @8080 | 02-chain-b-seed-transaction.log | mock-pay 501（chain-on 预期） |
| Chain B @8081 临时会话 | 04-chain-b-chain-off-session.log | PASS → **已关端口** |

## ③ backlog

**BACKLOG-PHASE3.md** — 发现只登记 **③**，不动 ② soak。

## 真人 UI

**HUMAN-UI-CHECKLIST.md** — 仅在 **:8080 chain-on** 手点质押 / 多身份。

## 诚实边界

① /meta 对齐 + 链上烟测 **≠** ② staging GO **≠** ③ Production GO。

## 双会话

**PLAYBOOK-DUAL-SESSION.md** — 轨 A 常驻 · 轨 B 临时后必停。
