#!/usr/bin/env bash
# Evidence-driven Mainnet Release Freeze (AXIS-01)
#
#   bash scripts/dev/run-mainnet-release-freeze-evidence.sh           # compute only
#   bash scripts/dev/run-mainnet-release-freeze-evidence.sh --apply    # stamp FROZEN iff digests ready
#
# Does NOT: broadcast · ACTIVE flip · mainnet_cutover_authorized
# paper_freeze_forbidden: digests must be real; --apply refuses TBD/empty.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID_DIR="$ROOT/evidence/GO_production_readiness/mainnet-cutover-hard-gate"
mkdir -p "$EVID_DIR"
EVID="$EVID_DIR/RELEASE-FREEZE-EVIDENCE-LATEST.json"
REG="$ROOT/registry/mainnet-release-freeze.v1.yaml"
APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

digest_tree() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    echo "MISSING"
    return 0
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    find "$dir" -type f \
      ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/target/*' ! -path '*/out/*' \
      ! -path '*/cache/*' ! -name '*.log' \
      -print0 2>/dev/null \
      | sort -z \
      | xargs -0 sha256sum 2>/dev/null \
      | sha256sum \
      | awk '{print $1}'
  else
    echo "NO_SHA256SUM"
  fi
}

GIT_SHA="$(git rev-parse HEAD 2>/dev/null || echo UNKNOWN)"
UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

CONTRACTS_SRC="$(digest_tree contracts/src)"
API_SRC="$(digest_tree crates/api/src)"
CORE_SRC="$(digest_tree crates/core/src)"
FE_LIB="$(digest_tree frontend/lib)"
FE_APP="$(digest_tree frontend/app)"
INDEXER="MISSING"
if [[ -d crates/indexer/src ]]; then
  INDEXER="$(digest_tree crates/indexer/src)"
elif [[ -d crates/api/src/routes/internal/indexer ]]; then
  INDEXER="$(digest_tree crates/api/src/routes/internal/indexer)"
fi

READY=1
for d in "$CONTRACTS_SRC" "$API_SRC" "$CORE_SRC" "$FE_LIB" "$FE_APP" "$INDEXER"; do
  case "$d" in
    MISSING|NO_SHA256SUM|"") READY=0 ;;
  esac
done
[[ "$GIT_SHA" == "UNKNOWN" ]] && READY=0

# Dirty worktree policy:
# - Default: refuse --apply if ANY dirty (strict).
# - TT_RELEASE_FREEZE_ALLOW_UNRELATED_DIRTY=1: allow --apply when freeze_scope paths are clean
#   relative to HEAD (after focused hardgate commit). Records unrelated_dirty_count in evidence.
FREEZE_SCOPE_PATHS=(
  "contracts/src/Escrow.sol"
  "contracts/src/EscrowV2.sol"
  "contracts/src/EscrowFactoryV2.sol"
  "registry/mainnet-cutover-hard-gate.v1.yaml"
  "registry/mainnet-release-freeze.v1.yaml"
  "registry/escrow-final-freeze-mainnet.v1.yaml"
  "registry/web3-mainnet-production-readiness-gate.v1.yaml"
  "scripts/gates/check-mainnet-cutover-hard-gate.sh"
  "scripts/dev/run-mainnet-release-freeze-evidence.sh"
)

scope_dirty=0
for p in "${FREEZE_SCOPE_PATHS[@]}"; do
  if [[ -n "$(git status --porcelain -- "$p" 2>/dev/null || true)" ]]; then
    scope_dirty=1
  fi
done

DIRTY=0
if [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; then
  DIRTY=1
fi

UNRELATED_DIRTY_COUNT=0
if [[ "$DIRTY" -eq 1 ]]; then
  UNRELATED_DIRTY_COUNT="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
fi

APPLY_OK=0
VERDICT="DIGESTS_INCOMPLETE"
if [[ "$READY" -eq 1 ]]; then
  if [[ "$DIRTY" -eq 0 ]]; then
    VERDICT="DIGESTS_READY"
    APPLY_OK=1
  elif [[ "${TT_RELEASE_FREEZE_ALLOW_UNRELATED_DIRTY:-0}" == "1" && "$scope_dirty" -eq 0 ]]; then
    VERDICT="DIGESTS_READY_SCOPED_CLEAN"
    APPLY_OK=1
  else
    VERDICT="DIGESTS_READY_DIRTY_WORKTREE"
    APPLY_OK=0
  fi
fi

node -e "
const fs=require('fs');
const out={
  schema:'traveltrust.mainnet_release_freeze_evidence.v1',
  machine_key:'TT_MAINNET_RELEASE_FREEZE',
  generated_utc:process.argv[1],
  verdict:process.argv[2],
  pin:{
    git_sha:process.argv[3],
    worktree_dirty: process.argv[4]==='1',
    scope_dirty: process.argv[5]==='1',
    unrelated_dirty_count: Number(process.argv[6]),
    allow_unrelated_dirty: process.argv[7]==='1'
  },
  checksums:{
    contracts_src:process.argv[8],
    api_src:process.argv[9],
    core_src:process.argv[10],
    frontend_lib:process.argv[11],
    frontend_app:process.argv[12],
    indexer:process.argv[13]
  },
  registry_active_baseline:'v311_sepolia_clean_baseline',
  active_flip:false,
  broadcast:false,
  apply_eligible: process.argv[14]==='1',
  note:'FROZEN via --apply when digests ready and (clean tree OR scoped-clean with TT_RELEASE_FREEZE_ALLOW_UNRELATED_DIRTY=1). ACTIVE stays Sepolia.'
};
fs.writeFileSync(process.argv[15], JSON.stringify(out,null,2)+'\\n');
" "$UTC" "$VERDICT" "$GIT_SHA" "$DIRTY" "$scope_dirty" "$UNRELATED_DIRTY_COUNT" \
  "${TT_RELEASE_FREEZE_ALLOW_UNRELATED_DIRTY:-0}" \
  "$CONTRACTS_SRC" "$API_SRC" "$CORE_SRC" "$FE_LIB" "$FE_APP" "$INDEXER" \
  "$APPLY_OK" "$EVID"

echo "run-mainnet-release-freeze-evidence: $VERDICT sha=$GIT_SHA dirty=$DIRTY scope_dirty=$scope_dirty" >&2
echo "run-mainnet-release-freeze-evidence: wrote $EVID" >&2

if [[ "$APPLY" -eq 1 ]]; then
  if [[ "$APPLY_OK" -ne 1 ]]; then
    echo "run-mainnet-release-freeze-evidence: REFUSE --apply (need digests + clean or scoped-clean)" >&2
    echo "  dirty=$DIRTY scope_dirty=$scope_dirty ready=$READY" >&2
    echo "  tip: commit hardgate scope, then TT_RELEASE_FREEZE_ALLOW_UNRELATED_DIRTY=1 --apply" >&2
    exit 2
  fi
  python - "$REG" "$GIT_SHA" "$UTC" "$CONTRACTS_SRC" "$API_SRC" "$FE_LIB" "$INDEXER" <<'PY'
import sys, pathlib, re
reg_path, git_sha, utc, c, api, fe, idx = sys.argv[1:8]
text = pathlib.Path(reg_path).read_text(encoding="utf-8")
def sub(key, val, t):
    return re.sub(rf"(^{key}:\s*).*$", rf"\g<1>{val}", t, count=1, flags=re.M)
text = sub("status", "FROZEN", text)
text = re.sub(r"(git_sha:\s*).*", rf"\g<1>{git_sha}", text, count=1)
text = re.sub(r"(release_tag:\s*).*", r"\g<1>mainnet-release-freeze-prep", text, count=1)
text = re.sub(r"(freeze_utc:\s*).*", rf"\g<1>\"{utc}\"", text, count=1)
text = re.sub(r"(owner_attestor:\s*).*", r"\g<1>evidence-script-run-mainnet-release-freeze-evidence", text, count=1)
text = re.sub(r"(contracts_digest:\s*).*", rf"\g<1>{c}", text, count=1)
text = re.sub(r"(api_crate_digest:\s*).*", rf"\g<1>{api}", text, count=1)
text = re.sub(r"(frontend_build_digest:\s*).*", rf"\g<1>{fe}", text, count=1)
text = re.sub(r"(indexer_digest:\s*).*", rf"\g<1>{idx}", text, count=1)
pathlib.Path(reg_path).write_text(text, encoding="utf-8")
print("stamped registry FROZEN", file=sys.stderr)
PY
  node -e "
const fs=require('fs');
const p=process.argv[1];
const j=JSON.parse(fs.readFileSync(p,'utf8'));
j.verdict='FROZEN';
j.registry_stamped=true;
j.stamped_utc=new Date().toISOString();
fs.writeFileSync(p, JSON.stringify(j,null,2)+'\\n');
" "$EVID"
  echo "run-mainnet-release-freeze-evidence: APPLY ok — registry status=FROZEN (ACTIVE unchanged)" >&2
fi

exit 0
