"use client";

/** 个人中心赛博风背景，与社区/DID 排行榜共用 Token（globals.css .bg-scifi-gradient / .bg-scifi-grid） */
export default function MePageBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-scifi-gradient animate-did-gradient" />
      <div className="absolute inset-0 opacity-[0.03] bg-scifi-grid" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-did-bg" />
    </div>
  );
}
