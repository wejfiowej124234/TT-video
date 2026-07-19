// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IEscrowServiceFeeSync
 * @notice Minimal Escrow callback for SettlementRouter → service-fee SM sync (L5-A)
 */
interface IEscrowServiceFeeSync {
    function notifySettlementDistributable() external;

    function notifySettlementDistributed() external;
}
