import { describe, expect, it, vi } from "vitest";

describe("communityMediaAbsoluteUrlForRender", () => {
  it("passes through blob and absolute http(s) URLs", async () => {
    vi.resetModules();
    const { communityMediaAbsoluteUrlForRender } = await import("./communityMediaClientUrl");
    expect(communityMediaAbsoluteUrlForRender("blob:http://localhost/x")).toBe("blob:http://localhost/x");
    expect(communityMediaAbsoluteUrlForRender("https://cdn.example/a.mp4")).toBe("https://cdn.example/a.mp4");
  });

  it("remaps cdn.example.test playback URLs before render", async () => {
    vi.resetModules();
    const { communityMediaAbsoluteUrlForRender } = await import("./communityMediaClientUrl");
    const id = "35bebf2b-4cef-4d64-b9ac-40291914cd6e";
    expect(communityMediaAbsoluteUrlForRender(`https://cdn.example.test/playback/${id}.mp4`)).toBe(
      `http://127.0.0.1:19000/traveltrust-community-media/community/media/${id}.mp4`,
    );
  });

  it("strips Git Bash MSYS path prefix before render", async () => {
    vi.resetModules();
    const { communityMediaAbsoluteUrlForRender, normalizePersistedCommunityMediaPath } = await import(
      "./communityMediaClientUrl"
    );
    const polluted =
      "C:/Program Files/Git/api/v1/uploads/community-posts/55a9b570-e5f2-42a2-9337-8b6f00e9d9b2.png";
    const clean = "/api/v1/uploads/community-posts/55a9b570-e5f2-42a2-9337-8b6f00e9d9b2.png";
    expect(normalizePersistedCommunityMediaPath(polluted)).toBe(clean);
    expect(communityMediaAbsoluteUrlForRender(polluted)).toBe(clean);
  });

  it("prefixes site-relative API paths with apiUrl in SSR (no window)", async () => {
    vi.resetModules();
    const { communityMediaAbsoluteUrlForRender } = await import("./communityMediaClientUrl");
    const { apiUrl } = await import("./api");
    const rel = "/api/v1/uploads/community-posts/00000000-0000-4000-8000-000000000099.mp4";
    const saved = globalThis.window;
    // @ts-expect-error vitest · simulate SSR
    delete globalThis.window;
    expect(communityMediaAbsoluteUrlForRender(rel)).toBe(apiUrl(rel));
    globalThis.window = saved;
  });

  it("remaps Official OCS legacy upload paths to Tigris public objects", async () => {
    vi.resetModules();
    const { communityMediaAbsoluteUrlForRender, COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST } = await import(
      "./communityMediaClientUrl"
    );
    const file = "ocs-dubai-luxury-community-cover.jpg";
    const expected = `https://${COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST}/official-cold-start/v1/${file}`;
    expect(communityMediaAbsoluteUrlForRender(`/api/v1/uploads/community-posts/${file}`)).toBe(expected);
    expect(
      communityMediaAbsoluteUrlForRender(
        `https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/${file}`,
      ),
    ).toBe(expected);
    expect(
      communityMediaAbsoluteUrlForRender(
        "https://www.web3-ttg.com/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg",
      ),
    ).toBe(
      `https://${COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST}/official-cold-start/v1/ocs-tokyo-photo-official-guide-cover.jpg`,
    );
    const userUpload = "/api/v1/uploads/community-posts/55a9b570-e5f2-42a2-9337-8b6f00e9d9b2.png";
    expect(communityMediaAbsoluteUrlForRender(userUpload)).toBe(userUpload);
  });

  it("remaps Official OCS legacy upload paths to Tigris (Network must not hit /uploads/…/ocs-*)", async () => {
    vi.resetModules();
    const {
      communityMediaAbsoluteUrlForRender,
      normalizeDurableCommunityMediaUrl,
      COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST,
    } = await import("./communityMediaClientUrl");
    const legacy =
      "https://www.web3-ttg.com/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg";
    const expected = `https://${COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST}/official-cold-start/v1/ocs-tokyo-photo-official-guide-cover.jpg`;
    expect(normalizeDurableCommunityMediaUrl(legacy)).toBe(expected);
    expect(communityMediaAbsoluteUrlForRender(legacy)).toBe(expected);
    expect(normalizeDurableCommunityMediaUrl(legacy)).not.toContain("/api/v1/uploads/community-posts/ocs-");
  });

  it("resolves protocol-relative CDN URLs to absolute http(s)", async () => {
    vi.resetModules();
    const { communityMediaAbsoluteUrlForRender } = await import("./communityMediaClientUrl");
    const out = communityMediaAbsoluteUrlForRender("//cdn.example.com/a.jpg");
    expect(out).toMatch(/^https?:\/\/cdn\.example\.com\/a\.jpg$/);
  });

  it("prefixes api/ and auth/ without leading slash via browser rewrite", async () => {
    vi.resetModules();
    const { communityMediaAbsoluteUrlForRender } = await import("./communityMediaClientUrl");
    const rel = "api/v1/uploads/community-posts/x.webp";
    expect(communityMediaAbsoluteUrlForRender(rel)).toBe("/api/v1/uploads/community-posts/x.webp");
    expect(communityMediaAbsoluteUrlForRender("auth/session")).toBe("/auth/session");
  });

  it("keeps root-relative web app paths on the same origin (split-host parity with outbound)", async () => {
    vi.resetModules();
    const { communityMediaAbsoluteUrlForRender } = await import("./communityMediaClientUrl");
    expect(communityMediaAbsoluteUrlForRender("/guides/42")).toBe("/guides/42");
    expect(communityMediaAbsoluteUrlForRender("/market/foo")).toBe("/market/foo");
  });
});

