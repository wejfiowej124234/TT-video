"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { ADMIN_PERMISSION_MATRIX_ROWS } from "@/lib/admin/adminPermissionIds";
import {
  CONSOLE_ROLE_70_LABEL_KEYS,
  CONSOLE_ROLES_70,
  type ConsoleRole70,
} from "@/lib/admin/adminRole70Matrix";
import { orderConsoleRoles70WithCurrentFirst } from "@/lib/admin/adminConsoleRole70PickOrder";
import { adminErrorUserText, adminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_SURFACE_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TIER_SUPER_WRITE_BADGE_CLASS,
  ADMIN_ROLE_MATRIX_DIFF_ROW_CLASS,
  ADMIN_ROLE_MATRIX_DIFF_TEXT_CLASS,
  adminPageNavLinkClass,
  ADMIN_ROLE_MATRIX_CURRENT_ROW_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_INNER_DIVIDER_CLASS,
  ADMIN_PERMISSION_YES_TEXT_CLASS,} from "@/lib/adminUi";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

import { AdminPermissions2faPolicyPanel } from "./AdminPermissions2faPolicyPanel";
import { AdminPermissionsTotpPanel } from "./AdminPermissionsTotpPanel";
import { AdminConsoleRoleEffectiveStrip } from "@/components/admin/AdminConsoleRoleEffectiveStrip";
import { AdminPermissionsMaintainerFold } from "@/components/admin/AdminPermissionsMaintainerFold";
import { AdminPermissionsMatrixLegend } from "@/components/admin/AdminPermissionsMatrixLegend";
import { AdminPermissionsProductionSafetyPanel } from "@/components/admin/AdminPermissionsProductionSafetyPanel";
import { AdminPhase2ClosurePrepPanel } from "@/components/admin/AdminPhase2ClosurePrepPanel";
import { AdminAdmU01LocalPrepPanel } from "@/components/admin/AdminAdmU01LocalPrepPanel";
import { AdminPhase2StagingRecordPanel } from "@/components/admin/AdminPhase2StagingRecordPanel";
import { AdminPermissionsPhase2RunbookStrip } from "@/components/admin/AdminPermissionsPhase2RunbookStrip";
import { AdminPhase2RemainingBacklogPanel } from "@/components/admin/AdminPhase2RemainingBacklogPanel";
import { AdminPermissionsSelfConsoleRole } from "@/components/admin/AdminPermissionsSelfConsoleRole";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { PERMISSIONS_PAGE_RELATED_FOLD_LINKS } from "@/lib/admin/adminPermissionsRelatedFoldLinks";
import { AdminConsoleRoleShellPreview } from "./AdminConsoleRoleShellPreview";
import { useAdminPermissionsPage } from "./useAdminPermissionsPage";

type RoleMatrixSortKey = "role" | "perm_count" | "diff";

