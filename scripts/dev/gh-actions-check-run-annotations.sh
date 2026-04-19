#!/usr/bin/env bash
# Print GitHub Actions check-run annotations for the first job of the latest workflow run.
# Use when jobs show steps: [] / ~3s wall time — same source as UI "Annotations" (e.g. Billing).
# Requires: gh auth login (repo scope). Optional: GH_REPO, WORKFLOW (default: build.yml)
set -euo pipefail
REPO="${GH_REPO:-TT-Expedition/TT-Expedition}"
WF="${1:-build.yml}"
RUN_ID="$(gh run list --repo "$REPO" --workflow "$WF" --limit 1 --json databaseId --jq '.[0].databaseId')"
JOB_ID="$(gh api "repos/$REPO/actions/runs/$RUN_ID/jobs" --jq '.jobs[0].id')"
echo "repo=$REPO workflow=$WF run_id=$RUN_ID job_id=$JOB_ID"
gh api "repos/$REPO/check-runs/$JOB_ID/annotations" --jq '.[] | "\(.annotation_level): \(.message)"'
