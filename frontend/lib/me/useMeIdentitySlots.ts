"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMe, getAuthHeaders } from "@/lib/apiClient";
import {
  parseIdentitySlotsFromMe,
  type MeIdentitySlot,
  type MeIdentitySlotId,
} from "@/lib/meIdentitySlots";

export function useMeIdentitySlots() {
  const [slots, setSlots] = useState<MeIdentitySlot[] | null>(null);
  const [ready, setReady] = useState(false);
  const genRef = useRef(0);

  const run = useCallback(() => {
    const gen = ++genRef.current;
    if (typeof window === "undefined") return;
    const auth = getAuthHeaders();
    const canProbe = !!(auth.Authorization || auth["X-User-Id"]);
    if (!canProbe) {
      if (gen !== genRef.current) return;
      setSlots(null);
      setReady(true);
      return;
    }
    void getMe()
      .then((me) => {
        if (gen !== genRef.current) return;
        setSlots(parseIdentitySlotsFromMe(me));
        setReady(true);
      })
      .catch((err) => {
        if (gen !== genRef.current) return;
        if (typeof window !== "undefined") {
          console.error("useMeIdentitySlots getMe:", err);
        }
        setSlots(null);
        setReady(true);
      });
  }, []);

  useEffect(() => {
    run();
    const onProfile = () => run();
    window.addEventListener("traveltrust:profile-updated", onProfile);
    return () => window.removeEventListener("traveltrust:profile-updated", onProfile);
  }, [run]);

  const slotById = useCallback(
    (id: MeIdentitySlotId) => slots?.find((s) => s.id === id) ?? null,
    [slots],
  );

  return { slots, ready, slotById };
}
