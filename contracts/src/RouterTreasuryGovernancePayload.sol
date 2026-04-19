// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./FeeRouter.sol";
import "./GovernanceTreasury.sol";
import "./ReserveVault.sol";

/**
 * @title RouterTreasuryGovernancePayload
 * @notice **B-407**：Governor→Timelock **`targets` / `calldatas`** 的稳定 **selector** 与 **编码** SSOT（B-430 / B-431 回归、链下 `cast` / SDK 对齐）。
 * @dev **不**引入链上状态；**与** **InvestorDistributionClaim** / **B-088** **索引语义** **无**耦合。
 */
library RouterTreasuryGovernancePayload {
    bytes4 internal constant FEE_ROUTER_TRANSFER_OWNERSHIP = FeeRouter.transferOwnership.selector;
    bytes4 internal constant FEE_ROUTER_SET_ROUTING_CONFIG = FeeRouter.setRoutingConfig.selector;
    bytes4 internal constant FEE_ROUTER_SET_DISTRIBUTE_PAUSED = FeeRouter.setDistributePaused.selector;
    bytes4 internal constant FEE_ROUTER_DISTRIBUTE = FeeRouter.distribute.selector;

    bytes4 internal constant TREASURY_SPEND = GovernanceTreasury.spend.selector;
    bytes4 internal constant TREASURY_SPEND_ETH = GovernanceTreasury.spendETH.selector;

    bytes4 internal constant RESERVE_VAULT_WITHDRAW = ReserveVault.withdraw.selector;

    function encodeFeeRouterSetRoutingConfig(
        address countryBucket_,
        address globalStakers_,
        address globalReserve_,
        address globalOps_,
        uint256 bpsCountry_,
        uint256 bpsGlobalStakers_,
        uint256 bpsGlobalReserve_,
        uint256 bpsGlobalOps_
    ) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(
            FeeRouter.setRoutingConfig.selector,
            countryBucket_,
            globalStakers_,
            globalReserve_,
            globalOps_,
            bpsCountry_,
            bpsGlobalStakers_,
            bpsGlobalReserve_,
            bpsGlobalOps_
        );
    }

    function encodeTreasurySpend(address token, address to, uint256 amount) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(GovernanceTreasury.spend.selector, token, to, amount);
    }

    function encodeTreasurySpendEth(address to, uint256 amount) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(GovernanceTreasury.spendETH.selector, to, amount);
    }

    function encodeReserveVaultWithdraw(address to, uint256 amount) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(ReserveVault.withdraw.selector, to, amount);
    }
}
