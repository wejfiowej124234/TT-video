"use client";

import { TravelTrustHomeLandingNavSlot } from "./TravelTrustHomeLandingNavSlot";

/**
 * M01–M03 chrome 壳（Header 仍在 layout；本包装只挂 L1 LIVE/目录/Pulse）。
 * `data-tt-locked-home-chrome` = 本轮发布策略（不改 M01–M03），不是永久架构名。
 * 以后改 Header：RELEASE_SCOPE=M01_HEADER，其余模块 0-drift。
 */
export function TravelTrustLockedHomeChrome() {
  return (
    <div
      className="contents"
      data-tt-locked-home-chrome="1"
      data-tt-home-release-policy="M01-M03-locked-this-wave"
    >
      <TravelTrustHomeLandingNavSlot />
    </div>
  );
}
