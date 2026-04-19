// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GovernanceTreasury.sol";
import "../src/GovernanceTimelock.sol";
import "../src/MockERC20.sol";

/// **TT-B090-GOVERNANCE-TREASURY-FOUNDRY-001**：**`spend` / `spendETH`** 收款余额增量 = payload；**Timelock `execute`** 与生产 **`call`** 同源；**非 spender** revert。
contract GovernanceTreasuryTest is Test {
    address internal deployer = address(this);
    address internal recipient = address(0xC0FFEE);

    /// **TT-B090-SPEND-ERC20-DIRECT-001**
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

    /// **TT-B090-SPEND-ERC20-ONLY-SPENDER-001**
    function test_b090_non_spender_cannot_spend() public {
        MockERC20 token = new MockERC20();
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, deployer);
        token.mint(address(treasury), 100e6);

        vm.prank(address(0xB0B));
        vm.expectRevert(GovernanceTreasury.OnlySpender.selector);
        treasury.spend(address(token), recipient, 1e6);
    }

    /// **TT-B090-TIMELOCK-SPEND-ERC20-PAYLOAD-001**：**`schedule` → delay → `execute`** → 收款 **ERC20** 增量 = calldata **amount**。
    function test_b090_timelock_execute_spend_matches_payload() public {
        MockERC20 token = new MockERC20();
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 10);
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, address(tl));

        uint256 fund = 5_000_000e6;
        uint256 pay = 999_999e6;
        token.mint(address(treasury), fund);

        tl.setAllowedExecutionTarget(address(treasury), true);

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

    /// **TT-B090-TIMELOCK-SPENDETH-PAYLOAD-001**：Timelock **`execute` → `spendETH`**，收款 **ETH** 增量 = calldata **wei**。
    function test_COMP_B090_timelock_execute_spendETH_matches_payload() public {
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 10);
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, address(tl));

        uint256 fund = 5 ether;
        vm.deal(address(treasury), fund);

        uint256 pay = 1.234 ether;
        uint256 balBefore = recipient.balance;

        tl.setAllowedExecutionTarget(address(treasury), true);

        bytes memory data = abi.encodeWithSelector(
            GovernanceTreasury.spendETH.selector,
            recipient,
            pay
        );
        bytes32 salt = bytes32(uint256(42));
        bytes32 id = tl.schedule(address(treasury), 0, data, salt);

        vm.warp(block.timestamp + 10);
        tl.execute(id);

        assertEq(recipient.balance, balBefore + pay);
        assertEq(address(treasury).balance, fund - pay);
    }

    /// **TT-B090-SPENDETH-DIRECT-PAYLOAD-001**：**`spender`** 直连 **`spendETH`**（无 Timelock）时，收款 **ETH** 增量 = payload **wei**（与 **`spend` 直连** 对称）。
    function test_TT_B090_spendETH_direct_increases_recipient_balance_by_payload() public {
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, deployer);

        uint256 fund = 3 ether;
        vm.deal(address(treasury), fund);

        uint256 pay = 0.789 ether;
        uint256 balBefore = recipient.balance;

        treasury.spendETH(recipient, pay);

        assertEq(recipient.balance, balBefore + pay);
        assertEq(address(treasury).balance, fund - pay);
    }

    function test_COMP_B090_non_spender_cannot_spendETH() public {
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, deployer);
        vm.deal(address(treasury), 1 ether);

        vm.prank(address(0xB0B));
        vm.expectRevert(GovernanceTreasury.OnlySpender.selector);
        treasury.spendETH(recipient, 1 wei);
    }

    /// **P0**：**ERC20 spend allowlist** 开启后，未列入 token **revert**；列入后 **通过**。
    function test_erc20_spend_allowlist_blocks_unlisted() public {
        MockERC20 token = new MockERC20();
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, deployer);
        token.mint(address(treasury), 100e6);

        treasury.setErc20SpendAllowlistEnabled(true);

        vm.expectRevert(GovernanceTreasury.Erc20SpendNotAllowed.selector);
        treasury.spend(address(token), recipient, 1e6);
    }

    function test_erc20_spend_allowlist_allows_listed() public {
        MockERC20 token = new MockERC20();
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, deployer);
        token.mint(address(treasury), 100e6);

        treasury.setErc20SpendAllowlistEnabled(true);
        treasury.setErc20SpendAllowed(address(token), true);

        treasury.spend(address(token), recipient, 1e6);
        assertEq(token.balanceOf(recipient), 1e6);
    }
}
