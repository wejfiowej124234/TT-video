// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Script, console2} from "forge-std/Script.sol";
import {TtgV9DeployTopology} from "./TtgV9DeployTopology.sol";
import {TtgV9AtomicDeployer} from "./TtgV9AtomicDeployer.sol";
import {TtgPublicSaleVault} from "./TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "./TtgBatchPrimaryMarket.sol";
import {TravelTrustGovernanceTokenV9} from "./TravelTrustGovernanceTokenV9.sol";
import {TravelTrustGovernorV9, ITtgV9GovernanceVotes, ITtgV9GovernanceTimelock} from "./TravelTrustGovernorV9.sol";
import {TtgV9GovernanceParams} from "./TtgV9GovernanceParams.sol";
import {MockV9Erc20} from "./mocks/MockV9Erc20.sol";
import {MockV9Timelock} from "./mocks/MockV9Timelock.sol";
import {TtgPublicSaleVaultV2Harness} from "./mocks/TtgPublicSaleVaultV2Harness.sol";
import {TtgBatchPrimaryMarketV2Harness} from "./mocks/TtgBatchPrimaryMarketV2Harness.sol";

/**
 * @title TtgV9RemintSepoliaRehearsal
 * @notice ② Sepolia Final Norm remint deploy: real TokenV9 + UUPS Vault/PM + GovernorV9 + MockTimelock.
 * @dev KEEP Mainnet Money Path untouched. Mock USDC + MockTimelock are Sepolia-only.
 *      Ops wallets default to deployer (voting drill); Mainnet Norm pins remain separate.
 *      Timelock delay from env TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS (default 90; Norm KEEP = 48h).
 *      Stack via TtgV9AtomicDeployer (same-tx init — closes RT2-OPEN-01).
 *      Not Mainnet. Not Production GO.
 */
contract TtgV9RemintSepoliaRehearsal is Script {
    /// @dev Official KEEP P4Cap (USDC sink address used on Sepolia with mock USDC).
    address internal constant KEEP_P4CAP = 0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF;
    uint64 internal constant WINDOW = 300;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        require(block.chainid == 11155111, "SEPOLIA_ONLY");

        uint256 delaySec = 90;
        try vm.envUint("TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS") returns (uint256 d) {
            if (d > 0) delaySec = d;
        } catch {}

        // Sepolia voting drill: deployer holds 3+5+7 genesis so propose/vote works without ops keys.
        address team = deployer;
        address marketing = deployer;
        address treasury = deployer;
        address guardian = deployer;

        vm.startBroadcast(pk);

        MockV9Timelock timelock = new MockV9Timelock(deployer, delaySec);
        MockV9Erc20 usdc = new MockV9Erc20("USD Coin", "USDC", 6);

        TtgV9AtomicDeployer atomic = new TtgV9AtomicDeployer(
            address(usdc), KEEP_P4CAP, address(timelock), guardian, team, marketing, treasury
        );
        TtgV9DeployTopology.Bundle memory b;
        b.token = TravelTrustGovernanceTokenV9(atomic.token());
        b.vault = TtgPublicSaleVault(payable(atomic.vault()));
        b.market = TtgBatchPrimaryMarket(payable(atomic.market()));
        b.governor = TravelTrustGovernorV9(atomic.governor());
        b.vaultImpl = atomic.vaultImpl();
        b.marketImpl = atomic.marketImpl();

        // Legacy governor stand-in for G6 cutover (set then replaced).
        TravelTrustGovernorV9 legacyGov = new TravelTrustGovernorV9(
            ITtgV9GovernanceVotes(address(b.token)),
            ITtgV9GovernanceTimelock(address(timelock)),
            TtgV9GovernanceParams.VOTING_DELAY_BLOCKS_LOCAL,
            TtgV9GovernanceParams.VOTING_PERIOD_BLOCKS_LOCAL,
            TtgV9GovernanceParams.PROPOSAL_THRESHOLD_VOTES_FLOOR,
            TtgV9GovernanceParams.QUORUM_NUMERATOR_BPS,
            TtgV9GovernanceParams.MAX_VOTING_POWER_PER_ADDRESS_BPS,
            TtgV9GovernanceParams.ORDER_RATING_REVIEW_WINDOW_DAYS
        );

        timelock.setGovernor(address(legacyGov));
        timelock.setAllowedExecutionTarget(address(b.vault), true);
        timelock.setAllowedExecutionTarget(address(b.market), true);
        timelock.setAllowedExecutionTarget(address(b.governor), true);

        timelock.bootstrapCall(address(b.vault), abi.encodeCall(TtgPublicSaleVault.bindMarket, (address(b.market))));

        uint64 start = uint64(block.timestamp + 1200); // 20m lead — forge --slow broadcast can exceed short leads
        timelock.bootstrapCall(
            address(b.market), abi.encodeCall(TtgBatchPrimaryMarket.seedBatchesRehearsal, (start, WINDOW))
        );

        // G6 cutover: replace legacy governor with Official V9 Governor.
        timelock.setGovernor(address(b.governor));
        timelock.endBootstrap();

        usdc.mint(deployer, 50_000e6);
        usdc.approve(address(b.market), type(uint256).max);

        // Pre-deploy UUPS v2 harnesses for authorized upgrade drill (inventory preserved).
        TtgPublicSaleVaultV2Harness vaultV2 = new TtgPublicSaleVaultV2Harness();
        TtgBatchPrimaryMarketV2Harness marketV2 = new TtgBatchPrimaryMarketV2Harness();

        // Foreign token for rescue drill.
        MockV9Erc20 junk = new MockV9Erc20("Junk", "JUNK", 18);
        junk.mint(address(b.vault), 1_000 ether);
        junk.mint(address(b.market), 1_000 ether);

        vm.stopBroadcast();

        console2.log("TTG_V9_REMINT_SEPOLIA_DEPLOY");
        console2.log("deployer", deployer);
        console2.log("timelock", address(timelock));
        console2.log("timelockDelay", delaySec);
        console2.log("usdc", address(usdc));
        console2.log("ttg", address(b.token));
        console2.log("vault", address(b.vault));
        console2.log("market", address(b.market));
        console2.log("governor", address(b.governor));
        console2.log("legacyGovernor", address(legacyGov));
        console2.log("p4capKeep", KEEP_P4CAP);
        console2.log("vaultImpl", b.vaultImpl);
        console2.log("marketImpl", b.marketImpl);
        console2.log("vaultV2", address(vaultV2));
        console2.log("marketV2", address(marketV2));
        console2.log("junk", address(junk));
        console2.log("batch1Start", start);
        console2.log("window", WINDOW);
        console2.log("opsMode", "SEPOLIA_DEPLOYER_TRIPLE_ALIAS");
    }
}
