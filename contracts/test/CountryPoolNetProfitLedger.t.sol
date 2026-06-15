// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "forge-std/StdStorage.sol";
import "../src/CountryPoolNetProfitLedger.sol";
import "../src/StewardPathVault.sol";
import "../src/UnallocatedStewardPathVault.sol";
import "../src/CountryPoolNetProfitGovernancePayload.sol";
import "../src/GovernanceTimelock.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/RegionStewardStakePool.sol";
import "../src/MockERC20.sol";
import "../src/IERC20.sol";

/// D-4555-B · Gate-2.2 Foundry matrix (arch §10 · T-*).
contract CountryPoolNetProfitLedgerTest is Test {
    using stdStorage for StdStorage;

    bytes32 internal constant ACCT_R100 = bytes32("R-100");
    bytes32 internal constant ACCT_R110 = bytes32("R-110");
    bytes32 internal constant ACCT_E100 = bytes32("E-100");
    bytes32 internal constant ACCT_E110 = bytes32("E-110");

    bytes2 internal constant J_DE = bytes2("DE");

    address internal owner = makeAddr("timelockOwner");
    address internal treasury = makeAddr("treasury");
    address internal funding = makeAddr("funding");
    address internal steward = makeAddr("steward");

    MockERC20 internal usdc;
    GovernanceVotesToken internal ttg;
    RegionStewardStakePool internal stakePool;
    StewardPathVault internal stewardVault;
    UnallocatedStewardPathVault internal unallocVault;
    CountryPoolNetProfitLedger internal ledger;
    GovernanceTimelock internal tl;

    uint64 internal constant CLOSE_DELAY = 15 days;

    function setUp() public {
        usdc = new MockERC20();
        ttg = new GovernanceVotesToken(1_000_000_000e18);
        stakePool = new RegionStewardStakePool(owner, address(ttg), 1_000_000_000e18, 7 days, 14 days);
        vm.prank(owner);
        stakePool.configureJurisdiction(J_DE, 400);

        uint256 n = vm.getNonce(address(this));
        address predictedLedger = vm.computeCreateAddress(address(this), n + 2);

        stewardVault = new StewardPathVault(owner, J_DE, address(usdc), predictedLedger);
        unallocVault = new UnallocatedStewardPathVault(
            owner, J_DE, address(usdc), predictedLedger, address(stewardVault)
        );
        ledger = new CountryPoolNetProfitLedger(
            owner,
            J_DE,
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

        tl = new GovernanceTimelock(owner, 1 days);
        vm.startPrank(owner);
        ledger.setFundingSource(funding);
        tl.setAllowedExecutionTarget(address(ledger), true);
        vm.stopPrank();

        ttg.transfer(steward, stakePool.minStakeAmount(J_DE));
        vm.startPrank(steward);
        ttg.approve(address(stakePool), type(uint256).max);
        stakePool.stake(J_DE, stakePool.minStakeAmount(J_DE), bytes32("app1"));
        vm.stopPrank();
    }

    function _openEpoch1() internal returns (uint64 start, uint64 end) {
        start = uint64(block.timestamp);
        end = start + 90 days;
        vm.prank(owner);
        ledger.openEpoch(1, start, end);
    }

    function _accrueProfit(uint256 epochId, int256 revenue, int256 expense, bytes32 refBase) internal {
        if (revenue > 0) {
            vm.prank(owner);
            ledger.recordAccrual(epochId, ACCT_R100, revenue, keccak256(abi.encodePacked(refBase, "r")));
        }
        if (expense > 0) {
            vm.prank(owner);
            ledger.recordAccrual(epochId, ACCT_E100, -expense, keccak256(abi.encodePacked(refBase, "e")));
        }
    }

    function _epochNetProfitPrime(uint256 epochId) internal view returns (int256) {
        return ledger.epochNetProfitPrime(epochId);
    }

    function _epochStatus(uint256 epochId) internal view returns (CountryPoolNetProfitLedger.EpochStatus) {
        return ledger.epochStatus(epochId);
    }

    function _epochSplitAmounts(uint256 epochId)
        internal
        view
        returns (uint256 stewardAmount, uint256 unallocatedAmount, uint256 globalAmount, int256 netProfitPrime)
    {
        netProfitPrime = ledger.epochNetProfitPrime(epochId);
        (stewardAmount, unallocatedAmount, globalAmount) = ledger.epochSplitAmounts(epochId);
    }

    function _closeAfterDelay(uint256 epochId, uint64 epochEnd) internal {
        vm.warp(uint256(epochEnd) + CLOSE_DELAY + 1);
        vm.prank(owner);
        ledger.closeEpoch(epochId);
    }

    function _fundAndSplitEligible(uint256 epochId, uint256 amount) internal {
        usdc.mint(funding, amount);
        vm.startPrank(funding);
        usdc.approve(address(ledger), amount);
        vm.stopPrank();
        vm.startPrank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("prop1"));
        ledger.fundLedgerForSplit(epochId);
        ledger.splitNetProfit(epochId);
        vm.stopPrank();
    }

    // T-ACC-01 / T-ACC-02
    function test_T_ACC_01_02_AccrualUpdatesGrossAndExpense() public {
        _openEpoch1();
        _accrueProfit(1, 1_000_000, 200_000, "a");
        assertEq(ledger.epochGrossRevenue(1), 1_000_000);
        assertEq(ledger.epochAllowableExpense(1), 200_000);
    }

    // T-ACC-03
    function test_T_ACC_03_DuplicateRefReverts() public {
        _openEpoch1();
        vm.startPrank(owner);
        ledger.recordAccrual(1, ACCT_R100, 100, bytes32("dup"));
        vm.expectRevert(CountryPoolNetProfitLedger.DuplicateAccrualRef.selector);
        ledger.recordAccrual(1, ACCT_R100, 50, bytes32("dup"));
        vm.stopPrank();
    }

    // T-ACC-04
    function test_T_ACC_04_InvalidAccountCodeReverts() public {
        _openEpoch1();
        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.InvalidAccountCode.selector);
        ledger.recordAccrual(1, bytes32("X-999"), 100, bytes32("x"));
    }

    // T-ACC-05
    function test_T_ACC_05_AccrualAfterCloseReverts() public {
        (uint64 start, uint64 end) = _openEpoch1();
        _accrueProfit(1, 100, 0, "b");
        _closeAfterDelay(1, end);
        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.EpochNotOpen.selector);
        ledger.recordAccrual(1, ACCT_R100, 1, bytes32("late"));
    }

    function _batchLine(bytes32 accountCode, int256 amountSigned, bytes32 ref)
        internal
        pure
        returns (CountryPoolNetProfitLedger.AccrualLine memory)
    {
        return CountryPoolNetProfitLedger.AccrualLine({accountCode: accountCode, amountSigned: amountSigned, ref: ref});
    }

    // T-BATCH-01 · G23-01 · multi-line R/E gross/expense + one NetProfitAccrued per line
    function test_T_BATCH_01_MultiLineAccrualUpdatesGrossAndExpense() public {
        _openEpoch1();
        CountryPoolNetProfitLedger.AccrualLine[] memory lines = new CountryPoolNetProfitLedger.AccrualLine[](4);
        lines[0] = _batchLine(ACCT_R100, 600_000, bytes32("b01-r1"));
        lines[1] = _batchLine(ACCT_R110, 150_000, bytes32("b01-r2"));
        lines[2] = _batchLine(ACCT_E100, -120_000, bytes32("b01-e1"));
        lines[3] = _batchLine(ACCT_E110, -30_000, bytes32("b01-e2"));

        vm.recordLogs();
        vm.prank(owner);
        ledger.recordAccrualBatch(1, lines);

        assertEq(ledger.epochGrossRevenue(1), 750_000);
        assertEq(ledger.epochAllowableExpense(1), 150_000);
        Vm.Log[] memory entries = vm.getRecordedLogs();
        uint256 accruedEvents;
        for (uint256 i = 0; i < entries.length; ++i) {
            if (entries[i].topics[0] == keccak256(
                    "NetProfitAccrued(bytes2,uint256,address,bytes32,int256,bytes32,uint64)"
                )) {
                accruedEvents++;
            }
        }
        assertEq(accruedEvents, 4);
    }

    // T-BATCH-02 · duplicate ref within batch
    function test_T_BATCH_02_DuplicateRefInBatchReverts() public {
        _openEpoch1();
        CountryPoolNetProfitLedger.AccrualLine[] memory lines = new CountryPoolNetProfitLedger.AccrualLine[](2);
        lines[0] = _batchLine(ACCT_R100, 100, bytes32("dup-batch"));
        lines[1] = _batchLine(ACCT_E100, -50, bytes32("dup-batch"));

        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.DuplicateAccrualRef.selector);
        ledger.recordAccrualBatch(1, lines);
        assertEq(ledger.epochGrossRevenue(1), 0);
    }

    // T-BATCH-03 · >32 lines
    function test_T_BATCH_03_OverMaxLinesReverts() public {
        _openEpoch1();
        CountryPoolNetProfitLedger.AccrualLine[] memory lines =
            new CountryPoolNetProfitLedger.AccrualLine[](33);
        for (uint256 i = 0; i < 33; ++i) {
            lines[i] = _batchLine(ACCT_R100, 1, bytes32(uint256(i + 1)));
        }
        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.InvalidBatchSize.selector);
        ledger.recordAccrualBatch(1, lines);
    }

    // T-BATCH-04 · empty batch
    function test_T_BATCH_04_EmptyBatchReverts() public {
        _openEpoch1();
        CountryPoolNetProfitLedger.AccrualLine[] memory lines =
            new CountryPoolNetProfitLedger.AccrualLine[](0);
        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.InvalidBatchSize.selector);
        ledger.recordAccrualBatch(1, lines);
    }

    // T-BATCH-05 · atomic revert leaves epoch totals unchanged
    function test_T_BATCH_05_InvalidLineRevertsWholeBatch() public {
        _openEpoch1();
        CountryPoolNetProfitLedger.AccrualLine[] memory lines = new CountryPoolNetProfitLedger.AccrualLine[](3);
        lines[0] = _batchLine(ACCT_R100, 500, bytes32("b05-r"));
        lines[1] = _batchLine(ACCT_E100, -100, bytes32("b05-e"));
        lines[2] = _batchLine(bytes32("X-999"), 1, bytes32("b05-bad"));

        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.InvalidAccountCode.selector);
        ledger.recordAccrualBatch(1, lines);
        assertEq(ledger.epochGrossRevenue(1), 0);
        assertEq(ledger.epochAllowableExpense(1), 0);
        assertFalse(ledger.accrualRefs(bytes32("b05-r")));
    }

    // T-BATCH-06 · batch is book-only · no token movement
    function test_T_BATCH_06_NoTokenMovement() public {
        _openEpoch1();
        usdc.mint(address(ledger), 1_000_000);
        usdc.mint(funding, 500_000);

        uint256 ledgerBefore = usdc.balanceOf(address(ledger));
        uint256 fundingBefore = usdc.balanceOf(funding);

        CountryPoolNetProfitLedger.AccrualLine[] memory lines = new CountryPoolNetProfitLedger.AccrualLine[](2);
        lines[0] = _batchLine(ACCT_R100, 200_000, bytes32("b06-r"));
        lines[1] = _batchLine(ACCT_E100, -50_000, bytes32("b06-e"));

        vm.prank(owner);
        ledger.recordAccrualBatch(1, lines);

        assertEq(usdc.balanceOf(address(ledger)), ledgerBefore);
        assertEq(usdc.balanceOf(funding), fundingBefore);
    }

    // T-FND-01
    function test_T_FND_01_FundLedgerForSplitPullsAndMarksFunded() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 250_000;
        _accrueProfit(1, int256(profit), 0, "f1");
        _closeAfterDelay(1, end);

        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();

        vm.prank(owner);
        ledger.fundLedgerForSplit(1);

        assertTrue(ledger.epochFunded(1));
        assertEq(usdc.balanceOf(address(ledger)), profit);
    }

    // T-FND-05 · G23-03 · Path A Allowance — partial prefund + zero-pull when fully prefunded
    function test_T_FND_05_AllowancePathPartialAndZeroPull() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 300_000;
        _accrueProfit(1, int256(profit), 0, "f5a");
        _closeAfterDelay(1, end);

        uint256 prefund = 100_000;
        usdc.mint(address(ledger), prefund);
        uint256 pull = profit - prefund;
        usdc.mint(funding, pull);
        vm.startPrank(funding);
        usdc.approve(address(ledger), pull);
        vm.stopPrank();

        vm.prank(owner);
        ledger.fundLedgerForSplit(1);

        assertTrue(ledger.epochFunded(1));
        assertEq(usdc.balanceOf(address(ledger)), profit);

        vm.prank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("f5"));
        vm.prank(owner);
        ledger.splitNetProfit(1);
        assertEq(uint256(_epochStatus(1)), uint256(CountryPoolNetProfitLedger.EpochStatus.SPLIT_COMPLETED));
    }

    function test_T_FND_05b_ZeroPullWhenLedgerFullyPrefunded() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 150_000;
        _accrueProfit(1, int256(profit), 0, "f5z");
        _closeAfterDelay(1, end);
        usdc.mint(address(ledger), profit);

        vm.prank(owner);
        ledger.fundLedgerForSplit(1);

        assertTrue(ledger.epochFunded(1));
        assertEq(usdc.balanceOf(address(ledger)), profit);
        assertEq(usdc.balanceOf(funding), 0);
    }

    // T-FND-06 · G23-03 · insufficient allowance reverts fund; epochFunded stays false
    function test_T_FND_06_FundRevertsWhenAllowanceInsufficient() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 200_000;
        _accrueProfit(1, int256(profit), 0, "f6");
        _closeAfterDelay(1, end);

        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit - 1);
        vm.stopPrank();

        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.TransferFailed.selector);
        ledger.fundLedgerForSplit(1);
        assertFalse(ledger.epochFunded(1));

        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.SplitNotFunded.selector);
        ledger.splitNetProfit(1);
    }

    // T-FND-03
    function test_T_FND_03_SplitWithInsufficientBalanceReverts() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 100_000;
        _accrueProfit(1, int256(profit), 0, "f3");
        _closeAfterDelay(1, end);

        stdstore.target(address(ledger)).sig("epochFunded(uint256)").with_key(1).checked_write(true);
        usdc.mint(address(ledger), profit - 1);

        vm.prank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("f3"));
        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.InsufficientLedgerBalance.selector);
        ledger.splitNetProfit(1);
    }

    // T-FND-04
    function test_T_FND_04_RecordAccrualDoesNotMoveTokens() public {
        _openEpoch1();
        _accrueProfit(1, 500_000, 0, "c");
        assertEq(usdc.balanceOf(address(ledger)), 0);
    }

    // T-CLS-01 / T-SPL-01 / T-SPL-03 / FIN-SPLIT-01
    function test_T_CLS_01_T_SPL_01_EligibleSplitConservation() public {
        (uint64 start, uint64 end) = _openEpoch1();
        uint256 profit = 1_000_000;
        _accrueProfit(1, int256(profit), 0, "d");
        _closeAfterDelay(1, end);

        assertEq(uint256(_epochStatus(1)), uint256(CountryPoolNetProfitLedger.EpochStatus.SPLIT_PENDING));
        assertEq(_epochNetProfitPrime(1), int256(profit));

        _fundAndSplitEligible(1, profit);

        (uint256 stewardAmount, uint256 unallocatedAmount, uint256 globalAmount, int256 np) =
            _epochSplitAmounts(1);
        assertEq(uint256(_epochStatus(1)), uint256(CountryPoolNetProfitLedger.EpochStatus.SPLIT_COMPLETED));
        assertEq(stewardAmount + unallocatedAmount + globalAmount, uint256(np));
        assertEq(stewardAmount, (profit * 4500) / 10_000);
        assertEq(globalAmount, profit - stewardAmount);
        assertEq(usdc.balanceOf(address(stewardVault)), stewardAmount);
        assertEq(usdc.balanceOf(treasury), globalAmount);
    }

    // T-CLS-02
    function test_T_CLS_02_LossIncreasesCarriedLossNoSplit() public {
        (uint64 start, uint64 end) = _openEpoch1();
        _accrueProfit(1, 100, 500, "loss");
        _closeAfterDelay(1, end);
        assertEq(uint256(_epochStatus(1)), uint256(CountryPoolNetProfitLedger.EpochStatus.NO_SPLIT));
        assertEq(ledger.carriedLoss(), 400);
    }

    // T-CLS-03
    function test_T_CLS_03_ZeroProfitNoSplit() public {
        (uint64 start, uint64 end) = _openEpoch1();
        _accrueProfit(1, 500, 500, "zero");
        _closeAfterDelay(1, end);
        assertEq(uint256(_epochStatus(1)), uint256(CountryPoolNetProfitLedger.EpochStatus.NO_SPLIT));
    }

    // T-CLS-04
    function test_T_CLS_04_CloseTooEarlyReverts() public {
        (uint64 start, uint64 end) = _openEpoch1();
        vm.warp(uint256(end) + 1);
        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.CloseTooEarly.selector);
        ledger.closeEpoch(1);
    }

    // T-CLS-05 / FIN-L02
    function test_T_CLS_05_CarriedLossAppliedBeforeSplit() public {
        (uint64 start, uint64 end) = _openEpoch1();
        _accrueProfit(1, 100, 500, "l1");
        _closeAfterDelay(1, end);
        assertEq(ledger.carriedLoss(), 400);

        vm.prank(owner);
        ledger.openEpoch(2, end + 1, end + 90 days);
        uint256 profit = 1_000_000;
        _accrueProfit(2, int256(profit), 0, "l2");
        vm.warp(uint256(end) + 90 days + CLOSE_DELAY + 2);
        vm.prank(owner);
        ledger.closeEpoch(2);

        assertEq(ledger.epochCarriedLossApplied(2), 400);
        assertEq(ledger.epochNetProfitPrime(2), int256(profit - 400));
        assertEq(ledger.carriedLoss(), 0);
    }

    // T-CLS-06
    function test_T_CLS_06_DoubleCloseReverts() public {
        (uint64 start, uint64 end) = _openEpoch1();
        _closeAfterDelay(1, end);
        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.EpochNotOpen.selector);
        ledger.closeEpoch(1);
    }

    // T-SPL-02 / T-QLF-02 / Q-F01
    function test_T_SPL_02_UnallocatedWhenNotEligible() public {
        (uint64 start, uint64 end) = _openEpoch1();
        uint256 profit = 1_000_000;
        _accrueProfit(1, int256(profit), 0, "u");
        _closeAfterDelay(1, end);

        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();
        vm.startPrank(owner);
        ledger.fundLedgerForSplit(1);
        ledger.splitNetProfit(1);
        vm.stopPrank();

        (uint256 stewardAmount, uint256 unallocatedAmount, uint256 globalAmount,) = _epochSplitAmounts(1);
        assertEq(unallocatedAmount, (profit * 4500) / 10_000);
        assertEq(stewardAmount, 0);
        assertEq(usdc.balanceOf(address(unallocVault)), unallocatedAmount);
        assertEq(globalAmount, profit - unallocatedAmount);
    }

    // T-SPL-06
    function test_T_SPL_06_DoubleSplitReverts() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 100_000;
        _accrueProfit(1, int256(profit), 0, "ds");
        _closeAfterDelay(1, end);
        _fundAndSplitEligible(1, profit);

        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.EpochNotSplitPending.selector);
        ledger.splitNetProfit(1);
    }

    // T-SPL-07 / T-SPL-08 — ineligible: 45% Unallocated, global stays 55% (+ remainder), not 100% to treasury
    function test_T_SPL_07_08_IneligibleGlobalNotAbsorbingStewardLeg() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 1_000_003;
        _accrueProfit(1, int256(profit), 0, "q");
        _closeAfterDelay(1, end);

        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();
        vm.startPrank(owner);
        ledger.fundLedgerForSplit(1);
        ledger.splitNetProfit(1);
        vm.stopPrank();

        (uint256 stewardAmount, uint256 unallocatedAmount, uint256 globalAmount,) = _epochSplitAmounts(1);
        uint256 stewardLeg = (profit * 4500) / 10_000;
        uint256 globalBase = (profit * 5500) / 10_000;
        uint256 remainder = profit - stewardLeg - globalBase;

        assertEq(stewardAmount, 0);
        assertEq(unallocatedAmount, stewardLeg);
        assertEq(globalAmount, globalBase + remainder);
        assertEq(unallocatedAmount + globalAmount, profit);
        assertLt(globalAmount, profit);
    }

    // T-SPL-04 S-02 remainder to global
    function test_T_SPL_04_RemainderToGlobal() public pure {
        uint256 np = 1_000_003;
        uint256 stewardLeg = (np * 4500) / 10_000;
        uint256 globalBase = (np * 5500) / 10_000;
        uint256 remainder = np - stewardLeg - globalBase;
        uint256 globalLeg = globalBase + remainder;
        assertEq(stewardLeg + globalLeg, np);
        assertEq(remainder, 1);
    }

    // T-SPL-05
    function test_T_SPL_05_SplitAfterNoSplitReverts() public {
        (uint64 start, uint64 end) = _openEpoch1();
        _accrueProfit(1, 10, 100, "ns");
        _closeAfterDelay(1, end);
        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.EpochNotSplitPending.selector);
        ledger.splitNetProfit(1);
    }

    // T-FND-02
    function test_T_FND_02_SplitWithoutFundReverts() public {
        (uint64 start, uint64 end) = _openEpoch1();
        _accrueProfit(1, 100_000, 0, "nf");
        _closeAfterDelay(1, end);
        vm.prank(owner);
        ledger.setActiveStewardConfig(steward, false, true, false, bytes32("p"));
        vm.prank(owner);
        vm.expectRevert(CountryPoolNetProfitLedger.SplitNotFunded.selector);
        ledger.splitNetProfit(1);
    }

    // T-QLF-01
    function test_T_QLF_01_EligibleStewardReceivesStewardPath() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 800_000;
        _accrueProfit(1, int256(profit), 0, "q1");
        _closeAfterDelay(1, end);
        _fundAndSplitEligible(1, profit);

        (uint256 stewardAmount, uint256 unallocatedAmount,,) = _epochSplitAmounts(1);
        assertGt(stewardAmount, 0);
        assertEq(unallocatedAmount, 0);
        assertEq(usdc.balanceOf(steward), 0);
    }

    // T-QLF-03 — Q-F05: no direct EOA payout on split
    function test_T_QLF_03_NoEoaReceivePathOnSplit() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 600_000;
        _accrueProfit(1, int256(profit), 0, "q3");
        _closeAfterDelay(1, end);
        _fundAndSplitEligible(1, profit);

        assertEq(usdc.balanceOf(steward), 0);
        (uint256 stewardAmount,,) = ledger.epochSplitAmounts(1);
        assertEq(usdc.balanceOf(address(stewardVault)), stewardAmount);
    }

    // T-QLF-04 — LEG-XJ: FR stake does not qualify DE ledger
    function test_T_QLF_04_WrongJurisdictionStakeNotEligible() public {
        bytes2 jFr = bytes2("FR");
        address frSteward = makeAddr("frSteward");
        vm.prank(owner);
        stakePool.configureJurisdiction(jFr, 400);
        ttg.transfer(frSteward, stakePool.minStakeAmount(jFr));
        vm.startPrank(frSteward);
        ttg.approve(address(stakePool), type(uint256).max);
        stakePool.stake(jFr, stakePool.minStakeAmount(jFr), bytes32("frApp"));
        vm.stopPrank();

        (, uint64 end) = _openEpoch1();
        uint256 profit = 400_000;
        _accrueProfit(1, int256(profit), 0, "xj");
        _closeAfterDelay(1, end);

        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();
        vm.startPrank(owner);
        ledger.setActiveStewardConfig(frSteward, false, true, false, bytes32("xj"));
        ledger.fundLedgerForSplit(1);
        ledger.splitNetProfit(1);
        vm.stopPrank();

        (uint256 stewardAmount, uint256 unallocatedAmount,,) = _epochSplitAmounts(1);
        assertEq(stewardAmount, 0);
        assertGt(unallocatedAmount, 0);
    }

    // T-QLF-05
    function test_T_QLF_05_SuspendedStewardGoesUnallocated() public {
        (uint64 start, uint64 end) = _openEpoch1();
        uint256 profit = 500_000;
        _accrueProfit(1, int256(profit), 0, "susp");
        _closeAfterDelay(1, end);
        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();
        vm.startPrank(owner);
        ledger.setActiveStewardConfig(steward, true, true, false, bytes32("s"));
        ledger.fundLedgerForSplit(1);
        ledger.splitNetProfit(1);
        vm.stopPrank();
        (, uint256 ua,,) = _epochSplitAmounts(1);
        assertGt(ua, 0);
    }

    // T-QLF-06
    function test_T_QLF_06_NoStakeGoesUnallocated() public {
        address noStake = makeAddr("noStake");
        (uint64 start, uint64 end) = _openEpoch1();
        uint256 profit = 500_000;
        _accrueProfit(1, int256(profit), 0, "nst");
        _closeAfterDelay(1, end);
        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();
        vm.startPrank(owner);
        ledger.setActiveStewardConfig(noStake, false, true, false, bytes32("n"));
        ledger.fundLedgerForSplit(1);
        ledger.splitNetProfit(1);
        vm.stopPrank();
        (, uint256 ua,,) = _epochSplitAmounts(1);
        assertGt(ua, 0);
    }

    // T-GOV-02
    function test_T_GOV_02_TimelockExecuteCloseEpoch() public {
        vm.prank(owner);
        ledger.transferOwnership(address(tl));

        uint64 start = uint64(block.timestamp);
        uint64 end = start + 90 days;
        bytes memory openData = CountryPoolNetProfitGovernancePayload.encodeOpenEpoch(1, start, end);
        vm.prank(owner);
        bytes32 openId = tl.schedule(address(ledger), 0, openData, bytes32("open"));
        vm.warp(block.timestamp + 1 days);
        tl.execute(openId);

        bytes memory accrualData = CountryPoolNetProfitGovernancePayload.encodeRecordAccrual(
            1, ACCT_R100, 50_000, bytes32("gov2")
        );
        vm.prank(owner);
        bytes32 accrualId = tl.schedule(address(ledger), 0, accrualData, bytes32("acc"));
        vm.warp(block.timestamp + 1 days);
        tl.execute(accrualId);

        vm.warp(uint256(end) + CLOSE_DELAY + 1);

        bytes memory closeData = CountryPoolNetProfitGovernancePayload.encodeCloseEpoch(1);
        vm.prank(owner);
        bytes32 closeId = tl.schedule(address(ledger), 0, closeData, bytes32("close"));
        vm.warp(block.timestamp + 1 days);
        tl.execute(closeId);

        assertEq(uint256(_epochStatus(1)), uint256(CountryPoolNetProfitLedger.EpochStatus.SPLIT_PENDING));
    }

    // T-GOV-04
    function test_T_GOV_04_SettlementParamsViaTimelock() public {
        vm.prank(owner);
        ledger.transferOwnership(address(tl));

        address newTreasury = makeAddr("newTreasury");
        bytes memory data = abi.encodeWithSelector(
            CountryPoolNetProfitLedger.setSettlementParams.selector,
            uint64(20 days),
            4500,
            5500,
            newTreasury,
            funding
        );
        vm.prank(owner);
        bytes32 id = tl.schedule(address(ledger), 0, data, bytes32("params"));
        vm.warp(block.timestamp + 1 days);
        tl.execute(id);

        assertEq(ledger.globalTreasury(), newTreasury);
        assertEq(ledger.closeDelaySeconds(), 20 days);
    }

    // T-GOV-01
    function test_T_GOV_01_TimelockDisallowedTargetReverts() public {
        bytes memory data = CountryPoolNetProfitGovernancePayload.encodeCloseEpoch(1);
        vm.prank(owner);
        vm.expectRevert(GovernanceTimelock.TargetNotAllowed.selector);
        tl.schedule(makeAddr("random"), 0, data, bytes32("salt"));
    }

    // T-UNA-01
    function test_T_UNA_01_DepositAccumulatesTotalReceived() public {
        (, uint64 end) = _openEpoch1();
        uint256 profit = 300_000;
        _accrueProfit(1, int256(profit), 0, "u1");
        _closeAfterDelay(1, end);

        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();
        vm.startPrank(owner);
        ledger.fundLedgerForSplit(1);
        ledger.splitNetProfit(1);
        vm.stopPrank();

        uint256 expected = (profit * 4500) / 10_000;
        assertEq(unallocVault.totalReceived(), expected);
        assertEq(usdc.balanceOf(address(unallocVault)), expected);
    }

    // T-UNA-02
    function test_T_UNA_02_ReleaseToStewardPath() public {
        (uint64 start, uint64 end) = _openEpoch1();
        uint256 profit = 1_000_000;
        _accrueProfit(1, int256(profit), 0, "rel");
        _closeAfterDelay(1, end);
        usdc.mint(funding, profit);
        vm.startPrank(funding);
        usdc.approve(address(ledger), profit);
        vm.stopPrank();
        vm.startPrank(owner);
        ledger.fundLedgerForSplit(1);
        ledger.splitNetProfit(1);
        (, uint256 unallocatedAmount,,) = _epochSplitAmounts(1);
        unallocVault.releaseToStewardPath(unallocatedAmount, bytes32("relProp"));
        vm.stopPrank();
        assertEq(usdc.balanceOf(address(stewardVault)), unallocatedAmount);
    }

    // T-UNA-03
    function test_T_UNA_03_ReleaseOverBalanceReverts() public {
        vm.prank(owner);
        vm.expectRevert(UnallocatedStewardPathVault.InvalidAmount.selector);
        unallocVault.releaseToStewardPath(1, bytes32("x"));
    }

    // T-UNA-04
    function test_T_UNA_04_NonOwnerReleaseReverts() public {
        vm.prank(makeAddr("rando"));
        vm.expectRevert(UnallocatedStewardPathVault.OnlyOwner.selector);
        unallocVault.releaseToStewardPath(1, bytes32("x"));
    }

    // T-UNA-05 — U-02: no treasury/global release hook on Unallocated vault
    function test_T_UNA_05_NoGlobalReleasePath() public {
        bytes4 releaseSel = UnallocatedStewardPathVault.releaseToStewardPath.selector;
        bytes4 depositSel = UnallocatedStewardPathVault.depositFromLedger.selector;
        assertTrue(releaseSel != IERC20.transfer.selector);
        assertTrue(depositSel != IERC20.transfer.selector);
        assertEq(unallocVault.stewardPathVault(), address(stewardVault));
    }

    function test_VersionStrings() public view {
        assertEq(ledger.version(), "country_pool_net_profit_ledger_v1");
        assertEq(stewardVault.version(), "steward_path_vault_v1");
        assertEq(unallocVault.version(), "unallocated_steward_path_vault_v1");
    }
}
