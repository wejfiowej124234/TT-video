// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/upgrade/TimelockUpgradeableProxy.sol";
import "../src/GovernanceTimelock.sol";
import "../src/GovernanceTreasuryP4Cap.sol";
import "../src/MockERC20.sol";
import "../src/TtgGovFreezeConstants.sol";

/// G24-P-UPGRADE-01 · Timelock-controlled proxy architecture
contract TtgGovFreezeV1ProxyArchitectureTest is Test {
    address internal admin = address(this);
    address internal attacker = address(0xBAD);

    function test_G24_UPGRADE_01_proxy_admin_is_timelock() public {
        GovernanceTimelock timelock = new GovernanceTimelock(admin, 100);
        MockERC20 usdc = new MockERC20();
        GovernanceTreasuryP4Cap impl = new GovernanceTreasuryP4Cap(address(1), address(1), address(usdc));

        TimelockUpgradeableProxy proxy = new TimelockUpgradeableProxy(
            address(impl),
            address(timelock),
            abi.encodeCall(GovernanceTreasuryP4Cap.initializeProxyStorage, (address(timelock), address(timelock)))
        );

        assertEq(proxy.admin(), address(timelock));
        assertEq(proxy.implementation(), address(impl));
        assertEq(
            GovernanceTreasuryP4Cap(payable(address(proxy))).treasuryP4DeployCapBps(), 3000
        );
    }

    function test_G24_UPGRADE_01_only_timelock_admin_can_upgrade() public {
        GovernanceTimelock timelock = new GovernanceTimelock(admin, 100);
        MockERC20 usdc = new MockERC20();
        GovernanceTreasuryP4Cap impl = new GovernanceTreasuryP4Cap(address(1), address(1), address(usdc));
        GovernanceTreasuryP4Cap impl2 = new GovernanceTreasuryP4Cap(address(1), address(1), address(usdc));

        TimelockUpgradeableProxy proxy = new TimelockUpgradeableProxy(
            address(impl),
            address(timelock),
            abi.encodeCall(GovernanceTreasuryP4Cap.initializeProxyStorage, (address(timelock), address(timelock)))
        );

        vm.prank(attacker);
        vm.expectRevert(TimelockUpgradeableProxy.ProxyUnauthorized.selector);
        proxy.upgradeTo(address(impl2));

        vm.prank(address(timelock));
        proxy.upgradeTo(address(impl2));
        assertEq(proxy.implementation(), address(impl2));
    }

    function test_G24_UPGRADE_01_timelock_delay_matches_gov_freeze() public {
        GovernanceTimelock timelock =
            new GovernanceTimelock(admin, TtgGovFreezeConstants.GOVERNANCE_TIMELOCK_DELAY_SECONDS);
        assertEq(timelock.delay(), 172800);
    }
}
