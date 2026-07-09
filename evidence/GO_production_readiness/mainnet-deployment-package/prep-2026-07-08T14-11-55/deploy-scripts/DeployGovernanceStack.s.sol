// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;



import "./Phase2ControlPlane.sol";

import "./Phase2SafeExec.sol";

import "../src/GovernanceVotesToken.sol";

import "../src/GovernanceTimelock.sol";

import "../src/TravelTrustGovernor.sol";
import "../src/TtgGovFreezeConstants.sol";



/**

 * @title DeployGovernanceStack

 * @notice Sepolia / 测试网：**Votes Token + Timelock + Governor**，并完成 Timelock admin 绑定。

 * @dev **Safe admin 路径（R-02 · Sepolia）**：Phase A = deployer 部署合约；Phase B = Safe owner 经

 *      `execTransaction` 调用 `setGovernor` / `setAllowedExecutionTarget`（**非** deployer 直调）。

 *      **Anvil**：`admin == deployer` 时单广播内联 admin 调用。

 *

 * 环境变量（必填）：

 *   **PRIVATE_KEY** — 部署者 EOA（付 gas · **非** Timelock.admin）

 *   **TIMELOCK_ADMIN_ADDRESS** — 多签 / Safe（**≠** deployer EOA）

 *   **TIMELOCK_SAFE_OWNER_KEYS** — Safe owner 私钥（Safe 路径 · Phase B）

 *

 * 可选：见 Phase A 各 `GOVERNANCE_*` / `GOVERNOR_*` 默认值。

 *

 * Phase B 单独重跑：`ConfigureGovernanceTimelockViaSafe.s.sol`（须已填 TIMELOCK/GOVERNOR/TOKEN 地址）

 */

contract DeployGovernanceStack is Phase2ControlPlane, Phase2SafeExec {

    function run() external {

        uint256 pk = vm.envUint("PRIVATE_KEY");

        require(pk != 0, "DeployGovernanceStack: PRIVATE_KEY required (uint256 hex or decimal)");



        address deployer = vm.addr(pk);

        address timelockAdmin = resolveTimelockAdmin(deployer);

        bool safeAdminPath = timelockAdmin != deployer && timelockAdmin.code.length > 0;



        GovernanceVotesToken token;

        GovernanceTimelock timelock;

        TravelTrustGovernor gov;



        vm.startBroadcast(pk);



        uint256 initialSupply = vm.envOr("GOVERNANCE_VOTES_INITIAL_SUPPLY_WEI", uint256(10_000_000 ether));

        token = new GovernanceVotesToken(initialSupply, deployer);



        uint256 timelockDelay = vm.envOr(
            "GOVERNANCE_TIMELOCK_DELAY_SECONDS",
            TtgGovFreezeConstants.GOVERNANCE_TIMELOCK_DELAY_SECONDS
        );

        timelock = new GovernanceTimelock(timelockAdmin, timelockDelay);



        uint256 vDelay = vm.envOr("GOVERNOR_VOTING_DELAY_BLOCKS", uint256(1));

        uint256 vPeriod = vm.envOr("GOVERNOR_VOTING_PERIOD_BLOCKS", uint256(5));

        uint256 thresh = vm.envOr("GOVERNOR_PROPOSAL_THRESHOLD_WEI", uint256(1 ether));

        uint256 quorumBps = vm.envOr(
            "GOVERNOR_QUORUM_NUMERATOR_BPS",
            TtgGovFreezeConstants.GOVERNANCE_QUORUM_BPS
        );
        uint256 maxVoteBps = vm.envOr(
            "GOVERNOR_MAX_VOTING_POWER_PER_ADDRESS_BPS",
            TtgGovFreezeConstants.MAX_VOTING_POWER_PER_ADDRESS_BPS
        );

        uint256 reviewDays = vm.envOr("GOVERNOR_ORDER_RATING_REVIEW_WINDOW_DAYS", uint256(14));



        gov = new TravelTrustGovernor(

            IGovernanceVotes(address(token)),

            IGovernanceTimelockForGov(address(timelock)),

            vDelay,

            vPeriod,

            thresh,

            quorumBps,

            maxVoteBps,

            reviewDays

        );



        if (!safeAdminPath) {

            timelock.setGovernor(address(gov));

            timelock.setAllowedExecutionTarget(address(gov), true);

            timelock.setAllowedExecutionTarget(address(token), true);

        }



        vm.stopBroadcast();



        if (safeAdminPath) {

            uint256 ownerPk = resolveSafeOwnerPrivateKey();

            address owner = vm.addr(ownerPk);

            vm.startBroadcast(ownerPk);

            configureGovernanceTimelockViaSafe(

                timelockAdmin, address(timelock), address(gov), address(token), ownerPk

            );

            vm.stopBroadcast();

            console.log("Phase B safeOwner", owner);

        }



        console.log("--- DeployGovernanceStack (B-089 governance stack; TTG = GovernanceVotesToken) ---");

        console.log("deployer", deployer);

        console.log("TIMELOCK_ADMIN", timelockAdmin);

        console.log("safeAdminPath", safeAdminPath);

        console.log("GovernanceVotesToken_TTG", address(token));

        console.log("GovernanceTimelock", address(timelock));

        console.log("TravelTrustGovernor (GOVERNOR_ADDRESS)", address(gov));

        console.log("timelockDelay_seconds", timelockDelay);

    }

}


