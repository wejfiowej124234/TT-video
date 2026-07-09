# TT_GOVERNANCE_ENTERPRISE_HAT · 企业级人工验收清单

**Stamp:** `20260616T071420Z` · **Phase:** ② Sepolia
**SSOT:** TTG-TOKENOMICS-FREEZE-V1 · GovFreeze V2

> **不验证代码** · 验证业务 · 权限 · 资金 · 体验 · 认知

## 签核表

| 层 | 名称 |  verdict | 签核人 | 日期 | 证据/备注 |
|----|------|---------|--------|------|-----------|
| L1 | UI / UX 审核 | ☐ PASS / ☐ FAIL | | | |
| L2 | TTG 购买流程 | ☐ PASS / ☐ FAIL | | | |
| L3 | Seat 主理人流程 | ☐ PASS / ☐ FAIL | | | |
| L4 | 收益分配审计 | ☐ PASS / ☐ FAIL | | | |
| L5 | Treasury 审计 | ☐ PASS / ☐ FAIL | | | |
| L6 | 多身份污染审计 | ☐ PASS / ☐ FAIL | | | |
| L7 | 管理员系统审计 | ☐ PASS / ☐ FAIL | | | |
| L8 | 异常路径审计 | ☐ PASS / ☐ FAIL | | | |
| L9 | 财务闭环审计 | ☐ PASS / ☐ FAIL | | | |

---

## L1 · UI / UX 审核

**范围：** 治理首页 · 3 秒认知

**路由：** `/governance` · `/governance/params` · `/governance/params#gov-params-overview`

- [ ] 用户 3 秒内能否理解：TTG 是什么
- [ ] 用户 3 秒内能否理解：Country Pool 是什么
- [ ] 用户 3 秒内能否理解：45/55 是什么
- [ ] 用户 3 秒内能否理解：Seat 是什么
- [ ] 用户 3 秒内能否理解：Treasury 是什么
- [ ] 是否还有旧分红叙事
- [ ] 是否还有自动分红描述
- [ ] 是否还有 Seat 退出返 USDC 描述
- [ ] 是否还有旧单池模型描述
- [ ] 是否所有图都变成多国家池
- [ ] 是否明确 P1/P2/P3/P4

## L2 · TTG 购买流程

**范围：** 游客 · 普通持币人 · 管理员

**路由：** `/governance/params#gov-params-tokenomics-freeze` · `/market 或 Primary Market 入口`

- [ ] 购买 TTG 流程可完成或诚实 blocked
- [ ] 查看余额正确
- [ ] 查看锁仓/vest 说明正确（如有）
- [ ] 查看治理权/delegate 说明正确
- [ ] 查看钱包限制文案正确
- [ ] GOV-04 显示正确
- [ ] 25000 TTG 上限正确
- [ ] 三轮规则正确
- [ ] USDC 流向叙事正确（Primary Market → 非自动分红）
- [ ] 错误提示正确（余额不足/超 cap 等）

## L3 · Seat 主理人流程

**范围：** 无 TTG · 有 TTG · 有 Seat · 退出 Seat

**路由：** `/governance/steward-region-workbench`

- [ ] Stake 门槛显示正确（jurisdiction minStake）
- [ ] 10 国参数正确
- [ ] Seat 申请流程正确
- [ ] 审核状态正确
- [ ] Active 状态正确
- [ ] Release / requestRelease 状态正确
- [ ] 180 天退出说明正确

## L4 · 收益分配审计

**范围：** Country Pool 45/55 · Steward 路径 · P4 治理

**路由：** `/governance/params#gov-params-overview` · `/governance/distribution-accruals` · `/governance/distribution-claim`

- [ ] 国家利润 → 45% StewardPath 叙事/数正确
- [ ] 国家利润 → 55% Global Treasury 叙事/数正确
- [ ] 数学正确（页面 bps/percent）
- [ ] 页面正确
- [ ] API 正确（protocol-reference / accruals）
- [ ] 数据库正确（如可用）
- [ ] 图表正确（多国家池）
- [ ] Active Seat 才走 45% 路径收益叙事
- [ ] 非 Seat 不能领取 Steward 路径
- [ ] Seat 取消后停止领取叙事正确
- [ ] 多 Seat 不能超限（GOV-03）
- [ ] Unallocated 逻辑正确
- [ ] P4 无自动分红
- [ ] P4 无直接按比例分钱
- [ ] P4 必须治理提案
- [ ] P4 必须 Timelock
- [ ] P4 必须 Treasury 权限

## L5 · Treasury 审计

**范围：** 谁能花 · 申请 · 批准 · 执行 · 查看

**路由：** `/governance/params#gov-params-treasury-policy` · `/governance/proposals`

- [ ] USDC → Treasury → 运营 叙事正确
- [ ] Admin 不能直接转钱
- [ ] Seat 不能直接转钱
- [ ] Governor 控制支出提案
- [ ] Timelock 控制 execute
- [ ] 30% P4 deploy cap 文案/参数生效
- [ ] Treasury Spend：提案 → 投票 → Queue → Execute → USDC 支出

## L6 · 多身份污染审计

**范围：** Traveler · Guide · Merchant · Steward · Moderator · Admin

**路由：** `各角色工作台 · /me · /governance/*`

- [ ] 身份切换正确
- [ ] 收益不串
- [ ] 权限不串
- [ ] 提案不串
- [ ] Treasury 不串
- [ ] Seat 不串

## L7 · 管理员系统审计

**范围：** Admin 登录

**路由：** `/admin 或 Admin 面板`

- [ ] 能看到什么符合 RBAC
- [ ] 能改什么符合 RBAC
- [ ] 不能改什么有硬闸/无入口
- [ ] 不能改 Treasury 余额
- [ ] 不能改投票结果
- [ ] 不能跳过 Timelock
- [ ] 不能直接给自己收益
- [ ] 不能直接改 Seat 收益
- [ ] 不能直接发 TTG

## L8 · 异常路径审计

**范围：** 故意制造错误

**路由：** `购买 · Stake · 投票 · 领取各入口`

- [ ] 余额不足 — 提示正确
- [ ] 权限不足 — 提示正确
- [ ] 重复投票 —  blocked + 提示
- [ ] 重复申请 — blocked + 提示
- [ ] 重复领取 — blocked + 提示
- [ ] 释放中退出 — 提示正确
- [ ] 不崩溃
- [ ] 不串数据

## L9 · 财务闭环审计

**范围：** 四账一致

**路由：** `抽查脚本见 checklist §L9 附录`

- [ ] Primary Market：链上 = API = DB = 页面
- [ ] Country Pool：链上 = API = DB = 页面
- [ ] Treasury：链上 = API = DB = 页面
- [ ] Steward stake：链上 = API = DB = 页面
- [ ] TTG 余额/供应：链上 = API = 页面

## L9 附录 · 四账抽查命令（② · 辅助）

```bash
# 链上（Sepolia · GovFreeze V2 地址见 .env.phase2-chain-deploy.local）
bash scripts/dev/verify-gov-freeze-v2-sepolia-onchain.sh

# API
curl -sS "$API_BASE/api/v1/governance/protocol-reference" | jq .

# 页面：对照 /governance/params 与上两项
```

## 最终签核

- [ ] L1～L9 全部 PASS
- 签核人: _______________
- 日期: _______________

```bash
bash scripts/dev/record-tt-governance-enterprise-hat-signoff.sh --all-pass
export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1
```
