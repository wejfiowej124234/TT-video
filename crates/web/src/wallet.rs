use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;

fn js_error_details(e: &JsValue) -> (Option<i64>, Option<String>) {
    if e.is_null() || e.is_undefined() {
        return (None, None);
    }

    let code = js_sys::Reflect::get(e, &JsValue::from_str("code"))
        .ok()
        .and_then(|v| v.as_f64())
        .map(|n| n as i64);

    let message = js_sys::Reflect::get(e, &JsValue::from_str("message"))
        .ok()
        .and_then(|v| v.as_string());

    (code, message)
}

fn wallet_error_kind(code: Option<i64>) -> &'static str {
    match code {
        Some(4001) => "user_rejected",       // EIP-1193
        Some(-32002) => "request_pending",  // MetaMask: already processing
        Some(4100) => "unauthorized",       // EIP-1193
        Some(4902) => "chain_not_added",    // EIP-1193
        Some(-32603) => "internal_error",   // JSON-RPC
        _ => "unknown",
    }
}

fn format_wallet_js_error(prefix: &str, e: JsValue) -> String {
    let (code, message) = js_error_details(&e);
    let kind = wallet_error_kind(code);
    let msg = message.unwrap_or_else(|| format!("{:?}", e));
    match code {
        Some(c) => format!("{} [wallet_error kind={} code={}] {}", prefix, kind, c, msg),
        None => format!("{} [wallet_error kind={}] {}", prefix, kind, msg),
    }
}

fn ethereum() -> Result<JsValue, String> {
    let window = web_sys::window().ok_or_else(|| "missing window".to_string())?;
    let eth = js_sys::Reflect::get(&window, &JsValue::from_str("ethereum"))
        .map_err(|_| "window.ethereum missing".to_string())?;
    if eth.is_null() || eth.is_undefined() {
        return Err("window.ethereum missing".to_string());
    }
    Ok(eth)
}

async fn ethereum_request(method: &str, params: JsValue) -> Result<JsValue, String> {
    let eth = ethereum()?;
    let request = js_sys::Reflect::get(&eth, &JsValue::from_str("request"))
        .map_err(|_| "ethereum.request missing".to_string())?;
    let request: js_sys::Function = request
        .dyn_into()
        .map_err(|_| "ethereum.request is not a function".to_string())?;

    let args = js_sys::Object::new();
    js_sys::Reflect::set(&args, &JsValue::from_str("method"), &JsValue::from_str(method))
        .map_err(|_| "failed to set method".to_string())?;
    js_sys::Reflect::set(&args, &JsValue::from_str("params"), &params)
        .map_err(|_| "failed to set params".to_string())?;
    let args_js: JsValue = args.into();
    let promise = request
        .call1(&eth, &args_js)
        .map_err(|e| format_wallet_js_error("ethereum.request failed", e))?;
    let promise: js_sys::Promise = promise
        .dyn_into()
        .map_err(|_| "ethereum.request did not return Promise".to_string())?;

    JsFuture::from(promise)
        .await
        .map_err(|e| format_wallet_js_error("ethereum.request rejected", e))
}

pub async fn request_accounts() -> Result<Vec<String>, String> {
    let v = ethereum_request(
        "eth_requestAccounts",
        JsValue::from(js_sys::Array::new()),
    )
    .await?;
    let arr: js_sys::Array = v.dyn_into().map_err(|_| "eth_requestAccounts: not array".to_string())?;
    let mut out = Vec::new();
    for i in 0..arr.length() {
        if let Some(s) = arr.get(i).as_string() {
            out.push(s);
        }
    }
    Ok(out)
}

pub async fn chain_id_u64() -> Result<u64, String> {
    let v = ethereum_request("eth_chainId", JsValue::from(js_sys::Array::new())).await?;
    let s = v.as_string().ok_or_else(|| "eth_chainId: not string".to_string())?;
    let s = s.trim_start_matches("0x");
    u64::from_str_radix(s, 16).map_err(|e| e.to_string())
}

pub async fn sign_typed_data_v4(account: &str, typed_data_json: &str) -> Result<String, String> {
    let params = js_sys::Array::new();
    params.push(&JsValue::from_str(account));
    params.push(&JsValue::from_str(typed_data_json));
    let v = ethereum_request(
        "eth_signTypedData_v4",
        JsValue::from(params),
    )
    .await?;
    v.as_string()
        .ok_or_else(|| "eth_signTypedData_v4: not string".to_string())
}
