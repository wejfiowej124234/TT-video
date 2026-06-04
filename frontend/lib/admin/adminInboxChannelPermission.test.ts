import { describe, expect, it } from "vitest";
import {
  ADMIN_INBOX_CHANNEL_PERMISSION,
  canAccessAdminInboxChannel,
} from "./adminInboxChannelPermission";
import { ADMIN_PERM } from "./adminPermissionIds";

describe("adminInboxChannelPermission", () => {
  it("maps inbox keys to queue permissions", () => {
    expect(ADMIN_INBOX_CHANNEL_PERMISSION.provider).toBe(ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW);
    expect(ADMIN_INBOX_CHANNEL_PERMISSION.steward).toBe(ADMIN_PERM.ONBOARDING_STEWARD_REVIEW);
    expect(ADMIN_INBOX_CHANNEL_PERMISSION.approvals).toBe(ADMIN_PERM.APPROVE);
    expect(ADMIN_INBOX_CHANNEL_PERMISSION.reports).toBe(ADMIN_PERM.COMMUNITY_READ);
  });

  it("canAccessAdminInboxChannel requires permissionsLoaded", () => {
    const has = () => true;
    expect(canAccessAdminInboxChannel("approvals", has, false)).toBe(false);
    expect(canAccessAdminInboxChannel("approvals", has, true)).toBe(true);
  });
});
