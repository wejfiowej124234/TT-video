"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";

import { AdminSuccessBanner } from "@/components/admin/AdminSuccessBanner";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function AdminUsersRoleSuccessBanner({
  roleSuccessApprovalId,
  setRoleSuccessApprovalId,
  t,
}: {
  roleSuccessApprovalId: string;
  setRoleSuccessApprovalId: Dispatch<SetStateAction<string | null>>;
  t: (key: string) => string;
}) {
  return (
    <AdminSuccessBanner
      className="mt-6"
      message={
        <>
          <p>
            {t("admin_users_roleSuccessPrefix")}{" "}
            <span className="font-mono text-meta">{roleSuccessApprovalId}</span>
            {t("admin_users_roleSuccessSuffix")}
          </p>
          <Link
            href="/admin/approvals"
            className={`mt-2 ${adminPageNavLinkClass()}`}
          >
            {t("admin_users_linkApprovals")}
          </Link>
          <form
            className="ml-4 inline"
            onSubmit={(e) => {
              e.preventDefault();
              setRoleSuccessApprovalId(null);
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] px-3 text-small text-ink-700 hover:bg-success/15 hover:underline ${ADMIN_LINK_FOCUS_CLASS}`}
            >
              {t("admin_users_roleDismissSuccess")}
            </button>
          </form>
        </>
      }
    />
  );
}
