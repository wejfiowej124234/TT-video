"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { getGuide, getGuides, getIdempotencyKey, postOrder } from "@/lib/apiClient";
import { authLoginHrefForGuideDetailReturn } from "@/lib/ordersGuideDeepLink";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { stashEscrowOrderPrefetchFromPostOrderSuccess } from "@/lib/orderEscrowPrefetch";
import {
  dedupeGuidesById,
  sortPreferredGuideFirst,
  type OrdersNewGuideRow,
} from "./ordersNewPageModel";

export type UseOrdersNewPageResult = {
  guideIdFromQuery: string;
  guideId: string;
  setGuideId: Dispatch<SetStateAction<string>>;
  amount: string;
  setAmount: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  guides: OrdersNewGuideRow[];
  guidesLoadError: string | null;
  bumpGuidesRetry: () => void;
  guidePickerOpen: boolean;
  setGuidePickerOpen: (v: boolean) => void;
  loading: boolean;
  error: string | null;
  createdId: string | null;
  handleSubmit: (e: FormEvent) => void;
  stashCreatedOrderEscrowPayPrefetch: () => void;
  keepLinkGuide: () => void;
};

export function useOrdersNewPage(): UseOrdersNewPageResult {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const guideIdFromQuery = searchParams?.get("guide_id") ?? "";
  /** `getGuides` Promise 解析时须读最新 query（Suspense/hydration 后 `guide_id` 才就绪），避免闭包仍为 "" 导致不注入向导。 */
  const guideIdFromQueryRef = useRef(guideIdFromQuery);
  guideIdFromQueryRef.current = guideIdFromQuery;
  const [guideId, setGuideId] = useState(guideIdFromQuery);
  const [amount, setAmount] = useState("");
  const defaultFiat = t("orders_defaultFiatCurrency");
  const [currency, setCurrency] = useState(defaultFiat);
  const [guides, setGuides] = useState<OrdersNewGuideRow[]>([]);
  const [guidesLoadError, setGuidesLoadError] = useState<string | null>(null);
  const [guidesRetryKey, setGuidesRetryKey] = useState(0);
  /** 从市场带 `guide_id` 时默认收起下拉，减少重复选择；可点「更换向导」展开。 */
  const [guidePickerOpen, setGuidePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  /** B-034：连点或慢网络下禁止并发 POST（state 更新前第二下仍可能进 handler） */
  const submitInFlightRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    setGuideId((prev) => guideIdFromQuery || prev);
  }, [guideIdFromQuery]);

  useEffect(() => {
    if (!guideIdFromQuery.trim()) setGuidePickerOpen(true);
    else setGuidePickerOpen(false);
  }, [guideIdFromQuery]);

  /** URL 带 `guide_id` 时立即注入下拉（不依赖 `getGuides` 时序）；与下方 merge / ref 同源。 */
  useEffect(() => {
    const q = guideIdFromQuery.trim();
    if (!q) return;
    setGuides((prev) => dedupeGuidesById([{ id: q, city: t("orders_fromLink") }, ...prev]));
  }, [guideIdFromQuery, t]);

  useEffect(() => {
    const q = guideIdFromQuery.trim();
    if (!q) return;
    let cancelled = false;
    getGuide(q)
      .then((api) => {
        if (cancelled || api == null || typeof api !== "object") return;
        const o = api as Record<string, unknown>;
        const city = typeof o.city === "string" ? o.city.trim() : "";
        if (!city) return;
        setGuides((prev) => dedupeGuidesById(prev.map((g) => (g.id === q ? { ...g, city } : g))));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [guideIdFromQuery]);

  useEffect(() => {
    setGuidesLoadError(null);
    getGuides()
      .then((res) => (Array.isArray(res.items) ? res.items : []) as OrdersNewGuideRow[])
      .then((list) => {
        const deduped = dedupeGuidesById(list);
        const q = (guideIdFromQueryRef.current ?? "").trim();
        const hasQueryGuide = !!q && !deduped.some((g) => g.id === q);
        const merged = hasQueryGuide ? dedupeGuidesById([{ id: q, city: t("orders_fromLink") }, ...deduped]) : deduped;
        return sortPreferredGuideFirst(merged, q);
      })
      .then(setGuides)
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("OrdersNew getGuides:", err);
        }
        if (err instanceof Error && err.message === "login_required") {
          const loginHref = authLoginHrefForGuideDetailReturn(guideIdFromQuery);
          if (loginHref) {
            router.replace(loginHref);
            return;
          }
        }
        const q = (guideIdFromQueryRef.current ?? "").trim();
        if (q) {
          setGuides(dedupeGuidesById([{ id: q, city: t("orders_fromLink") }]));
        } else {
          setGuides([]);
        }
        setGuidesLoadError(mapApiReadError(err, t, "orders_guides_loadFailed"));
      });
  }, [guideIdFromQuery, t, guidesRetryKey, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!guideId.trim() || !amount.trim()) return;
    if (loading || submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setLoading(true);
    setError(null);
    postOrder(
      {
        guide_id: guideId.trim(),
        amount: amount.trim(),
        currency: currency.trim() || t("orders_defaultFiatCurrency"),
      },
      getIdempotencyKey(),
    )
      .then((res) => {
        const data = res as { order?: { id?: string } };
        const id = data?.order?.id ?? (res as { id?: string })?.id;
        if (typeof id === "string" && id.trim()) {
          setError(null);
          setCreatedId(id.trim());
        } else {
          if (typeof window !== "undefined") {
            console.error("OrdersNew postOrder: missing order id in response", res);
          }
          setError(t("orders_createResponseMissingOrderId"));
        }
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("OrdersNew postOrder:", e);
        }
        if (e instanceof Error && e.message === "login_required") {
          const loginHref = authLoginHrefForGuideDetailReturn(guideId.trim());
          if (loginHref) {
            router.replace(loginHref);
            return;
          }
        }
        setError(mapApiReadError(e, t, "orders_createFailed"));
      })
      .finally(() => {
        submitInFlightRef.current = false;
        setLoading(false);
      });
  };

  const stashCreatedOrderEscrowPayPrefetch = useCallback(() => {
    if (!createdId) return;
    stashEscrowOrderPrefetchFromPostOrderSuccess({
      id: createdId,
      amount: amount.trim(),
      currency: (currency.trim() || defaultFiat).trim(),
      guide_id: guideId.trim(),
    });
  }, [createdId, amount, currency, guideId, defaultFiat]);

  const bumpGuidesRetry = useCallback(() => {
    setGuidesRetryKey((k) => k + 1);
  }, []);

  const keepLinkGuide = useCallback(() => {
    setGuideId(guideIdFromQuery.trim());
    setGuidePickerOpen(false);
  }, [guideIdFromQuery]);

  return {
    guideIdFromQuery,
    guideId,
    setGuideId,
    amount,
    setAmount,
    currency,
    setCurrency,
    guides,
    guidesLoadError,
    bumpGuidesRetry,
    guidePickerOpen,
    setGuidePickerOpen,
    loading,
    error,
    createdId,
    handleSubmit,
    stashCreatedOrderEscrowPayPrefetch,
    keepLinkGuide,
  };
}
