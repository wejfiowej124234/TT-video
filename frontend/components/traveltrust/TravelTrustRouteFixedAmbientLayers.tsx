/**
 * `/traveltrust` 布局专用：全屏 z-0 氛围 + 点阵（与 `app/traveltrust/layout.tsx` 历史视觉一致），pointer-events-none。
 * `subdued`：全页 WebGL 电影场景开启时减弱点阵与底缘暖色，避免与 R3F 抢视觉。
 */
export function TravelTrustRouteFixedAmbientLayers({ subdued = false }: { subdued?: boolean }) {
  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-0 ${subdued ? "bg-traveltrust-atmosphere-unified" : "bg-traveltrust-atmosphere"}`}
        aria-hidden
        data-tt-traveltrust-atmosphere={subdued ? "unified-3d" : "full"}
      />
      {subdued ? null : (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-traveltrust-dot-grid opacity-[0.22]"
          aria-hidden
        />
      )}
    </>
  );
}
