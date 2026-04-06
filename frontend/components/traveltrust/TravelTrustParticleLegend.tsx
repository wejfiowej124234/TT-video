"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 85 §5.1：粒子颜色语义说明（演示）。 */
export default function TravelTrustParticleLegend() {
  const { t } = useTranslation();

  const rows: { dot: string; labelKey: string }[] = [
    { dot: "bg-ref-cyan shadow-[0_0_8px_rgba(35,206,217,0.55)]", labelKey: "traveltrust_particle_legend_city" },
    { dot: "bg-ref-sage shadow-[0_0_8px_rgba(161,204,166,0.45)]", labelKey: "traveltrust_particle_legend_order" },
    { dot: "bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.45)]", labelKey: "traveltrust_particle_legend_hub" },
    { dot: "bg-ref-coral shadow-[0_0_8px_rgba(252,164,124,0.5)]", labelKey: "traveltrust_particle_legend_hot" },
  ];

  return (
    <div className="mt-4 rounded-[var(--radius-lg)] border border-white/12 bg-slate-900/50 backdrop-blur-md px-4 py-3 shadow-scifi-panel ring-1 ring-ref-cyan/15">
      <p className="text-small font-semibold text-white">{t("traveltrust_particle_legend_title")}</p>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {rows.map(({ dot, labelKey }) => (
          <li key={labelKey} className="flex items-center gap-2 text-meta text-slate-300">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
            {t(labelKey)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-meta text-slate-400">{t("traveltrust_particle_interact_hint")}</p>
    </div>
  );
}
