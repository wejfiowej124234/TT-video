//! **`users.role`** 内存与 PostgreSQL 对读（**`GET /api/v1/me`** 读 chain_off 内存真源）。

use chrono::Utc;
use uuid::Uuid;

use super::ChainOffState;

/// PG 角色已与目标一致时，将 **`chain_off.users`** 同步为同一 **`role`**（幂等）。
pub async fn sync_user_role_in_memory_when_pg_matches(
    state: &ChainOffState,
    user_id: Uuid,
    expected_role: &str,
    pg_role: &str,
) {
    if pg_role != expected_role {
        return;
    };    let mut store = state.store.write().await;
    if let Some(u) = store.users.get_mut(&user_id) {
        if u.role != expected_role {
            u.role = expected_role.to_string();
            u.updated_at = Utc::now();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chain_off::{ChainOffConfig, ChainOffStore, UserRow};
    use chrono::Utc;
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use uuid::Uuid;

    #[tokio::test]
    async fn sync_user_role_updates_memory_when_pg_matches() {
        let uid = Uuid::new_v4();
        let state = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore {
                users: [(
                    uid,
                    UserRow {
                        id: uid,
                        email: "sync@test.local".to_string(),
                        password_hash: None,
                        role: "traveler".to_string(),
                        kyc_status: "none".to_string(),
                        nickname: None,
                        avatar_url: None,
                        default_wallet_address: None,
                        created_at: Utc::now(),
                        updated_at: Utc::now(),
                    },
                )]
                .into_iter()
                .collect(),
                ..ChainOffStore::default()
            })),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        sync_user_role_in_memory_when_pg_matches(&state, uid, "provider", "provider").await;
        let store = state.store.read().await;
        assert_eq!(store.users.get(&uid).unwrap().role, "provider");
    }
}
