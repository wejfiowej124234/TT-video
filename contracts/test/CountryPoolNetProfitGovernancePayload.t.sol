// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/CountryPoolNetProfitLedger.sol";
import "../src/UnallocatedStewardPathVault.sol";
import "../src/CountryPoolNetProfitGovernancePayload.sol";

contract CountryPoolNetProfitGovernancePayloadTest is Test {
    function test_T_GOV_03_CPNP_selector_parity() public pure {
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_OPEN_EPOCH,
            CountryPoolNetProfitLedger.openEpoch.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_RECORD_ACCRUAL,
            CountryPoolNetProfitLedger.recordAccrual.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_RECORD_ACCRUAL_BATCH,
            CountryPoolNetProfitLedger.recordAccrualBatch.selector
        );
        CountryPoolNetProfitLedger.AccrualLine[] memory lines = new CountryPoolNetProfitLedger.AccrualLine[](1);
        lines[0] = CountryPoolNetProfitLedger.AccrualLine({
            accountCode: bytes32("R-100"),
            amountSigned: 100,
            ref: bytes32("gov-batch")
        });
        bytes memory encoded =
            CountryPoolNetProfitGovernancePayload.encodeRecordAccrualBatch(1, lines);
        bytes memory expected =
            abi.encodeWithSelector(CountryPoolNetProfitLedger.recordAccrualBatch.selector, 1, lines);
        assertEq(encoded, expected);
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_CLOSE_EPOCH,
            CountryPoolNetProfitLedger.closeEpoch.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_FUND_LEDGER_FOR_SPLIT,
            CountryPoolNetProfitLedger.fundLedgerForSplit.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_SPLIT_NET_PROFIT,
            CountryPoolNetProfitLedger.splitNetProfit.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_RELEASE_UNALLOCATED,
            UnallocatedStewardPathVault.releaseToStewardPath.selector
        );
    }
}
