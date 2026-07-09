// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Phase2ControlPlane.sol";
import "./Phase2SafeExec.sol";
import "../src/GovernanceTimelock.sol";
import "../src/CountryPoolNetProfitLedger.sol";

/**
 * @title CpNetProfitSepoliaCutoverAndDrill
 * @notice ② Sepolia · DE pilot · legacy Timelock-owned ledger
 *   Phase C: setSettlementParams → globalTreasury = GovFreeze V2 Timelock
 *   Phase B: open → accrue → close → fund → split (45/55 evidence)
 *
 * Env:
 *   CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK — ledger.owner() (legacy 0x0359…)
 *   GOV_FREEZE_V2_TIMELOCK_ADDRESS — target globalTreasury
 *   COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS
 *   COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS
 *   TIMELOCK_ADMIN_ADDRESS · TIMELOCK_SAFE_OWNER_KEYS
 *   CP_DRILL_FUNDING_SOURCE — EOA with USDC mint (default broadcast sender)
 *   CP_DRILL_NET_PROFIT_RAW — default 1_000_000 (1 USDC · 6 dec)
 *   CP_RUN_CUTOVER=1 · CP_RUN_DRILL=1
 */
contract CpNetProfitSepoliaCutoverAndDrill is Phase2ControlPlane, Phase2SafeExec {
    bytes32 internal constant ACCT_R100 = bytes32("R-100");
    bytes32 internal constant ACCT_E100 = bytes32("E-100");

    function _scheduleViaSafe(
        address safe,
        address ledgerOwnerTimelock,
        address target,
        bytes memory data,
        bytes32 salt,
        uint256 ownerPk
    ) internal returns (bytes32 id) {
        id = GovernanceTimelock(payable(ledgerOwnerTimelock)).hashOperation(target, 0, data, salt);
        safeExecCall(
            safe,
            ledgerOwnerTimelock,
            abi.encodeCall(GovernanceTimelock.schedule, (target, 0, data, salt)),
            ownerPk
        );
    }

    function _ensureLedgerAllowed(
        address safe,
        address ledgerOwnerTimelock,
        address ledger,
        uint256 ownerPk
    ) internal {
        safeExecCall(
            safe,
            ledgerOwnerTimelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (ledger, true)),
            ownerPk
        );
        console.log("setAllowedExecutionTarget ledger=true via Safe");
    }

    function run() external {
        address ledgerOwnerTimelock = vm.envAddress("CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK");
        address v2Treasury = vm.envAddress("GOV_FREEZE_V2_TIMELOCK_ADDRESS");
        address ledger = vm.envAddress("COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS");
        address token = vm.envAddress("COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS");
        address safe = vm.envAddress("TIMELOCK_ADMIN_ADDRESS");

        require(CountryPoolNetProfitLedger(ledger).owner() == ledgerOwnerTimelock, "owner!=ledgerOwnerTimelock");

        uint256 ownerPk = resolveSafeOwnerPrivateKey();
        bool runCutover = vm.envOr("CP_RUN_CUTOVER", true);
        bool runDrill = vm.envOr("CP_RUN_DRILL", true);

        vm.startBroadcast(ownerPk);

        _ensureLedgerAllowed(safe, ledgerOwnerTimelock, ledger, ownerPk);

        if (runCutover) {
            uint64 closeDelay = CountryPoolNetProfitLedger(ledger).closeDelaySeconds();
            uint16 bpsSteward = CountryPoolNetProfitLedger(ledger).bpsStewardPath();
            uint16 bpsGlobal = CountryPoolNetProfitLedger(ledger).bpsGlobalTreasury();
            address funding = vm.envOr("CP_DRILL_FUNDING_SOURCE", vm.addr(ownerPk));

            bytes memory cutoverData = abi.encodeCall(
                CountryPoolNetProfitLedger.setSettlementParams,
                (closeDelay, bpsSteward, bpsGlobal, v2Treasury, funding)
            );
            bytes32 cutoverSalt = keccak256("CP-NETPROFIT-V2-TREASURY-CUTOVER");
            bytes32 cutoverId = _scheduleViaSafe(safe, ledgerOwnerTimelock, ledger, cutoverData, cutoverSalt, ownerPk);
            console.log("CP_CUTOVER_SCHEDULED id");
            console.logBytes32(cutoverId);
            console.log("CP_CUTOVER_TARGET_TREASURY", v2Treasury);
        }

        if (runDrill) {
            address funding = vm.envOr("CP_DRILL_FUNDING_SOURCE", vm.addr(ownerPk));
            uint256 profitRaw = vm.envOr("CP_DRILL_NET_PROFIT_RAW", uint256(1_000_000));

            uint64 nowTs = uint64(block.timestamp);
            uint64 closeDelay = CountryPoolNetProfitLedger(ledger).closeDelaySeconds();
            uint64 epochEnd = nowTs > closeDelay + 3600 ? nowTs - closeDelay - 3600 : nowTs - 1;
            uint64 epochStart = epochEnd > 86400 ? epochEnd - 86400 : 0;

            bytes32 refRev = keccak256("CP-DRILL-REV-1");
            bytes32 refExp = keccak256("CP-DRILL-EXP-1");
            bytes32 propRef = keccak256("CP-DRILL-STEWARD-INELIGIBLE");

            // Ineligible steward → 45% unallocated vault (still validates 45/55 legs)
            _scheduleViaSafe(
                safe,
                ledgerOwnerTimelock,
                ledger,
                abi.encodeCall(
                    CountryPoolNetProfitLedger.setActiveStewardConfig,
                    (address(0), false, false, false, propRef)
                ),
                keccak256("CP-DRILL-STEWARD"),
                ownerPk
            );

            _scheduleViaSafe(
                safe,
                ledgerOwnerTimelock,
                ledger,
                abi.encodeCall(CountryPoolNetProfitLedger.openEpoch, (uint256(1), epochStart, epochEnd)),
                keccak256("CP-DRILL-OPEN-1"),
                ownerPk
            );

            _scheduleViaSafe(
                safe,
                ledgerOwnerTimelock,
                ledger,
                abi.encodeCall(
                    CountryPoolNetProfitLedger.recordAccrual,
                    (uint256(1), ACCT_R100, int256(profitRaw), refRev)
                ),
                keccak256("CP-DRILL-ACCRUE-REV"),
                ownerPk
            );

            _scheduleViaSafe(
                safe,
                ledgerOwnerTimelock,
                ledger,
                abi.encodeCall(
                    CountryPoolNetProfitLedger.recordAccrual,
                    (uint256(1), ACCT_E100, int256(profitRaw / 10), refExp)
                ),
                keccak256("CP-DRILL-ACCRUE-EXP"),
                ownerPk
            );

            _scheduleViaSafe(
                safe,
                ledgerOwnerTimelock,
                ledger,
                abi.encodeCall(CountryPoolNetProfitLedger.closeEpoch, (uint256(1))),
                keccak256("CP-DRILL-CLOSE-1"),
                ownerPk
            );

            _scheduleViaSafe(
                safe,
                ledgerOwnerTimelock,
                ledger,
                abi.encodeCall(CountryPoolNetProfitLedger.fundLedgerForSplit, (uint256(1))),
                keccak256("CP-DRILL-FUND-1"),
                ownerPk
            );

            _scheduleViaSafe(
                safe,
                ledgerOwnerTimelock,
                ledger,
                abi.encodeCall(CountryPoolNetProfitLedger.splitNetProfit, (uint256(1))),
                keccak256("CP-DRILL-SPLIT-1"),
                ownerPk
            );

            console.log("CP_DRILL_SCHEDULED epoch=1 profit_raw=", profitRaw);
            console.log("CP_DRILL_FUNDING_SOURCE", funding);
        }

        vm.stopBroadcast();
    }
}
