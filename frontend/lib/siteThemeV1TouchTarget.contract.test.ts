/**
 * §3.2.9 G8 · P5-4 主路径 CTA/Tab 抽检：Action token 须含 min-h-[44px]（①）
 */
import { describe, expect, it } from "vitest";
import {
  TT_COMMUNITY_FEED_ACTION,
  TT_COMMUNITY_PAGE_L5,
  TT_COMMUNITY_SHELL_L5,
  TT_MARKETING_ACTION_PERIOD_TAB_ACTIVE,
  TT_MARKETING_BTN_MARKET_PRIMARY_PILL,
  TT_MARKETING_DID_RANK_TAB_ACTIVE,
  TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE,
} from "./marketingUi";

const TOUCH_MIN = /min-h-\[(44|48)px\]/;

describe("site theme V1 · P5-4 touch targets (G8)", () => {
  it("marketDark Action tabs and primary CTAs declare 44px+ min height", () => {
    expect(TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE).toMatch(TOUCH_MIN);
    expect(TT_MARKETING_ACTION_PERIOD_TAB_ACTIVE).toMatch(TOUCH_MIN);
    expect(TT_MARKETING_BTN_MARKET_PRIMARY_PILL).toMatch(TOUCH_MIN);
    expect(TT_MARKETING_DID_RANK_TAB_ACTIVE).toMatch(TOUCH_MIN);
  });

  it("community shell and feed Action tokens declare 44px min height", () => {
    expect(TT_COMMUNITY_SHELL_L5.tabBaseClass).toMatch(TOUCH_MIN);
    expect(TT_COMMUNITY_FEED_ACTION.sortChipBase).toMatch(TOUCH_MIN);
    expect(TT_COMMUNITY_FEED_ACTION.filterChipBase).toMatch(TOUCH_MIN);
    expect(TT_COMMUNITY_FEED_ACTION.publishFab).toMatch(TOUCH_MIN);
    expect(TT_COMMUNITY_PAGE_L5.primaryCtaFilled).toMatch(TOUCH_MIN);
  });
});
