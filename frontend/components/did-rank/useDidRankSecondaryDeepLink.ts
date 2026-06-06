"use client";



import { useEffect, useRef } from "react";

import type { DidRankSecondaryRow } from "@/components/did-rank/useDidRankSecondaryBoard";

import { trackDidRankEvent } from "@/lib/analytics";

import type { Period } from "@/lib/didRankUtils";

import { parseDidRankMeHighlight } from "@/lib/didRankUtils";

import { scrollToDidRankElement } from "@/lib/didRankScrollToElement";



/** `?me=provider-*` / `?me=acquisition-*`：数据就绪后滚到对应行（含 Top10 / 11～100） */

export function useDidRankSecondaryDeepLink(options: {

  board: "provider" | "acquisition";

  meParam: string;

  period: Period;

  items: DidRankSecondaryRow[];

  isLoading: boolean;

  scrollToMyRankRef?: React.MutableRefObject<(() => void) | null>;

}) {

  const { board, meParam, period, items, isLoading, scrollToMyRankRef } = options;

  const doneKeyRef = useRef<string | null>(null);



  useEffect(() => {

    const parsed = parseDidRankMeHighlight(meParam);

    if (!parsed || parsed.board !== board || isLoading || items.length === 0) return;



    const scrollKey = `${meParam}:${period}:${board}`;

    if (doneKeyRef.current === scrollKey) return;



    const idx = items.findIndex((x) => x.id === parsed.userId);

    if (idx < 0) return;



    doneKeyRef.current = scrollKey;

    trackDidRankEvent("did_rank_deeplink_auto_scroll", { board, rankIndex: idx });



  if (scrollToMyRankRef?.current) {

      scrollToMyRankRef.current();

      return;

    }



    const elementId =

      idx < 10

        ? `${board}-top10-${parsed.userId}`

        : `${board}-row-${parsed.userId}`;

    scrollToDidRankElement(elementId);

  }, [board, meParam, period, items, isLoading, scrollToMyRankRef]);

}

