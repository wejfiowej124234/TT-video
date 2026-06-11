#!/usr/bin/env bash
# 治理币 / 82 专题文档联动门禁（与 07 §二 2.4、00-文档治理总册 §五 一致）
# 校验「索引 + 总表 + 串联 + 07 门禁节 + 专题文件」未被误删或断锚；
# 另：**84 `DOC_VERSION`↔`governance_doc_reference`**、**08-4-附录 §2 Mermaid** 与 **JSON 镜像** 45/55·65/20/15 交叉锚点。
# W-GATE 机读辅助：ops/RUNBOOK.md §12.7；缺口 P1-C「W-GATE-CROSS-CHECK」互证见 evidence/GO_20260409/artifacts/p1c-wgate-evidence-integration-close.md（TT-07-63B-P1C-EVIDENCE-INTEGRATION-001；不替代 08-2 审查二人工矩阵）。
# Windows：.\scripts\check-governance-doc-linkage.ps1（委托本脚本）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

grep -q '82-治理币-文档总览' docs/spec/00-文档索引.md \
  || fail "docs/spec/00-文档索引.md must reference 82-治理币-文档总览"

grep -q '83-区域治理与收益分配-协议白皮书' docs/spec/00-文档索引.md \
  || fail "docs/spec/00-文档索引.md must reference 83-区域治理与收益分配-协议白皮书"

grep -q '84-第一阶段10国Country-Pool发行参数总表' docs/spec/00-文档索引.md \
  || fail "docs/spec/00-文档索引.md must reference 84-第一阶段10国Country-Pool发行参数总表"

grep -qE '82[[:space:]]*治理币|82-治理币|governance-token' docs/spec/00-最终版架构图对应模块清单总表.md \
  || fail "00-最终版架构图对应模块清单总表.md must mention 82 / governance-token"

grep -q 'governance-token' docs/spec/00-最终版架构图对应模块清单总表.md \
  || fail "00-最终版架构图对应模块清单总表.md must contain governance-token"

grep -qE '82[[:space:]]*治理币|82-治理币' docs/spec/00-文档体系与阅读串联.md \
  || fail "00-文档体系与阅读串联.md must mention 82 治理币专项"

grep -q '2\.4 架构' docs/spec/07-开发流程与顺序.md \
  || fail "07-开发流程与顺序.md must contain §2.4 架构·排期·专题门禁标题"

test -f docs/spec/82-治理币-文档总览.md || fail "missing docs/spec/82-治理币-文档总览.md"
test -f docs/spec/83-区域治理与收益分配-协议白皮书.md || fail "missing docs/spec/83-区域治理与收益分配-协议白皮书.md"
test -f docs/spec/84-第一阶段10国Country-Pool发行参数总表.md || fail "missing docs/spec/84-第一阶段10国Country-Pool发行参数总表.md"
test -f docs/spec/governance-token/README.md || fail "missing docs/spec/governance-token/README.md"
test -f docs/spec/governance-token/01-对外白皮书-草案.md || fail "missing governance-token/01-对外白皮书-草案.md"
test -f docs/spec/governance-token/02-对内技术规格-草案.md || fail "missing governance-token/02-对内技术规格-草案.md"

grep -q '07-开发流程与顺序' docs/spec/governance-token/README.md \
  || fail "governance-token/README.md should reference 07 §二 2.4 linkage"

# 英文分册（与中文同主题；定稿前均为 DRAFT）
test -f docs/spec/governance-token/en/README.md || fail "missing governance-token/en/README.md"
test -f docs/spec/governance-token/en/01-external-litepaper-draft.md || fail "missing en/01-external-litepaper-draft.md"
test -f docs/spec/governance-token/en/02-internal-tech-spec-draft.md || fail "missing en/02-internal-tech-spec-draft.md"
test -f docs/spec/governance-token/LEGAL-SIGNOFF-CHECKLIST.md || fail "missing governance-token/LEGAL-SIGNOFF-CHECKLIST.md"
test -f docs/spec/governance-token/03-对外材料-PPT与白皮书数据页摘抄索引.md || fail "missing governance-token/03-对外材料-PPT与白皮书数据页摘抄索引.md"
test -f docs/spec/governance-token/protocol-ssot.v1.md || fail "missing governance-token/protocol-ssot.v1.md (Protocol Convergence P0)"
test -f docs/spec/governance-token/fund-flow-ssot.v1.md || fail "missing governance-token/fund-flow-ssot.v1.md"
test -f docs/spec/governance-token/state-machine.v1.md || fail "missing governance-token/state-machine.v1.md"
test -f docs/spec/governance-token/84-valuation-anchor-P1-memo.md || fail "missing 84-valuation-anchor-P1-memo.md (84 §3.6 engineering fill)"
grep -qF 'Option C' docs/spec/governance-token/84-valuation-anchor-P1-memo.md \
  || fail "84-valuation-anchor-P1-memo must document Option C engineering default"
