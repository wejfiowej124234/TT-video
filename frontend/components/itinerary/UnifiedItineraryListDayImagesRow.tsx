"use client";

import Image from "next/image";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { PLACEHOLDER_IMAGE_SCENIC } from "./placeholders";
import type { UnifiedItineraryListChrome } from "./unifiedItineraryListChrome";

export type UnifiedItineraryListDayImagesRowProps = {
  images: string[];
  desc: string;
  imageAlt: string;
  u: Pick<UnifiedItineraryListChrome, "thumbGrid" | "metaDim">;
};

export default function UnifiedItineraryListDayImagesRow({
  images,
  desc,
  imageAlt,
  u,
}: UnifiedItineraryListDayImagesRowProps) {
  if (!(images.length > 0 || (desc && images.length === 0))) return null;
  const list = (images.length > 0 ? images : [PLACEHOLDER_IMAGE_SCENIC]).slice(0, 5);
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {list.map((src, i) => (
        <span key={i} className={u.thumbGrid}>
          <Image
            src={communityMediaAbsoluteUrlForRender(src)}
            alt={i === 0 ? imageAlt : `${imageAlt} (${i + 1})`}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized={communityMediaNextImageUnoptimized(communityMediaAbsoluteUrlForRender(src))}
          />
        </span>
      ))}
      {images.length > 5 ? <span className={`${u.metaDim} self-center`}>+{images.length - 5}</span> : null}
    </div>
  );
}
