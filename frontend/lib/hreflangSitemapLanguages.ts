/**
 * `app/sitemap.ts` 的 `alternates.languages`（xhtml:link hreflang）。
 * 本站无 `/en` 前缀：zh-CN / en / x-default 同绝对 URL，与各路由 `metadata.alternates.languages` 一致（13-1、04 中文默认）。
 */
export function hreflangSitemapLanguages(siteBase: URL, pathname: string): Record<string, string> {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const absolute = new URL(path, siteBase).toString();
  return {
    "zh-CN": absolute,
    en: absolute,
    "x-default": absolute,
  };
}
