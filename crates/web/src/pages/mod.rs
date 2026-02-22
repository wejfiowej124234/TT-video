//! 页面占位，与 05 §四§五、04 §三 对齐；实现时按 05/06 与 api 模块补齐。

use crate::api;
use crate::meta_gate::{MetaGate, MetaGateState};
use crate::wallet;
use yew::prelude::*;

#[function_component(PageHome)]
pub fn page_home() -> Html {
    let loading = use_state(|| true);
    let error = use_state(|| Option::<String>::None);
    let health = use_state(|| Option::<String>::None);

    let loading_for_effect = loading.clone();
    let error_for_effect = error.clone();
    let health_for_effect = health.clone();

    use_effect_with((), move |_| {
        let loading = loading_for_effect.clone();
        let error = error_for_effect.clone();
        let health = health_for_effect.clone();
        wasm_bindgen_futures::spawn_local(async move {
            loading.set(true);
            error.set(None);
            match api::get_health().await {
                Ok(s) => {
                    health.set(Some(s));
                }
                Err(e) => {
                    error.set(Some(e));
                }
            }
            loading.set(false);
        });
        || ()
    });

    let content = if *loading {
        html! { <p>{ "加载中…" }</p> }
    } else if let Some(ref e) = *error {
        html! { <p class="error">{ "API 错误: " }{ e.as_str() }</p> }
    } else if let Some(ref s) = *health {
        html! { <p>{ "Backend 健康: " }{ s.as_str() }</p> }
    } else {
        html! { <p>{ "TravelTrust · 游客 · 导游 · 仲裁" }</p> }
    };

    html! {
        <section>
            <h2>{ "首页" }</h2>
            { content }
        </section>
    }
}

#[function_component(PageAuth)]
pub fn page_auth() -> Html {
    html! {
        <section>
            <h2>{ "登录 / 注册" }</h2>
            <p>{ "占位：04 §三 auth 对接" }</p>
        </section>
    }
}

#[function_component(PageMe)]
pub fn page_me() -> Html {
    let loading = use_state(|| true);
    let error = use_state(|| Option::<String>::None);
    let me = use_state(|| Option::<api::MeResponse>::None);

    {
        let loading = loading.clone();
        let error = error.clone();
        let me = me.clone();
        use_effect_with((), move |_| {
            wasm_bindgen_futures::spawn_local(async move {
                loading.set(true);
                error.set(None);
                match api::get_me().await {
                    Ok(v) => me.set(Some(v)),
                    Err(e) => error.set(Some(e)),
                }
                loading.set(false);
            });
            || ()
        });
    }

    let content = if *loading {
        html! { <p>{ "加载中…" }</p> }
    } else if let Some(ref e) = *error {
        html! { <p class="error">{ "API 错误: " }{ e }</p> }
    } else if let Some(ref v) = *me {
        let pretty = serde_json::to_string_pretty(&v.user).unwrap_or_else(|_| "{}".to_string());
        html! {
            <div>
                <p>{ "status: " }{ v.status.clone() }</p>
                <pre>{ pretty }</pre>
            </div>
        }
    } else {
        html! { <p>{ "无数据" }</p> }
    };

    html! {
        <section>
            <h2>{ "个人中心" }</h2>
            { content }
        </section>
    }
}

