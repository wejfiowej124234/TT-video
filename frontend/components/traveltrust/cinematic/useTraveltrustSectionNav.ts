"use client";

import { useEffect, useState } from "react";
import {
  TRAVELTRUST_SECTION_IDS,
  type TraveltrustSectionId,
} from "@/lib/traveltrustSectionNavItems";

export type { TraveltrustSectionId };

/** 页内锚点高亮（IntersectionObserver · ①） */
export function useTraveltrustSectionNav() {
  const [active, setActive] = useState<TraveltrustSectionId>("hero");

  useEffect(() => {
    const elements = TRAVELTRUST_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id;
        if (top && (TRAVELTRUST_SECTION_IDS as readonly string[]).includes(top)) {
          setActive(top as TraveltrustSectionId);
        }
      },
      { rootMargin: "-42% 0px -48% 0px", threshold: [0.08, 0.2, 0.45] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return active;
}
