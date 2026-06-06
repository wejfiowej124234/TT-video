use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub(super) struct PaymentIntentBody {
    pub role: String,
    #[serde(default)]
    pub sku: Option<String>,
    #[serde(default)]
    pub return_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub(super) struct RoleConfirmBody {
    pub role: String,
}
