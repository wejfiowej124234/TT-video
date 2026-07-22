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

import "../src/GovernanceVotesToken.sol";

import "../src/TtgGovFreezeConstants.sol";

import "../src/upgrade/TimelockUpgradeableProxy.sol";



/**

 * @title DeployGovFreezeV2CleanBaseline

 * @notice Phase ② · **G24-CLEAN-BASELINE-01** · 全新 Timelock + 全套 Proxy · 一次 init

 * @dev 禁止复用 V1 未 bootstrap 的 Stake Pool · Safe 批次 allow ×5 Shell + TTG

 *      Allocation SSOT = TTG-TOKENOMICS-GENESIS-V2 · GOV gates = TTG-TOKENOMICS-FREEZE-V1
 *      ACTIVE baseline = gov_freeze_v2_clean_baseline
 */


contract DeployGovFreezeV2CleanBaseline is Phase2ControlPlane, Phase2SafeExec {

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

        address ttg;
        bool deployNewTtg = vm.envOr("GOV_FREEZE_V2_DEPLOY_NEW_TTG", uint256(0)) != 0;
        address legacyTtg = address(0);
        if (deployNewTtg) {
            legacyTtg = vm.envOr("LEGACY_GOVERNANCE_TOKEN_ADDRESS", address(0));
        } else {
            ttg = vm.envAddress("GOVERNANCE_TOKEN_ADDRESS");
        }

        address usdc = vm.envAddress("USDC_TOKEN_ADDRESS");

        address usdcSink = vm.envOr("TREASURY_USDC_SINK_ADDRESS", timelockAdmin);

        uint256 ttgPerUsdc = vm.envOr("TTG_PRIMARY_MARKET_TTG_PER_USDC_UNIT", uint256(1 ether));



        Deployed memory d;



        vm.startBroadcast(pk);

        if (deployNewTtg) {
            GovernanceVotesToken newTtg = new GovernanceVotesToken(TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS, deployer);
            ttg = address(newTtg);
            console.log("GOV_FREEZE_V2_TTG_DEPLOYED", ttg);
            if (legacyTtg != address(0)) {
                console.log("GOV_FREEZE_V2_LEGACY_TTG", legacyTtg);
            }
        }

        d.timelock = new GovernanceTimelock(timelockAdmin, TtgGovFreezeConstants.GOVERNANCE_TIMELOCK_DELAY_SECONDS);



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

        address stakePoolProxyAddr = address(d.stakePoolProxy);



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
            d.timelock.setAllowedExecutionTarget(address(d.primaryMarketProxy), true);
            d.timelock.setAllowedExecutionTarget(address(d.seatRegistryProxy), true);
            d.timelock.setAllowedExecutionTarget(stakePoolProxyAddr, true);
        }

        if (deployNewTtg) {
            GovernanceVotesToken ttgToken = GovernanceVotesToken(ttg);
            ttgToken.approve(stakePoolProxyAddr, 1);
            require(ttgToken.allowance(deployer, stakePoolProxyAddr) == 1, "V2: TTG approve/allowance broken");
            ttgToken.approve(stakePoolProxyAddr, 0);
            // L3-03 Seq5 · fund full Public Sale bucket (5M) to match Genesis V2 / Registry rounds sum
            uint256 pmFund = vm.envOr("GOV_FREEZE_V2_PRIMARY_MARKET_TTG_FUND", uint256(5_000_000 ether));
            ttgToken.transfer(address(d.primaryMarketProxy), pmFund);
            console.log("GOV_FREEZE_V2_PRIMARY_MARKET_TTG_FUNDED", pmFund);
        }

        vm.stopBroadcast();



        if (safeAdminPath) {

            uint256 ownerPk = resolveSafeOwnerPrivateKey();

            vm.startBroadcast(ownerPk);

            configureGovFreezeV2CleanBaselineViaSafe(

                timelockAdmin,

                address(d.timelock),

                address(d.governorProxy),

                ttg,

                address(d.treasuryP4Proxy),

                address(d.primaryMarketProxy),

                address(d.seatRegistryProxy),

                stakePoolProxyAddr,

                ownerPk

            );

            vm.stopBroadcast();

        }



        _assertStakePoolBootstrapped(stakePoolProxyAddr);

        console.log("--- DeployGovFreezeV2CleanBaseline (G24-CLEAN-BASELINE-01) ---");

        console.log("baseline_id", "GOV-FREEZE-V2-CLEAN-BASELINE");

        console.log("allocation_doc", TtgGovFreezeConstants.freezeDocumentId());
        console.log("gov_gates_doc", TtgGovFreezeConstants.govGatesDocumentId());
        console.log("active_baseline", TtgGovFreezeConstants.activeDeployBaselineId());
        console.log("legacy_gov_freeze_baseline", TtgGovFreezeConstants.legacyGovFreezeCleanBaselineId());

        console.log("GOV_FREEZE_V2_TIMELOCK", address(d.timelock));

        console.log("GOV_FREEZE_V2_GOVERNOR_PROXY", address(d.governorProxy));

        console.log("GOV_FREEZE_V2_TREASURY_P4_PROXY", address(d.treasuryP4Proxy));

        console.log("GOV_FREEZE_V2_PRIMARY_MARKET_PROXY", address(d.primaryMarketProxy));

        console.log("GOV_FREEZE_V2_SEAT_REGISTRY_PROXY", address(d.seatRegistryProxy));

        console.log("GOV_FREEZE_V2_STAKE_POOL_PROXY", stakePoolProxyAddr);
        console.log("GOV_FREEZE_V2_GOVERNANCE_TOKEN", ttg);
    }

    function _assertStakePoolBootstrapped(address pool) internal view {

        RegionStewardStakePool p = RegionStewardStakePool(pool);

        require(p.jurisdictionsBootstrapped(), "V2: stake pool jurisdictions not bootstrapped");

        require(p.stewardStakeBps(bytes2("CN")) == 400, "V2: CN bps");

        require(p.stewardStakeBps(bytes2("KR")) == 200, "V2: KR bps");

        require(p.minStakeAmount(bytes2("CN")) > 0, "V2: CN minStake");

        require(p.minStakeAmount(bytes2("KR")) > 0, "V2: KR minStake");

    }

}