/** 70 · ① 权限中心（能力包真值来自 `GET /api/v1/admin/capabilities`）。 */
export function AdminPermissionsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const phase2BannerId = useId();
  const {
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
  } = useAdminPermissionsPage();

  const maintainer = isAdminMaintainerUi(caps.role);

  const capsErrorKind = caps.capabilitiesUnavailable
    ? adminFetchErrorKind(new Error(String(caps.errorCode ?? caps.error ?? "failed")))
    : null;

  const { sort: matrixSort, toggle: matrixToggle, ariaSort: matrixAriaSort } =
    useAdminTableSort<RoleMatrixSortKey>("role", "asc");
  const sortedMatrixRoles = useMemo(() => {
    if (!caps.roleMatrixPreview) return orderConsoleRoles70WithCurrentFirst(caps.consoleRole70);
    const currentRole = caps.consoleRole70;
    const currentSet = new Set(currentRole ? (caps.roleMatrixPreview[currentRole] ?? []) : []);
    const roleOrder = orderConsoleRoles70WithCurrentFirst(currentRole);
    return sortRowsByKey(roleOrder, matrixSort.key, matrixSort.dir, (roleId, key) => {
      const perms = caps.roleMatrixPreview?.[roleId] ?? [];
      if (key === "perm_count") return perms.length;
      if (key === "diff") {
        if (!currentRole || roleId === currentRole) return 0;
        const otherSet = new Set(perms);
        let diff = 0;
        for (const p of otherSet) if (!currentSet.has(p)) diff++;
        for (const p of currentSet) if (!otherSet.has(p)) diff++;
        return diff;
      }
      return roleOrder.indexOf(roleId);
    });
  }, [caps.roleMatrixPreview, caps.consoleRole70, matrixSort.key, matrixSort.dir]);

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_permissions_title")}
      subtitle={
        <>
          <p>{t("admin_permissions_subtitle_l5")}</p>
          {maintainer && caps.matrixVersion ? (
            <p className="mt-1 font-mono text-small text-ink-800 text-ink-500">{caps.matrixVersion}</p>
          ) : null}
          {!caps.loading && !caps.capabilitiesUnavailable && caps.consoleRole70 ? (
            <p className="mt-2 text-small text-ink-700" data-tt-admin-permissions-console-role-line="1">
              <span className="font-medium">{t("admin_permissions_console_role")}:</span>{" "}
              {t(CONSOLE_ROLE_70_LABEL_KEYS[caps.consoleRole70])}
              {maintainer ? (
                <span className="ml-2 font-mono text-small text-ink-800 text-ink-500">
                  ({caps.role ?? "—"} → {caps.consoleRole70})
                </span>
              ) : null}
            </p>
          ) : null}
        </>
      }
      inferWritePermission={false}
      mainDataAttrs={{
        "data-tt-admin-permissions": "1",
        "data-tt-admin-permissions-phase2-prep": "1",
      }}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={PERMISSIONS_PAGE_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_ops_list_related_aria"
        foldSummaryKey="admin_ops_list_related_fold"
        dataTtFold="permissions"
      />
      <AdminPermissionsProductionSafetyPanel
        phase2Prep={caps.phase2Prep}
        consoleRoleDirectAllowed={consoleRoleDirectAllowed}
      />

      <AdminConsoleRoleEffectiveStrip />

      <AdminPermissionsPhase2RunbookStrip />

      <AdminAdmU01LocalPrepPanel />

      <AdminPermissionsSelfConsoleRole
        canAssign={canAssignRole}
        dbPrep={dbPrep}
        approvalWired={approvalWired}
        consoleRoleDirectAllowed={consoleRoleDirectAllowed}
        currentConsoleRole={caps.consoleRole70}
        busy={selfAssignBusy}
        message={selfAssignMsg}
        onAssignSelf={submitSelfConsoleRoleAssign}
      />

      <AdminPermissionsMaintainerFold>
        <AdminPhase2ClosurePrepPanel />

        <AdminPhase2StagingRecordPanel />

        <AdminPhase2RemainingBacklogPanel />

        <AdminNoticeBanner
          tone="readonly"
          size="lg"
          className="mt-6"
          id={phase2BannerId}
          dataAttrs={{ "data-tt-admin-phase2-prep-banner": "1" }}
          message={
            <>
              <p className="font-medium">
                {editPrep
                  ? t("admin_permissions_phase2_banner_title_db_ready")
                  : t("admin_permissions_phase2_banner_title")}
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>
                  {dbPrep
                    ? t("admin_permissions_phase2_item_role_db_done")
                    : t("admin_permissions_phase2_item_role_db")}
                </li>
                <li>
                  {editPrep
                    ? approvalWired
                      ? t("admin_permissions_phase2_item_edit_approval")
                      : t("admin_permissions_phase2_item_edit_prep")
                    : t("admin_permissions_phase2_item_edit")}
                </li>
                <li>
                  {totpWired
                    ? t("admin_permissions_phase2_item_2fa_prep")
                    : t("admin_permissions_phase2_item_2fa")}
                </li>
                <li>{t("admin_permissions_phase2_item_staging")}</li>
              </ul>
              {maintainer && caps.consoleRoleSource?.includes("OVERRIDE") ? (
                <p className="mt-2 font-mono text-small text-ink-800">{t("admin_permissions_override_hint")}</p>
              ) : null}
            </>
          }
        />
      </AdminPermissionsMaintainerFold>

      {editPrep && canAssignRole ? (
        <AdminWarmL5Surface
          as="section"
          className="mt-6"
          aria-label={t("admin_permissions_assign_aria")}
          data-tt-admin-console-role-assign="1"
        >
          <h2 className="text-body font-semibold text-ink-900">{t("admin_permissions_assign_title")}</h2>
          <p className="mt-1 text-small text-ink-600">
            {approvalWired
              ? t("admin_permissions_assign_hint_approval")
              : t("admin_permissions_assign_hint")}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block text-small">
              <span className="font-medium text-ink-800">{t("admin_permissions_assign_user_id")}</span>
              <input
                className={`mt-1 block w-full min-w-[240px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 font-mono text-small text-ink-800`}
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              />
            </label>
            <label className="block text-small">
              <span className="font-medium text-ink-800">{t("admin_permissions_assign_role")}</span>
              <select
                className={`mt-1 block ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5`}
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as ConsoleRole70)}
              >
                {CONSOLE_ROLES_70.map((r) => (
                  <option key={r} value={r}>
                    {t(CONSOLE_ROLE_70_LABEL_KEYS[r])}
                  </option>
                ))}
              </select>
            </label>
            <label className="block flex-1 text-small">
              <span className="font-medium text-ink-800">{t("admin_permissions_assign_reason")}</span>
              <input
                className={`mt-1 block w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5`}
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={assignBusy || !targetUserId.trim()}
              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled:opacity-50`}
              onClick={() => void submitConsoleRoleAssign()}
            >
              {assignBusy ? t("admin_permissions_assign_busy") : t("admin_permissions_assign_submit")}
            </button>
          </div>
          {assignMsg ? <p className="mt-3 text-small text-ink-700">{assignMsg}</p> : null}
        </AdminWarmL5Surface>
      ) : null}

      {totpWired ? <AdminPermissionsTotpPanel /> : null}
      {totpWired ? <AdminPermissions2faPolicyPanel /> : null}

      {caps.loading ? (
        <AdminListLoadingStatus message={t("admin_capability_strip_loading")} className="mt-6 text-small text-ink-600" />
      ) : capsErrorKind ? (
        <AdminListFetchError
          errorKind={capsErrorKind}
          message={adminErrorUserText(capsErrorKind, t)}
          className="mt-6"
        />
      ) : (
        <>
          <AdminWarmL5Surface as="section" className="mt-6" aria-label={t("admin_permissions_my_grants_aria")}>
            <h2 className="text-body font-semibold text-ink-900">{t("admin_permissions_my_grants")}</h2>
            <div className={`mt-3 ${ADMIN_TABLE_SURFACE_CLASS}`}>
              <table className="min-w-full text-left text-small">
                <thead className={ADMIN_TABLE_THEAD_CLASS}>
                  <tr>
                    <th scope="col" className="px-3 py-2">{t("admin_permissions_col_perm")}</th>
                    <th scope="col" className="px-3 py-2">{t("admin_permissions_col_label")}</th>
                    <th scope="col" className="px-3 py-2">{t("admin_permissions_col_granted")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_PERMISSION_MATRIX_ROWS.map((row) => {
                    const granted = caps.hasPermission(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={ADMIN_INNER_DIVIDER_CLASS}
                        data-tt-admin-perm-row={row.id}
                      >
                        <td className="px-3 py-2 font-mono text-small text-ink-800">{row.id}</td>
                        <td className="px-3 py-2">
                          {t(row.labelKey)}
                          {row.superOnly ? (
                            <span className={ADMIN_TIER_SUPER_WRITE_BADGE_CLASS}>
                              {t("admin_home_card_tier_super_write")}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          {granted ? (
                            <span className={ADMIN_PERMISSION_YES_TEXT_CLASS}>{t("admin_permissions_yes")}</span>
                          ) : (
                            <span className="text-ink-400">{t("admin_permissions_no")}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminWarmL5Surface>

          {caps.roleMatrixPreview ? (
            <AdminWarmL5Surface
              as="section"
              className="mt-10"
              aria-label={t("admin_permissions_matrix_aria")}
              data-tt-admin-permissions-matrix-card="1"
            >
              <h2 className="text-body font-semibold text-ink-900">
                {t("admin_permissions_matrix_title")}
              </h2>
              <p className="mt-1 text-small text-ink-600">{t("admin_permissions_matrix_hint")}</p>
              <AdminPermissionsMatrixLegend />
              <div className={`mt-3 ${ADMIN_TABLE_SURFACE_CLASS}`}>
                <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
                  <thead className={ADMIN_TABLE_THEAD_CLASS}>
                    <tr>
                      <AdminSortableTh
                        label={t("admin_permissions_col_role")}
                        ariaSort={matrixAriaSort("role")}
                        onToggle={() => matrixToggle("role")}
                      />
                      <AdminSortableTh
                        label={t("admin_permissions_col_perm_count")}
                        ariaSort={matrixAriaSort("perm_count")}
                        onToggle={() => matrixToggle("perm_count")}
                      />
                      <AdminSortableTh
                        label={t("admin_permissions_col_diff")}
                        ariaSort={matrixAriaSort("diff")}
                        onToggle={() => matrixToggle("diff")}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMatrixRoles.map((roleId) => {
                      const perms = caps.roleMatrixPreview?.[roleId] ?? [];
                      const active = caps.consoleRole70 === roleId;
                      const currentRole = caps.consoleRole70;
                      const currentSet = new Set(
                        currentRole ? (caps.roleMatrixPreview?.[currentRole] ?? []) : [],
                      );
                      const otherSet = new Set(perms);
                      let diff = 0;
                      if (currentRole && !active) {
                        for (const p of otherSet) if (!currentSet.has(p)) diff++;
                        for (const p of currentSet) if (!otherSet.has(p)) diff++;
                      }
                      return (
                        <tr
                          key={roleId}
                          className={`${ADMIN_INNER_DIVIDER_CLASS} ${active ? ADMIN_ROLE_MATRIX_CURRENT_ROW_CLASS : diff > 0 ? ADMIN_ROLE_MATRIX_DIFF_ROW_CLASS : ""}`}
                          data-tt-admin-role70-row={roleId}
                          data-tt-admin-role70-current={active ? "1" : undefined}
                          data-tt-admin-role70-diff={diff > 0 && !active ? String(diff) : undefined}
                        >
                          <td className="px-3 py-2 font-medium">
                            {t(CONSOLE_ROLE_70_LABEL_KEYS[roleId])}
                            {active ? (
                              <span className="ml-2 text-meta text-ink-600">
                                ({t("admin_permissions_current_role")})
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 font-mono text-small text-ink-800">{perms.length}</td>
                          <td className="px-3 py-2 font-mono text-small text-ink-800">
                            {active ? (
                              t("admin_permissions_diff_same")
                            ) : diff > 0 ? (
                              <span className={ADMIN_ROLE_MATRIX_DIFF_TEXT_CLASS}>
                                {t("admin_permissions_matrix_diff", { count: diff })}
                              </span>
                            ) : (
                              t("admin_permissions_diff_none")
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </AdminWarmL5Surface>
          ) : null}

          {caps.roleMatrixPreview ? (
            <AdminConsoleRoleShellPreview currentRole={caps.consoleRole70} />
          ) : null}
        </>
      )}

    </AdminDetailPageChrome>
  );
}
