import { describe, expect, it } from "vitest";
import {
  headerUserMenuNavItems,
  headerUserMenuNavSections,
  headerUserMenuVariantFromUtility,
} from "@/components/header/headerUserMenuNavModel";

describe("headerUserMenuNavModel", () => {
  it("routes 多重身份 to /me/identities hub only", () => {
    const items = headerUserMenuNavItems("light");
    const identity = items.find((i) => i.labelKey === "header_multiIdentity");
    expect(identity?.href).toBe("/me/identities");
    expect(items.some((i) => i.href === "/guide/register")).toBe(false);
    expect(items.some((i) => i.href.includes("role=provider"))).toBe(false);
  });

  it("maps auth L5 utility to authL5 menu variant", () => {
    expect(headerUserMenuVariantFromUtility("authL5")).toBe("authL5");
    expect(headerUserMenuVariantFromUtility("community")).toBe("dark");
  });

  it("authL5 menu: account + mine + tools sections", () => {
    const sections = headerUserMenuNavSections("authL5", { showLikesList: true });
    expect(sections).toHaveLength(3);
    expect(sections[0]?.id).toBe("account");
    expect(sections[0]?.items.map((i) => i.iconId)).toEqual(["identities", "profile"]);
    expect(sections[1]?.id).toBe("mine");
    expect(sections[1]?.items.map((i) => i.iconId)).toEqual(["orders", "posts", "collects", "likes"]);
    expect(sections[2]?.items.map((i) => i.iconId)).toEqual(["reports", "settings"]);
    expect(sections[2]?.id).toBe("tools");
    expect(sections[2]?.items.find((i) => i.iconId === "settings")?.href).toBe("/me/settings");
    const flat = headerUserMenuNavItems("authL5", { showLikesList: true });
    expect(flat.some((i) => i.href === "/community/me/posts")).toBe(true);
    expect(flat.some((i) => i.href === "/community/me/collects")).toBe(true);
    expect(flat.some((i) => i.href === "/community/me/likes")).toBe(true);
    expect(flat.some((i) => i.href === "/pay")).toBe(false);
    expect(flat.some((i) => i.href === "/staking")).toBe(false);
  });

  it("omits likes when showLikesList is false", () => {
    const sections = headerUserMenuNavSections("authL5", { showLikesList: false });
    expect(sections[1]?.items.map((i) => i.iconId)).toEqual(["orders", "posts", "collects"]);
    expect(sections[2]?.items.map((i) => i.iconId)).toEqual(["reports", "settings"]);
  });

  it("flat light menu includes orders posts collects and settings", () => {
    const items = headerUserMenuNavItems("light", { showLikesList: true });
    expect(items.map((i) => i.href)).toEqual([
      "/me/identities",
      "/me/settings/profile",
      "/orders",
      "/community/me/posts",
      "/community/me/collects",
      "/community/me/likes",
      "/community/me/reports",
      "/me/settings",
    ]);
  });
});
