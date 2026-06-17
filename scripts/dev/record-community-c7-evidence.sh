#!/usr/bin/env bash
# C7 证据：社区 93 Matrix staging 归档 · report.json 机读校验（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C7"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
export COMMUNITY_C7_EVIDENCE_DIR="$EVID"
if [[ -z "${DATABASE_URL:-}" ]]; then
  DATABASE_URL="postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging"
  export DATABASE_URL
fi

{
  echo "TT_COMMUNITY_C7_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"

  echo "--- verify C1–C6 STATUS.txt = PASS ---"
  for slot in C1 C2 C3 C4 C5 C6; do
    st_file="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/${slot}/STATUS.txt"
    if [[ ! -f "$st_file" ]]; then
      echo "FAIL: missing $st_file"
      exit 1
    fi
    grep -q "^status: PASS" "$st_file" || {
      echo "FAIL: ${slot} STATUS not PASS"
      exit 1
    }
    echo "OK ${slot} STATUS PASS"
  done

  echo "--- spot-check matrix IT (live cargo · C2/C5/C6) ---"
  export P3_CHAIN_OFF=1
  spot_log="$EVID/spotcheck-it-${STAMP}.log"
  {
    echo "SPOTCHECK C2 upload png"
    if cargo test -p traveltrust-api matrix_93_d_com_c2_upload_png_ok_pg 2>&1 | tee -a "$spot_log" | grep -q "test result: ok"; then
      export C7_SPOTCHECK_C2=PASS
    else
      export C7_SPOTCHECK_C2=FAIL
      exit 1
    fi
    echo "SPOTCHECK C5 multi-image read"
    if cargo test -p traveltrust-api matrix_93_d_com_c5_multi_image_feed_profile_explore_read_pg 2>&1 | tee -a "$spot_log" | grep -q "test result: ok"; then
      export C7_SPOTCHECK_C5=PASS
    else
      export C7_SPOTCHECK_C5=FAIL
      exit 1
    fi
    echo "SPOTCHECK C6 follow graph"
    if cargo test -p traveltrust-api matrix_93_d_com_c6_follow_followers_following_feed_profile_pg 2>&1 | tee -a "$spot_log" | grep -q "test result: ok"; then
      export C7_SPOTCHECK_C6=PASS
    else
      export C7_SPOTCHECK_C6=FAIL
      exit 1
    fi
  }
  ln -sfn "$(basename "$spot_log")" "$EVID/latest-spotcheck-it.log"
  cp -f "$spot_log" "$EVID/spotcheck-it.log"

  echo "--- generate community C7 staging matrix report ---"
  python "$REPO_ROOT/scripts/gen-community-c7-staging-matrix-report.py"
  test -f "$EVID/report.json" || { echo "FAIL: report.json missing"; exit 1; }
  test -f "$EVID/matrix-summary.md" || { echo "FAIL: matrix-summary.md missing"; exit 1; }

  echo "--- R-001 machine validation ---"
  python "$REPO_ROOT/scripts/validate-regression-report.py" "$EVID/report.json"
  rg="$(grep -o '"release_gate": "[^"]*"' "$EVID/report.json" | head -1 | sed 's/.*": "\([^"]*\)".*/\1/')"
  echo "report release_gate=${rg}"
  if [[ "$rg" == "NO_GO" ]]; then
    echo "FAIL: release_gate NO_GO"
    exit 1
  fi

  echo "TT_COMMUNITY_C7_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
cp -f "$RUN_LOG" "$EVID/run.log"

STATUS="$EVID/STATUS.txt"
rg_final="$(grep -o '"release_gate": "[^"]*"' "$EVID/report.json" | head -1 | sed 's/.*": "\([^"]*\)".*/\1/')"
{
  echo "phase: ② testnet C7 (93 matrix staging validation)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "release_gate: ${rg_final}"
  echo "report: report.json"
  echo "matrix_summary: matrix-summary.md"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C7 slot PASS only — NOT Phase ② GO / NOT C8-C12 GO / NOT full-site 93 GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
