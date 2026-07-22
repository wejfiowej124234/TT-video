// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/GovernanceTimelock.sol";
import "../src/SettlementRouter.sol";
import "../src/ISettlementRouter.sol";

/**
 * @title ExecuteCandidateV2SettlementTimelock
 * @notice After Timelock ETA: execute markSettlementReady → markDistributable → distribute
 * @dev Sepolia-only · TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK=1
 * Env:
 *   TIMELOCK_ADDRESS · SETTLEMENT_ROUTER_ADDRESS
 *   CAND_MP_OP_READY · CAND_MP_OP_DISTABLE · CAND_MP_OP_DISTRIBUTE (bytes32)
 *   CAND_MP_ORDER_HAPPY (bytes32 / uint)
 */
contract ExecuteCandidateV2SettlementTimelock is Script {
    uint256 internal constant SEPOLIA = 11155111;

    function run() external {
        require(block.chainid != 1, "CandV2-Fin: mainnet FORBIDDEN");
        require(block.chainid == SEPOLIA, "CandV2-Fin: Sepolia only");
        require(
            vm.envOr("TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK", uint256(0)) == 1,
            "CandV2-Fin: OWNER_OK!=1"
        );

        address timelockAddr = vm.envAddress("TIMELOCK_ADDRESS");
        address settlementAddr = vm.envAddress("SETTLEMENT_ROUTER_ADDRESS");
        bytes32 idReady = vm.envBytes32("CAND_MP_OP_READY");
        bytes32 idDistable = vm.envBytes32("CAND_MP_OP_DISTABLE");
        bytes32 idDistribute = vm.envBytes32("CAND_MP_OP_DISTRIBUTE");
        bytes32 orderHappy = bytes32(vm.envUint("CAND_MP_ORDER_HAPPY"));

        GovernanceTimelock tl = GovernanceTimelock(payable(timelockAddr));
        SettlementRouter sr = SettlementRouter(settlementAddr);

        // Readiness checks (anyone may execute after ETA)
        (uint256 readyAt0, bool done0,,,) = _op(tl, idReady);
        (uint256 readyAt1, bool done1,,,) = _op(tl, idDistable);
        (uint256 readyAt2, bool done2,,,) = _op(tl, idDistribute);
        require(readyAt0 != 0 && readyAt1 != 0 && readyAt2 != 0, "CandV2-Fin: unknown op");
        require(!done0 && !done1 && !done2, "CandV2-Fin: already executed");
        require(block.timestamp >= readyAt0, "CandV2-Fin: too early (ETA not reached)");
        require(block.timestamp >= readyAt1 && block.timestamp >= readyAt2, "CandV2-Fin: ETA");

        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        tl.execute(idReady);
        tl.execute(idDistable);
        tl.execute(idDistribute);
        vm.stopBroadcast();

        require(
            uint256(sr.settlementState(orderHappy))
                == uint256(ISettlementRouter.OrderSettlementState.Distributed),
            "CandV2-Fin: not Distributed"
        );

        console.log("--- Candidate v2 Settlement Finalize COMPLETE ---");
        console.log("orderHappy", uint256(orderHappy));
        console.log("settlementState", uint256(sr.settlementState(orderHappy)));
        console.log("HARD_GATE", "CUTOVER_REFUSED");
        console.log("PSG_RECALCULATE", "BLOCKED_UNTIL_FG15_B_ELAPSED");
        console.log("CANDIDATE_V2_SETTLEMENT_FINALIZE", "OK");
    }

    function _op(GovernanceTimelock tl, bytes32 id)
        internal
        view
        returns (uint256 readyAt, bool done, address target, uint256 value, bytes memory data)
    {
        (readyAt, done, target, value, data) = tl.operations(id);
    }
}
