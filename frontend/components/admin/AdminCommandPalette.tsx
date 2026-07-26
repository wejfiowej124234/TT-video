"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_COMMAND_PALETTE_OPEN_EVENT } from "@/lib/admin/adminCommandPaletteBus";
import { adminCommandPaletteEntries } from "@/lib/admin/adminCommandPaletteEntries";
import { adminChromeOpsInitSystemConfirmRequest } from "@/lib/admin/adminChromeOpsInitSystem";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { useAdminShellPrefetchHref } from "@/lib/admin/useAdminShellLinkPrefetch";
import { ADMIN_COMMAND_PALETTE_HEADER_CLASS, ADMIN_COMMAND_PALETTE_HIT_CLASS, ADMIN_FORM_CONTROL_MD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_MODAL_OVERLAY_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

function matchEntry(
  needle: string,
  title: string,
  section: string,
  href: string,
  keywords: string[],
): boolean {
  const hay = [title, section, href, ...keywords].join(" ").toLowerCase();
  return hay.includes(needle);
}

/** ① Admin 全局跳转：⌘K / Ctrl+K（权限过滤后的真实路由）。 */
export function AdminCommandPalette() {
  const { t } = useTranslation();
  const router = useRouter();
  const actor = useAdminShellActor();
  const caps = useAdminCapabilities();
  const prefetchHref = useAdminShellPrefetchHref();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = useMemo(
    () =>
      adminCommandPaletteEntries(actor.role, caps.hasPermission, caps.permissionsLoaded),
    [actor.role, caps.hasPermission, caps.permissionsLoaded],
  );

  const needle = q.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!needle) return entries.slice(0, 16);
    return entries
      .filter((e) =>
        matchEntry(needle, t(e.titleKey), t(e.sectionKey), e.href, e.keywords),
      )
      .slice(0, 16);
  }, [entries, needle, t]);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(ADMIN_COMMAND_PALETTE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(ADMIN_COMMAND_PALETTE_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (open) {
      const id = window.requestAnimationFrame(() => inputRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open || hits.length === 0) return;
    for (const entry of hits.slice(0, 8)) {
      prefetchHref(entry.href);
    }
  }, [open, hits, prefetchHref]);

  if (!open) return null;

  return (
    <div
      className={`${ADMIN_MODAL_OVERLAY_CLASS} flex items-start justify-center p-4 pt-[12vh]`}
      role="presentation"
      data-tt-admin-command-palette="1"
      onClick={close}
    >
      <AdminWarmL5Surface
        as="div"
        role="dialog"
        aria-modal="true"
        aria-label={t("admin_command_palette_aria")}
        className="w-full max-w-lg"
        pad="none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={ADMIN_COMMAND_PALETTE_HEADER_CLASS}>
          <label className="block text-small font-medium text-ink-800">
            {t("admin_command_palette_label")}
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("admin_command_palette_ph")}
              className={`mt-2 block w-full min-h-[44px] px-3 py-2 text-small ${ADMIN_FORM_CONTROL_MD_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          <p className="mt-2 text-meta text-ink-500">{t("admin_command_palette_hint")}</p>
        </div>
        <ul className="max-h-[min(24rem,50vh)] overflow-y-auto p-2" role="listbox">
          {hits.length === 0 ? (
            <li className="px-3 py-4 text-small text-ink-500">{t("admin_command_palette_empty")}</li>
          ) : (
            hits.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  role="option"
                  prefetch
                  onPointerEnter={() => prefetchHref(entry.href)}
                  className={`${touchTargetLink44Classes} ${ADMIN_COMMAND_PALETTE_HIT_CLASS} ${travelFocusRingCoreOffset2WhiteClasses}`}
                  onClick={(e) => {
                    e.preventDefault();
                    close();
                    prefetchHref(entry.href);
                    // HU-448 · 初始化系统等危险项须二次确认
                    if (entry.requiresConfirm) {
                      requestConfirm(
                        adminChromeOpsInitSystemConfirmRequest(() => {
                          router.push(entry.href);
                        }),
                      );
                      return;
                    }
                    router.push(entry.href);
                  }}
                >
                  <span className="text-small font-medium text-ink-900">{t(entry.titleKey)}</span>
                  <span className="mt-0.5 block text-meta text-ink-500">{t(entry.sectionKey)}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </AdminWarmL5Surface>
    </div>
  );
}
