"use client";

import { createElement, type ReactNode } from "react";

import { AdminHomeInboxProvider } from "@/lib/admin/useAdminHomeInbox";
import { AdminHomeKpiProvider } from "@/lib/admin/useAdminHomeKpi";

/** Single fetch for inbox + KPI queues under admin shell (avoids N× parallel list calls). */
export function AdminHomeQueuesProvider({ children }: { children: ReactNode }) {
  return createElement(
    AdminHomeInboxProvider,
    null,
    createElement(AdminHomeKpiProvider, null, children),
  );
}
