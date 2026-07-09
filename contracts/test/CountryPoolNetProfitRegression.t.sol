// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/FeeRouter.sol";
import "../src/CountryPoolLedgerV0.sol";
import "../src/CountryPoolRedemptionEpochV0.sol";
import "../src/CountryPoolNetProfitLedger.sol";
import "../src/StewardPathVault.sol";
import "../src/vacancy/UnallocatedStewardPathVault.sol";
import "./vacancy/VacancyTestParams.sol";
import "../src/MockERC20.sol";

/// D-4555-B · Gate-2.2 regression · T-REG-* (arch §10.6 · orthogonal to FeeRouter / P5 / Redemption).
contract CountryPoolNetProfitRegressionTest is Test {
    bytes2 internal constant J_DE = bytes2("DE");

    function _deployNetProfitStack(address owner, address treasury, MockERC20 token)
        internal
        returns (CountryPoolNetProfitLedger ledger, StewardPathVault stewardVault)
    {
        uint256 n = vm.getNonce(address(this));
        address predictedLedger = vm.computeCreateAddress(address(this), n + 2);
        stewardVault = new StewardPathVault(owner, J_DE, address(token), predictedLedger);
        UnallocatedStewardPathVault unallocVault = new UnallocatedStewardPathVault(
            owner,
            J_DE,
            address(token),
            predictedLedger,
            address(stewardVault),
            treasury,
            VacancyTestParams.ssotV1Defaults()
        );
        ledger = new CountryPoolNetProfitLedger(
            owner,
            J_DE,
            address(token),
            address(stewardVault),
            address(unallocVault),
            treasury,
            address(this),
            15 days,
            4500,
            5500
        );
        assertEq(address(ledger), predictedLedger);
    }

    // T-REG-01 — V-01: FeeRouter bps unchanged after Settlement stack deploy
    function test_T_REG_01_FeeRouterDistributeUnchanged() public {
        address country = makeAddr("country");
        address stakers = makeAddr("stakers");
        address reserve = makeAddr("reserve");
        address ops = makeAddr("ops");
        address admin = makeAddr("admin");

        FeeRouter router = new FeeRouter(admin, country, stakers, reserve, ops);
        MockERC20 token = new MockERC20();
        uint256 amount = 10_000;
        token.mint(address(router), amount);

        vm.prank(admin);
        router.distribute(token, amount);

        assertEq(router.BPS_COUNTRY(), 4500);
        assertEq(token.balanceOf(country), 4500);
        assertEq(token.balanceOf(stakers), 3575);
        assertEq(token.balanceOf(reserve), 1100);
        assertEq(token.balanceOf(ops), 825);
    }

    // T-REG-02 — V-03 / R-05: FeeRouter country bucket ≠ net-profit steward vault
    function test_T_REG_02_FeeRouterCountryDistinctFromStewardVault() public {
        address country = makeAddr("feeCountry");
        FeeRouter router = new FeeRouter(address(this), country, address(this), address(this), address(this));
        MockERC20 token = new MockERC20();

        (, StewardPathVault stewardVault) =
            _deployNetProfitStack(makeAddr("owner"), makeAddr("treasury"), token);

        assertTrue(country != address(stewardVault));
        assertTrue(router.countryBucket() != address(stewardVault));
        assertTrue(router.countryBucket() == country);
    }

    // T-REG-03 — CountryPoolLedgerV0 credit does not mutate net-profit ledger state
    function test_T_REG_03_P5LedgerCreditOrthogonalToNetProfit() public {
        MockERC20 token = new MockERC20();
        address admin = makeAddr("admin");
        CountryPoolLedgerV0 p5 = new CountryPoolLedgerV0(admin, J_DE);

        (CountryPoolNetProfitLedger np,) = _deployNetProfitStack(makeAddr("owner"), makeAddr("treasury"), token);

        token.mint(admin, 500_000);
        vm.startPrank(admin);
        token.approve(address(p5), 500_000);
        p5.credit(J_DE, token, 500_000, bytes32("p5"));
        vm.stopPrank();

        assertEq(np.latestEpochId(), 0);
        assertEq(np.carriedLoss(), 0);
        assertEq(token.balanceOf(address(p5)), 500_000);
        assertEq(token.balanceOf(address(np)), 0);
    }

    // T-REG-04 — P-04: redemption epoch lifecycle does not touch net-profit ledger
    function test_T_REG_04_RedemptionEpochOrthogonalToNetProfit() public {
        MockERC20 token = new MockERC20();
        address admin = makeAddr("admin");
        CountryPoolRedemptionEpochV0 redemption =
            new CountryPoolRedemptionEpochV0(admin, J_DE, address(token), 1000, 15 days);

        (CountryPoolNetProfitLedger np,) = _deployNetProfitStack(makeAddr("owner"), makeAddr("treasury"), token);

        token.mint(admin, 1_000_000);
        vm.startPrank(admin);
        redemption.openEpoch(1_000_000);
        vm.stopPrank();

        assertEq(np.latestEpochId(), 0);
        assertEq(np.carriedLoss(), 0);
        assertEq(redemption.epochId(), 1);
    }
}
