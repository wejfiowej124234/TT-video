"use client";

import { useId } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminGuideApplicationReviewCard } from "@/components/admin/AdminGuideApplicationReviewCard";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminProviderApplicationReviewCard } from "@/components/admin/AdminProviderApplicationReviewCard";
import { AdminStewardApplicationReviewCard } from "@/components/admin/AdminStewardApplicationReviewCard";
import type { OnboardingQueueKind } from "@/lib/admin/adminOnboardingQueueRowDisplay";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_INLINE_LINK_CLASS, ADMIN_TEXT_MUTED_CLASS } from "@/lib/adminUi";

/**
 * Batch-11 HU-363 · 入驻申请专用详情（路由 id = user_id · 与 Admin API 同源）。
 */
export function AdminOnboardingApplicationDetailPageMain(props: { kind: OnboardingQueueKind }) {
  const { t } = useTranslation();
  const titleId = useId();
  const params = useParams();
  const raw = params?.id;
  const userId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";

  const titleKey =
    props.kind === "provider"
      ? "admin_provider_app_title"
      : props.kind === "steward"
        ? "admin_steward_app_title"
        : "admin_guide_app_title";
  const listHref =
    props.kind === "provider"
      ? "/admin/provider-applications"
      : props.kind === "steward"
        ? "/admin/steward-applications"
        : "/admin/guide-applications";

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t(titleKey)}
      subtitle={t("admin_onboarding_detail_subtitle")}
      mainDataAttrs={{
        "data-tt-admin-onboarding-detail": props.kind,
        "data-testid": `admin-${props.kind}-application-detail`,
      }}
    >
      <AdminPermissionDeniedBanner permission={ADMIN_PERM.READ} />
      <p className={`mb-4 text-meta ${ADMIN_TEXT_MUTED_CLASS}`}>
        <Link href={listHref} className={ADMIN_INLINE_LINK_CLASS} data-tt-admin-onboarding-detail-back="1">
          {t("admin_onboarding_detail_back")}
        </Link>
        {" · "}
        <Link
          href={`/admin/users/${encodeURIComponent(userId)}`}
          className={ADMIN_INLINE_LINK_CLASS}
        >
          {t("admin_onboarding_detail_open_user")}
        </Link>
      </p>
      {!userId ? (
        <p className="text-body text-ink-600" role="alert">
          {t("admin_onboarding_detail_missing_id")}
        </p>
      ) : props.kind === "provider" ? (
        <AdminProviderApplicationReviewCard userId={userId} />
      ) : props.kind === "steward" ? (
        <AdminStewardApplicationReviewCard userId={userId} />
      ) : (
        <AdminGuideApplicationReviewCard userId={userId} />
      )}
    </AdminDetailPageChrome>
  );
}
