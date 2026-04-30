#!/usr/bin/env python3
"""
Emit **report.json** (R-001 schema) under **`evidence/GO_YYYYMMDD_r002_iss007_prereport/`** by default.

When **`TRAVELTRUST_R002_REPORT_PARENT`** is set (e.g. **`evidence/GO_20260424`** from CI **`EVIDENCE_DIR`**),
writes to **`{TRAVELTRUST_R002_REPORT_PARENT}/r002_iss007_prereport/`** so **`e2e_core_report.json`** and **`report.json`**
share the same **`GO_*`** tree.

Narrow ISS-007 slice: forty-three 93 anchors: core F-029/025/031/030/010/032/033 plus F-009/014/025
companions (B-MKT-002 / B-DSP-001 / D-COM-001 hot) plus F-008/012/028 (B-ORD-004 / D-ITN-001 patch / B-IDM-001)
plus F-011/013/026 (B-ORD-006 escrow read-back / B-ORD-005 confirm-final snapshot / B-MSG-002 post+get)
plus F-007/015/027 (A-AVA-001 local avatar / D-COM-002 post detail / B-ESC-003 tourist first review list)
plus F-016/017/018 (D-COM-003 like delete-relike / D-COM-008 collect delete-recollect / D-COM-010 report+anon detail)
plus F-019/020/021 (D-COM-009 me posts / B-MKT-004 order bookmark delete / B-MKT-007 provider listing catalog)
plus F-022/023/024 (B-MKT-008 acquisition listing catalog / B-GDE-001 post guide detail / B-GDE-003 stake active PG)
plus F-021/023/025 (B-MKT-005 provider listings GET / B-GDE-002 availability shape / B-DSP-002 dispute detail links order)
plus F-022/021/010 (B-MKT-006 acquisition listings GET / B-MKT-009 provider listing detail GET / B-ESC-002 confirm-completion completed)
plus F-022/025/020 (B-MKT-010 acquisition listing detail GET / B-TRN-003 order disputed after dispute POST / B-MKT-013 guide market bookmark GET guide_ids)
plus F-029/026/033 (B-ESC-004 chain-sync-status after escrow / B-MSG-002C tourist POST guide GET messages / D-ITN-003 custom draft round-trip)
plus F-029/012/014 (A-ENV-001 GET /health + /meta contract / D-ITN-001B itineraries draft PG persist / D-COM-001C feed tag= filter includes tagged post).
When DATABASE_URL is set and docker Postgres is migrated, runs:
  cargo test -p traveltrust-api <one filter per anchor>

On full PASS: all anchors -> PASS, release_gate PARTIAL_GO.
Otherwise: NOT_RUN or FAIL reflected from subprocess exit / stdout heuristics.

Does not claim staging full-matrix GO (ISS-007 main line remains open).
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# (93 case id, cargo --filter, 8.2 F row, Playwright spec re repo root, stable test title substring)
ANCHORS: tuple[dict[str, str], ...] = (
    {
        "id": "D-IDX-001",
        "matrix_93_cargo_filter": (
            "matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg"
        ),
        "f_row": "F-029",
        "e2e_spec": "frontend/e2e/f029-f030-f031-request.spec.ts",
        "e2e_test_title": "F-029 · GET internal indexer-status returns ok with indexer block",
    },
    {
        "id": "B-DSP-003",
        "matrix_93_cargo_filter": (
            "matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg"
        ),
        "f_row": "F-025",
        "e2e_spec": "frontend/e2e/f024-f025-f026-request.spec.ts",
        "e2e_test_title": (
            "F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)"
        ),
    },
    {
        "id": "D-COM-011",
        "matrix_93_cargo_filter": (
            "matrix_93_d_com_011_f031_post_community_post_acquisition_led_listing_pg"
        ),
        "f_row": "F-031",
        "e2e_spec": "frontend/e2e/f029-f030-f031-request.spec.ts",
        "e2e_test_title": "F-031 · acquisition listing then community post acquisition_led showcase",
    },
    {
        "id": "D-ADM-003",
        "matrix_93_cargo_filter": (
            "matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg"
        ),
        "f_row": "F-030",
        "e2e_spec": "frontend/e2e/f029-f030-f031-request.spec.ts",
        "e2e_test_title": (
            "F-030 · tourist Bearer cannot GET admin schema migrations (403 admin_required)"
        ),
    },
    {
        "id": "B-ESC-001",
        "matrix_93_cargo_filter": (
            "matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg"
        ),
        "f_row": "F-010",
        "e2e_spec": "frontend/e2e/f007-f010-f032-request.spec.ts",
        "e2e_test_title": (
            "F-010 · accept then mock-pay leaves order escrowed (GET confirms)"
        ),
    },
    {
        "id": "B-TGR-001",
        "matrix_93_cargo_filter": (
            "matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg"
        ),
        "f_row": "F-032",
        "e2e_spec": "frontend/e2e/f007-f010-f032-request.spec.ts",
        "e2e_test_title": "F-032 · GET trust-growth/config returns ok + postgres storage hint",
    },
    {
        "id": "D-ITN-002",
        "matrix_93_cargo_filter": (
            "matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg"
        ),
        "f_row": "F-033",
        "e2e_spec": "frontend/e2e/f027-f028-f033-request.spec.ts",
        "e2e_test_title": "F-033 · POST custom itinerary then draft POST+GET round-trip",
    },
    {
        "id": "B-MKT-002",
        "matrix_93_cargo_filter": (
            "matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg"
        ),
        "f_row": "F-009",
        "e2e_spec": "frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts",
        "e2e_test_title": (
            "B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape"
        ),
    },
    {
        "id": "B-DSP-001",
        "matrix_93_cargo_filter": (
            "matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg"
        ),
        "f_row": "F-025",
        "e2e_spec": "frontend/e2e/f024-f025-f026-request.spec.ts",
        "e2e_test_title": (
            "F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)"
        ),
    },
    {
        "id": "D-COM-001",
        "matrix_93_cargo_filter": (
            "matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg"
        ),
        "f_row": "F-014",
        "e2e_spec": "frontend/e2e/f012-f013-f014-request.spec.ts",
        "e2e_test_title": (
            "F-014 · GET /community/feed includes created post (D-COM-001 feed surface)"
        ),
    },
    {
        "id": "B-ORD-004",
        "matrix_93_cargo_filter": (
            "matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg"
        ),
        "f_row": "F-008",
        "e2e_spec": "frontend/e2e/orders-b-domain-request.spec.ts",
        "e2e_test_title": (
            "F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects"
        ),
    },
    {
        "id": "D-ITN-001",
        "matrix_93_cargo_filter": (
            "matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg"
        ),
        "f_row": "F-012",
        "e2e_spec": "frontend/e2e/f012-f013-f014-request.spec.ts",
        "e2e_test_title": (
            "F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back"
        ),
    },
    {
        "id": "B-IDM-001",
        "matrix_93_cargo_filter": (
            "matrix_93_b_idm_001b_f028_trust_growth_ingest_duplicate_x_idempotency_key_identical_body_pg"
        ),
        "f_row": "F-028",
        "e2e_spec": "frontend/e2e/f027-f028-f033-request.spec.ts",
        "e2e_test_title": (
            "F-028 · B-IDM-001 · trust-growth ingest duplicate X-Idempotency-Key identical 200 body"
        ),
    },
    {
        "id": "B-ORD-006",
        "matrix_93_cargo_filter": (
            "matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg"
        ),
        "f_row": "F-011",
        "e2e_spec": "frontend/e2e/orders-b-domain-request.spec.ts",
        "e2e_test_title": (
            "F-011 · set-escrow-address then GET detail read-back"
        ),
    },
    {
        "id": "B-ORD-005",
        "matrix_93_cargo_filter": (
            "matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg"
        ),
        "f_row": "F-013",
        "e2e_spec": "frontend/e2e/f012-f013-f014-request.spec.ts",
        "e2e_test_title": (
            "F-013 · POST …/confirm-final-plan returns snapshot_hash"
        ),
    },
    {
        "id": "B-MSG-002",
        "matrix_93_cargo_filter": (
            "matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg"
        ),
        "f_row": "F-026",
        "e2e_spec": "frontend/e2e/f024-f025-f026-request.spec.ts",
        "e2e_test_title": (
            "F-026 · POST order message then GET lists content"
        ),
    },
    {
        "id": "A-AVA-001",
        "matrix_93_cargo_filter": (
            "matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg"
        ),
        "f_row": "F-007",
        "e2e_spec": "frontend/e2e/f007-f010-f032-request.spec.ts",
        "e2e_test_title": (
            "F-007 · POST profile-avatar (local allow) then GET /me has avatar_url"
        ),
    },
    {
        "id": "D-COM-002",
        "matrix_93_cargo_filter": (
            "matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg"
        ),
        "f_row": "F-015",
        "e2e_spec": "frontend/e2e/f015-f016-f017-request.spec.ts",
        "e2e_test_title": (
            "F-015 · Bearer POST post then unauthenticated GET detail matches body"
        ),
    },
    {
        "id": "B-ESC-003",
        "matrix_93_cargo_filter": (
            "matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg"
        ),
        "f_row": "F-027",
        "e2e_spec": "frontend/e2e/f027-f028-f033-request.spec.ts",
        "e2e_test_title": (
            "F-027 · completed order POST review then GET lists comment"
        ),
    },
    {
        "id": "D-COM-003",
        "matrix_93_cargo_filter": (
            "matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg"
        ),
        "f_row": "F-016",
        "e2e_spec": "frontend/e2e/f015-f016-f017-request.spec.ts",
        "e2e_test_title": (
            "F-016 · DELETE like then GET liked_by_me false then POST like relike"
        ),
    },
    {
        "id": "D-COM-008",
        "matrix_93_cargo_filter": (
            "matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg"
        ),
        "f_row": "F-017",
        "e2e_spec": "frontend/e2e/f015-f016-f017-request.spec.ts",
        "e2e_test_title": (
            "F-017 · DELETE collect then GET collected_by_me false then POST collect recollect"
        ),
    },
    {
        "id": "D-COM-010",
        "matrix_93_cargo_filter": (
            "matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg"
        ),
        "f_row": "F-018",
        "e2e_spec": "frontend/e2e/f018-f019-f020-request.spec.ts",
        "e2e_test_title": (
            "F-018 · unauthenticated GET post detail after report still readable"
        ),
    },
    {
        "id": "D-COM-009",
        "matrix_93_cargo_filter": (
            "matrix_93_d_com_009_f019_get_me_posts_lists_own_post_app_stack_ok_pg"
        ),
        "f_row": "F-019",
        "e2e_spec": "frontend/e2e/f018-f019-f020-request.spec.ts",
        "e2e_test_title": (
            "F-019 · GET community me posts lists own post"
        ),
    },
    {
        "id": "B-MKT-004",
        "matrix_93_cargo_filter": (
            "matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg"
        ),
        "f_row": "F-020",
        "e2e_spec": "frontend/e2e/f018-f019-f020-request.spec.ts",
        "e2e_test_title": (
            "F-020 · DELETE order market bookmark then GET omits order_id"
        ),
    },
    {
        "id": "B-MKT-007",
        "matrix_93_cargo_filter": (
            "matrix_93_b_mkt_007_f021_post_provider_listing_then_get_catalog_app_stack_ok_pg"
        ),
        "f_row": "F-021",
        "e2e_spec": "frontend/e2e/f021-f022-f023-request.spec.ts",
        "e2e_test_title": (
            "F-021 · POST provider listing then GET catalog includes id"
        ),
    },
    {
        "id": "B-MKT-008",
        "matrix_93_cargo_filter": (
            "matrix_93_b_mkt_008_f022_post_acquisition_listing_then_get_catalog_app_stack_ok_pg"
        ),
        "f_row": "F-022",
        "e2e_spec": "frontend/e2e/f021-f022-f023-request.spec.ts",
        "e2e_test_title": (
            "F-022 · POST acquisition listing then GET catalog includes id"
        ),
    },
    {
        "id": "B-GDE-001",
        "matrix_93_cargo_filter": (
            "matrix_93_b_gde_001_f023_post_guide_get_detail_app_stack_ok_pg"
        ),
        "f_row": "F-023",
        "e2e_spec": "frontend/e2e/f021-f022-f023-request.spec.ts",
        "e2e_test_title": (
            "F-023 · POST guide then GET detail and availability"
        ),
    },
    {
        "id": "B-GDE-003",
        "matrix_93_cargo_filter": (
            "matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg"
        ),
        "f_row": "F-024",
        "e2e_spec": "frontend/e2e/f024-f025-f026-request.spec.ts",
        "e2e_test_title": (
            "F-024 · stake then GET guides list includes active guide"
        ),
    },
    {
        "id": "B-MKT-005",
        "matrix_93_cargo_filter": (
            "matrix_93_b_mkt_005_f021_get_provider_listings_app_stack_ok_pg"
        ),
        "f_row": "F-021",
        "e2e_spec": "frontend/e2e/f021-f022-f023-request.spec.ts",
        "e2e_test_title": (
            "F-021 · POST provider listing then GET catalog includes id"
        ),
    },
    {
        "id": "B-GDE-002",
        "matrix_93_cargo_filter": (
            "matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg"
        ),
        "f_row": "F-023",
        "e2e_spec": "frontend/e2e/f021-f022-f023-request.spec.ts",
        "e2e_test_title": (
            "F-023 · POST guide then GET detail and availability"
        ),
    },
    {
        "id": "B-DSP-002",
        "matrix_93_cargo_filter": (
            "matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg"
        ),
        "f_row": "F-025",
        "e2e_spec": "frontend/e2e/f024-f025-f026-request.spec.ts",
        "e2e_test_title": (
            "F-025 · escrowed order open dispute then GET list and detail"
        ),
    },
    {
        "id": "B-MKT-006",
        "matrix_93_cargo_filter": (
            "matrix_93_b_mkt_006_f022_get_acquisition_listings_app_stack_ok_pg"
        ),
        "f_row": "F-022",
        "e2e_spec": "frontend/e2e/f021-f022-f023-request.spec.ts",
        "e2e_test_title": (
            "F-022 · POST acquisition listing then GET catalog includes id"
        ),
    },
    {
        "id": "B-MKT-009",
        "matrix_93_cargo_filter": (
            "matrix_93_b_mkt_009_f021_get_provider_listing_detail_app_stack_ok_pg"
        ),
        "f_row": "F-021",
        "e2e_spec": "frontend/e2e/f021-f022-f023-request.spec.ts",
        "e2e_test_title": (
            "F-021 · POST provider listing then GET listing detail matches id"
        ),
    },
    {
        "id": "B-ESC-002",
        "matrix_93_cargo_filter": (
            "matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg"
        ),
        "f_row": "F-010",
        "e2e_spec": "frontend/e2e/f007-f010-f032-request.spec.ts",
        "e2e_test_title": (
            "F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)"
        ),
    },
    {
        "id": "B-MKT-010",
        "matrix_93_cargo_filter": (
            "matrix_93_b_mkt_010_f022_get_acquisition_listing_detail_app_stack_ok_pg"
        ),
        "f_row": "F-022",
        "e2e_spec": "frontend/e2e/f021-f022-f023-request.spec.ts",
        "e2e_test_title": (
            "F-022 · POST acquisition listing then GET listing detail matches id"
        ),
    },
    {
        "id": "B-TRN-003",
        "matrix_93_cargo_filter": (
            "matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg"
        ),
        "f_row": "F-025",
        "e2e_spec": "frontend/e2e/f024-f025-f026-request.spec.ts",
        "e2e_test_title": (
            "F-025 · escrowed order open dispute then GET list and detail"
        ),
    },
    {
        "id": "B-MKT-013",
        "matrix_93_cargo_filter": (
            "matrix_93_b_mkt_004d_f020_post_guide_bookmark_then_get_guide_ids_app_stack_ok_pg"
        ),
        "f_row": "F-020",
        "e2e_spec": "frontend/e2e/f018-f019-f020-request.spec.ts",
        "e2e_test_title": (
            "F-020 · order+guide bookmarks then invalid listing POST preserves both lists"
        ),
    },
    {
        "id": "B-ESC-004",
        "matrix_93_cargo_filter": (
            "matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg"
        ),
        "f_row": "F-029",
        "e2e_spec": "frontend/e2e/f029-f030-f031-request.spec.ts",
        "e2e_test_title": (
            "F-029 · mock-pay then GET order chain-sync-status shows escrowed last_event"
        ),
    },
    {
        "id": "B-MSG-002C",
        "matrix_93_cargo_filter": (
            "matrix_93_b_msg_002c_f026_tourist_posts_guide_reads_messages_app_stack_ok_pg"
        ),
        "f_row": "F-026",
        "e2e_spec": "frontend/e2e/f024-f025-f026-request.spec.ts",
        "e2e_test_title": (
            "F-026 · tourist POST order message then guide GET lists same line"
        ),
    },
    {
        "id": "D-ITN-003",
        "matrix_93_cargo_filter": (
            "matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg"
        ),
        "f_row": "F-033",
        "e2e_spec": "frontend/e2e/f027-f028-f033-request.spec.ts",
        "e2e_test_title": (
            "F-033 · POST custom itinerary then draft POST+GET round-trip"
        ),
    },
    {
        "id": "A-ENV-001",
        "matrix_93_cargo_filter": (
            "matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg"
        ),
        "f_row": "F-029",
        "e2e_spec": "frontend/e2e/f029-f030-f031-request.spec.ts",
        "e2e_test_title": (
            "F-029 · GET /health returns ok and GET /meta includes build api_version database"
        ),
    },
    {
        "id": "D-ITN-001B",
        "matrix_93_cargo_filter": (
            "matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg"
        ),
        "f_row": "F-012",
        "e2e_spec": "frontend/e2e/f012-f013-f014-request.spec.ts",
        "e2e_test_title": (
            "F-012 · POST /api/v1/itineraries creates draft + order_id"
        ),
    },
    {
        "id": "D-COM-001C",
        "matrix_93_cargo_filter": (
            "matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg"
        ),
        "f_row": "F-014",
        "e2e_spec": "frontend/e2e/f012-f013-f014-request.spec.ts",
        "e2e_test_title": (
            "F-014 · POST tagged post then GET feed?tag includes same post id"
        ),
    },
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def run_cargo_test(test_filter: str) -> tuple[int, str]:
    env = os.environ.copy()
    env.setdefault("P3_CHAIN_OFF", "1")
    cmd = [
        "cargo",
        "test",
        "-p",
        "traveltrust-api",
        test_filter,
        "--",
        "--nocapture",
    ]
    p = subprocess.run(
        cmd,
        cwd=repo_root(),
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=600,
    )
    out = (p.stdout or "") + "\n" + (p.stderr or "")
    return p.returncode, out


def parse_passed(out: str) -> bool:
    if re.search(r"\b1 passed\b", out) and "FAILED" not in out:
        return True
    if re.search(r"test result: ok\.\s*1 passed", out):
        return True
    return False


def parse_skipped(out: str) -> bool:
    return "skip:" in out.lower() or "1 skipped" in out


def main() -> int:
    ap_repo = repo_root()
    parent_rel = os.environ.get("TRAVELTRUST_R002_REPORT_PARENT", "").strip()
    if parent_rel:
        parent_path = (ap_repo / parent_rel).resolve()
        evidence_root = (ap_repo / "evidence").resolve()
        try:
            parent_path.relative_to(evidence_root)
        except ValueError:
            print(
                "ERROR: TRAVELTRUST_R002_REPORT_PARENT must be under evidence/",
                file=sys.stderr,
            )
            return 1
        ev_dir = parent_path / "r002_iss007_prereport"
        slug = parent_path.name
        ev_name = f"{slug}_r002_iss007_prereport"
    else:
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        ev_name = f"GO_{today}_r002_iss007_prereport"
        ev_dir = ap_repo / "evidence" / ev_name
    ev_dir.mkdir(parents=True, exist_ok=True)

    db = os.environ.get("DATABASE_URL", "").strip()
    has_db = bool(db)
    gh_run = os.environ.get("GITHUB_RUN_ID", "").strip()
    gh_sha = os.environ.get("GITHUB_SHA", "").strip()

    cases: list[dict] = []
    pass_n = fail_n = not_run = blocked = na = 0

    for anchor in ANCHORS:
        case_id = anchor["id"]
        filt = anchor["matrix_93_cargo_filter"]
        f_row = anchor["f_row"]
        e2e_spec = anchor["e2e_spec"]
        e2e_title = anchor["e2e_test_title"]
        sub = ev_dir / case_id
        sub.mkdir(parents=True, exist_ok=True)
        notes_path = sub / "notes.md"
        if not has_db:
            status = "NOT_RUN"
            not_run += 1
            note_body = (
                "DATABASE_URL unset; run after `docker compose up -d postgres` "
                "+ `sqlx migrate run --source crates/api/migrations`."
            )
            notes_path.write_text(
                f"# {case_id}\n\n{note_body}\n\nRust filter: `{filt}`\n"
                f"E2E: `{e2e_spec}` — {e2e_title}\n",
                encoding="utf-8",
            )
        else:
            code, out = run_cargo_test(filt)
            notes_path.write_text(
                f"# {case_id}\n\n`cargo test -p traveltrust-api {filt}` exit={code}\n\n```\n{out[-12000:]}\n```\n"
                f"E2E: `{e2e_spec}` — {e2e_title}\n",
                encoding="utf-8",
            )
            if code != 0:
                status = "FAIL"
                fail_n += 1
            elif parse_skipped(out):
                status = "NOT_RUN"
                not_run += 1
            elif parse_passed(out):
                status = "PASS"
                pass_n += 1
            else:
                status = "FAIL"
                fail_n += 1

        note_line = notes_path.relative_to(ap_repo).as_posix()
        if status == "PASS" and gh_run:
            note_line += (
                f" | E2E same CI job: `{e2e_spec}` ({e2e_title}); github.run_id={gh_run}"
            )

        case_obj: dict = {
            "id": case_id,
            "status": status,
            "evidence_path": sub.relative_to(ap_repo).as_posix(),
            "blocker": False,
            "notes": note_line,
            "f_row_8_2": f_row,
            "matrix_93_cargo_filter": filt,
            "e2e_spec": e2e_spec,
            "e2e_test_title": e2e_title,
        }
        if pw_e2e := os.environ.get("PLAYWRIGHT_E2E_STEP_OUTCOME", "").strip():
            case_obj["playwright_e2e_step_outcome"] = pw_e2e
        cases.append(case_obj)

    if fail_n:
        rg = "NO_GO"
        reason = f"ISS-007 prereport: {fail_n} anchor(s) FAIL; see case notes under {ev_name}/."
    elif not_run == len(ANCHORS):
        rg = "PARTIAL_GO"
        reason = (
            "ISS-007 prereport shell: anchors NOT_RUN (no DATABASE_URL or skipped); "
            "full 93 matrix + CI e2e still required for ISS-007 close."
        )
    elif not_run > 0:
        rg = "PARTIAL_GO"
        reason = (
            f"ISS-007 prereport: {pass_n} PASS, {not_run} NOT_RUN; not a staging full-matrix GO."
        )
    else:
        rg = "PARTIAL_GO"
        reason = (
            "ISS-007 narrow slice: "
            + ", ".join(a["id"] for a in ANCHORS)
            + " PASS via matrix_93_* on PG+chain_off; staging full-matrix report.json still per ISS-007."
        )

    if gh_run and pass_n == len(ANCHORS) and fail_n == 0:
        reason += (
            f" Same GitHub Actions job as Playwright e2e (run_id={gh_run}); "
            "HTTP: `f024-f025-f026-request.spec.ts` "
            "(B-DSP-003 + B-DSP-001 + B-DSP-002 + B-TRN-003 disputed GET order; F-025/F-026 B-MSG-002C dual-read; F-024 B-GDE-003 stake+list) + "
            "`f029-f030-f031-request.spec.ts` "
            "(F-029 D-IDX-001 + A-ENV-001 /health+/meta + B-ESC-004 chain-sync-status; F-030 D-ADM-003; F-031 D-COM-011) + "
            "`f007-f010-f032-request.spec.ts` "
            "(F-007 A-AVA-001; F-010 B-ESC-001 + B-ESC-002; F-032 B-TGR-001) + "
            "`f027-f028-f033-request.spec.ts` (F-033 D-ITN-002 + D-ITN-003 draft round-trip; F-027 B-ESC-003 first review) + "
            "`93-matrix-enterprise-p1-batch.spec.ts` (F-009 B-MKT-002) + "
            "`f012-f013-f014-request.spec.ts` (F-014 D-COM-001 feed / hot IT pair) + "
            "`orders-b-domain-request.spec.ts` (F-008 B-ORD-004; F-011 B-ORD-006) + "
            "`f012-f013-f014-request.spec.ts` "
            "(F-012 D-ITN-001B draft + D-ITN-001d patch chain; F-013 B-ORD-005; F-014 D-COM-001C feed `tag=` + D-COM-001) + "
            "`f027-f028-f033-request.spec.ts` (F-028 B-IDM-001) + "
            "`f015-f016-f017-request.spec.ts` (F-015 D-COM-002; F-016 D-COM-003; F-017 D-COM-008) + "
            "`f018-f019-f020-request.spec.ts` "
            "(F-018 D-COM-010; F-019 D-COM-009; F-020 B-MKT-004 + B-MKT-013 guide bookmark slice) + "
            "`f021-f022-f023-request.spec.ts` "
            "(F-021 B-MKT-007 + B-MKT-005 + B-MKT-009 detail; F-022 B-MKT-008 + B-MKT-006 list + B-MKT-010 acquisition detail; "
            "F-023 B-GDE-001 + B-GDE-002)."
        )

    pw_e2e = os.environ.get("PLAYWRIGHT_E2E_STEP_OUTCOME", "").strip()
    if pw_e2e:
        reason += f" Playwright `e2e` job step outcome={pw_e2e}."

    report = {
        "schema_version": "1",
        "run_id": ev_name,
        "title": "R-002 prereport · ISS-007 narrow slice (43× matrix_93 ↔ §8.2 F rows)",
        "executor": "scripts/gen-r002-iss007-prereport.py",
        "started_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "finished_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "environment": {
            "name": "local",
            "database": "enabled" if has_db else "disabled",
            "chain_mode": "chain_off",
            "auth_mode": "bearer",
        },
        "release_gate": rg,
        "release_gate_reason": reason,
        "iss007_narrow_slice": {
            "scope_note": (
                "ISS-007 main line (staging full-matrix report.json + CI-wide closure) remains open; "
                "this artifact binds forty-three 93 anchors (8.2 F rows) to matrix_93 + Playwright request specs."
            ),
            "f_rows_8_2": [a["f_row"] for a in ANCHORS],
            "anchors_93": [a["id"] for a in ANCHORS],
        },
        "cases": cases,
        "summary": {
            "PASS": pass_n,
            "FAIL": fail_n,
            "BLOCKED": blocked,
            "N_A": na,
            "NOT_RUN": not_run,
        },
    }
    if gh_run:
        report["github_run_id"] = gh_run
    if gh_sha:
        report["commit_sha"] = gh_sha
    if pw_e2e:
        report["playwright_e2e_outcome"] = pw_e2e

    out_json = ev_dir / "report.json"
    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {out_json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
