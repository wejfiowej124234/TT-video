// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/EscrowFactory.sol";
import "../src/MockERC20.sol";

contract EscrowTest is Test {
    EscrowFactory public factory;
    MockERC20 public token;
    address public traveler;
    address public guide;
    address public platformFeeRecipient;
    uint256 constant TOTAL = 1000e6;
    uint16 constant FEE_BPS = 500; // 5%

    function setUp() public {
        token = new MockERC20();
        token.mint(address(this), 10_000e6);
        factory = new EscrowFactory(address(this));
        traveler = makeAddr("traveler");
        guide = makeAddr("guide");
        platformFeeRecipient = makeAddr("platform");
        token.mint(traveler, TOTAL);
    }

    function test_CreateDepositRelease() public {
        bytes32 orderId = keccak256("order1");
        Escrow.EscrowParams memory params = Escrow.EscrowParams({
            chainId: 137,
            orderId: orderId,
            snapshotHash: keccak256("snap"),
            schemaVersion: 1,
            traveler: traveler,
            guide: guide,
            platformFeeRecipient: platformFeeRecipient,
            token: address(token),
            totalAmount: TOTAL,
            platformFeeBps: FEE_BPS,
            serviceStart: uint64(block.timestamp),
            serviceEnd: uint64(block.timestamp + 1 days),
            disputeWindowSeconds: 7 days,
            arbitrator: makeAddr("arb")
        });
        address escrowAddr = factory.createEscrow(params);
        assertTrue(escrowAddr != address(0));
        assertEq(factory.escrowOf(orderId), escrowAddr);

        Escrow escrow = Escrow(escrowAddr);
        vm.prank(traveler);
        token.approve(escrowAddr, TOTAL);
        vm.prank(traveler);
        escrow.deposit(TOTAL);
        assertEq(uint256(escrow.status()), uint256(Escrow.Status.Funded));
        assertEq(token.balanceOf(escrowAddr), TOTAL);

        escrow.release();
        assertEq(uint256(escrow.status()), uint256(Escrow.Status.Completed));
        uint256 fee = (TOTAL * FEE_BPS) / 10000;
        assertEq(token.balanceOf(guide), TOTAL - fee);
        assertEq(token.balanceOf(platformFeeRecipient), fee);
        assertEq(token.balanceOf(escrowAddr), 0);
    }

    /// B-093：纸面公式与链上一致 — guide=floor(total*(10000-bps)/10000)，fee=total-guide。
    function _expectedReleaseSplit(uint256 total, uint16 bps) internal pure returns (uint256 guideAmount, uint256 fee) {
        guideAmount = (total * (uint256(10000) - uint256(bps))) / 10000;
        fee = total - guideAmount;
    }

    function test_B093_release_table_threeFeeRates() public {
        uint16[3] memory bpsVals = [uint16(0), uint16(500), uint16(333)];
        uint256[3] memory totals = [uint256(1), uint256(1000e6), uint256(999_999_999_999)];

        for (uint256 i = 0; i < bpsVals.length; i++) {
            uint16 bps = bpsVals[i];
            uint256 total = totals[i];
            bytes32 orderId = keccak256(abi.encodePacked("b093", i, bps, total));
            token.mint(traveler, total);

            Escrow.EscrowParams memory params = Escrow.EscrowParams({
                chainId: 137,
                orderId: orderId,
                snapshotHash: keccak256("snap"),
                schemaVersion: 1,
                traveler: traveler,
                guide: guide,
                platformFeeRecipient: platformFeeRecipient,
                token: address(token),
                totalAmount: total,
                platformFeeBps: bps,
                serviceStart: uint64(block.timestamp),
                serviceEnd: uint64(block.timestamp + 1 days),
                disputeWindowSeconds: 7 days,
                arbitrator: makeAddr("arb")
            });
            address escrowAddr = factory.createEscrow(params);
            Escrow escrow = Escrow(escrowAddr);

            (uint256 expGuide, uint256 expFee) = _expectedReleaseSplit(total, bps);
            assertEq(expGuide + expFee, total, "paper conservation");

            vm.prank(traveler);
            token.approve(escrowAddr, total);
            vm.prank(traveler);
            escrow.deposit(total);

            uint256 guideBefore = token.balanceOf(guide);
            uint256 platformBefore = token.balanceOf(platformFeeRecipient);
            escrow.release();

            assertEq(token.balanceOf(guide), guideBefore + expGuide);
            assertEq(token.balanceOf(platformFeeRecipient), platformBefore + expFee);
            assertEq(token.balanceOf(escrowAddr), 0);
            assertEq(uint256(escrow.status()), uint256(Escrow.Status.Completed));
        }
    }

    /// B-093 fuzz：任意 (total, bps) 守恒 + 与封存 bps 可复算。
    function testFuzz_B093_release_conservation(uint256 totalRaw, uint16 bps) public {
        uint256 total = bound(totalRaw, 1, 1e24);
        bps = uint16(bound(bps, 0, 10000));

        bytes32 orderId = keccak256(abi.encodePacked("b093fuzz", total, bps));
        token.mint(traveler, total);

        Escrow.EscrowParams memory params = Escrow.EscrowParams({
            chainId: 137,
            orderId: orderId,
            snapshotHash: keccak256("snap"),
            schemaVersion: 1,
            traveler: traveler,
            guide: guide,
            platformFeeRecipient: platformFeeRecipient,
            token: address(token),
            totalAmount: total,
            platformFeeBps: bps,
            serviceStart: uint64(block.timestamp),
            serviceEnd: uint64(block.timestamp + 1 days),
            disputeWindowSeconds: 7 days,
            arbitrator: makeAddr("arb")
        });
        address escrowAddr = factory.createEscrow(params);
        Escrow escrow = Escrow(escrowAddr);

        (uint256 expGuide, uint256 expFee) = _expectedReleaseSplit(total, bps);

        vm.prank(traveler);
        token.approve(escrowAddr, total);
        vm.prank(traveler);
        escrow.deposit(total);
        escrow.release();

        assertEq(expGuide + expFee, total);
        assertEq(token.balanceOf(guide), expGuide);
        assertEq(token.balanceOf(platformFeeRecipient), expFee);
        assertEq(token.balanceOf(escrowAddr), 0);
    }

    /// B-091：**工厂暂停** 阻断 **新** `createEscrow`；**已存在** Escrow 仍 **`release`**。
    function test_B091_factoryPause_blocksNewCreate_existingEscrowStillReleases() public {
        bytes32 orderId1 = keccak256("order-pause-1");
        Escrow.EscrowParams memory params = Escrow.EscrowParams({
            chainId: 137,
            orderId: orderId1,
            snapshotHash: keccak256("snap"),
            schemaVersion: 1,
            traveler: traveler,
            guide: guide,
            platformFeeRecipient: platformFeeRecipient,
            token: address(token),
            totalAmount: TOTAL,
            platformFeeBps: FEE_BPS,
            serviceStart: uint64(block.timestamp),
            serviceEnd: uint64(block.timestamp + 1 days),
            disputeWindowSeconds: 7 days,
            arbitrator: makeAddr("arb")
        });
        address escrowAddr = factory.createEscrow(params);
        factory.setFactoryPaused(true);

        Escrow.EscrowParams memory params2 = params;
        params2.orderId = keccak256("order-pause-2");
        vm.expectRevert(EscrowFactory.FactoryPaused.selector);
        factory.createEscrow(params2);

        Escrow escrow = Escrow(escrowAddr);
        vm.prank(traveler);
        token.approve(escrowAddr, TOTAL);
        vm.prank(traveler);
        escrow.deposit(TOTAL);
        escrow.release();
        assertEq(uint256(escrow.status()), uint256(Escrow.Status.Completed));

        factory.setFactoryPaused(false);
        factory.createEscrow(params2);
        assertTrue(factory.escrowOf(params2.orderId) != address(0));
    }

    function test_init_reverts_when_platformFeeBps_gt_10000() public {
        bytes32 orderId = keccak256("bps-bad");
        Escrow.EscrowParams memory params = Escrow.EscrowParams({
            chainId: 137,
            orderId: orderId,
            snapshotHash: keccak256("snap"),
            schemaVersion: 1,
            traveler: traveler,
            guide: guide,
            platformFeeRecipient: platformFeeRecipient,
            token: address(token),
            totalAmount: 100e6,
            platformFeeBps: 10001,
            serviceStart: uint64(block.timestamp),
            serviceEnd: uint64(block.timestamp + 1 days),
            disputeWindowSeconds: 7 days,
            arbitrator: makeAddr("arb")
        });
        vm.expectRevert(Escrow.InvalidState.selector);
        factory.createEscrow(params);
    }

    function test_Refund() public {
        bytes32 orderId = keccak256("order2");
        Escrow.EscrowParams memory params = Escrow.EscrowParams({
            chainId: 137,
            orderId: orderId,
            snapshotHash: keccak256("snap"),
            schemaVersion: 1,
            traveler: traveler,
            guide: guide,
            platformFeeRecipient: platformFeeRecipient,
            token: address(token),
            totalAmount: TOTAL,
            platformFeeBps: FEE_BPS,
            serviceStart: uint64(block.timestamp),
            serviceEnd: uint64(block.timestamp + 1 days),
            disputeWindowSeconds: 7 days,
            arbitrator: makeAddr("arb")
        });
        address escrowAddr = factory.createEscrow(params);
        Escrow escrow = Escrow(escrowAddr);
        vm.prank(traveler);
        token.approve(escrowAddr, TOTAL);
        vm.prank(traveler);
        escrow.deposit(TOTAL);
        vm.prank(traveler);
        escrow.refund();
        assertEq(uint256(escrow.status()), uint256(Escrow.Status.Refunded));
        assertEq(token.balanceOf(traveler), TOTAL);
        assertEq(token.balanceOf(escrowAddr), 0);
    }

    function _createFundedDisputed(bytes32 orderId) internal returns (Escrow escrow, address escrowAddr) {
        Escrow.EscrowParams memory params = Escrow.EscrowParams({
            chainId: 137,
            orderId: orderId,
            snapshotHash: keccak256("snap"),
            schemaVersion: 1,
            traveler: traveler,
            guide: guide,
            platformFeeRecipient: platformFeeRecipient,
            token: address(token),
            totalAmount: TOTAL,
            platformFeeBps: FEE_BPS,
            serviceStart: uint64(block.timestamp),
            serviceEnd: uint64(block.timestamp + 1 days),
            disputeWindowSeconds: 7 days,
            arbitrator: makeAddr("arb")
        });
        escrowAddr = factory.createEscrow(params);
        escrow = Escrow(escrowAddr);
        vm.prank(traveler);
        token.approve(escrowAddr, TOTAL);
        vm.prank(traveler);
        escrow.deposit(TOTAL);
        escrow.openDispute(keccak256("reason"));
    }

    /// B-094：全额退游客（订单域 Refunded）；链上 `Resolved` + 余额守恒。
    function test_B094_executeResolution_refunded_full_traveler() public {
        (Escrow escrow, address escrowAddr) = _createFundedDisputed(keccak256("b094-refund"));
        uint256 t0Traveler = token.balanceOf(traveler);
        uint256 t0Guide = token.balanceOf(guide);
        uint256 t0Plat = token.balanceOf(platformFeeRecipient);
        uint256 t0Escrow = token.balanceOf(escrowAddr);

        escrow.executeResolution(keccak256("res-a"), keccak256("dec-a"), 0, TOTAL, 0);

        assertEq(uint256(escrow.status()), uint256(Escrow.Status.Resolved));
        assertEq(token.balanceOf(traveler) - t0Traveler, TOTAL);
        assertEq(token.balanceOf(guide), t0Guide);
        assertEq(token.balanceOf(platformFeeRecipient), t0Plat);
        assertEq(token.balanceOf(escrowAddr), 0);
        assertEq(t0Escrow, TOTAL);
    }

    /// B-094：向导 + 游客双收（订单域 PartiallyRefunded）。
    function test_B094_executeResolution_partially_refunded_split() public {
        (Escrow escrow, address escrowAddr) = _createFundedDisputed(keccak256("b094-partial"));
        uint256 gAmt = 300e6;
        uint256 tAmt = 650e6;
        uint256 pAmt = 50e6;
        assertEq(gAmt + tAmt + pAmt, TOTAL);

        uint256 t0Traveler = token.balanceOf(traveler);
        uint256 t0Guide = token.balanceOf(guide);
        uint256 t0Plat = token.balanceOf(platformFeeRecipient);

        escrow.executeResolution(keccak256("res-b"), keccak256("dec-b"), gAmt, tAmt, pAmt);

        assertEq(uint256(escrow.status()), uint256(Escrow.Status.Resolved));
        assertEq(token.balanceOf(guide) - t0Guide, gAmt);
        assertEq(token.balanceOf(traveler) - t0Traveler, tAmt);
        assertEq(token.balanceOf(platformFeeRecipient) - t0Plat, pAmt);
        assertEq(token.balanceOf(escrowAddr), 0);
    }

    /// B-094：向导 0、平台费非零（扣罚模板）；订单域 Slashed。
    function test_B094_executeResolution_slashed_guide_zero_platform_fee() public {
        (Escrow escrow, address escrowAddr) = _createFundedDisputed(keccak256("b094-slash"));
        uint256 gAmt = 0;
        uint256 tAmt = 800e6;
        uint256 pAmt = 200e6;

        uint256 t0Traveler = token.balanceOf(traveler);
        uint256 t0Guide = token.balanceOf(guide);
        uint256 t0Plat = token.balanceOf(platformFeeRecipient);

        escrow.executeResolution(keccak256("res-c"), keccak256("dec-c"), gAmt, tAmt, pAmt);

        assertEq(uint256(escrow.status()), uint256(Escrow.Status.Resolved));
        assertEq(token.balanceOf(traveler) - t0Traveler, tAmt);
        assertEq(token.balanceOf(guide), t0Guide);
        assertEq(token.balanceOf(platformFeeRecipient) - t0Plat, pAmt);
        assertEq(token.balanceOf(escrowAddr), 0);
    }
}
