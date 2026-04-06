"use client";

/** Hero 内旅游感氛围：日出金 / 珊瑚 / 深玉绿柔光 blob，CSS 慢漂（见 globals .traveltrust-hero-aurora-*） */
export default function TravelTrustHeroBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
      aria-hidden
    >
      <div className="traveltrust-hero-aurora-a absolute -left-[18%] -top-[32%] h-[88%] w-[62%] rounded-full bg-[rgba(249,215,121,0.32)] blur-[100px]" />
      <div className="traveltrust-hero-aurora-b absolute -right-[12%] top-[5%] h-[58%] w-[52%] rounded-full bg-[rgba(252,164,124,0.26)] blur-[88px]" />
      <div className="traveltrust-hero-aurora-c absolute left-[15%] -bottom-[25%] h-[55%] w-[72%] rounded-full bg-[rgba(12,110,105,0.34)] blur-[110px]" />
      <div className="traveltrust-hero-aurora-d absolute left-[35%] top-[20%] h-[40%] w-[38%] rounded-full bg-[rgba(251,191,36,0.1)] blur-[80px]" />
    </div>
  );
}
