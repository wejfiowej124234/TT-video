#!/usr/bin/env bash
# Fail if export-ready signed PDFs/PPTX exist on disk but are not in the git index (monorepo drift).
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

release="$("$PY" -c "import json; print(json.load(open('registry/fundraising-external-numeric-anchors.v1.json',encoding='utf-8'))['release'])")"
erd="$ROOT/docs/fundraising/external/export-ready"
missing=0

while IFS= read -r -d '' f; do
  rel="${f#"$ROOT"/}"
  if ! git ls-files --error-unmatch "$rel" >/dev/null 2>&1; then
    echo "MISSING from git index: $rel"
    missing=1
  fi
done < <(find "$erd" -maxdepth 1 -type f \( -name "*.pdf" -o -name "*.pptx" -o -name "00-START-HERE.txt" \) -print0)

demo_mp4="$erd/demo/TravelTrust-Product-Demo-v${release}.mp4"
if [[ -f "$demo_mp4" ]]; then
  rel="${demo_mp4#"$ROOT"/}"
  if ! git ls-files --error-unmatch "$rel" >/dev/null 2>&1; then
    echo "MISSING from git index: $rel"
    missing=1
  fi
fi

if [[ "$missing" -ne 0 ]]; then
  echo ""
  echo "Fix: git add docs/fundraising/external/export-ready/"
  echo "Mirror-only is not enough — monorepo should track export-ready artifacts for IDE/Git parity."
  exit 1
fi

echo "OK: export-ready signed artifacts are in the monorepo git index (release v${release})"
