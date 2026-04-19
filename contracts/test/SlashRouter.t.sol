// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/SlashRouter.sol";
import "../src/ReserveVault.sol";
import "../src/GuideIdentityStakingPool.sol";
import "../src/MockERC20.sol";

contract SlashRouterTest is Test {
    MockERC20 public tkn;
    ReserveVault public vault;
    SlashRouter public router;
    GuideIdentityStakingPool public pool;
    address public treasury = makeAddr("treasury");
    address public sink = makeAddr("sink");
    address public alice = makeAddr("alice");

    function test_Constructor_revertsReserveBpsZero() public {
        tkn = new MockERC20();
        vault = new ReserveVault(address(tkn), address(this));
        vm.expectRevert(SlashRouter.SlashRouter_ReserveBpsZero.selector);
        new SlashRouter(address(tkn), address(vault), treasury, sink, 0, 5000, 5000);
    }

    function test_Constructor_revertsBpsSum() public {
        tkn = new MockERC20();
        vault = new ReserveVault(address(tkn), address(this));
        vm.expectRevert(SlashRouter.SlashRouter_InvalidBpsSum.selector);
        new SlashRouter(address(tkn), address(vault), treasury, sink, 6000, 3000, 500);
    }

    function test_Constructor_revertsSinkBpsWithoutSink() public {
        tkn = new MockERC20();
        vault = new ReserveVault(address(tkn), address(this));
        vm.expectRevert(SlashRouter.SlashRouter_SinkUnset.selector);
        new SlashRouter(address(tkn), address(vault), treasury, address(0), 7000, 2000, 1000);
    }

    function test_Slash_splitsToVaultTreasuryAndSink() public {
        tkn = new MockERC20();
        vault = new ReserveVault(address(tkn), address(this));
        router = new SlashRouter(address(tkn), address(vault), treasury, sink, 6000, 3000, 1000);
        pool = new GuideIdentityStakingPool(address(tkn), address(this), 1000e6, address(router));

        tkn.mint(alice, 10_000e6);
        vm.startPrank(alice);
        tkn.approve(address(pool), type(uint256).max);
        pool.depositIdentity(5000e6);
        vm.stopPrank();

        pool.slash(alice, 1000e6);

        assertEq(tkn.balanceOf(address(vault)), 600e6);
        assertEq(tkn.balanceOf(treasury), 300e6);
        assertEq(tkn.balanceOf(sink), 100e6);
        assertEq(pool.slashReserve(), 0);
    }

    function test_ReserveVault_onlyTimelockWithdraws() public {
        tkn = new MockERC20();
        address tl = makeAddr("timelock");
        vault = new ReserveVault(address(tkn), tl);
        tkn.mint(address(vault), 100e6);

        vm.prank(alice);
        vm.expectRevert(ReserveVault.OnlyTimelock.selector);
        vault.withdraw(alice, 10e6);

        vm.prank(tl);
        vault.withdraw(alice, 100e6);
        assertEq(tkn.balanceOf(alice), 100e6);
    }
}
