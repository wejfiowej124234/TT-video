// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "./Phase2ControlPlane.sol";
import "../src/CountryPoolRedemptionEpochV0.sol";
import "../src/MockERC20.sol";

/**
 * Protocol Convergence P2 · ② CN 试点赎回窗部署（Anvil / 测试网）。
 *
 * 环境：
 *   PRIVATE_KEY — 部署者（缺省 anvil #0）
 *   REDEMPTION_ASSET_ADDRESS — 结算资产（USDC 等）；缺省 new MockERC20
 *   REDEMPTION_JURISDICTION — 默认 CN（bytes2）
 *   REDEMPTION_MAX_NAV_PCT_BPS — 默认 1000（protocol-ssot lock_tiers）
 *   REDEMPTION_WINDOW_SECONDS — 默认 1296000（15d）
 *   TIMELOCK_ADDRESS — ② Sepolia 必填 · epoch owner（R-02）
 */
contract DeployCountryPoolRedemptionEpochV0 is Phase2ControlPlane {
    function _jid(bytes1 a, bytes1 b) private pure returns (bytes2) {
        return bytes2((uint16(uint8(a)) << 8) | uint8(b));
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }

        uint256 maxNavBps = vm.envOr("REDEMPTION_MAX_NAV_PCT_BPS", uint256(1000));
        uint256 windowSec = vm.envOr("REDEMPTION_WINDOW_SECONDS", uint256(15 days));
        bytes2 jurisdiction = _jid("C", "N");
        string memory jidStr = vm.envOr("REDEMPTION_JURISDICTION", string("CN"));
        if (bytes(jidStr).length >= 2) {
            bytes memory b = bytes(jidStr);
            jurisdiction = bytes2((uint16(uint8(b[0])) << 8) | uint8(b[1]));
        }

        address deployer = vm.addr(deployerPrivateKey);
        address timelockAddr = vm.envOr("TIMELOCK_ADDRESS", address(0));
        if (!_isLocalAnvil() && timelockAddr == address(0)) {
            revert Phase2TimelockRequired();
        }

        address epochOwner = resolveChainOwner(deployer);

        address assetAddr = vm.envOr("REDEMPTION_ASSET_ADDRESS", address(0));

        vm.startBroadcast(deployerPrivateKey);

        if (assetAddr == address(0)) {
            MockERC20 mock = new MockERC20();
            assetAddr = address(mock);
        }

        CountryPoolRedemptionEpochV0 epoch = new CountryPoolRedemptionEpochV0(
            epochOwner, jurisdiction, assetAddr, maxNavBps, windowSec
        );

        vm.stopBroadcast();

        console.log("--- DeployCountryPoolRedemptionEpochV0 (protocol-ssot P2) ---");
        console.log("deployer", deployer);
        console.log("TIMELOCK", timelockAddr);
        console.log("epoch_owner", epochOwner);
        console.log("epoch_owner_is_timelock", epochOwner == timelockAddr);
        console.log("epoch_owner_not_deployer", epochOwner != deployer);
        console.log("COUNTRY_POOL_REDEMPTION_EPOCH_CN", address(epoch));
        console.log("REDEMPTION_ASSET", assetAddr);
        console.log("jurisdiction_id", jidStr);
        console.log("max_nav_pct_bps", maxNavBps);
        console.log("window_seconds", windowSec);
        console.log("epoch_version", epoch.version());
        _logRedemptionBindings(deployer, epochOwner, timelockAddr, assetAddr, jurisdiction, maxNavBps, windowSec, epoch);
        _assertRedemptionBindings(deployer, epochOwner, timelockAddr, jurisdiction, maxNavBps, windowSec, epoch);
        console.log("REDEMPTION_BINDING_CHECK: OK");
    }

    function _logRedemptionBindings(
        address deployer,
        address epochOwner,
        address timelockAddr,
        address assetAddr,
        bytes2 jurisdiction,
        uint256 maxNavBps,
        uint256 windowSec,
        CountryPoolRedemptionEpochV0 epoch
    ) internal view {
        console.log("BINDING epoch.owner", epoch.owner());
        console.log("BINDING epoch.owner_is_timelock", epoch.owner() == timelockAddr);
        console.log("BINDING epoch.owner_not_deployer", epoch.owner() != deployer);
        console.log("BINDING epoch.asset", address(epoch.asset()));
        console.log("BINDING epoch.jurisdiction", uint256(uint16(jurisdiction)));
        console.log("BINDING epoch.maxNavPctBps", epoch.maxNavPctBps());
        console.log("BINDING epoch.windowSeconds", epoch.windowSeconds());
    }

    function _assertRedemptionBindings(
        address deployer,
        address epochOwner,
        address timelockAddr,
        bytes2 jurisdiction,
        uint256 maxNavBps,
        uint256 windowSec,
        CountryPoolRedemptionEpochV0 epoch
    ) internal view {
        require(epoch.owner() == epochOwner, "Redemption: owner!=epochOwner");
        require(epochOwner != deployer, "Redemption: owner must not be deployer EOA");
        if (!_isLocalAnvil()) {
            require(timelockAddr != address(0), "Redemption: TIMELOCK_ADDRESS required");
            require(epochOwner == timelockAddr, "Redemption: epochOwner!=Timelock");
        }
        require(epoch.jurisdiction() == jurisdiction, "Redemption: jurisdiction mismatch");
        require(epoch.maxNavPctBps() == maxNavBps, "Redemption: maxNavPctBps mismatch");
        require(epoch.windowSeconds() == windowSec, "Redemption: windowSeconds mismatch");
        require(maxNavBps == 1000, "Redemption: SSOT maxNavPctBps!=1000");
        require(windowSec == 15 days, "Redemption: SSOT window!=15d");
        require(uint16(jurisdiction) == uint16(_jid("C", "N")), "Redemption: pilot jurisdiction!=CN");
    }
}
