//! Serialize **F-007** 相关测例对 **`PROFILE_AVATAR_*` / `AWS_*`** 的读写，避免并行 **`remove_var`** 与 **MinIO IT** 竞态。

use std::sync::{Mutex, OnceLock};

static PROFILE_AVATAR_ENV_SERIAL: OnceLock<Mutex<()>> = OnceLock::new();

pub(crate) fn lock_profile_avatar_test_env() -> std::sync::MutexGuard<'static, ()> {
    PROFILE_AVATAR_ENV_SERIAL
        .get_or_init(|| Mutex::new(()))
        .lock()
        .unwrap_or_else(|e| e.into_inner())
}
