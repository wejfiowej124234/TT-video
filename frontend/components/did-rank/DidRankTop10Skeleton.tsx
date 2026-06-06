"use client";



import { didRankTop10RowGridClass } from "@/lib/didRankTop10Layout";

import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";



const PODIUM_RANKS = [2, 1, 3] as const;



function podiumSkeletonWrapClass(rank: number): string {

  if (rank === 1) return "order-2 flex-[1_1_6.25rem] sm:min-w-[6.75rem] sm:max-w-[11rem] sm:-translate-y-2";

  if (rank === 2) return "order-1 flex-[1_1_5.5rem] sm:max-w-[9.5rem]";

  return "order-3 flex-[1_1_5.5rem] sm:max-w-[9rem]";

}



/** 与 `DidRankTop10Grid` 领奖台 2·1·3 + 4～10 栅格同构，减轻骨架→内容跳变 */

export function DidRankTop10Skeleton() {

  const s = TT_MARKETING_DID_RANK_SURFACE;

  return (

    <div className={s.top10StageShell} aria-hidden>

      <div className="flex flex-wrap items-end justify-center gap-2 sm:gap-3 max-w-4xl mx-auto">

        {PODIUM_RANKS.map((rank) => (

          <div

            key={rank}

            className={`min-w-[5.25rem] max-w-[8rem] sm:min-w-[6.75rem] ${podiumSkeletonWrapClass(rank)}`}

          >

            <div className={`${s.skeletonCard} ${rank === 1 ? "sm:min-h-[9.5rem]" : "sm:min-h-[8.25rem]"}`}>

              <div className="mb-1 flex min-h-[30px] items-center justify-center">

                <div className="h-[30px] w-10 shrink-0 rounded-[var(--radius-sm)] bg-ink-700/55 animate-pulse" />

              </div>

              {rank === 1 ? (

                <div className="mx-auto mb-0.5 h-4 w-6 rounded-[var(--radius-sm)] bg-ref-sun/20 animate-pulse" />

              ) : null}

              <div

                className={`mx-auto mb-1 rounded-full bg-ink-700/55 animate-pulse ${

                  rank === 1 ? "h-12 w-12 sm:h-14 sm:w-14" : "h-11 w-11"

                }`}

              />

              <div className="mx-auto mb-0.5 h-3 w-14 max-w-full rounded-[var(--radius-sm)] bg-ink-700/55 animate-pulse" />

              <div className="mx-auto mb-0.5 h-4 w-16 max-w-full rounded-[var(--radius-sm)] bg-ink-700/50 animate-pulse" />

              <div className="mx-auto h-3 w-[4.5rem] max-w-full rounded-[var(--radius-sm)] bg-ink-700/45 animate-pulse" />

              {rank === 1 ? (

                <div className="mx-auto mt-1.5 h-2 w-[88%] max-w-[7.5rem] rounded-t-[var(--radius-sm)] bg-ref-sun/12 animate-pulse" />

              ) : (

                <div className="mx-auto mt-1 h-1.5 w-[82%] rounded-t-[var(--radius-sm)] bg-ink-700/40 animate-pulse" />

              )}

            </div>

          </div>

        ))}

      </div>

      <div className={s.top10RowBand}>

        <div className={didRankTop10RowGridClass(7)}>

          {Array.from({ length: 7 }).map((_, i) => (

            <div key={i} className={s.skeletonCard}>

              <div className="mb-1 flex min-h-[26px] items-center justify-center">

                <div className="h-5 w-8 rounded-[var(--radius-sm)] bg-ink-700/55 animate-pulse" />

              </div>

              <div className="mx-auto mb-1 h-11 w-11 rounded-full bg-ink-700/55 animate-pulse" />

              <div className="mx-auto mb-0.5 h-3 w-12 rounded-[var(--radius-sm)] bg-ink-700/55 animate-pulse" />

              <div className="mx-auto h-4 w-14 rounded-[var(--radius-sm)] bg-ink-700/50 animate-pulse" />

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