#[function_component(PageOrders)]
pub fn page_orders() -> Html {
    let loading = use_state(|| true);
    let error = use_state(|| Option::<String>::None);
    let orders = use_state(|| Option::<api::ListResponse<api::OrderSummary>>::None);

    let order_id = use_state(|| "demo-order-1".to_string());
    let action_result = use_state(|| Option::<String>::None);
    let last_idempotency_key = use_state(|| Option::<String>::None);
    let last_request_id = use_state(|| Option::<String>::None);
    let action_in_flight = use_state(|| false);

    let meta_gate = use_context::<MetaGate>();

    let refresh = {
        let loading = loading.clone();
        let error = error.clone();
        let orders = orders.clone();
        Callback::from(move |_| {
            let loading = loading.clone();
            let error = error.clone();
            let orders = orders.clone();
            wasm_bindgen_futures::spawn_local(async move {
                loading.set(true);
                error.set(None);
                match api::list_orders().await {
                    Ok(v) => orders.set(Some(v)),
                    Err(e) => error.set(Some(e)),
                }
                loading.set(false);
            });
        })
    };

    {
        let refresh = refresh.clone();
        use_effect_with((), move |_| {
            refresh.emit(());
            || ()
        });
    }

    let expected_chain_id: Option<u64> = option_env!("TRAVELTRUST_CHAIN_ID").and_then(|s| s.parse().ok());
    let verifying_contract: Option<String> = option_env!("TRAVELTRUST_VERIFYING_CONTRACT").map(|s| s.to_string());

    let sign_and_submit = {
        let order_id = order_id.clone();
        let action_result = action_result.clone();
        let refresh = refresh.clone();
        let meta_gate = meta_gate.clone();
        let last_idempotency_key = last_idempotency_key.clone();
        let last_request_id = last_request_id.clone();
        let action_in_flight = action_in_flight.clone();
        Callback::from(move |action: String| {
            let order_id = (*order_id).clone();
            let action_result = action_result.clone();
            let refresh = refresh.clone();
            let meta_gate = meta_gate.clone();
            let last_idempotency_key = last_idempotency_key.clone();
            let last_request_id = last_request_id.clone();
            let action_in_flight = action_in_flight.clone();

            let expected_chain_id = expected_chain_id;
            let verifying_contract = verifying_contract.clone();

            wasm_bindgen_futures::spawn_local(async move {
                if *action_in_flight {
                    // 防抖：同一页面同一时刻只允许一个写动作进行。
                    return;
                }
                action_in_flight.set(true);
                action_result.set(None);

                // P0: 版本/SSOT 绑定门禁（启动 /meta）；不兼容即拒绝关键写操作。
                let Some(meta_gate) = meta_gate else {
                    action_result
                        .set(Some("/meta 门禁未初始化：为避免写操作口径漂移，前端拒绝签名/提交".to_string()));
                    action_in_flight.set(false);
                    return;
                };
                match &meta_gate.state {
                    MetaGateState::Loading => {
                        action_result.set(Some(
                            "/meta 加载中：为避免不兼容写操作，前端暂时拒绝提交（稍后再试）".to_string(),
                        ));
                        action_in_flight.set(false);
                        return;
                    }
                    MetaGateState::Error(e) => {
                        action_result.set(Some(format!(
                            "/meta 拉取失败：{}。按 P0 规则：不得写；请先恢复后端或切换网络。",
                            e
                        )));
                        action_in_flight.set(false);
                        return;
                    }
                    MetaGateState::Ready {
                        meta,
                        compatible,
                        reason,
                    } => {
                        if !compatible {
                            let pretty = serde_json::to_string_pretty(meta)
                                .unwrap_or_else(|_| "{}".to_string());
                            action_result.set(Some(format!(
                                "版本/SSOT 不兼容，拒绝写操作：{}\n/meta=\n{}",
                                reason.clone().unwrap_or_else(|| "unknown".to_string()),
                                pretty
                            )));
                            action_in_flight.set(false);
                            return;
                        }
                    }
                }

                let Some(expected_chain_id) = expected_chain_id else {
                    action_result.set(Some("缺少 build-time TRAVELTRUST_CHAIN_ID：为避免 domain 分离失效，前端拒绝签名".to_string()));
                    action_in_flight.set(false);
                    return;
                };
                let Some(verifying_contract) = verifying_contract else {
                    action_result.set(Some("缺少 build-time TRAVELTRUST_VERIFYING_CONTRACT：前端拒绝签名".to_string()));
                    action_in_flight.set(false);
                    return;
                };

                // P0: EIP-712 Domain Separator 写死（build-time expected SSOT version），不可依赖运行时 /meta。
                let ssot_version = match MetaGate::expected_ssot_version_for_domain() {
                    Ok(v) => v.to_string(),
                    Err(e) => {
                        action_result.set(Some(e));
                        action_in_flight.set(false);
                        return;
                    }
                };

                let chain_id = match wallet::chain_id_u64().await {
                    Ok(v) => v,
                    Err(e) => {
                        let hint = if e.contains("kind=unauthorized") {
                            "下一步：在钱包中授权本 DApp 访问账户/链信息后重试。"
                        } else {
                            "下一步：检查钱包是否已连接，并确认网络/插件正常。"
                        };
                        action_result.set(Some(format!("读取 chainId 失败: {}\n{}", e, hint)));
                        action_in_flight.set(false);
                        return;
                    }
                };
                if chain_id != expected_chain_id {
                    action_result.set(Some(format!(
                        "chainId 不匹配：expected={} got={}（前端拒绝签名）。下一步：切换钱包网络到期望链后再试。",
                        expected_chain_id, chain_id
                    )));
                    action_in_flight.set(false);
                    return;
                }

                let accounts = match wallet::request_accounts().await {
                    Ok(v) if !v.is_empty() => v,
                    Ok(_) => {
                        action_result.set(Some("未获取到账户（钱包拒绝/未连接）".to_string()));
                        action_in_flight.set(false);
                        return;
                    }
                    Err(e) => {
                        let hint = if e.contains("kind=user_rejected") {
                            "下一步：用户拒绝连接；不会产生任何写入。若要继续，请重新点击并在钱包里确认。"
                        } else if e.contains("kind=request_pending") {
                            "下一步：钱包已有待处理请求；请打开钱包完成/取消后再试。"
                        } else {
                            "下一步：检查钱包是否解锁、站点权限、以及是否被浏览器拦截弹窗。"
                        };
                        action_result.set(Some(format!("请求账户失败: {}\n{}", e, hint)));
                        action_in_flight.set(false);
                        return;
                    }
                };
                let signer = accounts[0].clone();

                let nonce = uuid::Uuid::new_v4().to_string();
                let ts_ms: i64 = (js_sys::Date::now() as i64).max(0);

                // P0: 写操作幂等必须在“用户侧”闭合：生成并保留 request/idempotency，写失败/超时后用于审计与人工恢复。
                let request_id = uuid::Uuid::new_v4().to_string();
                let idempotency_key = format!(
                    "tt:{}:{}:{}",
                    order_id,
                    action,
                    uuid::Uuid::new_v4().to_string()
                );
                last_request_id.set(Some(request_id.clone()));
                last_idempotency_key.set(Some(idempotency_key.clone()));

                let action_kind = action.clone();
                let ssot_domain_version = ssot_version.clone();
                let ssot_message_version = ssot_version.clone();
                let verifying_contract_domain = verifying_contract.clone();
                let verifying_contract_req = verifying_contract.clone();
                let order_id_msg = order_id.clone();
                let nonce_msg = nonce.clone();

                let typed_data = serde_json::json!({
                    "types": {
                        "EIP712Domain": [
                            {"name":"name","type":"string"},
                            {"name":"version","type":"string"},
                            {"name":"chainId","type":"uint256"},
                            {"name":"verifyingContract","type":"address"}
                        ],
                        "Intent": [
                            {"name":"action","type":"string"},
                            {"name":"orderId","type":"string"},
                            {"name":"nonce","type":"string"},
                            {"name":"tsMs","type":"uint256"},
                            {"name":"apiBase","type":"string"},
                            {"name":"ssotVersion","type":"string"}
                        ]
                    },
                    "primaryType": "Intent",
                    "domain": {
                        "name": "TravelTrust",
                        "version": ssot_domain_version,
                        "chainId": chain_id,
                        "verifyingContract": verifying_contract_domain
                    },
                    "message": {
                        "action": action_kind,
                        "orderId": order_id_msg,
                        "nonce": nonce_msg,
                        "tsMs": ts_ms,
                        "apiBase": api::api_base_url(),
                        "ssotVersion": ssot_message_version
                    }
                });
                let typed_data_json = match serde_json::to_string(&typed_data) {
                    Ok(s) => s,
                    Err(e) => {
                        action_result.set(Some(format!("typed_data 序列化失败: {}", e)));
                        action_in_flight.set(false);
                        return;
                    }
                };

                let signature = match wallet::sign_typed_data_v4(&signer, &typed_data_json).await {
                    Ok(s) => s,
                    Err(e) => {
                        let hint = if e.contains("kind=user_rejected") {
                            "下一步：用户拒签；不会提交到后端。若要继续，请重新点击并在钱包中确认签名。"
                        } else if e.contains("kind=request_pending") {
                            "下一步：钱包已有待处理签名请求；请先在钱包里处理。"
                        } else {
                            "下一步：确认钱包网络正确、站点权限允许签名，必要时重启钱包/刷新页面。"
                        };
                        action_result.set(Some(format!("签名失败: {}\n{}", e, hint)));
                        action_in_flight.set(false);
                        return;
                    }
                };

                let body = api::SignedIntentRequest {
                    chain_id,
                    verifying_contract: verifying_contract_req,
                    signer,
                    signature,
                    typed_data: typed_data,
                    intent_nonce: Some(nonce),
                    intent_ts_ms: Some(ts_ms),
                };

                let resp = match action.as_str() {
                    "confirm_completion" => {
                        api::post_confirm_completion_intent(
                            &order_id,
                            &body,
                            Some(&request_id),
                            Some(&idempotency_key),
                        )
                        .await
                    }
                    "open_dispute" => {
                        api::post_open_dispute_intent(
                            &order_id,
                            &body,
                            Some(&request_id),
                            Some(&idempotency_key),
                        )
                        .await
                    }
                    _ => Err("unknown action".to_string()),
                };

                match resp {
                    Ok(v) => {
                        let pretty = serde_json::to_string_pretty(&v).unwrap_or_else(|_| "{}".to_string());
                        let finality_hint = meta_gate
                            .meta()
                            .and_then(|m| m.finality_n)
                            .map(|n| format!(
                                "确认策略：链上终态需等待 >= {} confirmations（不同链 finality 不同；该值来自 /meta FINALITY_N）。",
                                n
                            ))
                            .unwrap_or_else(|| "确认策略：链上终态需等待 confirmations（以 /meta FINALITY_N 为准）。".to_string());

                        let authority_hint = meta_gate
                            .meta()
                            .and_then(|m| m.authority.clone())
                            .map(|a| {
                                if a.degraded_mode {
                                    format!(
                                        "权威源：{}（degraded_mode=true；关键写可能被冻结/需等待最终确认）",
                                        a.source
                                    )
                                } else {
                                    format!("权威源：{}（degraded_mode=false）", a.source)
                                }
                            })
                            .unwrap_or_else(|| "权威源：以 /meta.authority 为准".to_string());
                        action_result.set(Some(format!(
                            "OK (accepted):\n{}\n\nrequest_id={}\nidempotency_key={}\n\n{}\n{}\n\n规则：不得自动重试写操作；若页面刷新/超时导致不确定，请走“查询订单状态/对账”恢复路径。",
                            pretty,
                            request_id,
                            idempotency_key
                            ,
                            finality_hint,
                            authority_hint
                        )));
                        refresh.emit(());
                        action_in_flight.set(false);
                    }
                    Err(e) => {
                        let hint = if e.contains("timeout after") {
                            "下一步：这是超时/不确定性错误，禁止自动重试；请立即点击“查询订单状态（恢复路径）”。"
                        } else if e.contains("http 403") {
                            "下一步：后端拒绝该 intent（门禁/黑名单/allowlist）；请核对钱包地址、合约 allowlist 与网络。"
                        } else {
                            "下一步：不要盲目重试；先查询订单状态，必要时提交 request_id/idempotency_key 给客服/仲裁。"
                        };
                        action_result.set(Some(format!(
                            "写操作失败/超时（不确定成功与否）：{}\n\nrequest_id={}\nidempotency_key={}\n\n{}\n\n按 P0 规则：禁止自动重试写操作；请使用下方“查询订单状态”进行恢复与核对。",
                            e,
                            request_id,
                            idempotency_key,
                            hint
                        )));
                        action_in_flight.set(false);
                    }
                }
            });
        })
    };

    let query_order_status = {
        let order_id = order_id.clone();
        let action_result = action_result.clone();
        Callback::from(move |_| {
            let order_id = (*order_id).clone();
            let action_result = action_result.clone();
            wasm_bindgen_futures::spawn_local(async move {
                match api::get_order_by_id(&order_id).await {
                    Ok(v) => {
                        let pretty = serde_json::to_string_pretty(&v)
                            .unwrap_or_else(|_| "{}".to_string());
                        action_result.set(Some(format!("订单状态：\n{}", pretty)));
                    }
                    Err(e) => action_result.set(Some(format!("查询订单状态失败: {}", e))),
                }
            });
        })
    };

    let on_order_id_input = {
        let order_id = order_id.clone();
        Callback::from(move |e: InputEvent| {
            if let Some(input) = e.target_dyn_into::<web_sys::HtmlInputElement>() {
                order_id.set(input.value());
            }
        })
    };

    let list = if *loading {
        html! { <p>{ "加载中…" }</p> }
    } else if let Some(ref e) = *error {
        html! { <p class="error">{ "API 错误: " }{ e }</p> }
    } else if let Some(ref v) = *orders {
        if v.items.is_empty() {
            html! { <p>{ "暂无订单（占位实现默认返回空列表）" }</p> }
        } else {
            html! {
                <ul>
                    { for v.items.iter().map(|o| html!{ <li>{ format!("{} ({})", o.id, o.status) }</li> }) }
                </ul>
            }
        }
    } else {
        html! { <p>{ "无数据" }</p> }
    };

    html! {
        <section>
            <h2>{ "订单" }</h2>
            <h3>{ "版本/SSOT 门禁（/meta）" }</h3>
            {
                if let Some(ref gate) = meta_gate {
                    match &gate.state {
                        MetaGateState::Loading => html!{ <p>{ "/meta: loading…（写操作禁用）" }</p> },
                        MetaGateState::Error(e) => html!{ <p class="error">{ format!("/meta: error={}（写操作禁用）", e) }</p> },
                        MetaGateState::Ready { meta, compatible, reason } => {
                            let pretty = serde_json::to_string_pretty(meta).unwrap_or_else(|_| "{}".to_string());
                            if *compatible {
                                html!{<details open={false}><summary>{"/meta: compatible（写操作允许）"}</summary><pre>{ pretty }</pre></details>}
                            } else {
                                html!{<details open={true}><summary>{ format!("/meta: incompatible（写操作禁用）：{}", reason.clone().unwrap_or_else(|| "unknown".to_string())) }</summary><pre>{ pretty }</pre></details>}
                            }
                        }
                    }
                } else {
                    html!{ <p class="error">{ "/meta: context missing（写操作禁用）" }</p> }
                }
            }

            <button onclick={{
                let refresh = refresh.clone();
                Callback::from(move |_| refresh.emit(()))
            }}>{ "刷新" }</button>
            { list }

            <h3>{ "签名动作（intent → Backend Outbox）" }</h3>
            <p>{ "规则：前端只提交签名 intent，不直接推进订单状态；状态以查询为准。" }</p>
            <label>{ "Order ID: " }<input value={(*order_id).clone()} oninput={on_order_id_input} /></label>
            <div>
                <button disabled={ *action_in_flight || !meta_gate.as_ref().map(|g| g.compatible()).unwrap_or(false) } onclick={{
                    let sign_and_submit = sign_and_submit.clone();
                    Callback::from(move |_| sign_and_submit.emit("confirm_completion".to_string()))
                }}>{ "确认完成（签名）" }</button>
                <button disabled={ *action_in_flight || !meta_gate.as_ref().map(|g| g.compatible()).unwrap_or(false) } onclick={{
                    let sign_and_submit = sign_and_submit.clone();
                    Callback::from(move |_| sign_and_submit.emit("open_dispute".to_string()))
                }}>{ "发起争议（签名）" }</button>
            </div>

            <div>
                <button onclick={query_order_status}>{ "查询订单状态（恢复路径）" }</button>
                if let Some(ref k) = *last_idempotency_key {
                    <p>{ format!("last idempotency_key: {}", k) }</p>
                }
                if let Some(ref r) = *last_request_id {
                    <p>{ format!("last request_id: {}", r) }</p>
                }
            </div>

            if let Some(ref r) = *action_result {
                <pre>{ r }</pre>
            }
        </section>
    }
}

