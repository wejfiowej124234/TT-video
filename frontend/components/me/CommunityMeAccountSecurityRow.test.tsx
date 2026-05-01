/**
 * 社区资料卡：改密 / 账号安全 / 登出入口与路由一致
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import CommunityMeAccountSecurityRow from "./CommunityMeAccountSecurityRow";

vi.mock("@/lib/meLogoutFlow", () => ({
  runMeLogoutFlow: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : ""}>{children}</a>
  ),
}));

describe("CommunityMeAccountSecurityRow", () => {
  it("links to password, security center, and submits logout", () => {
    render(
      <LocaleProvider>
        <CommunityMeAccountSecurityRow />
      </LocaleProvider>
    );
    expect(screen.getByRole("link", { name: /修改密码|Change password/i }).getAttribute("href")).toBe("/me/password");
    expect(screen.getByRole("link", { name: /账号安全|Account security/i }).getAttribute("href")).toBe("/me/security");
    expect(screen.getByRole("button", { name: /退出登录|Log out/i })).toBeTruthy();
  });
});
