#!/usr/bin/env bash
# Evidence-driven PG-P0-ESC stamp (protocol bilateral closure)
#
#   bash scripts/dev/run-pg-p0-esc-closure-evidence.sh           # evaluate only
#   bash scripts/dev/run-pg-p0-esc-closure-evidence.sh --apply   # stamp CLOSED iff eligible
#
# Protocol CLOSED ≠ Hard Gate PASS. R-01 / Shadow / G6 / Owner auth remain separate axes.
# Does NOT: broadcast · ACTIVE flip · mainnet_cutover_authorized
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID_DIR="$ROOT/evidence/GO_production_readiness/mainnet-cutover-hard-gate"
mkdir -p "$EVID_DIR"
EVID="$EVID_DIR/PG-P0-ESC-CLOSURE-EVIDENCE-LATEST.json"
READINESS="$ROOT/registry/web3-mainnet-production-readiness-gate.v1.yaml"
APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

echo "run-pg-p0-esc-closure-evidence: running Layer B + settlement audit…" >&2
node "$ROOT/scripts/dev/run-escrow-bilateral-layer-b-evidence.cjs" >/tmp/tt-layer-b-out.json 2>/tmp/tt-layer-b-err.txt || true
node "$ROOT/scripts/dev/run-escrow-settlement-authorization-audit.cjs" >/tmp/tt-esc-audit-out.json 2>/tmp/tt-esc-audit-err.txt || true

LAYER_A="$ROOT/evidence/GO_production_readiness/escrow-bilateral-layer-a/ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json"
LAYER_B="$ROOT/evidence/GO_production_readiness/escrow-bilateral-layer-b/ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.json"
SETTLE="$ROOT/evidence/GO_production_readiness/escrow-settlement-authorization/ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json"
POLICY="$ROOT/registry/escrow-bilateral-mainnet-policy.v1.yaml"
ODR="$ROOT/docs/runbook/ESCROW-BILATERAL-SETTLEMENT-OWNER-DECISION-RECORD-V1.md"

EVID_PATH="$EVID" node <<'NODE'
const fs=require('fs');
const path=require('path');
const ROOT=process.cwd();
const outPath=process.env.EVID_PATH;
function readJ(p){try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return null}}
function readT(p){try{return fs.readFileSync(p,'utf8')}catch{return ''}}
const la=readJ(path.join(ROOT,'evidence/GO_production_readiness/escrow-bilateral-layer-a/ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json'));
const lb=readJ(path.join(ROOT,'evidence/GO_production_readiness/escrow-bilateral-layer-b/ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.json'));
const se=readJ(path.join(ROOT,'evidence/GO_production_readiness/escrow-settlement-authorization/ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json'));
const policy=readT('registry/escrow-bilateral-mainnet-policy.v1.yaml');
const odr=readT('docs/runbook/ESCROW-BILATERAL-SETTLEMENT-OWNER-DECISION-RECORD-V1.md');
const p0 = (se && (se.summary?.gaps_p0 ?? se.p0 ?? 1));
const checks={
  layer_a: !!(la && la.verdict==='LAYER_A_EVIDENCE_PASS'),
  layer_b: !!(lb && lb.verdict==='LAYER_B_EVIDENCE_PASS'),
  settlement_p0_zero: p0 === 0,
  settlement_verdict: se?.verdict||null,
  v1_forbidden: /mainnet_deploy:\s*FORBIDDEN/.test(policy),
  deploy_script: fs.existsSync('contracts/script/DeployEscrowFactoryV2.s.sol'),
  odr_b3: /B3.*EscrowV2|EscrowV2 \+ FactoryV2/.test(odr),
};
const open=[];
for (const [k,v] of Object.entries(checks)) {
  if (k==='settlement_verdict') continue;
  if (!v) open.push(k);
}
const eligible=open.length===0;
const out={
  schema:'traveltrust.pg_p0_esc_closure_evidence.v1',
  generated_utc:new Date().toISOString(),
  verdict: eligible?'APPLY_ELIGIBLE':'INCOMPLETE',
  checks,
  open,
  note:'Protocol PG-P0-ESC CLOSED enables Escrow final freeze --apply. Hard Gate still requires R-01/Shadow/G6/Owner (separate axes). No ACTIVE flip.',
  remaining_hard_gate_axes:['AXIS-08','AXIS-12','AXIS-13','AXIS-14'],
};
fs.mkdirSync(path.dirname(outPath), {recursive:true});
fs.writeFileSync(outPath, JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({eligible, open, settlement_verdict:checks.settlement_verdict, layer_b:checks.layer_b, p0}));
NODE

echo "run-pg-p0-esc-closure-evidence: wrote $EVID" >&2
ELIGIBLE="$(node -e "console.log(require(process.argv[1]).verdict==='APPLY_ELIGIBLE'?'1':'0')" "$EVID")"
echo "run-pg-p0-esc-closure-evidence: eligible=$ELIGIBLE" >&2

if [[ "$APPLY" -eq 1 ]]; then
  if [[ "$ELIGIBLE" != "1" ]]; then
    echo "run-pg-p0-esc-closure-evidence: REFUSE --apply (not APPLY_ELIGIBLE)" >&2
    node -e "console.log(JSON.stringify(require(process.argv[1]).open,null,2))" "$EVID" >&2
    exit 2
  fi
  python - "$READINESS" <<'PY'
import pathlib, re, sys
p = pathlib.Path(sys.argv[1])
t = p.read_text(encoding="utf-8")
t2, n = re.subn(r"(pg_p0_esc:\s*)OPEN", r"\g<1>CLOSED", t, count=1)
if n != 1:
    # already closed or missing
    if re.search(r"pg_p0_esc:\s*CLOSED", t):
        print("pg_p0_esc already CLOSED", file=sys.stderr)
        sys.exit(0)
    print("FAIL: could not stamp pg_p0_esc CLOSED", file=sys.stderr)
    sys.exit(2)
p.write_text(t2, encoding="utf-8")
print("stamped pg_p0_esc: CLOSED", file=sys.stderr)
PY
  node -e "
const fs=require('fs');
const p=process.argv[1];
const j=JSON.parse(fs.readFileSync(p,'utf8'));
j.verdict='CLOSED';
j.registry_stamped=true;
j.stamped_utc=new Date().toISOString();
fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
" "$EVID"
  echo "run-pg-p0-esc-closure-evidence: APPLY ok — pg_p0_esc=CLOSED (protocol)" >&2
fi

exit 0
