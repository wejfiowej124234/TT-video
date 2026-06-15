// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "./Phase2ControlPlane.sol";
import "../src/CountryPoolNetProfitLedger.sol";
import "../src/StewardPathVault.sol";
import "../src/UnallocatedStewardPathVault.sol";
import "../src/MockERC20.sol";

/**
 * D-4555-B · DR-06 Triplet bundle deploy (Anvil / ② testnet).
 *
 * Env:
 *   PRIVATE_KEY
 *   TIMELOCK_ADDRESS (required off Anvil)
 *   SETTLEMENT_JURISDICTION — default DE
 *   SETTLEMENT_TOKEN_ADDRESS — default new MockERC20 on Anvil
 *   GLOBAL_TREASURY_ADDRESS — default TIMELOCK
 *   STEWARD_STAKE_POOL_ADDRESS — required
 *   SETTLEMENT_CLOSE_DELAY_SECONDS — default 15 days
 */
contract DeployCountryPoolNetProfitStack is Phase2ControlPlane {
    function _jid(string memory s) internal pure returns (bytes2) {
        bytes memory b = bytes(s);
        return bytes2((uint16(uint8(b[0])) << 8) | uint8(b[1]));
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }

        bytes2 jurisdiction = _jid(vm.envOr("SETTLEMENT_JURISDICTION", string("DE")));
        address timelockAddr = vm.envOr("TIMELOCK_ADDRESS", address(0));
        if (!_isLocalAnvil() && timelockAddr == address(0)) revert Phase2TimelockRequired();

        address stackOwner = resolveChainOwner(vm.addr(deployerPrivateKey));
        address stakePool = vm.envOr("STEWARD_STAKE_POOL_ADDRESS", address(0));
        if (stakePool == address(0)) revert("STEWARD_STAKE_POOL_ADDRESS required");

        address tokenAddr = vm.envOr("SETTLEMENT_TOKEN_ADDRESS", address(0));
        address treasury = vm.envOr("GLOBAL_TREASURY_ADDRESS", address(0));
        if (treasury == address(0)) {
            treasury = _isLocalAnvil() ? stackOwner : timelockAddr;
        }
        if (treasury == address(0)) revert("GLOBAL_TREASURY_ADDRESS required");
        uint64 closeDelay = uint64(vm.envOr("SETTLEMENT_CLOSE_DELAY_SECONDS", uint256(15 days)));

        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);
        bool deployToken = tokenAddr == address(0);
        uint256 n = vm.getNonce(deployer);
        address predictedLedger = vm.computeCreateAddress(deployer, n + (deployToken ? 3 : 2));

        if (deployToken) {
            tokenAddr = address(new MockERC20());
        }

        StewardPathVault stewardVault =
            new StewardPathVault(stackOwner, jurisdiction, tokenAddr, predictedLedger);
        UnallocatedStewardPathVault unallocVault = new UnallocatedStewardPathVault(
            stackOwner, jurisdiction, tokenAddr, predictedLedger, address(stewardVault)
        );
        CountryPoolNetProfitLedger ledger = new CountryPoolNetProfitLedger(
            stackOwner,
            jurisdiction,
            tokenAddr,
            address(stewardVault),
            address(unallocVault),
            treasury,
            stakePool,
            closeDelay,
            4500,
            5500
        );

        vm.stopBroadcast();

        require(address(ledger) == predictedLedger, "ledger address prediction failed");

        console.log("--- DeployCountryPoolNetProfitStack (D-4555-B DR-06) ---");
        console.log("COUNTRY_POOL_NET_PROFIT_LEDGER", address(ledger));
        console.log("COUNTRY_POOL_STEWARD_PATH_VAULT", address(stewardVault));
        console.log("COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT", address(unallocVault));
        console.log("SETTLEMENT_TOKEN", tokenAddr);
        console.log("ledger_version", ledger.version());
    }
}
