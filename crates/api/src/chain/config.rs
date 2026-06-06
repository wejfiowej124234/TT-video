//! RPC / 合约地址 / 执行器参数配置（**`CHAIN_RPC_URL`**、**`FEE_ROUTER_ADDRESS`** 等）。
//! 自 **`chain/mod.rs`** 下沉（**48** 模块化 · **STRICT ≤400**）；**`crate::chain::ChainConfig`** 经 **`mod.rs`** **`pub use`** 不变。

use serde::{Deserialize, Serialize};

/// 链配置（RPC、chain_id、合约地址、执行器限额与重试 01 §7 P0）
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ChainConfig {
    pub rpc_url: String,
    pub chain_id: u64,
    pub escrow_factory_address: Option<String>,
    /// FeeRouter 合约地址；设后 `indexer-tick` 额外拉取 `PlatformFeeRouted`（14 §1.1、110）
    pub fee_router_address: Option<String>,
    /// RegionVault 合约地址；设后 `indexer-tick` 额外拉取 `RegionVaultForwarded`（14 §1.1.1、110）
    pub region_vault_address: Option<String>,
    /// **OnboardingFeeReceiver**；设后 **`indexer-tick`** 拉取 **`OnboardingFeePaid`** → **`onboarding_fee_paid_events`**（**96-18**、**110**）
    pub onboarding_fee_receiver_address: Option<String>,
    /// **CountryPoolLedgerV0**；设后 **`indexer-tick`** 拉取 **`CountryLedgerCredited`** → **`p5_country_ledger_lines`**（**P5-1-B**）
    pub country_pool_ledger_address: Option<String>,
    /// 份额代币（TTG / Country Pool 等）ERC20 地址列表；`indexer-tick` 写入 `investor_share_transfer_events`（B-085）
    #[serde(default)]
    pub investor_share_token_addresses: Vec<String>,
    /// **身份质押池**部署地址（**`GuideIdentityStakingPool` / `ProviderIdentityStakingPool`**，`IdentityStakingPool`；与旧 **`Staking`** **读接口/事件 topic 兼容**）；设后 **`indexer-tick`** 写入 **`investor_stake_state_events`**（**B-088 Completion**）；**`investor-distribution-accrual`** 与 **`Transfer`** 重放合并
    pub staking_address: Option<String>,
    /// **`InvestorShareLockLedger`** 等锁仓合约地址列表；**`indexer-tick`** 写入 **`investor_lock_state_events`**（**B-088 · 112**）
    #[serde(default)]
    pub investor_lock_contract_addresses: Vec<String>,
    /// **`TravelTrustGovernor`**；设后 **`indexer-tick`** 拉取 **`ProposalCreated` / `VoteCast` / …** 写入 **`governance_proposals_projection`**（**B-089 Completion**）
    pub governor_address: Option<String>,
    /// **`GovernanceTimelock`**；**`GOVERNANCE_TIMELOCK_ADDRESS`**；**TT-B110-SEQ6** **`delay()`** 只读 SSOT
    pub governance_timelock_address: Option<String>,
    /// 与 Governor 绑定的 **`GovernanceVotesToken`**；**`GET …/governance/proposals/:id`** 可选 **`getPastVotes`** 对拍
    pub governance_votes_token_address: Option<String>,
    pub registry_address: Option<String>,
    /// 执行器单笔最大金额（guide_amount + traveler_refund + platform_fee），0 或不设表示不限制
    pub executor_max_amount_per_tx: Option<u128>,
    /// 执行器单日累计上限（可选，0 表示不限制）；需调用方按日累计后传入
    pub executor_max_amount_per_day: Option<u128>,
    /// 执行器发 tx 失败时重试次数（04 §五、01 §9 资金坏链路）
    pub executor_retry_count: u32,
}

impl ChainConfig {
    /// 从环境变量加载；未配置时返回 None（链下模式或未上链）
    ///
    /// **trim 后为空**（含仅空白、或 Playwright 脚本用单空格占位挡 `dotenv`）视为**未配置**，返回 `None`，
    /// 避免历史上 `CHAIN_RPC_URL=""` 仍构造 `Some(Self { rpc_url: "" })` 导致部分路径与 `is_configured()` 不一致；
    /// Windows 上 `CHAIN_RPC_URL=""` 还可能被宿主剥掉，根 `.env` 再写入慢 RPC → **`GET /meta` 叠压超时 408**。
    pub fn from_env() -> Option<Self> {
        let rpc_url = std::env::var("CHAIN_RPC_URL").ok()?;
        let rpc_url = rpc_url.trim().to_string();
        if rpc_url.is_empty() {
            return None;
        };        let chain_id = std::env::var("CHAIN_ID")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(137);
        let executor_max_amount_per_tx = std::env::var("CHAIN_EXECUTOR_MAX_AMOUNT_PER_TX")
            .ok()
            .and_then(|s| s.parse().ok())
            .filter(|&v: &u128| v > 0);
        let executor_max_amount_per_day = std::env::var("CHAIN_EXECUTOR_MAX_AMOUNT_PER_DAY")
            .ok()
            .and_then(|s| s.parse().ok())
            .filter(|&v: &u128| v > 0);
        let executor_retry_count = std::env::var("CHAIN_EXECUTOR_RETRY_COUNT")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(3);
        let investor_share_token_addresses = std::env::var("INVESTOR_SHARE_TOKEN_ADDRESSES")
            .ok()
            .map(|s| {
                s.split(',')
                    .map(|x| x.trim().to_string())
                    .filter(|x| !x.is_empty())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let investor_lock_contract_addresses = std::env::var("INVESTOR_LOCK_CONTRACT_ADDRESSES")
            .ok()
            .map(|s| {
                s.split(',')
                    .map(|x| x.trim().to_string())
                    .filter(|x| !x.is_empty())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        Some(Self {
            rpc_url,
            chain_id,
            escrow_factory_address: std::env::var("ESCROW_FACTORY_ADDRESS").ok(),
            fee_router_address: std::env::var("FEE_ROUTER_ADDRESS").ok(),
            region_vault_address: std::env::var("REGION_VAULT_ADDRESS").ok(),
            onboarding_fee_receiver_address: std::env::var("ONBOARDING_FEE_RECEIVER_ADDRESS").ok(),
            country_pool_ledger_address: std::env::var("COUNTRY_POOL_LEDGER_ADDRESS").ok(),
            investor_share_token_addresses,
            staking_address: std::env::var("STAKING_ADDRESS").ok(),
            investor_lock_contract_addresses,
            governor_address: std::env::var("GOVERNOR_ADDRESS").ok(),
            governance_timelock_address: std::env::var("GOVERNANCE_TIMELOCK_ADDRESS").ok(),
            governance_votes_token_address: std::env::var("GOVERNANCE_VOTES_TOKEN_ADDRESS")
                .ok()
                .filter(|s| !s.trim().is_empty())
                .or_else(|| {
                    std::env::var("GOVERNANCE_TOKEN_ADDRESS")
                        .ok()
                        .filter(|s| !s.trim().is_empty())
                }),
            registry_address: std::env::var("REGISTRY_ADDRESS").ok(),
            executor_max_amount_per_tx,
            executor_max_amount_per_day,
            executor_retry_count,
        })
    }

    pub fn is_configured(&self) -> bool {
        !self.rpc_url.trim().is_empty()
    }

    /// 与 `GET /meta` **`chain.contracts.escrow_platform_fee_recipient`** 同源（B-095 / Runbook §7.1）。
    #[must_use]
    pub fn escrow_platform_fee_recipient(&self) -> Option<String> {
        self.fee_router_address
            .as_ref()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
    }
}
