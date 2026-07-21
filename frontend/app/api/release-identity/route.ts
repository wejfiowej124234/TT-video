import { NextResponse } from "next/server";

/**
 * Web Runtime Attestation · mirrors API GET /meta/release-identity.
 * Build/deploy MUST inject NEXT_PUBLIC_PSG_* / TRAVELTRUST_* (see scripts/deploy/_lib.sh).
 * attestation_status=unknown → Version Gate STRICT BLOCK.
 * FG-15: code may land locally; do NOT deploy into certification Staging until ELAPSED.
 */
export const dynamic = "force-dynamic";

function nonempty(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

export async function GET() {
  const psg_release_version =
    nonempty("NEXT_PUBLIC_PSG_RELEASE_VERSION", "TRAVELTRUST_PSG_RELEASE_VERSION", "PSG_RELEASE_VERSION") ??
    "PSG-REL-20260722-STAGING-ALIGN-W0";
  const git_sha =
    nonempty("NEXT_PUBLIC_GIT_SHA", "TRAVELTRUST_GIT_SHA", "GIT_COMMIT_SHA", "SOURCE_VERSION") ?? "unknown";
  const artifact_sha =
    nonempty("NEXT_PUBLIC_ARTIFACT_SHA", "TRAVELTRUST_ARTIFACT_SHA", "TT_ARTIFACT_SHA") ?? git_sha;
  const image_digest =
    nonempty("NEXT_PUBLIC_IMAGE_DIGEST", "TRAVELTRUST_IMAGE_DIGEST", "TT_RUNTIME_IMAGE_SHA", "FLY_IMAGE_REF") ??
    "unknown";
  const build_time =
    nonempty("NEXT_PUBLIC_BUILD_TIME", "TRAVELTRUST_BUILD_TIME", "TRAVELTRUST_DEPLOYED_AT", "BUILD_TIME") ?? null;
  const contract_profile =
    nonempty("NEXT_PUBLIC_CONTRACT_PROFILE", "TRAVELTRUST_CONTRACT_PROFILE", "CONTRACT_PROFILE") ??
    "v311_fund_safety_candidate_v2";
  const database_baseline =
    nonempty("NEXT_PUBLIC_DATABASE_BASELINE", "TRAVELTRUST_DATABASE_BASELINE", "TT_DATABASE_BASELINE") ??
    "staging_rc_ssot_alignment.v1#expected_staging_surface";
  const cms_baseline =
    nonempty("NEXT_PUBLIC_CMS_BASELINE", "TRAVELTRUST_CMS_BASELINE", "TT_CMS_BASELINE") ??
    "public_display_10x4 + catalog_bake=1";
  const attestation_status = git_sha === "unknown" || image_digest === "unknown" ? "unknown" : "ok";

  return NextResponse.json({
    psg_release_version,
    git_sha,
    artifact_sha,
    image_digest,
    build_time,
    contract_profile,
    database_baseline,
    cms_baseline,
    attestation_status,
  });
}
