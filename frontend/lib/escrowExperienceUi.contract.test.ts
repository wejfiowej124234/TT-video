import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const escrowDetail = join(__dirname, "../components/escrow/EscrowDetail/index.tsx");
const orderFlow = join(__dirname, "../components/escrow/OrderFlowSteps.tsx");

describe("escrow draft Experience L5 (①)", () => {
  it("EscrowDetail uses experience zone when pre-escrow without on-chain escrow", () => {
    const src = readFileSync(escrowDetail, "utf8");
    expect(src).toContain("experienceDraft");
    expect(src).toContain("isPreEscrowProtocol && !data.hasEscrow");
    expect(src).toContain("TT_ESCROW_EXPERIENCE_ZONE");
    expect(src).toContain('variantExperience={experienceDraft}');
    expect(src).toContain("compact={experienceDraft}");
    expect(src).toContain('variant={experienceDraft ? "marketDark" : "did"}');
    expect(src).toContain("variantExperience={experienceDraft}");
  });

  it("OrderFlowSteps supports compact experience draft strip", () => {
    const src = readFileSync(orderFlow, "utf8");
    expect(src).toContain('variant?: "default" | "did" | "experience"');
    expect(src).toContain("compact?: boolean");
    expect(src).toContain("order_flow_draft_compact_next");
  });

  it("draft order page has no embedded ChatBlock; community message link only", () => {
    const src = readFileSync(escrowDetail, "utf8");
    const quoteCard = readFileSync(
      join(__dirname, "../components/escrow/EscrowDetail/QuoteSummaryCard.tsx"),
      "utf8",
    );
    expect(src).not.toContain("ChatBlock");
    expect(src).toContain("EscrowDraftGuideAssignedCard");
    const assignedCard = readFileSync(
      join(__dirname, "../components/escrow/EscrowDetail/EscrowDraftGuideAssignedCard.tsx"),
      "utf8",
    );
    expect(assignedCard).toContain("community/messages");
    expect(src).toContain("showCityEditorUi");
    expect(src).toContain("escrow_draftDestinationSummary");
    expect(src).toContain("draftJourneyStep");
    expect(src).toContain("EscrowDraftGuideEmptyCard");
    expect(src).toContain("EscrowDraftPublishedBanner");
    expect(src).toMatch(
      /showPublishedPickGuideBanner[\s\S]{0,400}!showPublishedPickGuideBanner[\s\S]{0,120}EscrowDraftGuideEmptyCard/,
    );
    expect(src).toContain("escrow_draftCanonicalTotalLabel");
    expect(src).toContain("EscrowDraftGuideAssignedCard");
    expect(src).toContain("EscrowDraftPayStepCard");
    const emptyGuideCard = readFileSync(
      join(__dirname, "../components/escrow/EscrowDetail/EscrowDraftGuideEmptyCard.tsx"),
      "utf8",
    );
    expect(emptyGuideCard).toContain("marketHrefForEscrowGuideBind");
    expect(emptyGuideCard).toContain("orders_selectGuide");
    expect(emptyGuideCard).toContain("orderId");
    expect(src).toContain("escrowGuideMarketHref");
    expect(src).toContain("escrow_confirmBlocked_amountSync");
    const bookModal = readFileSync(join(__dirname, "../components/market/BookGuideModal.tsx"), "utf8");
    expect(bookModal).toContain("patchOrderGuide");
    expect(src).toContain("orders_selectGuide");
    expect(src).toContain("confirmBlockedReasonKey");
    expect(src).toContain("breakdownForList");
    expect(src).toContain("hideAmountBreakdown");
    expect(src).toContain("showExperienceItineraryList");
    expect(src).toContain("EscrowDraftMobileActionBar");
    expect(src).toContain("showDraftSaveAction");
    expect(src).toContain("EscrowDraftDayNarrativePanel");
    expect(src).toContain("showQuoteSyncAction");
    expect(src).toContain("quoteQuietSyncing");
    expect(src).toContain("amountQuietSyncFingerprintRef");
    expect(src).toContain("amountQuietSyncInFlightRef");
    expect(src).toContain("quoteAmountPersisted");
    expect(src).toContain("showConfirmReadyHint");
    expect(src).toContain("applyOptimisticItineraryPatch");
    expect(src).toContain("amountQuietSyncInFlightRef");
    expect(src).toContain("amountQuietSyncFingerprintRef");
    const quietSyncBlock = src.slice(
      src.indexOf("/** ① 草稿：订单额与分项不一致时静默对齐一次"),
      src.indexOf("/** 53-S15：复制摘要"),
    );
    expect(quietSyncBlock).not.toContain("refreshOrder({ force: true })");
    expect(src).toContain("hasGuideAssigned");
    expect(src).toContain("experienceConfirmBlockedReasonKey");
    const p03p04 = readFileSync(join(__dirname, "../lib/escrowExperienceP03P04.ts"), "utf8");
    expect(p03p04).toContain("escrow_confirmBlocked_pickGuide");
    expect(p03p04).toContain("escrow_confirmBlocked_waitGuideAccept");
    expect(p03p04).toContain("escrow_confirmBlocked_waitBilateral");
    expect(quoteCard).toContain("escrow_guideFee_pending");
    expect(quoteCard).toContain("guideAssigned");
    expect(src).toContain("EscrowOrderGetRateLimitBanner");
    expect(quoteCard).toMatch(/EscrowDraftTrustPayStrip[\s\S]*ConfirmFinalPlanBlock/);
    expect(src).toContain("hideViewModeLeadHint");
    expect(src).toContain("destinationLabel");
    expect(src).toContain("showExperienceSaveAction");
    expect(quoteCard).toContain("escrow_confirmReadyHint");
    expect(quoteCard).toContain("suppressCtaHint");
    const confirmBlock = readFileSync(
      join(__dirname, "../components/escrow/EscrowDetail/ConfirmFinalPlanBlock.tsx"),
      "utf8",
    );
    expect(confirmBlock).toContain("escrowExperienceSecondaryBtnClass");
    expect(confirmBlock).toContain("breakdownLines");
    expect(confirmBlock).toContain("from-[#1a1410]");
    expect(confirmBlock).toContain('EscrowDraftTrustPayStrip variant="modal"');
    expect(src).toContain("escrow_draftLeftColumnLead");
    expect(quoteCard).toContain("escrow_syncQuoteOneClick");
    expect(quoteCard).toContain("escrow_quoteQuietSyncing");
    expect(quoteCard).toContain("quoteQuietSyncError");
    expect(src).toContain("quoteQuietSyncError");
    const orderFlow = readFileSync(join(__dirname, "../components/escrow/OrderFlowSteps.tsx"), "utf8");
    expect(orderFlow).toContain("DraftJourneyStepper");
    expect(orderFlow).toContain("order_flow_journey_create");
    expect(orderFlow).toContain("order_flow_journey_selectGuide");
    const useEscrowDetail = readFileSync(
      join(__dirname, "../components/escrow/EscrowDetail/useEscrowDetail.ts"),
      "utf8",
    );
    expect(useEscrowDetail).toContain("orderGetGateRef");
    expect(useEscrowDetail).toContain("applyOptimisticItineraryPatch");
    expect(useEscrowDetail).toContain("ORDER_GET_RATE_LIMIT_BACKOFF_MS");
    expect(useEscrowDetail).toContain("ORDER_GET_PREFETCH_DEFER_MS");
    expect(useEscrowDetail).toContain("orderAllowsConfirmFinalPlan");
    expect(src).toContain("escrowExperienceP03P04");
    expect(src).toContain("guideAcceptPending");
    expect(src).toContain("bilateralPending");
    expect(src).toContain("showExperienceOrderActions");
    expect(src).toContain("waitingGuideAccept");
    expect(assignedCard).toContain("waitingGuideAccept");
    const createOnChain = readFileSync(
      join(__dirname, "../components/escrow/EscrowDetail/CreateOnChainEscrowBlock.tsx"),
      "utf8",
    );
    expect(createOnChain).toContain("isAssignedGuideId");
    expect(assignedCard).toContain("escrow_draftGuideChangeGuide");
    expect(assignedCard).toContain("marketHrefForEscrowGuideBind");
    const msgLink = readFileSync(join(__dirname, "../components/escrow/EscrowDetail/OrderMessageLink.tsx"), "utf8");
    expect(msgLink).toContain("order_messageLinkCta_experience");
  });

  it("EscrowDetailLoadErrorView uses Experience chrome without protocol risk stack", () => {
    const errView = readFileSync(
      join(__dirname, "../components/escrow/EscrowDetail/EscrowDetailLoadErrorView.tsx"),
      "utf8",
    );
    expect(errView).toContain("EscrowDraftTravelNotice");
    expect(errView).not.toContain("EscrowRiskNotice");
    expect(errView).toContain("TT_ESCROW_EXPERIENCE_ZONE");
  });

  it("EscrowDetailSection route fallback uses Experience skeleton not protocol risk stack", () => {
    const section = readFileSync(
      join(__dirname, "../components/escrow/EscrowDetailSection.tsx"),
      "utf8",
    );
    expect(section).toContain("EscrowDetailSkeleton");
    expect(section).not.toContain("EscrowRiskNotice");
    expect(section).not.toContain("border-cyan-500/30");
  });

  it("draft compliance uses EscrowDraftTravelNotice not full protocol risk stack", () => {
    const src = readFileSync(escrowDetail, "utf8");
    const expFooter = readFileSync(
      join(__dirname, "../components/escrow/EscrowDetail/EscrowDraftExperienceFooter.tsx"),
      "utf8",
    );
    expect(expFooter).toContain("EscrowDraftTravelNotice");
    expect(expFooter).toContain("<EscrowDraftTravelNotice compact");
    expect(src).toContain("EscrowDraftExperienceFooter");
    expect(src).toContain("contentRevisionKey");
    expect(src).not.toContain("escrow_saveItineraryHint_draft");
    expect(src).toContain("hideListDescriptions");
    expect(src).toContain("isEscrowExperienceDevToolsEnabled");
    expect(expFooter).toContain("showCancelOrder");
    expect(expFooter).toContain("escrow_cancelOrder");
    const quoteCard = readFileSync(join(__dirname, "../components/escrow/EscrowDetail/QuoteSummaryCard.tsx"), "utf8");
    expect(quoteCard).toContain("primaryFullWidth={isExperience}");
    expect(src).toContain("normalizeBreakdownTotals");
  });
});
