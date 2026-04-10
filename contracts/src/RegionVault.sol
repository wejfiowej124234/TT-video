// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title RegionVault
 * @notice 国家桶资金池（Partial · MVP）：承接 FeeRouter 第一层拆分中的 `countryBucket` 入账；与 Escrow 用户托管资金流隔离。
 * @dev 按 ISO 国别链上账本、Snapshot/Claim、与 84 十国承销参数逐国路由等为协议 Target（83/84、14 §1.1.1），不在本合约实现。
 *      运维上由 `owner`（宜多签）通过 `forward` 将池内代币转至各辖区运营/治理地址；链下 policy 与 Runbook §7.1 对齐。
 */
contract RegionVault {
    address public owner;

    error OnlyOwner();
    error TransferFailed();
    error InvalidAmount();
    error InvalidAddress();
    error EmptyRegionId();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RegionVaultForwarded(address indexed token, address indexed to, uint256 amount);

    /// @notice 与 API `parse_region_share_snapshot_line` / B-115-4 约定一致：`RegionShareSnapshotLine(uint256,address,string,uint256,uint256)`（topic0 = keccak256 该签名字符串）。
    event RegionShareSnapshotLine(
        uint256 indexed snapshotEpoch,
        address indexed recipient,
        string regionId,
        uint256 snapshotBlockNumber,
        uint256 shareBalance
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address owner_) {
        owner = owner_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice 将本合约持有的 ERC20 转出至指定地址。
     * @param token 代币合约
     * @param to 收款方（多签/国库等）
     * @param amount 转出数量（须 ≤ 本合约余额）
     */
    function forward(IERC20 token, address to, uint256 amount) external onlyOwner {
        if (address(token) == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidAmount();
        if (token.balanceOf(address(this)) < amount) revert InvalidAmount();
        if (!token.transfer(to, amount)) revert TransferFailed();
        emit RegionVaultForwarded(address(token), to, amount);
    }

    /**
     * @notice P5-3-1：链上锚点发出（仅 `owner`）；**不**改变 `forward` 资金路径语义。
     * @dev 事件 ABI 须与 `crates/api/src/chain/indexer.rs` 中 `REGION_SHARE_SNAPSHOT_LINE_EVENT_SIGNATURE` 逐字段一致。
     */
    function emitRegionShareSnapshotLine(
        uint256 snapshotEpoch,
        address recipient,
        string calldata regionId,
        uint256 snapshotBlockNumber,
        uint256 shareBalance
    ) external onlyOwner {
        if (bytes(regionId).length == 0) revert EmptyRegionId();
        if (recipient == address(0)) revert InvalidAddress();
        emit RegionShareSnapshotLine(snapshotEpoch, recipient, regionId, snapshotBlockNumber, shareBalance);
    }
}
