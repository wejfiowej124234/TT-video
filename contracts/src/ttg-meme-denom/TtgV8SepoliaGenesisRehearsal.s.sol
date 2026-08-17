// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Script.sol";
import {stdJson} from "forge-std/StdJson.sol";
import "./TtgMemeDenomConstants.sol";
import "./TtgMemeDenomGovernanceToken.sol";
import "./TtgMemeDenomPrimaryMarket.sol";
import "./TtgMemeDenomGovernor.sol";
import "./TtgMemeDenomStewardMinimums.sol";
import "./TtgMemeDenomTimelock.sol";
import "./TtgMemeDenomRehearsalUsdc.sol";
import "./TtgMemeDenomOpsWallet.sol";

/**
 * @title TtgV8SepoliaGenesisRehearsal
 * @notice ② Sepolia fusion proof only (chainid 11155111). Refuses Ethereum Mainnet.
 *         Deploys TTG + PM + Governor + throwaway Timelock. No O1 SeatGate, no O4 floor,
 *         no vote-escrow, no KYC. Does not deploy Migrator. Does not migrate live 10M TTG.
 *         Historical O1/O4 rehearsal addresses are throwaway — do not resume them.
 */
contract TtgV8SepoliaGenesisRehearsal is Script {
    using stdJson for string;

    uint256 internal constant SEPOLIA = 11155111;
    uint256 internal constant TIMELOCK_DELAY = 90;
    uint256 internal constant VOTING_DELAY = 1;
    uint256 internal constant VOTING_PERIOD = 8;
    uint256 internal constant FR_KEY = uint256(keccak256("TTG_V8_SEPOLIA_FR_BUYER_V1"));
    uint256 internal constant RETAIL_KEY = uint256(keccak256("TTG_V8_SEPOLIA_RETAIL_BUYER_V1"));

    string internal constant ADDR_PATH = "out-ttg-v8/v8-sepolia-rehearsal.json";
    string internal constant EVIDENCE_PATH = "../evidence/GO_ttg_v8_sepolia_rehearsal/v8-sepolia-rehearsal.json";

    error NotSepolia();
    error Invariant();

    struct Core {
        TtgMemeDenomOpsWallet teamWallet;
        TtgMemeDenomGovernor gov;
        TtgMemeDenomGovernanceToken ttg;
        TtgMemeDenomPrimaryMarket pm;
        TtgMemeDenomTimelock timelock;
        TtgMemeDenomRehearsalUsdc usdc;
    }

    modifier sepoliaOnly() {
        if (block.chainid != SEPOLIA) revert NotSepolia();
        _;
    }

    function deployCore() external sepoliaOnly {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address fr = vm.addr(FR_KEY);
        address retail = vm.addr(RETAIL_KEY);
        (, uint256 frUsdc,) = _amounts();

        vm.startBroadcast(pk);
        TtgMemeDenomOpsWallet teamWallet = new TtgMemeDenomOpsWallet(deployer);
        TtgMemeDenomOpsWallet daoWallet = new TtgMemeDenomOpsWallet(deployer);
        TtgMemeDenomRehearsalUsdc usdc = new TtgMemeDenomRehearsalUsdc(deployer);
        TtgMemeDenomGovernanceToken ttg =
            new TtgMemeDenomGovernanceToken(address(teamWallet), address(daoWallet), deployer);
        if (ttg.totalSupply() != TtgMemeDenomConstants.TTG_TOTAL_SUPPLY_UNITS) revert Invariant();
        if (ttg.balanceOf(address(teamWallet)) != TtgMemeDenomConstants.TEAM_TTG) revert Invariant();
        if (ttg.balanceOf(address(daoWallet)) != TtgMemeDenomConstants.DAO_TREASURY_TTG) revert Invariant();
        if (ttg.balanceOf(deployer) != TtgMemeDenomConstants.PUBLIC_SALE_TTG) revert Invariant();

        TtgMemeDenomPrimaryMarket pm = new TtgMemeDenomPrimaryMarket(
            address(usdc), address(ttg), deployer, TtgMemeDenomConstants.TTG_PER_USDC_UNIT
        );
        if (pm.minPurchaseUsdc() != 1e6) revert Invariant();
        if (pm.quoteTtg(1e6) != 100_000 ether) revert Invariant();
        ttg.transfer(address(pm), TtgMemeDenomConstants.PUBLIC_SALE_TTG);

        TtgMemeDenomTimelock timelock = new TtgMemeDenomTimelock(deployer, TIMELOCK_DELAY);
        TtgMemeDenomGovernor gov = new TtgMemeDenomGovernor(
            ITtgMemeDenomVotes(address(ttg)),
            ITtgMemeDenomTimelock(address(timelock)),
            VOTING_DELAY,
            VOTING_PERIOD,
            0,
            TtgMemeDenomConstants.GOVERNANCE_QUORUM_BPS,
            0,
            14
        );
        timelock.setGovernor(address(gov));

        (bool okFr,) = fr.call{value: 0.04 ether}("");
        (bool okRetail,) = retail.call{value: 0.03 ether}("");
        if (!okFr || !okRetail) revert Invariant();
        usdc.issue(fr, frUsdc);
        usdc.issue(retail, 1e6);
        vm.stopBroadcast();

        _writeGenesis(
            deployer,
            address(teamWallet),
            address(daoWallet),
            address(usdc),
            address(ttg),
            address(pm),
            address(timelock),
            address(gov),
            fr,
            retail
        );
    }

    function buyFrance() external sepoliaOnly {
        Core memory c = _core();
        (, uint256 frUsdc,) = _amounts();
        vm.startBroadcast(FR_KEY);
        c.usdc.approve(address(c.pm), type(uint256).max);
        c.pm.purchase(0, frUsdc);
        vm.stopBroadcast();
    }

    function buyRetail() external sepoliaOnly {
        Core memory c = _core();
        vm.startBroadcast(RETAIL_KEY);
        c.usdc.approve(address(c.pm), type(uint256).max);
        c.pm.purchase(0, 1e6);
        vm.stopBroadcast();
    }

    function assertFusion() external view sepoliaOnly {
        Core memory c = _core();
        string memory json = vm.readFile(ADDR_PATH);
        address fr = json.readAddress(".france");
        address retail = json.readAddress(".retail");
        (uint256 frMin,,) = _amounts();
        if (c.pm.minPurchaseUsdc() != 1e6) revert Invariant();
        if (c.pm.quoteTtg(1e6) != 100_000 ether) revert Invariant();
        if (c.pm.walletPurchasedTtg(fr) != frMin) revert Invariant();
        if (c.ttg.balanceOf(fr) != frMin) revert Invariant();
        if (c.pm.walletPurchasedTtg(retail) != 100_000 ether) revert Invariant();
        if (c.ttg.balanceOf(retail) != 100_000 ether) revert Invariant();
    }

    function _amounts() internal pure returns (uint256 frMin, uint256 frUsdc, uint256 retailUsdc) {
        frMin = TtgMemeDenomStewardMinimums.minStake(bytes2("FR"));
        frUsdc = (frMin * 1e6) / TtgMemeDenomConstants.TTG_PER_USDC_UNIT;
        retailUsdc = 1e6;
    }

    function proposeLive() external sepoliaOnly {
        Core memory c = _core();
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = _dummy(c.gov);
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        bytes memory ret = c.teamWallet.exec(
            address(c.gov),
            0,
            abi.encodeWithSignature(
                "propose(address[],uint256[],bytes[],string)", targets, values, calldatas, "fusion live quorum france"
            )
        );
        vm.stopBroadcast();
        uint256 pid = abi.decode(ret, (uint256));
        (,, uint256 voteStart, uint256 voteEnd,,,,,,) = c.gov.proposals(pid);
        _patchUint("liveProposalId", pid);
        _patchUint("liveVoteStart", voteStart);
        _patchUint("liveVoteEnd", voteEnd);
    }

    function voteFranceSequence() external sepoliaOnly {
        Core memory c = _core();
        uint256 pid = _readUint("liveProposalId");
        vm.startBroadcast(FR_KEY);
        c.gov.castVote(pid, 1);
        vm.stopBroadcast();
        if (!c.gov.quorumReached(pid)) revert Invariant();
    }

    function queueLive() external sepoliaOnly {
        Core memory c = _core();
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        bytes32 opId = c.gov.queue(_readUint("liveProposalId"));
        vm.stopBroadcast();
        _patchBytes32("liveQueuedOpId", opId);
    }

    function executeLive() external sepoliaOnly {
        Core memory c = _core();
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        c.gov.execute(_readUint("liveProposalId"));
        vm.stopBroadcast();
        if (c.gov.orderRatingReviewWindowDays() != 21) revert Invariant();
    }

    function _core() internal view returns (Core memory c) {
        (c.teamWallet, c.gov, c.ttg, c.pm, c.timelock, c.usdc) = _loadCore();
    }

    function _dummy(TtgMemeDenomGovernor gov)
        internal
        pure
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
    {
        targets = new address[](1);
        targets[0] = address(gov);
        values = new uint256[](1);
        calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(TtgMemeDenomGovernor.setOrderRatingReviewWindowDays.selector, 21);
    }

    function _writeGenesis(
        address deployer,
        address teamWallet,
        address daoWallet,
        address usdc,
        address ttg,
        address pm,
        address timelock,
        address gov,
        address fr,
        address retail
    ) internal {
        string memory json = string.concat(
            '{"chainId":11155111,',
            '"candidateId":"TTG-25T-BPS-SEAT-FIXED-SUPPLY-CANDIDATE-V8",',
            '"compilerTarget":"0.8.26",',
            '"fusionAligned":true,',
            '"minPurchaseUsdc":"1e6",',
            '"migratorDeployed":false,',
            '"deployer":"',
            vm.toString(deployer),
            '","teamWallet":"',
            vm.toString(teamWallet),
            '","daoWallet":"',
            vm.toString(daoWallet),
            '","usdc":"',
            vm.toString(usdc),
            '","token":"',
            vm.toString(ttg),
            '","primaryMarket":"',
            vm.toString(pm),
            '","timelock":"',
            vm.toString(timelock),
            '","governor":"',
            vm.toString(gov),
            '","france":"',
            vm.toString(fr),
            '","retail":"',
            vm.toString(retail),
            '","liveProposalId":0,"liveVoteStart":0,"liveVoteEnd":0,',
            '"liveQueuedOpId":"0x0000000000000000000000000000000000000000000000000000000000000000"}'
        );
        vm.writeFile(ADDR_PATH, json);
        vm.writeFile(EVIDENCE_PATH, json);
    }

    function _loadCore()
        internal
        view
        returns (
            TtgMemeDenomOpsWallet teamWallet,
            TtgMemeDenomGovernor gov,
            TtgMemeDenomGovernanceToken ttg,
            TtgMemeDenomPrimaryMarket pm,
            TtgMemeDenomTimelock timelock,
            TtgMemeDenomRehearsalUsdc usdc
        )
    {
        string memory json = vm.readFile(ADDR_PATH);
        teamWallet = TtgMemeDenomOpsWallet(payable(json.readAddress(".teamWallet")));
        gov = TtgMemeDenomGovernor(json.readAddress(".governor"));
        ttg = TtgMemeDenomGovernanceToken(json.readAddress(".token"));
        pm = TtgMemeDenomPrimaryMarket(json.readAddress(".primaryMarket"));
        timelock = TtgMemeDenomTimelock(json.readAddress(".timelock"));
        usdc = TtgMemeDenomRehearsalUsdc(json.readAddress(".usdc"));
    }

    function _readUint(string memory key) internal view returns (uint256) {
        return vm.readFile(ADDR_PATH).readUint(string.concat(".", key));
    }

    function _patchUint(string memory key, uint256 value) internal {
        string memory path = string.concat(".", key);
        vm.writeJson(vm.toString(value), ADDR_PATH, path);
        vm.writeJson(vm.toString(value), EVIDENCE_PATH, path);
    }

    function _patchBytes32(string memory key, bytes32 value) internal {
        string memory path = string.concat(".", key);
        vm.writeJson(vm.toString(value), ADDR_PATH, path);
        vm.writeJson(vm.toString(value), EVIDENCE_PATH, path);
    }
}
