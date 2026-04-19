// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GuideIdentityStakingPool.sol";
import "../src/MockERC20.sol";

contract GuideIdentityStakingPoolTest is Test {
    MockERC20 public tkn;
    GuideIdentityStakingPool public pool;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 constant MIN = 1000e6;

    function setUp() public {
        tkn = new MockERC20();
        pool = new GuideIdentityStakingPool(address(tkn), address(this), MIN, address(0));
        tkn.mint(alice, 50_000e6);
    }

    function test_DepositIdentity_revertsBelowMin() public {
        vm.startPrank(alice);
        tkn.approve(address(pool), type(uint256).max);
        vm.expectRevert(IdentityStakingPool.StakeBelowMinimum.selector);
        pool.depositIdentity(100e6);
        vm.stopPrank();
    }

    function test_ThreeLedgers_available_locked_reserve() public {
        vm.startPrank(alice);
        tkn.approve(address(pool), type(uint256).max);
        pool.depositIdentity(2000e6);
        pool.lockOrderRiskFromIdentity(500e6);
        (uint256 avail, uint256 locked, uint256 slashable) = pool.ledgers(alice);
        assertEq(avail, 1500e6);
        assertEq(locked, 500e6);
        assertEq(slashable, 2000e6);
        assertEq(pool.totalAvailable(), 1500e6);
        assertEq(pool.totalLockedOrder(), 500e6);
        assertEq(pool.slashReserve(), 0);
        vm.stopPrank();

        pool.slashToReserve(alice, 200e6);
        (avail, locked, slashable) = pool.ledgers(alice);
        assertEq(avail, 1500e6);
        assertEq(locked, 300e6);
        assertEq(slashable, 1800e6);
        assertEq(pool.slashReserve(), 200e6);

        pool.slashToReserve(alice, 400e6);
        (avail, locked, slashable) = pool.ledgers(alice);
        assertEq(locked, 0);
        assertEq(avail, 1400e6);
        assertEq(slashable, 1400e6);
        assertEq(pool.slashReserve(), 600e6);

        assertEq(tkn.balanceOf(address(pool)), 2000e6);
    }

    function test_Slash_revertsIfNotSlasher() public {
        vm.startPrank(alice);
        tkn.approve(address(pool), type(uint256).max);
        pool.depositIdentity(2000e6);
        vm.stopPrank();
        vm.prank(bob);
        vm.expectRevert(IdentityStakingPool.NotSlasher.selector);
        pool.slashToReserve(alice, 1);
    }
}
