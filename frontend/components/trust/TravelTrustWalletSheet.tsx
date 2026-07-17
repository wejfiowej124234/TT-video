"use client";

import { useEffect, useId, useLayoutEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { isAddress } from "viem";
import type { Connector } from "wagmi";
import { useTranslation } from "@/components/LocaleProvider";
import { TT_HEADER_UTILITY_MENU_L5 } from "@/lib/header/headerUtilityMenuL5";
import type { WalletConnectionController } from "@/lib/wallet/useWalletConnectionController";
import { WalletBrandIcon } from "@/components/trust/WalletBrandIcon";
import {
  WALLET_INSTALL_URL,
  type CataloguedConnector,
} from "@/lib/wallet/walletConnectorCatalog";
import type { RecommendedBrandRow } from "@/lib/wallet/connection/recommendedBrands";
import { markWalletInstallPending } from "@/lib/wallet/connection/installRedetect";

type Props = {
  ctrl: WalletConnectionController;
  authL5?: boolean;
};

type AnchorPos = {
  top: number;
  right: number;
  mobile: boolean;
};

/** Dense grid cell — 2 cols × 3 rows fits without scroll. */
const CELL =
  "flex min-h-[2.75rem] items-center gap-2 rounded-lg border border-ref-sun/20 bg-[#14100d]/85 px-2 py-1.5 text-left transition-[border-color,background-color] duration-150 hover:border-ref-sun/42 hover:bg-ref-sun/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40";

function brandLabel(
  t: (k: string, p?: Record<string, string | number>) => string,
  brandKey: string,
  fallback: string
): string {
  const key = `wallet_brand_${brandKey}`;
  const label = t(key);
  return label === key ? fallback : label;
}

/** Grid uses short names so 2-col cells never show "Wal…"; full name → title + aria. */
function brandDisplay(
  t: (k: string, p?: Record<string, string | number>) => string,
  brandKey: string,
  fallback: string
): { short: string; full: string } {
  const full = brandLabel(t, brandKey, fallback);
  const shortKey = `wallet_brand_short_${brandKey}`;
  const short = t(shortKey);
  return { short: short === shortKey ? full : short, full };
}

function WalletCell({
  brandKey,
  iconUrl,
  shortLabel,
  fullLabel,
  installed,
  current,
  installHint,
  onClick,
  href,
}: {
  brandKey: string;
  iconUrl?: string | null;
  shortLabel: string;
  fullLabel: string;
  installed?: boolean;
  current?: boolean;
  installHint?: string;
  onClick?: () => void;
  href?: string;
}) {
  const trailing = current ? (
    <span
      className="ml-auto shrink-0 rounded px-1 py-0.5 text-[11px] font-semibold text-emerald-950 bg-emerald-300/95"
      aria-hidden
    >
      {installHint}
    </span>
  ) : installed ? (
    <span
      className="ml-auto shrink-0 text-[11px] font-medium text-emerald-300"
      aria-hidden
      title={installHint}
    >
      ●
    </span>
  ) : installHint ? (
    <span
      className="ml-auto shrink-0 rounded px-1 py-0.5 text-[11px] font-semibold tracking-wide text-[#0c0a09] bg-[#e8d4a8]"
      aria-hidden
    >
      {installHint}
    </span>
  ) : null;

  const inner = (
    <>
      <WalletBrandIcon brandKey={brandKey} iconUrl={iconUrl} label={shortLabel} />
      <span className="min-w-0 flex-1 text-meta font-medium leading-tight text-[#f5e6c8]">
        {shortLabel}
      </span>
      {trailing}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        aria-label={fullLabel}
        title={fullLabel}
        className={CELL}
        onClick={() => markWalletInstallPending(brandKey)}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      aria-label={fullLabel}
      title={fullLabel}
      className={CELL}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}

function installUrlFor(brandKey: string): string {
  return WALLET_INSTALL_URL[brandKey] ?? "https://ethereum.org/wallets/";
}

function RecommendedCell({
  row,
  onConnect,
  t,
}: {
  row: RecommendedBrandRow;
  onConnect: (c: Connector) => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const { short, full } = brandDisplay(t, row.brandKey, row.brandKey);
  if (row.connector && row.installed) {
    return (
      <WalletCell
        shortLabel={short}
        fullLabel={full}
        installed
        installHint={t("wallet_installed")}
        onClick={() => onConnect(row.connector!)}
      />
    );
  }
  if (row.connector && !row.installed) {
    return (
      <WalletCell
        shortLabel={short}
        fullLabel={full}
        installHint={t("wallet_not_installed")}
        onClick={() => onConnect(row.connector!)}
      />
    );
  }
  return (
    <WalletCell
      shortLabel={short}
      fullLabel={full}
      installHint={t("wallet_not_installed")}
      href={installUrlFor(row.brandKey)}
    />
  );
}

function measureAnchor(): AnchorPos {
  const mobile =
    typeof window !== "undefined" &&
    (typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 639px)").matches
      : window.innerWidth < 640);
  const el = document.getElementById("tt-header-wallet");
  if (!el) {
    return { top: 76, right: 16, mobile };
  }
  const r = el.getBoundingClientRect();
  return {
    top: Math.min(r.bottom + 8, window.innerHeight - 24),
    right: Math.max(12, window.innerWidth - r.right),
    mobile,
  };
}

/**
 * L5 Wallet Connection Center — compact 2-col grid under header chip; no scrollbar.
 */
export function TravelTrustWalletSheet({ ctrl, authL5 }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<AnchorPos | null>(null);
  const [showViewOnly, setShowViewOnly] = useState(false);
  const [input, setInput] = useState("");
  const [addrError, setAddrError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!ctrl.sheetOpen) {
      setAnchor(null);
      return;
    }
    const sync = () => setAnchor(measureAnchor());
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [ctrl.sheetOpen]);

  useEffect(() => {
    if (!ctrl.sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ctrl.closeSheet();
        setShowViewOnly(false);
        setAddrError(null);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [ctrl]);

  if (!mounted || !ctrl.sheetOpen || !anchor) return null;

  const {
    catalog,
    recommendedBrands,
    connectWith,
    isPending,
    errorKind,
    clearError,
    walletConnectConfigured,
    wcUxMode,
    setViewOnlyAddress,
    closeSheet,
    phase,
    activeBrandKey,
  } = ctrl;

  const statusLine = (() => {
    if (isPending || phase === "connecting") return t("wallet_connecting_wait");
    if (errorKind === "rejected" || phase === "rejected") return t("wallet_error_rejected");
    if (errorKind === "locked" || phase === "locked") return t("wallet_error_locked");
    if (errorKind === "expired" || phase === "expired") return t("wallet_error_expired");
    if (errorKind === "unavailable" || phase === "unavailable") return t("wallet_error_unavailable");
    if (errorKind === "generic") return t("wallet_error_generic");
    return null;
  })();

  const hasRecommendedInstalled = recommendedBrands.some((r) => r.installed);
  const extras: CataloguedConnector[] = [
    ...catalog.injectedOther,
    ...catalog.other,
    ...catalog.safe,
  ].filter((item) => !(item.brandKey === "injected" && hasRecommendedInstalled));

  const close = () => {
    closeSheet();
    setShowViewOnly(false);
    clearError();
  };

  const mobile = anchor.mobile;
  const panelStyle: CSSProperties | undefined = mobile
    ? undefined
    : { top: anchor.top, right: anchor.right };

  const body = (
    <div
      className="fixed inset-0 z-[320]"
      role="presentation"
      data-tt-wallet-wc-ux={wcUxMode}
      data-tt-wallet-sheet-layer="wallet-anchor-popover"
    >
      <button
        type="button"
        aria-label={t("common_close")}
        className="absolute inset-0 bg-[#0c0a09]/35"
        onClick={close}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-tt-header-wallet-menu-l5={authL5 ? "1" : undefined}
        data-tt-wallet-sheet-l5="1"
        data-tt-wallet-sheet-compact="1"
        className={
          mobile
            ? "absolute inset-x-0 bottom-0 z-[1] w-full overflow-visible rounded-t-2xl border border-ref-sun/40 bg-[#0c0a09]/98 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_-14px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
            : "absolute z-[1] w-[min(20.5rem,calc(100vw-1.5rem))] overflow-visible rounded-xl border border-ref-sun/40 bg-[#0c0a09]/98 px-2.5 pb-2 pt-2 shadow-[0_0_0_1px_rgba(252,164,124,0.16),0_18px_44px_-16px_rgba(0,0,0,0.78)] backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
        style={panelStyle}
      >
        {mobile ? (
          <div
            className="mx-auto mb-1.5 h-1 w-9 rounded-full bg-ref-sun/35"
            aria-hidden
            data-tt-wallet-sheet-grabber="1"
          />
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ref-sun/50 to-transparent" />

        <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-small font-semibold tracking-tight text-[#fde9a8]">
              {t("wallet_sheet_title")}
            </h2>
            <p className="truncate text-meta text-slate-300/90">
              {t("wallet_sheet_lead")}
              <span className="text-slate-500"> · </span>
              <span className="text-[#d4b87a]">{t("wallet_sheet_nocustody")}</span>
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md px-1.5 py-0.5 text-meta text-slate-400 hover:bg-white/5 hover:text-[#fde9a8]"
            onClick={close}
            aria-label={t("common_close")}
          >
            ✕
          </button>
        </div>

        <div role="menu" aria-label={t("wallet_chooseConnector")}>
          {statusLine ? (
            <p
              className="mb-1.5 rounded-md border border-ref-sun/22 bg-ref-sun/8 px-2 py-1 text-meta text-[#fde9a8]"
              role="status"
              data-tt-wallet-status={phase}
            >
              {statusLine}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-1.5" data-tt-wallet-sheet-grid="1">
            {recommendedBrands.map((row) => (
              <RecommendedCell
                key={row.brandKey}
                row={row}
                onConnect={connectWith}
                t={t}
                activeBrandKey={activeBrandKey}
              />
            ))}
          </div>

          {walletConnectConfigured ? (
            <div className="mt-1.5">
              {catalog.walletConnect.map((item) => (
                <button
                  key={item.connector.uid}
                  type="button"
                  role="menuitem"
                  className={`${CELL} w-full`}
                  title={
                    wcUxMode === "deeplink"
                      ? t("wallet_wc_mobile_deeplink")
                      : t("wallet_wc_desktop_qr")
                  }
                  onClick={() => connectWith(item.connector)}
                >
                  <WalletBrandIcon
                    brandKey="walletconnect"
                    iconUrl={item.connector.icon}
                    label="WalletConnect"
                  />
                  <span className="min-w-0 flex-1 truncate text-meta font-medium text-[#f5e6c8]">
                    {t("wallet_brand_walletconnect")}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-[#e8d4a8]" aria-hidden>
                    {wcUxMode === "deeplink" ? "App" : "QR"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div
              className="mt-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5"
              data-tt-wallet-wc-unconfigured="1"
              role="status"
              title={t("wallet_wc_unconfigured")}
            >
              <p className="text-meta text-slate-300">{t("wallet_wc_mobile_deferred")}</p>
              <p className="mt-0.5 text-meta text-[#d4b87a]">{t("wallet_wc_injected_still_ok")}</p>
            </div>
          )}

          {extras.length > 0 ? (
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {extras.map((item) => {
                const { short, full } = brandDisplay(t, item.brandKey, item.connector.name);
                return (
                  <WalletCell
                    key={item.connector.uid}
                    brandKey={item.brandKey}
                    iconUrl={item.connector.icon}
                    shortLabel={short}
                    fullLabel={full}
                    installed={item.installed && item.kind !== "walletConnect"}
                    current={activeBrandKey === item.brandKey}
                    installHint={
                      activeBrandKey === item.brandKey
                        ? t("wallet_current")
                        : item.installed && item.kind !== "walletConnect"
                          ? t("wallet_installed")
                          : undefined
                    }
                    onClick={() => connectWith(item.connector)}
                  />
                );
              })}
            </div>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 border-t border-ref-sun/12 px-0.5 pt-1.5">
            <a
              href="https://ethereum.org/wallets/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-meta font-medium text-[#e8d4a8] underline-offset-2 hover:text-[#fde9a8] hover:underline"
            >
              {t("wallet_install_help")}
            </a>
            {!showViewOnly ? (
              <button
                type="button"
                role="menuitem"
                className="text-meta font-medium text-[#e8d4a8] hover:text-[#fde9a8]"
                onClick={() => {
                  setShowViewOnly(true);
                  setAddrError(null);
                }}
              >
                {t("wallet_viewOnly_entry")}
              </button>
            ) : null}
          </div>

          {showViewOnly ? (
            <div className="mt-1.5 space-y-1.5 rounded-lg border border-ref-sun/16 bg-white/[0.02] px-2 py-2">
              <p className="text-meta text-slate-400">{t("wallet_viewOnly_hint")}</p>
              <label className="sr-only" htmlFor="tt-wallet-viewonly-input">
                {t("wallet_inputAddress")}
              </label>
              <input
                id="tt-wallet-viewonly-input"
                role="textbox"
                aria-label={t("wallet_inputAddress")}
                className={TT_HEADER_UTILITY_MENU_L5.field}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="0x…"
                autoComplete="off"
              />
              {addrError ? <p className={TT_HEADER_UTILITY_MENU_L5.fieldError}>{addrError}</p> : null}
              <button
                type="button"
                className={TT_HEADER_UTILITY_MENU_L5.inlinePrimaryBtn}
                onClick={() => {
                  const v = input.trim();
                  if (!v) {
                    setAddrError(t("wallet_addressRequired"));
                    return;
                  }
                  if (!isAddress(v)) {
                    setAddrError(t("wallet_addressInvalid"));
                    return;
                  }
                  setViewOnlyAddress(v);
                  setShowViewOnly(false);
                  setInput("");
                  setAddrError(null);
                  closeSheet();
                }}
              >
                {t("common_accept")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
