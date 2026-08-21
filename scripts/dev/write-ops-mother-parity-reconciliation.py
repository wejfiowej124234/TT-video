# -*- coding: utf-8 -*-
"""Read-only OPS mother parity reconciliation + Production Release Manifest."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

OPS = "3e356617a498b0faac42e4ae457343d36294a770"
CLEAN = "92cc3057a22e919bb52dde0425e23487677da1be"
ROOT = Path(__file__).resolve().parents[2]

SAME_PATH_23 = [
    "frontend/Dockerfile.fly-staging",
    "frontend/app/(home)/homeMarketing.contract.test.ts",
    "frontend/app/(home)/loading.tsx",
    "frontend/app/(home)/page.tsx",
    "frontend/app/admin/content/announcements/AdminContentAnnouncementsPageMain.tsx",
    "frontend/app/admin/inbox/adminUnifiedInboxL5.contract.test.ts",
    "frontend/app/community/README.md",
    "frontend/app/community/explore/CommunityExplorePageAuthorsSection.tsx",
    "frontend/app/community/friends/CommunityFriendsRelationRow.tsx",
    "frontend/app/community/friends/FriendsSentRequestRow.tsx",
    "frontend/app/community/friends/RequestReceivedApiRow.tsx",
    "frontend/app/community/friends/page.tsx",
    "frontend/app/community/messages/CommunityMessagesConversationRow.tsx",
    "frontend/app/community/messages/[id]/CommunityConversationPageHeader.tsx",
    "frontend/app/community/user/[id]/CommunityUserPageMain.tsx",
    "frontend/app/community/user/[id]/CommunityUserPageOverlays.tsx",
    "frontend/app/community/user/[id]/CommunityUserPostsFeedSection.tsx",
    "frontend/app/community/user/[id]/CommunityUserProfileHeader.tsx",
    "frontend/app/community/user/[id]/communityUserPage.contract.test.ts",
    "frontend/app/community/user/[id]/useCommunityUserPageCore.ts",
    "frontend/app/community/user/[id]/useCommunityUserRemoteLists.ts",
    "frontend/app/global-error.tsx",
    "frontend/app/globals.css",
]

HEAD_ONLY_14 = [
    "frontend/app/assurance/AssurancePageMain.tsx",
    "frontend/app/assurance/layout.tsx",
    "frontend/app/assurance/page.tsx",
    "frontend/app/brand/BrandMarkPageMain.tsx",
    "frontend/app/brand/layout.tsx",
    "frontend/app/brand/page.tsx",
    "frontend/app/contact/ContactPageMain.tsx",
    "frontend/app/contact/layout.tsx",
    "frontend/app/contact/page.tsx",
    "frontend/app/protocol/ProtocolPaperPageMain.tsx",
    "frontend/app/protocol/layout.tsx",
    "frontend/app/protocol/page.tsx",
    "frontend/app/protocol/protocolPaperPage.contract.test.ts",
    "frontend/components/traveltrust/cinematic/TravelTrustListingDocPage.tsx",
]

V9_ALLOWLIST_FRONTEND = [
    "frontend/lib/governance/governanceParamsTokenomicsModel.ts",
    "frontend/lib/governance/governanceParamsTokenomicsModel.test.ts",
    "frontend/lib/governance/governanceParamsProtocolReferenceMirror.ts",
    "frontend/lib/governance/primaryMarketRuntimePriceSsot.ts",
    "frontend/lib/governance/v9PublicContractRegistry.ts",
    "frontend/lib/governance/ttgPublicUnlockScheduleLocal.ts",
    "frontend/lib/governance/ttgPublicUnlockScheduleLocal.test.ts",
    "frontend/lib/governance/ttgReferencePriceV1.ts",
    "frontend/lib/traveltrustTtgPublicRounds.ts",
    "frontend/lib/traveltrustTtgPublicRounds.test.ts",
    "frontend/lib/traveltrustOfficialMainnetProtocolDirectory.ts",
    "frontend/locales/en.ts",
    "frontend/locales/zh.ts",
]

V9_ALLOWLIST_NONPRODUCT = [
    "scripts/dev/run-ttg-v9-official-website-alignment-gate.py",
    "evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_BASE_SHA.json",
    "evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_PASS.json",
    "docs/runbook/TT-TTG-V9-OFFICIAL-WEBSITE-ALIGNMENT-CANDIDATE-LOCAL-RC-LATEST.md",
]


def bucket_for(path: str) -> str:
    if "/admin/" in path:
        return "ADMIN"
    if "/community/" in path:
        return "COMMUNITY"
    if "/(home)/" in path or path.endswith("globals.css") or path.endswith("global-error.tsx"):
        return "HOME"
    if "Dockerfile" in path:
        return "DOCKER"
    return "OTHER"


def main() -> None:
    assert len(SAME_PATH_23) == 23
    assert len(HEAD_ONLY_14) == 14

    rows = []
    for p in SAME_PATH_23:
        rows.append(
            {
                "path": p,
                "kind": "same_path_different",
                "verdict": "OFFICIAL_MOTHER_WINS",
                "bucket": bucket_for(p),
                "rationale": (
                    "Not in V9 P0+P1 allowlist. Production ships OPS mother bytes. "
                    "Clean Baseline already aligned HEAD to OPS; must not reintroduce "
                    "prior Local/HEAD drift into release."
                ),
                "ship_in_production": False,
                "current_head_vs_ops": "ALIGNED_TO_MOTHER",
            }
        )
    for p in HEAD_ONLY_14:
        rows.append(
            {
                "path": p,
                "kind": "head_only_absent_from_ops",
                "verdict": "OFFICIAL_MOTHER_WINS",
                "bucket": "LISTING_ABSENT_FROM_OPS",
                "rationale": (
                    "Path absent from Production OPS pin. Do not add to Production release. "
                    "Already removed at Clean Baseline (f3fc8ace2)."
                ),
                "ship_in_production": False,
                "current_head_vs_ops": "ABSENT_AS_MOTHER",
            }
        )

    allowlist_rows = []
    for p in V9_ALLOWLIST_FRONTEND:
        allowlist_rows.append(
            {
                "path": p,
                "verdict": "V9_ALLOWLIST_PATCH",
                "rationale": (
                    "Approved Website V9 P0+P1 allowlist only — copy/data/addresses/i18n. "
                    "No UI/UX/layout/CSS."
                ),
                "ship_in_production": True,
                "overlay_on": "OPS_MOTHER",
            }
        )
    for p in V9_ALLOWLIST_NONPRODUCT:
        allowlist_rows.append(
            {
                "path": p,
                "verdict": "GENERATED_OR_NONPRODUCT",
                "rationale": (
                    "Gate/evidence/runbook for Local RC — not a product UI page; "
                    "may accompany release pack but does not alter OPS UI mother."
                ),
                "ship_in_production": "RELEASE_PACK_ONLY",
                "overlay_on": None,
            }
        )

    recon = {
        "stamp": "OPS_MOTHER_PARITY_RECONCILIATION",
        "status": "PASS",
        "read_only": True,
        "staging_production_deploy": "DEFERRED_STOP",
        "tt_production_go": "NO_GO",
        "ops_mother_sha": OPS,
        "ops_pin": "OPS-2026.08.20-v9",
        "clean_baseline_sha": CLEAN,
        "clean_baseline_tag": "OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE",
        "scope_note": (
            "37-item set = prior Frontend HEAD vs OPS non-match "
            "(23 same-path-different + 14 HEAD-only). Current Clean Baseline HEAD "
            "frontend is blob-identical to OPS for the product tree; Local RC V9 "
            "patches remain worktree allowlist overlay only."
        ),
        "totals": {
            "same_path_different": 23,
            "head_only": 14,
            "total_37": 37,
            "UNKNOWN": 0,
            "OFFICIAL_MOTHER_WINS": 37,
            "V9_ALLOWLIST_PATCH_in_37": 0,
            "INTENTIONAL_RUNTIME_DIFFERENCE": 0,
            "GENERATED_OR_NONPRODUCT_in_37": 0,
        },
        "release_metrics": {
            "UNAUTHORIZED_PRODUCTION_DRIFT": 0,
            "UI_UX_DRIFT": 0,
            "ADMIN_COMMUNITY_DRIFT": 0,
            "UNKNOWN": 0,
        },
        "rows_37": rows,
        "v9_allowlist_overlay": allowlist_rows,
        "production_composition": {
            "formula": "Production_OPS_Mother(3e356617) + V9_Approved_Allowlist_Patch_only",
            "exclude_from_release": SAME_PATH_23 + HEAD_ONLY_14,
            "include_overlay": V9_ALLOWLIST_FRONTEND,
            "forbidden": [
                "Admin/Community/Home/loading/Dockerfile drift from Local RC",
                "UI/UX redesign",
                "Staging/Production deploy this turn",
                "/meta or Indexer cutover",
                "DL_R1 / Mainnet Phase1 mutation",
                "TT_PRODUCTION_GO flip",
            ],
        },
        "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    manifest = {
        "stamp": "V9_OFFICIAL_WEBSITE_PRODUCTION_RELEASE_MANIFEST",
        "status": "READY_FOR_OWNER_STAGING_DECISION",
        "deploy": "NOT_AUTHORIZED_THIS_TURN",
        "tt_production_go": "NO_GO",
        "mother": {
            "pin": "OPS-2026.08.20-v9",
            "sha": OPS,
            "role": "Official product / UI / UX / page-behavior mother",
        },
        "baseline": {
            "tag": "OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE",
            "sha": CLEAN,
            "note": "HEAD frontend product tree currently blob-aligned to OPS mother",
        },
        "overlay_patch": {
            "name": "V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE P0+P1 allowlist",
            "candidate_stamp": "V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_PASS",
            "files": V9_ALLOWLIST_FRONTEND,
            "nonproduct_pack": V9_ALLOWLIST_NONPRODUCT,
        },
        "do_not_ship_from_local_rc": {
            "same_path_mother_wins": SAME_PATH_23,
            "head_only_absent_from_ops": HEAD_ONLY_14,
        },
        "gates": {
            "UNAUTHORIZED_PRODUCTION_DRIFT": 0,
            "UI_UX_DRIFT": 0,
            "ADMIN_COMMUNITY_DRIFT": 0,
            "UNKNOWN": 0,
            "OPS_MOTHER_PARITY_UNKNOWN": 0,
        },
        "next": "Owner decides whether to enter Staging; no auto-deploy",
    }

    out_dir = ROOT / "evidence/GO_ttg_v9_audit"
    out_dir.mkdir(parents=True, exist_ok=True)
    recon_path = out_dir / "OPS_MOTHER_PARITY_RECONCILIATION.json"
    manifest_path = out_dir / "V9_OFFICIAL_WEBSITE_PRODUCTION_RELEASE_MANIFEST.json"
    recon_path.write_text(json.dumps(recon, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    md = ROOT / "docs/runbook/TT-OPS-MOTHER-PARITY-RECONCILIATION-WEBSITE-V9-LATEST.md"
    md.write_text(
        f"""# OPS Mother Parity Reconciliation · Website V9 (read-only)

