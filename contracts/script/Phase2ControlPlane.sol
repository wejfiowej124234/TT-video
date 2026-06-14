// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";

/**
 * @title Phase2ControlPlane
 * @notice ② 测试网部署控制面解析（R-02）：非 Anvil 链上 **禁止** deployer EOA 担任
 *         Timelock.admin / EscrowFactory.guardian / Protocol P2 owner。
 * @dev Anvil (31337) 允许回落 deployer 以便本地 smoke；Sepolia 等须 env 显式非 deployer 地址。
 *
 * Env（② broadcast 前必填其一组合）：
 *   TIMELOCK_ADMIN_ADDRESS       — GovernanceTimelock.admin（宜 Gnosis Safe / 多签）
 *   TIMELOCK_ADDRESS             — 已部署 Timelock（P2 owner / guardian 默认指向）
 *   PHASE2_CHAIN_OWNER_ADDRESS   — 覆盖 P2 owner（默认 = TIMELOCK_ADDRESS）
 *   ESCROW_FACTORY_GUARDIAN_ADDRESS — 覆盖 Factory guardian（默认 = TIMELOCK_ADDRESS）
 */
abstract contract Phase2ControlPlane is Script {
    error Phase2DeployerEoaForbidden();
    error Phase2TimelockRequired();

    function _isLocalAnvilChain(uint256 chainId) internal pure returns (bool) {
        return chainId == 31337;
    }

    function _isLocalAnvil() internal view returns (bool) {
        return _isLocalAnvilChain(block.chainid);
    }

    /// @dev 纯函数解析 — 单测直传 env 槽，避免 Foundry 进程级 env 串扰。
    function resolveTimelockAdminFrom(
        address deployer,
        address timelockAdminEnv,
        uint256 chainId
    ) internal pure returns (address admin) {
        admin = timelockAdminEnv;
        if (admin == address(0)) {
            if (_isLocalAnvilChain(chainId)) return deployer;
            revert Phase2TimelockRequired();
        }
        if (!_isLocalAnvilChain(chainId) && admin == deployer) revert Phase2DeployerEoaForbidden();
    }

    function resolveChainOwnerFrom(
        address deployer,
        address phase2OwnerEnv,
        address timelockEnv,
        uint256 chainId
    ) internal pure returns (address owner) {
        owner = phase2OwnerEnv;
        if (owner == address(0)) {
            owner = timelockEnv;
        }
        if (owner == address(0)) {
            if (_isLocalAnvilChain(chainId)) return deployer;
            revert Phase2TimelockRequired();
        }
        if (!_isLocalAnvilChain(chainId) && owner == deployer) revert Phase2DeployerEoaForbidden();
    }

    function resolveEscrowFactoryGuardianFrom(
        address deployer,
        address guardianEnv,
        address timelockAddr,
        uint256 chainId
    ) internal pure returns (address guardian) {
        guardian = guardianEnv;
        if (guardian == address(0)) {
            if (timelockAddr != address(0)) {
                guardian = timelockAddr;
            } else if (_isLocalAnvilChain(chainId)) {
                guardian = deployer;
            } else {
                revert Phase2TimelockRequired();
            }
        }
        if (!_isLocalAnvilChain(chainId) && guardian == deployer) revert Phase2DeployerEoaForbidden();
    }

    /// @notice Timelock `admin` — 非 Anvil 须 `TIMELOCK_ADMIN_ADDRESS` 且 ≠ deployer。
    function resolveTimelockAdmin(address deployer) internal view returns (address admin) {
        return resolveTimelockAdminFrom(deployer, vm.envOr("TIMELOCK_ADMIN_ADDRESS", address(0)), block.chainid);
    }

    /// @notice P2 / Distribution / Ledger `owner` — 非 Anvil 须 Timelock（或显式 PHASE2_CHAIN_OWNER）。
    function resolveChainOwner(address deployer) internal view returns (address owner) {
        return resolveChainOwnerFrom(
            deployer,
            vm.envOr("PHASE2_CHAIN_OWNER_ADDRESS", address(0)),
            vm.envOr("TIMELOCK_ADDRESS", address(0)),
            block.chainid
        );
    }

    /// @notice EscrowFactory `guardian` — 非 Anvil 默认 TIMELOCK_ADDRESS。
    function resolveEscrowFactoryGuardian(address deployer, address timelockAddr) internal view returns (address guardian) {
        return resolveEscrowFactoryGuardianFrom(
            deployer,
            vm.envOr("ESCROW_FACTORY_GUARDIAN_ADDRESS", address(0)),
            timelockAddr,
            block.chainid
        );
    }
}
