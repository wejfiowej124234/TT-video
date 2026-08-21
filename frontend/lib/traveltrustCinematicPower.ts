/**
 * 全页 WebGL 省电：仅在叙事区（hero / 角色剧场）可见时跑帧（TT-PH1-090 · ①）
 */
export type TraveltrustCanvasPowerInput = {
  tabVisible: boolean;
  heroInView: boolean;
  rolesInView: boolean;
  /** 信任/说明区在视口内时延续轻量 WebGL（与平面环境光对齐 · ①） */
  trustInView?: boolean;
  scrollOpacity: number;
  heroT: number;
  pageT: number;
};

export type TraveltrustCanvasPowerState = {
  active: boolean;
  reason: "active" | "tab-hidden" | "offscreen" | "scroll-fade" | "past-narrative";
};

export function resolveTraveltrustCanvasPower(input: TraveltrustCanvasPowerInput): TraveltrustCanvasPowerState {
  const { tabVisible, heroInView, rolesInView, scrollOpacity, heroT, pageT } = input;
  const trustInView = input.trustInView === true;
  const trustBand = trustInView && pageT >= 0.32 && pageT < 0.86;

  if (!tabVisible) {
    return { active: false, reason: "tab-hidden" };
  }

  const narrativeInView = heroInView || rolesInView || trustBand;
  if (!narrativeInView) {
    return { active: false, reason: "offscreen" };
  }

  if (scrollOpacity <= 0.1) {
    return { active: false, reason: "scroll-fade" };
  }

  const heroBand = heroT < 0.92;
  const theaterBand = rolesInView && pageT < 0.96;
  const earlyPage = pageT < 0.88;

  if (heroT > 0.9 && !rolesInView && !trustBand && scrollOpacity > 0.2) {
    return { active: false, reason: "past-narrative" };
  }

  if (!(heroBand && earlyPage) && !theaterBand && !trustBand) {
    return { active: false, reason: "past-narrative" };
  }

  return { active: true, reason: "active" };
}
