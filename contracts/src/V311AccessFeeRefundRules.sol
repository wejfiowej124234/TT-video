// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title V311AccessFeeRefundRules
 * @notice V3.1.1 Platform Access Fee refund policy · Gap S-02
 * @dev Mirrors registry/v311-platform-access-fee.v1.yaml refund_policy
 */
library V311AccessFeeRefundRules {
    enum Outcome {
        AUDIT_FAIL,
        AUDIT_PASS,
        EXIT,
        DAO_REMOVE,
        INACTIVE_REOPEN
    }

    /// @return refundBps 10000 = 100% refund; 0 = non-refundable
    function refundBps(Outcome o) internal pure returns (uint16) {
        if (o == Outcome.AUDIT_FAIL) return 10_000;
        return 0;
    }

    function isRefundable(Outcome o) internal pure returns (bool) {
        return refundBps(o) == 10_000;
    }
}
