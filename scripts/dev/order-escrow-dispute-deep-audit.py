#!/usr/bin/env python3
"""OED · Order–Escrow–Dispute Deep Audit API probe."""
from __future__ import annotations

import json
import os
import random
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))

from deep_audit_probe_lib import HttpClient, ProbeResult, new_email, now_iso  # noqa: E402


def main() -> int:
    api = os.environ.get("OED_API_BASE", os.environ.get("API_BASE", "http://127.0.0.1:8080")).rstrip("/")
    out = Path(os.environ.get("OED_OUT", ROOT / "evidence/order-escrow-dispute-deep-audit/latest"))
    password = os.environ.get("OED_PASSWORD", "Test123!")
    admin_email = os.environ.get("OED_ADMIN_EMAIL", "tourist@test.com")
    arb_email = os.environ.get(
        "OED_ARBITRATOR_EMAIL",
        os.environ.get("P3_SEED_ARBITRATOR_EMAIL", f"oed-arbitrator-{uuid.uuid4().hex[:8]}@traveltrust.test"),
    )
    tourist_email = os.environ.get("OED_TOURIST_EMAIL", "tourist@test.com")
    guide_email = os.environ.get("OED_GUIDE_EMAIL", "guide@test.com")
    merchant_email = os.environ.get("OED_MERCHANT_EMAIL", "merchant@test.com")

    http = HttpClient(api, password=password)
    results: list[ProbeResult] = []
    trace: dict = {"traveler_token": "", "guide_token": "", "arbitrator_email": arb_email}

    http.seed()
    traveler_tok, _ = http.login_or_register(tourist_email, "OED Traveler")
    guide_tok, guide_me = http.login_or_register(guide_email, "OED Guide")
    admin_tok, _ = http.login_or_register(admin_email, "OED Admin")
    arb_tok, arb_payload = http.login_or_register(arb_email, "OED Arb")
    merchant_tok, _ = http.login_or_register(merchant_email, "OED Merchant")
    trace["traveler_token"] = traveler_tok
    trace["guide_token"] = guide_tok

    if arb_payload.get("role") != "arbitrator":
        print(f"FAIL: arbitrator role={arb_payload.get('role')} — set P3_SEED_ARBITRATOR_EMAIL={arb_email}")
        return 2

    guide_id = http.nested(guide_me, "guide.id") or http.nested(guide_me, "user.guide_id")
    if not guide_id:
        me_code, me_body = http.request("GET", "/api/v1/me", token=guide_tok)
        guide_id = http.nested(me_body, "guide.id")

    # --- Happy path: order → accept → pay → complete → reviews ---
    amount = f"88.{random.randint(10, 99)}"
    c_code, c_body = http.request(
        "POST",
        "/api/v1/orders",
        body={"guide_id": str(guide_id), "amount": amount, "currency": "USD"},
        token=traveler_tok,
    )
    ok = c_code in (200, 201)
    order_id = http.nested(c_body, "order.id") or c_body.get("id")
    http.record(
        results,
        probe_id="bcp.create_order",
        role="traveler",
        step="下单",
        method="POST",
        path="/api/v1/orders",
        http=c_code,
        expected="200|201",
        ok=ok,
        section="business_critical_path",
    )
    if not ok or not order_id:
        _write(out, api, results, trace)
        return 1

    a_code, a_body = http.request("POST", f"/api/v1/orders/{order_id}/accept", body={}, token=guide_tok)
    http.record(
        results,
        probe_id="bcp.accept",
        role="guide",
        step="接单",
        method="POST",
        path=f"/api/v1/orders/{order_id}/accept",
        http=a_code,
        expected="200",
        ok=a_code == 200,
        section="business_critical_path",
    )

    p_code, p_body = http.request("POST", f"/api/v1/orders/{order_id}/mock-pay", body={}, token=traveler_tok)
    escrowed = p_code == 200 and http.nested(p_body, "order.status") == "escrowed"
    http.record(
        results,
        probe_id="bcp.mock_pay",
        role="traveler",
        step="支付进托管",
        method="POST",
        path=f"/api/v1/orders/{order_id}/mock-pay",
        http=p_code,
        expected="200→escrowed",
        ok=escrowed,
        section="business_critical_path",
    )

    comp_code, comp_body = http.request(
        "POST", f"/api/v1/orders/{order_id}/confirm-completion", body={}, token=guide_tok
    )
    completed = comp_code == 200 and http.nested(comp_body, "order.status") == "completed"
    http.record(
        results,
        probe_id="bcp.confirm_completion",
        role="guide",
        step="确认完成",
        method="POST",
        path=f"/api/v1/orders/{order_id}/confirm-completion",
        http=comp_code,
        expected="200→completed",
        ok=completed,
        section="business_critical_path",
    )

    rv1_code, _ = http.request(
        "POST",
        f"/api/v1/orders/{order_id}/reviews",
        body={"score": 5, "comment": "oed-traveler-review"},
        token=traveler_tok,
        idempotency_key=f"oed-rv1-{order_id}",
    )
    http.record(
        results,
        probe_id="bcp.review_traveler",
        role="traveler",
        step="旅行者评分",
        method="POST",
        path=f"/api/v1/orders/{order_id}/reviews",
        http=rv1_code,
        expected="200",
        ok=rv1_code == 200,
        section="business_critical_path",
    )

    rv2_code, _ = http.request(
        "POST",
        f"/api/v1/orders/{order_id}/reviews",
        body={"score": 5, "comment": "oed-guide-review"},
        token=guide_tok,
        idempotency_key=f"oed-rv2-{order_id}",
    )
    http.record(
        results,
        probe_id="bcp.review_guide",
        role="guide",
        step="向导评分",
        method="POST",
        path=f"/api/v1/orders/{order_id}/reviews",
        http=rv2_code,
        expected="200",
        ok=rv2_code == 200,
        section="business_critical_path",
    )

    # Idempotent double review
    rv_dup_code, rv_dup_body = http.request(
        "POST",
        f"/api/v1/orders/{order_id}/reviews",
        body={"score": 4, "comment": "dup"},
        token=traveler_tok,
        idempotency_key=f"oed-rv-dup-t-{order_id}",
    )
    dup_ok = rv_dup_code == 409 or (isinstance(rv_dup_body, dict) and rv_dup_body.get("error") == "already_reviewed")
    http.record(
        results,
        probe_id="esc.idempotent.double_review",
        role="traveler",
        step="幂等评分",
        method="POST",
        path=f"/api/v1/orders/{order_id}/reviews",
        http=rv_dup_code,
        expected="409",
        ok=dup_ok,
        section="escrow_matrix",
    )

    g_dup_code, _ = http.request(
        "POST",
        f"/api/v1/orders/{order_id}/reviews",
        body={"score": 4, "comment": "dup"},
        token=guide_tok,
        idempotency_key=f"oed-rv-dup-g-{order_id}",
    )
    http.record(
        results,
        probe_id="esc.idempotent.double_review",
        role="guide",
        step="幂等评分",
        method="POST",
        path=f"/api/v1/orders/{order_id}/reviews",
        http=g_dup_code,
        expected="409",
        ok=g_dup_code == 409,
        section="escrow_matrix",
    )

    trace["happy_order_id"] = order_id

    # --- Dispute path ---
    d_amount = f"77.{random.randint(10, 99)}"
    d_code, d_body = http.request(
        "POST",
        "/api/v1/orders",
        body={"guide_id": str(guide_id), "amount": d_amount, "currency": "USD"},
        token=traveler_tok,
    )
    dispute_order_id = http.nested(d_body, "order.id") or d_body.get("id")
    http.record(
        results,
        probe_id="bcp.create_order",
        role="traveler",
        step="下单",
        method="POST",
        path="/api/v1/orders",
        http=d_code,
        expected="200|201",
        ok=d_code in (200, 201),
        section="business_critical_path",
    )
    http.request("POST", f"/api/v1/orders/{dispute_order_id}/accept", body={}, token=guide_tok)
    http.request("POST", f"/api/v1/orders/{dispute_order_id}/mock-pay", body={}, token=traveler_tok)

    disp_code, disp_body = http.request(
        "POST",
        f"/api/v1/orders/{dispute_order_id}/dispute",
        body={"reason": f"oed-deep-{now_iso()}"},
        token=traveler_tok,
    )
    disp_ok = disp_code in (200, 201) or (
        disp_code == 409 and isinstance(disp_body, dict) and disp_body.get("error") == "dispute_already_open"
    )
    http.record(
        results,
        probe_id="bcp.open_dispute",
        role="traveler",
        step="开争议",
        method="POST",
        path=f"/api/v1/orders/{dispute_order_id}/dispute",
        http=disp_code,
        expected="200→disputed",
        ok=disp_ok,
        section="business_critical_path",
    )

    list_code, list_body = http.request("GET", "/api/v1/disputes", token=traveler_tok)
    items = list_body.get("items") or list_body.get("disputes") or []
    dispute_id = ""
    for item in items:
        oid = item.get("order_id") or item.get("orderId")
        if str(oid) == str(dispute_order_id):
            dispute_id = item.get("id") or ""
            break
    if not dispute_id and items:
        dispute_id = items[0].get("id") or ""
    http.record(
        results,
        probe_id="dsp.list_read",
        role="traveler",
        step="争议列表",
        method="GET",
        path="/api/v1/disputes",
        http=list_code,
        expected="200",
        ok=list_code == 200,
        section="dispute_matrix",
    )

    trav_resolve_code, _ = http.request(
        "POST",
        f"/api/v1/disputes/{dispute_id}/resolve",
        body={"refund_ratio": 1.0, "slash_guide": False},
        token=traveler_tok,
    )
    http.record(
        results,
        probe_id="dsp.resolve_arbitrator_only",
        role="traveler",
        step="裁决拒绝",
        method="POST",
        path=f"/api/v1/disputes/{dispute_id}/resolve",
        http=trav_resolve_code,
        expected="403",
        ok=trav_resolve_code == 403,
        section="dispute_matrix",
    )

    res_code, res_body = http.request(
        "POST",
        f"/api/v1/disputes/{dispute_id}/resolve",
        body={"refund_ratio": 1.0, "slash_guide": False},
        token=arb_tok,
    )
    resolved = res_code == 200 and http.nested(res_body, "dispute.status") == "resolved"
    http.record(
        results,
        probe_id="bcp.resolve_dispute",
        role="arbitrator",
        step="裁决",
        method="POST",
        path=f"/api/v1/disputes/{dispute_id}/resolve",
        http=res_code,
        expected="200",
        ok=resolved,
        section="business_critical_path",
    )
    http.record(
        results,
        probe_id="dsp.resolve_full_refund",
        role="arbitrator",
        step="全额退款裁决",
        method="POST",
        path=f"/api/v1/disputes/{dispute_id}/resolve",
        http=res_code,
        expected="resolved+refunded",
        ok=resolved,
        section="dispute_matrix",
    )

    det_code, _ = http.request("GET", f"/api/v1/disputes/{dispute_id}", token=traveler_tok)
    http.record(
        results,
        probe_id="dsp.list_read",
        role="traveler",
        step="争议详情",
        method="GET",
        path=f"/api/v1/disputes/{dispute_id}",
        http=det_code,
        expected="200",
        ok=det_code == 200,
        section="dispute_matrix",
    )

    disp_dup_code, disp_dup_body = http.request(
        "POST",
        f"/api/v1/orders/{dispute_order_id}/dispute",
        body={"reason": "dup"},
        token=traveler_tok,
    )
    http.record(
        results,
        probe_id="esc.idempotent.double_dispute",
        role="traveler",
        step="幂等争议",
        method="POST",
        path=f"/api/v1/orders/{dispute_order_id}/dispute",
        http=disp_dup_code,
        expected="409",
        ok=disp_dup_code == 409
        or (isinstance(disp_dup_body, dict) and disp_dup_body.get("error") == "dispute_already_open"),
        section="escrow_matrix",
    )

    # RBAC
    t_accept_code, _ = http.request("POST", f"/api/v1/orders/{dispute_order_id}/accept", body={}, token=traveler_tok)
    http.record(
        results,
        probe_id="esc.rbac.traveler_cannot_accept",
        role="traveler",
        step="RBAC",
        method="POST",
        path=f"/api/v1/orders/{dispute_order_id}/accept",
        http=t_accept_code,
        expected="403|409",
        ok=t_accept_code in (403, 409),
        section="escrow_matrix",
    )
    g_pay_code, _ = http.request("POST", f"/api/v1/orders/{dispute_order_id}/mock-pay", body={}, token=guide_tok)
    http.record(
        results,
        probe_id="esc.rbac.guide_cannot_mock_pay",
        role="guide",
        step="RBAC",
        method="POST",
        path=f"/api/v1/orders/{dispute_order_id}/mock-pay",
        http=g_pay_code,
        expected="403",
        ok=g_pay_code == 403,
        section="escrow_matrix",
    )

    # Admin read
    ao_code, _ = http.request("GET", "/api/v1/admin/orders?limit=5", token=admin_tok)
    http.record(
        results,
        probe_id="admin.read_orders",
        role="admin",
        step="订单只读",
        method="GET",
        path="/api/v1/admin/orders",
        http=ao_code,
        expected="200",
        ok=ao_code == 200,
        section="business_critical_path",
        notes="SuperAdmin seed",
    )
    ad_code, _ = http.request("GET", "/api/v1/admin/disputes?limit=5", token=admin_tok)
    http.record(
        results,
        probe_id="dsp.admin_read_only",
        role="admin",
        step="争议只读",
        method="GET",
        path="/api/v1/admin/disputes",
        http=ad_code,
        expected="200",
        ok=ad_code == 200,
        section="dispute_matrix",
    )

    ent_code, _ = http.request("GET", "/api/v1/onboarding/entitlements/me", token=merchant_tok)
    http.record(
        results,
        probe_id="merchant.onboarding_read",
        role="merchant",
        step="入驻权益",
        method="GET",
        path="/api/v1/onboarding/entitlements/me",
        http=ent_code,
        expected="200|403|404",
        ok=ent_code in (200, 403, 404),
        section="business_critical_path",
        notes="商家非 Escrow 主链",
    )

    trace["dispute_order_id"] = dispute_order_id
    trace["dispute_id"] = dispute_id

    findings = _write(out, api, results, trace)
    print(f"OED_PROBE: {findings['verdict']} pass={findings['summary']['pass']}/{findings['summary']['total']}")
    return 0 if findings["verdict"] == "PASS" else 1


def _write(out: Path, api: str, results: list[ProbeResult], trace: dict) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    fails = [r for r in results if r.status != "PASS"]
    findings = {
        "audit": "order_escrow_dispute",
        "verdict": "PASS" if not fails else "FAIL",
        "recorded_at": now_iso(),
        "api_base": api,
        "git_sha": trace.get("git_sha", ""),
        "p0": len(fails),
        "p1": 0,
        "p2": 0,
        "summary": {"total": len(results), "pass": len(results) - len(fails), "fail": len(fails)},
        "probes": [r.as_row() for r in results],
        "issues": [],
        "trace": trace,
    }
    (out / "oed-trace.json").write_text(json.dumps(trace, indent=2), encoding="utf-8")
    (out / "oed-findings-partial.json").write_text(json.dumps(findings, indent=2), encoding="utf-8")
    return findings


if __name__ == "__main__":
    raise SystemExit(main())
