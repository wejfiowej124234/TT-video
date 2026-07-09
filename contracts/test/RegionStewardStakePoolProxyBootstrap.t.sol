// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/RegionStewardStakePool.sol";
import "../src/upgrade/TimelockUpgradeableProxy.sol";
import "../src/GovernanceTimelock.sol";
import "../src/MockERC20.sol";
import "../src/TtgGovFreezeConstants.sol";

/// G24 · RegionStewardStakePool Proxy · 10 国 jurisdiction bootstrap
contract RegionStewardStakePoolProxyBootstrapTest is Test {
    bytes2[10] internal jurisdictions = [
        bytes2("CN"), bytes2("US"), bytes2("FR"), bytes2("ES"), bytes2("JP"), bytes2("TH"), bytes2("SG"),
        bytes2("KR"), bytes2("AU"), bytes2("AE")
    ];

    uint256[10] internal expectedBps = [400, 400, 450, 450, 250, 250, 200, 200, 150, 150];

    function test_ProxyInitializeProxyStorage_bootstraps_all_min_stakes() public {
        GovernanceTimelock timelock = new GovernanceTimelock(address(this), 100);
        MockERC20 ttg = new MockERC20();
        RegionStewardStakePool impl = new RegionStewardStakePool(
            address(1),
            address(ttg),
            TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS,
            180 days,
            30 days
        );

        TimelockUpgradeableProxy proxy = new TimelockUpgradeableProxy(
            address(impl),
            address(timelock),
            abi.encodeCall(RegionStewardStakePool.initializeProxyStorage, (address(timelock)))
        );

        RegionStewardStakePool pool = RegionStewardStakePool(address(proxy));
        assertTrue(pool.jurisdictionsBootstrapped());
        _assertAllMinStakesPositive(pool);
    }

    function test_BootstrapOnce_after_empty_proxy_owner() public {
        GovernanceTimelock timelock = new GovernanceTimelock(address(this), 100);
        MockERC20 ttg = new MockERC20();
        RegionStewardStakePool impl = new RegionStewardStakePool(
            address(1),
            address(ttg),
            TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS,
            180 days,
            30 days
        );

        TimelockUpgradeableProxy proxy = new TimelockUpgradeableProxy(
            address(impl),
            address(timelock),
            abi.encodeCall(RegionStewardStakePool.initializeProxyStorage, (address(timelock)))
        );
        RegionStewardStakePool pool = RegionStewardStakePool(address(proxy));

        vm.prank(address(timelock));
        vm.expectRevert(RegionStewardStakePool.JurisdictionsAlreadyBootstrapped.selector);
        pool.bootstrapProtocolSsotJurisdictionsOnce();
    }

    function test_Constructor_bootstraps_all_min_stakes() public {
        MockERC20 ttg = new MockERC20();
        RegionStewardStakePool pool = new RegionStewardStakePool(
            address(this),
            address(ttg),
            TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS,
            180 days,
            30 days
        );
        assertTrue(pool.jurisdictionsBootstrapped());
        _assertAllMinStakesPositive(pool);
    }

    function _assertAllMinStakesPositive(RegionStewardStakePool pool) internal view {
        for (uint256 i = 0; i < jurisdictions.length; i++) {
            assertEq(pool.stewardStakeBps(jurisdictions[i]), expectedBps[i], "bps mismatch");
            assertGt(pool.minStakeAmount(jurisdictions[i]), 0, "minStake must be > 0");
        }
    }
}
