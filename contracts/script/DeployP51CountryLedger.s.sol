// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/CountryPoolLedgerV0.sol";

/**
 * P5-1-A：**独立**部署 **CountryPoolLedgerV0**（**不**改 **`Deploy.s.sol`** / **B-115/B-116**）。
 * 用法：`forge script script/DeployP51CountryLedger.s.sol --rpc-url <RPC> --broadcast`
 * 环境（可选）：
 *   - PRIVATE_KEY（默认 anvil #0）
 *   - PILOT_JURISDICTION_HEX：试点 **bytes2** 十六进制，如 **DE** = `0x4445`；缺省 **0x4445**
 */
contract DeployP51CountryLedgerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }
        vm.startBroadcast(deployerPrivateKey);
        address deployer = vm.addr(deployerPrivateKey);

        bytes2 pilot = bytes2(uint16(uint256(vm.envOr("PILOT_JURISDICTION_HEX", uint256(0x4445)))));
        // 0x4445 = 'D'<<8 | 'E' = **DE**

        CountryPoolLedgerV0 ledger = new CountryPoolLedgerV0(deployer, pilot);
        console.log("CountryPoolLedgerV0", address(ledger));
        console.log("pilot_jurisdiction_hex");
        console.logBytes2(pilot);
        console.log("version", ledger.version());

        vm.stopBroadcast();
    }
}
