import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";
import type { CustomItineraryForm } from "../types";
import type { GuideQuoteBreakdown } from "../useQuoteCalculation";

export interface GuideFormQuoteAndCoverSectionProps {
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  guideQuoteBreakdown: GuideQuoteBreakdown;
  hasGuideInterCity: boolean;
  labelClass: string;
  inputClass: string;
  guideHasEditedAmountRef: MutableRefObject<boolean>;
  setViewingGuideImage: (v: { label: string; url: string } | null) => void;
  viewingGuideImage: { label: string; url: string } | null;
  submitErrorRef: RefObject<HTMLParagraphElement | null>;
  submitError: string | null;
  submitErrorNoticeId: string;
  coverFileTooBig: boolean;
  setCoverFileTooBig: (v: boolean) => void;
  t: (key: string) => string;
}
