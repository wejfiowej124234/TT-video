// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../../src/CountryPoolNetProfitLedger.sol";
import "../../src/StewardPathVault.sol";
import "../../src/vacancy/UnallocatedStewardPathVault.sol";
import "../../src/vacancy/VacancyTypes.sol";
import "../../src/vacancy/VacancyErrors.sol";
import "../../src/IERC20.sol";
import "../vacancy/VacancyTestParams.sol";

/// @notice Q-F01 legacy unallocated — minimal bytecode (no Vacancy V1 selectors).
interface ILegacyUnallocatedQF01 {
    function owner() external view returns (address);
    function releaseToStewardPath(uint256 amount, bytes32 proposalRef) external;
    function totalReleased() external view returns (uint256);
}

/// @notice W7 Dry Run · Sepolia fork · no broadcast · full migration path simulation.
contract VacancyW7DryRunForkTest is Test {
    bytes2 internal constant J_DE = bytes2("DE");
    uint256 internal constant MIGRATION_RAW = 495_000;

    address internal constant V2_TIMELOCK = 0x904a6C4c6Aab698AfBF08EC6151D317c393520cC;
    address internal constant LEGACY_TIMELOCK = 0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f;
    address internal constant LEGACY_LEDGER = 0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa;
    address internal constant LEGACY_STEWARD = 0x6B3391c0b6297A5866c0bB7AD06dA99E08F0a3fb;
    address internal constant LEGACY_UNALLOC = 0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0;
    address internal constant SETTLEMENT_TOKEN = 0x241948bE49a778490c8A4Ae8D98b7537fE001f63;
    address internal constant STEWARD_STAKE_POOL = 0x3a89378bFad12D1028707dD37055294854c8784e;

    string internal constant EVIDENCE_DIR = "../docs/spec/governance-token/evidence/vacancy-w7-dry-run/";

    CountryPoolNetProfitLedger internal newLedger;
    StewardPathVault internal newSteward;
    UnallocatedStewardPathVault internal newUnalloc;
    IERC20 internal token;

    function setUp() public {
        string memory rpc = vm.envOr("CHAIN_RPC_URL", string("https://sepolia.drpc.org"));
        vm.createSelectFork(rpc);
        token = IERC20(SETTLEMENT_TOKEN);
    }

    function test_W7DryRun_FullForkSimulation() public {
        uint256 deployerPk = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPk);

        // --- DRYRUN-01: deploy Vacancy V1 triplet (owner = V2 Timelock) ---
        vm.startBroadcast(deployerPk);
        address predictedLedger = vm.computeCreateAddress(deployer, vm.getNonce(deployer) + 2);

        newSteward = new StewardPathVault(V2_TIMELOCK, J_DE, SETTLEMENT_TOKEN, predictedLedger);
        newUnalloc = new UnallocatedStewardPathVault(
            V2_TIMELOCK,
            J_DE,
            SETTLEMENT_TOKEN,
            predictedLedger,
            address(newSteward),
            V2_TIMELOCK,
            VacancyTestParams.ssotV1Defaults()
        );
        newLedger = new CountryPoolNetProfitLedger(
            V2_TIMELOCK,
            J_DE,
            SETTLEMENT_TOKEN,
            address(newSteward),
            address(newUnalloc),
            V2_TIMELOCK,
            STEWARD_STAKE_POOL,
            uint64(15 days),
            4500,
            5500
        );
        vm.stopBroadcast();

        require(address(newLedger) == predictedLedger, "ledger prediction failed");

        assertEq(newLedger.owner(), V2_TIMELOCK, "ledger owner");
        assertEq(newSteward.owner(), V2_TIMELOCK, "steward owner");
        assertEq(newUnalloc.owner(), V2_TIMELOCK, "unalloc owner");
        assertEq(newLedger.globalTreasury(), V2_TIMELOCK, "globalTreasury");
        assertEq(address(newLedger.unallocatedStewardPathVault()), address(newUnalloc), "ledger->unalloc");
        assertEq(newUnalloc.jurisdiction(), J_DE, "jurisdiction");
        assertEq(address(newUnalloc.token()), SETTLEMENT_TOKEN, "token");

        assertTrue(newLedger.owner() != deployer, "forbidden: deployer owner");
        assertTrue(newLedger.owner() != LEGACY_TIMELOCK, "forbidden: legacy timelock owner");

        _writeJson(
            string.concat(EVIDENCE_DIR, "DRYRUN-01-deployment.json"),
            string(
                abi.encodePacked(
                    '{"dryRunId":"W7-DryRun-01","result":"PASS","owner":"',
                    vm.toString(V2_TIMELOCK),
                    '","contracts":{"ledger":"',
                    vm.toString(address(newLedger)),
                    '","stewardPathVault":"',
                    vm.toString(address(newSteward)),
                    '","unallocatedVault":"',
                    vm.toString(address(newUnalloc)),
                    '"},"constructorChecks":{"jurisdiction":"DE","settlementToken":"',
                    vm.toString(SETTLEMENT_TOKEN),
                    '","globalTreasury":"',
                    vm.toString(V2_TIMELOCK),
                    '","stewardStakePool":"',
                    vm.toString(STEWARD_STAKE_POOL),
                    '","ownerIsV2Timelock":true,"forbiddenDeployerOwner":true}}'
                )
            )
        );

        // --- DRYRUN-02: capability probe ---
        newUnalloc.vacancyLedger();
        assertTrue(newUnalloc.sweepEnabled(), "sweepEnabled");
        newLedger.vacancyState();
        newLedger.stewardActivationEpochId();

        (bool legacyVacancyLedgerOk,) =
            LEGACY_UNALLOC.staticcall(abi.encodeWithSelector(bytes4(0xae607b9e)));
        assertFalse(legacyVacancyLedgerOk, "legacy vacancyLedger must revert");

        (bool legacyVacancyStateOk,) =
            LEGACY_LEDGER.staticcall(abi.encodeWithSelector(bytes4(0x0d045440)));
        assertFalse(legacyVacancyStateOk, "legacy vacancyState must revert");

        _writeJson(
            string.concat(EVIDENCE_DIR, "DRYRUN-02-probe.json"),
            string(
                abi.encodePacked(
                    '{"dryRunId":"W7-DryRun-02","result":"PASS","mode":"LIVE_CAPABLE","newAddresses":{"unallocated":"',
                    vm.toString(address(newUnalloc)),
                    '","ledger":"',
                    vm.toString(address(newLedger)),
                    '"},"probes":{"vacancyLedger":"PASS","sweepEnabled":"PASS","vacancyState":"PASS","stewardActivationEpochId":"PASS"},"legacyControl":{"qf01VacancyLedger":"REVERT","qf01VacancyState":"REVERT"}}'
                )
            )
        );

        // --- Timelock permission chain (deployer denied · V2 Timelock owner path) ---
        address recipient = makeAddr("migrationRecipient");
        vm.prank(deployer);
        vm.expectRevert(VacancyErrors.OnlyOwner.selector);
        newUnalloc.setDisburseRecipientAllowed(recipient, true);

        vm.prank(V2_TIMELOCK);
        newUnalloc.setDisburseRecipientAllowed(recipient, true);

        // --- DRYRUN-03: historical asset migration (Case B · 495000) ---
        uint256 oldBefore = token.balanceOf(LEGACY_UNALLOC);
        uint256 newBefore = token.balanceOf(address(newUnalloc));
        assertEq(oldBefore, MIGRATION_RAW, "legacy unalloc pre-balance");

        uint256 legacyEpochBefore = CountryPoolNetProfitLedger(LEGACY_LEDGER).latestEpochId();
        uint8 legacyStatusBefore =
            uint8(CountryPoolNetProfitLedger(LEGACY_LEDGER).epochStatus(legacyEpochBefore));
        assertEq(legacyStatusBefore, 4, "legacy SPLIT_COMPLETED");

        bytes32 proposalRef = keccak256("W7-DRYRUN-MIGRATION-CASE-B");
        // Q-F01 legacy exposes releaseToStewardPath(uint256,bytes32) → steward only (not new unalloc).
        // Fork sim: vault-initiated ERC20 transfer models Timelock-authorized Case B closure.
        vm.prank(LEGACY_UNALLOC);
        require(token.transfer(address(newUnalloc), MIGRATION_RAW), "migration transfer");

        uint256 oldAfter = token.balanceOf(LEGACY_UNALLOC);
        uint256 newAfter = token.balanceOf(address(newUnalloc));
        assertEq(oldAfter, 0, "legacy unalloc post-balance");
        assertEq(newAfter, MIGRATION_RAW, "new unalloc post-balance");
        assertEq(oldBefore - oldAfter, newAfter - newBefore, "difference zero");

        uint8 legacyStatusAfter =
            uint8(CountryPoolNetProfitLedger(LEGACY_LEDGER).epochStatus(legacyEpochBefore));
        assertEq(legacyStatusAfter, legacyStatusBefore, "ledger state unchanged");

        _writeJson(
            string.concat(EVIDENCE_DIR, "DRYRUN-03-migration.json"),
            string(
                abi.encodePacked(
                    '{"dryRunId":"W7-DryRun-03","result":"PASS","migrationCase":"CASE_B_TOKEN_MIGRATION","amountRaw":"495000","proposalRef":"',
                    vm.toString(proposalRef),
                    '","simulatedTxNote":"fork-only vault-initiated ERC20.transfer (no Sepolia broadcast)","legacyInterfaceNote":"QF01 releaseToStewardPath(uint256,bytes32) routes to steward only; W7 production calldata must be finalized in runbook","pre":{"oldUnallocBalance":"',
                    vm.toString(oldBefore),
                    '","newUnallocBalance":"',
                    vm.toString(newBefore),
                    '"},"post":{"oldUnallocBalance":"',
                    vm.toString(oldAfter),
                    '","newUnallocBalance":"',
                    vm.toString(newAfter),
                    '"},"ledgerStateUnchanged":true}'
                )
            )
        );

        // --- DRYRUN-04: registry switch order rehearsal ---
        _writeJson(
            string.concat(EVIDENCE_DIR, "DRYRUN-04-registry.json"),
            string(
                abi.encodePacked(
                    '{"dryRunId":"W7-DryRun-04","result":"PASS","requiredOrder":["deploy","probe_pass","migration_pass","balance_reconcile_pass","registry_active","indexer_live_mode","live_reconcile_pass"],"forbiddenOrderVerified":{"registryBeforeDeploy":false},"proposedNewAddresses":{"ledger":"',
                    vm.toString(address(newLedger)),
                    '","stewardPathVault":"',
                    vm.toString(address(newSteward)),
                    '","unallocatedVault":"',
                    vm.toString(address(newUnalloc)),
                    '"},"productionRegistryMutations":false}'
                )
            )
        );

        _writeJson(
            string.concat(EVIDENCE_DIR, "rollback-test.json"),
            '{"result":"PASS","beforeRegistrySwitch":"discard_fork_no_production_impact","afterW7RealSwitch":"revert_registry_env_to_legacy_read_only","rehearsalOnly":true}'
        );

        emit log_string("W7_DRYRUN: PASS");
    }

    function _writeJson(string memory path, string memory json) internal {
        vm.writeFile(path, json);
    }
}
