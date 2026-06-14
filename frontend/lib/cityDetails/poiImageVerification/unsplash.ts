/** 统一 Unsplash 预览尺寸（候选清单与线上一致参数） */
export function unsplashPhotoUrl(photoId: string, width = 800): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&q=80`;
}

export const UNSPLASH_LICENSE = "Unsplash License (https://unsplash.com/license)";
