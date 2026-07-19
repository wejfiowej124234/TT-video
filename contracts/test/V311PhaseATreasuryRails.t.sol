// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/MockERC20.sol";
import "../src/V311EconomicConstants.sol";
import "../src/ProjectRevenuePoolV311.sol";
import "../src/FounderBootstrapWalletV311.sol";

contract V311PhaseATreasuryRailsTest is Test {
    MockERC20 internal usdc;
    address internal owner = makeAddr("owner");
    address internal payer = makeAddr("payer");

    function setUp() public {
        usdc = new MockERC20();
        usdc.mint(payer, 1_000_000e6);
    }

    function test_constants_fee_bounds() public pure {
        assertEq(V311EconomicConstants.PLATFORM_SERVICE_FEE_DEFAULT_BPS, 500);
        assertEq(V311EconomicConstants.PLATFORM_SERVICE_FEE_MAX_BPS, 1000);
        assertEq(V311EconomicConstants.STEWARD_SHARE_BPS, 4500);
        assertEq(V311EconomicConstants.PROJECT_REVENUE_POOL_BPS, 5500);
        assertEq(V311EconomicConstants.PROJECT_REVENUE_POOL_BPS_NO_STEWARD, 10000);
    }

    function test_project_revenue_pool_deposit_withdraw() public {
        ProjectRevenuePoolV311 pool = new ProjectRevenuePoolV311(address(usdc), owner);
        vm.startPrank(payer);
        usdc.approve(address(pool), 100e6);
        pool.depositFrom(payer, 100e6);
        vm.stopPrank();
        assertEq(usdc.balanceOf(address(pool)), 100e6);
        vm.prank(owner);
        pool.withdraw(owner, 40e6);
        assertEq(usdc.balanceOf(owner), 40e6);
    }

    function test_bootstrap_collect_exact_300k() public {
        FounderBootstrapWalletV311 boot = new FounderBootstrapWalletV311(address(usdc), owner);
        uint256 fee = boot.accessFeeAmountUsdc();
        assertEq(fee, 300_000e6);
        vm.startPrank(payer);
        usdc.approve(address(boot), fee);
        boot.collectAccessFee(payer, fee);
        vm.stopPrank();
        assertEq(usdc.balanceOf(address(boot)), fee);
    }

    function test_bootstrap_rejects_wrong_amount() public {
        FounderBootstrapWalletV311 boot = new FounderBootstrapWalletV311(address(usdc), owner);
        vm.startPrank(payer);
        usdc.approve(address(boot), 1e6);
        vm.expectRevert(FounderBootstrapWalletV311.InvalidAmount.selector);
        boot.collectAccessFee(payer, 1e6);
        vm.stopPrank();
    }
}
