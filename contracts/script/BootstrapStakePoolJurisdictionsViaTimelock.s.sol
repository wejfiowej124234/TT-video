// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;



import "./Phase2ControlPlane.sol";

import "./Phase2SafeExec.sol";

import "../src/GovernanceTimelock.sol";

import "../src/RegionStewardStakePool.sol";



/**

 * @title BootstrapStakePoolJurisdictionsViaTimelock

 * @notice Sepolia · Stake Pool Proxy 10 国 bootstrap（Timelock admin = Safe → schedule → 48h → execute）

 *

 * **路径 A：** 单条 `bootstrapProtocolSsotJurisdictionsOnce()`（新 impl）

 * **路径 B（现存 Sepolia Proxy）：** 10 条 `configureJurisdiction(bytes2,uint256)`

 *

 * Env:

 *   TIMELOCK_ADMIN_ADDRESS — Gnosis Safe（Timelock.admin）

 *   TIMELOCK_SAFE_OWNER_KEYS — Safe owner 私钥（Phase2SafeExec）

 *   TIMELOCK_ADDRESS · REGION_STEWARD_STAKE_POOL_ADDRESS（或 PROXY）

 *   CHAIN_RPC_URL

 *   STAKE_POOL_BOOTSTRAP_USE_ONCE — 默认 false（现存 Proxy 无 bootstrapOnce）

 */

contract BootstrapStakePoolJurisdictionsViaTimelock is Phase2ControlPlane, Phase2SafeExec {

    struct JurisdictionConfig {

        bytes2 id;

        uint256 bps;

    }



    function _configs() internal pure returns (JurisdictionConfig[10] memory c) {

        c[0] = JurisdictionConfig(bytes2("CN"), 400);

        c[1] = JurisdictionConfig(bytes2("US"), 400);

        c[2] = JurisdictionConfig(bytes2("FR"), 450);

        c[3] = JurisdictionConfig(bytes2("ES"), 450);

        c[4] = JurisdictionConfig(bytes2("JP"), 250);

        c[5] = JurisdictionConfig(bytes2("TH"), 250);

        c[6] = JurisdictionConfig(bytes2("SG"), 200);

        c[7] = JurisdictionConfig(bytes2("KR"), 200);

        c[8] = JurisdictionConfig(bytes2("AU"), 150);

        c[9] = JurisdictionConfig(bytes2("AE"), 150);

    }



    function run() external {

        address timelock = vm.envAddress("TIMELOCK_ADDRESS");

        address safeAdmin = vm.envAddress("TIMELOCK_ADMIN_ADDRESS");

        address pool = vm.envAddress("REGION_STEWARD_STAKE_POOL_ADDRESS");

        if (pool == address(0)) {

            pool = vm.envAddress("REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS");

        }

        require(pool != address(0), "pool address required");

        require(safeAdmin != address(0), "TIMELOCK_ADMIN_ADDRESS required");



        bool useBootstrapOnce = vm.envOr("STAKE_POOL_BOOTSTRAP_USE_ONCE", false);

        bool scheduleAllow = vm.envOr("STAKE_POOL_SCHEDULE_ALLOW_TARGET", true);



        uint256 ownerPk = resolveSafeOwnerPrivateKey();

        vm.startBroadcast(ownerPk);



        if (scheduleAllow && !GovernanceTimelock(payable(timelock)).allowedExecutionTarget(pool)) {

            safeExecCall(

                safeAdmin,

                timelock,

                abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (pool, true)),

                ownerPk

            );

            console.log("setAllowedExecutionTarget(pool,true) via Safe");

        }



        if (useBootstrapOnce) {

            bytes32 salt = keccak256("TTG-STAKE-POOL-BOOTSTRAP-ONCE");

            safeExecCall(

                safeAdmin,

                timelock,

                abi.encodeCall(

                    GovernanceTimelock.schedule,

                    (

                        pool,

                        0,

                        abi.encodeWithSelector(RegionStewardStakePool.bootstrapProtocolSsotJurisdictionsOnce.selector),

                        salt

                    )

                ),

                ownerPk

            );

            console.log("scheduled bootstrapProtocolSsotJurisdictionsOnce on pool");

        } else {

            JurisdictionConfig[10] memory configs = _configs();

            for (uint256 i = 0; i < configs.length; i++) {

                bytes32 salt = keccak256(abi.encode("TTG-STAKE-POOL-JURIS", configs[i].id, configs[i].bps));

                safeExecCall(

                    safeAdmin,

                    timelock,

                    abi.encodeCall(

                        GovernanceTimelock.schedule,

                        (

                            pool,

                            0,

                            abi.encodeWithSelector(

                                RegionStewardStakePool.configureJurisdiction.selector,

                                configs[i].id,

                                configs[i].bps

                            ),

                            salt

                        )

                    ),

                    ownerPk

                );

                console.log("scheduled configureJurisdiction", uint16(configs[i].id), configs[i].bps);

            }

        }



        vm.stopBroadcast();

    }

}


