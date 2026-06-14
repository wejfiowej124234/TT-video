"use client";

import { useEffect, useRef, useState } from "react";
import { getMeFull } from "@/lib/apiClient";
import { parseAcquisitionWorkspaceStats } from "@/lib/workspace/workspaceStatsModel";
import { WORKSPACE_SPRINT_MARKER } from "@/lib/workspace/workspaceIdentityModel";

/** `/market/acquisition` 子站经营概览（W4 · stats 来自 `GET /me`） */
export default function AcquisitionSubsiteStatsPanel({ t }: { t: (key: string) => string }) {
  const [stats, setStats] = useState(() => parseAcquisitionWorkspaceStats(null));
  const [hidden, setHidden] = useState(true);
  const gen = useRef(0);

  useEffect(() => {
    const id = ++gen.current;
    getMeFull()
      .then((res) => {
        if (id !== gen.current || res == null) return;
        const raw = (res as { stats?: unknown })?.stats;
        const parsed =
          raw && typeof raw === "object" && !Array.isArray(raw)
            ? parseAcquisitionWorkspaceStats(raw as Record<string, unknown>)
            : parseAcquisitionWorkspaceStats(null);
        const hasData =
          (parsed.acquisition_in_progress_count ?? 0) > 0 ||
          (parsed.acquisition_listings_published_24h ?? 0) > 0 ||
          (parsed.acquisition_orders_as_owner ?? 0) > 0 ||
          (parsed.acquisition_orders_as_carrier ?? 0) > 0;
        setStats(parsed);
        setHidden(!hasData);
      })
      .catch(() => {
        if (id !== gen.current) return;
        setHidden(true);
      });
  }, []);

  if (hidden) return null;

  const inProgress = stats.acquisition_in_progress_count ?? 0;
  const listings24h = stats.acquisition_listings_published_24h ?? 0;

  return (
    <section
      className="mx-auto max-w-4xl px-4 mb-4"
      aria-label={t("acquisition_workbench_stats_aria")}
      data-tt-acquisition-subsite-stats="1"
      data-tt-workspace-sprint={WORKSPACE_SPRINT_MARKER}
    >
      <div className="rounded-[var(--radius-md)] border border-cyan-400/35 bg-slate-900/70 px-4 py-3 backdrop-blur-md">
        <h2 className="text-small font-semibold text-slate-100 mb-2">{t("acquisition_workbench_stats_title")}</h2>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-[var(--radius-md)] border border-slate-600/45 bg-slate-950/50 px-3 py-2 min-w-[7rem] text-center flex-1">
            <p className="text-h3 font-bold font-mono tabular-nums text-ref-sun">{inProgress}</p>
            <p className="text-meta text-slate-400 mt-0.5">{t("acquisition_workbench_stats_in_progress")}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-slate-600/45 bg-slate-950/50 px-3 py-2 min-w-[7rem] text-center flex-1">
            <p className="text-h3 font-bold font-mono tabular-nums text-cyan-300">{listings24h}</p>
            <p className="text-meta text-slate-400 mt-0.5">{t("acquisition_workbench_stats_listings_24h")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
