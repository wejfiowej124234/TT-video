// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/EscrowV2.sol";
import "../src/EscrowFactoryV2.sol";
import "../src/MockERC20.sol";

contract EscrowV2Test is Test {
    EscrowFactoryV2 public factory;
    MockERC20 public token;
    address public traveler;
    address public guide;
    address public platformFeeRecipient;
    address public relayer;
    address public arbitrator;
    uint256 constant TOTAL = 1000e6;
    uint16 constant FEE_BPS = 500;

    function setUp() public {
        token = new MockERC20();
        factory = new EscrowFactoryV2(address(this));
        traveler = makeAddr("traveler");
        guide = makeAddr("guide");
        platformFeeRecipient = makeAddr("platform");
        relayer = makeAddr("relayer");
        arbitrator = makeAddr("arb");
        token.mint(traveler, TOTAL);
    }

    function _params(bytes32 orderId) internal view returns (Escrow.EscrowParams memory) {
        return Escrow.EscrowParams({
            chainId: 1,
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
            arbitrator: arbitrator
        });
    }

    function _fundEscrowV2(bytes32 orderId) internal returns (EscrowV2 escrow) {
        address escrowAddr = factory.createEscrow(_params(orderId));
        escrow = EscrowV2(escrowAddr);
        vm.prank(traveler);
        token.approve(escrowAddr, TOTAL);
        vm.prank(traveler);
        escrow.deposit(TOTAL);
    }

    function test_releaseRevertsUntilBothConfirm() public {
        EscrowV2 escrow = _fundEscrowV2(keccak256("v2-order-1"));

        vm.expectRevert(EscrowV2.ServiceNotComplete.selector);
        escrow.release();

        vm.prank(traveler);
        escrow.confirmServiceComplete();

        vm.expectRevert(EscrowV2.ServiceNotComplete.selector);
        vm.prank(relayer);
        escrow.release();

        vm.prank(guide);
        escrow.confirmServiceComplete();

        vm.prank(relayer);
        escrow.release();
        assertEq(uint256(escrow.status()), uint256(Escrow.Status.Completed));
        uint256 fee = (TOTAL * FEE_BPS) / 10000;
        assertEq(token.balanceOf(guide), TOTAL - fee);
        assertEq(token.balanceOf(platformFeeRecipient), fee);
    }

    function test_confirmTwiceReverts() public {
        EscrowV2 escrow = _fundEscrowV2(keccak256("v2-order-2"));
        vm.startPrank(traveler);
        escrow.confirmServiceComplete();
        vm.expectRevert(EscrowV2.AlreadyConfirmedService.selector);
        escrow.confirmServiceComplete();
        vm.stopPrank();
    }
}
