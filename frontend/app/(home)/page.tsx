"use client";

import dynamic from "next/dynamic";
import { useTranslation } from "@/components/LocaleProvider";
import { useLandingPage } from "@/components/landing/useLandingPage";
import LandingHeroForm from "@/components/landing/LandingHeroForm";
import ItineraryResultsSection from "@/components/landing/ItineraryResultsSection";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHomeAmbientBackdrop from "@/components/landing/LandingHomeAmbientBackdrop";
import LandingHomeDecorLayers from "@/components/landing/LandingHomeDecorLayers";
import {
  TT_MARKETING_HOME_FOOTER_TOP_FADE,
  TT_MARKETING_HOME_SECTION_BRIDGE,
  TT_MARKETING_HOME_SECTION_BRIDGE_LINE,
} from "@/lib/marketingUi";
import { ColdStartHomeHeroHighlights } from "@/components/coldStartCampaign/ColdStartHomeHeroHighlights";

const UnlockModal = dynamic(
  () => import("@/components/landing/UnlockModal"),
  { ssr: false, loading: () => null },
);

/** 25 §3.1 + 28：Hero + 规划表单 + 行程预览卡 */
export default function Home() {
  const { t } = useTranslation();
  const data = useLandingPage(t);

  return (
    <main
      className="relative min-h-screen"
      aria-label={t("landing_hero_title")}
      data-tt-home-favorites-mode="localstorage-f020-sync-v1"
    >
      <LandingHomeAmbientBackdrop country={data.country} />
      <LandingHomeDecorLayers />
      <div className="relative z-10 min-h-screen">
        <LandingHeroForm
          country={data.country}
          setCountry={data.setCountry}
          cities={data.cities}
          setCities={data.setCities}
          startDate={data.startDate}
          setStartDate={data.setStartDate}
          endDate={data.endDate}
          setEndDate={data.setEndDate}
          days={data.days}
          attractionTypes={data.attractionTypes}
          setAttractionTypes={data.setAttractionTypes}
          diningStandards={data.diningStandards}
          setDiningStandards={data.setDiningStandards}
          hotelStandards={data.hotelStandards}
          setHotelStandards={data.setHotelStandards}
          budget={data.budget}
          setBudget={data.setBudget}
          partySize={data.partySize}
          setPartySize={data.setPartySize}
          numRooms={data.numRooms}
          setNumRooms={data.setNumRooms}
          submitting={data.submitting}
          validationErrorKey={data.validationErrorKey}
          submitError={data.submitError}
          loginRequired={data.loginRequired}
          handleSubmit={data.handleSubmit}
          marketHref={data.marketHref}
          showConsumerValue={!data.showLiveAiResults && !data.submitting}
          draftQuota={data.draftQuota}
        />
        <ColdStartHomeHeroHighlights className="relative z-10 mt-3 mb-1" />
        <div className={TT_MARKETING_HOME_SECTION_BRIDGE} aria-hidden>
          <div className={TT_MARKETING_HOME_SECTION_BRIDGE_LINE} />
        </div>
        <ItineraryResultsSection
          resultOrderIds={data.resultOrderIds}
          submitting={data.submitting}
          unlockedOrderIds={data.unlockedOrderIds}
          orderDetails={data.orderDetails}
          favoritedIds={data.favoritedIds}
          toggleFavorite={data.toggleFavorite}
          handleUnlockClick={data.handleUnlockClick}
          country={data.country}
          cities={data.cities}
          previewLocked={data.previewLocked}
          showLiveAiResults={data.showLiveAiResults}
          resultsSectionRef={data.resultsSectionRef}
        />
        {data.selectedForUnlock ? (
          <UnlockModal
            selectedForUnlock={data.selectedForUnlock}
            setSelectedForUnlock={data.setSelectedForUnlock}
            handleUnlockPay={data.handleUnlockPay}
            unlockPaying={data.unlockPaying}
            unlockError={data.unlockError}
          />
        ) : null}
        <div className="relative">
          <div className={TT_MARKETING_HOME_FOOTER_TOP_FADE} aria-hidden />
          <LandingFooter />
        </div>
      </div>
    </main>
  );
}
