#!/usr/bin/env bash
# VACANCY_LEDGER_V1_PROTOCOL_COMPLETE — completion gate (S1+S2+S3+PCM · no Dashboard required).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTRACTS="$ROOT/contracts"

echo "== Vacancy Ledger V1 Protocol Complete Gate =="

cd "$CONTRACTS"

echo ">> S1 · VacancyLedgerCore"
forge test --match-contract VacancyLedgerCore -q

echo ">> S2 · VacancyLedgerInvariant (G22-D-05)"
forge test --match-contract VacancyLedgerInvariant -q

echo ">> S3a · split → sweep"
forge test --match-contract CountryPoolNetProfitVacancyS3a -q

echo ">> S3b · StewardActivationEpoch Gate"
forge test --match-contract CountryPoolNetProfitVacancyS3b -q

echo ">> S3c · DAO Disbursement"
forge test --match-contract CountryPoolNetProfitVacancyS3c -q

echo ">> CountryPoolNetProfit regression"
forge test --match-contract CountryPoolNetProfit -q

echo ">> Completion marker"
forge test --match-contract VacancyLedgerV1CompletionGate -q

echo ""
echo "VACANCY_LEDGER_V1_PROTOCOL_COMPLETE: PASS"
echo "PCM: docs/spec/governance-token/protocol-conformance-matrix-vacancy-ledger-v1.md (v1.8+)"
