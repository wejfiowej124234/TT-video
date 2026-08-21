// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {TtgV9ERC1967Proxy} from "./TtgV9ERC1967Proxy.sol";
import {TtgPublicSaleVault} from "./TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "./TtgBatchPrimaryMarket.sol";
import {TravelTrustGovernanceTokenV9} from "./TravelTrustGovernanceTokenV9.sol";
import {
    TravelTrustGovernorV9,
    ITtgV9GovernanceVotes,
    ITtgV9GovernanceTimelock
} from "./TravelTrustGovernorV9.sol";
import {TtgV9GovernanceParams} from "./TtgV9GovernanceParams.sol";

/**
 * @title TtgV9DeployTopology
 * @notice G7 fixed deploy order — no Owner EOA bridge for public 12.5T (English NatSpec only).
 * @dev ① local / ② Sepolia helper. Mainnet Timelock/P4Cap are KEEP addresses passed in.
 *      Official entry: `TtgV9AtomicDeployer` (constructor = one tx). Never leave Vault proxy
 *      empty-init across transactions — Red-Team RT2-OPEN-01.
 */
library TtgV9DeployTopology {
    struct Bundle {
        TravelTrustGovernanceTokenV9 token;
        TtgPublicSaleVault vault;
        TtgBatchPrimaryMarket market;
        TravelTrustGovernorV9 governor;
        address vaultImpl;
        address marketImpl;
    }

    error InvalidAddress();
    error InvalidGovernorParams();

    /**
     * @dev Order: vault proxy → token credits vault → vault.initialize → PM proxy → Governor.
     *      Caller must Timelock.bindMarket + setGovernor + allow-list (no EOA bridge).
     *      ①/② helper: LOCAL Governor windows. Mainnet: `deployWithGovernorParams` / AtomicDeployerMainnet.
     */
    function deploy(
        address usdc,
        address usdcTreasuryP4Cap,
        address timelock,
        address guardian,
        address team,
        address marketing,
        address treasury
    ) internal returns (Bundle memory b) {
        return deployWithGovernorParams(
            usdc,
            usdcTreasuryP4Cap,
            timelock,
            guardian,
            team,
            marketing,
            treasury,
            TtgV9GovernanceParams.VOTING_DELAY_BLOCKS_LOCAL,
            TtgV9GovernanceParams.VOTING_PERIOD_BLOCKS_LOCAL
        );
    }

    /// @notice Official Mainnet path: pass production voting delay/period (not LOCAL 1/10).
    function deployWithGovernorParams(
        address usdc,
        address usdcTreasuryP4Cap,
        address timelock,
        address guardian,
        address team,
        address marketing,
        address treasury,
        uint256 votingDelayBlocks,
        uint256 votingPeriodBlocks
    ) internal returns (Bundle memory b) {
        if (
            usdc == address(0) || usdcTreasuryP4Cap == address(0) || timelock == address(0)
                || guardian == address(0) || team == address(0) || marketing == address(0) || treasury == address(0)
        ) {
            revert InvalidAddress();
        }
        if (votingDelayBlocks == 0 || votingPeriodBlocks == 0) revert InvalidGovernorParams();

        TtgPublicSaleVault vaultImpl = new TtgPublicSaleVault();
        b.vaultImpl = address(vaultImpl);
        // Empty initData is safe ONLY while proxy create → token → initialize stay in this same call
        // (library used from AtomicDeployer constructor or a single broadcast `run`). Across txs = rug.
        b.vault = TtgPublicSaleVault(payable(address(new TtgV9ERC1967Proxy(address(vaultImpl), ""))));

        b.token = new TravelTrustGovernanceTokenV9(address(b.vault), timelock, team, marketing, treasury);
        b.vault.initialize(address(b.token), timelock);

        TtgBatchPrimaryMarket marketImpl = new TtgBatchPrimaryMarket();
        b.marketImpl = address(marketImpl);
        bytes memory marketInit = abi.encodeCall(
            TtgBatchPrimaryMarket.initialize,
            (usdc, address(b.token), usdcTreasuryP4Cap, address(b.vault), timelock, guardian)
        );
        b.market =
            TtgBatchPrimaryMarket(payable(address(new TtgV9ERC1967Proxy(address(marketImpl), marketInit))));

        b.governor = new TravelTrustGovernorV9(
            ITtgV9GovernanceVotes(address(b.token)),
            ITtgV9GovernanceTimelock(timelock),
            votingDelayBlocks,
            votingPeriodBlocks,
            TtgV9GovernanceParams.PROPOSAL_THRESHOLD_VOTES_FLOOR,
            TtgV9GovernanceParams.QUORUM_NUMERATOR_BPS,
            TtgV9GovernanceParams.MAX_VOTING_POWER_PER_ADDRESS_BPS,
            TtgV9GovernanceParams.ORDER_RATING_REVIEW_WINDOW_DAYS
        );
    }
}
