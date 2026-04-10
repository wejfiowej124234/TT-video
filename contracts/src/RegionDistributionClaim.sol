// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title RegionDistributionClaim
 * @notice B-115-2：区域侧（RegionShare / 国家池叙事）**应计领取**合约面；与 **InvestorDistributionClaim（B-087）** 部署地址正交，接口形状一致以便与 **B-115-3** 链下 `distribution_bytes32` + token + holder + amount 登记对读。
 * @dev 行为与 Investor 合约同源钉死：**`entitled - claimed`** 单笔转出；领尽后 **`RegionNothingToClaim`**。
 *      `distributionId` 与链下 **`investor_distribution_accruals` / B-115-3** 推荐 **`bytes32`** 打包一致（UUID 低 128 位等）。
 */
contract RegionDistributionClaim {
    address public owner;

    mapping(bytes32 => address) public distributionToken;
    mapping(bytes32 => mapping(address => uint256)) public entitled;
    mapping(bytes32 => mapping(address => uint256)) public claimed;

    error RegionOnlyOwner();
    error RegionUnknownDistribution();
    error RegionNothingToClaim();
    error RegionTransferFailed();
    error RegionInvalidInput();
    error RegionTokenMismatch();
    error RegionLengthMismatch();

    event RegionAccrualRegistered(bytes32 indexed distributionId, address indexed holder, uint256 amount);
    event RegionDistributionTokenSet(bytes32 indexed distributionId, address indexed token);
    event RegionShareWithdrawn(bytes32 indexed distributionId, address indexed holder, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert RegionOnlyOwner();
        _;
    }

    constructor(address owner_) {
        owner = owner_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert RegionInvalidInput();
        owner = newOwner;
    }

    function _registerAccrual(
        bytes32 distributionId,
        address token,
        address holder,
        uint256 amount
    ) internal {
        if (token == address(0) || holder == address(0)) revert RegionInvalidInput();
        if (amount == 0) revert RegionInvalidInput();

        address t = distributionToken[distributionId];
        if (t == address(0)) {
            distributionToken[distributionId] = token;
            emit RegionDistributionTokenSet(distributionId, token);
        } else if (t != token) {
            revert RegionTokenMismatch();
        }

        entitled[distributionId][holder] += amount;
        emit RegionAccrualRegistered(distributionId, holder, amount);
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
        if (holders.length != amounts.length) revert RegionLengthMismatch();
        for (uint256 i = 0; i < holders.length; ) {
            _registerAccrual(distributionId, token, holders[i], amounts[i]);
            unchecked {
                ++i;
            }
        }
    }

    function withdrawDividend(bytes32 distributionId, uint256 maxAmount) external {
        _withdrawDividend(distributionId, maxAmount);
    }

    function claim(bytes32 distributionId, uint256 maxAmount) external {
        _withdrawDividend(distributionId, maxAmount);
    }

    function _withdrawDividend(bytes32 distributionId, uint256 maxAmount) internal {
        if (maxAmount == 0) revert RegionNothingToClaim();
        address tokenAddr = distributionToken[distributionId];
        if (tokenAddr == address(0)) revert RegionUnknownDistribution();

        uint256 e = entitled[distributionId][msg.sender];
        uint256 c = claimed[distributionId][msg.sender];
        if (e <= c) revert RegionNothingToClaim();
        uint256 remaining = e - c;
        uint256 pay = remaining < maxAmount ? remaining : maxAmount;
        if (pay == 0) revert RegionNothingToClaim();

        claimed[distributionId][msg.sender] = c + pay;

        if (!IERC20(tokenAddr).transfer(msg.sender, pay)) revert RegionTransferFailed();
        emit RegionShareWithdrawn(distributionId, msg.sender, pay);
    }

    function claimable(bytes32 distributionId, address holder) external view returns (uint256) {
        uint256 e = entitled[distributionId][holder];
        uint256 c = claimed[distributionId][holder];
        if (e <= c) return 0;
        return e - c;
    }
}
