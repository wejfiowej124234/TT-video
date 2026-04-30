import { describe, expect, it } from "vitest";
import { customItineraryDraftFingerprint, customItineraryDraftPayload } from "./customItineraryDraft";
import { defaultForm } from "@/components/market/CustomItineraryModal/types";

describe("customItineraryDraft", () => {
  it("omits data URL bodies but preserves flags", () => {
    const f = defaultForm(3);
    f.title = "x";
    f.image = "data:image/png;base64,AAAA";
    const p = customItineraryDraftPayload(f);
    expect(p.coverImage).toEqual({ hasValue: true, isDataUrl: true });
    const fp1 = customItineraryDraftFingerprint(f);
    f.image = "data:image/png;base64,BBBB";
    const fp2 = customItineraryDraftFingerprint(f);
    expect(fp1).toBe(fp2);
  });
});
