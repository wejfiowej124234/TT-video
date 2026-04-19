#!/usr/bin/env bash
# CI 豁免机读校验（W-DRIFT-CI / PR 模板）：
# - 若 PR 描述中未出现「ci_exempt=yes;」则视为未申请豁免，exit 0。
# - 若出现「ci_exempt=yes;」则必须同时包含 workitem_id / reason / approver / evidence=...
#   且 evidence 路径须为 evidence/ci_exemptions/PR-<PR号>-<workitem_id>.md 且在本 PR diff 中。
# 用法: PR_BODY、PR_NUMBER 由 workflow 注入；第一个参数为 BASE_SHA（与 check-08-consistency 一致）。
# 见: .github/PULL_REQUEST_TEMPLATE.md、evidence/ci_exemptions/README.md、docs/spec/08-5-CI与一致性落地说明.md
set -euo pipefail

BASE_SHA="${1:-}"
if [[ -z "$BASE_SHA" ]]; then
  echo "check-ci-exemption.sh: missing BASE_SHA (PR base commit)" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if ! git rev-parse -q --verify "${BASE_SHA}^{commit}" >/dev/null 2>&1; then
  echo "check-ci-exemption.sh: invalid BASE_SHA: ${BASE_SHA}" >&2
  exit 2
fi

trim() {
  local s="${1:-}"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

# 单行化，便于 ';' 分隔解析（reason 等字段内勿写未转义分号）
flat="$(printf '%s' "${PR_BODY:-}" | tr '\r\n' ' ')"

if [[ "$flat" != *'ci_exempt=yes;'* ]]; then
  echo "OK: no ci_exempt=yes; in PR body — skip CI exemption evidence gate."
  exit 0
fi

prn="$(trim "${PR_NUMBER:-}")"
if [[ -z "$prn" ]]; then
  echo "RULE=CI_EXEMPT PR_NUMBER is empty but ci_exempt=yes; was present" >&2
  exit 1
fi

extract_field() {
  local key="$1"
  local tmp
  if ! tmp="$(printf '%s' "$flat" | grep -oE "${key}=[^;]+" | head -n1)"; then
    return 1
  fi
  printf '%s' "${tmp#"${key}="}"
}

wi_raw="$(extract_field workitem_id)" || {
  echo "RULE=CI_EXEMPT missing workitem_id=… (required when ci_exempt=yes;)" >&2
  exit 1
}
reason_raw="$(extract_field reason)" || {
  echo "RULE=CI_EXEMPT missing reason=… (required when ci_exempt=yes;)" >&2
  exit 1
}
approver_raw="$(extract_field approver)" || {
  echo "RULE=CI_EXEMPT missing approver=… (required when ci_exempt=yes;)" >&2
  exit 1
}
evidence_raw="$(extract_field evidence)" || {
  echo "RULE=CI_EXEMPT missing evidence=… (required when ci_exempt=yes;)" >&2
  exit 1
}

wi="$(trim "$wi_raw")"
reason="$(trim "$reason_raw")"
approver="$(trim "$approver_raw")"
evidence_path="$(trim "$evidence_raw")"

if [[ -z "$wi" || -z "$reason" || -z "$approver" || -z "$evidence_path" ]]; then
  echo "RULE=CI_EXEMPT empty workitem_id/reason/approver/evidence after trim" >&2
  exit 1
fi

expected="evidence/ci_exemptions/PR-${prn}-${wi}.md"
if [[ "$evidence_path" != "$expected" ]]; then
  echo "RULE=CI_EXEMPT evidence path must be exactly: ${expected}" >&2
  echo "  got: ${evidence_path}" >&2
  exit 1
fi

if [[ "$evidence_path" == *'..'/* || "$evidence_path" == *'/..' || "$evidence_path" == '..'/* ]]; then
  echo "RULE=CI_EXEMPT evidence path must not contain .." >&2
  exit 1
fi

if ! git diff --name-only "${BASE_SHA}" HEAD | grep -qxF "$evidence_path"; then
  echo "RULE=CI_EXEMPT evidence file not part of this PR diff vs BASE: ${evidence_path}" >&2
  exit 1
fi

if [[ ! -f "$evidence_path" ]]; then
  echo "RULE=CI_EXEMPT evidence file missing on disk: ${evidence_path}" >&2
  exit 1
fi

echo "OK: ci_exempt=yes; validated fields + evidence in PR: ${evidence_path}"
exit 0
