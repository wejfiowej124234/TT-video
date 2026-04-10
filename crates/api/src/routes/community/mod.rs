//! 50-O-31 / 51-31-9：31 社区扩展与 04 对接（31 附录 §7、§11）
//! 有 DB 时从 community_* 表读写；无 DB 时返回占位。帖子/Feed/点赞 51-31-9、51-31-B1、51-31-8。
//! TT-MOD-B3-01：目录化拆分（行为与路由不变）。
//! TT-MOD-B3-03：与 `health_meta` 对齐装配层（`#[cfg(test)]` 置尾、出口注释风格；行为不变）。

mod common;
mod dm_social;
mod feedback_reports;
mod posts;
mod router;

// 对外：公网 `/api/v1/community/*`（`routes/mod.rs` `merge(community::router())`）
pub use router::router;

#[cfg(test)]
mod tests;
