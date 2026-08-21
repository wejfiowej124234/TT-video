// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title ITtgV9GuideOrderBondLifecycle
 * @notice Escrow / order-state adapter for Guide per-order USDC Performance Bond.
 * @dev Orthogonal to tourist Escrow principal. Merchant is NOT wired through this interface.
 *      Local: MockGuideOrderBondLifecycle. Production: Escrow/Dispute bridge (future wiring).
 */
interface ITtgV9GuideOrderBondLifecycle {
    /// @notice True iff tourist+guide confirmed and fulfillment has not started for `orderId`.
    function canLockBond(bytes32 orderId, address guide) external view returns (bool);
}
