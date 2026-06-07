#!/usr/bin/env bash
# Phase ②.9 post-freeze · R4–R7 staging gate chain (Owner machine · fly auth required)
#
#   fly auth login
#   bash scripts/dev/run-phase29-post-freeze-gate-chain.sh
#
# Runs: S5 deploy → alignment → Deep Gate (G04 no skip) → S6 → HAT
# Updates: evidence/.../phase29-release-polish/post29-gate-chain-latest/PHASE3-ENTRY-REVIEW.md
# Exit: 0 only if Deep Gate PASS + HAT PASS
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$ROOT/evidence/GO_phase2_testnet_20260526/phase29-release-polish/post29-gate-chain-${STAMP}"
LATEST="$ROOT/evidence/GO_phase2_testnet_20260526/phase29-release-polish/post29-gate-chain-latest"
LOG="$OUT/gate-chain.log"
SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"

mkdir -p "$OUT"
exec > >(tee -a "$LOG") 2>&1

fail() {
  write_review NO_GO "$*"
  echo "phase29-post-freeze-gate-chain: FAIL $*"
  exit 2
}

write_review() {
  local verdict="$1"
  local note="${2:-}"
  mkdir -p "$LATEST"
  cat > "$OUT/PHASE3-ENTRY-REVIEW.md" <<EOF
# Phase ③ Entry Review · Post ②.9 freeze

**Reviewed at:** ${STAMP}  
**Commit:** \`${SHA}\`  
**Conclusion:** **${verdict}**

${note}

\`\`\`text
PHASE3_ENTRY_GATE: HOLD
PHASE3_ENTRY_REVIEW: ${verdict}
PHASE29_RELEASE_POLISH: W3_DONE · UI_FROZEN
PHASE29_FREEZE_COMMIT: ${SHA}
\`\`\`
EOF
  cp -f "$OUT/PHASE3-ENTRY-REVIEW.md" "$LATEST/PHASE3-ENTRY-REVIEW.md"
  echo "${verdict}" > "$OUT/STATUS.txt"
  echo "phase3_entry_gate: HOLD" >> "$OUT/STATUS.txt"
  echo "freeze_commit: ${SHA}" >> "$OUT/STATUS.txt"
  echo "at: ${STAMP}" >> "$OUT/STATUS.txt"
}

echo "== phase29 post-freeze gate chain · ${STAMP} =="
echo "commit=${SHA}"
echo "OUT=${OUT}"

command -v fly >/dev/null 2>&1 || fail "fly CLI missing"
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated — run: fly auth login"

echo ""
echo "=== R4 · S5 deploy ==="
bash "$ROOT/scripts/dev/run-phase2-local-staging-parity-gate.sh" --deploy \
  || fail "S5 deploy failed"

echo ""
echo "=== R4 · alignment ==="
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" \
  || fail "staging alignment FAIL"

echo ""
echo "=== R5 · Deep Release Gate (G04 mandatory) ==="
export PHASE2_EXPECT_GIT_SHA="$SHA"
bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" \
  || fail "Deep Release Gate FAIL — see evidence/GO_phase2_testnet_20260526/deep-release-gate/"

echo ""
echo "=== R6 · S6 staging retest ==="
bash "$ROOT/scripts/dev/run-phase2-local-staging-parity-gate.sh" --staging-retest \
  || fail "S6 staging retest failed"

echo ""
echo "=== R7 · HAT ==="
bash "$ROOT/scripts/dev/run-phase28-human-acceptance-test.sh" \
  || fail "HAT FAIL"

write_review READY "All R4–R7 gates green on staging at commit \`${SHA}\`. Owner may flip PHASE3_ENTRY_GATE after sign-off."

# Sync runbook banner (best-effort)
REPORT="$ROOT/docs/runbook/HUMAN-ACCEPTANCE-REPORT.md"
if [[ -f "$REPORT" ]]; then
  python - "$REPORT" "$STAMP" "$SHA" <<'PY' || true
import re, sys
path, stamp, sha = sys.argv[1:4]
text = open(path, encoding="utf-8").read()
text = re.sub(
    r"PHASE3_ENTRY_GATE: HOLD[^\n]*",
    "PHASE3_ENTRY_GATE: HOLD  # flip to READY after Owner sign-off",
    text,
    count=1,
)
text = re.sub(
    r"PHASE3_ENTRY_REVIEW: NO_GO",
    "PHASE3_ENTRY_REVIEW: READY",
    text,
)
if "Post-freeze R4–R7" not in text:
    banner = (
        f"\n> **Post-freeze R4–R7 ({stamp}):** READY at `{sha}` — see "
        f"`evidence/GO_phase2_testnet_20260526/phase29-release-polish/post29-gate-chain-latest/`\n"
    )
    text = text.replace("\n---\n\n## Executive verdict", banner + "\n---\n\n## Executive verdict", 1)
open(path, "w", encoding="utf-8").write(text)
PY
fi

echo ""
echo "phase29-post-freeze-gate-chain: OK"
echo "PHASE3_ENTRY_REVIEW: READY (Owner sign-off still required for PHASE3_ENTRY_GATE)"
echo "Evidence: $OUT"
