//! Admin **`config/releases`**、**`api-versions`**、**`lifecycle/state-machines`**（**220/340/350**、**04 §3.5**）。

mod api_versions;
mod helpers;
mod lifecycle;
mod release_by_id;
mod releases;

pub use api_versions::get_admin_api_versions;
pub use lifecycle::get_admin_lifecycle_state_machines;
pub use release_by_id::get_admin_config_release_by_id;
pub use releases::get_admin_config_releases;
