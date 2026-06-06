import { describe, expect, it, vi } from "vitest";

import { adminShellLinkPrefetchProps, prefetchAdminShellHref } from "./adminShellPrefetchHref";

describe("adminShellPrefetchHref", () => {
  it("prefetches admin routes only", () => {
    const prefetch = vi.fn();
    prefetchAdminShellHref({ prefetch }, "/admin/users");
    expect(prefetch).toHaveBeenCalledWith("/admin/users");
    prefetch.mockClear();
    prefetchAdminShellHref({ prefetch }, "https://example.com");
    expect(prefetch).not.toHaveBeenCalled();
  });

  it("exposes link prefetch handlers", () => {
    const prefetch = vi.fn();
    const props = adminShellLinkPrefetchProps({ prefetch }, "/admin/orders");
    expect(props.prefetch).toBe(true);
    props.onPointerDown();
    props.onPointerEnter();
    expect(prefetch).toHaveBeenCalledTimes(2);
  });
});
