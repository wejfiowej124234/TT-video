"use client";

/**
 * Wallet brand marks for TravelTrust L5 Connection Center.
 * Prefer EIP-6963 `connector.icon` when present; else brand SVG marks.
 * Identification UI only — not a trademark license claim.
 */

import type { ReactElement, ReactNode } from "react";

const BOX = "h-6 w-6 shrink-0 rounded-md";

type Props = {
  brandKey: string;
  /** EIP-6963 / connector-provided icon (data URI or https) */
  iconUrl?: string | null;
  label: string;
};

function MarkShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={`${BOX} inline-flex items-center justify-center overflow-hidden ${className ?? ""}`}>
      {children}
    </span>
  );
}

function SvgMetaMask() {
  return (
    <MarkShell className="bg-[#f6851b]">
      <svg viewBox="0 0 40 40" className="h-full w-full p-0.5" fill="none">
        <path d="M32.2 6.2 21.4 14.3l2 4.7 9.7-5.4-.9-7.4Z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.4" />
        <path d="M7.8 6.2 18.5 14.4l-1.9 4.6-9.7-5.4.9-7.4Z" fill="#E4761B" />
        <path d="M27.2 27.4 24.6 32.1l7.1 2 .2-8.5-4.7 1.8Z" fill="#E4761B" />
        <path d="M8.1 25.6l.2 8.5 7.1-2-2.6-4.7-4.7 1.8Z" fill="#E4761B" />
        <path d="M15.1 18.1 13.5 21l6.3.3-.2-6.8-4.5 3.6Z" fill="#E4761B" />
        <path d="M24.9 18.1 20.3 14.4l-.1 6.9 6.3-.3-1.6-2.9Z" fill="#E4761B" />
        <path d="M15.2 27.4 17.6 32.8l-3.7-1.7-2-6.9 3.3 3.2Z" fill="#D7C1B3" />
        <path d="M24.8 27.4l3.3-6.4-1.9 6.9-3.7 1.7 2.3-5.4Z" fill="#D7C1B3" />
        <path d="M27.3 19.9 21 20.2l.5 3.4 1.9 5.4-.5-8.1Z" fill="#233447" />
        <path d="M12.7 19.9l5.2 8.8 1.9-5.4.4-3.4-7.5-.1Z" fill="#233447" />
      </svg>
    </MarkShell>
  );
}

function SvgRabby() {
  return (
    <MarkShell className="bg-[#8697ff]">
      <svg viewBox="0 0 32 32" className="h-full w-full p-1" fill="none">
        <circle cx="16" cy="16" r="12" fill="#fff" fillOpacity="0.95" />
        <ellipse cx="11.5" cy="15" rx="2.2" ry="2.6" fill="#1a1b4b" />
        <ellipse cx="20.5" cy="15" rx="2.2" ry="2.6" fill="#1a1b4b" />
        <path d="M12 21c1.2 1.4 6.8 1.4 8 0" stroke="#1a1b4b" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M8 11c2-3 5-4 8-4s6 1 8 4" stroke="#ff6b6b" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </MarkShell>
  );
}

function SvgOkx() {
  return (
    <MarkShell className="bg-black ring-1 ring-white/25">
      <svg viewBox="0 0 32 32" className="h-full w-full p-1.5" fill="#fff">
        <rect x="4" y="4" width="8" height="8" rx="1.2" />
        <rect x="20" y="4" width="8" height="8" rx="1.2" />
        <rect x="12" y="12" width="8" height="8" rx="1.2" />
        <rect x="4" y="20" width="8" height="8" rx="1.2" />
        <rect x="20" y="20" width="8" height="8" rx="1.2" />
      </svg>
    </MarkShell>
  );
}

function SvgBitget() {
  return (
    <MarkShell className="bg-[#00f0ff]">
      <svg viewBox="0 0 32 32" className="h-full w-full p-1" fill="none">
        <path
          d="M8 22V10c0-1.1.9-2 2-2h6.2c3.4 0 5.8 2.2 5.8 5.2 0 2.2-1.2 3.8-3.1 4.5L24 22h-3.4l-4.6-5.6H12.5V22H8Zm4.5-8.8h3.4c1.5 0 2.4-.8 2.4-2s-.9-2-2.4-2h-3.4v4Z"
          fill="#0a1628"
        />
      </svg>
    </MarkShell>
  );
}

