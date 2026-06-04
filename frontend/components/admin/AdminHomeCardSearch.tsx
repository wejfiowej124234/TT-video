"use client";



import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

import { ADMIN_HOME_CARDS, ADMIN_HOME_SECTION_ORDER, type AdminHomeCard } from "@/lib/admin/adminHomeModel";

import { filterAdminHomeCardsForCapabilities } from "@/lib/admin/adminHomeCardPermission";

import { filterAdminHomeCardsForRole } from "@/lib/admin/adminHomeVisibility";

import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";

import { ADMIN_CONSOLE_SEARCH_MARK_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS } from "@/lib/adminUi";

import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";



function matchCard(card: AdminHomeCard, needle: string, t: (k: string) => string): boolean {

  const sectionLabel =

    ADMIN_HOME_SECTION_ORDER.find((s) => s.id === card.section)?.titleKey ?? "";

  const hay = [t(card.titleKey), t(card.descKey), sectionLabel ? t(sectionLabel) : "", card.href]

    .join(" ")

    .toLowerCase();

  return hay.includes(needle);

}



function highlightParts(text: string, needle: string): ReactNode {

  if (!needle) return text;

  const idx = text.toLowerCase().indexOf(needle);

  if (idx < 0) return text;

  return (

    <>

      {text.slice(0, idx)}

      <mark className={ADMIN_CONSOLE_SEARCH_MARK_CLASS}>{text.slice(idx, idx + needle.length)}</mark>

      {text.slice(idx + needle.length)}

    </>

  );

}



/** ① L5：首页模块搜索（主路径可见 · `Ctrl+K` 同源 · `/` 聚焦）。 */

export function AdminHomeCardSearch(props: { prominent?: boolean }) {
  const prominent = props.prominent ?? false;

  const { t } = useTranslation();

  const [q, setQ] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const actor = useAdminShellActor();

  const caps = useAdminCapabilities();



  const visible = useMemo(() => {

    const byRole = filterAdminHomeCardsForRole(ADMIN_HOME_CARDS, actor.role);

    return caps.permissionsLoaded

      ? filterAdminHomeCardsForCapabilities(byRole, caps.hasPermission)

      : byRole;

  }, [actor.role, caps.hasPermission, caps.permissionsLoaded]);



  const needle = q.trim().toLowerCase();

  const hits = useMemo(() => {

    if (!needle) return [];

    return visible.filter((c) => matchCard(c, needle, t)).slice(0, 12);

  }, [needle, visible, t]);



  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {

      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;

      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();

      if (tag === "input" || tag === "textarea" || tag === "select") return;

      e.preventDefault();

      inputRef.current?.focus();

    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);

  }, []);



  if (!caps.permissionsLoaded) return null;



  return (

    <section

      className={`rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 ${prominent ? "shadow-soft sm:p-5" : ""}`}

      aria-label={t("admin_home_search_aria")}

      data-tt-admin-home-search="1"

      data-tt-admin-home-search-prominent={prominent ? "1" : undefined}

    >

      <label className={`block font-medium text-ink-800 ${prominent ? "text-body-l" : "text-small"}`}>

        {prominent ? t("admin_home_search_label_prominent") : t("admin_home_search_label")}

        <input

          ref={inputRef}

          type="search"

          value={q}

          onChange={(e) => setQ(e.target.value)}

          placeholder={t("admin_home_search_ph")}

          className={`mt-2 block w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}

        />

      </label>

      {needle && hits.length === 0 ? (

        <p className="mt-2 text-meta text-ink-500">{t("admin_home_search_empty")}</p>

      ) : null}

      {hits.length > 0 ? (

        <ul className="mt-3 space-y-2">

          {hits.map((card) => {

            const sectionKey = ADMIN_HOME_SECTION_ORDER.find((s) => s.id === card.section)?.titleKey;

            const title = t(card.titleKey);

            return (

              <li key={card.href}>

                <Link

                  href={card.href}

                  className={`${touchTargetLink44Classes} block rounded-[var(--radius-md)] border border-ink-100 bg-ink-50/50 p-3 hover:border-ink-400 hover:bg-white ${travelFocusRingCoreOffset2WhiteClasses}`}

                >

                  <span className="text-small font-medium text-ink-900">

                    {highlightParts(title, needle)}

                  </span>

                  {sectionKey ? (

                    <span className="mt-0.5 block text-meta text-ink-500">{t(sectionKey)}</span>

                  ) : null}

                </Link>

              </li>

            );

          })}

        </ul>

      ) : null}

      {!needle ? (

        <p className="mt-2 text-meta text-ink-500">{t("admin_home_search_hint")}</p>

      ) : null}

    </section>

  );

}

