// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * 最小 IERC20 接口（与 01 §4 一致；MVP 仅需 transfer/transferFrom）
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}
