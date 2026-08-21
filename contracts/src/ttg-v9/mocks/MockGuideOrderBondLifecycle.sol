// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ITtgV9GuideOrderBondLifecycle} from "../ITtgV9GuideOrderBondLifecycle.sol";

/**
 * @title MockGuideOrderBondLifecycle
 * @notice Local Escrow/order-state machine stand-in for Guide Order Bond tests.
 */
contract MockGuideOrderBondLifecycle is ITtgV9GuideOrderBondLifecycle {
    mapping(bytes32 => address) public confirmedGuide;
    mapping(bytes32 => bool) public fulfillmentStarted;
    mapping(bytes32 => bool) public cancelled;

    function setConfirmed(bytes32 orderId, address guide) external {
        confirmedGuide[orderId] = guide;
    }

    function setFulfillmentStarted(bytes32 orderId, bool started) external {
        fulfillmentStarted[orderId] = started;
    }

    function setCancelled(bytes32 orderId, bool v) external {
        cancelled[orderId] = v;
    }

    function canLockBond(bytes32 orderId, address guide) external view returns (bool) {
        if (cancelled[orderId]) return false;
        if (fulfillmentStarted[orderId]) return false;
        return confirmedGuide[orderId] == guide && guide != address(0);
    }
}
