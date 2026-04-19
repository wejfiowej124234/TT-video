// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/EscrowFactory.sol";
import "../src/Escrow.sol";

/**
 * @dev **B-407 联调**：由 bash 注入环境变量并 **`forge script … --broadcast`**，避免部分环境下 **`cast send`** **对** **`createEscrow`** **嵌套元组** **解析失败** **（** **exit 49** **）** **。**
 *
 * **环境变量** **（** **必填** **）** **：**
 * - **`PRIVATE_KEY`** **或** **`B407_FACTORY_DEPLOYER_PK`** **：** **付** **gas** **的** **EOA**
 * - **`ESCROW_FACTORY_ADDRESS`**
 * - **`B407_ORDER_ID_BYTES32`** **：** **0x** **开头** **64** **位** **hex** **（** **与** **`orderIdBytes32.ts`** **一致** **；** **勿** **用** **`ORDER_ID_BYTES32`** **—** **部分** **Windows** **shell** **会** **丢** **变量** **）**
 * - **`B407_SNAPSHOT_BYTES32`** **：** **0x** **+** **64** **hex** **（** **bash** **里** **`cast keccak …`** **）**
 * - **`B407_ESCROW_CHAIN_ID`** **：** **十进制** **字符串** **（** **与** **`cast chain-id`** **一致** **）**
 * - **`B407_TRAVELER`**, **`B407_GUIDE`**, **`FEE_ROUTER_ADDRESS`** **或** **`B407_FEE_ROUTER`** **,** **`PAYMENT_TOKEN`**
 * - **`B407_TOTAL_AMOUNT_WEI`** **：** **十进制** **（** **与** **订单** **金额** **×** **1e6** **一致** **）**
 * - **`B407_PLATFORM_FEE_BPS`** **（** **默认** **0** **）**
 * - **`B407_SERVICE_START`**, **`B407_SERVICE_END`** **：** **uint64** **十进制**
 * - **`B407_DISPUTE_WINDOW_SECONDS`** **（** **默认** **604800** **）**
 * - **`B407_ESCROW_SCHEMA_VERSION`** **（** **默认** **1** **）**
 * - **`B407_ARBITRATOR`** **（** **可选** **，** **默认** **address(0)** **）**
 */
contract CreateEscrowB407 is Script {
    function run() external {
        uint256 pk = vm.envUint("B407_FACTORY_DEPLOYER_PK");
        vm.startBroadcast(pk);

        EscrowFactory factory = EscrowFactory(vm.envAddress("ESCROW_FACTORY_ADDRESS"));
        bytes32 orderId = vm.parseBytes32(vm.envString("B407_ORDER_ID_BYTES32"));
        bytes32 snapshot = vm.parseBytes32(vm.envString("B407_SNAPSHOT_BYTES32"));

        address feeRouter = vm.envOr("B407_FEE_ROUTER", address(0));
        if (feeRouter == address(0)) {
            feeRouter = vm.envAddress("FEE_ROUTER_ADDRESS");
        }

        Escrow.EscrowParams memory params = Escrow.EscrowParams({
            chainId: vm.envUint("B407_ESCROW_CHAIN_ID"),
            orderId: orderId,
            snapshotHash: snapshot,
            schemaVersion: uint16(vm.envOr("B407_ESCROW_SCHEMA_VERSION", uint256(1))),
            traveler: vm.envAddress("B407_TRAVELER"),
            guide: vm.envAddress("B407_GUIDE"),
            platformFeeRecipient: feeRouter,
            token: vm.envAddress("PAYMENT_TOKEN"),
            totalAmount: vm.envUint("B407_TOTAL_AMOUNT_WEI"),
            platformFeeBps: uint16(vm.envOr("B407_PLATFORM_FEE_BPS", uint256(0))),
            serviceStart: uint64(vm.envUint("B407_SERVICE_START")),
            serviceEnd: uint64(vm.envUint("B407_SERVICE_END")),
            disputeWindowSeconds: uint32(vm.envOr("B407_DISPUTE_WINDOW_SECONDS", uint256(604800))),
            arbitrator: vm.envOr("B407_ARBITRATOR", address(0))
        });

        factory.createEscrow(params);
        vm.stopBroadcast();
    }
}
