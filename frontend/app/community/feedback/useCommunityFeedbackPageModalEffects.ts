"use client";

import { useEffect, type RefObject } from "react";

export function useCommunityFeedbackPageModalEffects(args: {
  postOpen: boolean;
  setPostOpen: (open: boolean) => void;
  setContent: (content: string) => void;
  resetMedia: () => void;
  clearFeedbackFormErrors: () => void;
  modalFocusRef: RefObject<HTMLSelectElement | null>;
}) {
  const { postOpen, setPostOpen, setContent, resetMedia, clearFeedbackFormErrors, modalFocusRef } = args;

  useEffect(() => {
    if (postOpen && modalFocusRef.current) {
      const id = setTimeout(() => modalFocusRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [postOpen, modalFocusRef]);

  useEffect(() => {
    if (!postOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPostOpen(false);
        setContent("");
        resetMedia();
        clearFeedbackFormErrors();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [postOpen, clearFeedbackFormErrors, resetMedia, setPostOpen, setContent]);
}
