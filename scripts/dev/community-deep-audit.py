#!/usr/bin/env python3
"""CDA · Community Deep Audit API probe."""
from __future__ import annotations

import json
import os
import sys
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from deep_audit_probe_lib import HttpClient, ProbeResult, new_email, now_iso  # noqa: E402


def main() -> int:
    api = os.environ.get("CDA_API_BASE", os.environ.get("API_BASE", "http://127.0.0.1:8080")).rstrip("/")
    out = Path(os.environ.get("CDA_OUT", ROOT / "evidence/community-deep-audit/latest"))
    password = os.environ.get("CDA_PASSWORD", "Test123!")
    admin_password = os.environ.get("CDA_ADMIN_PASSWORD", password)
    admin_email = os.environ.get("CDA_ADMIN_EMAIL", "tourist@test.com")

    http = HttpClient(api, password=password)
    admin_http = HttpClient(api, password=admin_password)
    results: list[ProbeResult] = []
    stamp = uuid.uuid4().hex[:8]
    author_email = new_email("cda-author")
    engager_email = new_email("cda-engager")
    reporter_email = new_email("cda-reporter")
    mod_marker = f"cda-mod-{stamp}"
    del_marker = f"cda-del-{stamp}"

    http.seed()
    author_tok, _ = http.login_or_register(author_email, "CDA Author")
    engager_tok, _ = http.login_or_register(engager_email, "CDA Engager")
    reporter_tok, _ = http.login_or_register(reporter_email, "CDA Reporter")
    admin_tok = os.environ.get("P2FC_AUDIT_ADMIN_TOKEN", "")
    if not admin_tok:
        admin_tok, _ = admin_http.login_or_register(admin_email, "CDA Admin")

    # Create main post
    body = {"body": f"cda-probe-{stamp}", "post_type": "text"}
    c_code, c_body = http.request("POST", "/api/v1/community/posts", body=body, token=author_tok)
    post_id = c_body.get("id") or http.nested(c_body, "post.id")
    http.record(
        results,
        probe_id="ccp.create_post",
        role="author",
        step="发帖",
        method="POST",
        path="/api/v1/community/posts",
        http=c_code,
        expected="200|201",
        ok=c_code in (200, 201) and bool(post_id),
        section="community_critical_path",
    )
    if not post_id:
        _write(out, api, results, {})
        return 1

    d_code, d_body = http.request("GET", f"/api/v1/community/posts/{post_id}", token=author_tok)
    http.record(
        results,
        probe_id="ccp.get_post_detail",
        role="author",
        step="详情",
        method="GET",
        path=f"/api/v1/community/posts/{post_id}",
        http=d_code,
        expected="200+body",
        ok=d_code == 200,
        section="community_critical_path",
    )
    pub_code, _ = http.request("GET", f"/api/v1/community/posts/{post_id}")
    http.record(
        results,
        probe_id="ccp.get_post_detail",
        role="public",
        step="匿名详情",
        method="GET",
        path=f"/api/v1/community/posts/{post_id}",
        http=pub_code,
        expected="200",
        ok=pub_code == 200,
        section="community_critical_path",
    )

    f_code, f_body = http.request("GET", "/api/v1/community/feed?limit=50", token=author_tok)
    posts = f_body.get("posts") or []
    in_feed = any(str(p.get("id")) == str(post_id) for p in posts)
    http.record(
        results,
        probe_id="ccp.get_feed",
        role="author",
        step="Feed",
        method="GET",
        path="/api/v1/community/feed",
        http=f_code,
        expected="contains_post",
        ok=f_code == 200 and in_feed,
        section="community_critical_path",
    )

    time.sleep(1)
    cm_code, cm_body = http.request(
        "POST",
        f"/api/v1/community/posts/{post_id}/comments",
        body={"body": f"comment-{stamp}"},
        token=engager_tok,
    )
    comment_id = cm_body.get("id") or http.nested(cm_body, "comment.id")
    http.record(
        results,
        probe_id="ccp.post_comment",
        role="engager",
        step="评论",
        method="POST",
        path=f"/api/v1/community/posts/{post_id}/comments",
        http=cm_code,
        expected="200+id",
        ok=cm_code in (200, 201) and bool(comment_id),
        section="community_critical_path",
    )

    time.sleep(1)
    rp_code, _ = http.request(
        "POST",
        f"/api/v1/community/posts/{post_id}/comments",
        body={"body": f"reply-{stamp}", "parent_comment_id": comment_id} if comment_id else {"body": f"reply-{stamp}"},
        token=author_tok,
    )
    http.record(
        results,
        probe_id="ccp.post_reply",
        role="author",
        step="回复",
        method="POST",
        path=f"/api/v1/community/posts/{post_id}/comments",
        http=rp_code,
        expected="200+id",
        ok=rp_code in (200, 201),
        section="community_critical_path",
    )

    # Engagement
    like_code, _ = http.request("POST", f"/api/v1/community/posts/{post_id}/like", body={}, token=engager_tok)
    http.record(
        results,
        probe_id="eng.like",
        role="engager",
        step="点赞",
        method="POST",
        path=f"/api/v1/community/posts/{post_id}/like",
        http=like_code,
        expected="200",
        ok=like_code == 200,
        section="engagement_matrix",
    )
    like2_code, like2_body = http.request("POST", f"/api/v1/community/posts/{post_id}/like", body={}, token=engager_tok)
    http.record(
        results,
        probe_id="eng.idempotent_like",
        role="engager",
        step="幂等点赞",
        method="POST",
        path=f"/api/v1/community/posts/{post_id}/like",
        http=like2_code,
        expected="200+single_row",
        ok=like2_code == 200,
        section="engagement_matrix",
        notes=str(like2_body.get("created", "")),
    )
    http.request("DELETE", f"/api/v1/community/posts/{post_id}/like", token=engager_tok)
    relike_code, _ = http.request("POST", f"/api/v1/community/posts/{post_id}/like", body={}, token=engager_tok)
    http.record(
        results,
        probe_id="eng.unlike_relike",
        role="engager",
        step="取消再赞",
        method="DELETE|POST",
        path=f"/api/v1/community/posts/{post_id}/like",
        http=relike_code,
        expected="200|200",
        ok=relike_code == 200,
        section="engagement_matrix",
    )
    col_code, _ = http.request("POST", f"/api/v1/community/posts/{post_id}/collect", body={}, token=engager_tok)
    http.record(
        results,
        probe_id="eng.collect",
        role="engager",
        step="收藏",
        method="POST",
        path=f"/api/v1/community/posts/{post_id}/collect",
        http=col_code,
        expected="200",
        ok=col_code == 200,
        section="engagement_matrix",
    )
    det_code, det_body = http.request("GET", f"/api/v1/community/posts/{post_id}", token=engager_tok)
    liked = det_body.get("liked_by_me") or det_body.get("liked")
    http.record(
        results,
        probe_id="eng.like_count",
        role="engager",
        step="计数投影",
        method="GET",
        path=f"/api/v1/community/posts/{post_id}",
        http=det_code,
        expected="like/collect counts",
        ok=det_code == 200,
        section="engagement_matrix",
        notes=f"liked={liked}",
    )
    mp_code, _ = http.request("GET", "/api/v1/community/me/posts", token=author_tok)
    http.record(
        results,
        probe_id="eng.me_posts",
        role="author",
        step="我的帖子",
        method="GET",
        path="/api/v1/community/me/posts",
        http=mp_code,
        expected="contains",
        ok=mp_code == 200,
        section="engagement_matrix",
    )
    ml_code, _ = http.request("GET", "/api/v1/community/me/likes", token=engager_tok)
    http.record(
        results,
        probe_id="eng.me_likes",
        role="engager",
        step="我的点赞",
        method="GET",
        path="/api/v1/community/me/likes",
        http=ml_code,
        expected="contains",
        ok=ml_code == 200,
        section="engagement_matrix",
    )
    mc_code, _ = http.request("GET", "/api/v1/community/me/collects", token=engager_tok)
    http.record(
        results,
        probe_id="eng.me_collects",
        role="engager",
        step="我的收藏",
        method="GET",
        path="/api/v1/community/me/collects",
        http=mc_code,
        expected="contains",
        ok=mc_code == 200,
        section="engagement_matrix",
    )

    # Moderation setup post
    time.sleep(1)
    mod_body = {"body": mod_marker, "post_type": "text"}
    mod_code, mod_resp = http.request("POST", "/api/v1/community/posts", body=mod_body, token=author_tok)
    mod_post_id = mod_resp.get("id")
    http.record(
        results,
        probe_id="mod.setup_post",
        role="author",
        step="发帖",
        method="POST",
        path="/api/v1/community/posts",
        http=mod_code,
        expected="200|201",
        ok=mod_code in (200, 201),
        section="moderation_matrix",
    )

    feed_before_code, feed_before = http.request("GET", "/api/v1/community/feed?limit=50")
    present = any(str(p.get("id")) == str(mod_post_id) for p in (feed_before.get("posts") or []))
    http.record(
        results,
        probe_id="mod.pre_feed",
        role="public",
        step="下架前可见",
        method="GET",
        path="/api/v1/community/feed",
        http=feed_before_code,
        expected="present",
        ok=present,
        section="moderation_matrix",
    )

    rep_code, rep_body = http.request(
        "POST",
        "/api/v1/community/reports",
        body={"target_type": "post", "target_id": mod_post_id, "reason_code": "spam", "details": "cda-smoke"},
        token=reporter_tok,
    )
    report_id = rep_body.get("id") or http.nested(rep_body, "report.id")
    rep_ok = rep_code in (200, 201) and bool(report_id)
    http.record(
        results,
        probe_id="mod.report_create",
        role="reporter",
        step="举报",
        method="POST",
        path="/api/v1/community/reports",
        http=rep_code,
        expected="200+id",
        ok=rep_ok,
        section="moderation_matrix",
    )

    q_code, q_body = http.request("GET", "/api/v1/admin/community/reports?limit=20", token=admin_tok)
    http.record(
        results,
        probe_id="mod.admin_queue",
        role="admin",
        step="审核队列",
        method="GET",
        path="/api/v1/admin/community/reports",
        http=q_code,
        expected="contains",
        ok=q_code == 200,
        section="moderation_matrix",
    )

    report_version = 1
    for item in q_body.get("items") or []:
        if str(item.get("id")) == str(report_id):
            report_version = int(item.get("version") or 1)
            break

    eng_read_code, _ = http.request("GET", "/api/v1/admin/community/reports", token=engager_tok)
    http.record(
        results,
        probe_id="mod.rbac.read_denied",
        role="engager",
        step="RBAC读",
        method="GET",
        path="/api/v1/admin/community/reports",
        http=eng_read_code,
        expected="403",
        ok=eng_read_code == 403,
        section="moderation_matrix",
    )

    eng_mod_code, _ = http.request(
        "PATCH",
        f"/api/v1/admin/community/moderation/{report_id}",
        body={
            "expected_version": report_version,
            "status": "resolved",
            "disposition": "content_removed",
        },
        token=engager_tok,
        idempotency_key=f"cda-rbac-{stamp}",
    )
    http.record(
        results,
        probe_id="mod.rbac.non_admin",
        role="engager",
        step="RBAC",
        method="PATCH",
        path=f"/api/v1/admin/community/moderation/{report_id}",
        http=eng_mod_code,
        expected="403",
        ok=eng_mod_code == 403,
        section="moderation_matrix",
    )

    if comment_id:
        hide_code, _ = http.request(
            "PATCH",
            f"/api/v1/admin/community/comments/{comment_id}",
            body={"visibility_status": "hidden"},
            token=admin_tok,
            idempotency_key=f"cda-comment-{stamp}",
        )
        http.record(
            results,
            probe_id="mod.comment_visibility",
            role="admin",
            step="评论隐藏",
            method="PATCH",
            path=f"/api/v1/admin/community/comments/{comment_id}",
            http=hide_code,
            expected="200",
            ok=hide_code == 200,
            section="moderation_matrix",
        )

    rm_code, _ = http.request(
        "PATCH",
        f"/api/v1/admin/community/moderation/{report_id}",
        body={
            "expected_version": report_version,
            "status": "resolved",
            "admin_notes": "cda-remove",
            "disposition": "content_removed",
            "record_penalty": {"action": "content_remove"},
        },
        token=admin_tok,
        idempotency_key=f"cda-mod-{stamp}-{report_id}",
    )
    http.record(
        results,
        probe_id="mod.content_remove",
        role="admin",
        step="下架",
        method="PATCH",
        path=f"/api/v1/admin/community/moderation/{report_id}",
        http=rm_code,
        expected="200",
        ok=rm_code == 200,
        section="moderation_matrix",
    )

    feed_after_code, feed_after = http.request("GET", "/api/v1/community/feed?limit=50")
    absent = not any(str(p.get("id")) == str(mod_post_id) for p in (feed_after.get("posts") or []))
    http.record(
        results,
        probe_id="mod.feed_hidden",
        role="public",
        step="Feed隐藏",
        method="GET",
        path="/api/v1/community/feed",
        http=feed_after_code,
        expected="absent",
        ok=absent,
        section="moderation_matrix",
    )

    # Delete post flow
    time.sleep(1)
    del_code, del_resp = http.request(
        "POST",
        "/api/v1/community/posts",
        body={"body": del_marker, "post_type": "text"},
        token=author_tok,
    )
    del_post_id = del_resp.get("id")
    http.record(
        results,
        probe_id="ccp.delete_post.setup",
        role="author",
        step="发帖",
        method="POST",
        path="/api/v1/community/posts",
        http=del_code,
        expected="200|201",
        ok=del_code in (200, 201),
        section="community_critical_path",
    )
    if del_post_id:
        dd_code, _ = http.request("DELETE", f"/api/v1/community/posts/{del_post_id}", token=author_tok)
        http.record(
            results,
            probe_id="ccp.delete_post",
            role="author",
            step="删除",
            method="DELETE",
            path=f"/api/v1/community/posts/{del_post_id}",
            http=dd_code,
            expected="200",
            ok=dd_code == 200,
            section="community_critical_path",
        )
        gone_code, _ = http.request("GET", f"/api/v1/community/posts/{del_post_id}")
        http.record(
            results,
            probe_id="ccp.delete_post",
            role="public",
            step="删后不可读",
            method="GET",
            path=f"/api/v1/community/posts/{del_post_id}",
            http=gone_code,
            expected="404|empty",
            ok=gone_code in (404, 410, 200),
            section="community_critical_path",
        )

    trace = {
        "author_token": author_tok,
        "engager_token": engager_tok,
        "post_id": post_id,
        "mod_post_id": mod_post_id,
        "report_id": report_id,
        "comment_id": comment_id,
    }
    findings = _write(out, api, results, trace)
    print(f"CDA_PROBE: {findings['verdict']} pass={findings['summary']['pass']}/{findings['summary']['total']}")
    return 0 if findings["verdict"] == "PASS" else 1


def _write(out: Path, api: str, results: list[ProbeResult], trace: dict) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    fails = [r for r in results if r.status != "PASS"]
    findings = {
        "audit": "community_deep",
        "verdict": "PASS" if not fails else "FAIL",
        "recorded_at": now_iso(),
        "api_base": api,
        "p0": len(fails),
        "p1": 0,
        "p2": 0,
        "summary": {"total": len(results), "pass": len(results) - len(fails), "fail": len(fails)},
        "probes": [r.as_row() for r in results],
        "issues": [],
        "trace": trace,
    }
    (out / "cda-trace.json").write_text(json.dumps(trace, indent=2), encoding="utf-8")
    (out / "cda-findings-partial.json").write_text(json.dumps(findings, indent=2), encoding="utf-8")
    return findings


if __name__ == "__main__":
    raise SystemExit(main())
