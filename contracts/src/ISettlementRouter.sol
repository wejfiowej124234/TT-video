// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title ISettlementRouter
 * @notice Protocol v2 settlement entry (PREP · TARGET SSOT)
 * @dev Escrow → SettlementRouter → FeeRouter/PRP split. Not broadcast until G-RC CLOSED.
 */
interface ISettlementRouter {
    enum OrderSettlementState {
        None,
        FeeLegReceived,
        SettlementReady,
        Distributable,
        Distributed
    }

    event FeeLegReceived(
        bytes32 indexed orderId,
        address indexed token,
        uint256 amount,
        address indexed from
    );
    event SettlementReadyMarked(bytes32 indexed orderId);
    event DistributableMarked(bytes32 indexed orderId, uint256 amount);
    event Distributed(
        bytes32 indexed orderId,
        uint256 stewardShare,
        uint256 poolShare,
        address stewardRecipient,
        address projectRevenuePool
    );

    function settlementState(bytes32 orderId) external view returns (OrderSettlementState);

    function feeLegAmount(bytes32 orderId) external view returns (uint256);

    /// @notice Pull platform fee leg into router (ops/timelock after release)
    function receiveFeeLeg(bytes32 orderId, address token, uint256 amount, address from) external;

    /// @notice Escrow-callable fee ingress (L5-A wire · Escrow must be allowlisted)
    function receiveFeeLegFromEscrow(bytes32 orderId, address token, uint256 amount) external;

    /// @notice Protocol gate before distributable (auditable intermediate)
    function markSettlementReady(bytes32 orderId) external;

    /// @notice Advance to distributable after SettlementReady
    function markDistributable(bytes32 orderId) external;

    /// @notice 45/55 or 100% PRP per V311DistributableSplit
    function distribute(
        bytes32 orderId,
        bool stewardActive,
        address stewardRecipient,
        address projectRevenuePool
    ) external;
}
