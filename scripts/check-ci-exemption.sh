#!/usr/bin/env bash
# CI 豁免门禁（P0）：豁免本身必须可机读、可取证、不可口头放行。
#
# 触发条件：PR body 含 `ci_exempt=yes`
# 强制要求：workitem_id + reason + approver + evidence 文件入仓
#
# 依赖：在 GitHub Actions pull_request 事件中设置 PR_BODY/PR_NUMBER/BASE_SHA。

set -euo pipefail

BASE_SHA="${1:-${BASE_SHA:-}}"
if [ -z "$BASE_SHA" ]; then
  echo "FAIL: missing BASE_SHA (pass as arg1 or env BASE_SHA)"
  exit 1
fi

PR_BODY="${PR_BODY:-}"
PR_NUMBER="${PR_NUMBER:-}"

if [ -z "$PR_BODY" ]; then
  echo "FAIL: PR_BODY is empty (PR template may be missing)"
  exit 1
fi

if ! echo "$PR_BODY" | grep -q "08 门禁必填"; then
  echo "FAIL: PR template section '08 门禁必填' is missing"
  exit 1
fi

exempt="no"
if echo "$PR_BODY" | tr 'A-Z' 'a-z' | grep -q "ci_exempt=yes"; then
  exempt="yes"
fi

if [ "$exempt" = "no" ]; then
  echo "OK: ci_exempt=no"
  exit 0
fi

# Parse required fields (machine-readable format enforced by PR template)
workitem_id="$(echo "$PR_BODY" | sed -n 's/.*workitem_id=\([^;|[:space:]]\+\).*/\1/p' | head -1)"
reason="$(echo "$PR_BODY" | sed -n 's/.*reason=\([^;|]\+\).*/\1/p' | head -1 | sed 's/[[:space:]]*$//')"
approver="$(echo "$PR_BODY" | sed -n 's/.*approver=\([^;|[:space:]]\+\).*/\1/p' | head -1)"
evidence_path="$(echo "$PR_BODY" | sed -n 's/.*evidence=\([^;|[:space:]]\+\).*/\1/p' | head -1)"

if [ -z "$workitem_id" ] || ! echo "$workitem_id" | grep -qE '^W-'; then
  echo "FAIL: ci_exempt=yes requires workitem_id=W-..."
  exit 1
fi
if [ -z "$reason" ] || [ "$reason" = "unset" ]; then
  echo "FAIL: ci_exempt=yes requires reason=..."
  exit 1
fi
if [ -z "$approver" ] || [ "$approver" = "unset" ]; then
  echo "FAIL: ci_exempt=yes requires approver=..."
  exit 1
fi
if [ -z "$evidence_path" ]; then
  echo "FAIL: ci_exempt=yes requires evidence=... (file path under evidence/)"
  exit 1
fi
if ! echo "$evidence_path" | grep -qE '^evidence/'; then
  echo "FAIL: evidence path must be under evidence/"
  exit 1
fi

if [ -z "$PR_NUMBER" ]; then
  echo "FAIL: PR_NUMBER is empty"
  exit 1
fi

expected_prefix="evidence/ci_exemptions/PR-${PR_NUMBER}"
if ! echo "$evidence_path" | grep -q "$expected_prefix"; then
  echo "FAIL: evidence path must start with ${expected_prefix} (to bind exemption record to PR number)"
  exit 1
fi

changed_files="$(git diff --name-only "$BASE_SHA" HEAD || true)"
if ! echo "$changed_files" | grep -q "^${evidence_path}$"; then
  echo "FAIL: evidence file must be added/modified in this PR: ${evidence_path}"
  echo "      hint: add it under evidence/ci_exemptions/ and commit"
  exit 1
fi

if [ ! -f "$evidence_path" ]; then
  echo "FAIL: evidence file not found in checkout: ${evidence_path}"
  exit 1
fi

echo "OK: ci_exempt=yes with traceable evidence (${evidence_path})"
