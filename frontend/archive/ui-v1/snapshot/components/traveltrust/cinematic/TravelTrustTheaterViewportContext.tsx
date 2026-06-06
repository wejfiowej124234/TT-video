"use client";

import { createContext, useContext } from "react";

/** 角色剧场 #roles 在视口中的锚点（供全页 3D 环对齐） */
export type TheaterViewportAnchor = {
  centerY: number;
  height: number;
};

export const TravelTrustTheaterViewportContext = createContext<TheaterViewportAnchor | null>(null);

export function useTravelTrustTheaterViewport(): TheaterViewportAnchor | null {
  return useContext(TravelTrustTheaterViewportContext);
}
