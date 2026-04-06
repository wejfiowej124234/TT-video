"use client";

import { useTranslation } from "@/components/LocaleProvider";

/**
 * 85 §十七：抽象全球底图 + 节点/路径示意，不标注具体国家上线状态；高亮列表以 84 定稿为准。
 */
export default function TravelTrustGlobalMap() {
  const { t } = useTranslation();

  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-ink-200/80 bg-bg-console shadow-inner">
        <svg
          viewBox="0 0 960 420"
          className="h-auto w-full text-ink-200"
          aria-hidden
        >
          <defs>
            <linearGradient id="tt-map-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(240 253 250)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(224 231 255)" stopOpacity="0.25" />
            </linearGradient>
            <filter id="tt-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="960" height="420" fill="url(#tt-map-bg)" />
          <g opacity="0.22" stroke="currentColor" strokeWidth="0.6" fill="none">
            {Array.from({ length: 12 }, (_, i) => (
              <line key={`v-${i}`} x1={80 + i * 70} y1="24" x2={80 + i * 70} y2="396" />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`h-${i}`} x1="40" y1={48 + i * 56} x2="920" y2={48 + i * 56} />
            ))}
          </g>
          <path
            d="M 120 260 Q 260 200 400 220 T 640 180 T 820 240"
            fill="none"
            stroke="rgb(45 212 191)"
            strokeWidth="1.2"
            strokeDasharray="6 10"
            opacity="0.45"
          />
          <path
            d="M 200 120 Q 340 160 520 140 T 780 200"
            fill="none"
            stroke="rgb(129 140 248)"
            strokeWidth="1"
            strokeDasharray="4 8"
            opacity="0.35"
          />
          {[
            { cx: 200, cy: 240, fill: "rgb(59 130 246)" },
            { cx: 360, cy: 160, fill: "rgb(34 197 94)" },
            { cx: 520, cy: 200, fill: "rgb(168 85 247)" },
            { cx: 680, cy: 150, fill: "rgb(249 115 22)" },
            { cx: 780, cy: 280, fill: "rgb(59 130 246)" },
            { cx: 300, cy: 300, fill: "rgb(34 197 94)" },
            { cx: 580, cy: 300, fill: "rgb(168 85 247)" },
          ].map((n, i) => (
            <g key={i} filter="url(#tt-glow)">
              <circle cx={n.cx} cy={n.cy} r="5" fill={n.fill} opacity="0.95" />
              <circle cx={n.cx} cy={n.cy} r="2.2" fill="white" opacity="0.55" />
            </g>
          ))}
        </svg>
      </div>
      <p className="text-meta leading-relaxed text-ink-600">{t("traveltrust_map_visual_note")}</p>
    </div>
  );
}
