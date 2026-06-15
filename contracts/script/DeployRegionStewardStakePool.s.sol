// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "./Phase2ControlPlane.sol";
import "../src/RegionStewardStakePool.sol";
import "../src/MockERC20.sol";

/**
 * Protocol Convergence P2 · ② 部署入口（Anvil / 测试网）。
 *
 * 用法：
 *   forge script script/DeployRegionStewardStakePool.s.sol:DeployRegionStewardStakePool \
 *     --rpc-url <RPC> --broadcast
 *
 * 环境：
 *   PRIVATE_KEY — 部署者（缺省 anvil #0）
 *   STEWARD_TTG_ADDRESS — 已有 TTG；缺省则 new MockERC20（仅 dev/anvil）
 *   TIMELOCK_ADDRESS — ② Sepolia 必填 · pool owner（R-02 · 默认 = 已部署 Timelock）
 *   TTG_TOTAL_SUPPLY_UNITS — 默认 10_000_000 ether（与 protocol-ssot）
 *   STEWARD_RELEASE_DELAY_SECONDS — 默认 7776000（90d）
 *   STEWARD_RELEASE_VEST_SECONDS — 默认 31536000（365d）
 */
contract DeployRegionStewardStakePool is Phase2ControlPlane {
    function _jid(bytes1 a, bytes1 b) private pure returns (bytes2) {
        return bytes2((uint16(uint8(a)) << 8) | uint8(b));
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }

        uint256 supplyUnits = vm.envOr("TTG_TOTAL_SUPPLY_UNITS", uint256(10_000_000 ether));
        uint256 releaseDelay = vm.envOr("STEWARD_RELEASE_DELAY_SECONDS", uint256(90 days));
        uint256 releaseVest = vm.envOr("STEWARD_RELEASE_VEST_SECONDS", uint256(365 days));

        address deployer = vm.addr(deployerPrivateKey);
        address timelockAddr = vm.envOr("TIMELOCK_ADDRESS", address(0));
        if (!_isLocalAnvil() && timelockAddr == address(0)) {
            revert Phase2TimelockRequired();
        }

        address poolOwner = resolveChainOwner(deployer);

        address ttgAddr = vm.envOr("STEWARD_TTG_ADDRESS", address(0));
        if (ttgAddr == address(0)) {
            ttgAddr = vm.envOr("GOVERNANCE_TOKEN_ADDRESS", address(0));
        }

        vm.startBroadcast(deployerPrivateKey);

        if (ttgAddr == address(0)) {
            MockERC20 mock = new MockERC20();
            ttgAddr = address(mock);
        }

        RegionStewardStakePool pool = new RegionStewardStakePool(
            poolOwner, ttgAddr, supplyUnits, releaseDelay, releaseVest
        );

        vm.stopBroadcast();

        console.log("--- DeployRegionStewardStakePool (protocol-ssot P2) ---");
        console.log("deployer", deployer);
        console.log("TIMELOCK", timelockAddr);
        console.log("pool_owner", poolOwner);
        console.log("pool_owner_is_timelock", poolOwner == timelockAddr);
        console.log("pool_owner_not_deployer", poolOwner != deployer);
        console.log("REGION_STEWARD_STAKE_POOL", address(pool));
        console.log("STEWARD_TTG_TOKEN", ttgAddr);
        console.log("ttg_total_supply_units", supplyUnits);
        console.log("release_delay_seconds", releaseDelay);
        console.log("release_vest_seconds", releaseVest);
        console.log("pool_version", pool.version());
        console.log("min_stake_CN", pool.minStakeAmount(_jid("C", "N")));
        _logStewardBindings(deployer, poolOwner, timelockAddr, ttgAddr, pool);
        _assertStewardBindings(deployer, poolOwner, timelockAddr, ttgAddr, pool, supplyUnits, releaseDelay, releaseVest);
        console.log("STEWARD_BINDING_CHECK: OK");
    }

    function _logStewardBindings(
        address deployer,
        address poolOwner,
        address timelockAddr,
        address ttgAddr,
        RegionStewardStakePool pool
    ) internal view {
        console.log("BINDING pool.owner", pool.owner());
        console.log("BINDING pool.owner_is_timelock", pool.owner() == timelockAddr);
        console.log("BINDING pool.owner_not_deployer", pool.owner() != deployer);
        console.log("BINDING pool.ttg", address(pool.ttg()));
        console.log("BINDING pool.stewardStakeBps_CN", pool.stewardStakeBps(_jid("C", "N")));
        console.log("BINDING pool.minStakeAmount_CN", pool.minStakeAmount(_jid("C", "N")));
    }

    function _assertStewardBindings(
        address deployer,
        address poolOwner,
        address timelockAddr,
        address ttgAddr,
        RegionStewardStakePool pool,
        uint256 supplyUnits,
        uint256 releaseDelay,
        uint256 releaseVest
    ) internal view {
        require(pool.owner() == poolOwner, "Steward: owner!=poolOwner");
        require(address(pool.ttg()) == ttgAddr, "Steward: ttg mismatch");
        // ① Anvil (31337): allow deployer EOA owner for local smoke; ②+ forbids deployer EOA (R-02).
        if (!_isLocalAnvil()) {
            require(poolOwner != deployer, "Steward: owner must not be deployer EOA");
            require(timelockAddr != address(0), "Steward: TIMELOCK_ADDRESS required");
            require(poolOwner == timelockAddr, "Steward: poolOwner!=Timelock");
        }
        require(pool.stewardStakeBps(_jid("C", "N")) == 400, "Steward: CN bps");
        require(pool.stewardStakeBps(_jid("F", "R")) == 450, "Steward: FR bps");
        require(pool.minStakeAmount(_jid("C", "N")) == (supplyUnits * 400) / 10_000, "Steward: CN minStake");
        require(pool.ttgTotalSupplyUnits() == supplyUnits, "Steward: supplyUnits");
        require(pool.releaseDelaySeconds() == releaseDelay, "Steward: releaseDelay");
        require(pool.releaseVestSeconds() == releaseVest, "Steward: releaseVest");
    }
}
