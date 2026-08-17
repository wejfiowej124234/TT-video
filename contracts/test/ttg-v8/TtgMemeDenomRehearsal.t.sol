// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomConstants.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomGovernanceToken.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomPrimaryMarket.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomGovernor.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomStewardMinimums.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomTimelock.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomRehearsalUsdc.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomOpsWallet.sol";

/**
 * @notice ① Local fusion proof: live PM/Governor semantics on 25T denomination.
 *         Not Sepolia. Not Official live. Not Production GO.
 */
contract TtgMemeDenomRehearsalTest is Test {
    address internal deployer = address(this);
    address internal france = address(0xF4);
    address internal retail = address(0x1E);

    TtgMemeDenomRehearsalUsdc internal usdc;
    TtgMemeDenomOpsWallet internal teamWallet;
    TtgMemeDenomOpsWallet internal daoWallet;
    TtgMemeDenomGovernanceToken internal ttg;
    TtgMemeDenomPrimaryMarket internal pm;
    TtgMemeDenomTimelock internal timelock;
    TtgMemeDenomGovernor internal gov;

    uint256 internal frMin;
    uint256 internal frUsdc;

    function setUp() public {
        frMin = TtgMemeDenomStewardMinimums.minStake(bytes2("FR"));
        frUsdc = (frMin * 1e6) / TtgMemeDenomConstants.TTG_PER_USDC_UNIT;

        teamWallet = new TtgMemeDenomOpsWallet(deployer);
        daoWallet = new TtgMemeDenomOpsWallet(deployer);
        usdc = new TtgMemeDenomRehearsalUsdc(deployer);
        ttg = new TtgMemeDenomGovernanceToken(address(teamWallet), address(daoWallet), deployer);
        pm = new TtgMemeDenomPrimaryMarket(
            address(usdc), address(ttg), deployer, TtgMemeDenomConstants.TTG_PER_USDC_UNIT
        );
        ttg.transfer(address(pm), TtgMemeDenomConstants.PUBLIC_SALE_TTG);

        timelock = new TtgMemeDenomTimelock(deployer, 60);
        gov = new TtgMemeDenomGovernor(
            ITtgMemeDenomVotes(address(ttg)),
            ITtgMemeDenomTimelock(address(timelock)),
            1,
            8,
            0,
            TtgMemeDenomConstants.GOVERNANCE_QUORUM_BPS,
            0,
            14
        );
        timelock.setGovernor(address(gov));

        usdc.issue(france, frUsdc);
        vm.prank(france);
        usdc.approve(address(pm), type(uint256).max);
        vm.roll(block.number + 2);
    }

    function test_token_source_has_no_mint_identifier() public view {
        string memory src = vm.readFile("src/ttg-meme-denom/TtgMemeDenomGovernanceToken.sol");
        assertFalse(_containsMint(src));
        assertEq(ttg.COMPILER_TARGET(), "0.8.26");
    }

    function test_genesis_split_and_quote() public view {
        assertEq(ttg.balanceOf(address(teamWallet)), TtgMemeDenomConstants.TEAM_TTG);
        assertEq(ttg.balanceOf(address(daoWallet)), TtgMemeDenomConstants.DAO_TREASURY_TTG);
        assertEq(ttg.balanceOf(address(pm)), TtgMemeDenomConstants.PUBLIC_SALE_TTG);
        assertEq(pm.quoteTtg(1e6), 100_000 ether);
        assertEq(pm.minPurchaseUsdc(), 1e6);
        assertEq(frUsdc, 11_250_000e6);
        assertEq(frMin, 1_125_000_000_000 ether);
    }

    function test_purchase_ledger_and_live_quorum() public {
        vm.prank(france);
        pm.purchase(0, frUsdc);
        assertEq(pm.walletPurchasedTtg(france), frMin);
        assertEq(ttg.balanceOf(france), frMin);

        vm.prank(france);
        ttg.transfer(retail, 1 ether);
        assertEq(ttg.balanceOf(retail), 1 ether);

        vm.roll(block.number + 2);
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = _dummy(gov);
        bytes memory ret = teamWallet.exec(
            address(gov),
            0,
            abi.encodeWithSignature(
                "propose(address[],uint256[],bytes[],string)", targets, values, calldatas, "live quorum france"
            )
        );
        uint256 pid = abi.decode(ret, (uint256));
        (,, uint256 voteStart,,,,,,,) = gov.proposals(pid);
        vm.roll(voteStart);

        vm.prank(france);
        gov.castVote(pid, 1);
        assertTrue(gov.quorumReached(pid));
    }

    function test_migrator_is_not_prefunded_from_genesis() public view {
        assertEq(
            ttg.balanceOf(address(teamWallet)) + ttg.balanceOf(address(daoWallet)) + ttg.balanceOf(address(pm)),
            ttg.totalSupply()
        );
    }

    function _dummy(TtgMemeDenomGovernor g)
        internal
        pure
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
    {
        targets = new address[](1);
        targets[0] = address(g);
        values = new uint256[](1);
        calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(TtgMemeDenomGovernor.setOrderRatingReviewWindowDays.selector, 21);
    }

    function _containsMint(string memory s) internal pure returns (bool) {
        bytes memory b = bytes(s);
        if (b.length < 4) return false;
        for (uint256 i = 0; i + 3 < b.length; i++) {
            if (b[i] == "m" && b[i + 1] == "i" && b[i + 2] == "n" && b[i + 3] == "t") return true;
        }
        return false;
    }
}
