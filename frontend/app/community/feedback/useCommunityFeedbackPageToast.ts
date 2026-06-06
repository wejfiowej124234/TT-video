import { useState, useCallback, useEffect, useRef } from "react";

export function useCommunityFeedbackPageToast() {
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const feedbackToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedbackToast = useCallback((i18nKey: string) => {
    if (feedbackToastTimerRef.current) clearTimeout(feedbackToastTimerRef.current);
    setFeedbackToast(i18nKey);
    feedbackToastTimerRef.current = setTimeout(() => {
      feedbackToastTimerRef.current = null;
      setFeedbackToast(null);
    }, 3200);
  }, []);

  const dismissFeedbackToast = useCallback(() => {
    if (feedbackToastTimerRef.current) {
      clearTimeout(feedbackToastTimerRef.current);
      feedbackToastTimerRef.current = null;
    }
    setFeedbackToast(null);
  }, []);

  useEffect(
    () => () => {
      if (feedbackToastTimerRef.current) clearTimeout(feedbackToastTimerRef.current);
    },
    [],
  );

  return { feedbackToast, showFeedbackToast, dismissFeedbackToast };
}
