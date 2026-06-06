"use client";

import type { ReactNode } from "react";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

export function TravelTrustCinematicShell({ children }: { children: ReactNode }) {
  return (
    <div
      data-tt-traveltrust-cinematic-shell="1"
      style={
        UNIFIED_PAGE_3D
          ? ({
              ["--tt-hero-globe-optical-x" as string]: "28%",
              ["--tt-hero-globe-optical-y" as string]: "52%",
            } as const)
          : undefined
      }
    >
      {children}
      <div
        className={`pointer-events-none fixed inset-0 z-[24] mix-blend-soft-light motion-reduce:hidden ${
          UNIFIED_PAGE_3D ? "opacity-[0.012]" : "opacity-[0.03]"
        } [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]`}
        aria-hidden
        data-tt-traveltrust-cinematic-grain="1"
        style={{ backgroundImage: GRAIN_SVG, backgroundRepeat: "repeat" }}
      />
      <div
        className={`pointer-events-none fixed inset-0 z-[24] motion-reduce:opacity-0 ${UNIFIED_PAGE_3D ? "opacity-26" : "opacity-45"}`}
        aria-hidden
        style={{
          background: UNIFIED_PAGE_3D
            ? "radial-gradient(ellipse 92% 82% at var(--tt-hero-globe-optical-x, 28%) var(--tt-hero-globe-optical-y, 52%), transparent 58%, rgba(8,14,18,0.12) 100%), linear-gradient(90deg, transparent 0%, transparent 52%, rgba(8,14,18,0.1) 78%, rgba(3,7,18,0.28) 100%), linear-gradient(to bottom, transparent 0%, transparent 78%, rgba(248,250,252,0.04) 92%, rgba(248,250,252,0.08) 100%)"
            : "radial-gradient(ellipse 85% 70% at 50% 42%, transparent 42%, rgba(8,6,5,0.55) 100%)",
        }}
      />
    </div>
  );
}
