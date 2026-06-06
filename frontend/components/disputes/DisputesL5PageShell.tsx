"use client";

import { useSearchParams } from "next/navigation";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { isMeSettingsExtensionFromQuery } from "@/lib/me/meSettingsExtensionContext";
import {
  DISPUTES_L5_ROUTE_MARKER_DETAIL,
  DISPUTES_L5_ROUTE_MARKER_LIST,
} from "@/lib/me/disputesL5";

export function DisputesL5PageShell({
  t,
  ariaLabel,
  variant,
  children,
}: {
  t: (key: string) => string;
  ariaLabel: string;
  variant: "list" | "detail";
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const fromSettings = isMeSettingsExtensionFromQuery(searchParams.get("from"));
  const routeMarker =
    variant === "list" ? DISPUTES_L5_ROUTE_MARKER_LIST : DISPUTES_L5_ROUTE_MARKER_DETAIL;

  return (
    <MeSettingsL5FlowPage
      ariaLabel={ariaLabel}
      route="disputes"
      dataAttrs={{
        "data-tt-me-settings-route": routeMarker,
        "data-tt-disputes-l5": "1",
        "data-tt-me-settings-ui-frozen": "1",
        ...(fromSettings ? { "data-tt-disputes-from-settings": "1" } : {}),
      }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={t} />
      {children}
    </MeSettingsL5FlowPage>
  );
}
