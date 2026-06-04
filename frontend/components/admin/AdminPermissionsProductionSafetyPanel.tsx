"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import type { AdminPhase2PrepFlags } from "@/lib/admin/adminRole70Matrix";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type Props = {
  phase2Prep: AdminPhase2PrepFlags | null;
  consoleRoleDirectAllowed: boolean;
};

/** RBAC-06 · ③ 预备：2FA 强制与禁止直写 PUT 的 UI 诚实闸（非 Production GO）。 */
export function AdminPermissionsProductionSafetyPanel(props: Props) {
  const { t } = useTranslation();
  const { phase2Prep, consoleRoleDirectAllowed } = props;
  const enforce2fa = phase2Prep?.enforce_2fa === true;
  const productionGo = phase2Prep?.production_admin_go === true;

  if (productionGo) return null;

  const show =
    enforce2fa || !consoleRoleDirectAllowed || phase2Prep?.production_admin_go === false;
  if (!show) return null;

  return (
    <AdminNoticeBanner
      tone="warning"
      size="lg"
      className="mt-6"
      dataAttrs={{
        "data-tt-admin-production-safety-panel": "1",
        "data-tt-admin-production-safety-direct-allowed": consoleRoleDirectAllowed ? "1" : "0",
        "data-tt-admin-production-safety-enforce-2fa": enforce2fa ? "1" : "0",
      }}
      message={
        <div className="space-y-2">
          <p className="font-medium">{t("admin_production_safety_title")}</p>
          <ul className="list-inside list-disc space-y-1 text-small">
            {enforce2fa ? <li>{t("admin_production_safety_2fa")}</li> : null}
            {!consoleRoleDirectAllowed ? (
              <li>{t("admin_production_safety_no_direct_put")}</li>
            ) : (
              <li>{t("admin_production_safety_direct_put_local")}</li>
            )}
            <li>{t("admin_production_safety_not_go")}</li>
          </ul>
          <p className="text-meta">{t("admin_production_safety_staging_gate")}</p>
          <p>
            <Link
              href="/admin/permissions#admin-permissions-totp"
              className={adminPageNavLinkClass()}
            >
              {t("admin_production_safety_totp_link")}
            </Link>
          </p>
        </div>
      }
    />
  );
}
