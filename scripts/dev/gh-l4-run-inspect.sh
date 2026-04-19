#!/usr/bin/env bash
# Inspect the latest (or given) L4 parallel CI workflow run — job annotations vs "green" summary.
# Requires: gh CLI, authenticated (gh auth login).
# Usage:
#   bash scripts/dev/gh-l4-run-inspect.sh
#   bash scripts/dev/gh-l4-run-inspect.sh 24619014632
# Env:
#   GH_REPO   default TT-Expedition/TT-Expedition
set -euo pipefail

REPO="${GH_REPO:-TT-Expedition/TT-Expedition}"
WF="l4-parallel-ci.yml"

if [[ "${1:-}" =~ ^[0-9]+$ ]]; then
  RID="$1"
else
  RID="$(gh run list --repo "$REPO" --workflow "$WF" --limit 1 --json databaseId --jq '.[0].databaseId')"
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
echo "Tip: open job URL from run page, or: gh run view --repo $REPO --job=<job_databaseId>"
echo "Runbook: docs/runbook/TT-L4-PARALLEL-CI-001.md"