function SvgCoinbase() {
  return (
    <MarkShell className="bg-[#0052ff]">
      <svg viewBox="0 0 32 32" className="h-full w-full p-1" fill="none">
        <circle cx="16" cy="16" r="12" fill="#0052ff" />
        <circle cx="16" cy="16" r="7.5" fill="#fff" />
        <rect x="12" y="14.5" width="8" height="3" rx="1.2" fill="#0052ff" />
      </svg>
    </MarkShell>
  );
}

function SvgTrust() {
  return (
    <MarkShell className="bg-[#3375bb]">
      <svg viewBox="0 0 32 32" className="h-full w-full p-1" fill="none">
        <path
          d="M16 5.5c4.8 2.2 7.8 3.2 9.5 3.6v7.4c0 5.4-3.6 9.4-9.5 11.5C10.1 25.9 6.5 21.9 6.5 16.5V9.1C8.2 8.7 11.2 7.7 16 5.5Z"
          fill="#fff"
        />
        <path d="M13.2 16.1 15 17.9l3.8-4.2" stroke="#3375bb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </MarkShell>
  );
}

function SvgWalletConnect() {
  return (
    <MarkShell className="bg-[#3b99fc]">
      <svg viewBox="0 0 32 32" className="h-full w-full p-1.5" fill="none">
        <path
          d="M9.2 12.4c3.7-3.6 9.7-3.6 13.4 0l.5.4a.6.6 0 0 1 0 .9l-1.5 1.5a.3.3 0 0 1-.5 0l-.6-.6c-2.6-2.5-6.8-2.5-9.4 0l-.7.6a.3.3 0 0 1-.4 0L8.5 13.7a.6.6 0 0 1 0-.9l.7-.4Zm16.6 3.1 1.4 1.3a.6.6 0 0 1 0 .9l-6.2 6a1.2 1.2 0 0 1-1.7 0l-4.4-4.2a.2.2 0 0 0-.2 0l-4.4 4.2a1.2 1.2 0 0 1-1.7 0l-6.2-6a.6.6 0 0 1 0-.9l1.4-1.3a.6.6 0 0 1 .8 0l4.4 4.2c.1 0 .2 0 .3 0l4.4-4.2a1.2 1.2 0 0 1 1.7 0l4.4 4.2c.1 0 .2 0 .3 0l4.4-4.2a.6.6 0 0 1 .9 0Z"
          fill="#fff"
        />
      </svg>
    </MarkShell>
  );
}

function SvgSafe() {
  return (
    <MarkShell className="bg-[#12ff80]">
      <svg viewBox="0 0 32 32" className="h-full w-full p-1" fill="none">
        <circle cx="16" cy="16" r="11" fill="#0b0b0b" />
        <path d="M16 9.5v13M11 14.5h10" stroke="#12ff80" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </MarkShell>
  );
}

function LetterFallback({ label }: { label: string }) {
  const ch = (label.trim().charAt(0) || "W").toUpperCase();
  return (
    <MarkShell className="border border-ref-sun/28 bg-ref-sun/10 text-[11px] font-semibold text-[#fde9a8]">
      {ch}
    </MarkShell>
  );
}

const BRAND_SVG: Record<string, () => ReactElement> = {
  metamask: SvgMetaMask,
  rabby: SvgRabby,
  okx: SvgOkx,
  bitget: SvgBitget,
  coinbase: SvgCoinbase,
  trust: SvgTrust,
  walletconnect: SvgWalletConnect,
  safe: SvgSafe,
};

export function WalletBrandIcon({ brandKey, iconUrl, label }: Props) {
  if (iconUrl && (iconUrl.startsWith("data:") || iconUrl.startsWith("https://") || iconUrl.startsWith("/"))) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- wallet-provided icon URLs / data URIs
      <img src={iconUrl} alt="" width={24} height={24} className={`${BOX} object-cover`} data-tt-wallet-brand-icon="eip6963" />
    );
  }
  const Comp = BRAND_SVG[brandKey];
  if (Comp) {
    return (
      <span data-tt-wallet-brand-icon={brandKey}>
        <Comp />
      </span>
    );
  }
  return <LetterFallback label={label} />;
}

export const TT_WALLET_BRAND_ICON_KEYS = Object.keys(BRAND_SVG);
