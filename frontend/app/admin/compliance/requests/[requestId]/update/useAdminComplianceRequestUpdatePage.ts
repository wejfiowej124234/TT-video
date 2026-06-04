// search-params gate: parent route provides Suspense boundary.
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
  type AdminFetchErrorKind,
  adminUserFacingErrorFromUnknown,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";

import { type ComplianceUpdatePostRes } from "./adminComplianceRequestUpdatePageModel";

export function useAdminComplianceRequestUpdatePage() {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const canUpdate = caps.hasPermission(ADMIN_PERM.APPROVE);
  const params = useParams();
  const searchParams = useSearchParams();
  const requestId = useMemo(() => {
    const raw = params?.requestId;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const [expectedVersion, setExpectedVersion] = useState("");
  const [eventType, setEventType] = useState("");
  const [statusSel, setStatusSel] = useState("");
  const [notes, setNotes] = useState("");
  const [eventDetail, setEventDetail] = useState("");
  const [exportSignature, setExportSignature] = useState("");
  const [recordHashFingerprint, setRecordHashFingerprint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [writeErrorKind, setWriteErrorKind] = useState<AdminFetchErrorKind | null>(null);
  const [writeOk, setWriteOk] = useState<string | null>(null);

  const setFormWriteError = (kind: AdminFetchErrorKind, message: string) => {
    setWriteErrorKind(kind);
    setWriteError(message);
  };

  const clearFormWriteError = () => {
    setWriteErrorKind(null);
    setWriteError(null);
  };

  useEffect(() => {
    const v = searchParams?.get("v");
    if (v != null && v.trim() !== "") setExpectedVersion(v.trim());
  }, [searchParams]);

  const submit = () => {
    if (!canUpdate) return;
    clearFormWriteError();
    setWriteOk(null);
    if (!requestId.trim()) {
      setFormWriteError("invalid_request", t("admin_compliance_update_missingId"));
      return;
    }
    const ev = Number.parseInt(expectedVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      setFormWriteError("invalid_request", t("admin_compliance_update_badVersion"));
      return;
    }
    const et = eventType.trim();
    if (!et) {
      setFormWriteError("invalid_request", t("admin_compliance_update_eventRequired"));
      return;
    }

    setSubmitting(true);
    const body: Record<string, unknown> = {
      expected_version: ev,
      event_type: et,
    };
    if (statusSel.trim() !== "") body.status = statusSel.trim();
    if (notes.trim() !== "") body.notes = notes.trim();
    if (eventDetail.trim() !== "") body.event_detail = eventDetail.trim();
    if (exportSignature.trim() !== "") body.export_signature = exportSignature.trim();
    if (recordHashFingerprint.trim() !== "") {
      body.record_hash_fingerprint = recordHashFingerprint.trim();
    }

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      setFormWriteError("login_required", t("admin_compliance_update_auth"));
      setSubmitting(false);
      return;
    }

    void adminFetchJson<ComplianceUpdatePostRes>(
      "AdminComplianceRequestUpdatePage",
      apiUrl(routes.admin.complianceDataRequestUpdate(requestId)),
      { method: "POST", headers, body: JSON.stringify(body) },
    )
      .then(({ res, body: b }) => {
        if (res.status === 409 && b?.error === "compliance_data_request_version_conflict") {
          const cv = b.current_version;
          setFormWriteError(
            "conflict",
            typeof cv === "number"
              ? t("admin_compliance_update_conflict", { current: cv })
              : t("admin_compliance_update_conflictGeneric"),
          );
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminComplianceRequestUpdatePage", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        const ver = b.item?.version;
        setWriteOk(
          typeof ver === "number"
            ? t("admin_compliance_update_ok", { version: ver })
            : t("admin_compliance_update_okGeneric"),
        );
        if (typeof ver === "number") setExpectedVersion(String(ver));
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminComplianceRequestUpdatePage", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        setFormWriteError(facing.kind, facing.message);
      })
      .finally(() => setSubmitting(false));
  };

  return {
    requestId,
    expectedVersion,
    setExpectedVersion,
    eventType,
    setEventType,
    statusSel,
    setStatusSel,
    notes,
    setNotes,
    eventDetail,
    setEventDetail,
    exportSignature,
    setExportSignature,
    recordHashFingerprint,
    setRecordHashFingerprint,
    submitting,
    writeError,
    writeErrorKind,
    writeOk,
    submit,
    canUpdate,
    capsLoading: caps.loading,
  };
}
