"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminContentPageShell } from "@/components/admin/content/AdminContentPageShell";
import { AdminOpsHubNavTiles } from "@/components/admin/ops/AdminOpsHubNavTiles";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { ADMIN_SHELL_CONTENT_NAV_LINKS } from "@/lib/admin/adminShellContentNavLinks";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import {
  CONTENT_HUB_SECTIONS,
  contentHubSectionLinks,
} from "@/lib/admin/contentOpsL5";
import { getAdminContentPublishQueue } from "@/lib/apiClient/content/http";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_SECONDARY_CLASS,
  ADMIN_TABLE_INLINE_LINK_CLASS,
} from "@/lib/adminUi";

/** Content hub · visual strip + queue + searchable section tiles (Batch-13 FP-D). */
export function AdminContentHubMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const searchId = useId();
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [tileQuery, setTileQuery] = useState("");

  const reloadQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueueError(null);
    try {
      const res = await getAdminContentPublishQueue();
      const n =
        typeof res.count === "number"
          ? res.count
          : Array.isArray(res.items)
            ? res.items.length
            : 0;
      setQueueCount(n);
    } catch {
      setQueueCount(null);
      setQueueError("admin_content_hub_queue_load_failed");
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadQueue();
  }, [reloadQueue]);

  const needle = tileQuery.trim().toLowerCase();

  const sections = useMemo(() => {
    return CONTENT_HUB_SECTIONS.map((section) => {
      const links = contentHubSectionLinks(section, ADMIN_SHELL_CONTENT_NAV_LINKS).filter((link) => {
        if (!needle) return true;
        const label = t(link.labelKey).toLowerCase();
        return label.includes(needle) || link.href.toLowerCase().includes(needle);
      });
      return { section, links };
    }).filter(({ links }) => links.length > 0 || !needle);
  }, [needle, t]);

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_hub_title"
      subtitleKey="admin_content_hub_subtitle_ops"
      loading={false}
      error={null}
      writePermission={ADMIN_PERM.CONTENT_WRITE}
      mainDataAttrs={{ "data-tt-admin-batch9-l5-sample": "content" }}
    >
      <p className={`mb-4 text-body-m ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_content_hub_body_cs1")}</p>

      {/* CC4 · 官网视觉首屏条 */}
      <section
        className={`mb-4 ${ADMIN_FILTER_CARD_CLASS}`}
        data-tt-admin-content-hub-visual="1"
        aria-label={t("admin_content_hub_visual_strip_title")}
      >
        <p className="text-body font-medium text-ink-900">{t("admin_content_hub_visual_strip_title")}</p>
        <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_content_hub_visual_strip_hint")}</p>
        <div className="mt-2 flex flex-wrap gap-4">
          <Link
            href="/admin/content/landing-ambient"
            className={ADMIN_TABLE_INLINE_LINK_CLASS}
            data-tt-admin-content-hub-visual-ambient="1"
          >
            {t("admin_content_hub_visual_ambient")}
          </Link>
          <Link
            href="/admin/content/media-assets"
            className={ADMIN_TABLE_INLINE_LINK_CLASS}
            data-tt-admin-content-hub-visual-media="1"
          >
            {t("admin_content_hub_visual_media")}
          </Link>
          <Link
            href="/admin/content/publish-queue"
            className={ADMIN_TABLE_INLINE_LINK_CLASS}
            data-tt-admin-content-hub-visual-queue="1"
          >
            {t("admin_content_hub_visual_queue")}
          </Link>
        </div>
      </section>

      <section
        className={`mb-4 ${ADMIN_FILTER_CARD_CLASS}`}
        data-tt-admin-content-hub-queue="1"
        aria-label={t("admin_content_hub_queue_aria")}
      >
        <OpsPlaneFetchStates
          loading={queueLoading}
          error={queueError}
          onRetry={() => void reloadQueue()}
          loadingMessageKey="ops_plane_loading"
          empty={false}
        >
          <p className="text-body font-medium text-ink-900">
            {t("admin_content_hub_queue_title")}
            {queueCount != null ? (
              <span className="ml-2 tabular-nums text-ink-900" data-tt-admin-content-hub-queue-count="1">
                {queueCount}
              </span>
            ) : (
              <span className="ml-2">—</span>
            )}
          </p>
          <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_content_hub_queue_hint")}</p>
          <Link
            href="/admin/content/publish-queue"
            className="mt-2 inline-block text-body-s text-ref-sun underline"
            data-tt-admin-content-hub-queue-link="1"
          >
            {t("admin_content_hub_queue_open")}
          </Link>
        </OpsPlaneFetchStates>
      </section>

      <section
        className={`mb-4 ${ADMIN_FILTER_CARD_CLASS}`}
        data-tt-admin-content-hub-community="1"
        aria-label={t("admin_content_hub_community_title")}
      >
        <p className="text-body font-medium text-ink-900">{t("admin_content_hub_community_title")}</p>
        <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_content_hub_community_hint")}</p>
        <Link
          href="/admin/community/reports"
          className="mt-2 inline-block text-body-s text-ref-sun underline"
          data-tt-admin-content-hub-community-link="/admin/community/reports"
        >
          {t("admin_content_hub_community_link")}
        </Link>
      </section>

      {/* CC11 · 磁贴搜索 */}
      <div className="mb-4">
        <label htmlFor={searchId} className={`block text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}>
          {t("admin_content_hub_tile_search_label")}
          <input
            id={searchId}
            type="search"
            className={`mt-1 w-full max-w-md min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={tileQuery}
            onChange={(e) => setTileQuery(e.target.value)}
            placeholder={t("admin_content_hub_tile_search_placeholder")}
            data-tt-admin-content-hub-tile-search="1"
          />
        </label>
      </div>

      {sections.map(({ section, links }) => (
        <section
          key={section.id}
          className="mb-6"
          data-tt-admin-content-hub-section-daily={section.id === "daily" ? "1" : undefined}
          data-tt-admin-content-hub-section-catalog={section.id === "catalog" ? "1" : undefined}
          data-tt-admin-content-hub-section-tool={section.id === "tool" ? "1" : undefined}
        >
          <div className="mb-2 flex flex-wrap items-baseline gap-2">
            <h2 className="text-body font-medium text-ink-900">{t(section.titleKey)}</h2>
            {section.badgeKey ? (
              <span className={`text-meta ${ADMIN_TEXT_META_CLASS}`}>{t(section.badgeKey)}</span>
            ) : null}
          </div>
          <AdminOpsHubNavTiles
            links={links}
            maxTiles={Math.max(links.length, 1)}
            dataTtAttr="data-tt-admin-content-hub-link"
            showMoreFold={links.length > 6}
          />
        </section>
      ))}
    </AdminContentPageShell>
  );
}
