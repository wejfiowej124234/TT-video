#!/usr/bin/env bash
# Inspect the latest (or given) L4 parallel CI workflow run — job annotations vs "green" summary.
# Requires: gh CLI, authenticated (gh auth login).
# Usage:
#   bash scripts/dev/gh-l4-run-inspect.sh
#   bash scripts/dev/gh-l4-run-inspect.sh 24619014632
# Env:
#   GH_REPO    default TT-Expedition/TT-Expedition
#   GH_BRANCH  optional: `gh run list --branch …` (e.g. dependabot/github_actions/actions/upload-artifact-7)
set -euo pipefail

REPO="${GH_REPO:-TT-Expedition/TT-Expedition}"
WF="l4-parallel-ci.yml"

branch_args=()
if [[ -n "${GH_BRANCH:-}" ]]; then
  branch_args=(--branch "$GH_BRANCH")
fi

if [[ "${1:-}" =~ ^[0-9]+$ ]]; then
  RID="$1"
else
  RID="$(gh run list --repo "$REPO" --workflow "$WF" "${branch_args[@]}" --limit 1 --json databaseId --jq '.[0].databaseId')"
fi

if [[ -z "$RID" || "$RID" == "null" ]]; then
  echo "No workflow run found for --workflow $WF in $REPO" >&2
  exit 1
fi

echo "== gh run view $RID ($REPO) =="
gh run view "$RID" --repo "$REPO" || true

echo ""
echo "== Jobs (JSON: name, conclusion, databaseId) =="
gh api "repos/${REPO}/actions/runs/${RID}/jobs" --jq '.jobs[] | {name, conclusion, databaseId, status}'

echo ""
echo "== Per-job detail (incl. billing / annotations) =="
gh api "repos/${REPO}/actions/runs/${RID}/jobs" --jq -r '.jobs[].databaseId | tostring' | while IFS= read -r _jid; do
  [[ -z "${_jid}" ]] && continue
  echo "--- gh run view --job=${_jid} ---"
  gh run view "$RID" --repo "$REPO" --job="${_jid}" || true
  echo ""
done

echo "Tip: GH_BRANCH=<branch> bash scripts/dev/gh-l4-run-inspect.sh  # latest run on that branch"
echo "Runbook: docs/runbook/TT-L4-PARALLEL-CI-001.md"
