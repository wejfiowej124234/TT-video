// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title ServiceFeeStatesV311
 * @notice V3.1.1 Distributable Platform Service Fee state machine (offline enum SSOT)
 * @dev F-04 full Escrow wiring remains OPEN until Escrow/Backend emit transitions.
 */
library ServiceFeeStatesV311 {
    enum State {
        SERVICE_FEE_PENDING,
        SERVICE_FEE_LOCKED,
        /// Protocol v2 gate (Step 2.5) · preferred before DISTRIBUTABLE
        SERVICE_FEE_SETTLEMENT_READY,
        SERVICE_FEE_DISTRIBUTABLE,
        SERVICE_FEE_DISTRIBUTED
    }

    error InvalidTransition(State from, State to);

    function canTransition(State from, State to) internal pure returns (bool) {
        if (from == State.SERVICE_FEE_PENDING && to == State.SERVICE_FEE_LOCKED) return true;
        // TARGET path: LOCKED → SETTLEMENT_READY → DISTRIBUTABLE
        if (from == State.SERVICE_FEE_LOCKED && to == State.SERVICE_FEE_SETTLEMENT_READY) return true;
        if (from == State.SERVICE_FEE_SETTLEMENT_READY && to == State.SERVICE_FEE_DISTRIBUTABLE) return true;
        // LEGACY_COMPAT: current Escrow.release still jumps LOCKED→DISTRIBUTABLE until rewired
        if (from == State.SERVICE_FEE_LOCKED && to == State.SERVICE_FEE_DISTRIBUTABLE) return true;
        if (from == State.SERVICE_FEE_DISTRIBUTABLE && to == State.SERVICE_FEE_DISTRIBUTED) return true;
        return false;
    }

    function requireTransition(State from, State to) internal pure {
        if (!canTransition(from, to)) revert InvalidTransition(from, to);
    }
}
