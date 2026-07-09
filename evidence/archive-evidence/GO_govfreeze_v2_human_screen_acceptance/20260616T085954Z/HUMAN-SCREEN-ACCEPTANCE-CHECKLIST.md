# GovFreeze V2 · 真人录屏验收清单 · 20260616T085954Z

**基线：** GovFreeze V2 + Four-Ledger PASS (`20260616T084248Z`) · **② only** · **禁止 Tokenomics 设计变更**

**录屏要求：** 每段含 URL 栏 · 身份/角色标识 · 关键操作与结果 · 时间戳；保存 `/d/TravelTrust-V1.1/evidence/GO_govfreeze_v2_human_screen_acceptance/20260616T085954Z/recordings/`

---

## A · UI/UX 逐页（3 秒认知）

| # | 路由 | 身份 | 验收点 | ☐ |
|---|------|------|--------|---|
| A1 | `/governance` | 游客 | 多国家池 · P1–P4 · 无自动分红叙事 | ☐ |
| A2 | `/governance/params` | 持币人 | 45/55 · Timelock 48h · GOV freeze 文案 | ☐ |
| A3 | `/governance/params#gov-params-treasury-policy` | 持币人 | Treasury 须治理 · 无 Admin 直转 | ☐ |
| A4 | `/market` · `/traveltrust` | 游客 | 与治理叙事不冲突（五主冻结 · 仅数据链） | ☐ |
| A5 | `/governance/distribution-accruals` | 登录用户 | accrual 只读 · 非 P4 自动分红 | ☐ |
| A6 | `/governance/distribution-claim` | 登录用户 | claim 边界 · registered distribution_id | ☐ |

## B · 多身份

| # | 场景 | 验收点 | ☐ |
|---|------|--------|---|
| B1 | Traveler | 购买/浏览与 Steward 数据不串 | ☐ |
| B2 | Steward / Seat | Stake · DE · 门槛 · 无 USDC 退席叙事 | ☐ |
| B3 | Merchant / Guide | 与治理控制台权限隔离 | ☐ |
| B4 | Moderator |  moderation 不冒充 Treasury 支出 | ☐ |

## C · Admin

| # | 场景 | 验收点 | ☐ |
|---|------|--------|---|
| C1 | Admin 只读面 | 可见链上/配置 · 不可 bypass Timelock 转帐 | ☐ |
| C2 | suspend / 门闸 | 不改动 45/55 经济规则 | ☐ |

## D · 收益路径（对照四账基线）

| # | 链路 | 验收点 | ☐ |
|---|------|--------|---|
| D1 | 45/55 文案 | 与链上 bps + cutover drill 一致 | ☐ |
| D2 | Global Treasury | 指向 V2 Timelock · 非 legacy | ☐ |
| D3 | Steward / Unallocated | 无 Active 时 45% 进 Unallocated（非 Global 吞并） | ☐ |
| D4 | Claim | investor distribution orthogonal to steward leg | ☐ |

---

**签核：** `bash scripts/dev/record-govfreeze-v2-human-screen-acceptance.sh --evidence-dir /d/TravelTrust-V1.1/evidence/GO_govfreeze_v2_human_screen_acceptance/20260616T085954Z --signer "…"`
