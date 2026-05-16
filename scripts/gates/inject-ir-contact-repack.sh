#!/usr/bin/env bash
# Inject FUNDRAISING_IR_CONTACT_* into 00-START-HERE.txt and rebuild LP zip (phase ①).
# Usage (repo root):
#   export FUNDRAISING_IR_CONTACT_NAME="..."
#   export FUNDRAISING_IR_CONTACT_EMAIL="..."
#   export FUNDRAISING_IR_CONTACT_PHONE="..."   # optional
#   bash scripts/gates/inject-ir-contact-repack.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -z "${FUNDRAISING_IR_CONTACT_NAME:-}" || -z "${FUNDRAISING_IR_CONTACT_EMAIL:-}" ]]; then
  echo "FAIL: set FUNDRAISING_IR_CONTACT_NAME and FUNDRAISING_IR_CONTACT_EMAIL" >&2
  echo "See docs/fundraising/data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md §2.2" >&2
  exit 2
fi

export RELEASE_LP_SKIP_PDF=1
export RELEASE_LP_SKIP_DECK=1
bash scripts/gates/release-investor-lp-pack.sh

echo "OK: IR contact injected; zip refreshed under dist/"
