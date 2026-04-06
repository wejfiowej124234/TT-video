// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/EscrowFactory.sol";
import "../src/Staking.sol";
import "../src/Registry.sol";
import "../src/MockERC20.sol";
import "../src/FeeRouter.sol";
import "../src/RegionVault.sol";
import "../src/InvestorDistributionClaim.sol";
import "../src/GovernanceTimelock.sol";
import "../src/GovernanceTreasury.sol";

/**
 * 部署脚本：本地 Anvil 或测试网
 * 用法：forge script script/Deploy.s.sol --rpc-url <RPC> --broadcast
 * 本地：anvil & forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
 */
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // anvil default #0
        }
        vm.startBroadcast(deployerPrivateKey);
        address deployer = vm.addr(deployerPrivateKey);

        EscrowFactory factory = new EscrowFactory(deployer);
        console.log("EscrowFactory", address(factory));

        // 测试网需传入真实 token 地址；本地可用 MockERC20
        address token = address(new MockERC20());
        // slasher：本地默认同 deployer；测试网/主网宜改为多签或执行器地址（见 01/02）
        Staking staking = new Staking(token, deployer);
        console.log("Staking", address(staking));
        console.log("MockERC20", token);

        Registry registry = new Registry();
        console.log("Registry", address(registry));

        // RegionVault：承接 FeeRouter 国家桶（45% 第一层）；四方其余三方可改为多签/国库（83/84）
        RegionVault regionVault = new RegionVault(deployer);
        console.log("RegionVault", address(regionVault));

        FeeRouter feeRouter = new FeeRouter(
            deployer,
            address(regionVault),
            deployer,
            deployer,
            deployer
        );
        console.log("FeeRouter", address(feeRouter));
        console.log(
            "RECOMMENDED: set Escrow.EscrowParams.platformFeeRecipient = FeeRouter address when creating escrows (83/84); align API FEE_ROUTER_ADDRESS + frontend NEXT_PUBLIC_FEE_ROUTER_ADDRESS"
        );

        InvestorDistributionClaim distClaim = new InvestorDistributionClaim(deployer);
        console.log("InvestorDistributionClaim", address(distClaim));

        // B-089：治理延迟执行；延迟秒数可环境覆盖（测试网建议 ≥ 86400）
        uint256 timelockDelay = vm.envOr("GOVERNANCE_TIMELOCK_DELAY_SECONDS", uint256(86400));
        GovernanceTimelock timelock = new GovernanceTimelock(deployer, timelockDelay);
        console.log("GovernanceTimelock", address(timelock));
        console.log("GovernanceTimelock.delay_seconds", timelockDelay);

        // B-090：治理金库；**spender** = Timelock，支出须经 **schedule → execute**
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, address(timelock));
        console.log("GovernanceTreasury", address(treasury));

        vm.stopBroadcast();
    }
}
