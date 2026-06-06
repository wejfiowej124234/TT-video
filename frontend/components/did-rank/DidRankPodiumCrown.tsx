/** 领奖台 #1 皇冠（暖金 · 与设计稿 Top1 标识一致） */
export function DidRankPodiumCrown({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center text-ref-sun animate-did-rank-crown-float motion-reduce:animate-none ${className}`}
      aria-hidden
    >
      <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 14h18v2H2v-2Zm1.2-9 2.4 5.2L11 4.8l5.4 5.4 2.4-5.2L20 14H2l1.2-9Z"
          fill="currentColor"
          fillOpacity="0.92"
        />
        <circle cx="4.5" cy="3.5" r="1.35" fill="currentColor" />
        <circle cx="11" cy="2.2" r="1.35" fill="currentColor" />
        <circle cx="17.5" cy="3.5" r="1.35" fill="currentColor" />
      </svg>
    </span>
  );
}
