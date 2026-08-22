// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {TtgV9CountryFeeRouterV2} from "../../src/ttg-v9/TtgV9CountryFeeRouterV2.sol";
import {TtgV9SoloTimelock} from "../../src/ttg-v9/TtgV9SoloTimelock.sol";
import {TtgV9DesignLockConstants} from "../../src/ttg-v9/TtgV9DesignLockConstants.sol";
import {MockV9Erc20} from "./MockV9Erc20.sol";

/**
 * @title TtgV9CountryFeeRouterV2LocalTest
 * @notice Local Candidate: governable platformFeeBps + Active split; no-steward fixed 100% branch.
 */
contract TtgV9CountryFeeRouterV2LocalTest is Test {
    address internal admin = makeAddr("admin");
    address internal pool = makeAddr("pool");
    address internal steward = makeAddr("steward");
    address internal caller = makeAddr("caller");

    TtgV9SoloTimelock internal timelock;
    TtgV9CountryFeeRouterV2 internal fee;
    MockV9Erc20 internal usdc;

    function setUp() public {
        timelock = new TtgV9SoloTimelock(admin, TtgV9DesignLockConstants.TIMELOCK_DELAY_SECONDS_NEW_ROOT);
        fee = new TtgV9CountryFeeRouterV2(address(timelock), pool);
        usdc = new MockV9Erc20("USD Coin", "USDC", 6);

        vm.prank(admin);
        timelock.setAllowedExecutionTarget(address(fee), true);
        vm.prank(admin);
        timelock.setAllowedExecutionTarget(address(timelock), true);

        vm.prank(address(timelock));
        fee.setFeeRouterCaller(caller, true);
    }

    function test_defaults() public view {
        assertEq(fee.platformFeeBps(), 500);
        assertEq(fee.stewardShareBps(), 4500);
        assertEq(fee.projectShareBps(), 5500);
        assertEq(timelock.delay(), 12 hours);
    }

    function test_setFeeSplit_sum_hard_bound_only() public {
        bytes memory data = abi.encodeCall(TtgV9CountryFeeRouterV2.setFeeSplit, (6000, 4000));
        vm.prank(admin);
        bytes32 id = timelock.schedule(address(fee), 0, data, bytes32(uint256(1)));
        vm.warp(block.timestamp + 12 hours);
        timelock.execute(id);
        assertEq(fee.stewardShareBps(), 6000);
        assertEq(fee.projectShareBps(), 4000);

        vm.prank(address(timelock));
        vm.expectRevert(TtgV9CountryFeeRouterV2.InvalidSplitSum.selector);
        fee.setFeeSplit(6000, 5000);
    }

    function test_setPlatformFeeBps_max_10000() public {
        vm.prank(address(timelock));
        fee.setPlatformFeeBps(600);
        assertEq(fee.platformFeeBps(), 600);
        vm.prank(address(timelock));
        vm.expectRevert(TtgV9CountryFeeRouterV2.InvalidFeeBps.selector);
        fee.setPlatformFeeBps(10_001);
    }

    function test_active_steward_uses_split_on_fee_bucket_only() public {
        vm.prank(address(timelock));
        fee.setStewardPayout(bytes2("CN"), steward);
        usdc.mint(address(fee), 50e6);
        vm.prank(caller);
        fee.routePlatformFee(address(usdc), 50e6, bytes2("CN"));
        assertEq(usdc.balanceOf(steward), 22.5e6);
        assertEq(usdc.balanceOf(pool), 27.5e6);
    }

    function test_no_steward_independent_100_percent_ignores_split_storage() public {
        vm.prank(address(timelock));
        fee.setFeeSplit(9000, 1000);
        usdc.mint(address(fee), 50e6);
        vm.prank(caller);
        fee.routePlatformFee(address(usdc), 50e6, bytes2("JP"));
        assertEq(usdc.balanceOf(steward), 0);
        assertEq(usdc.balanceOf(pool), 50e6);
    }

    function test_timelock_updateDelay_self_only_bounded() public {
        bytes memory data = abi.encodeCall(TtgV9SoloTimelock.updateDelay, (48 hours));
        vm.prank(admin);
        bytes32 id = timelock.schedule(address(timelock), 0, data, bytes32(uint256(9)));
        vm.warp(block.timestamp + 12 hours);
        timelock.execute(id);
        assertEq(timelock.delay(), 48 hours);

        vm.expectRevert(TtgV9SoloTimelock.OnlySelf.selector);
        timelock.updateDelay(24 hours);

        vm.prank(address(timelock));
        vm.expectRevert(TtgV9SoloTimelock.InvalidDelay.selector);
        timelock.updateDelay(1 hours);
    }
}
