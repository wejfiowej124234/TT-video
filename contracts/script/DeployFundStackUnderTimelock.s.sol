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
 * @title DeployFundStackUnderTimelock
 * @notice **TT-B435 / 母表 B-434 方案 B**：在 **已有** **`GovernanceTimelock`**（**不** `new GovernanceTimelock`）上部署 **FeeRouter / 池 / RegionVault / Treasury / ReserveVault** 等，**owner / spender / immutable timelock** **均** **指向** **同一** **`TIMELOCK_ADDRESS`** **（** **与** **`Deploy.s.sol`** **区分** **）** **。**
 *      **不**部署 **治理票代币**（`GovernanceVotesToken`，链上符号 TTG）；TTG 仅由 **`DeployGovernanceStack.s.sol`** 部署。本脚本内 **`MockERC20` / `FUND_STACK_TOKEN_ADDRESS`** 为 **结算/质押用 ERC20**，**≠** TTG。
 * @dev **广播私钥** **必须** **为** **该** **Timelock** **的** **`admin()`** **EOA** **（** **否则** **`setAllowedExecutionTarget`** **revert** **）** **。** **验证** **：** **`cast call $TIMELOCK_ADDRESS "admin()(address)"`** **==** **`vm.addr(PRIVATE_KEY)`** **。**
 *
 * **环境变量**
 * - **必填**：**`PRIVATE_KEY`** **（** **Timelock** **admin** **）** **、** **`TIMELOCK_ADDRESS`** **（** **现有** **治理** **栈** **）** **。**
 * - **可选**：**`FUND_STACK_TOKEN_ADDRESS`** **—** **已** **部署** **ERC20** **（** **测试网** **）** **；** **未** **设** **则** **部署** **`MockERC20`** **。**
 * - **可选**：**`MIN_IDENTITY_STAKE_WEI`** **（** **默认** **`1000e6`** **）** **。**
 *
 * **用法**：**`forge script script/DeployFundStackUnderTimelock.s.sol:DeployFundStackUnderTimelock --rpc-url $CHAIN_RPC_URL --broadcast`**
 */
contract DeployFundStackUnderTimelock is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        require(pk != 0, "DeployFundStackUnderTimelock: PRIVATE_KEY required");

        address timelockAddr = vm.envAddress("TIMELOCK_ADDRESS");
        require(timelockAddr != address(0), "DeployFundStackUnderTimelock: TIMELOCK_ADDRESS required");

        vm.startBroadcast(pk);
        address deployer = vm.addr(pk);

        GovernanceTimelock timelock = GovernanceTimelock(payable(timelockAddr));

        address token;
        if (vm.envOr("FUND_STACK_TOKEN_ADDRESS", address(0)) != address(0)) {
            token = vm.envAddress("FUND_STACK_TOKEN_ADDRESS");
        } else {
            token = address(new MockERC20());
        }
        console.log("token", token);

        uint256 minIdentity = vm.envOr("MIN_IDENTITY_STAKE_WEI", uint256(1000e6));

        EscrowFactory factory = new EscrowFactory(deployer);
        console.log("EscrowFactory", address(factory));

        // slasher = Timelock：罚没/管理权限与治理栈一致（可与运维另议改回 deployer）
        GuideIdentityStakingPool stakingGuide =
            new GuideIdentityStakingPool(token, timelockAddr, minIdentity, address(0));
        ProviderIdentityStakingPool stakingProvider =
            new ProviderIdentityStakingPool(token, timelockAddr, minIdentity, address(0));
        console.log("GuideIdentityStakingPool", address(stakingGuide));
        console.log("ProviderIdentityStakingPool", address(stakingProvider));

        Registry registry = new Registry();
        console.log("Registry", address(registry));

        // owner = Timelock：与 execute 路径 msg.sender 一致
        RegionVault regionVault = new RegionVault(timelockAddr);
        console.log("RegionVault", address(regionVault));

        console.log("P5_3_1_RegionShareSnapshotLine_topic0");
        console.logBytes32(
            keccak256(bytes("RegionShareSnapshotLine(uint256,address,string,uint256,uint256)"))
        );

        // owner + spender = Timelock（与 Deploy.s.sol 中 deployer+timelock 不同）
        GovernanceTreasury treasury = new GovernanceTreasury(timelockAddr, timelockAddr);
        console.log("GovernanceTreasury", address(treasury));

        ReserveVault feeReserveVault = new ReserveVault(token, timelockAddr);
        console.log("ReserveVault_fee_track", address(feeReserveVault));

        FeeRouter feeRouter = new FeeRouter(
            timelockAddr,
            address(regionVault),
            address(stakingGuide),
            address(feeReserveVault),
            address(treasury)
        );
        console.log("FeeRouter", address(feeRouter));
        console.log("TT-B435: FeeRouter.owner=Timelock(existing); pools slasher=Timelock; RegionVault.owner=Timelock");

        require(timelock.admin() == deployer, "DeployFundStackUnderTimelock: PRIVATE_KEY must be Timelock admin()");
        timelock.setAllowedExecutionTarget(address(feeRouter), true);
        timelock.setAllowedExecutionTarget(address(treasury), true);
        timelock.setAllowedExecutionTarget(address(feeReserveVault), true);
        timelock.setAllowedExecutionTarget(address(regionVault), true);
        console.log("GovernanceTimelock: setAllowedExecutionTarget for FeeRouter, Treasury, ReserveVault, RegionVault");

        InvestorDistributionClaim distClaim = new InvestorDistributionClaim(deployer);
        console.log("InvestorDistributionClaim", address(distClaim));

        RegionDistributionClaim regionDistClaim = new RegionDistributionClaim(deployer);
        console.log("RegionDistributionClaim", address(regionDistClaim));

        vm.stopBroadcast();
    }
}
