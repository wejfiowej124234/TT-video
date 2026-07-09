# ③ Backlog · ① 本地盲测发现（2026-06-15）

**登记规则：** 来自 **①** 烟测/真人发现；**defer=③**；**不改** **② soak**。

| ID | 优先级 | 环境 | 现象 | defer | 状态 |
|----|--------|------|------|-------|------|
| BL-③-001 | P1 | ① P3_CHAIN_OFF=0 | Chain B mock-pay 501；与 chain-on 质押轨互斥 | ③ | open |
| BL-③-002 | P2 | ① scripts | 无 provider stake smoke | ③ | closed_① smoke-provider-identity-stake-anvil.sh @ 0de2ee9d |
| BL-③-003 | P2 | ① /meta | 759 未含 escrow_factory / registry / steward_pool | ③ | closed_① 十三键 @ 0de2ee9d |
| BL-③-004 | P2 | ① governance | governor/timelock/treasury null（① 无治理栈） | ③ | open |
| BL-③-005 | P2 | ① 浏览器 | 钱包 UI 盲测未自动化 | ③ | open · HUMAN-UI-CHECKLIST 进行中 @8080 |
| BL-③-006 | P2 | ① Chain B @8080 | 历史单 41e8c12f accepted 未支付（chain-on 预期） | ③ | open · 仅记录 |
| BL-③-007 | P3 | ① 双轨 | 8080/8081 并行易混；须停 8081 后人测 | ③ | mitigated_① playbook + 05-session-closure.txt |

**② 边界：** 不修改 deploy-tt-web-staging.sh 或 staging soak @ 877a1e77。

## BL-③-001 ① 临时规避（非关闭）

双端口分轨：8080 chain-on 人测 · 8081 P3_CHAIN_OFF=1 仅 Chain B 烟测 → 烟测后关 8081。产品级统一路径仍 open 待 ③ 决策。

## 机读闭环参考（8081 停前）

- 1f73075a（04-chain-b-chain-off-session.log）
- f6fd3cf8-af0f-443a-8dbe-8cf5e2f6b29e（post-0de2ee9d 复测）

## R2 审计增量（2026-06-15）

| ID | 优先级 | 现象 | defer | 状态 |
|----|--------|------|-------|------|
| BL-③-008 | P1 | Indexer 内存 checkpoint 10676552 vs Anvil tip 69（API 未重启） | ③ | open · ① 规避=重启 API |
| BL-③-009 | P3 | check-55-quick-verify /metrics 长跑偶发 404 | ③ | open |
| BL-③-010 | P2 | 759 未覆盖 country_pool/ledger 等扩展合约键 | ③ | open |

详见 MULTI-DIM-ALIGNMENT-AUDIT-20260615-R2.md

## BL-③-008 关闭（2026-06-15 · ① indexer reset）

| ID | 状态 | 修复 |
|----|------|------|
| BL-③-008 | **closed_①** | API 启动 `mount_runtime_indexer_state` 丢弃异链 `.runtime`；`reset-indexer-runtime-local-anvil.sh`；align 挂钩 |

复验：重启 :8080 后 checkpoint **57** / Anvil tip **69**（FINALITY_N=12）。

## 真人 UI 盲测登记（仅 UX/流程/钱包 · 不改代码）

| ID | 优先级 | 现象 | defer | 状态 |
|----|--------|------|-------|------|
| BL-UI-011 | P3 | `?scope=provider` 页 `<title>` 仍用向导质押文案 | ③ | open |
| BL-UI-012 | P2 | 收购 Hub「请先绑定并验证主钱包」— 未连钱包时阻断（预期门闸，手测待确认） | ③ | open · Owner MetaMask |
| BL-UI-013 | P2 | Guide/Provider stake·withdraw 须手点 MetaMask（机读仅见 Connect 提示） | ③ | open · Owner 手测 |

证据：06-indexer-reset-and-ui-blind-20260615.txt

## BL-③-008 commit（2026-06-15）

| ID | commit | 状态 |
|----|--------|------|
| BL-③-008 | cd98714a | **closed_①** indexer reset（mount_runtime_indexer_state + reset-indexer-runtime-local-anvil.sh） |

## Checklist 复测 @3012 重启后

| 项 | HTTP | 壳层 |
|----|------|------|
| /staking?scope=guide | 200 | pool OK · Connect 可见 |
| /staking?scope=provider | 200 | pool OK · Connect 可见 · tab 标题仍向导文案 → BL-UI-011 |
| /me/identities multi-demo | 200 | 向导/商家/主理人/收购卡片 OK |
| Chain B mock-pay | SKIP | 8080 chain-on |

MetaMask stake/withdraw：仍须 Owner 手点（BL-UI-013）。
