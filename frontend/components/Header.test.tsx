/**
 * 54-S18：登录后顶栏用户菜单（个人中心、我的订单等）
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
const postLogout = vi.fn();
const applyLocalLogoutAfterServerOk = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  getMe: (...args: unknown[]) => getMe(...args),
  clearGetMeCache: vi.fn(),
  postLogout: (...args: unknown[]) => postLogout(...args),
  applyLocalLogoutAfterServerOk: (...args: unknown[]) => applyLocalLogoutAfterServerOk(...args),
}));

describe("Header (54-S18 UserMenu)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    postLogout.mockReset();
    applyLocalLogoutAfterServerOk.mockReset();
    postLogout.mockResolvedValue({ status: "ok" });
    getMe.mockResolvedValue({ user: { nickname: "MenuUser" } });
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

  it("opens user menu and exposes profile link to /me", async () => {
    render(
      <LocaleProvider>
        <Header />
      </LocaleProvider>
    );
    await waitFor(() => screen.getByRole("button", { name: "用户菜单" }));
    fireEvent.click(screen.getByRole("button", { name: "用户菜单" }));
    const profile = screen.getByRole("link", { name: "个人中心" });
    expect(profile.getAttribute("href")).toBe("/me");
  });

  it("without traveltrust_user_id shows login link, not user menu", () => {
    localStorage.removeItem("traveltrust_user_id");
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
      return Promise.resolve({ user: { nickname: "Fresh" } });
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

    resolveSlow!({ user: { nickname: "Stale" } });
    await waitFor(() => {
      expect(screen.queryByText("Stale")).toBeNull();
    });
    expect(screen.getByText("Fresh")).toBeTruthy();
  });
});
