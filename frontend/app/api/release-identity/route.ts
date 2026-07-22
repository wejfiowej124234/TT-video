import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Web Runtime Attestation · mirrors API GET /meta/release-identity.
 * Prefer docker-bake file (`public/tt-release-identity.bake.json`) over Fly secrets —
 * stale TRAVELTRUST_GIT_SHA secrets caused「一部署又显示旧 tip」.
 */
export const dynamic = "force-dynamic";

type BakeIdentity = {
  git_sha?: string;
  artifact_sha?: string;
  image_digest?: string;
  build_time?: string | null;
  psg_release_version?: string;
  contract_profile?: string;
  database_baseline?: string;
  cms_baseline?: string;
};

function nonempty(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

function readBakeIdentity(): BakeIdentity | null {
  try {
    const p = join(process.cwd(), "public", "tt-release-identity.bake.json");
    const raw = readFileSync(p, "utf8");
    return JSON.parse(raw) as BakeIdentity;
  } catch {
    return null;
  }
}

export async function GET() {
  const bake = readBakeIdentity();
  const psg_release_version =
    bake?.psg_release_version?.trim() ||
    nonempty("NEXT_PUBLIC_PSG_RELEASE_VERSION", "TRAVELTRUST_PSG_RELEASE_VERSION", "PSG_RELEASE_VERSION") ||
    "PSG-REL-20260722-STAGING-ALIGN-W0";
  const git_sha =
    bake?.git_sha?.trim() ||
    nonempty("NEXT_PUBLIC_GIT_SHA", "TRAVELTRUST_GIT_SHA", "GIT_COMMIT_SHA", "SOURCE_VERSION") ||
    "unknown";
  const artifact_sha =
    bake?.artifact_sha?.trim() ||
    nonempty("NEXT_PUBLIC_ARTIFACT_SHA", "TRAVELTRUST_ARTIFACT_SHA", "TT_ARTIFACT_SHA") ||
    git_sha;
  const image_digest =
    bake?.image_digest?.trim() ||
    nonempty("NEXT_PUBLIC_IMAGE_DIGEST", "TRAVELTRUST_IMAGE_DIGEST", "TT_RUNTIME_IMAGE_SHA", "FLY_IMAGE_REF") ||
    "unknown";
  const build_time =
    bake?.build_time?.trim() ||
    nonempty("NEXT_PUBLIC_BUILD_TIME", "TRAVELTRUST_BUILD_TIME", "TRAVELTRUST_DEPLOYED_AT", "BUILD_TIME") ||
    null;
  const contract_profile =
    bake?.contract_profile?.trim() ||
    nonempty("NEXT_PUBLIC_CONTRACT_PROFILE", "TRAVELTRUST_CONTRACT_PROFILE", "CONTRACT_PROFILE") ||
    "v311_fund_safety_candidate_v2";
  const database_baseline =
    bake?.database_baseline?.trim() ||
    nonempty("NEXT_PUBLIC_DATABASE_BASELINE", "TRAVELTRUST_DATABASE_BASELINE", "TT_DATABASE_BASELINE") ||
    "staging_rc_ssot_alignment.v1#expected_staging_surface";
  const cms_baseline =
    bake?.cms_baseline?.trim() ||
    nonempty("NEXT_PUBLIC_CMS_BASELINE", "TRAVELTRUST_CMS_BASELINE", "TT_CMS_BASELINE") ||
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
    identity_source: bake?.git_sha ? "docker-bake" : "env-or-secret",
  });
}
