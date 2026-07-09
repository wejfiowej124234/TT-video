// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../../src/CountryPoolNetProfitLedger.sol";
import "../../src/StewardPathVault.sol";
import "../../src/vacancy/UnallocatedStewardPathVault.sol";
import "../../src/vacancy/VacancyTypes.sol";
import "../../src/vacancy/VacancyErrors.sol";
import "../../src/vacancy/VacancyLedgerLib.sol";
import "../../src/RegionStewardStakePool.sol";
import "../../src/GovernanceVotesToken.sol";
import "../../src/MockERC20.sol";
import "./VacancyTestParams.sol";

/// Sprint 3b · StewardActivationEpoch Gate (G-01～G-03 · no API/Indexer/Dashboard).
contract CountryPoolNetProfitVacancyS3bTest is Test {
    bytes32 internal constant ACCT_R100 = bytes32("R-100");
    bytes2 internal constant J = bytes2("DE");

    address internal owner = makeAddr("owner");
    address internal treasury = makeAddr("treasury");
    address internal funding = makeAddr("funding");
    address internal steward = makeAddr("steward");

    MockERC20 internal usdc;
    RegionStewardStakePool internal stakePool;
    StewardPathVault internal stewardVault;
    UnallocatedStewardPathVault internal unallocVault;
    CountryPoolNetProfitLedger internal ledger;

    uint64 internal constant CLOSE_DELAY = 15 days;
    uint32 internal constant TEST_GRACE_DAYS = 7;

    function setUp() public {
        usdc = new MockERC20();
        GovernanceVotesToken ttg = new GovernanceVotesToken(1_000_000_000e18, address(0));
        stakePool = new RegionStewardStakePool(owner, address(ttg), 1_000_000_000e18, 7 days, 14 days);
        vm.prank(owner);
        stakePool.configureJurisdiction(J, 400);

        ttg.transfer(steward, stakePool.minStakeAmount(J));
        vm.startPrank(steward);
        ttg.approve(address(stakePool), type(uint256).max);
        stakePool.stake(J, stakePool.minStakeAmount(J), bytes32("app1"));
        vm.stopPrank();

        uint256 n = vm.getNonce(address(this));
        address predictedLedger = vm.computeCreateAddress(address(this), n + 2);

        stewardVault = new StewardPathVault(owner, J, address(usdc), predictedLedger);
        unallocVault = new UnallocatedStewardPathVault(
            owner, J, address(usdc), predictedLedger, address(stewardVault), treasury, _shortGraceParams()
        );
        ledger = new CountryPoolNetProfitLedger(
            owner,
            J,
            address(usdc),
            address(stewardVault),
            address(unallocVault),
            treasury,
            address(stakePool),
            CLOSE_DELAY,
            4500,
            5500
        );
        assertEq(address(ledger), predictedLedger);

        vm.startPrank(owner);
        ledger.setFundingSource(funding);
        ledger.setSettlementParams(1, 4500, 5500, treasury, funding);
        vm.stopPrank();
    }

    /// G-01 · setActiveStewardConfig writes stewardActivationEpochId = latestEpochId.
    function test_G01_activationEpochWritten() public {
        _splitIneligible(1, 500_000e6);

        assertEq(ledger.stewardActivationEpochId(), 0);

        vm.prank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("g01"));

        assertEq(ledger.stewardActivationEpochId(), 1);
        assertEq(uint8(ledger.vacancyState()), uint8(CountryPoolNetProfitLedger.VacancyState.STEWARD_ACTIVE));
    }

    /// G-02 · releaseEpochId <= activationEpochId reverts ActivationEpochLocked.
    function test_G02_releaseBlockedForHistoricalEpoch() public {
        _splitIneligible(1, 1_000_000e6);
        (, uint256 unallocatedAmount,) = ledger.epochSplitAmounts(1);

        vm.prank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("g02act"));

        vm.startPrank(owner);
        vm.expectRevert(VacancyErrors.ActivationEpochLocked.selector);
        unallocVault.releaseToStewardPath(unallocatedAmount, 1, bytes32("hist"));

        unallocVault.releaseToStewardPath(unallocatedAmount, 2, bytes32("postAct"));
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(stewardVault)), unallocatedAmount);
    }

    /// G-03 · epochId > activationEpochId routes 45% to StewardPath when eligible.
    function test_G03_postActivationSplitToStewardPath() public {
        vm.prank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("preAct"));
        assertEq(ledger.stewardActivationEpochId(), 0);

        _splitEligible(1, 800_000e6);

        (uint256 stewardAmount, uint256 unallocatedAmount,) = ledger.epochSplitAmounts(1);
        assertGt(stewardAmount, 0);
        assertEq(unallocatedAmount, 0);
        assertEq(usdc.balanceOf(address(stewardVault)), stewardAmount);
    }

    /// G-03 · same-epoch activation blocks StewardPath for that epoch (anti-gaming).
    function test_G03_preActivationSplitStaysUnallocated() public {
        _splitIneligible(1, 600_000e6);

        vm.prank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("lateAct"));
        assertEq(ledger.stewardActivationEpochId(), 1);

        (uint256 stewardAmount, uint256 unallocatedAmount,) = ledger.epochSplitAmounts(1);
        assertEq(stewardAmount, 0);
        assertGt(unallocatedAmount, 0);
        assertEq(usdc.balanceOf(address(unallocVault)), unallocatedAmount);
    }

    /// Activation does not reset or transfer historical VacancyLedger balances.
    function test_activationPreservesVacancyLedgerBalances() public {
        _splitIneligible(1, 2_000_000e6);
        vm.warp(block.timestamp + TEST_GRACE_DAYS * 1 days);
        _splitIneligible(2, 2_000_000e6);

        VacancyTypes.VacancyLedger memory before = unallocVault.vacancyLedger();
        assertGt(before.swept, 0);
        VacancyLedgerLib.assertLedgerIdentity(before);

        vm.prank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("preserve"));

        VacancyTypes.VacancyLedger memory afterAct = unallocVault.vacancyLedger();
        assertEq(afterAct.principal, before.principal);
        assertEq(afterAct.reserve, before.reserve);
        assertEq(afterAct.swept, before.swept);
        assertEq(afterAct.disbursed, before.disbursed);
        VacancyLedgerLib.assertLedgerIdentity(afterAct);
    }

    function _shortGraceParams() internal pure returns (VacancyTypes.VacancyParams memory) {
        VacancyTypes.VacancyParams memory p = VacancyTestParams.ssotV1Defaults();
        p.vacancyGraceDays = TEST_GRACE_DAYS;
        return p;
    }

    function _splitIneligible(uint256 epochId, uint256 profit) internal {
        vm.startPrank(owner);
        ledger.openEpoch(
            epochId, uint64(block.timestamp), uint64(block.timestamp + 1 days)
        );
        ledger.recordAccrual(epochId, ACCT_R100, int256(profit), bytes32(uint256(epochId)));
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days + 2);

        vm.prank(owner);
        ledger.closeEpoch(epochId);

        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();

        vm.startPrank(owner);
        ledger.fundLedgerForSplit(epochId);
        ledger.splitNetProfit(epochId);
        vm.stopPrank();
    }

    function _splitEligible(uint256 epochId, uint256 profit) internal {
        vm.prank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("pre"));
        _splitIneligible(epochId, profit);
    }
}
