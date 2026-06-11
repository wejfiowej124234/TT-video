"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  pullMarketTravelBookmarksIntoLocal,
  pushMarketGuideBookmarkToggle,
  pushMarketOrderBookmarkToggle,
  hasMarketAuthSession,
} from "@/lib/marketTravelBookmarksSync";
import { FAV_ORDERS_KEY, FAV_GUIDES_KEY, loadFavSet, saveFavSet, subscribeMarketFavoritesStorage } from "./marketPageUtils";

export function useMarketPageFavorites() {
  const { t } = useTranslation();
  const [favoritedOrderIds, setFavoritedOrderIds] = useState<Set<string>>(new Set());
  const [favoritedGuideIds, setFavoritedGuideIds] = useState<Set<string>>(new Set());
  const [bookmarkSyncAlert, setBookmarkSyncAlert] = useState<string | null>(null);
  const [favoriteToggleAlert, setFavoriteToggleAlert] = useState<string | null>(null);
  /** SSR 与首屏 hydration 须一致；登录态文案在 mount 后再读 localStorage */
  const [favoritesSyncHint, setFavoritesSyncHint] = useState(() => t("market_favorites_sync_note_local"));
  const syncInFlightRef = useRef(false);

  const refreshFavoritesSyncHint = useCallback(() => {
    setFavoritesSyncHint(
      hasMarketAuthSession()
        ? t("market_favorites_sync_note_logged_in")
        : t("market_favorites_sync_note_local"),
    );
  }, [t]);

  const refreshFromLocalStorage = useCallback(() => {
    setFavoritedOrderIds(loadFavSet(FAV_ORDERS_KEY));
    setFavoritedGuideIds(loadFavSet(FAV_GUIDES_KEY));
  }, []);

  const syncFromServer = useCallback(async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      const result = await pullMarketTravelBookmarksIntoLocal();
      refreshFromLocalStorage();
      if (!result.ok) {
        setBookmarkSyncAlert(t("market_bookmarks_sync_failed"));
      } else {
        setBookmarkSyncAlert(null);
      }
    } finally {
      syncInFlightRef.current = false;
    }
  }, [refreshFromLocalStorage, t]);

  useEffect(() => {
    refreshFavoritesSyncHint();
  }, [refreshFavoritesSyncHint]);

  useEffect(() => {
    refreshFromLocalStorage();
    if (hasMarketAuthSession()) {
      void syncFromServer();
    }
  }, [refreshFromLocalStorage, syncFromServer]);

  useEffect(() => {
    return subscribeMarketFavoritesStorage((key) => {
      if (key === FAV_ORDERS_KEY) setFavoritedOrderIds(loadFavSet(FAV_ORDERS_KEY));
      if (key === FAV_GUIDES_KEY) setFavoritedGuideIds(loadFavSet(FAV_GUIDES_KEY));
    });
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "traveltrust_session_token" || e.key === "traveltrust_user_id") {
        refreshFavoritesSyncHint();
        refreshFromLocalStorage();
        if (hasMarketAuthSession()) void syncFromServer();
        else setBookmarkSyncAlert(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshFromLocalStorage, syncFromServer, refreshFavoritesSyncHint]);

  const toggleOrderFavorite = useCallback(
    (id: string) => {
      setFavoriteToggleAlert(null);
      const prev = loadFavSet(FAV_ORDERS_KEY);
      const next = new Set(prev);
      const willFavorite = !next.has(id);
      if (willFavorite) next.add(id);
      else next.delete(id);
      saveFavSet(FAV_ORDERS_KEY, next);
      setFavoritedOrderIds(next);

      void pushMarketOrderBookmarkToggle(id, willFavorite).catch((err) => {
        saveFavSet(FAV_ORDERS_KEY, prev);
        setFavoritedOrderIds(prev);
        setFavoriteToggleAlert(mapApiReadError(err, t, "market_favorite_toggle_failed"));
      });
    },
    [t],
  );

  const toggleGuideFavorite = useCallback(
    (id: string) => {
      setFavoriteToggleAlert(null);
      const prev = loadFavSet(FAV_GUIDES_KEY);
      const next = new Set(prev);
      const willFavorite = !next.has(id);
      if (willFavorite) next.add(id);
      else next.delete(id);
      saveFavSet(FAV_GUIDES_KEY, next);
      setFavoritedGuideIds(next);

      void pushMarketGuideBookmarkToggle(id, willFavorite).catch((err) => {
        saveFavSet(FAV_GUIDES_KEY, prev);
        setFavoritedGuideIds(prev);
        setFavoriteToggleAlert(mapApiReadError(err, t, "market_favorite_toggle_failed"));
      });
    },
    [t],
  );

  return {
    favoritedOrderIds,
    favoritedGuideIds,
    toggleOrderFavorite,
    toggleGuideFavorite,
    favoritesSyncHint,
    bookmarkSyncAlert,
    onBookmarkSyncRetry: () => void syncFromServer(),
    favoriteToggleAlert,
    onFavoriteToggleAlertDismiss: () => setFavoriteToggleAlert(null),
  };
}
