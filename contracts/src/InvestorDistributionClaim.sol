// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title InvestorDistributionClaim
 * @notice B-087 / 83 / 14：份额持有人 **单交易** 领取应计分红，转出额 **≤** 剩余可领（`entitled - claimed`）。
 * @dev 行为钉死：**可领余额领尽后再次 `withdrawDividend` → `NothingToClaim()` revert**（非「成功但转 0」路径）。
 *      `distributionId` 与链下 `investor_distribution_accruals` 对齐：推荐 **`bytes32(uint256(uint128(uuidHigh))) << 128 | uint128(uuidLow)`**
 *      或将 UUID 16 字节左填充为 `bytes32`；运营须与 API/DB 主键约定一致。
 *
 *      现金流登记由 **`registerAccrual` / `registerAccrualsBatch`**（`onlyOwner`）完成，与 B-086 分录对账后上链。
 */
contract InvestorDistributionClaim {
    address public owner;

    mapping(bytes32 => address) public distributionToken;
    mapping(bytes32 => mapping(address => uint256)) public entitled;
    mapping(bytes32 => mapping(address => uint256)) public claimed;

    error OnlyOwner();
    error UnknownDistribution();
    error NothingToClaim();
    error TransferFailed();
    error InvalidInput();
    error TokenMismatch();
    error LengthMismatch();

    event AccrualRegistered(bytes32 indexed distributionId, address indexed holder, uint256 amount);
    event DistributionTokenSet(bytes32 indexed distributionId, address indexed token);
    event DividendWithdrawn(bytes32 indexed distributionId, address indexed holder, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address owner_) {
        owner = owner_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidInput();
        owner = newOwner;
    }

    function _registerAccrual(
        bytes32 distributionId,
        address token,
        address holder,
        uint256 amount
    ) internal {
        if (token == address(0) || holder == address(0)) revert InvalidInput();
        if (amount == 0) revert InvalidInput();

        address t = distributionToken[distributionId];
        if (t == address(0)) {
            distributionToken[distributionId] = token;
            emit DistributionTokenSet(distributionId, token);
        } else if (t != token) {
            revert TokenMismatch();
        }

        entitled[distributionId][holder] += amount;
        emit AccrualRegistered(distributionId, holder, amount);
    }

    function registerAccrual(
        bytes32 distributionId,
        address token,
        address holder,
        uint256 amount
    ) external onlyOwner {
        _registerAccrual(distributionId, token, holder, amount);
    }

    function registerAccrualsBatch(
        bytes32 distributionId,
        address token,
        address[] calldata holders,
        uint256[] calldata amounts
    ) external onlyOwner {
        if (holders.length != amounts.length) revert LengthMismatch();
        for (uint256 i = 0; i < holders.length; ) {
            _registerAccrual(distributionId, token, holders[i], amounts[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice 单笔领取 `min(remaining, maxAmount)`；`remaining = entitled - claimed`
     * @dev 双花：同一 `distributionId` 领尽后再调 **revert NothingToClaim**（集成测 `test_DoubleSpendSecondClaimReverts`）
     */
    function withdrawDividend(bytes32 distributionId, uint256 maxAmount) external {
        _withdrawDividend(distributionId, maxAmount);
    }

    /// @notice 与规格 **`claim`** 命名对齐；语义同 **`withdrawDividend`**
    function claim(bytes32 distributionId, uint256 maxAmount) external {
        _withdrawDividend(distributionId, maxAmount);
    }

    function _withdrawDividend(bytes32 distributionId, uint256 maxAmount) internal {
        if (maxAmount == 0) revert NothingToClaim();
        address tokenAddr = distributionToken[distributionId];
        if (tokenAddr == address(0)) revert UnknownDistribution();

        uint256 e = entitled[distributionId][msg.sender];
        uint256 c = claimed[distributionId][msg.sender];
        if (e <= c) revert NothingToClaim();
        uint256 remaining = e - c;
        uint256 pay = remaining < maxAmount ? remaining : maxAmount;
        if (pay == 0) revert NothingToClaim();

        claimed[distributionId][msg.sender] = c + pay;

        if (!IERC20(tokenAddr).transfer(msg.sender, pay)) revert TransferFailed();
        emit DividendWithdrawn(distributionId, msg.sender, pay);
    }

    function claimable(bytes32 distributionId, address holder) external view returns (uint256) {
        uint256 e = entitled[distributionId][holder];
        uint256 c = claimed[distributionId][holder];
        if (e <= c) return 0;
        return e - c;
    }
}
