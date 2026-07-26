"use client";

import { useRouter } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
  ADMIN_INIT_SYSTEM_HREF,
  ADMIN_INIT_SYSTEM_TITLE_KEY,
  TT_ADMIN_CHROME_OPS_INIT_SYSTEM_MARK,
  adminChromeOpsInitSystemConfirmRequest,
  adminShellInitSystemCtaAllowed,
} from "@/lib/admin/adminChromeOpsInitSystem";
import { ADMIN_SHELL_META_CHIP_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * Batch-12 HU-448 · 「初始化系统」仅挂平台设置维护折叠（二次确认后进 Schema 只读）。
 * 禁止挂工作台主条 / Shell 顶栏。
 */
export function AdminChromeOpsInitSystemEntry(props: {
  surface: "config_maintainer";
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const requestConfirm = useAdminL5ConfirmRequest();

  if (!adminShellInitSystemCtaAllowed(props.surface)) return null;

  return (
    <button
      type="button"
      className={`${touchTargetLink44Classes} ${ADMIN_SHELL_META_CHIP_CLASS} ${travelFocusRingOffset2Classes}`}
      data-tt-admin-chrome-ops-init-system="hu448"
      data-tt-admin-chrome-ops-init-system-mark={TT_ADMIN_CHROME_OPS_INIT_SYSTEM_MARK}
      data-tt-admin-chrome-ops-init-surface={props.surface}
      onClick={() => {
        requestConfirm(
          adminChromeOpsInitSystemConfirmRequest(() => {
            router.push(ADMIN_INIT_SYSTEM_HREF);
          }),
        );
      }}
    >
      {t(ADMIN_INIT_SYSTEM_TITLE_KEY)}
    </button>
  );
}
