"use client";

import { GOV_PARAMS_L5, GOV_PARAMS_TABLE } from "@/lib/governance/governanceParamsPageL5";
import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";

export function GovernanceParamsL5ReadonlyTable({
  caption,
  captionId,
  columns,
  rows,
  className = "",
}: {
  caption: string;
  captionId?: string;
  columns: readonly { key: string; label: string; align?: "left" | "right" }[];
  rows: readonly { key: string; cells: readonly string[]; emphasis?: boolean }[];
  className?: string;
}) {
  return (
    <div className={`${GOV_PARAMS_LAYOUT.tableWrap} ${className}`.trim()}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-small">
          <caption id={captionId} className={captionId ? "sr-only" : "px-4 pt-3 text-left text-meta text-slate-400"}>
            {caption}
          </caption>
          <thead>
            <tr className={`${GOV_PARAMS_TABLE.headRow} bg-slate-950/60`}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${col.align === "right" ? "text-right" : ""}`.trim()}
                  scope="col"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className={`${GOV_PARAMS_TABLE.bodyRow} ${row.emphasis ? "bg-ref-sun/[0.06] font-semibold" : ""}`.trim()}
              >
                {row.cells.map((cell, i) => (
                  <td
                    key={`${row.key}-${columns[i]?.key ?? i}`}
                    className={`px-4 py-2.5 text-small leading-snug ${columns[i]?.align === "right" ? `text-right ${GOV_PARAMS_TABLE.mono}` : "text-slate-200"}`.trim()}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GovernanceParamsL5OptionGrid({
  items,
  className = "",
}: {
  items: readonly { id: string; title: string; hint: string }[];
  className?: string;
}) {
  return (
    <ul className={`grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}>
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-[var(--radius-md)] border border-white/10 bg-slate-950/45 p-3"
          data-tt-governance-params-option={item.id}
        >
          <p className="text-small font-semibold text-slate-50">{item.title}</p>
          <p className={`mt-1 text-meta leading-relaxed text-slate-400`}>{item.hint}</p>
        </li>
      ))}
    </ul>
  );
}

export function GovernanceParamsL5PriorityList({
  items,
  className = "",
}: {
  items: readonly { n: number; label: string; hint: string }[];
  className?: string;
}) {
  return (
    <ol className={`space-y-3 ${className}`.trim()}>
      {items.map((item) => (
        <li
          key={item.n}
          className="rounded-[var(--radius-md)] border border-white/10 bg-slate-950/40 p-3.5"
          data-tt-governance-params-treasury-priority={item.n}
        >
          <p className="text-small font-semibold text-slate-100">{item.label}</p>
          <p className={`mt-1 text-meta leading-relaxed text-slate-400`}>{item.hint}</p>
        </li>
      ))}
    </ol>
  );
}
