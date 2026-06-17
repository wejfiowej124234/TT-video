#!/usr/bin/env bash
# GovFreeze V2 · 真人录屏验收 prep · 逐页清单 + 路由（② only）
#
#   bash scripts/dev/run-govfreeze-v2-human-screen-acceptance-prep.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_govfreeze_v2_human_screen_acceptance/${STAMP}"
mkdir -p "$EVID/screenshots"

bash "$ROOT/scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh" >/dev/null

CP_STAMP="$(cat "$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$CP_STAMP" ]] || { echo "GOVFREEZE_HUMAN_UAT: FAIL missing CP four-ledger evidence" >&2; exit 2; }
FL_REL="evidence/GO_tt_country_pool_revenue_enterprise_hat/${CP_STAMP}/four-ledger-reconcile.json"
python -c "import json,sys; v=json.load(open('$FL_REL', encoding='utf-8'))['verdict']; sys.exit(0 if v=='PASS' else 1)" || {
  echo "GOVFREEZE_HUMAN_UAT: FAIL four_ledger not PASS — baseline frozen at $FL_REL" >&2
  exit 3
}

cat >"$EVID/HUMAN-SCREEN-ACCEPTANCE-CHECKLIST.md" <<EOF
# GovFreeze V2 · 真人录屏验收清单 · ${STAMP}

**基线：** GovFreeze V2 + Four-Ledger PASS (\`${CP_STAMP}\`) · **② only** · **禁止 Tokenomics 设计变更**

**录屏要求：** 每段含 URL 栏 · 身份/角色标识 · 关键操作与结果 · 时间戳；保存 \`${EVID}/recordings/\`

---

## A · UI/UX 逐页（3 秒认知）

| # | 路由 | 身份 | 验收点 | ☐ |
|---|------|------|--------|---|
| A1 | \`/governance\` | 游客 | 多国家池 · P1–P4 · 无自动分红叙事 | ☐ |
| A2 | \`/governance/params\` | 持币人 | 45/55 · Timelock 48h · GOV freeze 文案 | ☐ |
| A3 | \`/governance/params#gov-params-treasury-policy\` | 持币人 | Treasury 须治理 · 无 Admin 直转 | ☐ |
| A4 | \`/market\` · \`/traveltrust\` | 游客 | 与治理叙事不冲突（五主冻结 · 仅数据链） | ☐ |
| A5 | \`/governance/distribution-accruals\` | 登录用户 | accrual 只读 · 非 P4 自动分红 | ☐ |
| A6 | \`/governance/distribution-claim\` | 登录用户 | claim 边界 · registered distribution_id | ☐ |

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

**签核：** \`bash scripts/dev/record-govfreeze-v2-human-screen-acceptance.sh --evidence-dir ${EVID} --signer "…"\`
EOF

cat >"$EVID/routes.json" <<'JSON'
{
  "frontend_base": "http://127.0.0.1:3012",
  "routes": [
    "/governance",
    "/governance/params",
    "/governance/distribution-accruals",
    "/governance/distribution-claim",
    "/market",
    "/traveltrust"
  ],
  "identities": ["guest", "traveler", "steward", "merchant", "guide", "moderator", "admin"]
}
JSON

echo "$STAMP" >"$ROOT/evidence/GO_govfreeze_v2_human_screen_acceptance/latest-stamp.txt"
echo "GOVFREEZE_HUMAN_UAT_PREP: OK evidence=$EVID"
echo "TT_GOVFREEZE_V2_HUMAN_SCREEN_ACCEPTANCE_PREP: OK stamp=$STAMP"
