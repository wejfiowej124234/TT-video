#!/usr/bin/env python3
"""V9 Staging Full Reality Regression probe (post-deploy). ≠ Production GO."""
from __future__ import annotations

import json
import ssl
import urllib.request
from datetime import datetime, timezone
from urllib.error import HTTPError

WEB = "https://tt-web-staging.fly.dev"
API = "https://tt-api-staging.fly.dev"
TIP = "f64e7185df07314f84d621b82eb5c4a5d5332aa3"
OPS = "3e356617a498b0faac42e4ae457343d36294a770"
CTX = ssl.create_default_context()


def fetch(url: str, timeout: int = 40, binary: bool = False):
    req = urllib.request.Request(url, headers={"User-Agent": "tt-v9-reality", "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            data = r.read()
            return r.status, data if binary else data.decode("utf-8", "replace"), dict(r.headers)
    except HTTPError as e:
        body = e.read() if hasattr(e, "read") else b""
        return e.code, body if binary else body.decode("utf-8", "replace"), {}
    except Exception as e:  # noqa: BLE001
        return 0, str(e), {}


def main() -> int:
    metrics = {
        "FRONTEND_DRIFT": 0,
        "ADMIN_UI_UX_DRIFT": 0,
        "BACKEND_DRIFT": 0,
        "DB_SCHEMA_DRIFT": 0,
        "CMS_DATA_TRUTH_CONFLICTS": 0,
        "OBJECT_STORAGE_DRIFT": 0,
        "INDEXER_DRIFT": 0,
        "STALE_RUNTIME_OVERLAY": 0,
        "OLD_VERSION_ACTIVE_REFS": 0,
        "WEB3_TRUTH_CONFLICTS": 0,
        "GUIDE_BOND_LIFECYCLE": 0,
    }
    notes: list[str] = []
    checks: list[dict] = []

    def add(name: str, ok: bool, metric: str | None = None, detail: str = "") -> None:
        checks.append({"name": name, "ok": bool(ok), "detail": detail})
        if not ok and metric:
            metrics[metric] += 1
            notes.append(f"{metric}:{name}:{detail}")

    st, body, _ = fetch(f"{WEB}/api/release-identity")
    ri = {}
    try:
        ri = json.loads(body)
    except Exception:  # noqa: BLE001
        pass
    add("release_identity_http", st == 200, "FRONTEND_DRIFT", f"status={st}")
    add(
        "release_identity_sha",
        str(ri.get("git_sha", "")).startswith(TIP[:12]),
        "FRONTEND_DRIFT",
        str(ri.get("git_sha")),
    )
    add("no_ops_mother_as_tip", ri.get("git_sha") != OPS, "OLD_VERSION_ACTIVE_REFS", str(ri.get("git_sha")))
    add("build_time_present", bool(ri.get("build_time")), "FRONTEND_DRIFT", str(ri.get("build_time")))

    pages = [
        "/",
        "/market",
        "/traveltrust",
        "/did-rank",
        "/community",
        "/auth/login",
        "/auth/register",
        "/governance/proposals",
    ]
    for p in pages:
        st, html, _ = fetch(f"{WEB}{p}")
        ok = st == 200 and isinstance(html, str) and len(html) > 500
        add(f"page{p}", ok, "FRONTEND_DRIFT", f"status={st} len={len(html) if isinstance(html, str) else 0}")
        if isinstance(html, str) and ok and "daa5ae87" in html and p in ("/", "/market"):
            add(f"stale_daa5_{p}", False, "OLD_VERSION_ACTIVE_REFS", "daa5ae87 in html")

    st, mhtml, _ = fetch(f"{WEB}/market")
    if isinstance(mhtml, str):
        add(
            "market_has_content",
            ("市场" in mhtml) or ("Market" in mhtml) or ("market" in mhtml.lower()),
            "FRONTEND_DRIFT",
            "market markers",
        )

    for role in ["traveler", "guide", "merchant", "provider", "acquisition", "region_steward"]:
        st, data, _ = fetch(f"{WEB}/media/traveltrust/roles/{role}.mp4", binary=True)
        ok = st == 200 and isinstance(data, bytes) and len(data) > 1_000_000
        head = data[:40] if isinstance(data, bytes) else b""
        ptr = head.startswith(b"version https://git-lfs")
        add(
            f"promo_{role}",
            ok and not ptr,
            "CMS_DATA_TRUTH_CONFLICTS",
            f"status={st} size={len(data) if isinstance(data, bytes) else 0} ptr={ptr}",
        )
        if role == "region_steward" and isinstance(data, bytes) and not ptr:
            add("steward_size", len(data) == 82695358, "CMS_DATA_TRUTH_CONFLICTS", str(len(data)))

    for p in ["/admin", "/admin/login", "/adm"]:
        st, _, _ = fetch(f"{WEB}{p}")
        add(f"admin_surface{p}", st != 0 and st < 500, "ADMIN_UI_UX_DRIFT", f"status={st}")

    st, meta_raw, _ = fetch(f"{API}/meta")
    meta = {}
    try:
        meta = json.loads(meta_raw)
    except Exception:  # noqa: BLE001
        pass
    add("api_meta", st == 200, "BACKEND_DRIFT", f"status={st}")
    chain = meta.get("chain") or {}
    cid = chain.get("chain_id") or chain.get("chainId")
    add("api_sepolia", str(cid) == "11155111" or cid == 11155111, "WEB3_TRUTH_CONFLICTS", str(cid))
    contracts = chain.get("contracts") or meta.get("contracts") or {}
    for k in ["escrow_factory_address", "fee_router_address", "governor_address"]:
        add(f"meta_{k}", bool(contracts.get(k)), "WEB3_TRUTH_CONFLICTS", str(contracts.get(k)))

    st, _, _ = fetch(f"{API}/health")
    add("api_health", st == 200, "BACKEND_DRIFT", f"status={st}")
    st, _, _ = fetch(f"{API}/api/v1/me")
    add("api_me_unauth_shape", st in (401, 403, 200), "BACKEND_DRIFT", f"status={st}")

    for path in ["/api/v1/catalog/destinations", "/api/v1/cms/health", "/api/v1/discover/orders"]:
        st, _, _ = fetch(f"{API}{path}")
        metric = "CMS_DATA_TRUTH_CONFLICTS" if ("catalog" in path or "cms" in path) else "BACKEND_DRIFT"
        add(f"api{path}", st in (200, 401, 403, 404) and st != 0, metric, f"status={st}")

    st, _, _ = fetch("https://traveltrust-community-media.fly.storage.tigris.dev/", binary=True)
    add("object_storage_endpoint", st in (200, 403, 404) and st != 0, "OBJECT_STORAGE_DRIFT", f"status={st}")

    st, idx, _ = fetch(f"{API}/api/v1/indexer/status")
    if st == 404:
        st, idx, _ = fetch(f"{API}/api/v1/web3/indexer/status")
    add("indexer_status_surface", st in (200, 401, 403, 404, 501, 503), "INDEXER_DRIFT", f"status={st}")
    if st == 200:
        try:
            j = json.loads(idx)
            add("indexer_json", isinstance(j, dict), "INDEXER_DRIFT", str(list(j)[:5]))
        except Exception as e:  # noqa: BLE001
            add("indexer_json", False, "INDEXER_DRIFT", str(e))

    st, bake, _ = fetch(f"{WEB}/tt-release-identity.bake.json")
    if st == 200:
        try:
            bj = json.loads(bake)
            add(
                "bake_sha_match",
                str(bj.get("git_sha", "")).startswith(TIP[:12]),
                "STALE_RUNTIME_OVERLAY",
                str(bj.get("git_sha")),
            )
        except Exception as e:  # noqa: BLE001
            add("bake_json", False, "STALE_RUNTIME_OVERLAY", str(e))
    else:
        notes.append(f"bake_json_status={st}")

    st, _, _ = fetch(f"{API}/api/v1/admin/health")
    add("admin_health_or_auth", st in (200, 401, 403, 404), "DB_SCHEMA_DRIFT", f"status={st}")

    bond_doc = open(
        "docs/runbook/TT-TTG-V9-GUIDE-ORDER-PERFORMANCE-BOND-LOCAL-CANDIDATE-LATEST.md",
        encoding="utf-8",
    ).read()
    add(
        "bond_local_candidate_doc",
        ("LOCAL_CANDIDATE" in bond_doc) or ("Local Candidate" in bond_doc),
        "GUIDE_BOND_LIFECYCLE",
        "doc",
    )
    gb = contracts.get("guide_order_performance_bond_address") or contracts.get("ttg_v9_guide_order_bond")
    if gb:
        add("bond_unexpected_meta_address", False, "WEB3_TRUTH_CONFLICTS", str(gb))
    # Staging on-chain lifecycle Reality is not available: Local Candidate SSOT says not Staging/Mainnet.
    add(
        "bond_staging_onchain_reality",
        False,
        "GUIDE_BOND_LIFECYCLE",
        "NOT_DEPLOYED_ON_STAGING_CHAIN_PER_LOCAL_CANDIDATE_SSOT",
    )

    product_keys = [k for k in metrics if k != "GUIDE_BOND_LIFECYCLE"]
    out = {
        "stamp": "V9_STAGING_FULL_REALITY_REGRESSION_RESULT",
        "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "release_artifact": TIP,
        "post_deploy_identity": {
            k: ri.get(k) for k in ("git_sha", "build_time", "image_digest", "artifact_sha")
        },
        "metrics": metrics,
        "checks": checks,
        "notes": notes,
        "all_zero_product_metrics": all(metrics[k] == 0 for k in product_keys),
        "guide_bond_lifecycle_pass": metrics["GUIDE_BOND_LIFECYCLE"] == 0,
        "V9_STAGING_FULL_REALITY_PASS": "NOT_STAMPED",
    }
    path = "evidence/GO_ttg_v9_audit/V9_STAGING_FULL_REALITY_REGRESSION_RESULT.json"
    open(path, "w", encoding="utf-8").write(json.dumps(out, indent=2) + "\n")
    print(json.dumps({"metrics": metrics, "identity": out["post_deploy_identity"], "fail": [c for c in checks if not c["ok"]]}, indent=2))
    print("WROTE", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
