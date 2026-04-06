// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/RegionVault.sol";
import "../src/FeeRouter.sol";
import "../src/MockERC20.sol";

contract RegionVaultTest is Test {
    event RegionVaultForwarded(address indexed token, address indexed to, uint256 amount);

    RegionVault public vault;
    MockERC20 public token;
    address public admin = makeAddr("admin");
    address public recipient = makeAddr("recipient");

    function setUp() public {
        vault = new RegionVault(admin);
        token = new MockERC20();
    }

    function test_Forward() public {
        token.mint(address(vault), 1000);
        vm.prank(admin);
        vault.forward(token, recipient, 400);
        assertEq(token.balanceOf(recipient), 400);
        assertEq(token.balanceOf(address(vault)), 600);
    }

    function test_Forward_Event() public {
        token.mint(address(vault), 100);
        vm.prank(admin);
        vm.expectEmit(true, true, false, true);
        emit RegionVaultForwarded(address(token), recipient, 100);
        vault.forward(token, recipient, 100);
    }

    function test_RevertNotOwner() public {
        token.mint(address(vault), 10);
        vm.expectRevert(RegionVault.OnlyOwner.selector);
        vault.forward(token, recipient, 10);
    }

    function test_RevertZeroAmount() public {
        vm.prank(admin);
        vm.expectRevert(RegionVault.InvalidAmount.selector);
        vault.forward(token, recipient, 0);
    }

    function test_RevertZeroTo() public {
        token.mint(address(vault), 10);
        vm.prank(admin);
        vm.expectRevert(RegionVault.InvalidAmount.selector);
        vault.forward(token, address(0), 10);
    }

    function test_RevertInsufficientBalance() public {
        vm.prank(admin);
        vm.expectRevert(RegionVault.InvalidAmount.selector);
        vault.forward(token, recipient, 1);
    }

    function test_FeeRouter_CountryBucket_GoesToVault() public {
        address stakers = makeAddr("stakers");
        address reserve = makeAddr("reserve");
        address ops = makeAddr("ops");
        FeeRouter router = new FeeRouter(admin, address(vault), stakers, reserve, ops);

        uint256 amount = 10_000;
        token.mint(address(router), amount);
        vm.prank(admin);
        router.distribute(token, amount);

        assertEq(token.balanceOf(address(vault)), 4500);
        vm.prank(admin);
        vault.forward(token, recipient, 4500);
        assertEq(token.balanceOf(recipient), 4500);
    }
}
