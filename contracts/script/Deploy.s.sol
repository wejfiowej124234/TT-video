// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/EscrowFactory.sol";
import "../src/GuideIdentityStakingPool.sol";
import "../src/ProviderIdentityStakingPool.sol";
import "../src/Registry.sol";
import "../src/MockERC20.sol";
import "../src/FeeRouter.sol";
import "../src/RegionVault.sol";
import "../src/InvestorDistributionClaim.sol";
import "../src/RegionDistributionClaim.sol";
import "../src/GovernanceTimelock.sol";
import "../src/GovernanceTreasury.sol";
import "../src/ReserveVault.sol";

/**
 * 部署脚本：本地 Anvil 或测试网（Escrow/质押/FeeRouter/Timelock 等；**不**含 **GovernanceVotesToken / Governor**）。
 * 测试网需要 **TTG 治理票 + Governor** 时，须另跑 **`DeployGovernanceStack.s.sol`**（见 `contracts/README.md`「治理栈」）。
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
        uint256 minIdentity = 1000e6; // 与旧 MIN_STAKE 叙事对齐；双池可分参时再外提
        // SlashRouter 地址非零时须先于池部署或后续用迁移脚本接线；本地骨架传 address(0) 表示仅池内 slashReserve
        GuideIdentityStakingPool stakingGuide = new GuideIdentityStakingPool(token, deployer, minIdentity, address(0));
        ProviderIdentityStakingPool stakingProvider =
            new ProviderIdentityStakingPool(token, deployer, minIdentity, address(0));
        console.log("GuideIdentityStakingPool", address(stakingGuide));
        console.log("ProviderIdentityStakingPool", address(stakingProvider));
        console.log("MockERC20", token);

        Registry registry = new Registry();
        console.log("Registry", address(registry));

        // RegionVault：承接 FeeRouter 国家桶（45% 第一层）；四方其余三方可改为多签/国库（83/84）
        RegionVault regionVault = new RegionVault(deployer);
        console.log("RegionVault", address(regionVault));
        // P5-3-1 复核：`RegionShareSnapshotLine` topic0 = keccak256("RegionShareSnapshotLine(uint256,address,string,uint256,uint256)")；链上锚点由 `owner` 调用 `emitRegionShareSnapshotLine`（与 `crates/api/src/chain/indexer.rs` / B-115-4 解析一致）。
        console.log("P5_3_1_RegionShareSnapshotLine_topic0");
        console.logBytes32(
            keccak256(bytes("RegionShareSnapshotLine(uint256,address,string,uint256,uint256)"))
        );

        // B-089 / B-407：Timelock 先于 FeeRouter，便于 **owner = Timelock** 与 **执行目标白名单** 同批登记
        uint256 timelockDelay = vm.envOr("GOVERNANCE_TIMELOCK_DELAY_SECONDS", uint256(86400));
        GovernanceTimelock timelock = new GovernanceTimelock(deployer, timelockDelay);
        console.log("GovernanceTimelock", address(timelock));
        console.log("GovernanceTimelock.delay_seconds", timelockDelay);

        // B-090：协议金库 **`spender` = Timelock**（募资/换币 **分轨 B**，与 FeeRouter **分轨 A** 地址隔离）
        GovernanceTreasury treasury = new GovernanceTreasury(deployer, address(timelock));
        console.log("GovernanceTreasury", address(treasury));

        // B-407：**Global Reserve** 腿进入 **ReserveVault**（`withdraw` 仅 Timelock）；与 **SlashRouter→ReserveVault** 罚没路径可同址承接 **platform** 代币
        ReserveVault feeReserveVault = new ReserveVault(token, address(timelock));
        console.log("ReserveVault_fee_track", address(feeReserveVault));

        FeeRouter feeRouter = new FeeRouter(
            address(timelock),
            address(regionVault),
            address(stakingGuide),
            address(feeReserveVault),
            address(treasury)
        );
        console.log("FeeRouter", address(feeRouter));
        console.log(
            "B-407: FeeRouter owner=Timelock; globalStakers=Guide pool; globalReserve=ReserveVault; globalOps=GovernanceTreasury"
        );
        console.log(
            "RECOMMENDED: set Escrow.EscrowParams.platformFeeRecipient = FeeRouter address when creating escrows (83/84); align API FEE_ROUTER_ADDRESS + frontend NEXT_PUBLIC_FEE_ROUTER_ADDRESS"
        );

        timelock.setAllowedExecutionTarget(address(feeRouter), true);
        timelock.setAllowedExecutionTarget(address(treasury), true);
        timelock.setAllowedExecutionTarget(address(feeReserveVault), true);
        timelock.setAllowedExecutionTarget(address(regionVault), true);
        console.log("GovernanceTimelock: allowedExecutionTarget set for FeeRouter, GovernanceTreasury, ReserveVault, RegionVault");

        InvestorDistributionClaim distClaim = new InvestorDistributionClaim(deployer);
        console.log("InvestorDistributionClaim", address(distClaim));

        RegionDistributionClaim regionDistClaim = new RegionDistributionClaim(deployer);
        console.log("RegionDistributionClaim", address(regionDistClaim));

        vm.stopBroadcast();
    }
}
