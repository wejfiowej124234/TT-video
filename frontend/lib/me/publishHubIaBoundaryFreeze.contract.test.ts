import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLISH_HUB_HEADER_NAV } from "@/lib/me/publishHubPhaseAModel";
import { publishHubL5MainDataAttrs } from "@/lib/me/publishHubL5";
import {
  ORDERS_IA_BOUNDARY_PAGE_DATA_ATTR,
  ORDERS_PUBLISH_HUB_BOUNDARY_LINK_DATA_ATTR,
  PROVIDER_PUBLISH_HUB_LINK_DATA_ATTR,
  PUBLISH_HUB_IA_BOUNDARY_ACTIVE,
  PUBLISH_HUB_IA_BOUNDARY_FROZEN,
  PUBLISH_HUB_IA_BOUNDARY_FROZEN_AT,
  PUBLISH_HUB_IA_BOUNDARY_FROZEN_I18N_KEYS,
  PUBLISH_HUB_IA_BOUNDARY_FROZEN_MARKER,
  PUBLISH_HUB_IA_BOUNDARY_FROZEN_SCOPES,
  PUBLISH_HUB_IA_BOUNDARY_HEADER_NAV,
  PUBLISH_HUB_IA_BOUNDARY_PAGE_DATA_ATTR,
  PUBLISH_HUB_IA_BOUNDARY_PROVIDER_LINK,
  PUBLISH_HUB_IA_BOUNDARY_SCORE,
  PUBLISH_HUB_IA_BOUNDARY_SCORE_DOC,
  publishHubIaBoundaryPageDataAttrs,
} from "@/lib/me/publishHubIaBoundaryFreezeModel";
import { ordersListL5MainDataAttrs } from "@/lib/orders/ordersListL5";

const ROOT = process.cwd();

