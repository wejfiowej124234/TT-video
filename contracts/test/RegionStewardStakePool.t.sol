// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/RegionStewardStakePool.sol";
import "../src/MockERC20.sol";

contract RegionStewardStakePoolTest is Test {
    RegionStewardStakePool public pool;
    MockERC20 public ttg;

    address public admin = makeAddr("admin");
    address public steward = makeAddr("steward");

    bytes2 internal constant J_CN = bytes2("CN");
    uint256 internal constant SUPPLY = 10_000_000 ether;

    function setUp() public {
        ttg = new MockERC20();
        vm.prank(admin);
        pool = new RegionStewardStakePool(admin, address(ttg), SUPPLY, 90 days, 365 days);
    }

    function test_MinStake_CN_400bps() public view {
        assertEq(pool.minStakeAmount(J_CN), 400_000 ether);
    }

    function test_Stake_And_RequestRelease_ClaimAfterVest() public {
        uint256 amt = pool.minStakeAmount(J_CN);
        ttg.mint(steward, amt);
        vm.startPrank(steward);
        ttg.approve(address(pool), amt);
        pool.stake(J_CN, amt, bytes32("app1"));
        vm.expectRevert(RegionStewardStakePool.JurisdictionAlreadyStaked.selector);
        pool.stake(J_CN, amt, bytes32("app2"));
        pool.requestRelease(J_CN);
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);
        vm.prank(steward);
        vm.expectRevert(RegionStewardStakePool.NothingToRelease.selector);
        pool.claimReleased(J_CN);

        vm.warp(block.timestamp + 365 days);
        vm.prank(steward);
        pool.claimReleased(J_CN);
        assertEq(ttg.balanceOf(steward), amt);
        assertFalse(pool.hasJurisdictionStake(steward, J_CN));
    }

    function test_Version() public view {
        assertEq(pool.version(), "region_steward_stake_pool_v1");
    }
}
