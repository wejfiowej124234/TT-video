#!/usr/bin/env bash
# Initialize TTG certification execution session (146-row ledger + Cert #1 prep link)
#
#   bash scripts/dev/init-ttg-cert-execution-session.sh
#   bash scripts/dev/init-ttg-cert-execution-session.sh --stamp 20260616T100231Z
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP=""
for arg in "$@"; do
  case "$arg" in
    --stamp) STAMP="$2"; shift 2 ;;
    *) echo "unknown arg $arg" >&2; exit 2 ;;
  esac
done

if [[ -z "$STAMP" ]]; then
  STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
fi

EVID="$ROOT/evidence/GO_ttg_cert/${STAMP}"
mkdir -p "$EVID"/{human-uat/{recordings,screenshots},walkthrough/{multi-identity,admin,safe,finance},phase-b/{unpause,execute,treasury-spend,unstake},incidents/tabletop,drills,gorp-signoff,ledger-screenshots}

bash "$ROOT/scripts/dev/run-govfreeze-v2-human-screen-acceptance-prep.sh" >/tmp/ttg-cert1-prep.log
PREP_STAMP="$(cat "$ROOT/evidence/GO_govfreeze_v2_human_screen_acceptance/latest-stamp.txt" | tr -d '\r\n')"
PREP_DIR="evidence/GO_govfreeze_v2_human_screen_acceptance/${PREP_STAMP}"

ln -sfn "../../GO_govfreeze_v2_human_screen_acceptance/${PREP_STAMP}" "$EVID/human-uat/prep-link" 2>/dev/null || {
  cp -R "$ROOT/$PREP_DIR/HUMAN-SCREEN-ACCEPTANCE-CHECKLIST.md" "$EVID/human-uat/" 2>/dev/null || true
  cp "$ROOT/$PREP_DIR/routes.json" "$EVID/human-uat/" 2>/dev/null || true
}

python "$ROOT/scripts/dev/gen-ttg-cert-execution-ledger.py" --cert-stamp "$STAMP"

python <<PY
import json, pathlib
root = pathlib.Path("$ROOT")
evid = root / "evidence/GO_ttg_cert/${STAMP}"
overrides_path = root / "docs/spec/governance-token/artifacts/ttg-governance-tier-overrides.v1.json"
cert_done = []
if overrides_path.exists():
    cert_done = json.loads(overrides_path.read_text(encoding="utf-8")).get("cert_queue_completed", [])
cert_queue = f"{len(cert_done)}/12"
active = min(len(cert_done) + 1, 12) if len(cert_done) < 12 else 12
next_steps = {
    1: "Cert #1 Human UAT — Owner recordings + screenshots per ledger row cert_step=1",
    2: "Cert #2 Multi Identity — walkthrough/multi-identity recordings + MULTI-IDENTITY-WALKTHROUGH-SIGNOFF.json",
}
manifest = {
    "session_id": "GO_ttg_cert",
    "stamp_utc": "${STAMP}",
    "phase": "②",
    "baseline": "GovFreeze V2 Clean Baseline",
    "frontend_base": "http://127.0.0.1:3012",
    "api_base": "http://127.0.0.1:8080",
    "cert_queue": f"{cert_queue} · active={active}" if cert_done else cert_queue,
    "prep_link": "${PREP_DIR}",
    "ai_pre_human_uat": "bash scripts/dev/run-ai-pre-human-uat-check.sh",
    "ai_pre_human_uat_required_before_cert1": True,
    "ledger": f"evidence/GO_ttg_cert/${STAMP}/CERT-EXECUTION-LEDGER.v1.json",
    "next_step": next_steps.get(active, f"Cert #{active} — see CERT-EXECUTION-LEDGER.v1.json"),
    "signoff_command": f'bash scripts/dev/complete-ttg-cert-step.sh --cert {active} --stamp ${STAMP} --signer "Sebastian Ward"',
    "honest_boundary": "prep + ledger ≠ HUMAN_DONE; tier upgrades only after signoff evidence",
}
(evid / "SESSION-MANIFEST.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

echo "$STAMP" >"$ROOT/evidence/GO_ttg_cert/latest-stamp.txt"
REC_REQUIRED="$(python -c "import json; d=json.load(open('$EVID/CERT-EXECUTION-LEDGER.v1.json', encoding='utf-8')); print(d['recording_required_rows'])")"
echo "TTG_CERT_SESSION: OK stamp=$STAMP evidence=$EVID prep=$PREP_DIR"
echo "TTG_CERT_EXECUTION: NEXT cert=1 rows=146 recording_required=$REC_REQUIRED"