#[function_component(PageDisputes)]
pub fn page_disputes() -> Html {
    let loading = use_state(|| true);
    let error = use_state(|| Option::<String>::None);
    let disputes = use_state(|| Option::<api::ListResponse<api::DisputeSummary>>::None);

    let refresh = {
        let loading = loading.clone();
        let error = error.clone();
        let disputes = disputes.clone();
        Callback::from(move |_| {
            let loading = loading.clone();
            let error = error.clone();
            let disputes = disputes.clone();
            wasm_bindgen_futures::spawn_local(async move {
                loading.set(true);
                error.set(None);
                match api::list_disputes().await {
                    Ok(v) => disputes.set(Some(v)),
                    Err(e) => error.set(Some(e)),
                }
                loading.set(false);
            });
        })
    };

    {
        let refresh = refresh.clone();
        use_effect_with((), move |_| {
            refresh.emit(());
            || ()
        });
    }

    let list = if *loading {
        html! { <p>{ "加载中…" }</p> }
    } else if let Some(ref e) = *error {
        html! { <p class="error">{ "API 错误: " }{ e }</p> }
    } else if let Some(ref v) = *disputes {
        if v.items.is_empty() {
            html! { <p>{ "暂无争议（占位实现默认返回空列表）" }</p> }
        } else {
            html! {
                <ul>
                    { for v.items.iter().map(|d| html!{ <li>{ format!("{} ({})", d.id, d.status) }</li> }) }
                </ul>
            }
        }
    } else {
        html! { <p>{ "无数据" }</p> }
    };

    html! {
        <section>
            <h2>{ "争议" }</h2>
            <button onclick={{
                let refresh = refresh.clone();
                Callback::from(move |_| refresh.emit(()))
            }}>{ "刷新" }</button>
            { list }
        </section>
    }
}
