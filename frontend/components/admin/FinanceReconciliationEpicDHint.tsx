"use client";

import { adminPageNavLinkClass } from "@/lib/adminUi";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/** 仓库内文档外链（与根 README 小组远程一致）。 */
const EPIC_D_LADDER_HREF =
  "https://github.com/TT-Expedition/TT-Expedition/blob/main/docs/runbook/Epic-D-indexer-ops-readonly-ladder.md";
const EPIC_D_EXAMPLE_D10_HREF =
  "https://github.com/TT-Expedition/TT-Expedition/tree/main/docs/runbook/Epic-D-ops-artifact.v1.example-d10-go-bundle";

/** Epic E-07：Epic D 证据与枢纽只读面的人工对照说明（不读文件、不解析 JSON）。 */
export default function FinanceReconciliationEpicDHint() {
  const { t } = useTranslation();
  const sectionId = useId();
  const tableCaptionId = useId();

  const rows: { task: string; hintKey: string }[] = [
    { task: "D-02", hintKey: "admin_finance_reconciliation_epic_d_row_d02" },
    { task: "D-03", hintKey: "admin_finance_reconciliation_epic_d_row_d03" },
    { task: "D-04", hintKey: "admin_finance_reconciliation_epic_d_row_d04" },
    { task: "D-05", hintKey: "admin_finance_reconciliation_epic_d_row_d05" },
    { task: "D-06", hintKey: "admin_finance_reconciliation_epic_d_row_d06" },
    { task: "D-07", hintKey: "admin_finance_reconciliation_epic_d_row_d07" },
    { task: "D-08", hintKey: "admin_finance_reconciliation_epic_d_row_d08" },
    { task: "D-09", hintKey: "admin_finance_reconciliation_epic_d_row_d09" },
    { task: "D-10", hintKey: "admin_finance_reconciliation_epic_d_row_d10" },
  ];

  return (
    <section
      className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-soft"
      aria-labelledby={sectionId}
    >
      <h2 id={sectionId} className="text-body font-semibold text-ink-900">
        {t("admin_finance_reconciliation_epic_d_title")}
      </h2>
      <p className="mt-2 text-body text-ink-700">{t("admin_finance_reconciliation_epic_d_intro")}</p>
      <p className="mt-2 font-mono text-meta text-ink-600 break-all">
        {t("admin_finance_reconciliation_epic_d_evidence_path")}
      </p>
      <p className="mt-2 text-meta text-ink-600">{t("admin_finance_reconciliation_epic_d_no_parse_hint")}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        <a
          href={EPIC_D_LADDER_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_finance_reconciliation_epic_d_link_ladder")}
        </a>
        <a
          href={EPIC_D_EXAMPLE_D10_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_finance_reconciliation_epic_d_link_example")}
        </a>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left text-body">
          <caption id={tableCaptionId} className="mb-2 text-left text-meta text-ink-600">
            {t("admin_finance_reconciliation_epic_d_table_caption")}
          </caption>
          <thead>
            <tr className="border-b border-ink-200">
              <th scope="col" className="py-2 pr-3 font-mono text-small font-semibold text-ink-700">
                bundle_closure.included_tasks
              </th>
              <th scope="col" className="py-2 text-small font-semibold text-ink-700">
                {t("admin_finance_reconciliation_epic_d_col_hub")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ task, hintKey }) => (
              <tr key={task} className="border-b border-ink-100 align-top">
                <td className="py-2 pr-3 font-mono text-meta text-ink-600 whitespace-nowrap">{task}</td>
                <td className="py-2 text-small text-ink-800">{t(hintKey)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
