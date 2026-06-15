// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./CountryPoolNetProfitLedger.sol";
import "./UnallocatedStewardPathVault.sol";

/**
 * @title CountryPoolNetProfitGovernancePayload
 * @notice B-407 parallel · Governor→Timelock calldata SSOT for D-4555-B Settlement.
 */
library CountryPoolNetProfitGovernancePayload {
    bytes4 internal constant CPNP_OPEN_EPOCH = CountryPoolNetProfitLedger.openEpoch.selector;
    bytes4 internal constant CPNP_RECORD_ACCRUAL = CountryPoolNetProfitLedger.recordAccrual.selector;
    bytes4 internal constant CPNP_CLOSE_EPOCH = CountryPoolNetProfitLedger.closeEpoch.selector;
    bytes4 internal constant CPNP_FUND_LEDGER_FOR_SPLIT = CountryPoolNetProfitLedger.fundLedgerForSplit.selector;
    bytes4 internal constant CPNP_SPLIT_NET_PROFIT = CountryPoolNetProfitLedger.splitNetProfit.selector;
    bytes4 internal constant CPNP_SET_ACTIVE_STEWARD = CountryPoolNetProfitLedger.setActiveStewardConfig.selector;
    bytes4 internal constant CPNP_SET_SETTLEMENT_PARAMS = CountryPoolNetProfitLedger.setSettlementParams.selector;
    bytes4 internal constant CPNP_RELEASE_UNALLOCATED =
        UnallocatedStewardPathVault.releaseToStewardPath.selector;

    function encodeOpenEpoch(uint256 epochId, uint64 epochStart, uint64 epochEnd)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(CountryPoolNetProfitLedger.openEpoch.selector, epochId, epochStart, epochEnd);
    }

    function encodeRecordAccrual(uint256 epochId, bytes32 accountCode, int256 amountSigned, bytes32 ref)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            CountryPoolNetProfitLedger.recordAccrual.selector, epochId, accountCode, amountSigned, ref
        );
    }

    function encodeCloseEpoch(uint256 epochId) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(CountryPoolNetProfitLedger.closeEpoch.selector, epochId);
    }

    function encodeFundLedgerForSplit(uint256 epochId) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(CountryPoolNetProfitLedger.fundLedgerForSplit.selector, epochId);
    }

    function encodeSplitNetProfit(uint256 epochId) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(CountryPoolNetProfitLedger.splitNetProfit.selector, epochId);
    }

    function encodeSetActiveStewardConfig(
        address steward,
        bool suspended,
        bool tenureSatisfied,
        bool tenureWaived,
        bytes32 proposalRef
    ) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(
            CountryPoolNetProfitLedger.setActiveStewardConfig.selector,
            steward,
            suspended,
            tenureSatisfied,
            tenureWaived,
            proposalRef
        );
    }

    function encodeReleaseUnallocated(uint256 amount, bytes32 proposalRef) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(
            UnallocatedStewardPathVault.releaseToStewardPath.selector, amount, proposalRef
        );
    }
}
