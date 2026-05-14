#!/usr/bin/env bash
set -euo pipefail
_here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_py=""
for _c in python python3 py; do
  if command -v "${_c}" >/dev/null 2>&1; then
    _out="$("${_c}" -c "print('tt9620ok')" 2>/dev/null)" || true
    if [[ "${_out}" == "tt9620ok" ]]; then
      _py="${_c}"
      break
    fi
  fi
done
if [[ -z "${_py}" ]] && command -v py >/dev/null 2>&1; then
  _out="$(py -3 -c "print('tt9620ok')" 2>/dev/null)" || true
  if [[ "${_out}" == "tt9620ok" ]]; then
    exec py -3 "$_here/gates/tt-96-20-appendix-e-audit-controls-vs-source.py" "$@"
  fi
fi
if [[ -z "${_py}" ]]; then
  echo "tt-96-20-appendix-e-audit-controls-vs-source: need working Python 3 (Windows Store python3 shim is not enough; install python.org or use py -3)" >&2
  exit 2
fi
exec "${_py}" "$_here/gates/tt-96-20-appendix-e-audit-controls-vs-source.py" "$@"
