// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Script, console2} from "forge-std/Script.sol";
import {TtgV9SoloTimelock} from "./TtgV9SoloTimelock.sol";
import {TtgV9ProjectPoolV2} from "./TtgV9ProjectPoolV2.sol";
import {TtgV9CountryFeeRouter} from "./TtgV9CountryFeeRouter.sol";
import {TtgV9ERC1967Proxy} from "./TtgV9ERC1967Proxy.sol";
import {MockV9Erc20} from "./mocks/MockV9Erc20.sol";

/**
 * @title TtgV9ProjectPoolV2SepoliaRehearsal
 * @notice ② Sepolia-only deploy: SoloTimelock + UUPS ProjectPoolV2 + FeeRouter → V2.
 * @dev Does not touch Mainnet Phase1 addresses. Not TT_PRODUCTION_GO.
 *      Primary Market sink rehearsed as direct USDC credit to V2 (sale treasury stand-in).
 */
contract TtgV9ProjectPoolV2SepoliaRehearsal is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        require(block.chainid == 11155111, "SEPOLIA_ONLY");

        uint256 delaySec = 90;
        try vm.envUint("TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS") returns (uint256 d) {
            if (d > 0 && d < 3600) delaySec = d;
        } catch {}

        vm.startBroadcast(pk);

        TtgV9SoloTimelock timelock = new TtgV9SoloTimelock(deployer, delaySec);
        MockV9Erc20 usdc = new MockV9Erc20("USD Coin", "USDC", 6);

        TtgV9ProjectPoolV2 impl = new TtgV9ProjectPoolV2();
        bytes memory initData = abi.encodeCall(
            TtgV9ProjectPoolV2.initialize, (address(timelock), address(timelock), address(usdc), 3_000)
        );
        TtgV9ProjectPoolV2 pool =
            TtgV9ProjectPoolV2(address(new TtgV9ERC1967Proxy(address(impl), initData)));

        TtgV9CountryFeeRouter feeRouter = new TtgV9CountryFeeRouter(address(timelock), address(pool));

        timelock.setAllowedExecutionTarget(address(pool), true);
        timelock.setAllowedExecutionTarget(address(feeRouter), true);

        // Authorize deployer as fee ingress (Escrow stand-in); Timelock owns FeeRouter.
        bytes32 idCaller = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouter.setFeeRouterCaller, (deployer, true)),
            bytes32(uint256(101))
        );

        // Simulate Primary Market sale proceeds → ProjectPoolV2
        usdc.mint(address(pool), 500_000e6);
        // Simulate platform fee held on FeeRouter then routed 100% to pool (no steward)
        usdc.mint(address(feeRouter), 100_000e6);

        // Spare USDC for later drills
        usdc.mint(deployer, 50_000e6);

        vm.stopBroadcast();

        console2.log("SEPOLIA_CHAIN_ID", block.chainid);
        console2.log("DEPLOYER", deployer);
        console2.log("TIMELOCK", address(timelock));
        console2.log("USDC", address(usdc));
        console2.log("POOL_V2_IMPL", address(impl));
        console2.log("POOL_V2_PROXY", address(pool));
        console2.log("FEE_ROUTER", address(feeRouter));
        console2.log("TIMELOCK_DELAY", delaySec);
        console2.log("SCHEDULE_SET_CALLER_ID");
        console2.logBytes32(idCaller);
        console2.log("POOL_CAP_BPS", pool.capBps());
        console2.log("POOL_OWNER", pool.owner());
        console2.log("POOL_SPENDER", pool.spender());
    }
}
