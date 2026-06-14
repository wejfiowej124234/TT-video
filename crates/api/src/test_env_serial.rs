//! 单测进程内互斥：`std::env` 全局可变 · 并行 `cargo test` 时避免读/写竞态。

#[cfg(test)]
pub fn lock() -> std::sync::MutexGuard<'static, ()> {
    static M: std::sync::Mutex<()> = std::sync::Mutex::new(());
    M.lock().unwrap_or_else(|e| e.into_inner())
}
