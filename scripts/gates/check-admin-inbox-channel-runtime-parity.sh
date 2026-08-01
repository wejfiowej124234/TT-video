#!/usr/bin/env bash
# Admin Inbox channel runtime parity · crash-class hard gate
# Fails closed when Focus UI queue keys drift from channels/HREFS/fetch
# (root of recurring: Cannot read properties of undefined (reading 'permissionDenied')).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"
echo "TT_ADMIN_INBOX_CHANNEL_RUNTIME_PARITY: running vitest contract…"
npx vitest run lib/admin/adminInboxChannelRuntimeParity.contract.test.ts --reporter=dot
echo "TT_ADMIN_INBOX_CHANNEL_RUNTIME_PARITY: PASS"
