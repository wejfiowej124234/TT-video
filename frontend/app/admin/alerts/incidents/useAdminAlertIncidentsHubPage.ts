// search-params gate: parent route provides Suspense boundary.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";

import {
  INCIDENT_MAX,
  buildIncidentHubPath,
  parseIncidentHubQuery,
} from "./adminAlertIncidentsHubPageModel";

export function useAdminAlertIncidentsHubPage() {
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminAlertIncidentsHubMetaBuild");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { incidentId: urlIncidentId } = useMemo(
    () => parseIncidentHubQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [draftId, setDraftId] = useState(urlIncidentId);

  useEffect(() => {
    setDraftId(urlIncidentId);
  }, [urlIncidentId]);

  const applyBookmark = () => {
    router.push(buildIncidentHubPath(draftId));
  };

  const resetBookmark = () => {
    setDraftId("");
    router.push("/admin/alerts/incidents");
  };

  const openDetail = () => {
    const raw = draftId.trim().slice(0, INCIDENT_MAX);
    if (!raw) return;
    router.push(`/admin/alerts/incidents/${encodeURIComponent(raw)}`);
  };

  const onHubFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sub = (e.nativeEvent as SubmitEvent).submitter;
    const action =
      sub instanceof HTMLButtonElement && typeof sub.value === "string" && sub.value
        ? sub.value
        : "open";
    if (action === "applyUrl") applyBookmark();
    else if (action === "reset") resetBookmark();
    else openDetail();
  };

  return {
    buildMeta,
    buildLoading,
    buildError,
    urlIncidentId,
    draftId,
    setDraftId,
    onHubFormSubmit,
  };
}
