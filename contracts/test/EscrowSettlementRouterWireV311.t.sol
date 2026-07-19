// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/SettlementRouter.sol";
import "../src/FeeRouter.sol";
import "../src/ProjectRevenuePoolV311.sol";
import "../src/ServiceFeeStatesV311.sol";
import "../src/MockERC20.sol";
import "../src/V311EconomicConstants.sol";
import "../src/IERC20.sol";
import "../src/ISettlementRouter.sol";

/**
 * @title EscrowSettlementRouterWireV311Test
 * @notice L5-A Financial Flow Wiring Closure · local ① empirical (not Production GO)
 */
contract EscrowSettlementRouterWireV311Test is Test {
    Escrow internal escrow;
    SettlementRouter internal router;
    FeeRouter internal feeRouter;
    ProjectRevenuePoolV311 internal prp;
    MockERC20 internal usdc;

    address internal owner;
    address internal traveler;
    address internal guide;
    address internal steward;
    address internal country;
    address internal stakers;
    address internal reserve;
    address internal ops;

    uint256 internal constant TOTAL = 1_000e6;
    uint16 internal constant FEE_BPS = 500; // 5% → fee = 50e6

    function setUp() public {
        owner = makeAddr("owner");
        traveler = makeAddr("traveler");
        guide = makeAddr("guide");
        steward = makeAddr("steward");
        country = makeAddr("country");
        stakers = makeAddr("stakers");
        reserve = makeAddr("reserve");
        ops = makeAddr("ops");

        usdc = new MockERC20();
        feeRouter = new FeeRouter(owner, country, stakers, reserve, ops);
        prp = new ProjectRevenuePoolV311(address(usdc), owner);
        router = new SettlementRouter(owner, address(feeRouter));

        escrow = new Escrow(address(this));
        usdc.mint(traveler, TOTAL);
        vm.prank(traveler);
        usdc.approve(address(escrow), type(uint256).max);

        Escrow.EscrowParams memory p = Escrow.EscrowParams({
            chainId: block.chainid,
            orderId: bytes32(uint256(101)),
            snapshotHash: bytes32(uint256(202)),
            schemaVersion: 1,
            traveler: traveler,
            guide: guide,
            platformFeeRecipient: address(router),
            token: address(usdc),
            totalAmount: TOTAL,
            platformFeeBps: FEE_BPS,
            serviceStart: 1,
            serviceEnd: 2,
            disputeWindowSeconds: 0,
            arbitrator: address(this)
        });
        escrow.init(p);
        escrow.setSettlementRouter(address(router));

        vm.prank(owner);
        router.setEscrow(address(escrow), true);
    }

    function test_L5A_escrow_to_settlement_fee_router_four_track_and_prp() public {
        bytes32 orderId = bytes32(uint256(101));
        uint256 fee = TOTAL - (TOTAL * (10_000 - FEE_BPS)) / 10_000; // 50e6
        assertEq(fee, 50e6);

        vm.prank(traveler);
        escrow.deposit(TOTAL);
        assertEq(uint256(escrow.serviceFeeState()), uint256(ServiceFeeStatesV311.State.SERVICE_FEE_LOCKED));

        escrow.release();
        assertEq(uint256(escrow.status()), uint256(Escrow.Status.Completed));
        assertEq(
            uint256(escrow.serviceFeeState()),
            uint256(ServiceFeeStatesV311.State.SERVICE_FEE_SETTLEMENT_READY)
        );
        assertEq(uint256(router.settlementState(orderId)), uint256(ISettlementRouter.OrderSettlementState.FeeLegReceived));
        assertEq(router.feeLegAmount(orderId), fee);
        assertEq(usdc.balanceOf(guide), TOTAL - fee);

        vm.startPrank(owner);
        router.markSettlementReady(orderId);
        router.markDistributable(orderId);
        assertEq(
            uint256(escrow.serviceFeeState()),
            uint256(ServiceFeeStatesV311.State.SERVICE_FEE_DISTRIBUTABLE)
        );

        // Steward 45% + pool 55% → FeeRouter (four-track sink)
        router.distribute(orderId, true, steward, address(feeRouter));
        vm.stopPrank();

        uint256 expectSteward = (fee * uint256(V311EconomicConstants.STEWARD_SHARE_BPS)) / 10_000;
        uint256 expectPool = fee - expectSteward;
        assertEq(usdc.balanceOf(steward), expectSteward);
        assertEq(usdc.balanceOf(address(feeRouter)), expectPool);
        assertEq(
            uint256(escrow.serviceFeeState()),
            uint256(ServiceFeeStatesV311.State.SERVICE_FEE_DISTRIBUTED)
        );
        assertEq(uint256(router.settlementState(orderId)), uint256(ISettlementRouter.OrderSettlementState.Distributed));

        // FeeRouter four-track live path
        vm.prank(owner);
        feeRouter.distribute(IERC20(address(usdc)), expectPool);
        assertEq(usdc.balanceOf(address(feeRouter)), 0);
        assertGt(usdc.balanceOf(country), 0);
        assertGt(usdc.balanceOf(stakers), 0);
        assertGt(usdc.balanceOf(reserve), 0);
        assertGt(usdc.balanceOf(ops), 0);
    }

    function test_L5A_steward_inactive_pool_to_prp_treasury() public {
        // fresh escrow/order
        Escrow e2 = new Escrow(address(this));
        bytes32 oid = bytes32(uint256(202));
        usdc.mint(traveler, TOTAL);
        vm.prank(traveler);
        usdc.approve(address(e2), type(uint256).max);
        Escrow.EscrowParams memory p = Escrow.EscrowParams({
            chainId: block.chainid,
            orderId: oid,
            snapshotHash: bytes32(uint256(303)),
            schemaVersion: 1,
            traveler: traveler,
            guide: guide,
            platformFeeRecipient: address(router),
            token: address(usdc),
            totalAmount: TOTAL,
            platformFeeBps: FEE_BPS,
            serviceStart: 1,
            serviceEnd: 2,
            disputeWindowSeconds: 0,
            arbitrator: address(this)
        });
        e2.init(p);
        e2.setSettlementRouter(address(router));
        vm.prank(owner);
        router.setEscrow(address(e2), true);

        vm.prank(traveler);
        e2.deposit(TOTAL);
        e2.release();

        uint256 fee = 50e6;
        vm.startPrank(owner);
        router.markSettlementReady(oid);
        router.markDistributable(oid);
        router.distribute(oid, false, address(0), address(prp));
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(prp)), fee);
        assertEq(usdc.balanceOf(steward), 0);
        assertEq(
            uint256(e2.serviceFeeState()),
            uint256(ServiceFeeStatesV311.State.SERVICE_FEE_DISTRIBUTED)
        );
    }
}
