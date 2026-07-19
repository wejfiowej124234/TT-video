// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/V311AccessFeeRefundRules.sol";

/**
 * @title S02AccessFeeRefundRulesV311Test
 * @notice Phase A · Gap S-02 · Local Verify（①）
 */
contract S02AccessFeeRefundRulesV311Test is Test {
    function test_S02_audit_fail_refunds_100_else_non_refundable() public pure {
        assertTrue(V311AccessFeeRefundRules.isRefundable(V311AccessFeeRefundRules.Outcome.AUDIT_FAIL));
        assertEq(
            V311AccessFeeRefundRules.refundBps(V311AccessFeeRefundRules.Outcome.AUDIT_FAIL),
            10_000
        );
        assertFalse(V311AccessFeeRefundRules.isRefundable(V311AccessFeeRefundRules.Outcome.AUDIT_PASS));
        assertFalse(V311AccessFeeRefundRules.isRefundable(V311AccessFeeRefundRules.Outcome.EXIT));
        assertFalse(V311AccessFeeRefundRules.isRefundable(V311AccessFeeRefundRules.Outcome.DAO_REMOVE));
        assertFalse(V311AccessFeeRefundRules.isRefundable(V311AccessFeeRefundRules.Outcome.INACTIVE_REOPEN));
    }
}
