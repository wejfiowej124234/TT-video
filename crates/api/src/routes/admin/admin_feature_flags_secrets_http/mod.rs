//! Admin **feature flags**（**220/240**）与 **secret metadata** 只读（**04 §3.5**）。

mod flags;
mod helpers;
mod publish;
mod secrets;

pub use flags::get_admin_flags;
pub use publish::post_admin_flag_publish;
pub use secrets::get_admin_secrets_metadata;
