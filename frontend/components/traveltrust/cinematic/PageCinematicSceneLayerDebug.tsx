"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  applyPageCinematicLayerVisibility,
  installPageCinematicSceneDebugApi,
  readTraveltrustSceneDebugStep,
  shouldMountTraveltrustSceneLayerDebug,
  TT_SCENE_DEBUG_HIDE_ORDER,
  TT_SCENE_DEBUG_LAYER_LABELS,
} from "@/lib/traveltrustPageCinematicSceneDebug";

/** R3F 内：按 step 累积隐藏层 + 挂载 `window.__ttSceneLayerDebug` */
export function PageCinematicSceneLayerDebug() {
  const { scene } = useThree();
  const installed = useRef(false);
  const lastStep = useRef(-1);

  useEffect(() => {
    if (!shouldMountTraveltrustSceneLayerDebug()) return;
    installPageCinematicSceneDebugApi(scene);
    installed.current = true;
    const step = readTraveltrustSceneDebugStep();
    applyPageCinematicLayerVisibility(scene, step);
    lastStep.current = step;
    console.info(
      "[TT scene debug] 已启用。Console: __ttSceneLayerDebug.setStep(0..5) · 0=基线 1=藏 warmSkyShell … 5=藏至 ocean",
    );
  }, [scene]);

  useFrame(() => {
    if (!shouldMountTraveltrustSceneLayerDebug()) return;
    const step = readTraveltrustSceneDebugStep();
    if (step === lastStep.current) return;
    lastStep.current = step;
    applyPageCinematicLayerVisibility(scene, step);
  });

  return null;
}

/** 固定于视口的调试条（仅 ?tt_scene_debug=1） */
export function PageCinematicSceneDebugHud() {
  if (!shouldMountTraveltrustSceneLayerDebug()) return null;
  const step = readTraveltrustSceneDebugStep();
  const hidden = TT_SCENE_DEBUG_HIDE_ORDER.slice(0, step);
  const next = TT_SCENE_DEBUG_HIDE_ORDER[step];

  return (
    <div
      className="pointer-events-none fixed bottom-24 left-4 z-[300] max-w-md rounded-lg border border-cyan-400/35 bg-black/85 px-3 py-2 font-mono text-[11px] leading-relaxed text-cyan-100/90 shadow-lg"
      data-tt-traveltrust-scene-debug-hud="1"
    >
      <div className="font-semibold text-cyan-300">TT scene layer debug</div>
      <div>step={step} · hidden: {hidden.length ? hidden.join(" → ") : "(none)"}</div>
      {next ? (
        <div>
          下一键隐藏: <span className="text-amber-200">{next}</span> —{" "}
          {TT_SCENE_DEBUG_LAYER_LABELS[next]}
        </div>
      ) : (
        <div className="text-amber-200">已全部剥离 · 对比 step=0 基线</div>
      )}
      <div className="mt-1 text-slate-400">
        Console: <code className="text-cyan-200">__ttSceneLayerDebug.setStep(n)</code> ·{" "}
        <code className="text-cyan-200">__ttSceneLayerDebug.dump()</code>
      </div>
    </div>
  );
}