grep -q 'protocol-ssot.v1' docs/spec/governance-token/README.md \
  || fail "governance-token/README.md must reference protocol-ssot.v1"
grep -q 'protocol-ssot.v1' docs/spec/84-第一阶段10国Country-Pool发行参数总表.md \
  || fail "84 must reference protocol-ssot.v1 (Protocol Convergence)"
test -f docs/spec/08-4-附录-收益流闭环图-FeeRouter-Target.md || fail "missing docs/spec/08-4-附录-收益流闭环图-FeeRouter-Target.md"

grep -q '08-4-附录-收益流闭环图-FeeRouter-Target' docs/spec/00-文档索引.md \
  || fail "docs/spec/00-文档索引.md must reference 08-4-附录-收益流闭环图-FeeRouter-Target"

# 84 文首 **版本**：x.y.z 须与 API 镜像 `governance_doc_reference::DOC_VERSION` 同号（04 §3.4 protocol-reference）
DOC84="docs/spec/84-第一阶段10国Country-Pool发行参数总表.md"
REF_RS="crates/api/src/routes/governance_doc_reference.rs"
v84="$(grep -m1 '^\*\*版本\*\*' "$DOC84" | sed -E 's/.*[：:][[:space:]]*([0-9]+\.[0-9]+\.[0-9]+).*/\1/')"
[[ -n "$v84" ]] || fail "could not parse 84 doc version from $DOC84 (**版本** line)"
grep -qF "pub const DOC_VERSION: &str = \"$v84\";" "$REF_RS" \
  || fail "$REF_RS DOC_VERSION must match 84 header version ($v84); bump both when editing 84 **版本**"

# 08-4 附录 §2 Mermaid 与 GET protocol-reference 静态 JSON（84 镜像）须同批改百分数
ANNEX08="docs/spec/08-4-附录-收益流闭环图-FeeRouter-Target.md"
grep -qF 'C45["国家可分配费用桶 45%"]' "$ANNEX08" \
  || fail "$ANNEX08: expected Mermaid node C45 (国家桶 45%)"
grep -qF 'G55["Global Pool 55%"]' "$ANNEX08" \
  || fail "$ANNEX08: expected Mermaid node G55 (Global 55%)"
grep -qF 'T65["TTG 质押激励 65% of Global"]' "$ANNEX08" \
  || fail "$ANNEX08: expected Mermaid node T65 (TTG 65% of Global)"
grep -qF 'R20["储备 20% of Global"]' "$ANNEX08" \
  || fail "$ANNEX08: expected Mermaid node R20 (储备 20% of Global)"
grep -qF 'O15["运营 15% of Global"]' "$ANNEX08" \
  || fail "$ANNEX08: expected Mermaid node O15 (运营 15% of Global)"
grep -qF '"country_bucket": 45,' "$REF_RS" \
  || fail "$REF_RS: expected fee_router.layer1 country_bucket 45 (sync with $ANNEX08)"
grep -qF '"global_pool": 55' "$REF_RS" \
  || fail "$REF_RS: expected fee_router.layer1 global_pool 55"
grep -qF '"ttg_stakers": 65,' "$REF_RS" \
  || fail "$REF_RS: expected global_pool_split_percent.ttg_stakers 65"
grep -qF '"reserve": 20,' "$REF_RS" \
  || fail "$REF_RS: expected global_pool_split_percent.reserve 20"
grep -qF '"operations": 15' "$REF_RS" \
  || fail "$REF_RS: expected global_pool_split_percent.operations 15"

PDP08="docs/spec/08-4-对外口径包.md"
grep -qF 'NAV 窗口赎回' "$PDP08" \
  || fail "$PDP08: missing Protocol Convergence R4 NAV redemption public wording"
grep -qF 'OperationsVault 已按预算释放并花费的运营费用不可退还' "$PDP08" \
  || fail "$PDP08: missing Protocol Convergence R5 OperationsVault non-refundable wording"

bash scripts/gates/check-protocol-ssot-convergence.sh

echo "OK: governance doc linkage checks passed."
