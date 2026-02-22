use crate::api;
use yew::prelude::*;

#[derive(Debug, Clone, PartialEq)]
pub enum MetaGateState {
    Loading,
    Error(String),
    Ready {
        meta: api::MetaResponse,
        compatible: bool,
        reason: Option<String>,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub struct MetaGate {
    pub state: MetaGateState,
}

impl MetaGate {
    pub fn meta(&self) -> Option<&api::MetaResponse> {
        match &self.state {
            MetaGateState::Ready { meta, .. } => Some(meta),
            _ => None,
        }
    }

    pub fn compatible(&self) -> bool {
        match &self.state {
            MetaGateState::Ready { compatible, .. } => *compatible,
            _ => false,
        }
    }

    #[allow(dead_code)]
    pub fn reason(&self) -> Option<&str> {
        match &self.state {
            MetaGateState::Ready { reason, .. } => reason.as_deref(),
            MetaGateState::Error(e) => Some(e.as_str()),
            MetaGateState::Loading => None,
        }
    }

    fn expected_api_version() -> Option<&'static str> {
        option_env!("TRAVELTRUST_EXPECTED_API_VERSION")
    }

    fn expected_ssot_version() -> Option<&'static str> {
        option_env!("TRAVELTRUST_EXPECTED_SSOT_VERSION")
    }

    pub fn expected_ssot_version_for_domain() -> Result<&'static str, String> {
        let v = Self::expected_ssot_version();
        if v.is_some() {
            return Ok(v.unwrap());
        }
        if cfg!(debug_assertions) {
            // dev convenience: allow running without binding.
            return Ok("dev");
        }
        Err("missing build-time TRAVELTRUST_EXPECTED_SSOT_VERSION (release must bind domain/version)"
            .to_string())
    }

    fn check_compat(meta: &api::MetaResponse) -> Result<(), String> {
        match (Self::expected_api_version(), cfg!(debug_assertions)) {
            (Some(exp), _) => {
                if meta.api_version != exp {
                    return Err(format!(
                        "api_version mismatch: expected={} got={}",
                        exp, meta.api_version
                    ));
                }
            }
            (None, true) => {}
            (None, false) => {
                return Err(
                    "missing build-time TRAVELTRUST_EXPECTED_API_VERSION (release must bind /meta)"
                        .to_string(),
                );
            }
        }

        match (Self::expected_ssot_version(), cfg!(debug_assertions)) {
            (Some(exp), _) => {
                if meta.ssot_version != exp {
                    return Err(format!(
                        "ssot_version mismatch: expected={} got={}",
                        exp, meta.ssot_version
                    ));
                }
            }
            (None, true) => {}
            (None, false) => {
                return Err(
                    "missing build-time TRAVELTRUST_EXPECTED_SSOT_VERSION (release must bind /meta)"
                        .to_string(),
                );
            }
        }

        Ok(())
    }

}

#[hook]
pub fn use_meta_gate() -> MetaGate {
    let state = use_state(|| MetaGateState::Loading);

    {
        let state = state.clone();
        use_effect_with((), move |_| {
            wasm_bindgen_futures::spawn_local(async move {
                state.set(MetaGateState::Loading);
                match api::get_meta().await {
                    Ok(meta) => match MetaGate::check_compat(&meta) {
                        Ok(()) => state.set(MetaGateState::Ready {
                            meta,
                            compatible: true,
                            reason: None,
                        }),
                        Err(reason) => state.set(MetaGateState::Ready {
                            meta,
                            compatible: false,
                            reason: Some(reason),
                        }),
                    },
                    Err(e) => state.set(MetaGateState::Error(e)),
                }
            });
            || ()
        });
    }

    MetaGate {
        state: (*state).clone(),
    }
}
