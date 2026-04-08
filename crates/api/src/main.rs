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
mod chain;
mod chain_off;
mod db;
mod middleware;
mod router;
mod routes;
mod schedule_engine;
mod ssot;
mod startup;
mod state;
mod u256_hex;

#[cfg(test)]
mod jsonrpc_mock_server;

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
