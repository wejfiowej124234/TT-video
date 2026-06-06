/**
 * 54-S18：登录后顶栏用户菜单（社区资料、多重身份 Hub、我的订单等）
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import Header from "./Header";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/orders",
  useRouter: () => ({ push: mockPush, prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt: string }) {
    return <img alt={props.alt} />;
  },
}));

vi.mock("@/components/header/headerUserMenuButtonA11y", () => ({
  headerUserMenuButtonA11yLabel: () => "用户菜单",
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useChainId: () => 137,
  useConnect: () => ({
    connect: vi.fn(),
    connectors: [{ name: "Injected", uid: "io.metamask" }],
    isPending: false,
  }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

const getMe = vi.fn();
const getAuthHeaders = vi.fn();
const postLogout = vi.fn();
const applyLocalLogoutAfterServerOk = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  getMe: (...args: unknown[]) => getMe(...args),
  clearGetMeCache: vi.fn(),
  getAuthHeaders: (...args: unknown[]) => getAuthHeaders(...args),
  postLogout: (...args: unknown[]) => postLogout(...args),
  applyLocalLogoutAfterServerOk: (...args: unknown[]) => applyLocalLogoutAfterServerOk(...args),
  AUTH_USER_ID_KEY: "traveltrust_user_id",
}));

describe("Header (54-S18 UserMenu)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    postLogout.mockReset();
    applyLocalLogoutAfterServerOk.mockReset();
    getAuthHeaders.mockReturnValue({ "X-User-Id": "test-user-1" });
    postLogout.mockResolvedValue({ status: "ok" });
    getMe.mockResolvedValue({ user: { id: "test-user-1", nickname: "MenuUser" } });
    localStorage.setItem("traveltrust_user_id", "test-user-1");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("logged-in user sees user menu and nickname after getMe", async () => {
    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "用户菜单" })).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByText("MenuUser")).toBeTruthy();
    });
  });

  it("logout calls POST /auth/logout then applies local session clear and navigates home", async () => {
    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    );
    await waitFor(() => screen.getByRole("button", { name: "用户菜单" }));
    fireEvent.click(screen.getByRole("button", { name: "用户菜单" }));
    const logoutBtn = screen.getByRole("menuitem", { name: "退出" });
    fireEvent.click(logoutBtn);
    await waitFor(() => {
      expect(postLogout).toHaveBeenCalledTimes(1);
    });
    expect(applyLocalLogoutAfterServerOk).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("opens user menu and exposes profile via clickable profile strip", async () => {
    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    );
    await waitFor(() => screen.getByRole("button", { name: "用户菜单" }));
    fireEvent.click(screen.getByRole("button", { name: "用户菜单" }));
    await waitFor(() => {
      const profileLinks = screen
        .getAllByRole("link")
        .filter((el) => el.getAttribute("href") === "/me/settings/profile");
      expect(profileLinks).toHaveLength(1);
    });
  });

  it("user menu exposes orders, tools section (reports + settings), and mine content links", async () => {
    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    );
    await waitFor(() => screen.getByRole("button", { name: "用户菜单" }));
    fireEvent.click(screen.getByRole("button", { name: "用户菜单" }));
    const ordersLink = screen.getByRole("link", { name: /我的订单|订单/i });
    expect(ordersLink.getAttribute("href")).toBe("/orders");
    expect(screen.getByRole("link", { name: "我的举报" }).getAttribute("href")).toBe("/community/me/reports");
    expect(screen.getByRole("link", { name: "设置" }).getAttribute("href")).toBe("/me/settings");
    expect(screen.getByText("我的")).toBeTruthy();
    expect(screen.getByText("工具与设置")).toBeTruthy();
  });

  it("user menu exposes my posts and saved links for published community content", async () => {
    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    );
    await waitFor(() => screen.getByRole("button", { name: "用户菜单" }));
    fireEvent.click(screen.getByRole("button", { name: "用户菜单" }));
    expect(screen.getByRole("link", { name: "我的发布" }).getAttribute("href")).toBe("/community/me/posts");
    expect(screen.getByRole("link", { name: "我的收藏" }).getAttribute("href")).toBe("/community/me/collects");
    expect(screen.getByRole("link", { name: "赞过" }).getAttribute("href")).toBe("/community/me/likes");
  });

  it("user menu links 多重身份 / 角色与入驻 to /me/identities hub (not inline role apply links)", async () => {
    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    );
    await waitFor(() => screen.getByRole("button", { name: "用户菜单" }));
    fireEvent.click(screen.getByRole("button", { name: "用户菜单" }));
    const hub = screen.getByRole("link", { name: "多重身份 / 角色与入驻" });
    expect(hub.getAttribute("href")).toBe("/me/identities");
    expect(screen.queryByRole("group", { name: "多重身份" })).toBeNull();
    expect(screen.queryByRole("link", { name: "申请向导" })).toBeNull();
  });

  it("without traveltrust_user_id shows login link, not user menu", () => {
    localStorage.removeItem("traveltrust_user_id");
    getAuthHeaders.mockReturnValue({});
    getMe.mockResolvedValue({ user: null });
    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    );
    expect(screen.getByRole("link", { name: "登录" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "用户菜单" })).toBeNull();
  });

  it("UserMenu ignores stale getMe when profile-updated fires before first getMe resolves", async () => {
    let resolveSlow: (v: unknown) => void;
    const slow = new Promise<unknown>((resolve) => {
      resolveSlow = resolve;
    });
    let getMeCall = 0;
    getMe.mockImplementation(() => {
      getMeCall += 1;
      if (getMeCall === 1) return slow;
      return Promise.resolve({ user: { id: "test-user-1", nickname: "Fresh" } });
    });

    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    );

    await waitFor(() => expect(getMeCall).toBe(1));

    window.dispatchEvent(new Event("traveltrust:profile-updated"));

    await waitFor(() => expect(getMeCall).toBe(2));
    await waitFor(() => {
      expect(screen.getByText("Fresh")).toBeTruthy();
    });

    resolveSlow!({ user: { id: "test-user-1", nickname: "Stale" } });
    await waitFor(() => {
      expect(screen.queryByText("Stale")).toBeNull();
    });
    expect(screen.getByText("Fresh")).toBeTruthy();
  });
});
