// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;



import "forge-std/Script.sol";

import "./Phase2ControlPlane.sol";

import "../src/CountryPoolLedgerV0.sol";



/**

 * P5-1-A：**独立**部署 **CountryPoolLedgerV0**（**不**改 **`Deploy.s.sol`** / **B-115/B-116**）。

 * 用法：`forge script script/DeployP51CountryLedger.s.sol --rpc-url <RPC> --broadcast`

 * 环境（可选）：

 *   - PRIVATE_KEY（默认 anvil #0）

 *   - PILOT_JURISDICTION_HEX：试点 **bytes2** 十六进制，如 **DE** = `0x4445`；缺省 **0x4445**

 *   - TIMELOCK_ADDRESS：② Sepolia 必填 · ledger owner（R-02）

 */

contract DeployP51CountryLedgerScript is Phase2ControlPlane {

    function run() external {

        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));

        if (deployerPrivateKey == 0) {

            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        }



        bytes2 pilot = bytes2(uint16(uint256(vm.envOr("PILOT_JURISDICTION_HEX", uint256(0x4445)))));

        // 0x4445 = 'D'<<8 | 'E' = **DE**



        address deployer = vm.addr(deployerPrivateKey);

        address timelockAddr = vm.envOr("TIMELOCK_ADDRESS", address(0));

        if (!_isLocalAnvil() && timelockAddr == address(0)) {

            revert Phase2TimelockRequired();

        }



        address ledgerOwner = resolveChainOwner(deployer);



        vm.startBroadcast(deployerPrivateKey);



        CountryPoolLedgerV0 ledger = new CountryPoolLedgerV0(ledgerOwner, pilot);



        vm.stopBroadcast();



        console.log("--- DeployP51CountryLedger (P5-1-A protocol convergence seq 5) ---");

        console.log("deployer", deployer);

        console.log("TIMELOCK", timelockAddr);

        console.log("ledger_owner", ledgerOwner);

        console.log("ledger_owner_is_timelock", ledgerOwner == timelockAddr);

        console.log("ledger_owner_not_deployer", ledgerOwner != deployer);

        console.log("COUNTRY_POOL_LEDGER_PILOT", address(ledger));

        console.log("pilot_jurisdiction_hex");

        console.logBytes2(pilot);

        console.log("version", ledger.version());

        _logLedgerBindings(deployer, timelockAddr, pilot, ledger);

        _assertLedgerBindings(deployer, ledgerOwner, timelockAddr, pilot, ledger);

        console.log("LEDGER_BINDING_CHECK: OK");

    }



    function _logLedgerBindings(
        address deployer,
        address timelockAddr,
        bytes2 pilot,
        CountryPoolLedgerV0 ledger
    ) internal view {

        console.log("BINDING ledger.owner", ledger.owner());

        console.log("BINDING ledger.owner_is_timelock", ledger.owner() == timelockAddr);

        console.log("BINDING ledger.owner_not_deployer", ledger.owner() != deployer);

        console.log("BINDING ledger.pilot_jurisdiction", uint256(uint16(pilot)));

        console.log("BINDING ledger.version", ledger.version());

    }



    function _assertLedgerBindings(

        address deployer,

        address ledgerOwner,

        address timelockAddr,

        bytes2 pilot,

        CountryPoolLedgerV0 ledger

    ) internal view {

        require(ledger.owner() == ledgerOwner, "Ledger: owner!=ledgerOwner");

        require(ledgerOwner != deployer, "Ledger: owner must not be deployer EOA");

        if (!_isLocalAnvil()) {

            require(timelockAddr != address(0), "Ledger: TIMELOCK_ADDRESS required");

            require(ledgerOwner == timelockAddr, "Ledger: ledgerOwner!=Timelock");

        }

        require(ledger.pilotJurisdiction() == pilot, "Ledger: pilotJurisdiction mismatch");

        require(uint16(pilot) == uint16(0x4445), "Ledger: SSOT pilot!=DE");

        require(

            keccak256(bytes(ledger.version())) == keccak256(bytes("country_ledger_ssot_v0")),

            "Ledger: version mismatch"

        );

    }

}

