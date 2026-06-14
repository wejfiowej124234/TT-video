"use client";

import { useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminContentPageShell } from "@/components/admin/content/AdminContentPageShell";
import { AdminContentPanelCard } from "@/components/admin/content/AdminContentL5Surfaces";
import {
  OfficialOpsFilterBar,
  ADMIN_FILTER_INPUT_SM_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/components/admin/ops/OfficialOpsFilterBar";
import { getAdminContentRevisionCompare } from "@/lib/apiClient";

export function AdminContentRevisionComparePageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const [entityType, setEntityType] = useState("country");
  const [entityId, setEntityId] = useState("");
  const [versionA, setVersionA] = useState("1");
  const [versionB, setVersionB] = useState("2");
  const [left, setLeft] = useState<Record<string, unknown> | null>(null);
  const [right, setRight] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCompare() {
    if (!entityId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminContentRevisionCompare({
        entity_type: entityType,
        entity_id: entityId.trim(),
        version_a: Number(versionA),
        version_b: Number(versionB),
      });
      setLeft(res.left?.after_json ?? res.left?.before_json ?? null);
      setRight(res.right?.after_json ?? res.right?.before_json ?? null);
    } catch {
      setError("admin_content_revision_compare_failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_revision_compare_title"
      subtitleKey="admin_content_revision_compare_subtitle"
      loading={loading && !left && !right}
      error={error}
    >
      <div data-tt-admin-content-revision-compare="1" className="space-y-4">
        <OfficialOpsFilterBar dataAttr="revision-compare">
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            <option value="country">country</option>
            <option value="city">city</option>
            <option value="poi">poi</option>
          </select>
          <input
            className={`min-w-[240px] ${ADMIN_FILTER_INPUT_SM_CLASS}`}
            placeholder="entity_id (uuid)"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
          />
          <input
            className={`w-20 ${ADMIN_FILTER_INPUT_SM_CLASS}`}
            placeholder="vA"
            value={versionA}
            onChange={(e) => setVersionA(e.target.value)}
          />
          <input
            className={`w-20 ${ADMIN_FILTER_INPUT_SM_CLASS}`}
            placeholder="vB"
            value={versionB}
            onChange={(e) => setVersionB(e.target.value)}
          />
          <button type="button" className={adminTableRowPrimaryActionClass()} onClick={() => void onCompare()}>
            {t("admin_content_revision_compare_action")}
          </button>
        </OfficialOpsFilterBar>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminContentPanelCard title={t("admin_content_revision_compare_left")} dataAttr="revision-left">
            <pre className="max-h-[480px] overflow-auto text-body-xs">
              {left ? JSON.stringify(left, null, 2) : "—"}
            </pre>
          </AdminContentPanelCard>
          <AdminContentPanelCard title={t("admin_content_revision_compare_right")} dataAttr="revision-right">
            <pre className="max-h-[480px] overflow-auto text-body-xs">
              {right ? JSON.stringify(right, null, 2) : "—"}
            </pre>
          </AdminContentPanelCard>
        </div>
      </div>
    </AdminContentPageShell>
  );
}
