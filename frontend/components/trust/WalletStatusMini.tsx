"use client";

import { useId, useRef, useEffect, useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { isAddress } from "viem";
import { useTranslation } from "@/components/LocaleProvider";
import { HeaderUtilityMenuL5Chrome } from "@/components/header/HeaderUtilityMenuL5Chrome";
import { useViewOnlyAddress } from "@/lib/ViewOnlyAddressContext";
import { getExpectedChainId } from "@/lib/chainEnv";
import {
  headerUtilityMenuL5ShellClass,
  TT_HEADER_UTILITY_MENU_L5,
} from "@/lib/header/headerUtilityMenuL5";
import {
  TT_MARKETING_HEADER_FOCUS_RING_DARK,
  TT_MARKETING_HEADER_FOCUS_RING_LIGHT,
  TT_MARKETING_HEADER_WALLET_BTN_AUTH_L5,
  TT_MARKETING_HEADER_WALLET_BTN_COMMUNITY,
  TT_MARKETING_HEADER_WALLET_BTN_DARK,
  TT_MARKETING_HEADER_WALLET_BTN_LIGHT,
  TT_MARKETING_HEADER_WALLET_CONNECTED_AUTH_L5,
  TT_MARKETING_HEADER_WALLET_CONNECTED_COMMUNITY,
  TT_MARKETING_HEADER_WALLET_CONNECTED_DARK,
  TT_MARKETING_HEADER_WALLET_CONNECTED_LIGHT,
  TT_MARKETING_HEADER_WALLET_MENU_DARK,
  TT_MARKETING_HEADER_WALLET_MENU_ITEM_DARK,
  TT_MARKETING_HEADER_WALLET_MENU_ITEM_LIGHT,
  TT_MARKETING_HEADER_WALLET_MENU_LIGHT,
} from "@/lib/marketingUi";
import type { HeaderUtilityVariant } from "@/lib/uiSystem";

/** `variant="light"` = 深色顶栏（历史命名 · 与语言切换 `dark` 相反） */
export default function WalletStatusMini({ variant = "dark" }: { variant?: HeaderUtilityVariant }) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { viewOnlyAddress, setViewOnlyAddress } = useViewOnlyAddress();
  const [open, setOpen] = useState(false);
  const [inputAddr, setInputAddr] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const viewOnlySubmitFormId = useId();

  const onAuthL5Header = variant === "authL5";
  const onCommunityHeader = variant === "community";
  const onDarkHeader = variant === "light" || onCommunityHeader || onAuthL5Header;
  const btnClass = `${
    onAuthL5Header
      ? TT_MARKETING_HEADER_WALLET_BTN_AUTH_L5
      : onCommunityHeader
        ? TT_MARKETING_HEADER_WALLET_BTN_COMMUNITY
        : onDarkHeader
          ? TT_MARKETING_HEADER_WALLET_BTN_DARK
          : TT_MARKETING_HEADER_WALLET_BTN_LIGHT
  } ${onDarkHeader ? TT_MARKETING_HEADER_FOCUS_RING_DARK : TT_MARKETING_HEADER_FOCUS_RING_LIGHT} ${onAuthL5Header && open ? TT_HEADER_UTILITY_MENU_L5.buttonOpen : ""}`;
  const menuClass = onAuthL5Header
    ? headerUtilityMenuL5ShellClass("narrow")
    : onDarkHeader
      ? `${TT_MARKETING_HEADER_WALLET_MENU_DARK} absolute right-0 top-full mt-1 min-w-[220px] py-2`
      : `${TT_MARKETING_HEADER_WALLET_MENU_LIGHT} absolute right-0 top-full mt-1 min-w-[220px] py-2`;
  const menuItemClass = onAuthL5Header
    ? TT_HEADER_UTILITY_MENU_L5.item
    : onDarkHeader
      ? TT_MARKETING_HEADER_WALLET_MENU_ITEM_DARK
      : TT_MARKETING_HEADER_WALLET_MENU_ITEM_LIGHT;
  const connectedShellClass = onAuthL5Header
    ? TT_MARKETING_HEADER_WALLET_CONNECTED_AUTH_L5
    : onCommunityHeader
      ? TT_MARKETING_HEADER_WALLET_CONNECTED_COMMUNITY
      : onDarkHeader
        ? TT_MARKETING_HEADER_WALLET_CONNECTED_DARK
        : TT_MARKETING_HEADER_WALLET_CONNECTED_LIGHT;
  const disconnectClass = onAuthL5Header
    ? "text-meta text-slate-400 hover:text-ref-sun/90"
    : onCommunityHeader
      ? "text-meta text-slate-500 hover:text-slate-200"
      : onDarkHeader
        ? "text-meta text-[#e8e4e0]/80 hover:text-white"
        : "text-meta text-[#6b5a48] hover:text-[#9a5f18]";

  const expectedChainId = getExpectedChainId();
  const wrongNetwork = isConnected && chainId !== expectedChainId;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShowInput(false);
        setInputAddr("");
        setInputError(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleConnect = (connectorId: string) => {
    const c = connectors.find((x) => x.uid === connectorId);
    if (c) {
      setViewOnlyAddress(null);
      connect({ connector: c });
      setOpen(false);
    }
  };

  const handleSubmitAddress = () => {
    const raw = inputAddr.trim();
    if (!raw) {
      setInputError(t("wallet_addressRequired"));
      return;
    }
    if (!isAddress(raw)) {
      setInputError(t("wallet_addressInvalid"));
      return;
    }
    setInputError(null);
    setViewOnlyAddress(raw);
    setInputAddr("");
    setShowInput(false);
    setOpen(false);
  };

  const handleClearViewOnly = () => {
    setViewOnlyAddress(null);
    setOpen(false);
  };

  if (isConnected) {
    return (
      <div className={`${connectedShellClass} gap-2`}>
        <span className={`text-meta truncate ${wrongNetwork ? "text-warning font-medium" : ""}`} title={address}>
          Wallet · {wrongNetwork ? t("wallet_wrongNetwork") : t("wallet_connected")}
        </span>
        <span className="font-mono text-meta max-w-[72px] truncate opacity-80" title={address}>
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            disconnect();
          }}
        >
          <button type="submit" className={`${disconnectClass} ${onDarkHeader ? TT_MARKETING_HEADER_FOCUS_RING_DARK : TT_MARKETING_HEADER_FOCUS_RING_LIGHT} rounded-sm px-0.5`}>
            {t("wallet_disconnect")}
          </button>
        </form>
      </div>
    );
  }

  if (!isConnected && viewOnlyAddress) {
    return (
      <div className={`${connectedShellClass} gap-2`}>
        <span className="text-meta truncate" title={viewOnlyAddress}>
          Wallet · {viewOnlyAddress.slice(0, 6)}…{viewOnlyAddress.slice(-4)} ({t("wallet_viewOnly")})
        </span>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            handleClearViewOnly();
          }}
        >
          <button type="submit" className={`${disconnectClass} ${onDarkHeader ? TT_MARKETING_HEADER_FOCUS_RING_DARK : TT_MARKETING_HEADER_FOCUS_RING_LIGHT} rounded-sm px-0.5`}>
            {t("wallet_disconnect")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        aria-busy={isPending ? true : undefined}
        className={`${btnClass} disabled:opacity-50`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("wallet_connect")}
      >
        <span>Wallet</span>
        {isPending ? ` · ${t("wallet_connecting")}` : null}
        <svg className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          data-tt-header-wallet-menu-l5={onAuthL5Header ? "1" : undefined}
          className={menuClass}
        >
          {onAuthL5Header ? <HeaderUtilityMenuL5Chrome /> : null}
          <div className={onAuthL5Header ? `${TT_HEADER_UTILITY_MENU_L5.dropdownBody} gap-0.5 px-1.5 py-0.5` : undefined}>
            <p
              className={
                onAuthL5Header
                  ? TT_HEADER_UTILITY_MENU_L5.sectionMeta
                  : `px-3 py-1 text-meta ${onDarkHeader ? "text-slate-300/90" : "text-[#6b5a48]"}`
              }
            >
              {t("wallet_chooseConnector")}
            </p>
            {connectors.slice(0, 3).map((c) => (
              <form
                key={c.uid}
                className="contents"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConnect(c.uid);
                }}
              >
                <button
                  type="submit"
                  role="menuitem"
                  disabled={isPending}
                  aria-busy={isPending ? true : undefined}
                  className={`${menuItemClass} disabled:opacity-50`}
                >
                  {c.name}
                </button>
              </form>
            ))}
            <div className={onAuthL5Header ? TT_HEADER_UTILITY_MENU_L5.divider : `my-2 border-t ${onDarkHeader ? "border-ref-sun/18" : "border-ref-sun/12"}`} />
            {!showInput ? (
              <form
                className="contents"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowInput(true);
                }}
              >
                <button type="submit" role="menuitem" className={menuItemClass}>
                  {t("wallet_inputAddress")}
                </button>
              </form>
            ) : (
              <div className="space-y-2 px-2 py-2">
                <input
                  form={viewOnlySubmitFormId}
                  type="text"
                  name="wallet_view_only_address"
                  value={inputAddr}
                  onChange={(e) => {
                    setInputAddr(e.target.value);
                    setInputError(null);
                  }}
                  placeholder={t("auth_register_placeholder_wallet")}
                  className={
                    onAuthL5Header
                      ? TT_HEADER_UTILITY_MENU_L5.field
                      : "w-full rounded-[var(--radius-sm)] border border-ref-sun/20 bg-white px-2 py-1.5 text-small text-ink-900 placeholder:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45"
                  }
                  aria-label={t("wallet_inputAddress")}
                />
                {inputError ? (
                  <p className={onAuthL5Header ? TT_HEADER_UTILITY_MENU_L5.fieldError : "text-meta text-danger px-1"}>
                    {inputError}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <form
                    id={viewOnlySubmitFormId}
                    className="contents"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitAddress();
                    }}
                  >
                    <button
                      type="submit"
                      className={
                        onAuthL5Header
                          ? `${TT_HEADER_UTILITY_MENU_L5.inlinePrimaryBtn} !min-h-[36px] px-3 py-1.5 text-meta`
                          : "rounded-[var(--radius-sm)] bg-ref-sun px-2 py-1 text-small font-semibold text-[#0c0a09] hover:brightness-105"
                      }
                    >
                      {t("common_accept")}
                    </button>
                  </form>
                  <form
                    className="contents"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setShowInput(false);
                      setInputAddr("");
                      setInputError(null);
                    }}
                  >
                    <button
                      type="submit"
                      className={
                        onAuthL5Header
                          ? TT_HEADER_UTILITY_MENU_L5.inlineGhostBtn
                          : `rounded-[var(--radius-sm)] px-2 py-1 text-small ${onDarkHeader ? "text-slate-200" : "text-[#6b5a48]"}`
                      }
                    >
                      {t("common_cancel")}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
