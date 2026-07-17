#!/usr/bin/env bash
# PSG Production Cert hard gate — source from production deploy scripts.
#   source "$ROOT/scripts/ops/lib/psg-production-cert-hard-gate.sh"
#   psg_require_production_cert_pass || exit 2
#
# Evidence: evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json
# Bypass (INCIDENT ONLY): TT_PGC_BYPASS=1 + TT_PGC_BYPASS_REASON + TT_PGC_BYPASS_OWNER
set -euo pipefail

psg_require_production_cert_pass() {
  local root="${PGC_ROOT:-${ROOT:-}}"
  if [[ -z "$root" ]]; then
    root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
  fi
  local evid="${TT_PSG_PRODUCTION_CERT_EVIDENCE:-$root/evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json}"

  if [[ "${PSG_ALLOW_DESTRUCTIVE_CERT:-0}" == "1" ]]; then
    echo "TT_PGC_HARD_GATE: OK destructive cert pipeline (PSG_ALLOW_DESTRUCTIVE_CERT=1)"
    return 0
  fi

  if [[ "${TT_PGC_BYPASS:-0}" == "1" ]]; then
    [[ -n "${TT_PGC_BYPASS_REASON:-}" ]] || {
      echo "TT_PGC_HARD_GATE: FAIL bypass requires TT_PGC_BYPASS_REASON" >&2
      return 2
    }
    [[ -n "${TT_PGC_BYPASS_OWNER:-}" ]] || {
      echo "TT_PGC_HARD_GATE: FAIL bypass requires TT_PGC_BYPASS_OWNER" >&2
      return 2
    }
    echo "TT_PGC_HARD_GATE: BYPASS incident-only owner=${TT_PGC_BYPASS_OWNER} reason=${TT_PGC_BYPASS_REASON}"
    echo "TT_PGC_HARD_GATE: NOTE re-run bash scripts/gates/run-psg-production-cert.sh after incident"
    return 0
  fi

  if [[ ! -f "$evid" ]]; then
    echo "TT_PGC_HARD_GATE: FAIL missing $evid" >&2
    echo "TT_PGC_HARD_GATE: run bash scripts/gates/run-psg-production-cert.sh until TT_PSG_PRODUCTION_CERT: PASS" >&2
    return 2
  fi

  local status
  status="$(node -e "const j=require(process.argv[1]); process.stdout.write(String(j.status||j.machine_status||''))" "$evid" 2>/dev/null || true)"
  if [[ "$status" != "PASS" ]]; then
    echo "TT_PGC_HARD_GATE: FAIL TT_PSG_PRODUCTION_CERT status=${status:-UNKNOWN} (need PASS)" >&2
    echo "TT_PGC_HARD_GATE: evidence=$evid" >&2
    return 2
  fi

  local ssot repro envA
  ssot="$(node -e "const j=require(process.argv[1]); const a=j.admission||{}; process.stdout.write(String(a.TT_PSG_SSOT_DRIFT||''))" "$evid" 2>/dev/null || true)"
  repro="$(node -e "const j=require(process.argv[1]); const a=j.admission||{}; process.stdout.write(String(a.TT_PSG_REPRODUCIBLE_BUILD||''))" "$evid" 2>/dev/null || true)"
  envA="$(node -e "const j=require(process.argv[1]); const a=j.admission||{}; process.stdout.write(String(a.TT_PSG_ENVIRONMENT_ALIGNMENT||''))" "$evid" 2>/dev/null || true)"
  if [[ -n "$ssot" || -n "$repro" || -n "$envA" ]]; then
    [[ "$ssot" == "PASS" && "$repro" == "PASS" && "$envA" == "PASS" ]] || {
      echo "TT_PGC_HARD_GATE: FAIL admission trio ssot=$ssot repro=$repro env=$envA" >&2
      return 2
    }
  fi

  echo "TT_PGC_HARD_GATE: OK TT_PSG_PRODUCTION_CERT=PASS"
  return 0
}
