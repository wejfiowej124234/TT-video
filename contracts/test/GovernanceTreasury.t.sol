// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GovernanceTreasury.sol";
import "../src/GovernanceTimelock.sol";
import "../src/MockERC20.sol";

/// B-090：支出后收款人余额增量 = payload **amount**（同币）；**非 spender** 不可 **spend**。
contract GovernanceTreasuryTest is Test {
    address internal deployer = address(this);
    address internal recipient = address(0xC0FFEE);

    function test_b090_spend_increases_recipient_balance_by_payload() public {
        MockERC20 token = new MockERC20();
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, deployer);

        uint256 fund = 1_000_000e6;
        token.mint(address(treasury), fund);

        uint256 pay = 123_456e6;
        uint256 balBefore = token.balanceOf(recipient);

        treasury.spend(address(token), recipient, pay);

        assertEq(token.balanceOf(recipient), balBefore + pay);
        assertEq(token.balanceOf(address(treasury)), fund - pay);
    }

    function test_b090_non_spender_cannot_spend() public {
        MockERC20 token = new MockERC20();
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, deployer);
        token.mint(address(treasury), 100e6);

        vm.prank(address(0xB0B));
        vm.expectRevert(GovernanceTreasury.OnlySpender.selector);
        treasury.spend(address(token), recipient, 1e6);
    }

    /// E2E：**Timelock `execute`** 触发 **`spend`**，收款增量 = calldata 中的 **amount**。
    function test_b090_timelock_execute_spend_matches_payload() public {
        MockERC20 token = new MockERC20();
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 10);
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, address(tl));

        uint256 fund = 5_000_000e6;
        uint256 pay = 999_999e6;
        token.mint(address(treasury), fund);

        bytes memory data = abi.encodeWithSelector(
            GovernanceTreasury.spend.selector,
            address(token),
            recipient,
            pay
        );
        bytes32 salt = bytes32(uint256(7));
        bytes32 id = tl.schedule(address(treasury), 0, data, salt);

        vm.warp(block.timestamp + 10);
        tl.execute(id);

        assertEq(token.balanceOf(recipient), pay);
        assertEq(token.balanceOf(address(treasury)), fund - pay);
    }
}
