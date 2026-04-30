import { describe, expect, it } from "vitest";
import {
  acquisitionStudioDraftFingerprint,
  merchantStudioDraftFingerprint,
} from "./marketStudioDraft";

describe("marketStudioDraft", () => {
  it("merchantStudioDraftFingerprint ignores blob URLs and uses file flags", () => {
    const a = merchantStudioDraftFingerprint({
      title: "x",
      subtitle: "",
      category: "dining",
      city: "",
      countryIso: "",
      coverFileName: "c.jpg",
      videoFileName: null,
      videoUrl: "",
      highlightsText: "",
      description: "",
      priceUsdc: "1",
      deliveryArchetype: "escrow_order",
      agreeEscrowCopy: true,
    });
    const b = merchantStudioDraftFingerprint({
      title: "x",
      subtitle: "",
      category: "dining",
      city: "",
      countryIso: "",
      coverFileName: "c.jpg",
      videoFileName: null,
      videoUrl: "",
      highlightsText: "",
      description: "",
      priceUsdc: "1",
      deliveryArchetype: "escrow_order",
      agreeEscrowCopy: true,
    });
    expect(a).toBe(b);
    expect(a).toContain('"hasCoverFile":true');
  });

  it("acquisitionStudioDraftFingerprint is stable for same logical form", () => {
    const form = {
      title: "t",
      summary: "",
      supplyOrigin: "",
      receiptHandoff: "",
      category: "luxury",
      destinationCountryIso: "jp",
      bountyMinUsdc: "1",
      bountyMaxUsdc: "2",
      deadlineNote: "",
      coverFileName: null,
      videoFileName: null,
      videoUrl: "",
      highlightsText: "",
      description: "",
      inspectionStandard: "",
      authenticity: "",
      condition: "",
      rejections: "",
      handoff: "",
      agreeEscrowCopy: true,
    };
    expect(acquisitionStudioDraftFingerprint(form)).toContain('"destinationCountryIso":"JP"');
  });
});
