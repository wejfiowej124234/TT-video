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

/// Sprint 3a · splitNetProfit → evaluateVacancySweep (TR-01 · SM-01 · no API/Indexer).
contract CountryPoolNetProfitVacancyS3aTest is Test {
    bytes32 internal constant ACCT_R100 = bytes32("R-100");
    bytes2 internal constant J = bytes2("DE");

    address internal owner = makeAddr("owner");
    address internal treasury = makeAddr("treasury");
    address internal funding = makeAddr("funding");

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

    function test_S3a_unallocatedSplitWritesVacancyLedger() public {
        _splitIneligible(1, 1_000_000e6);

        VacancyTypes.VacancyLedger memory vl = unallocVault.vacancyLedger();
        assertEq(vl.principal, 450_000e6);
        assertEq(vl.reserve, 450_000e6);
        VacancyLedgerLib.assertLedgerIdentity(vl);
    }

    function test_S3a_graceStartedOnFirstIneligibleSplit() public {
        _splitIneligible(1, 1_000_000e6);

        assertEq(uint8(ledger.vacancyState()), uint8(CountryPoolNetProfitLedger.VacancyState.GRACE_PERIOD));
        assertGt(ledger.vacancyGraceStartedAt(), 0);
    }

    function test_S3a_noSweepDuringGracePeriod() public {
        _splitIneligible(1, 1_000_000e6);
        vm.warp(ledger.vacancyGraceStartedAt() + 3 days);
        _splitIneligible(2, 1_000_000e6);

        VacancyTypes.VacancyLedger memory vl = unallocVault.vacancyLedger();
        assertEq(vl.swept, 0);
        assertEq(uint8(ledger.vacancyState()), uint8(CountryPoolNetProfitLedger.VacancyState.GRACE_PERIOD));
    }

    function test_S3a_sweepAfterGraceViaSplitNetProfit() public {
        _splitIneligible(1, 1_000_000e6);
        vm.warp(block.timestamp + TEST_GRACE_DAYS * 1 days);
        _splitIneligible(2, 1_000_000e6);

        assertEq(uint8(ledger.vacancyState()), uint8(CountryPoolNetProfitLedger.VacancyState.SWEEP));

        VacancyTypes.VacancyLedger memory vl = unallocVault.vacancyLedger();
        assertEq(vl.principal, 900_000e6);
        assertEq(vl.swept, 225_000e6);
        assertEq(usdc.balanceOf(treasury), 225_000e6 + 550_000e6 + 550_000e6);
        VacancyLedgerLib.assertLedgerIdentity(vl);
    }

    function test_S3a_sweepDisabledDoesNotAutoReenable() public {
        _splitIneligible(1, 8_000_000e6);
        vm.warp(block.timestamp + TEST_GRACE_DAYS * 1 days);

        uint256 epoch = 2;
        while (unallocVault.sweepEnabled() && epoch <= 10) {
            _splitIneligible(epoch, 1_000_000e6);
            epoch++;
        }
        assertFalse(unallocVault.sweepEnabled());

        _splitIneligible(epoch, 1_000_000e6);
        assertFalse(unallocVault.sweepEnabled());
    }

    function test_integration_TR01_sweepOnlyViaSplitNetProfit() public {
        _splitIneligible(1, 2_000_000e6);
        vm.warp(block.timestamp + TEST_GRACE_DAYS * 1 days);

        vm.prank(owner);
        vm.expectRevert(VacancyErrors.OnlyLedger.selector);
        unallocVault.evaluateAndExecuteVacancySweep(99);

        _splitIneligible(2, 2_000_000e6);
        assertGt(unallocVault.vacancyLedger().swept, 0);
    }

    function test_SM01_vacancyStateTransitions() public {
        assertEq(uint8(ledger.vacancyState()), uint8(CountryPoolNetProfitLedger.VacancyState.STEWARD_ACTIVE));

        _splitIneligible(1, 1_000_000e6);
        assertEq(uint8(ledger.vacancyState()), uint8(CountryPoolNetProfitLedger.VacancyState.GRACE_PERIOD));

        vm.warp(block.timestamp + TEST_GRACE_DAYS * 1 days);
        _splitIneligible(2, 1_000_000e6);
        assertEq(uint8(ledger.vacancyState()), uint8(CountryPoolNetProfitLedger.VacancyState.SWEEP));
    }

    function _shortGraceParams() internal pure returns (VacancyTypes.VacancyParams memory) {
        VacancyTypes.VacancyParams memory p = VacancyTestParams.ssotV1Defaults();
        p.vacancyGraceDays = TEST_GRACE_DAYS;
        return p;
    }

    function _splitIneligible(uint256 epochId, uint256 profit) internal {
        uint64 start = uint64(block.timestamp);
        uint64 end = start + 1 days;

        vm.startPrank(owner);
        ledger.openEpoch(epochId, start, end);
        ledger.recordAccrual(epochId, ACCT_R100, int256(profit), bytes32(uint256(epochId)));
        vm.stopPrank();

        vm.warp(uint256(end) + 2);

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
}