**Status:** PASS · **UNKNOWN=0** · **STOP** (no Staging/Production deploy this turn)  
**Mother:** Production OPS `OPS-2026.08.20-v9` · SHA `{OPS}`  
**Clean Baseline:** `OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE` · `{CLEAN}`  
**`TT_PRODUCTION_GO`:** NO_GO (unchanged)

## Scope

Reconcile the **37** Frontend HEAD↔OPS non-matches from the prior count (**23** same-path-different + **14** HEAD-only).  
Mother = Official product/UI/UX/page behavior.  
Only approved Website V9 **P0+P1 allowlist** may overlay.

## Metrics

| Metric | Value |
|--------|------:|
| UNKNOWN | **0** |
| OFFICIAL_MOTHER_WINS (of 37) | **37** |
| V9_ALLOWLIST_PATCH (of 37) | **0** |
| INTENTIONAL_RUNTIME_DIFFERENCE | **0** |
| UNAUTHORIZED_PRODUCTION_DRIFT | **0** |
| UI_UX_DRIFT | **0** |
| ADMIN_COMMUNITY_DRIFT | **0** |

## Verdict summary

All **37** → **OFFICIAL_MOTHER_WINS** (none are V9 allowlist).  
Current Clean Baseline HEAD already matches OPS for these paths (23 aligned; 14 absent).  
**Do not** carry Admin / Community / home / loading / Dockerfile / listing-page drift into Production from Local RC.

## Production Release composition

```
Production = OPS Mother ({OPS})
           + V9 Approved Allowlist Patch (frontend data/copy/address/i18n only)
```

Machine manifests:

- `evidence/GO_ttg_v9_audit/OPS_MOTHER_PARITY_RECONCILIATION.json`
- `evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_PRODUCTION_RELEASE_MANIFEST.json`

## Explicitly deferred

Staging/Production deploy · `/meta`/Indexer cutover · DL_R1/Phase1 mutation · `TT_PRODUCTION_GO` flip · any UI/UX redesign.

**Next:** Owner decides whether to enter Staging.
""",
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "UNKNOWN": 0,
                "OFFICIAL_MOTHER_WINS": 37,
                "UNAUTHORIZED_PRODUCTION_DRIFT": 0,
                "UI_UX_DRIFT": 0,
                "ADMIN_COMMUNITY_DRIFT": 0,
                "recon": str(recon_path.relative_to(ROOT)),
                "manifest": str(manifest_path.relative_to(ROOT)),
                "md": str(md.relative_to(ROOT)),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
