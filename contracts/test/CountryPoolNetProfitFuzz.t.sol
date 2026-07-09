// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/CountryPoolNetProfitLedger.sol";
import "../src/StewardPathVault.sol";
import "../src/vacancy/UnallocatedStewardPathVault.sol";
import "./vacancy/VacancyTestParams.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/RegionStewardStakePool.sol";
import "../src/MockERC20.sol";

/// G23-02 · fuzz / invariant properties for Country Pool net profit settlement (① local).
contract CountryPoolNetProfitFuzzTest is Test {
    bytes32 internal constant ACCT_R100 = bytes32("R-100");
    bytes32 internal constant ACCT_E100 = bytes32("E-100");

    bytes2 internal constant J_DE = bytes2("DE");
    uint64 internal constant CLOSE_DELAY = 15 days;

    struct Stack {
        MockERC20 usdc;
        GovernanceVotesToken ttg;
        RegionStewardStakePool stakePool;
        StewardPathVault stewardVault;
        UnallocatedStewardPathVault unallocVault;
        CountryPoolNetProfitLedger ledger;
        address owner;
        address treasury;
        address funding;
        address steward;
    }

    function _deployStack() internal returns (Stack memory s) {
        s.owner = makeAddr("fuzzOwner");
        s.treasury = makeAddr("fuzzTreasury");
        s.funding = makeAddr("fuzzFunding");
        s.steward = makeAddr("fuzzSteward");

        s.usdc = new MockERC20();
        s.ttg = new GovernanceVotesToken(1_000_000_000e18, address(0));
        s.stakePool = new RegionStewardStakePool(s.owner, address(s.ttg), 1_000_000_000e18, 7 days, 14 days);
        vm.prank(s.owner);
        s.stakePool.configureJurisdiction(J_DE, 400);

        uint256 n = vm.getNonce(address(this));
        address predictedLedger = vm.computeCreateAddress(address(this), n + 2);
        s.stewardVault = new StewardPathVault(s.owner, J_DE, address(s.usdc), predictedLedger);
        s.unallocVault = new UnallocatedStewardPathVault(
            s.owner,
            J_DE,
            address(s.usdc),
            predictedLedger,
            address(s.stewardVault),
            s.treasury,
            VacancyTestParams.ssotV1Defaults()
        );
        s.ledger = new CountryPoolNetProfitLedger(
            s.owner,
            J_DE,
            address(s.usdc),
            address(s.stewardVault),
            address(s.unallocVault),
            s.treasury,
            address(s.stakePool),
            CLOSE_DELAY,
            4500,
            5500
        );
        assertEq(address(s.ledger), predictedLedger);

        vm.prank(s.owner);
        s.ledger.setFundingSource(s.funding);

        s.ttg.transfer(s.steward, s.stakePool.minStakeAmount(J_DE));
        vm.startPrank(s.steward);
        s.ttg.approve(address(s.stakePool), type(uint256).max);
        s.stakePool.stake(J_DE, s.stakePool.minStakeAmount(J_DE), bytes32("fuzzStake"));
        vm.stopPrank();
    }

    function _openEpochAt(Stack memory s, uint256 epochId, uint64 start) internal returns (uint64 epochEnd) {
        epochEnd = start + 90 days;
        vm.prank(s.owner);
        s.ledger.openEpoch(epochId, start, epochEnd);
    }

    function _openEpoch(Stack memory s, uint256 epochId) internal returns (uint64 epochEnd) {
        return _openEpochAt(s, epochId, uint64(block.timestamp));
    }

    function _closeEpoch(Stack memory s, uint256 epochId, uint64 epochEnd) internal {
        vm.warp(uint256(epochEnd) + CLOSE_DELAY + 1);
        vm.prank(s.owner);
        s.ledger.closeEpoch(epochId);
    }

    function _setStewardEligible(Stack memory s, bool eligible) internal {
        vm.prank(s.owner);
        if (eligible) {
            s.ledger.setActiveStewardConfig(s.steward, false, true, false, bytes32("fuzzEligible"));
        } else {
            s.ledger.setActiveStewardConfig(address(0), false, false, false, bytes32("fuzzIneligible"));
        }
    }

    function _fundEpoch(Stack memory s, uint256 epochId, uint256 amount) internal {
        s.usdc.mint(s.funding, amount);
        vm.startPrank(s.funding);
        s.usdc.approve(address(s.ledger), amount);
        vm.stopPrank();
        vm.prank(s.owner);
        s.ledger.fundLedgerForSplit(epochId);
    }

    function _line(bytes32 accountCode, int256 amountSigned, bytes32 ref)
        internal
        pure
        returns (CountryPoolNetProfitLedger.AccrualLine memory)
    {
        return CountryPoolNetProfitLedger.AccrualLine({accountCode: accountCode, amountSigned: amountSigned, ref: ref});
    }

    function _assertSplitConservation(Stack memory s, uint256 epochId) internal view {
        int256 np = s.ledger.epochNetProfitPrime(epochId);
        if (np <= 0) return;

        (uint256 stewardAmount, uint256 unallocatedAmount, uint256 globalAmount) =
            s.ledger.epochSplitAmounts(epochId);
        assertEq(stewardAmount + unallocatedAmount + globalAmount, uint256(np));

        uint256 stewardLeg = (uint256(np) * 4500) / 10_000;
        uint256 globalBase = (uint256(np) * 5500) / 10_000;
        uint256 globalLeg = globalBase + (uint256(np) - stewardLeg - globalBase);
        assertEq(globalAmount, globalLeg);
    }

    // T-FUZ-01 · random accrual (single or batch) → close → fund → split · sum + token conservation
    function testFuzz_T_FUZ_01_AccrualCloseFundSplitConservation(
        uint256 seed,
        uint8 lineCountRaw,
        bool useBatch,
        bool eligible,
        uint256 prefundRaw
    ) public {
        uint8 lineCount = uint8(bound(lineCountRaw, 1, 12));
        Stack memory s = _deployStack();
        uint64 epochEnd = _openEpoch(s, 1);

        int256 expectedGross;
        int256 expectedExpense;
        CountryPoolNetProfitLedger.AccrualLine[] memory lines =
            new CountryPoolNetProfitLedger.AccrualLine[](lineCount);

        for (uint8 i = 0; i < lineCount; ++i) {
            uint256 amt = bound(uint256(keccak256(abi.encode(seed, i))), 1, 50_000_000);
            bool isRevenue = (uint256(keccak256(abi.encode(seed, i, "side"))) % 2) == 0;
            bytes32 ref = keccak256(abi.encodePacked("fuz01", seed, i));
            if (isRevenue) {
                lines[i] = _line(ACCT_R100, int256(amt), ref);
                expectedGross += int256(amt);
            } else {
                lines[i] = _line(ACCT_E100, -int256(amt), ref);
                expectedExpense += int256(amt);
            }
        }

        vm.startPrank(s.owner);
        if (useBatch) {
            s.ledger.recordAccrualBatch(1, lines);
        } else {
            for (uint8 i = 0; i < lineCount; ++i) {
                CountryPoolNetProfitLedger.AccrualLine memory ln = lines[i];
                s.ledger.recordAccrual(1, ln.accountCode, ln.amountSigned, ln.ref);
            }
        }
        vm.stopPrank();

        assertEq(s.ledger.epochGrossRevenue(1), expectedGross);
        assertEq(s.ledger.epochAllowableExpense(1), expectedExpense);

        _closeEpoch(s, 1, epochEnd);
        int256 np = s.ledger.epochNetProfitPrime(1);
        if (np <= 0) {
            assertTrue(
                s.ledger.epochStatus(1) == CountryPoolNetProfitLedger.EpochStatus.NO_SPLIT
            );
            return;
        }

        uint256 need = uint256(np);
        uint256 prefund = bound(prefundRaw, 0, need);
        if (prefund > 0) {
            s.usdc.mint(address(s.ledger), prefund);
        }

        uint256 treasuryBefore = s.usdc.balanceOf(s.treasury);
        uint256 stewardBefore = s.stewardVault.totalReceived();
        uint256 unallocBefore = s.unallocVault.totalReceived();

        _setStewardEligible(s, eligible);
        _fundEpoch(s, 1, need - prefund);

        uint256 balAfterFund = s.usdc.balanceOf(address(s.ledger));
        assertGe(balAfterFund, need);
        assertTrue(s.ledger.epochFunded(1));

        vm.prank(s.owner);
        s.ledger.splitNetProfit(1);

        _assertSplitConservation(s, 1);

        (uint256 stewardAmount, uint256 unallocatedAmount, uint256 globalAmount) =
            s.ledger.epochSplitAmounts(1);

        if (eligible) {
            if (1 > s.ledger.stewardActivationEpochId()) {
                assertEq(s.stewardVault.totalReceived() - stewardBefore, stewardAmount);
                assertEq(unallocatedAmount, 0);
            } else {
                assertEq(stewardAmount, 0);
                assertGt(unallocatedAmount, 0);
            }
        } else {
            assertEq(s.unallocVault.totalReceived() - unallocBefore, unallocatedAmount);
            assertEq(stewardAmount, 0);
        }

        assertEq(s.usdc.balanceOf(s.treasury) - treasuryBefore, globalAmount);
        assertEq(s.usdc.balanceOf(address(s.ledger)), balAfterFund - need);
    }

    // T-FUZ-01 · batch vs single accrual produce identical epoch totals
    function testFuzz_T_FUZ_01_BatchSingleAccrualEquivalence(uint256 seed, uint8 lineCountRaw) public {
        uint8 lineCount = uint8(bound(lineCountRaw, 1, 16));
        Stack memory single = _deployStack();
        Stack memory batch = _deployStack();

        uint64 endSingle = _openEpoch(single, 1);
        uint64 endBatch = _openEpoch(batch, 1);

        CountryPoolNetProfitLedger.AccrualLine[] memory lines =
            new CountryPoolNetProfitLedger.AccrualLine[](lineCount);

        for (uint8 i = 0; i < lineCount; ++i) {
            uint256 amt = bound(uint256(keccak256(abi.encode(seed, i, "eq"))), 1, 25_000_000);
            bool isRevenue = (uint256(keccak256(abi.encode(seed, i, "eqSide"))) % 2) == 0;
            bytes32 ref = keccak256(abi.encodePacked("eq", seed, i));
            lines[i] = isRevenue ? _line(ACCT_R100, int256(amt), ref) : _line(ACCT_E100, -int256(amt), ref);
        }

        vm.startPrank(single.owner);
        for (uint8 i = 0; i < lineCount; ++i) {
            CountryPoolNetProfitLedger.AccrualLine memory ln = lines[i];
            single.ledger.recordAccrual(1, ln.accountCode, ln.amountSigned, ln.ref);
        }
        vm.stopPrank();

        vm.prank(batch.owner);
        batch.ledger.recordAccrualBatch(1, lines);

        _closeEpoch(single, 1, endSingle);
        _closeEpoch(batch, 1, endBatch);

        assertEq(single.ledger.epochGrossRevenue(1), batch.ledger.epochGrossRevenue(1));
        assertEq(single.ledger.epochAllowableExpense(1), batch.ledger.epochAllowableExpense(1));
        assertEq(single.ledger.epochNetProfitPrime(1), batch.ledger.epochNetProfitPrime(1));
        assertEq(uint256(single.ledger.epochStatus(1)), uint256(batch.ledger.epochStatus(1)));
        assertEq(single.ledger.carriedLoss(), batch.ledger.carriedLoss());
    }

    // T-FUZ-02 · carriedLoss non-negative · close-only mutations across epochs
    function testFuzz_T_FUZ_02_CarriedLossAccounting(
        uint256 rev1,
        uint256 exp1,
        uint256 rev2,
        uint256 exp2,
        uint256 rev3,
        uint256 exp3
    ) public {
        rev1 = bound(rev1, 0, 100_000_000);
        exp1 = bound(exp1, 0, 100_000_000);
        rev2 = bound(rev2, 0, 100_000_000);
        exp2 = bound(exp2, 0, 100_000_000);
        rev3 = bound(rev3, 0, 100_000_000);
        exp3 = bound(exp3, 0, 100_000_000);

        Stack memory s = _deployStack();
        uint256 carriedBeforeClose;
        uint64 nextStart = 1;

        for (uint256 epochId = 1; epochId <= 3; ++epochId) {
            uint64 epochEnd = _openEpochAt(s, epochId, nextStart);
            uint256 rev = epochId == 1 ? rev1 : (epochId == 2 ? rev2 : rev3);
            uint256 exp = epochId == 1 ? exp1 : (epochId == 2 ? exp2 : exp3);

            if (rev > 0) {
                vm.prank(s.owner);
                s.ledger.recordAccrual(epochId, ACCT_R100, int256(rev), bytes32(uint256(epochId * 10 + 1)));
            }
            if (exp > 0) {
                vm.prank(s.owner);
                s.ledger.recordAccrual(epochId, ACCT_E100, -int256(exp), bytes32(uint256(epochId * 10 + 2)));
            }

            carriedBeforeClose = s.ledger.carriedLoss();
            int256 netProfit = s.ledger.epochGrossRevenue(epochId) - s.ledger.epochAllowableExpense(epochId);

            _closeEpoch(s, epochId, epochEnd);
            nextStart = epochEnd + CLOSE_DELAY + 2;

            uint256 applied = s.ledger.epochCarriedLossApplied(epochId);
            uint256 carriedAfter = s.ledger.carriedLoss();

            if (netProfit < 0) {
                assertEq(carriedAfter, carriedBeforeClose + uint256(-netProfit));
                assertEq(applied, 0);
            } else if (netProfit > 0) {
                uint256 expectedApplied = carriedBeforeClose < uint256(netProfit)
                    ? carriedBeforeClose
                    : uint256(netProfit);
                assertEq(applied, expectedApplied);
                assertEq(carriedAfter, carriedBeforeClose - expectedApplied);
            } else {
                assertEq(carriedAfter, carriedBeforeClose);
                assertEq(applied, 0);
            }
        }
    }

    // T-INV-01 · post-fund pre-split: ledger balance covers netProfitPrime
    function testFuzz_T_INV_01_PostFundPreSplitBalance(uint256 revenue, uint256 expense, uint256 prefundRaw)
        public
    {
        revenue = bound(revenue, 1, 500_000_000);
        expense = bound(expense, 0, revenue - 1);

        Stack memory s = _deployStack();
        uint64 epochEnd = _openEpoch(s, 1);

        vm.startPrank(s.owner);
        s.ledger.recordAccrual(1, ACCT_R100, int256(revenue), bytes32("inv-r"));
        if (expense > 0) {
            s.ledger.recordAccrual(1, ACCT_E100, -int256(expense), bytes32("inv-e"));
        }
        vm.stopPrank();

        _closeEpoch(s, 1, epochEnd);
        int256 np = s.ledger.epochNetProfitPrime(1);
        if (np <= 0) return;

        uint256 need = uint256(np);
        uint256 prefund = bound(prefundRaw, 0, need);
        if (prefund > 0) {
            s.usdc.mint(address(s.ledger), prefund);
        }

        _fundEpoch(s, 1, need - prefund);

        assertTrue(s.ledger.epochFunded(1));
        assertGe(s.usdc.balanceOf(address(s.ledger)), need);
    }
}
