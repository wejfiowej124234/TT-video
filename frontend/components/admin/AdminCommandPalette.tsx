"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_COMMAND_PALETTE_OPEN_EVENT } from "@/lib/admin/adminCommandPaletteBus";
import { adminCommandPaletteEntries } from "@/lib/admin/adminCommandPaletteEntries";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";
import { ADMIN_FORM_FIELD_FOCUS_CLASS } from "@/lib/adminUi";
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-ink-900/40 p-4 pt-[12vh]"
      role="presentation"
      data-tt-admin-command-palette="1"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("admin_command_palette_aria")}
        className="w-full max-w-lg rounded-[var(--radius-xl)] border border-ink-200 bg-white shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-ink-100 p-4">
          <label className="block text-small font-medium text-ink-800">
            {t("admin_command_palette_label")}
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("admin_command_palette_ph")}
              className={`mt-2 block w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
                  className={`${touchTargetLink44Classes} block rounded-[var(--radius-md)] px-3 py-2.5 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
                  onClick={(e) => {
                    e.preventDefault();
                    close();
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
      </div>
    </div>
  );
}
