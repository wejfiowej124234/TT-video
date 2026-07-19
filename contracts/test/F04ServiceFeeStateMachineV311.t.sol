// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/ServiceFeeStatesV311.sol";
import "../src/MockERC20.sol";

/**
 * @title F04ServiceFeeStateMachineV311Test
 * @notice Phase A · Gap F-04 · Local Verify（①）
 */
contract F04ServiceFeeStateMachineV311Test is Test {
    Escrow internal escrow;
    MockERC20 internal token;
    address internal traveler;
    address internal guide;
    address internal platform;

    function setUp() public {
        traveler = makeAddr("traveler");
        guide = makeAddr("guide");
        platform = makeAddr("platform");
        token = new MockERC20();
        escrow = new Escrow(address(this));
        token.mint(traveler, 1_000e6);
        vm.prank(traveler);
        token.approve(address(escrow), type(uint256).max);

        Escrow.EscrowParams memory p = Escrow.EscrowParams({
            chainId: block.chainid,
            orderId: bytes32(uint256(1)),
            snapshotHash: bytes32(uint256(2)),
            schemaVersion: 1,
            traveler: traveler,
            guide: guide,
            platformFeeRecipient: platform,
            token: address(token),
            totalAmount: 1_000e6,
            platformFeeBps: 500,
            serviceStart: 1,
            serviceEnd: 2,
            disputeWindowSeconds: 0,
            arbitrator: address(this)
        });
        escrow.init(p);
    }

    function test_F04_pending_locked_distributable_distributed() public {
        assertEq(
            uint256(escrow.serviceFeeState()),
            uint256(ServiceFeeStatesV311.State.SERVICE_FEE_PENDING)
        );
        vm.prank(traveler);
        escrow.deposit(1_000e6);
        assertEq(
            uint256(escrow.serviceFeeState()),
            uint256(ServiceFeeStatesV311.State.SERVICE_FEE_LOCKED)
        );
        escrow.release();
        assertEq(
            uint256(escrow.serviceFeeState()),
            uint256(ServiceFeeStatesV311.State.SERVICE_FEE_DISTRIBUTED)
        );
    }
}
