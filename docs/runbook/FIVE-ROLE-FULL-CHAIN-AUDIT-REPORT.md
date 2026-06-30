# 五角色全链路真人审计报告

**记录时间：** 2026-06-30T09:42:19.558785+00:00  
**Web：** [https://tt-web-staging.fly.dev](https://tt-web-staging.fly.dev)  
**API：** [https://tt-api-staging.fly.dev](https://tt-api-staging.fly.dev)  
**git_sha：** `d5aa447f1c9e2adecbcb4f3c19004eaa8b9348f6`  
**证据：** `evidence/GO_phase2_testnet_graduation/h1-human-acceptance/frca-20260630T094141Z/frca-findings.json`  

> 注册 → 登录 → 角色核心路径 → 退出 · **≠ Production GO**

## Executive verdict

| 项 | 结果 |
|----|------|
| **FRCA overall** | **PASS** |
| **P0** | **0** |
| **P1** | **0** |
| **P2** | **4** |

```text
FRCA_FIVE_ROLE_FULL_CHAIN: PASS
```

## 1 · 五角色全链路矩阵

| 角色 | 注册 | 登录 | 核心路径 | 退出 |
|------|------|------|----------|------|
| **旅行者** | SKIP(seed) | PASS | PASS | PASS |
| **向导** | SKIP(seed) | PASS | PASS | PASS |
| **商家** | SKIP(seed) | PASS | PASS | PASS |
| **管理员** | SKIP(seed) | PASS | PASS | PASS |
| **治理** | SKIP(seed) | PASS | PASS | PASS |

## 2 · 问题矩阵（按类别）

### 全链路缺口（4）

- **FRCA-GAP-M01** [P2] 商家: 商家注册→Admin审核→listing 未在本轮 UI 手操
- **FRCA-GAP-M02** [P2] 旅行者: 支付/下单/Escrow 全链未手操
- **FRCA-GAP-M03** [P2] 向导: 接单→完成→评分未手操
- **FRCA-GAP-M04** [P2] 治理: 链上投票/Claim 未接钱包手操

**复跑：** `bash scripts/dev/run-five-role-full-chain-audit.sh`

*Generated 2026-06-30 · FRCA v1*
