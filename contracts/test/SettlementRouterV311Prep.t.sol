// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/SettlementRouter.sol";
import "../src/MockERC20.sol";
import "../src/V311EconomicConstants.sol";

/**
 * @title SettlementRouterV311PrepTest
 * @notice WAIT_WINDOW prep · local ① only · not a deploy/broadcast cert
 */
contract SettlementRouterV311PrepTest is Test {
    SettlementRouter internal router;
    MockERC20 internal usdc;
    address internal owner;
    address internal steward;
    address internal prp;
    address internal payer;

    function setUp() public {
        owner = makeAddr("owner");
        steward = makeAddr("steward");
        prp = makeAddr("prp");
        payer = makeAddr("payer");
        usdc = new MockERC20();
        router = new SettlementRouter(owner, address(0));
        usdc.mint(payer, 100e6);
        vm.prank(payer);
        usdc.approve(address(router), type(uint256).max);
    }

    function test_settlement_ready_no_skip_45_55() public {
        bytes32 orderId = bytes32(uint256(42));
        uint256 fee = 100e6;

        vm.prank(owner);
        router.receiveFeeLeg(orderId, address(usdc), fee, payer);
        assertEq(uint256(router.settlementState(orderId)), uint256(ISettlementRouter.OrderSettlementState.FeeLegReceived));

        vm.prank(owner);
        router.markSettlementReady(orderId);
        assertEq(uint256(router.settlementState(orderId)), uint256(ISettlementRouter.OrderSettlementState.SettlementReady));

        // illegal: cannot distribute before Distributable
        vm.prank(owner);
        vm.expectRevert(SettlementRouter.InvalidState.selector);
        router.distribute(orderId, true, steward, prp);

        vm.prank(owner);
        router.markDistributable(orderId);

        vm.prank(owner);
        router.distribute(orderId, true, steward, prp);

        uint256 expectSteward = (fee * uint256(V311EconomicConstants.STEWARD_SHARE_BPS)) / 10_000;
        uint256 expectPool = fee - expectSteward;
        assertEq(usdc.balanceOf(steward), expectSteward);
        assertEq(usdc.balanceOf(prp), expectPool);
        assertEq(uint256(router.settlementState(orderId)), uint256(ISettlementRouter.OrderSettlementState.Distributed));
    }

    function test_no_steward_100_prp() public {
        bytes32 orderId = bytes32(uint256(7));
        uint256 fee = 50e6;
        vm.prank(owner);
        router.receiveFeeLeg(orderId, address(usdc), fee, payer);
        vm.startPrank(owner);
        router.markSettlementReady(orderId);
        router.markDistributable(orderId);
        router.distribute(orderId, false, address(0), prp);
        vm.stopPrank();
        assertEq(usdc.balanceOf(prp), fee);
        assertEq(usdc.balanceOf(steward), 0);
    }
}
