"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { getTraveltrustTextDirection } from "@/lib/traveltrustLocaleLayout";
import { TravelTrustPageBriefProvider } from "@/app/traveltrust/TravelTrustPageBriefContext";
import { useTraveltrustComposerPage } from "../hooks/useTraveltrustComposerPage";
import { TravelTrustHomeComposerShell } from "./TravelTrustHomeComposerShell";
import { TravelTrustHomeMainColumn } from "./TravelTrustHomeMainColumn";
import { TravelTrustHomeScrollProviders } from "./TravelTrustHomeScrollProviders";

function TravelTrustNetworkPageComposerBody() {
  const { t, locale } = useTranslation();
  const textDirection = getTraveltrustTextDirection(locale);
  const {
    ready,
    mainRef,
    heroRef,
    pageScroll,
    heroScroll,
    theaterViewport,
    domOutlineDebug,
    domCompositorAudit,
    onTheaterViewportChange,
  } = useTraveltrustComposerPage();

  return (
    <TravelTrustHomeComposerShell
      domOutlineDebug={domOutlineDebug}
      domCompositorAudit={domCompositorAudit}
    >
      <TravelTrustHomeScrollProviders
        heroScroll={heroScroll}
        pageScroll={pageScroll}
        theaterViewport={theaterViewport}
      >
        <TravelTrustHomeMainColumn
          mainRef={mainRef}
          heroRef={heroRef}
          textDirection={textDirection}
          ready={ready}
          ariaLabel={t("traveltrust_title")}
          skipToHeroLabel={t("traveltrust_skip_to_hero")}
          onTheaterViewportChange={onTheaterViewportChange}
        />
      </TravelTrustHomeScrollProviders>
    </TravelTrustHomeComposerShell>
  );
}

/** 首页叙事编排（scroll context · section 边界 · brief 预取） */
export function TravelTrustNetworkPageComposer() {
  return (
    <TravelTrustPageBriefProvider>
      <TravelTrustNetworkPageComposerBody />
    </TravelTrustPageBriefProvider>
  );
}
