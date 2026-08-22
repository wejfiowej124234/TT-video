// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {TtgV9ProjectPoolV2} from "../../src/ttg-v9/TtgV9ProjectPoolV2.sol";
import {TtgV9ERC1967Proxy} from "../../src/ttg-v9/TtgV9ERC1967Proxy.sol";
import {MockV9Erc20} from "../../src/ttg-v9/mocks/MockV9Erc20.sol";

/**
 * @title TtgV9ProjectPoolV2Test
 * @notice Local Candidate: governance capBps 0–10000 · Timelock-only · no period reset on setCap.
 */
contract TtgV9ProjectPoolV2Test is Test {
    address internal timelock = makeAddr("timelock");
    address internal randomEoa = makeAddr("eoa");
    address internal ops = makeAddr("ops");

    MockV9Erc20 internal usdc;
    TtgV9ProjectPoolV2 internal pool;

    uint256 internal constant RESERVE = 1_000_000e6;

    function setUp() public {
        usdc = new MockV9Erc20("USD Coin", "USDC", 6);
        TtgV9ProjectPoolV2 impl = new TtgV9ProjectPoolV2();
        bytes memory initData = abi.encodeCall(
            TtgV9ProjectPoolV2.initialize,
            (timelock, timelock, address(usdc), 3_000)
        );
        TtgV9ERC1967Proxy proxy = new TtgV9ERC1967Proxy(address(impl), initData);
        pool = TtgV9ProjectPoolV2(address(proxy));
        usdc.mint(address(pool), RESERVE);
    }

    function test_defaultCap_3000() public view {
        assertEq(pool.capBps(), 3_000);
        assertEq(pool.p4DeployCap(), (RESERVE * 3_000) / 10_000);
    }

    function test_setCapBps_onlyTimelock() public {
        vm.prank(randomEoa);
        vm.expectRevert(TtgV9ProjectPoolV2.OnlyOwner.selector);
        pool.setCapBps(5_000);

        vm.prank(timelock);
        pool.setCapBps(5_000);
        assertEq(pool.capBps(), 5_000);
        assertEq(pool.p4DeployCap(), (RESERVE * 5_000) / 10_000);
    }

    function test_setCapBps_bounds() public {
        vm.startPrank(timelock);
        pool.setCapBps(0);
        assertEq(pool.capBps(), 0);
        pool.setCapBps(10_000);
        assertEq(pool.capBps(), 10_000);
        vm.expectRevert(TtgV9ProjectPoolV2.InvalidCapBps.selector);
        pool.setCapBps(10_001);
        vm.stopPrank();
    }

    function test_setCap_doesNotResetSpent() public {
        uint256 spend20 = (RESERVE * 2_000) / 10_000; // 20% of initial
        vm.prank(timelock);
        pool.spendP4Reserve(address(usdc), ops, spend20);
        assertEq(pool.p4SpentInPeriod(), spend20);
        uint256 started = pool.p4PeriodStartedAt();

        vm.prank(timelock);
        pool.setCapBps(5_000); // 50%
        assertEq(pool.p4SpentInPeriod(), spend20);
        assertEq(pool.p4PeriodStartedAt(), started);

        // Live-cap: after spend, reserve is lower; remaining = newCap − spent
        uint256 remaining = pool.p4RemainingInPeriod();
        assertGt(remaining, 0);
        vm.prank(timelock);
        pool.spendP4Reserve(address(usdc), ops, remaining);
        assertEq(pool.p4SpentInPeriod(), spend20 + remaining);
        assertEq(pool.p4RemainingInPeriod(), 0);
    }

    function test_setCap_lowerThanSpent_blocksFurther() public {
        uint256 spend20 = (RESERVE * 2_000) / 10_000;
        vm.prank(timelock);
        pool.spendP4Reserve(address(usdc), ops, spend20);

        vm.prank(timelock);
        pool.setCapBps(500); // 5% < already spent 20%

        assertEq(pool.p4RemainingInPeriod(), 0);
        vm.prank(timelock);
        vm.expectRevert(TtgV9ProjectPoolV2.P4CapExceeded.selector);
        pool.spendP4Reserve(address(usdc), ops, 1);
    }

    function test_spend_onlySpender() public {
        vm.prank(randomEoa);
        vm.expectRevert(TtgV9ProjectPoolV2.OnlySpender.selector);
        pool.spendP4Reserve(address(usdc), ops, 1e6);
    }

    function test_upgrade_onlyTimelock() public {
        TtgV9ProjectPoolV2 newImpl = new TtgV9ProjectPoolV2();
        vm.prank(randomEoa);
        vm.expectRevert(TtgV9ProjectPoolV2.OnlyOwner.selector);
        pool.upgradeToAndCall(address(newImpl), "");

        vm.prank(timelock);
        pool.upgradeToAndCall(address(newImpl), "");
        assertEq(pool.capBps(), 3_000);
    }
}
