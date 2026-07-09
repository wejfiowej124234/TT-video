// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Phase2ControlPlane.sol";
import "./Phase2SafeExec.sol";
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
 * @notice **TT-B435 / 母表 B-434 方案 B**：在 **已有** **`GovernanceTimelock`** 上部署资金栈。
 * @dev **Safe admin 路径（R-02 · Sepolia）**：
 *      - **Phase A** = **deployer** `PRIVATE_KEY` 部署合约（**≠** Timelock.admin）
 *      - **Phase B** = Safe owner 经 `execTransaction` 调用 `setAllowedExecutionTarget` ×4
 *      - **Anvil**：`timelock.admin() == deployer` 时 Phase A 内联 allowlist
 *
 * **环境变量**
 * - **必填**：`PRIVATE_KEY`（部署者）· `TIMELOCK_ADDRESS`（序 1 治理栈输出）
 * - **Safe 路径**：`TIMELOCK_ADMIN_ADDRESS` · `TIMELOCK_SAFE_OWNER_KEYS`
 * - **可选**：`FUND_STACK_TOKEN_ADDRESS` · `MIN_IDENTITY_STAKE_WEI`
 *
 * Phase B 单独重跑：`ConfigureFundStackTimelockViaSafe.s.sol`
 */
contract DeployFundStackUnderTimelock is Phase2ControlPlane, Phase2SafeExec {
    struct FundStackDeployed {
        address token;
        EscrowFactory factory;
        GuideIdentityStakingPool stakingGuide;
        ProviderIdentityStakingPool stakingProvider;
        Registry registry;
        RegionVault regionVault;
        GovernanceTreasury treasury;
        ReserveVault feeReserveVault;
        FeeRouter feeRouter;
        InvestorDistributionClaim distClaim;
        RegionDistributionClaim regionDistClaim;
    }

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        require(pk != 0, "DeployFundStackUnderTimelock: PRIVATE_KEY required");

        address timelockAddr = vm.envAddress("TIMELOCK_ADDRESS");
        require(timelockAddr != address(0), "DeployFundStackUnderTimelock: TIMELOCK_ADDRESS required");

        address deployer = vm.addr(pk);
        GovernanceTimelock timelock = GovernanceTimelock(payable(timelockAddr));
        address timelockAdmin = timelock.admin();
        bool safeAdminPath = timelockAdmin != deployer && timelockAdmin.code.length > 0;

        FundStackDeployed memory d;

        vm.startBroadcast(pk);

        d = _deployFundStackContracts(deployer, timelockAddr);

        if (!safeAdminPath) {
            timelock.setAllowedExecutionTarget(address(d.feeRouter), true);
            timelock.setAllowedExecutionTarget(address(d.treasury), true);
            timelock.setAllowedExecutionTarget(address(d.feeReserveVault), true);
            timelock.setAllowedExecutionTarget(address(d.regionVault), true);
        }

        vm.stopBroadcast();

        if (safeAdminPath) {
            uint256 ownerPk = resolveSafeOwnerPrivateKey();
            address owner = vm.addr(ownerPk);
            vm.startBroadcast(ownerPk);
            configureFundStackTimelockViaSafe(
                timelockAdmin,
                timelockAddr,
                address(d.feeRouter),
                address(d.treasury),
                address(d.feeReserveVault),
                address(d.regionVault),
                ownerPk
            );
            vm.stopBroadcast();
            console.log("Phase B safeOwner", owner);
        }

        _logFundStackSummary(deployer, timelockAddr, timelockAdmin, safeAdminPath, d);
        _assertFundStackBindings(timelock, timelockAddr, safeAdminPath, d);
        console.log("FUNDSTACK_BINDING_CHECK: OK");
    }

    function _deployFundStackContracts(address deployer, address timelockAddr)
        internal
        returns (FundStackDeployed memory d)
    {
        address chainOwner = resolveChainOwner(deployer);
        address factoryGuardian = resolveEscrowFactoryGuardian(deployer, timelockAddr);

        if (vm.envOr("FUND_STACK_TOKEN_ADDRESS", address(0)) != address(0)) {
            d.token = vm.envAddress("FUND_STACK_TOKEN_ADDRESS");
        } else {
            d.token = address(new MockERC20());
        }
        console.log("token", d.token);

        uint256 minIdentity = vm.envOr("MIN_IDENTITY_STAKE_WEI", uint256(1000e6));

        d.factory = new EscrowFactory(factoryGuardian);
        console.log("EscrowFactory", address(d.factory));
        console.log("EscrowFactory.guardian", factoryGuardian);

        d.stakingGuide = new GuideIdentityStakingPool(d.token, timelockAddr, minIdentity, address(0));
        d.stakingProvider = new ProviderIdentityStakingPool(d.token, timelockAddr, minIdentity, address(0));
        console.log("GuideIdentityStakingPool", address(d.stakingGuide));
        console.log("ProviderIdentityStakingPool", address(d.stakingProvider));

        d.registry = new Registry();
        console.log("Registry", address(d.registry));

        d.regionVault = new RegionVault(timelockAddr);
        console.log("RegionVault", address(d.regionVault));

        console.log("P5_3_1_RegionShareSnapshotLine_topic0");
        console.logBytes32(
            keccak256(bytes("RegionShareSnapshotLine(uint256,address,string,uint256,uint256)"))
        );

        d.treasury = new GovernanceTreasury(timelockAddr, timelockAddr);
        console.log("GovernanceTreasury", address(d.treasury));

        d.feeReserveVault = new ReserveVault(d.token, timelockAddr);
        console.log("ReserveVault_fee_track", address(d.feeReserveVault));

        d.feeRouter = new FeeRouter(
            timelockAddr,
            address(d.regionVault),
            address(d.stakingGuide),
            address(d.feeReserveVault),
            address(d.treasury)
        );
        console.log("FeeRouter", address(d.feeRouter));
        console.log("TT-B435: FeeRouter.owner=Timelock(existing); pools slasher=Timelock; RegionVault.owner=Timelock");

        d.distClaim = new InvestorDistributionClaim(chainOwner);
        console.log("InvestorDistributionClaim", address(d.distClaim));

        d.regionDistClaim = new RegionDistributionClaim(chainOwner);
        console.log("RegionDistributionClaim", address(d.regionDistClaim));
    }

    function _logFundStackSummary(
        address deployer,
        address timelockAddr,
        address timelockAdmin,
        bool safeAdminPath,
        FundStackDeployed memory d
    ) internal view {
        console.log("--- DeployFundStackUnderTimelock (TT-B435) ---");
        console.log("deployer", deployer);
        console.log("TIMELOCK", timelockAddr);
        console.log("TIMELOCK_ADMIN", timelockAdmin);
        console.log("safeAdminPath", safeAdminPath);
        console.log("BINDING feeRouter.owner", d.feeRouter.owner());
        console.log("BINDING regionVault.owner", d.regionVault.owner());
        console.log("BINDING treasury.owner", d.treasury.owner());
        console.log("BINDING treasury.spender", d.treasury.spender());
        console.log("BINDING reserveVault.timelock", d.feeReserveVault.timelock());
        console.log("BINDING guidePool.slasher", d.stakingGuide.slasher());
        console.log("BINDING providerPool.slasher", d.stakingProvider.slasher());
        console.log("BINDING factory.guardian", d.factory.guardian());
        console.log("BINDING feeRouter.countryBucket", d.feeRouter.countryBucket());
        console.log("BINDING feeRouter.globalStakers", d.feeRouter.globalStakers());
        console.log("BINDING feeRouter.globalReserve", d.feeRouter.globalReserve());
        console.log("BINDING feeRouter.globalOps", d.feeRouter.globalOps());
    }

    function _assertFundStackBindings(
        GovernanceTimelock timelock,
        address timelockAddr,
        bool safeAdminPath,
        FundStackDeployed memory d
    ) internal view {
        require(d.feeRouter.owner() == timelockAddr, "FundStack: FeeRouter.owner!=Timelock");
        require(d.regionVault.owner() == timelockAddr, "FundStack: RegionVault.owner!=Timelock");
        require(d.treasury.owner() == timelockAddr, "FundStack: Treasury.owner!=Timelock");
        require(d.treasury.spender() == timelockAddr, "FundStack: Treasury.spender!=Timelock");
        require(d.feeReserveVault.timelock() == timelockAddr, "FundStack: ReserveVault.timelock!=Timelock");
        require(d.stakingGuide.slasher() == timelockAddr, "FundStack: Guide.slasher!=Timelock");
        require(d.stakingProvider.slasher() == timelockAddr, "FundStack: Provider.slasher!=Timelock");
        require(d.factory.guardian() == timelockAddr, "FundStack: Factory.guardian!=Timelock");
        require(d.feeRouter.countryBucket() == address(d.regionVault), "FundStack: countryBucket!=RegionVault");
        require(d.feeRouter.globalStakers() == address(d.stakingGuide), "FundStack: globalStakers!=GuidePool");
        require(d.feeRouter.globalReserve() == address(d.feeReserveVault), "FundStack: globalReserve!=ReserveVault");
        require(d.feeRouter.globalOps() == address(d.treasury), "FundStack: globalOps!=Treasury");
        require(
            timelock.allowedExecutionTarget(address(d.feeRouter)), "FundStack: allowlist FeeRouter"
        );
        require(
            timelock.allowedExecutionTarget(address(d.treasury)), "FundStack: allowlist Treasury"
        );
        require(
            timelock.allowedExecutionTarget(address(d.feeReserveVault)), "FundStack: allowlist ReserveVault"
        );
        require(
            timelock.allowedExecutionTarget(address(d.regionVault)), "FundStack: allowlist RegionVault"
        );
    }
}
