// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/FeeRouter.sol";
import "../src/MockERC20.sol";

contract FeeRouterTest is Test {
    event PlatformFeeRouted(
        address indexed token,
        uint256 amount,
        uint256 toCountry,
        uint256 toStakers,
        uint256 toReserve,
        uint256 toOps
    );

    FeeRouter public router;
    MockERC20 public token;

    address public country = makeAddr("country");
    address public stakers = makeAddr("stakers");
    address public reserve = makeAddr("reserve");
    address public ops = makeAddr("ops");
    address public admin = makeAddr("admin");

    function setUp() public {
        token = new MockERC20();
        router = new FeeRouter(admin, country, stakers, reserve, ops);
    }

    function test_BpsConstantsMatch84() public view {
        assertEq(router.BPS_COUNTRY(), 4500);
        assertEq(router.BPS_GLOBAL_STAKERS(), 3575);
        assertEq(router.BPS_GLOBAL_RESERVE(), 1100);
        assertEq(router.BPS_GLOBAL_OPS(), 825);
        assertEq(uint256(4500 + 3575 + 1100 + 825), uint256(10000));
    }

    function test_Distribute_10kUnits() public {
        uint256 amount = 10_000;
        token.mint(address(router), amount);

        vm.prank(admin);
        router.distribute(token, amount);

        assertEq(token.balanceOf(country), 4500);
        assertEq(token.balanceOf(stakers), 3575);
        assertEq(token.balanceOf(reserve), 1100);
        assertEq(token.balanceOf(ops), 825);
        assertEq(token.balanceOf(address(router)), 0);
    }

    function test_Distribute_Event() public {
        uint256 amount = 10_000;
        token.mint(address(router), amount);

        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit PlatformFeeRouted(address(token), amount, 4500, 3575, 1100, 825);
        router.distribute(token, amount);
    }

    function test_RevertNotOwner() public {
        token.mint(address(router), 100);
        vm.expectRevert(FeeRouter.OnlyOwner.selector);
        router.distribute(token, 100);
    }

    function test_RevertInsufficientBalance() public {
        vm.prank(admin);
        vm.expectRevert(FeeRouter.InvalidAmount.selector);
        router.distribute(token, 1);
    }

    function test_TransferOwnership() public {
        address nextOwner = makeAddr("next");
        vm.prank(admin);
        router.transferOwnership(nextOwner);
        assertEq(router.owner(), nextOwner);

        token.mint(address(router), 100);
        vm.prank(nextOwner);
        router.distribute(token, 100);
    }

    /// **TT-B091-FEE-ROUTER-DISTRIBUTE-PAUSED-001**：**`distributePaused`** 门闸 — 暂停后 **`distribute`** **revert**，恢复后成功（与 **`GET /meta`** **`distribute_paused`** 同源读数字段）。
    function test_B091_distributePaused_revertsThenResumes() public {
        token.mint(address(router), 10_000);
        vm.prank(admin);
        router.setDistributePaused(true);
        assertTrue(router.distributePaused());

        vm.prank(admin);
        vm.expectRevert(FeeRouter.DistributePaused.selector);
        router.distribute(token, 10_000);

        vm.prank(admin);
        router.setDistributePaused(false);
        vm.prank(admin);
        router.distribute(token, 10_000);
        assertEq(token.balanceOf(address(router)), 0);
    }

    /// TT-COMP-B089：`setRoutingConfig` 后 **`distribute`** 与 **payload** 一致。
    function test_COMP_B089_setRoutingConfig_then_distribute_matches() public {
        address c2 = makeAddr("c2");
        address s2 = makeAddr("s2");
        address r2 = makeAddr("r2");
        address o2 = makeAddr("o2");
        uint256 b0 = 4000;
        uint256 b1 = 3000;
        uint256 b2 = 2000;
        uint256 b3 = 1000;

        vm.prank(admin);
        router.setRoutingConfig(c2, s2, r2, o2, b0, b1, b2, b3);

        assertEq(router.countryBucket(), c2);
        assertEq(router.BPS_COUNTRY(), b0);
        assertEq(router.BPS_GLOBAL_STAKERS(), b1);
        assertEq(router.BPS_GLOBAL_RESERVE(), b2);
        assertEq(router.BPS_GLOBAL_OPS(), b3);

        uint256 amount = 10_000;
        token.mint(address(router), amount);
        vm.prank(admin);
        router.distribute(token, amount);

        assertEq(token.balanceOf(c2), b0);
        assertEq(token.balanceOf(s2), b1);
        assertEq(token.balanceOf(r2), b2);
        assertEq(token.balanceOf(o2), b3);
    }

    function test_setRoutingConfig_revert_invalid_bps_sum() public {
        vm.prank(admin);
        vm.expectRevert(FeeRouter.InvalidBps.selector);
        router.setRoutingConfig(country, stakers, reserve, ops, 4000, 3000, 2000, 999);
    }

    function test_setRoutingConfig_revert_zero_address() public {
        vm.prank(admin);
        vm.expectRevert(FeeRouter.InvalidAddress.selector);
        router.setRoutingConfig(address(0), stakers, reserve, ops, 4500, 3575, 1100, 825);
    }
}
