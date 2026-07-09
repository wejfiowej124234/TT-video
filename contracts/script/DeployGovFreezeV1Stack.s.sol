// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Phase2ControlPlane.sol";
import "./Phase2SafeExec.sol";
import "./ProxyDeployLib.sol";
import "../src/GovernanceTimelock.sol";
import "../src/TravelTrustGovernor.sol";
import "../src/GovernanceTreasuryP4Cap.sol";
import "../src/TtgPrimaryMarketV1.sol";
import "../src/TtgSeatConcentrationRegistry.sol";
import "../src/RegionStewardStakePool.sol";
import "../src/TtgGovFreezeConstants.sol";
import "../src/upgrade/TimelockUpgradeableProxy.sol";

/**
 * @title DeployGovFreezeV1Stack
 * @notice Phase ② · **TTG-TOKENOMICS-FREEZE-V1** · **G24-P-UPGRADE-01** Proxy 基线
 * @dev Governable Shell 正式地址 = TimelockUpgradeableProxy · admin = Timelock · 禁止裸 Implementation
 */
contract DeployGovFreezeV1Stack is Phase2ControlPlane, Phase2SafeExec {
    struct Deployed {
        GovernanceTimelock timelock;
        TimelockUpgradeableProxy governorProxy;
        TimelockUpgradeableProxy treasuryP4Proxy;
        TimelockUpgradeableProxy primaryMarketProxy;
        TimelockUpgradeableProxy seatRegistryProxy;
        TimelockUpgradeableProxy stakePoolProxy;
    }

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address timelockAdmin = resolveTimelockAdmin(deployer);
        bool safeAdminPath = timelockAdmin != deployer && timelockAdmin.code.length > 0;

        address ttg = vm.envAddress("GOVERNANCE_TOKEN_ADDRESS");
        address usdc = vm.envAddress("USDC_TOKEN_ADDRESS");
        address usdcSink = vm.envOr("TREASURY_USDC_SINK_ADDRESS", timelockAdmin);
        uint256 ttgPerUsdc = vm.envOr("TTG_PRIMARY_MARKET_TTG_PER_USDC_UNIT", uint256(1 ether));
        bool deployNewStakePool = vm.envOr("GOV_FREEZE_V1_DEPLOY_STAKE_POOL", true);

        Deployed memory d;

        vm.startBroadcast(pk);

        d.timelock = new GovernanceTimelock(timelockAdmin, TtgGovFreezeConstants.GOVERNANCE_TIMELOCK_DELAY_SECONDS);

        address stakePoolProxyAddr = address(0);
        if (deployNewStakePool) {
            RegionStewardStakePool poolImpl = new RegionStewardStakePool(
                address(1),
                ttg,
                TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS,
                180 days,
                30 days
            );
            d.stakePoolProxy = ProxyDeployLib.deployTimelockControlledProxy(
                address(poolImpl),
                address(d.timelock),
                abi.encodeCall(RegionStewardStakePool.initializeProxyStorage, (address(d.timelock)))
            );
            stakePoolProxyAddr = address(d.stakePoolProxy);
        }

        TravelTrustGovernor govImpl = new TravelTrustGovernor(
            IGovernanceVotes(ttg),
            IGovernanceTimelockForGov(address(d.timelock)),
            vm.envOr("GOVERNOR_VOTING_DELAY_BLOCKS", uint256(1)),
            vm.envOr("GOVERNOR_VOTING_PERIOD_BLOCKS", uint256(20)),
            vm.envOr("GOVERNOR_PROPOSAL_THRESHOLD_WEI", uint256(1 ether)),
            TtgGovFreezeConstants.GOVERNANCE_QUORUM_BPS,
            TtgGovFreezeConstants.MAX_VOTING_POWER_PER_ADDRESS_BPS,
            vm.envOr("GOVERNOR_ORDER_RATING_REVIEW_WINDOW_DAYS", uint256(14))
        );
        d.governorProxy = ProxyDeployLib.deployTimelockControlledProxy(
            address(govImpl), address(d.timelock), bytes("")
        );

        GovernanceTreasuryP4Cap treasuryImpl =
            new GovernanceTreasuryP4Cap(address(1), address(1), usdc);
        d.treasuryP4Proxy = ProxyDeployLib.deployTimelockControlledProxy(
            address(treasuryImpl),
            address(d.timelock),
            abi.encodeCall(
                GovernanceTreasuryP4Cap.initializeProxyStorage,
                (address(d.timelock), address(d.timelock))
            )
        );

        TtgPrimaryMarketV1 marketImpl = new TtgPrimaryMarketV1(usdc, ttg, usdcSink, ttgPerUsdc);
        d.primaryMarketProxy = ProxyDeployLib.deployTimelockControlledProxy(
            address(marketImpl),
            address(d.timelock),
            abi.encodeCall(TtgPrimaryMarketV1.initializeProxyStorage, ())
        );

        TtgSeatConcentrationRegistry seatImpl = new TtgSeatConcentrationRegistry(address(1), address(0));
        d.seatRegistryProxy = ProxyDeployLib.deployTimelockControlledProxy(
            address(seatImpl),
            address(d.timelock),
            abi.encodeCall(
                TtgSeatConcentrationRegistry.initializeProxyStorage,
                (address(d.timelock), stakePoolProxyAddr)
            )
        );

        if (!safeAdminPath) {
            d.timelock.setGovernor(address(d.governorProxy));
            d.timelock.setAllowedExecutionTarget(address(d.governorProxy), true);
            d.timelock.setAllowedExecutionTarget(ttg, true);
            d.timelock.setAllowedExecutionTarget(address(d.treasuryP4Proxy), true);
        }

        vm.stopBroadcast();

        if (safeAdminPath) {
            uint256 ownerPk = resolveSafeOwnerPrivateKey();
            vm.startBroadcast(ownerPk);
            configureGovernanceTimelockViaSafe(
                timelockAdmin,
                address(d.timelock),
                address(d.governorProxy),
                ttg,
                ownerPk
            );
            safeExecCall(
                timelockAdmin,
                address(d.timelock),
                abi.encodeCall(
                    GovernanceTimelock.setAllowedExecutionTarget,
                    (address(d.treasuryP4Proxy), true)
                ),
                ownerPk
            );
            vm.stopBroadcast();
        }

        console.log("--- DeployGovFreezeV1Stack (G24-P-UPGRADE-01 PROXY BASELINE) ---");
        console.log("freeze_doc", TtgGovFreezeConstants.freezeDocumentId());
        console.log("GOV_FREEZE_V1_TIMELOCK", address(d.timelock));
        console.log("GOV_FREEZE_V1_GOVERNOR_PROXY", address(d.governorProxy));
        console.log("TREASURY_P4_CAP_PROXY", address(d.treasuryP4Proxy));
        console.log("PRIMARY_MARKET_PROXY", address(d.primaryMarketProxy));
        console.log("SEAT_REGISTRY_PROXY", address(d.seatRegistryProxy));
        if (deployNewStakePool) {
            console.log("REGION_STEWARD_STAKE_POOL_PROXY", address(d.stakePoolProxy));
        }
    }
}
