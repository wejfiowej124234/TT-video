// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/CountryPoolLedgerV0.sol";
import "../src/IERC20.sol";
import "../src/MockERC20.sol";

/// P5-1-A：试点 **J*** = **DE**（`bytes2("DE")`），**T*** = **MockERC20**。
contract CountryPoolLedgerV0Test is Test {
    event CountryLedgerCredited(bytes2 indexed jurisdiction, address indexed token, uint256 amount, bytes32 ref);

    CountryPoolLedgerV0 public ledger;
    MockERC20 public token;
    address public admin = makeAddr("admin");

    bytes2 internal constant J_STAR = bytes2("DE");

    function setUp() public {
        token = new MockERC20();
        vm.prank(admin);
        ledger = new CountryPoolLedgerV0(admin, J_STAR);
    }

    function test_PilotJurisdiction_AndVersion() public view {
        assertEq(ledger.pilotJurisdiction(), J_STAR);
        assertEq(ledger.version(), "country_ledger_ssot_v0");
    }

    function test_Credit_EmitsEvent_BalanceAndTotalCredited() public {
        uint256 amount = 1_000 ether;
        token.mint(admin, amount);
        vm.startPrank(admin);
        token.approve(address(ledger), amount);
        vm.expectEmit(true, true, false, true);
        emit CountryLedgerCredited(J_STAR, address(token), amount, bytes32("ref1"));
        ledger.credit(J_STAR, token, amount, bytes32("ref1"));
        vm.stopPrank();

        assertEq(ledger.balance(address(token)), amount);
        assertEq(ledger.totalCredited(J_STAR, address(token)), amount);
        assertEq(token.balanceOf(address(ledger)), amount);
    }

    function test_RevertWrongJurisdiction() public {
        token.mint(admin, 100);
        vm.startPrank(admin);
        token.approve(address(ledger), 100);
        vm.expectRevert(CountryPoolLedgerV0.InvalidJurisdiction.selector);
        ledger.credit(bytes2("FR"), token, 100, bytes32(0));
        vm.stopPrank();
    }

    function test_RevertNotOwner() public {
        token.mint(admin, 100);
        address other = makeAddr("other");
        token.mint(other, 100);
        vm.prank(other);
        token.approve(address(ledger), 100);
        vm.expectRevert(CountryPoolLedgerV0.OnlyOwner.selector);
        ledger.credit(J_STAR, token, 100, bytes32(0));
    }

    function test_RevertZeroAmount() public {
        vm.prank(admin);
        vm.expectRevert(CountryPoolLedgerV0.InvalidAmount.selector);
        ledger.credit(J_STAR, token, 0, bytes32(0));
    }

    function test_RevertZeroToken() public {
        vm.prank(admin);
        vm.expectRevert(CountryPoolLedgerV0.InvalidAddress.selector);
        ledger.credit(J_STAR, IERC20(address(0)), 1, bytes32(0));
    }

    function test_TwoCredits_SumTotalCredited() public {
        token.mint(admin, 500);
        vm.startPrank(admin);
        token.approve(address(ledger), 500);
        ledger.credit(J_STAR, token, 200, bytes32("a"));
        ledger.credit(J_STAR, token, 300, bytes32("b"));
        vm.stopPrank();
        assertEq(ledger.totalCredited(J_STAR, address(token)), 500);
        assertEq(ledger.balance(address(token)), 500);
    }
}
