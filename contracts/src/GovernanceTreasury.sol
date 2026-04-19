// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title GovernanceTreasury
 * @notice 母表 **B-090 Partial**：治理金库 **单笔 ERC20 支出**；**`token` / `to` / `amount`** 仅能通过链上 **`spend` calldata**（或经 **Timelock `execute`** 的同一字节）生效，**后端不可改写**已上链 payload。
 * @dev **`spender`** 宜设为 **`GovernanceTimelock`**；**`owner`** 可 **`setSpender`**、**`transferOwnership`**（多签运维）。**`receive` + `spendETH`**：**Completion B-090** 原生币路径；**不含**链上提案投票 UI、**非** `governance_pool` 展示行。
 */
contract GovernanceTreasury {
    address public owner;
    address public spender;

    /// @notice **P0（可选）**：为 **ERC20 `spend`** 启用 **allowlist** 时，仅允许列表内 token 被划出（**默认关闭**，保持既有部署行为不变）。**`spendETH` 不受此限制**（原生币路径由 Timelock/运维流程约束）。
    bool public erc20SpendAllowlistEnabled;

    mapping(address => bool) public erc20SpendAllowed;

    error OnlyOwner();
    error OnlySpender();
    error TransferFailed();
    error EthTransferFailed();
    error InvalidAmount();
    error InvalidRecipient();
    error Erc20SpendNotAllowed();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SpenderUpdated(address indexed previousSpender, address indexed newSpender);
    event Erc20SpendAllowlistEnabledUpdated(bool enabled);
    event Erc20SpendAllowedUpdated(address indexed token, bool allowed);
    event TreasurySpent(
        address indexed token,
        address indexed to,
        uint256 amount
    );
    event TreasuryEthSpent(address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlySpender() {
        if (msg.sender != spender) revert OnlySpender();
        _;
    }

    constructor(address owner_, address spender_) {
        if (spender_ == address(0)) revert InvalidRecipient();
        owner = owner_;
        spender = spender_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidRecipient();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setSpender(address newSpender) external onlyOwner {
        if (newSpender == address(0)) revert InvalidRecipient();
        emit SpenderUpdated(spender, newSpender);
        spender = newSpender;
    }

    /// @notice 开启后，`spend(token,…)` **仅**允许 **`erc20SpendAllowed[token]==true`** 的 ERC20。
    function setErc20SpendAllowlistEnabled(bool enabled) external onlyOwner {
        erc20SpendAllowlistEnabled = enabled;
        emit Erc20SpendAllowlistEnabledUpdated(enabled);
    }

    /// @notice 将某 ERC20 标记为允许/禁止经 `spend` 划出（**allowlist 开启时生效**）。
    function setErc20SpendAllowed(address token, bool allowed) external onlyOwner {
        erc20SpendAllowed[token] = allowed;
        emit Erc20SpendAllowedUpdated(token, allowed);
    }

    receive() external payable {}

    /**
     * @notice 单笔转出原生币；**仅** `spender`（通常为 Timelock）可调。
     */
    function spendETH(address to, uint256 amount) external onlySpender {
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidRecipient();
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert EthTransferFailed();
        emit TreasuryEthSpent(to, amount);
    }

    /**
     * @notice 单笔转出；**仅** `spender`（通常为 Timelock）可调。
     */
    function spend(address token, address to, uint256 amount) external onlySpender {
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidRecipient();
        if (erc20SpendAllowlistEnabled && !erc20SpendAllowed[token]) revert Erc20SpendNotAllowed();
        if (!IERC20(token).transfer(to, amount)) revert TransferFailed();
        emit TreasurySpent(token, to, amount);
    }
}
