import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

const AUTH_FLOW_PAGES = [
  "forgot-password/page.tsx",
  "reset-password/page.tsx",
  "verify-email/page.tsx",
] as const;

function readFlowSources(): string {
  const pages = AUTH_FLOW_PAGES.map((p) => readFileSync(join(process.cwd(), "app", "auth", p), "utf8"));
  const shared = ["AuthL5FlowPage.tsx", "AuthL5Card.tsx", "AuthL5PageBackdrop.tsx"].map((f) =>
    readFileSync(join(process.cwd(), "components", "auth", f), "utf8"),
  );
  return [...pages, ...shared].join("\n");
}

describe("auth flow pages L5 (forgot · reset · verify)", () => {
  const src = readFlowSources();

  it("uses AuthL5FlowPage + AuthL5Card + shared form tokens", () => {
    expect(src).toContain("AuthL5FlowPage");
    expect(src).toContain("AuthL5Card");
    expect(src).toContain("TT_AUTH_L5_FORM");
    expect(src).toContain('data-tt-auth-visual="l5"');
  });

  it("avoids legacy console light shell on page body", () => {
    expect(src).not.toContain("bg-bg-main");
    expect(src).not.toContain("bg-bg-console");
    expect(src).not.toContain("AuthShellCrossNav");
    expect(src).not.toMatch(/bg-travel-500/);
  });

  it("exports warm glass card + gradient CTA from authL5Form", () => {
    expect(TT_AUTH_L5_FORM.card).toContain("border-ref-sun");
    expect(TT_AUTH_L5_FORM.primaryCta).toMatch(/ref-sun|gradient/);
    expect(TT_AUTH_L5_FORM.fieldFocus).not.toContain("ring-offset-bg-console");
  });

  it("keeps submit anchors per route", () => {
    expect(src).toContain('data-tt-auth-forgot-submit="1"');
    expect(src).toContain('data-tt-auth-reset-submit="1"');
    expect(src).toContain('data-tt-auth-verify-email-submit="1"');
  });
});
