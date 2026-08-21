// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/// @notice Minimal ERC20 surface used by V9 public sale (English NatSpec only).
interface ITtgV9Erc20 {
    function balanceOf(address account) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);
}

/// @notice Protocol-only burn (Vault / Timelock custody). No public holder burn.
interface ITtgV9ProtocolBurnable is ITtgV9Erc20 {
    function protocolBurn(uint256 amount) external;
}

/// @notice Batch market view used to block governance burn during open/armed batches.
interface ITtgV9BatchMarketBurnGate {
    function hasOpenOrArmedUnclosedBatch() external view returns (bool);
}
