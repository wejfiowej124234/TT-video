// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Script, console2} from "forge-std/Script.sol";
import {TtgPublicSaleVault} from "./TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "./TtgBatchPrimaryMarket.sol";
import {TtgV9ERC1967Proxy} from "./TtgV9ERC1967Proxy.sol";
import {MockV9Erc20} from "./mocks/MockV9Erc20.sol";

/**
 * @title TtgV9SepoliaRehearsal
 * @notice ② Sepolia-only deploy + short-window drill. Not Mainnet. Not Production GO.
 * @dev Compile-ready UUPS path. Do not run without Owner Sepolia auth after V9_REMINT_LOCAL_PASS.
 */
contract TtgV9SepoliaRehearsal is Script {
    uint256 internal constant PUBLIC_INVENTORY = 12_500_000_000_000 ether;
    uint64 internal constant WINDOW = 480;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        require(block.chainid == 11155111, "SEPOLIA_ONLY");

        vm.startBroadcast(pk);

        MockV9Erc20 usdc = new MockV9Erc20("USD Coin", "USDC", 6);
        MockV9Erc20 ttg = new MockV9Erc20("TravelTrust Governance", "TTG", 18);
        address testP4Cap = address(uint160(uint256(keccak256("TTG_V9_SEPOLIA_TEST_P4CAP"))));

        TtgPublicSaleVault vaultImpl = new TtgPublicSaleVault();
        bytes memory vaultInit = abi.encodeCall(TtgPublicSaleVault.initialize, (address(ttg), deployer));
        TtgPublicSaleVault vault =
            TtgPublicSaleVault(payable(address(new TtgV9ERC1967Proxy(address(vaultImpl), vaultInit))));

        TtgBatchPrimaryMarket marketImpl = new TtgBatchPrimaryMarket();
        bytes memory marketInit = abi.encodeCall(
            TtgBatchPrimaryMarket.initialize,
            (address(usdc), address(ttg), testP4Cap, address(vault), deployer, deployer)
        );
        TtgBatchPrimaryMarket market =
            TtgBatchPrimaryMarket(payable(address(new TtgV9ERC1967Proxy(address(marketImpl), marketInit))));

        vault.bindMarket(address(market));

        ttg.mint(address(vault), PUBLIC_INVENTORY);
        usdc.mint(deployer, 10_000e6);
        usdc.approve(address(market), type(uint256).max);

        uint64 start = uint64(block.timestamp + 45);
        market.seedBatchesRehearsal(start, WINDOW);

        vm.stopBroadcast();

        console2.log("TTG_V9_SEPOLIA_DEPLOY");
        console2.log("deployer", deployer);
        console2.log("usdc", address(usdc));
        console2.log("ttg", address(ttg));
        console2.log("vault", address(vault));
        console2.log("market", address(market));
        console2.log("testP4Cap", testP4Cap);
        console2.log("batch1Start", start);
        console2.log("window", WINDOW);
    }
}
