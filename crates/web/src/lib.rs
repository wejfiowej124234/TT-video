//! TravelTrust 前端入口（Yew / WASM），与 05/06、04 §三 对齐。
//! 路由：yew-router（05 §三）；首页、auth、me、orders、disputes；api 模块占位；实现时按 05 §四§五、01 §7 钱包签与 04 接口补齐。

mod api;
mod meta_gate;
mod pages;
mod wallet;

use pages::{PageAuth, PageDisputes, PageHome, PageMe, PageOrders};
use meta_gate::{use_meta_gate, MetaGate};
use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use yew::prelude::*;
use yew_router::prelude::*;

#[derive(Clone, Copy, PartialEq, Eq, Routable)]
enum AppRoute {
    #[at("/")]
    Home,
    #[at("/auth")]
    Auth,
    #[at("/me")]
    Me,
    #[at("/orders")]
    Orders,
    #[at("/disputes")]
    Disputes,
    #[not_found]
    #[at("/404")]
    NotFound,
}

fn switch(route: AppRoute) -> Html {
    match route {
        AppRoute::Home => html! { <PageHome /> },
        AppRoute::Auth => html! { <PageAuth /> },
        AppRoute::Me => html! { <PageMe /> },
        AppRoute::Orders => html! { <PageOrders /> },
        AppRoute::Disputes => html! { <PageDisputes /> },
        AppRoute::NotFound => html! { <h2>{ "404" }</h2> },
    }
}

#[function_component(App)]
fn app() -> Html {
    let meta_gate = use_meta_gate();
    html! {
        <ContextProvider<MetaGate> context={meta_gate}>
            <BrowserRouter>
                <main class="app">
                    <header>
                        <h1>{ "TravelTrust" }</h1>
                        <nav>
                            <Link<AppRoute> to={AppRoute::Home}>{ "首页" }</Link<AppRoute>>
                            <Link<AppRoute> to={AppRoute::Auth}>{ "登录/注册" }</Link<AppRoute>>
                            <Link<AppRoute> to={AppRoute::Me}>{ "个人中心" }</Link<AppRoute>>
                            <Link<AppRoute> to={AppRoute::Orders}>{ "订单" }</Link<AppRoute>>
                            <Link<AppRoute> to={AppRoute::Disputes}>{ "争议" }</Link<AppRoute>>
                        </nav>
                    </header>
                    <Switch<AppRoute> render={switch} />
                </main>
            </BrowserRouter>
        </ContextProvider<MetaGate>>
    }
}

#[wasm_bindgen(start)]
pub fn run_app() {
    install_wallet_provider_change_listeners();
    yew::Renderer::<App>::new().render();
}

fn install_wallet_provider_change_listeners() {
    let Some(window) = web_sys::window() else {
        return;
    };

    // If an injected EIP-1193 provider exists, listen for account/chain changes.
    // Minimal safe behavior: clear any browser state (if used) and hard-reload.
    // Rationale: prevent stale identity/order view after MetaMask account/chain switch.
    let ethereum = js_sys::Reflect::get(&window, &JsValue::from_str("ethereum"));
    let Ok(ethereum) = ethereum else {
        return;
    };
    if ethereum.is_undefined() || ethereum.is_null() {
        return;
    }

    let on_change = Closure::<dyn FnMut(JsValue)>::new(move |_v: JsValue| {
        if let Some(window) = web_sys::window() {
            // Best-effort cleanup; we aim to avoid persisting JWT in web storage.
            if let Ok(Some(storage)) = window.local_storage() {
                let _ = storage.clear();
            }
            if let Ok(Some(storage)) = window.session_storage() {
                let _ = storage.clear();
            }
            let _ = window.location().reload();
        }
    });

    // ethereum.on('chainChanged', handler)
    // ethereum.on('accountsChanged', handler)
    for event_name in ["chainChanged", "accountsChanged"] {
        let on = js_sys::Reflect::get(&ethereum, &JsValue::from_str("on"));
        let Ok(on) = on else { continue };
        let on_fn: Option<js_sys::Function> = on.dyn_into().ok();
        let Some(on_fn) = on_fn else { continue };
        let _ = on_fn.call2(
            &ethereum,
            &JsValue::from_str(event_name),
            on_change.as_ref().unchecked_ref(),
        );
    }

    // Leak the closure for the app lifetime; this is a front-end entrypoint singleton.
    on_change.forget();
}
