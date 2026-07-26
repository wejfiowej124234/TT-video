"use client";

import { AdminActorCapabilityStrip } from "@/components/admin/AdminActorCapabilityStrip";
import { AdminBusinessSuperAdminShortcutBanner } from "@/components/admin/AdminBusinessSuperAdminShortcutBanner";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";

/**
 * Batch-8 WP-02 / HU-072 · 082 · 094：
 * 运营发布面 **不** 渲染「运营控制台」说教横幅与展开说明能力条。
 * 维护者诊断：能力条 + C2 SuperAdmin 捷径（仍仅 maintainer）。
 */
export function AdminShellPublishChrome() {
  const actor = useAdminShellActor();
  if (actor.loading || !isAdminMaintainerUi(actor.role)) {
    return null;
  }
  return (
    <>
      <AdminBusinessSuperAdminShortcutBanner />
      <AdminActorCapabilityStrip />
    </>
  );
}
