// search-params gate: parent route provides Suspense boundary.
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { getGuide, getMeta, postGuideStake } from "@/lib/apiClient";
import { readChainOffMountedFromMeta } from "@/lib/readChainOffMountedFromMeta";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useTranslation } from "@/components/LocaleProvider";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { parseGuideDetailForRoute } from "@/lib/guideDetailRoutePayload";
import type { GuideTripDateSelection } from "@/components/guides/GuideOccupiedScheduleBlock";
import type { GuideDetailShape } from "./guideDetailPageTypes";
import { MARKET_BIND_GUIDE_ORDER_QUERY } from "@/lib/marketDeepLink";
import { isUuidString } from "@/lib/isUuidString";
import {
  fetchBindableOwnItineraryOrders,
  pickDefaultBindOrderId,
} from "@/lib/bookGuideItineraryPicker";
import { readLandingResultOrderIds } from "@/lib/landingItinerarySession";
import { useBindOrderTripDates } from "@/hooks/useBindOrderTripDates";

export function useGuideDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const guideDetailLoginReturnUrl = useMemo(
    () => buildLoginReturnPathWithQuery(pathname, searchParams?.toString() ?? "", id ? `/guides/${id}` : "/guides"),
    [pathname, searchParams, id],
  );
  const [guide, setGuide] = useState<GuideDetailShape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeLoading, setStakeLoading] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [copiedDid, setCopiedDid] = useState(false);
  const [copyDidBusy, setCopyDidBusy] = useState(false);
  const [guideLoadRetryKey, setGuideLoadRetryKey] = useState(0);
  const [bookGuideOpen, setBookGuideOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<GuideTripDateSelection | null>(null);
  const [bindableItineraryCount, setBindableItineraryCount] = useState(0);

  const bindGuideToOrderFromQuery = useMemo(() => {
    const raw = searchParams.get(MARKET_BIND_GUIDE_ORDER_QUERY)?.trim() ?? "";
    return isUuidString(raw) ? raw : "";
  }, [searchParams]);

  const [autoBindOrderId, setAutoBindOrderId] = useState("");

  useEffect(() => {
    if (bindGuideToOrderFromQuery) {
      setAutoBindOrderId("");
      setBindableItineraryCount(0);
      return;
    }
    let cancelled = false;
    void fetchBindableOwnItineraryOrders()
      .then((items) => {
        if (cancelled) return;
        setBindableItineraryCount(items.length);
        if (items.length >= 1) {
          const landingPreferred = [...readLandingResultOrderIds()].reverse();
          setAutoBindOrderId(pickDefaultBindOrderId(items, landingPreferred));
        } else setAutoBindOrderId("");
      })
      .catch(() => {
        if (!cancelled) {
          setBindableItineraryCount(0);
          setAutoBindOrderId("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bindGuideToOrderFromQuery]);

  const effectiveBindOrderId = bindGuideToOrderFromQuery || autoBindOrderId;

  const itineraryBindActive = effectiveBindOrderId.length > 0;

  const { tripDates: bindOrderTripDates, loading: bindOrderTripLoading } =
    useBindOrderTripDates(effectiveBindOrderId);

  useEffect(() => {
    if (bindOrderTripDates) {
      setSelectedTrip({ start: bindOrderTripDates.start, end: bindOrderTripDates.end });
    }
  }, [bindOrderTripDates]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setGuide(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        try {
          const meta = await getMeta();
          if (cancelled) return;
          const mounted = readChainOffMountedFromMeta(meta);
          if (mounted === false) {
            setGuide(null);
            setError(t("guides_chainOffUnavailable"));
            return;
          }
        } catch {
          /* meta optional */
        }
        if (cancelled) return;
        const g = await getGuide(id);
        if (cancelled) return;
        const normalized = parseGuideDetailForRoute(g, id);
        if (!normalized) {
          setGuide(null);
          setError(t("guideDetail_payloadIncomplete"));
          return;
        }
        setError(null);
        setGuide(normalized as GuideDetailShape);
      } catch (err) {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("GuideDetailPage load:", err);
        }
        if (err instanceof Error && err.message === "login_required") {
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(guideDetailLoginReturnUrl)}`);
          return;
        }
        setGuide(null);
        setError(mapApiReadError(err, t, "guideDetail_loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router, t, guideLoadRetryKey, guideDetailLoginReturnUrl]);

  const handleStake = () => {
    if (!id || !stakeAmount.trim()) return;
    setStakeLoading(true);
    setStakeError(null);
    postGuideStake(id, { amount: stakeAmount.trim() })
      .then(() => {
        setStakeAmount("");
        return getGuide(id);
      })
      .then((g) => {
        const normalized = parseGuideDetailForRoute(g, id);
        if (!normalized) {
          setStakeError(t("guideDetail_payloadIncomplete"));
          return;
        }
        setGuide(normalized as GuideDetailShape);
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("GuideDetailPage stake:", e);
        }
        if (e instanceof Error && e.message === "login_required") {
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(guideDetailLoginReturnUrl)}`);
          return;
        }
        setStakeError(mapApiReadError(e, t, "guideDetail_stakeFailed"));
      })
      .finally(() => setStakeLoading(false));
  };

  const copyDid = async () => {
    const w = guide?.wallet_address;
    if (!w || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    setCopyDidBusy(true);
    try {
      await navigator.clipboard.writeText(w);
      setCopiedDid(true);
      setTimeout(() => setCopiedDid(false), 2000);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("GuideDetailPage copyDid:", err);
      }
    } finally {
      setCopyDidBusy(false);
    }
  };

  return {
    id,
    guide,
    loading,
    error,
    stakeAmount,
    setStakeAmount,
    stakeLoading,
    stakeError,
    copiedDid,
    copyDidBusy,
    copyDid,
    bumpGuideLoadRetry: () => setGuideLoadRetryKey((k) => k + 1),
    bookGuideOpen,
    setBookGuideOpen,
    selectedTrip,
    setSelectedTrip,
    handleStake,
    effectiveBindOrderId,
    itineraryBindActive,
    bindOrderTripLoading,
    bindableItineraryCount,
    hasBindableItineraries: bindableItineraryCount > 0,
  };
}
