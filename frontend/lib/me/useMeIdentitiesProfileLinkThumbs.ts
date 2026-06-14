"use client";

import { useEffect, useState } from "react";
import { getMeAcquisitionProfile } from "@/lib/apiClient/meAcquisitionProfile";
import { getMeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import { getMeMerchantProfile } from "@/lib/apiClient/meMerchantProfile";
import type { MeIdentitiesProfileLinkId } from "@/lib/me/meIdentitiesProfileLinksModel";
import { resolveMeIdentitiesProfileLinkThumb } from "@/lib/me/meIdentitiesProfileLinkVisuals";

export type MeIdentitiesProfileLinkThumbs = Partial<Record<MeIdentitiesProfileLinkId, string>>;

/** Hub「身份资料」：按可见 link id 懒加载缩略图（best-effort · 失败仍用分轨占位）。 */
export function useMeIdentitiesProfileLinkThumbs(
  linkIds: readonly MeIdentitiesProfileLinkId[],
  enabled: boolean,
): MeIdentitiesProfileLinkThumbs {
  const [thumbs, setThumbs] = useState<MeIdentitiesProfileLinkThumbs>({});

  useEffect(() => {
    if (!enabled || linkIds.length === 0) {
      setThumbs({});
      return;
    }

    let cancelled = false;
    const ids = new Set(linkIds);

    void (async () => {
      const next: MeIdentitiesProfileLinkThumbs = {};

      const tasks: Promise<void>[] = [];

      if (ids.has("acquisition")) {
        tasks.push(
          getMeAcquisitionProfile()
            .then((body) => {
              if (cancelled) return;
              next.acquisition = resolveMeIdentitiesProfileLinkThumb(
                "acquisition",
                body.profile?.avatar_url,
              );
            })
            .catch(() => {
              if (!cancelled) next.acquisition = resolveMeIdentitiesProfileLinkThumb("acquisition", null);
            }),
        );
      }

      if (ids.has("guide")) {
        tasks.push(
          getMeGuideProfile()
            .then((body) => {
              if (cancelled) return;
              next.guide = resolveMeIdentitiesProfileLinkThumb("guide", body.profile?.avatar_url);
            })
            .catch(() => {
              if (!cancelled) next.guide = resolveMeIdentitiesProfileLinkThumb("guide", null);
            }),
        );
      }

      if (ids.has("merchant")) {
        tasks.push(
          getMeMerchantProfile()
            .then((body) => {
              if (cancelled) return;
              const p = body.profile;
              next.merchant = resolveMeIdentitiesProfileLinkThumb(
                "merchant",
                p?.cover_url || p?.avatar_url,
              );
            })
            .catch(() => {
              if (!cancelled) next.merchant = resolveMeIdentitiesProfileLinkThumb("merchant", null);
            }),
        );
      }

      if (ids.has("steward")) {
        next.steward = resolveMeIdentitiesProfileLinkThumb("steward", null);
      }

      await Promise.all(tasks);
      if (!cancelled) setThumbs(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, linkIds.join(",")]);

  return thumbs;
}
