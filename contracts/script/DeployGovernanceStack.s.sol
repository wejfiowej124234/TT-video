// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/GovernanceTimelock.sol";
import "../src/TravelTrustGovernor.sol";

/**
 * @title DeployGovernanceStack
 * @notice Sepolia / 测试网：**Votes Token + Timelock + Governor**，并完成 **`GovernanceTimelock.setGovernor(governor)`**。
 * @dev 不含 FeeRouter / Escrow。
 *      **治理票代币** 为 **`GovernanceVotesToken`**：链上 **`symbol()` = `TTG`**，**`name()` = `TravelTrust Governance`**（见 `contracts/src/GovernanceVotesToken.sol`）。
 *      部署后请将 **`GovernanceVotesToken`** 地址写入 **`.env` → `GOVERNANCE_TOKEN_ADDRESS`**（与 **`GOVERNOR_ADDRESS` / `TIMELOCK_ADDRESS`** 一并更新），
 *      再走链上 **propose → vote → Succeeded(4)**，得到 **`B417_PROPOSAL_ID`**，最后跑 B-417 脚本。
 *
 * 环境变量（必填）：
 *   **PRIVATE_KEY** — 部署者 EOA（须付 gas）
 *
 * 可选（有默认值，便于 B-417 短等待；生产式长延迟请显式设大）：
 *   **GOVERNANCE_TIMELOCK_DELAY_SECONDS** — Timelock `delay()` 秒数；默认 **120**（测试网快速 queue→execute）；主网式可设 **86400**
 *   **GOVERNANCE_VOTES_INITIAL_SUPPLY_WEI** — 治理票总供给（wei）；默认 **10_000_000 ether**
 *   **GOVERNOR_VOTING_DELAY_BLOCKS** / **GOVERNOR_VOTING_PERIOD_BLOCKS** — 默认 **1** / **5**（与 `TravelTrustGovernor.t.sol` 对齐）
 *   **GOVERNOR_PROPOSAL_THRESHOLD_WEI** — 默认 **1 ether**
 *   **GOVERNOR_QUORUM_NUMERATOR_BPS** — 默认 **1000**（10%）
 *   **GOVERNOR_ORDER_RATING_REVIEW_WINDOW_DAYS** — 默认 **14**
 */
contract DeployGovernanceStack is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        require(pk != 0, "DeployGovernanceStack: PRIVATE_KEY required (uint256 hex or decimal)");

        vm.startBroadcast(pk);
        address deployer = vm.addr(pk);

        uint256 initialSupply = vm.envOr("GOVERNANCE_VOTES_INITIAL_SUPPLY_WEI", uint256(10_000_000 ether));
        GovernanceVotesToken token = new GovernanceVotesToken(initialSupply);

        uint256 timelockDelay = vm.envOr("GOVERNANCE_TIMELOCK_DELAY_SECONDS", uint256(120));
        GovernanceTimelock timelock = new GovernanceTimelock(deployer, timelockDelay);

        uint256 vDelay = vm.envOr("GOVERNOR_VOTING_DELAY_BLOCKS", uint256(1));
        uint256 vPeriod = vm.envOr("GOVERNOR_VOTING_PERIOD_BLOCKS", uint256(5));
        uint256 thresh = vm.envOr("GOVERNOR_PROPOSAL_THRESHOLD_WEI", uint256(1 ether));
        uint256 quorumBps = vm.envOr("GOVERNOR_QUORUM_NUMERATOR_BPS", uint256(1000));
        uint256 reviewDays = vm.envOr("GOVERNOR_ORDER_RATING_REVIEW_WINDOW_DAYS", uint256(14));

        TravelTrustGovernor gov = new TravelTrustGovernor(
            IGovernanceVotes(address(token)),
            IGovernanceTimelockForGov(address(timelock)),
            vDelay,
            vPeriod,
            thresh,
            quorumBps,
            reviewDays
        );
        timelock.setGovernor(address(gov));
        timelock.setAllowedExecutionTarget(address(gov), true);
        // SepoliaProposeMinimal / B-417 最小提案 target 为 TTG：`Governor.queue` → Timelock `scheduleByGovernor` 须 **allowedExecutionTarget[token]**。
        timelock.setAllowedExecutionTarget(address(token), true);

        console.log("--- DeployGovernanceStack (B-089 governance stack; TTG = GovernanceVotesToken) ---");
        console.log("deployer", deployer);
        console.log("GovernanceVotesToken_TTG", address(token));
        console.log("GovernanceTimelock", address(timelock));
        console.log("TravelTrustGovernor (GOVERNOR_ADDRESS)", address(gov));
        console.log("timelockDelay_seconds", timelockDelay);

        vm.stopBroadcast();
    }
}
