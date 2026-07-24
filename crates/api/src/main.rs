//! TravelTrust API 入口：Axum + CORS，路由与 04 §三 对齐
//!
//! SSOT：Backend 启动时从 env SSOT_VERSION 读取；STRICT_SSOT=1 时未设置则拒绝启动。见 08-5 §4、Runbook §10、04 §四。
//! traceId：响应头 x-request-id 由请求头带入或自动生成，与 01 §9 贯通 requestId→txHash→logIndex 一致。
//! 路由：核心业务路由已在 routes/* + chain_off/* 落地；少量降级分支在业务层不可用时返回 not_implemented，需按 04 §三 与 01 §10 持续校准。
//! 幂等：请求头 Idempotency-Key / X-Idempotency-Key 在中间件透传并回写；对 POST/PUT 做 key 去重与结果复用（01 §10 #14），缓存键=method+path+key，最多 1000 条。
//! 环境变量：PORT（默认 8080，与 frontend 默认 NEXT_PUBLIC_API_BASE_URL 一致）、CORS_ORIGINS（逗号分隔的允许 origin，未设则开发态允许任意；生产应设置）、**`SSOT_PARALLEL_CHAIN_SNAPSHOT_OBSERVATION`**（默认启用 **`ssot_parallel_chain_snapshot`** 并行 RPC；**`0`/`false`/`off`/`no`** 关闭，体三腿 **`null`**、**不**写池根级主字段；**`crate::state`** / **04** B110-SSOT-05）。

#![allow(dead_code)]

use std::env;

mod api_json;
mod auth_audit_async;
mod auth_forgot_per_email_limit;
mod auth_forgot_risk_limits;
mod auth_per_email_send_window;
mod catalog_geo_validation;
mod complexity_convergence;
mod chain;
#[cfg(test)]
pub use chain::vacancy_ledger_indexer;
mod chain_id_env;
mod chain_off;
mod db;
mod auth_email_templates;
mod email_transport;
mod email_transport_resend;
mod pcp;
mod session_cookie;
mod production_metrics;
mod jurisdiction_country_ledger_template;
mod middleware;
mod onboarding_counters;
mod order_deadline_clock;
mod router;
mod routes;
mod runtime_identity;
mod schedule_engine;
mod source_kind;
mod ssot;
mod startup;
mod stripe_onboarding;
mod state;
mod storage;
mod trust_growth_autopilot;
mod u256_hex;
mod wallet_verify_crypto;

#[cfg(test)]
mod jsonrpc_mock_server;

#[cfg(test)]
mod it_db_pool;

#[cfg(test)]
mod test_env_serial;
#[cfg(test)]
mod test_auth_mail_env_mutex;

#[cfg(test)]
mod idempotency_http_contract_tests;

fn main() {
    // 加载 .env：先当前目录，再项目根（crates/api 的上级两级 = 仓库根），使 SEED_TEST_ACCOUNTS、DATABASE_URL 等生效
    dotenvy::dotenv().ok();
    let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let root_env = manifest_dir.join("../../.env");
    if root_env.exists() {
        let _ = dotenvy::from_path(&root_env);
    }
    // 开发态（未设 CORS_ORIGINS）时默认启用测试账号种子，避免脚本 set 未生效或 .env 覆盖导致 403/401
    if std::env::var("CORS_ORIGINS")
        .as_deref()
        .map(|s| s.trim())
        .unwrap_or("")
        .is_empty()
        && std::env::var("SEED_TEST_ACCOUNTS").as_deref() != Ok("1")
    {
        std::env::set_var("SEED_TEST_ACCOUNTS", "1");
    }
    // 本地种子栈：强制开启公众 catalog 过滤（覆盖根 .env 中 =0；与 start-api-with-seed.bat 同源）
    // Staging/production：禁止自动打开 Unsplash showcase（公开展示仅 OCS 10×4）。
    let deployment_profile = std::env::var("TRAVELTRUST_DEPLOYMENT_PROFILE")
        .unwrap_or_default()
        .to_ascii_lowercase();
    let is_staging_or_prod = matches!(
        deployment_profile.as_str(),
        "staging" | "staging_mirror" | "production" | "prod"
    );
    if std::env::var("SEED_TEST_ACCOUNTS").as_deref() == Ok("1") {
        std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");
        if !is_staging_or_prod {
            if std::env::var("TRAVELTRUST_MARKET_PUBLIC_SHOWCASE").is_err() {
                std::env::set_var("TRAVELTRUST_MARKET_PUBLIC_SHOWCASE", "1");
            }
            if std::env::var("TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE").is_err() {
                std::env::set_var("TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE", "1");
            }
        }
    } else if std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").is_err()
        && std::env::var("TRAVELTRUST_MARKET_PUBLIC_SURFACE").is_err()
        && std::env::var("CORS_ORIGINS")
            .as_deref()
            .map(|s| s.trim())
            .unwrap_or("")
            .is_empty()
    {
        std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");
    }
    if let Err(e) = run() {
        eprintln!("TravelTrust API 启动失败: {}", e);
        std::process::exit(1);
    }
}

#[tokio::main]
async fn run() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    startup::run().await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn make_temp_dir(name: &str) -> PathBuf {
        let mut p = std::env::temp_dir();
        let n = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        p.push(format!("traveltrust_{}_{}", name, n));
        fs::create_dir_all(&p).unwrap();
        p
    }

    #[test]
    fn write_bytes_atomic_overwrites_existing_file() {
        let dir = make_temp_dir("atomic_write");
        let path = dir.join("state.json");
        ssot::write_bytes_atomic(&path, b"one").unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "one");
        ssot::write_bytes_atomic(&path, b"two").unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "two");
    }
}
