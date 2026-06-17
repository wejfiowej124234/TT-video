#!/usr/bin/env bash
# Phase① site page forensic (PEB execution track · NOT a new DOMAIN)
#
#   bash scripts/dev/run-phase1-site-page-forensic.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="${SITE_FORENSIC_OUT:-$ROOT/evidence/GO_phase1_convergence/site-page-forensic/$(date -u +%Y%m%dT%H%M%SZ 2>/dev/null || python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")}"

echo "== Phase① Site Page Forensic (v1.14.0 frozen scope) =="
python "$ROOT/scripts/dev/generate-phase1-site-page-forensic.py" "$OUT"
echo "Report: $OUT/SITE-PAGE-FORENSIC-REPORT.md"
