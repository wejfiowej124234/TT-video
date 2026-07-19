// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/V311DistributableSplit.sol";
import "../src/V311EconomicConstants.sol";

/**
 * @title F05F06DistributableSplitV311Test
 * @notice Phase A · Gap F-05 / F-06 · Local Verify（①）
 */
contract F05F06DistributableSplitV311Test is Test {
    function test_F05_steward_active_45_55() public pure {
        (uint256 s, uint256 p) = V311DistributableSplit.split(1_000_000e6, true);
        assertEq(s, 450_000e6);
        assertEq(p, 550_000e6);
        assertEq(s + p, 1_000_000e6);
        assertEq(V311EconomicConstants.STEWARD_SHARE_BPS, 4500);
        assertEq(V311EconomicConstants.PROJECT_REVENUE_POOL_BPS, 5500);
    }

    function test_F06_no_steward_100_pool() public pure {
        (uint256 s, uint256 p) = V311DistributableSplit.split(1_000_000e6, false);
        assertEq(s, 0);
        assertEq(p, 1_000_000e6);
        assertEq(V311EconomicConstants.PROJECT_REVENUE_POOL_BPS_NO_STEWARD, 10_000);
    }
}
