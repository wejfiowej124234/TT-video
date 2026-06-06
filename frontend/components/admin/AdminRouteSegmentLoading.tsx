"use client";



import { useTranslation } from "@/components/LocaleProvider";

import { ADMIN_CONSOLE_SKELETON_BLOCK_CLASS, ADMIN_MOTION_SKELETON_CLASS, TT_ADMIN_PAGE_INNER_LIST } from "@/lib/adminUi";



/** 子页切页轻量 loading：顶栏进度 + aria-busy；首屏冷启动仍由 AdminMainBootGate 全骨架承担。 */

export default function AdminRouteSegmentLoading({

  mainAriaLabelKey = "common_loading",

}: {

  mainAriaLabelKey?: string;

}) {

  const { t } = useTranslation();



  return (

    <main

      className={`${TT_ADMIN_PAGE_INNER_LIST} relative min-h-[12rem]`}

      role="status"

      aria-label={t(mainAriaLabelKey)}

      aria-busy="true"

      data-tt-admin-route-segment-loading="1"

    >

      <div

        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-full ${ADMIN_CONSOLE_SKELETON_BLOCK_CLASS}`}

        aria-hidden

      >

        <div

          className={`h-full w-1/3 min-w-[6rem] rounded-full bg-gradient-to-r from-transparent via-amber-400/90 to-transparent ${ADMIN_MOTION_SKELETON_CLASS}`}

          style={{ animationDuration: "1.1s" }}

        />

      </div>

      <span className="sr-only">{t(mainAriaLabelKey)}</span>

    </main>

  );

}


