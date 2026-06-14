import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  PUBLISH_HUB_L5_BANNED_COPY,
  PUBLISH_HUB_L5_CLOSURE_FINDINGS,
  PUBLISH_HUB_L5_LOCALE_KEYS,
  PUBLISH_HUB_L5_OPEN_P0,
  PUBLISH_HUB_L5_OPEN_P1,
  PUBLISH_HUB_PAGE_L5_CLOSURE_PROBE,
  PUBLISH_HUB_PAGE_L5_FROZEN_MARKER,
  PUBLISH_HUB_PAGE_L5_UI_FROZEN,
  PUBLISH_HUB_PHASE_L5_CLOSURE_DOC,
  PUBLISH_HUB_L5_LOCAL_GATE_JSON,
} from "@/lib/me/publishHubL5ClosureSprintModel";
import {
  PUBLISH_HUB_PHASE_L5_CLOSURE_ITEMS,
} from "@/lib/me/publishHubPhaseL5ClosureModel";
import { publishHubL5MainDataAttrs } from "@/lib/me/publishHubL5";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("publish hub L5 full closure (① local · UI frozen)", () => {
  it("phase1 closure doc is ACTIVE and P0/P1 closed", () => {
    const closure = read(PUBLISH_HUB_PHASE_L5_CLOSURE_DOC);
    expect(closure).toContain("ACTIVE");
    expect(closure).toContain("① 本地");
    expect(PUBLISH_HUB_PAGE_L5_UI_FROZEN).toBe(true);
    expect(PUBLISH_HUB_L5_OPEN_P0).toHaveLength(0);
    expect(PUBLISH_HUB_L5_OPEN_P1).toHaveLength(0);
    expect(PUBLISH_HUB_L5_CLOSURE_FINDINGS.filter((f) => f.status === "open")).toHaveLength(0);
  });

  it("L5 closure backlog items A-9～A-13 are closed in machine model", () => {
    const closed = PUBLISH_HUB_PHASE_L5_CLOSURE_ITEMS.filter((i) => i.status === "closed");
    expect(closed.some((i) => i.id === "PH-A-9")).toBe(true);
    expect(closed.some((i) => i.id === "PH-A-13")).toBe(true);
    expect(PUBLISH_HUB_PHASE_L5_CLOSURE_ITEMS.find((i) => i.id === "PH-A-14")?.status).toBe("backlog");
  });

  it("locale keys exist and avoid banned copy", () => {
    for (const key of PUBLISH_HUB_L5_LOCALE_KEYS) {
      const zhVal = (zh as Record<string, string>)[key];
      const enVal = (en as Record<string, string>)[key];
      expect(zhVal, `zh:${key}`).toBeTruthy();
      expect(enVal, `en:${key}`).toBeTruthy();
      expect(zhVal).not.toMatch(PUBLISH_HUB_L5_BANNED_COPY);
      expect(enVal).not.toMatch(PUBLISH_HUB_L5_BANNED_COPY);
    }
  });

  it("page wires frozen marker, smart rails, item cards, filter a11y", () => {
    const main = read("app/me/publish/PublishHubPageMain.tsx");
    expect(publishHubL5MainDataAttrs()["data-tt-publish-hub-l5-closure-probe"]).toBe(
      PUBLISH_HUB_PAGE_L5_CLOSURE_PROBE,
    );
    expect(main).toContain("publishHubVisibleContentRails");
    expect(main).toContain("publishHubFilterArrowKeyNext");
    expect(main).toContain("PublishHubListingInventory");
    expect(read("components/me/publish/PublishHubItemCard.tsx")).toContain("aria-labelledby");
    expect(read("app/me/publish/loading.tsx")).toContain("data-tt-publish-hub-loading");
    expect(read("app/me/publish/error.tsx")).toContain("data-tt-publish-hub-error");
  });

  it("IA boundary score doc is ACTIVE at 100", () => {
    const score = read("evidence/GO_local_auth_l5/PUBLISH-HUB-IA-BOUNDARY-SCORE.md");
    expect(score).toContain("100 / 100");
    expect(score).toContain("① 本地");
  });

  it("orders header wires publish hub boundary link", () => {
    expect(read("app/orders/OrdersListPageHeader.tsx")).toContain("data-tt-orders-list-publish-hub-link");
  });

  it("community post deep link helper and my posts page hook", () => {
    expect(read("lib/me/publishHubCommunityLinks.ts")).toContain("?post=");
    expect(read("app/community/me/posts/useCommunityMePostsPage.ts")).toContain('searchParams.get("post")');
    expect(read("app/me/publish/PublishHubPageMain.tsx")).not.toContain("usePublishHubCommunityPreview");
  });

  it("local gate JSON and smoke script reference full closure", () => {
    const gate = read(PUBLISH_HUB_L5_LOCAL_GATE_JSON);
    expect(gate).toContain("publish-hub-l5-local-gate.v1");
    expect(gate).toContain("publishHubL5FullClosure");
    const smoke = read("../scripts/dev/smoke-publish-hub-local.sh");
    expect(smoke).toContain("publishHubL5FullClosure");
    expect(smoke).toContain("publish-hub-l5.spec.ts");
    expect(smoke).toContain("TT_PUBLISH_HUB_SMOKE: OK");
  });

  it("Next.js proxy routes exist for listing inventory APIs", () => {
    expect(read("app/api/v1/me/acquisition-listings/route.ts")).toContain(
      "/api/v1/me/acquisition-listings",
    );
    expect(read("app/api/v1/me/merchant-listings/route.ts")).toContain("/api/v1/me/merchant-listings");
    expect(read("app/api/v1/me/[...slug]/route.ts")).toContain("meUpstreamPath");
  });

  it("closure probe constants are stable", () => {
    expect(PUBLISH_HUB_PAGE_L5_CLOSURE_PROBE).toBe("publish-hub-full-v1");
    expect(PUBLISH_HUB_PAGE_L5_FROZEN_MARKER).toBe("publish-hub-l5-20260612");
  });
});
