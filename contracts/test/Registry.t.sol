// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/Registry.sol";

contract RegistryTest is Test {
    Registry internal reg;
    address internal authority = makeAddr("authority");
    address internal guide = makeAddr("guide");

    function setUp() public {
        vm.prank(authority);
        reg = new Registry();
    }

    function test_authorityIsDeployer() public view {
        assertEq(reg.authority(), authority);
    }

    function test_approve_and_isApproved() public {
        vm.prank(authority);
        reg.approve(guide, 2, block.timestamp + 30 days);
        assertTrue(reg.isApproved(guide));
    }

    function test_revoke() public {
        vm.prank(authority);
        reg.approve(guide, 1, block.timestamp + 30 days);
        vm.prank(authority);
        reg.revoke(guide);
        assertFalse(reg.isApproved(guide));
    }

    function test_expired_notApproved() public {
        vm.prank(authority);
        reg.approve(guide, 1, block.timestamp + 1);
        vm.warp(block.timestamp + 2);
        assertFalse(reg.isApproved(guide));
    }

    function test_revert_notAuthority() public {
        vm.prank(guide);
        vm.expectRevert(Registry.OnlyAuthority.selector);
        reg.approve(guide, 1, block.timestamp + 1);
    }
}
