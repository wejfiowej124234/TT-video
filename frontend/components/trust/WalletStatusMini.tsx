"use client";

import { useId, useRef, useEffect, useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { isAddress } from "viem";
import { useTranslation } from "@/components/LocaleProvider";
import { useViewOnlyAddress } from "@/lib/ViewOnlyAddressContext";
import { getExpectedChainId } from "@/lib/chainEnv";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/** 顶栏白底与 /traveltrust Hero 深卡共用 inset focus ring，避免 ring-offset 与父级背景打架（13-1 / 37）。 */
const focusInset = (light: boolean) =>
  light
    ? "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/55 rounded-sm"
    : "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-travel-500/70 rounded-sm";

/** 54-S17：未连接时点击 Wallet 展开下拉——常用钱包 + 输入地址（只读）；已连接保持原样 */
export default function WalletStatusMini({ variant = "dark" }: { variant?: "light" | "dark" }) {
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

  const expectedChainId = getExpectedChainId();
  const wrongNetwork = isConnected && chainId !== expectedChainId;

  const isLight = variant === "light";
  const textMain = isLight ? "text-white/90" : "text-ink-600";
  const textSub = isLight ? "text-white/75" : "text-ink-400";
  const textHover = isLight ? "hover:text-white" : "hover:text-travel-500";
  const textWarning = wrongNetwork ? "text-warning font-medium" : textMain;

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

  const displayAddress = address ?? viewOnlyAddress;
  const isViewOnly = !isConnected && !!viewOnlyAddress;

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-meta ${textWarning}`} title={address}>
          Wallet · {wrongNetwork ? t("wallet_wrongNetwork") : t("wallet_connected")}
        </span>
        <span className={`font-mono text-meta ${textSub} max-w-[80px] truncate`} title={address}>
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            disconnect();
          }}
        >
          <button
            type="submit"
            className={`text-meta ${isLight ? "text-white/70 hover:text-white" : "text-ink-500 hover:text-ink-700"} ${focusInset(isLight)} px-0.5`}
          >
            {t("wallet_disconnect")}
          </button>
        </form>
      </div>
    );
  }

  if (isViewOnly) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-meta ${textMain}`} title={viewOnlyAddress ?? undefined}>
          Wallet · {viewOnlyAddress?.slice(0, 6)}…{viewOnlyAddress?.slice(-4)} ({t("wallet_viewOnly")})
        </span>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            handleClearViewOnly();
          }}
        >
          <button
            type="submit"
            className={`text-meta ${isLight ? "text-white/70 hover:text-white" : "text-ink-500 hover:text-ink-700"} ${focusInset(isLight)} px-0.5`}
          >
            {t("wallet_disconnect")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        aria-busy={isPending ? true : undefined}
        className={`flex items-center gap-1.5 text-meta ${textMain} ${textHover} disabled:opacity-50 ${focusInset(isLight)}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("wallet_connect")}
      >
        <span>Wallet</span>
        {isPending ? ` · ${t("wallet_connecting")}` : null}
        <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4.5L6 7.5L9 4.5" /></svg>
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute right-0 top-full mt-1 min-w-[220px] rounded-[var(--radius-sm)] border py-2 shadow-strong z-50 ${
            isLight ? "border-white/25 bg-white/20 backdrop-blur-md" : "border-ink-200 bg-bg-console"
          }`}
        >
          <p className={`px-3 py-1 text-meta ${isLight ? "text-white/80" : "text-ink-500"}`}>{t("wallet_chooseConnector")}</p>
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
                className={`w-full text-left px-3 py-2 text-small ${isLight ? "text-white/95 hover:bg-white/20" : "text-ink-700 hover:bg-ink-100"} disabled:opacity-50 ${focusInset(isLight)}`}
              >
                {c.name}
              </button>
            </form>
          ))}
          <div className="border-t my-2 border-ink-200/50" />
          {!showInput ? (
            <form
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                setShowInput(true);
              }}
            >
              <button
                type="submit"
                role="menuitem"
                className={`w-full text-left px-3 py-2 text-small ${isLight ? "text-white/95 hover:bg-white/20" : "text-ink-700 hover:bg-ink-100"} ${focusInset(isLight)}`}
              >
                {t("wallet_inputAddress")}
              </button>
            </form>
          ) : (
            <div className="px-3 py-2 space-y-2">
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
                className={`w-full rounded-[var(--radius-sm)] border px-2 py-1.5 text-small bg-white text-ink-900 placeholder:text-ink-500 focus:outline-none ${
                  isLight
                    ? "focus-visible:ring-2 focus-visible:ring-travel-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80 border-white/30"
                    : `focus-visible:border-travel-500 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console border-ink-200`
                }`}
                aria-label={t("wallet_inputAddress")}
              />
              {inputError && <p className="text-meta text-danger">{inputError}</p>}
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
                    className={`rounded-[var(--radius-sm)] px-2 py-1 text-small bg-travel-500 text-white hover:opacity-90 ${focusInset(isLight)}`}
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
                    className={`rounded-[var(--radius-sm)] px-2 py-1 text-small ${isLight ? "text-white/90" : "text-ink-600"} ${focusInset(isLight)}`}
                  >
                    {t("common_cancel")}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