describe("outboundUrlFromPersisted", () => {
  it("keeps non-API root-relative paths on the web app origin", async () => {
    vi.resetModules();
    const { outboundUrlFromPersisted } = await import("./communityMediaClientUrl");
    expect(outboundUrlFromPersisted("/market/foo")).toBe("/market/foo");
    expect(outboundUrlFromPersisted("/community")).toBe("/community");
  });

  it("resolves API and auth paths like communityMediaAbsoluteUrlForRender", async () => {
    vi.resetModules();
    const { outboundUrlFromPersisted } = await import("./communityMediaClientUrl");
    const rel = "/api/v1/uploads/x/y.pdf";
    expect(outboundUrlFromPersisted(rel)).toBe(rel);
    expect(outboundUrlFromPersisted("//api/v1/z")).toBe("/api/v1/z");
    expect(outboundUrlFromPersisted("api/v1/uploads/a.mp4")).toBe("/api/v1/uploads/a.mp4");
    expect(outboundUrlFromPersisted("/auth/session")).toBe("/auth/session");
  });

  it("passes through absolute http(s) and mailto", async () => {
    vi.resetModules();
    const { outboundUrlFromPersisted } = await import("./communityMediaClientUrl");
    expect(outboundUrlFromPersisted("https://maps.example/p")).toBe("https://maps.example/p");
    expect(outboundUrlFromPersisted("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(outboundUrlFromPersisted("tel:+15551212")).toBe("tel:+15551212");
  });

  it("matches render helper for persisted upload URLs and for web app routes (split-host parity)", async () => {
    vi.resetModules();
    const { outboundUrlFromPersisted, communityMediaAbsoluteUrlForRender } = await import(
      "./communityMediaClientUrl",
    );
    const { apiUrl } = await import("./api");
    const upload = "/api/v1/uploads/x/a.webp";
    expect(outboundUrlFromPersisted(upload)).toBe(communityMediaAbsoluteUrlForRender(upload));
    const appRoute = "/guides/42";
    expect(outboundUrlFromPersisted(appRoute)).toBe(appRoute);
    expect(communityMediaAbsoluteUrlForRender(appRoute)).toBe(appRoute);
    expect(outboundUrlFromPersisted(appRoute)).toBe(communityMediaAbsoluteUrlForRender(appRoute));
    expect(communityMediaAbsoluteUrlForRender("/auth/session")).toBe("/auth/session");
  });
});

describe("communityMediaNextImageUnoptimized", () => {
  it("flags blob, data, API upload paths, Tigris, and CDN hosts", async () => {
    vi.resetModules();
    const {
      communityMediaNextImageUnoptimized,
      COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST,
      COMMUNITY_MEDIA_CDN_PUBLIC_HOST,
    } = await import("./communityMediaClientUrl");
    expect(communityMediaNextImageUnoptimized("")).toBe(false);
    expect(communityMediaNextImageUnoptimized("blob:http://localhost/x")).toBe(true);
    expect(communityMediaNextImageUnoptimized("data:image/png;base64,xx")).toBe(true);
    expect(communityMediaNextImageUnoptimized("https://x.example/api/v1/uploads/y.jpg")).toBe(true);
    expect(communityMediaNextImageUnoptimized("https://x.example/api/v1/uploads/other-kind/z.webp")).toBe(true);
    expect(communityMediaNextImageUnoptimized("https://cdn.example/a.jpg")).toBe(false);
    expect(
      communityMediaNextImageUnoptimized(
        "https://images.unsplash.com/photo-1547150492-da7ff1742941?auto=format&fit=crop&w=640&q=75",
      ),
    ).toBe(true);
    expect(
      communityMediaNextImageUnoptimized(
        `https://${COMMUNITY_MEDIA_TIGRIS_PUBLIC_HOST}/official-cold-start/v1/ocs-tokyo-photo-official-guide-cover.jpg`,
      ),
    ).toBe(true);
    expect(
      communityMediaNextImageUnoptimized(
        `https://${COMMUNITY_MEDIA_CDN_PUBLIC_HOST}/official-cold-start/v1/ocs-tokyo-photo-official-guide-cover.jpg`,
      ),
    ).toBe(true);
  });
});
