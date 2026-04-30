"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { isMeFullFetchSkippedByDevEnv } from "@/lib/apiClient/me";

/**
 * 当 `NEXT_PUBLIC_SKIP_ME_FETCH=1`（且非 production）时置顶提示，避免把「跳过 GET /me」误判为未登录或后端故障。
 */
export default function SkipMeFetchDevBanner() {
  const { t } = useTranslation();
  if (!isMeFullFetchSkippedByDevEnv()) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[450] border-t border-warning/50 bg-warning/95 px-3 py-2 text-center text-meta text-white shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
    >
      {t("dev_skip_me_fetch_banner")}
    </div>
  );
}
