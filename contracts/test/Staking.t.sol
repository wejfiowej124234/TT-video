// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/Staking.sol";
import "../src/MockERC20.sol";

contract StakingTest is Test {
    MockERC20 public tkn;
    Staking public staking;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        tkn = new MockERC20();
        staking = new Staking(address(tkn), address(this));
        tkn.mint(alice, 10_000e6);
    }

    function test_Stake_revertsBelowMin() public {
        vm.startPrank(alice);
        tkn.approve(address(staking), type(uint256).max);
        vm.expectRevert(Staking.StakeBelowMinimum.selector);
        staking.stake(100e6);
        vm.stopPrank();
    }

    function test_Stake_transfersAndUpdates() public {
        vm.startPrank(alice);
        tkn.approve(address(staking), type(uint256).max);
        staking.stake(1000e6);
        vm.stopPrank();
        assertEq(staking.stakeOf(alice), 1000e6);
        assertEq(tkn.balanceOf(address(staking)), 1000e6);
        assertEq(tkn.balanceOf(alice), 9000e6);
    }

    function test_Stake_secondTopUpBelowMinIncrementOkIfTotalAboveMin() public {
        vm.startPrank(alice);
        tkn.approve(address(staking), type(uint256).max);
        staking.stake(1000e6);
        staking.stake(1); // tiny add-on after meeting MIN_STAKE
        vm.stopPrank();
        assertEq(staking.stakeOf(alice), 1000e6 + 1);
    }

    function test_Withdraw_returnsTokens() public {
        vm.startPrank(alice);
        tkn.approve(address(staking), type(uint256).max);
        staking.stake(2000e6);
        staking.withdraw(500e6);
        vm.stopPrank();
        assertEq(staking.stakeOf(alice), 1500e6);
        assertEq(tkn.balanceOf(alice), 8500e6);
        assertEq(tkn.balanceOf(address(staking)), 1500e6);
    }

    function test_Slash_revertsIfNotSlasher() public {
        vm.startPrank(alice);
        tkn.approve(address(staking), type(uint256).max);
        staking.stake(2000e6);
        vm.stopPrank();
        vm.prank(bob);
        vm.expectRevert(Staking.NotSlasher.selector);
        staking.slash(alice, 100e6);
    }

    function test_Slash_reducesStake_whenCallerIsSlasher() public {
        vm.startPrank(alice);
        tkn.approve(address(staking), type(uint256).max);
        staking.stake(2000e6);
        vm.stopPrank();
        staking.slash(alice, 300e6);
        assertEq(staking.stakeOf(alice), 1700e6);
        assertEq(staking.slashedOf(alice), 300e6);
    }
}
