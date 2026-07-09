// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Phase2ControlPlane.sol";
import "../src/GovernanceTreasuryP4Cap.sol";
import "../src/TtgPrimaryMarketV1.sol";
import "../src/TtgSeatConcentrationRegistry.sol";
import "../src/TtgGovFreezeConstants.sol";

/**
 * @title DeployTtgGovFreezeEnforcement
 * @notice Gate-2.4 · **TTG-TOKENOMICS-FREEZE-V1** GOV-01～04  enforcement 部署（序 1.5 · 治理栈之后）
 * @dev **Required env:** `PRIVATE_KEY` · `TIMELOCK_ADDRESS` · `GOVERNANCE_TOKEN_ADDRESS` · `USDC_TOKEN_ADDRESS`
 *      **Optional:** `TREASURY_USDC_RESERVE_ADDRESS`（默认同 `TREASURY_ADDRESS` 或新建 P4Cap 实例）
 *      **Optional:** `TTG_PER_USDC_UNIT`（默认 1e18 · 测试网定价 · 修订须 GOV-02）
 */
contract DeployTtgGovFreezeEnforcement is Phase2ControlPlane {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address timelock = vm.envAddress("TIMELOCK_ADDRESS");
        address ttg = vm.envAddress("GOVERNANCE_TOKEN_ADDRESS");
        address usdc = vm.envAddress("USDC_TOKEN_ADDRESS");
        address treasuryOwner = timelock;
        address usdcSink = vm.envOr("TREASURY_USDC_SINK_ADDRESS", timelock);
        uint256 ttgPerUsdc = vm.envOr("TTG_PRIMARY_MARKET_TTG_PER_USDC_UNIT", uint256(1 ether));

        vm.startBroadcast(pk);

        GovernanceTreasuryP4Cap treasuryP4 =
            new GovernanceTreasuryP4Cap(treasuryOwner, timelock, usdc);
        TtgPrimaryMarketV1 primaryMarket = new TtgPrimaryMarketV1(usdc, ttg, usdcSink, ttgPerUsdc);
        TtgSeatConcentrationRegistry seatRegistry = new TtgSeatConcentrationRegistry(treasuryOwner, address(0));

        vm.stopBroadcast();

        console.log("--- DeployTtgGovFreezeEnforcement (TTG-TOKENOMICS-FREEZE-V1) ---");
        console.log("freeze_doc", TtgGovFreezeConstants.freezeDocumentId());
        console.log("GovernanceTreasuryP4Cap", address(treasuryP4));
        console.log("TtgPrimaryMarketV1", address(primaryMarket));
        console.log("TtgSeatConcentrationRegistry", address(seatRegistry));
        console.log("treasury_p4_deploy_cap_bps", treasuryP4.treasuryP4DeployCapBps());
        console.log("per_wallet_cap_ttg", primaryMarket.perWalletCapTtg());
    }
}
