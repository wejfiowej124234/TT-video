#!/usr/bin/env bash
# Preview LP send preflight (phase 1): status + zip freshness + optional rebuild/pre-send.
# Does NOT prove Legal sign-off, demo final, phase 2 Pack A, or phase 3 production.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1 && python -c "import sys" >/dev/null 2>&1; then
  PY=python
else
  echo "FAIL: need working python3 or python" >&2
  exit 2
fi

echo "== [1/4] IR outbound pending =="
bash scripts/gates/ir-outbound-status.sh

release="$("$PY" -c "import json; print(json.load(open('registry/fundraising-external-numeric-anchors.v1.json', encoding='utf-8'))['release'])")"
zip_path="dist/TravelTrust-Investor-Materials-v${release}.zip"

echo ""
echo "== [2/4] Zip freshness (export-ready vs dist) =="
"$PY" - <<'PY' || true
import json
import sys
from pathlib import Path

root = Path(".")
release = json.loads(
    (root / "registry/fundraising-external-numeric-anchors.v1.json").read_text(encoding="utf-8")
)["release"]
zip_p = root / "dist" / f"TravelTrust-Investor-Materials-v{release}.zip"
erd = root / "docs/fundraising/external/export-ready"
pdfs = [p for p in erd.rglob("*.pdf") if p.is_file()]
if not zip_p.is_file():
    print(f"WARN: missing {zip_p} — run: bash scripts/gates/release-investor-lp-pack.sh")
    sys.exit(0)
if not pdfs:
    print("SKIP: no export-ready PDFs to compare")
    sys.exit(0)
zt = zip_p.stat().st_mtime
mt = max(p.stat().st_mtime for p in pdfs)
if mt > zt + 120:
    print(
        f"WARN: export-ready PDF newest mtime > zip by >120s — rebuild before send:\n"
        f"  bash scripts/gates/release-investor-lp-pack.sh"
    )
else:
    print(f"OK: zip mtime not older than export-ready PDFs ({zip_p.name})")
PY

if [[ "${IR_PREVIEW_SEND_REBUILD:-}" == "1" ]]; then
  echo ""
  echo "== [3/4] Rebuild LP pack (IR_PREVIEW_SEND_REBUILD=1) =="
  bash scripts/gates/release-investor-lp-pack.sh
elif [[ ! -f "$zip_path" ]]; then
  echo ""
  echo "FAIL: missing $zip_path — set IR_PREVIEW_SEND_REBUILD=1 or run release-investor-lp-pack.sh" >&2
  exit 1
else
  echo ""
  echo "== [3/4] Zip present (skip rebuild; set IR_PREVIEW_SEND_REBUILD=1 to rebuild) =="
fi

if [[ -f "$zip_path" && "${IR_PREVIEW_SEND_SKIP_PRE_SEND:-}" != "1" ]]; then
  echo ""
  echo "== [4/4] LP pre-send machine check =="
  bash scripts/gates/check-fundraising-lp-pack-pre-send.sh
else
  echo ""
  echo "== [4/4] Pre-send: SKIP (no zip or IR_PREVIEW_SEND_SKIP_PRE_SEND=1) =="
fi

if [[ -f "$zip_path" ]]; then
  echo ""
  echo "== [5/5] Zip layout verify =="
  "$PY" scripts/tools/verify_investor_zip_layout.py --zip "$zip_path"
fi

echo ""
echo "== FINAL send blockers (informational; preview may proceed) =="
bash scripts/gates/check-fundraising-lp-final-human-blockers.sh || true

echo ""
echo "MANUAL (preview send, phase 1):"
echo "  - IR-PRE-SEND-MANUAL-001.md sec 7 (email; mark preview)"
echo "  - internal/19 + board/distribution-log.md after send"
echo "  - internal/33 Legal column still required for final (not preview-as-final)"
echo "OK: ir-preview-send-preflight (machine path; not Legal/demo/Pack A II closure)"
