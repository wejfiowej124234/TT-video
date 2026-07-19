#!/usr/bin/env bash
# Evidence-driven Escrow Final Freeze digests (AXIS-02)
#
#   bash scripts/dev/run-escrow-final-freeze-evidence.sh
#   bash scripts/dev/run-escrow-final-freeze-evidence.sh --apply
#
# --apply only if: digests ready AND pg_p0_esc=CLOSED in readiness registry.
# Today PG-P0-ESC is OPEN → digests recorded, FROZEN refused (correct).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID_DIR="$ROOT/evidence/GO_production_readiness/mainnet-cutover-hard-gate"
mkdir -p "$EVID_DIR"
EVID="$EVID_DIR/ESCROW-FINAL-FREEZE-EVIDENCE-LATEST.json"
REG="$ROOT/registry/escrow-final-freeze-mainnet.v1.yaml"
READINESS="$ROOT/registry/web3-mainnet-production-readiness-gate.v1.yaml"
APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

GIT_SHA="$(git rev-parse HEAD)"
UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Build contracts for artifact digests (optional — reuse out/ when present)
NEED_BUILD=1
[[ "${SKIP_FORGE_BUILD:-0}" == "1" ]] && NEED_BUILD=0
if [[ -f "$ROOT/contracts/out/EscrowV2.sol/EscrowV2.json" && -f "$ROOT/contracts/out/EscrowFactoryV2.sol/EscrowFactoryV2.json" ]]; then
  NEED_BUILD=0
fi
if [[ "${FORCE_FORGE_BUILD:-0}" == "1" ]]; then
  NEED_BUILD=1
fi
if [[ "$NEED_BUILD" -eq 1 ]]; then
  (cd "$ROOT/contracts" && forge build -q) || {
    echo "run-escrow-final-freeze-evidence: forge build failed" >&2
    exit 1
  }
else
  echo "run-escrow-final-freeze-evidence: reusing contracts/out artifacts (set FORCE_FORGE_BUILD=1 to rebuild)" >&2
fi

artifact_digest() {
  local name="$1"
  local f
  f="$(find "$ROOT/contracts/out" -path "*/${name}.sol/${name}.json" 2>/dev/null | head -n1)"
  if [[ -z "$f" || ! -f "$f" ]]; then
    echo "MISSING"
    return 0
  fi
  sha256sum "$f" | awk '{print $1}'
}

src_digest() {
  local f="$1"
  [[ -f "$f" ]] || { echo "MISSING"; return 0; }
  sha256sum "$f" | awk '{print $1}'
}

FAC_ART="$(artifact_digest EscrowFactoryV2)"
IMP_ART="$(artifact_digest EscrowV2)"
FAC_SRC="$(src_digest contracts/src/EscrowFactoryV2.sol)"
IMP_SRC="$(src_digest contracts/src/EscrowV2.sol)"
ABI_FAC="$(src_digest contracts/abi/EscrowFactoryV2.json)"
# EscrowV2 abi may or may not exist
ABI_IMP="MISSING"
[[ -f contracts/abi/EscrowV2.json ]] && ABI_IMP="$(src_digest contracts/abi/EscrowV2.json)"

PG="$(grep -E '^[[:space:]]+pg_p0_esc:' "$READINESS" | head -n1 | awk '{print $2}' | tr -d '"')"

READY=1
for d in "$FAC_ART" "$IMP_ART" "$FAC_SRC" "$IMP_SRC"; do
  [[ "$d" == "MISSING" || -z "$d" ]] && READY=0
done

VERDICT="DIGESTS_COMPUTED"
[[ "$READY" -eq 1 ]] && VERDICT="DIGESTS_READY"
[[ "$PG" == "CLOSED" && "$READY" -eq 1 ]] && VERDICT="APPLY_ELIGIBLE"

node -e "
const fs=require('fs');
const out={
  schema:'traveltrust.escrow_final_freeze_evidence.v1',
  machine_key:'TT_ESCROW_FINAL_FREEZE_MAINNET',
  generated_utc:process.argv[1],
  verdict:process.argv[2],
  freeze_git_sha:process.argv[3],
  pg_p0_esc:process.argv[4],
  v1_mainnet:'FORBIDDEN',
  digests:{
    EscrowFactoryV2_artifact:process.argv[5],
    EscrowV2_artifact:process.argv[6],
    EscrowFactoryV2_src:process.argv[7],
    EscrowV2_src:process.argv[8],
    EscrowFactoryV2_abi:process.argv[9],
    EscrowV2_abi:process.argv[10]
  },
  apply_eligible: process.argv[2]==='APPLY_ELIGIBLE',
  note:'FROZEN refused until pg_p0_esc=CLOSED. Digests alone do not authorize mainnet escrow.'
};
fs.writeFileSync(process.argv[11], JSON.stringify(out,null,2)+'\\n');
" "$UTC" "$VERDICT" "$GIT_SHA" "$PG" \
  "$FAC_ART" "$IMP_ART" "$FAC_SRC" "$IMP_SRC" "$ABI_FAC" "$ABI_IMP" "$EVID"

echo "run-escrow-final-freeze-evidence: $VERDICT pg_p0_esc=$PG" >&2
echo "run-escrow-final-freeze-evidence: wrote $EVID" >&2

# Always fill digest fields in registry (evidence), never FROZEN unless eligible
python - "$REG" "$GIT_SHA" "$FAC_ART" "$IMP_ART" "$ABI_FAC" <<'PY'
import sys, pathlib, re
reg_path, git_sha, fac, imp, abi = sys.argv[1:6]
text = pathlib.Path(reg_path).read_text(encoding="utf-8")
text = re.sub(r"(freeze_git_sha:\s*).*", rf"\g<1>{git_sha}", text, count=1)
text = re.sub(r"(factory_artifact_digest:\s*).*", rf"\g<1>{fac}", text, count=1)
text = re.sub(r"(implementation_artifact_digest:\s*).*", rf"\g<1>{imp}", text, count=1)
text = re.sub(r"(abi_digest:\s*).*", rf"\g<1>{abi}", text, count=1)
# do not touch status here
pathlib.Path(reg_path).write_text(text, encoding="utf-8")
print("digests written to escrow-final-freeze registry (status untouched)", file=sys.stderr)
PY

if [[ "$APPLY" -eq 1 ]]; then
  if [[ "$VERDICT" != "APPLY_ELIGIBLE" ]]; then
    echo "run-escrow-final-freeze-evidence: REFUSE --apply (need DIGESTS + pg_p0_esc=CLOSED, got $VERDICT / $PG)" >&2
    exit 2
  fi
  python - "$REG" <<'PY'
import pathlib, re, sys
p = pathlib.Path(sys.argv[1])
t = p.read_text(encoding="utf-8")
t = re.sub(r"(^status:\s*).*$", r"\g<1>FROZEN", t, count=1, flags=re.M)
p.write_text(t, encoding="utf-8")
PY
  node -e "
const fs=require('fs');
const p=process.argv[1];
const j=JSON.parse(fs.readFileSync(p,'utf8'));
j.verdict='FROZEN'; j.registry_stamped=true;
fs.writeFileSync(p, JSON.stringify(j,null,2)+'\\n');
" "$EVID"
  echo "run-escrow-final-freeze-evidence: APPLY ok — status=FROZEN" >&2
fi

exit 0
