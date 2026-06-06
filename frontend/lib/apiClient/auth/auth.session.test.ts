import { describe, it, expect, beforeEach, vi } from "vitest";
import { applyClientSessionAfterAuth, syncClientSessionUserIdCookieFromStorage } from "./sessionSideEffects";
import { AUTH_SESSION_TOKEN_KEY } from "../core";

describe("applyClientSessionAfterAuth (07 Phase 4 / 53-S23)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes user_id and dispatches traveltrust:auth-change", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const out = applyClientSessionAfterAuth({ user_id: id, token: "tts_testopaque" });
    expect(out).toBe(id);
    expect(localStorage.getItem("traveltrust_user_id")).toBe(id);
    expect(localStorage.getItem(AUTH_SESSION_TOKEN_KEY)).toBe("tts_testopaque");
    expect(document.cookie).toContain("traveltrust_session_ok=1");
    expect(dispatch).toHaveBeenCalled();
    const ev = dispatch.mock.calls[0][0] as CustomEvent;
    expect(ev.type).toBe("traveltrust:auth-change");
  });

  it("syncClientSessionUserIdCookieFromStorage mirrors localStorage to cookie when token present", () => {
    localStorage.setItem("traveltrust_user_id", "550e8400-e29b-41d4-a716-446655440000");
    localStorage.setItem(AUTH_SESSION_TOKEN_KEY, "tts_testopaque");
    expect(syncClientSessionUserIdCookieFromStorage()).toBe(true);
    expect(document.cookie).toContain("traveltrust_user_id=");
    expect(document.cookie).toContain("traveltrust_session_ok=1");
  });

  it("syncClientSessionUserIdCookieFromStorage skips cookie-only without token", () => {
    localStorage.setItem("traveltrust_user_id", "550e8400-e29b-41d4-a716-446655440000");
    expect(syncClientSessionUserIdCookieFromStorage()).toBe(false);
  });

  it("returns undefined when user_id missing", () => {
    expect(applyClientSessionAfterAuth({})).toBeUndefined();
    expect(localStorage.getItem("traveltrust_user_id")).toBeNull();
  });
});
