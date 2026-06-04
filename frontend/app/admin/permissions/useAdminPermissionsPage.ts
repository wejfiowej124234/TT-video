import { useRouter } from "next/navigation";
import { useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { type ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { adminFetchJson, adminErrorUserText, adminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getMe, writeRequestHeaders } from "@/lib/apiClient";
import { writeAdminShellPreviewRole } from "@/lib/admin/adminShellPreviewRole";

export function useAdminPermissionsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const caps = useAdminCapabilities();
  const { canWrite: canAssignRole } = useAdminCanWrite(ADMIN_PERM.USERS_WRITE);
  const [targetUserId, setTargetUserId] = useState("");
  const [targetRole, setTargetRole] = useState<ConsoleRole70>("CS");
  const [assignReason, setAssignReason] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const [selfAssignMsg, setSelfAssignMsg] = useState<string | null>(null);
  const [selfAssignBusy, setSelfAssignBusy] = useState(false);

  const dbPrep = caps.phase2Prep?.admin_console_role_db === true;
  const editPrep = caps.phase2Prep?.permission_center_edit === true;
  const approvalWired = caps.phase2Prep?.console_role_approval_wired === true;
  const totpWired = caps.phase2Prep?.totp_verification_wired === true;
  const consoleRoleDirectAllowed = caps.phase2Prep?.console_role_direct_allowed === true;

  async function assignConsoleRoleToUser(
    userId: string,
    role: ConsoleRole70,
    reason: string,
    setMsg: (v: string | null) => void,
    setBusy: (v: boolean) => void,
  ) {
    if (!canAssignRole || !userId.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const headers = {
        ...writeRequestHeaders(`admin-console-role-${Date.now()}`),
        "x-request-id": `admin-console-role-${Date.now()}`,
      };
      const url = approvalWired
        ? apiUrl(routes.admin.userConsoleRoleChangeRequest(userId.trim()))
        : apiUrl(routes.admin.userConsoleRole(userId.trim()));
      const { res, body } = await adminFetchJson<{
        status?: string;
        error?: string;
        approval_request_id?: string;
      }>("AdminConsoleRoleAssign", url, {
        method: approvalWired ? "POST" : "PUT",
        headers,
        body: JSON.stringify({
          console_role_70: role,
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setMsg(
          adminErrorUserText(
            adminFetchErrorKind(new Error((body as { error?: string }).error ?? "failed")),
            t,
          ),
        );
        return;
      }
      if (approvalWired && body.approval_request_id) {
        setMsg(`${t("admin_permissions_assign_approval_ok")} ${body.approval_request_id}`);
      } else {
        setMsg(t("admin_permissions_assign_ok"));
        writeAdminShellPreviewRole(null);
        router.refresh();
      }
      caps.reload();
    } catch (e) {
      setMsg(adminErrorUserText(adminFetchErrorKind(e), t));
    } finally {
      setBusy(false);
    }
  }

  async function submitConsoleRoleAssign() {
    if (!canAssignRole || !targetUserId.trim()) return;
    await assignConsoleRoleToUser(
      targetUserId.trim(),
      targetRole,
      assignReason,
      setAssignMsg,
      setAssignBusy,
    );
  }

  async function submitSelfConsoleRoleAssign(role: ConsoleRole70, reason: string) {
    const me = await getMe();
    const userId =
      me && typeof me === "object"
        ? String((me as { user?: { id?: string } }).user?.id ?? "").trim()
        : "";
    if (!userId) {
      setSelfAssignMsg(t("admin_permissions_self_role_no_session"));
      return;
    }
    await assignConsoleRoleToUser(userId, role, reason, setSelfAssignMsg, setSelfAssignBusy);
  }

  return {
    caps,
    canAssignRole,
    targetUserId,
    setTargetUserId,
    targetRole,
    setTargetRole,
    assignReason,
    setAssignReason,
    assignBusy,
    assignMsg,
    submitConsoleRoleAssign,
    submitSelfConsoleRoleAssign,
    selfAssignBusy,
    selfAssignMsg,
    dbPrep,
    editPrep,
    approvalWired,
    totpWired,
    consoleRoleDirectAllowed,
  };
}
