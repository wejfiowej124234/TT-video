// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/OnboardingFeeReceiver.sol";
import "../src/MockERC20.sol";

contract OnboardingFeeReceiverTest is Test {
    OnboardingFeeReceiver internal recv;
    MockERC20 internal token;
    address internal owner = makeAddr("owner");
    address internal payer = makeAddr("payer");

    bytes32 internal constant KEY = keccak256("idem-1");
    bytes32 internal constant FEE_VER = keccak256("fee-v1");

    event OnboardingFeePaid(
        bytes32 indexed idempotencyKey,
        address indexed payer,
        uint8 indexed roleTarget,
        address token,
        uint256 amount,
        bytes32 feeScheduleVersion
    );

    function setUp() public {
        recv = new OnboardingFeeReceiver(owner);
        token = new MockERC20();
        token.mint(payer, 1_000_000);
        vm.prank(payer);
        token.approve(address(recv), type(uint256).max);
    }

    function test_Pay_pullsAndEmits() public {
        vm.prank(payer);
        vm.expectEmit(true, true, true, true);
        emit OnboardingFeePaid(KEY, payer, 2, address(token), 100, FEE_VER);
        recv.pay(address(token), 100, KEY, 2, FEE_VER);
        assertEq(token.balanceOf(address(recv)), 100);
        assertEq(token.balanceOf(payer), 1_000_000 - 100);
    }

    function test_Pay_sameIdempotencyReverts() public {
        vm.startPrank(payer);
        recv.pay(address(token), 10, KEY, 1, FEE_VER);
        vm.expectRevert(OnboardingFeeReceiver.IdempotencyReplay.selector);
        recv.pay(address(token), 10, KEY, 1, FEE_VER);
        vm.stopPrank();
    }

    function test_Pay_whenPausedReverts() public {
        vm.prank(owner);
        recv.pause();
        vm.prank(payer);
        vm.expectRevert(OnboardingFeeReceiver.Paused.selector);
        recv.pay(address(token), 10, KEY, 1, FEE_VER);
    }

    function test_Pay_nativeValueReverts() public {
        vm.deal(payer, 1 ether);
        vm.prank(payer);
        vm.expectRevert(OnboardingFeeReceiver.UnexpectedNativeValue.selector);
        recv.pay{value: 1 wei}(address(token), 10, KEY, 1, FEE_VER);
    }

    function test_Pay_zeroTokenReverts() public {
        vm.prank(payer);
        vm.expectRevert(OnboardingFeeReceiver.InvalidToken.selector);
        recv.pay(address(0), 10, KEY, 1, FEE_VER);
    }

    function test_Unpause() public {
        vm.prank(owner);
        recv.pause();
        vm.prank(owner);
        recv.unpause();
        assertFalse(recv.paused());
    }
}
