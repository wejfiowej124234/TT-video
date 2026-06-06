"use client";

import { DidRankRouteSuspense } from "@/components/did-rank/DidRankRouteSuspense";
import type { DidRankPageInitialSnapshot } from "@/lib/did-rank/didRankPageInitialData";
import { DidRankPageInner } from "./DidRankPageInner";

/** 30 DID 排行榜 · SSR 快照 hydration + 客户端编排 */
export default function DidRankPageClient({
  initialSnapshot,
}: {
  initialSnapshot: DidRankPageInitialSnapshot | null;
}) {
  return (
    <DidRankRouteSuspense>
      <DidRankPageInner initialSnapshot={initialSnapshot} />
    </DidRankRouteSuspense>
  );
}
