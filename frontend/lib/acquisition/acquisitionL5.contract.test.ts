import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ACQUISITION_L5_SSOT,
  ACQUISITION_L5_VISUAL_DATA_ATTR,
  TT_ACQUISITION_L5,
  acquisitionL5BondCalloutDataAttrs,
} from "@/lib/acquisition/acquisitionL5";
import { ACQUISITION_PUBLISH_BOND_MIN_USDC } from "@/lib/acquisition/acquisitionBondConstants";

const STUDIO = readFileSync(
  join(process.cwd(), "components", "market", "AcquisitionCarryStudioModal.tsx"),
  "utf8",
);
const HTTP = readFileSync(join(process.cwd(), "lib", "apiClient", "marketSubsite", "http.ts"), "utf8");
const DRAFT = readFileSync(join(process.cwd(), "lib", "marketStudioDraft.ts"), "utf8");
const ADMIN_SUSPEND = readFileSync(
  join(process.cwd(), "components", "admin", "AdminAcquisitionPublishSuspendCard.tsx"),
  "utf8",
);
const COMMUNITY_STRIP = readFileSync(
  join(process.cwd(), "components", "me", "CommunityMeAcquisitionTrustStrip.tsx"),
  "utf8",
);
const READINESS = readFileSync(
  join(process.cwd(), "components", "market", "AcquisitionPublishReadinessPanel.tsx"),
  "utf8",
);
const MARKET_PAGE = readFileSync(
  join(process.cwd(), "components", "market", "MarketStandaloneBusinessPage.tsx"),
  "utf8",
);
const ADMIN_DETAIL = readFileSync(
  join(process.cwd(), "app", "admin", "users", "[id]", "AdminUserDetailPageMain.tsx"),
  "utf8",
);
const ADMIN_LIST = readFileSync(join(process.cwd(), "app", "admin", "users", "AdminUsersPageMain.tsx"), "utf8");
const ADMIN_LIST_TABLE = readFileSync(
  join(process.cwd(), "app", "admin", "users", "AdminUsersDataSection.tsx"),
  "utf8",
);

describe("acquisition L5 contract (PD-009 · ①)", () => {
  it("exports bond SSOT + escrow ack body key", () => {
    expect(ACQUISITION_L5_SSOT.publishBondMinUsdc).toBe(ACQUISITION_PUBLISH_BOND_MIN_USDC);
    expect(ACQUISITION_L5_SSOT.agreeEscrowCopyBodyKey).toBe("agree_escrow_copy");
    expect(ACQUISITION_L5_SSOT.escrowAckErrorKey).toBe("acquisition_escrow_ack_required");
    expect(TT_ACQUISITION_L5.bondCallout).toContain("border-amber-500/30");
    expect(acquisitionL5BondCalloutDataAttrs()["data-tt-acquisition-visual"]).toBe(
      ACQUISITION_L5_VISUAL_DATA_ATTR,
    );
    expect(acquisitionL5BondCalloutDataAttrs()["data-tt-acquisition-bond-honesty"]).toBe(
      "phase1-mock-pg-not-mainnet",
    );
  });

  it("Studio + API publish path sends agree_escrow_copy with catalog POST", () => {
    expect(STUDIO).toContain("agreeEscrowCopy");
    expect(STUDIO).toContain("MeAcquisitionPublishBondAction");
    expect(DRAFT).toContain("agreeEscrowCopy: form.agreeEscrowCopy");
    expect(HTTP).toContain("agree_escrow_copy");
  });

  it("fulfillment bond banner uses L5 callout tokens", () => {
    const banner = readFileSync(
      join(process.cwd(), "components", "market", "AcquisitionFulfillmentBondBanner.tsx"),
      "utf8",
    );
    expect(banner).toContain("AcquisitionFulfillmentBondBanner");
    expect(banner).toContain("acquisitionFulfillmentEligibility");
  });

  it("admin suspend card + community trust strip wired", () => {
    expect(ADMIN_SUSPEND).toContain("AdminAcquisitionPublishSuspendCard");
    expect(ADMIN_SUSPEND).toContain("acquisition-publish-suspend");
    expect(ADMIN_SUSPEND).toContain('id="admin-acquisition-suspend"');
    expect(ADMIN_DETAIL).toContain("AdminAcquisitionPublishSuspendCard");
    expect(ADMIN_DETAIL).toContain("initialSnapshot");
    expect(ADMIN_LIST_TABLE).toContain("acquisition_publish_suspended");
    expect(ADMIN_LIST_TABLE).toContain("#admin-acquisition-suspend");
    expect(ADMIN_LIST).toContain("AdminAcquisitionPublishSuspendModal");
    expect(ADMIN_LIST_TABLE).toContain("admin_users_acquisitionSuspendManage");
    expect(ADMIN_LIST_TABLE).toContain("quickLiftSuspend");
    expect(COMMUNITY_STRIP).toContain("CommunityMeAcquisitionTrustStrip");
    expect(COMMUNITY_STRIP).toContain("TT_COMMUNITY_PAGE_L5");
    expect(COMMUNITY_STRIP).toContain("MeAcquisitionPublishBondAction");
  });

  it("subsite mounts publish readiness checklist (PD-009 L1 visibility)", () => {
    expect(READINESS).toContain("fetchAcquisitionPublishEligibility");
    expect(READINESS).toContain("data-tt-acquisition-publish-readiness");
    expect(MARKET_PAGE).toContain("AcquisitionPublishReadinessPanel");
  });
});
