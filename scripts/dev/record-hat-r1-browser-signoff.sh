#!/usr/bin/env bash
# 人工浏览器 checklist 签核落盘（须先 PASS_MACHINE）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SIGNER="${HAT_R1_BROWSER_SIGNOFF_SIGNER:-Solo Maintainer}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BROWSER_EVID="$(ls -td "$ROOT/evidence/GO_gov_freeze_v2_browser_acceptance"/*/ 2>/dev/null | head -1 || true)"
[[ -n "$BROWSER_EVID" && -f "${BROWSER_EVID}PASS.json" ]] || {
  echo "record-hat-r1-browser-signoff: FAIL run run-gov-freeze-v2-browser-page-acceptance.sh first" >&2
  exit 2
}

HAT_EVID="${HAT_R1_EVID_DIR:-$ROOT/evidence/GO_hat_r1_sepolia/browser-signoff/${STAMP}}"
mkdir -p "$HAT_EVID"

cat >"$HAT_EVID/HUMAN-BROWSER-SIGNOFF.json" <<EOF
{
  "audit_id": "G24-BROWSER-ACCEPT-01",
  "signoff_utc": "${STAMP}",
  "signer": "${SIGNER}",
  "baseline": "GOV-FREEZE-V2-TTG-APPROVE-PIVOT",
  "ssot": "TTG-TOKENOMICS-FREEZE-V1",
  "machine_evidence": "${BROWSER_EVID}",
  "verdict": "HUMAN_SIGNED",
  "note": "Latest TTG + GovFreeze V2 only · LEGACY read-only archived"
}
EOF

cp "${BROWSER_EVID}HUMAN-PAGE-ACCEPTANCE-CHECKLIST.md" "$HAT_EVID/" 2>/dev/null || true
echo "HAT_R1_BROWSER_SIGNOFF: OK evidence=${HAT_EVID}"
echo "export HAT_R1_BROWSER_ACCEPT_OK=1"
