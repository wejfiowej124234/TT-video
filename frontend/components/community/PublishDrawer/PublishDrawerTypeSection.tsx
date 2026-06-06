"use client";

import { TYPES } from "./constants";
import { communityShellTabFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import type { PublishDrawerFormModel } from "./usePublishForm";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type PublishDrawerTypeSectionProps = {
  t: LocaleTranslateFn;
  publishTypeLabelId: string;
  form: Pick<PublishDrawerFormModel, "type" | "setType">;
  /** 对象存储视频管线未就绪时禁用「视频」类型 */
  videoTypeDisabled: boolean;
  /** 点击禁用态「视频」时的提示（如对象存储未就绪） */
  videoDisabledHint?: string;
  onVideoTypeBlocked?: () => void;
};

export function PublishDrawerTypeSection({
  t,
  publishTypeLabelId,
  form,
  videoTypeDisabled,
  videoDisabledHint,
  onVideoTypeBlocked,
}: PublishDrawerTypeSectionProps) {
  return (
    <section className="rounded-[var(--radius-xl)] border-2 border-ref-sun/28 bg-ink-800/60 px-4 py-4" aria-labelledby={publishTypeLabelId}>
      <label id={publishTypeLabelId} className="block text-small font-medium text-slate-300 mb-3">
        {t("community_publish_type")}
      </label>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("community_publish_type")}>
        {TYPES.map((tKey) => {
          const isVideo = tKey === "video";
          const disabled = isVideo && videoTypeDisabled;
          return (
            <button
              key={tKey}
              type="button"
              data-testid={`community-publish-drawer-type-${tKey}`}
              disabled={disabled}
              aria-disabled={disabled ? true : undefined}
              onClick={() => {
                if (disabled) {
                  onVideoTypeBlocked?.();
                  return;
                }
                form.setType(tKey);
              }}
              title={disabled && videoDisabledHint ? videoDisabledHint : undefined}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-small font-medium motion-sub min-h-[44px] min-w-[44px] ${communityShellTabFocus} ${
                disabled
                  ? TT_COMMUNITY_DRAWER_L5.publishTypeChipDisabled
                  : form.type === tKey
                    ? TT_COMMUNITY_DRAWER_L5.typeChipActive + " shadow-scifi-glow"
                    : TT_COMMUNITY_DRAWER_L5.publishTypeChipIdleAlt
              }`}
            >
              {t(`community_type_${tKey}`)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
