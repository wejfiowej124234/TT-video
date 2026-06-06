"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { useLandingPage } from "@/components/landing/useLandingPage";
import LandingHeroForm from "@/components/landing/LandingHeroForm";
import ItineraryResultsSection from "@/components/landing/ItineraryResultsSection";
import UnlockModal from "@/components/landing/UnlockModal";
import LandingFooter from "@/components/landing/LandingFooter";
import { landingAmbientImageUrl } from "@/lib/landingAmbientByCountry";
import {
  TT_MARKETING_HOME_AMBIENT_GLOW,
  TT_MARKETING_HOME_AMBIENT_SCRIM,
  TT_MARKETING_HOME_DOT_GRID,
} from "@/lib/marketingUi";

/** 25 §3.1 + 28 Cinematic/Glassmorphism：Hero + 首页中央规划表单 + 盲盒行程卡 + 解锁 */
export default function Home() {
  const { t } = useTranslation();
  const data = useLandingPage(t);
  const ambientSrc = landingAmbientImageUrl(data.country);

  return (
    <main
      className="relative min-h-screen"
      aria-label={t("landing_hero_title")}
      data-tt-home-page="1"
      data-tt-ui-generation="v2"
    >
      {/* 禁止用 next/image 铺全屏 Unsplash：Turbopack 在 images.loader 异常时会抛 next-image-missing-loader */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- 全屏氛围图需原生 img；见上条注释 */}
        <img
          key={ambientSrc}
          src={ambientSrc}
          alt=""
          decoding="async"
          fetchPriority="high"
          suppressHydrationWarning
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
      <div className={TT_MARKETING_HOME_AMBIENT_SCRIM} aria-hidden />
      <div className={TT_MARKETING_HOME_AMBIENT_GLOW} aria-hidden />
      <div className={TT_MARKETING_HOME_DOT_GRID} aria-hidden />
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
          handleSubmit={data.handleSubmit}
        />
        <ItineraryResultsSection
          resultOrderIds={data.resultOrderIds}
          unlockedCardKeys={data.unlockedCardKeys}
          orderDetails={data.orderDetails}
          favoritedIds={data.favoritedIds}
          toggleFavorite={data.toggleFavorite}
          handleUnlockClick={data.handleUnlockClick}
          country={data.country}
          cities={data.cities}
          resultsSectionRef={data.resultsSectionRef}
        />
        <UnlockModal
          selectedForUnlock={data.selectedForUnlock}
          setSelectedForUnlock={data.setSelectedForUnlock}
          handleUnlockPay={data.handleUnlockPay}
          unlockPaying={data.unlockPaying}
        />
        <LandingFooter />
      </div>
    </main>
  );
}
