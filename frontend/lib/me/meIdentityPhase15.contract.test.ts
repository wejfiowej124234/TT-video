import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api";

/** ①.5 · 04 §3.4 路由与 Hub 数据链对拍（非 UI） */
describe("meIdentityPhase15 contract", () => {
  it("routes include wallets and role-applications", () => {
    expect(routes.meWallets).toBe("/api/v1/me/wallets");
    expect(routes.meRoleApplications).toBe("/api/v1/me/role-applications");
  });
});