describe("publish hub IA boundary freeze (PUBLISH-HUB-IA-BOUNDARY-SCORE · ACTIVE 100)", () => {
  const scoreDoc = readFileSync(join(ROOT, PUBLISH_HUB_IA_BOUNDARY_SCORE_DOC), "utf8");
  const pageMain = readFileSync(join(ROOT, "app/me/publish/PublishHubPageMain.tsx"), "utf8");
  const ordersHeader = readFileSync(join(ROOT, "app/orders/OrdersListPageHeader.tsx"), "utf8");
  const navModel = readFileSync(join(ROOT, "components/header/headerUserMenuNavModel.ts"), "utf8");
  const providerCard = readFileSync(
    join(ROOT, "components/provider/MerchantWorkbenchMarketExposureCard.tsx"),
    "utf8",
  );
  const taskList = readFileSync(
    join(ROOT, "evidence/GO_local_auth_l5/PUBLISH-HUB-PHASE-TASK-LIST.md"),
    "utf8",
  );
  const gateJson = readFileSync(
    join(ROOT, "evidence/GO_local_auth_l5/publish-hub-l5-local-gate.v1.json"),
    "utf8",
  );

  it("score SSOT declares ACTIVE · FROZEN · 100/100", () => {
    expect(PUBLISH_HUB_IA_BOUNDARY_SCORE).toBe(100);
    expect(PUBLISH_HUB_IA_BOUNDARY_ACTIVE).toBe(true);
    expect(PUBLISH_HUB_IA_BOUNDARY_FROZEN).toBe(true);
    expect(PUBLISH_HUB_IA_BOUNDARY_FROZEN_AT).toBe("2026-06-13");
    expect(PUBLISH_HUB_IA_BOUNDARY_FROZEN_MARKER).toBe("publish-hub-ia-boundary-20260613");
    expect(scoreDoc).toContain("ACTIVE");
    expect(scoreDoc).toContain("FROZEN");
    expect(scoreDoc).toContain("100 / 100");
    expect(scoreDoc).toContain("不再在 ① 新增 Publish Hub 功能");
  });

  it("frozen scopes cover publish · orders · header · provider", () => {
    expect(PUBLISH_HUB_IA_BOUNDARY_FROZEN_SCOPES).toEqual([
      "me_publish_page",
      "orders_boundary_copy",
      "header_menu_naming",
      "provider_cross_links",
    ]);
    expect(PUBLISH_HUB_IA_BOUNDARY_FROZEN_I18N_KEYS).toContain("orders_list_publish_hub_boundary");
    expect(PUBLISH_HUB_IA_BOUNDARY_FROZEN_I18N_KEYS).toContain("header_userMenu_publish_hub");
    expect(PUBLISH_HUB_IA_BOUNDARY_FROZEN_I18N_KEYS).toContain("header_userMenu_my_posts");
  });

  it("page data attrs expose IA boundary frozen marker", () => {
    expect(publishHubIaBoundaryPageDataAttrs()).toEqual({
      [PUBLISH_HUB_IA_BOUNDARY_PAGE_DATA_ATTR]: "1",
      "data-tt-ui-frozen-ia-boundary": PUBLISH_HUB_IA_BOUNDARY_FROZEN_MARKER,
    });
    expect(publishHubL5MainDataAttrs()[PUBLISH_HUB_IA_BOUNDARY_PAGE_DATA_ATTR]).toBe("1");
    expect(ordersListL5MainDataAttrs()[ORDERS_IA_BOUNDARY_PAGE_DATA_ATTR]).toBe("1");
  });

  it("/me/publish keeps five functional rails · no community rail", () => {
    expect(pageMain).not.toContain("PublishHubCommunityRailSection");
    expect(pageMain).not.toContain("usePublishHubCommunityPreview");
    expect(pageMain).toContain("publishHubVisibleContentRails");
  });

  it("/orders reverse boundary copy links to publish hub", () => {
    expect(ordersHeader).toContain("orders_list_publish_hub_boundary");
    expect(ordersHeader).toContain("orders_list_open_publish_hub");
    expect(ordersHeader).toContain(ORDERS_PUBLISH_HUB_BOUNDARY_LINK_DATA_ATTR);
  });

  it("header nav naming frozen: publish hub before orders · posts in community", () => {
    expect(PUBLISH_HUB_IA_BOUNDARY_HEADER_NAV.publishHubLabelKey).toBe("header_userMenu_publish_hub");
    expect(PUBLISH_HUB_IA_BOUNDARY_HEADER_NAV.postsHref).toBe("/community/me/posts");
    expect(PUBLISH_HUB_HEADER_NAV.postsLabelKey).toBe("header_userMenu_my_posts");
    expect(navModel).toContain("header_userMenu_publish_hub");
    expect(navModel).toContain("header_myOrders");
    expect(navModel.indexOf("header_userMenu_publish_hub")).toBeLessThan(navModel.indexOf("header_myOrders"));
    expect(navModel).toContain("header_userMenu_my_posts");
  });

  it("provider workbench cross-link to publish hub merchant rail", () => {
    expect(PUBLISH_HUB_IA_BOUNDARY_PROVIDER_LINK.href).toBe("/me/publish?filter=merchant");
    expect(providerCard).toContain(PROVIDER_PUBLISH_HUB_LINK_DATA_ATTR);
    expect(providerCard).toContain("header_userMenu_publish_hub");
  });

  it("task list + gate declare ① feature freeze · ② only for new work", () => {
    expect(taskList).toContain("IA 边界");
    expect(taskList).toContain("不再在 ① 新增");
    expect(gateJson).toContain("PUBLISH-HUB-IA-BOUNDARY-SCORE.md");
    expect(gateJson).toContain("publish-hub-ia-boundary-20260613");
    expect(gateJson).toContain("publishHubIaBoundaryFreeze");
    expect(gateJson).toContain("ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE.md");
    expect(gateJson).toContain("accountOperatingModelUxWave0");
  });
});
