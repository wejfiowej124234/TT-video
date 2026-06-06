/**
 * 向导注册 **`guide_license_url`** 的 **http(s)** scheme 预检（与 **`crates/api/src/chain_off/guides/helpers.rs`**
 * **`guide_license_url_has_http_scheme`** 同源）：**ASCII 前缀大小写不敏感**。
 */
export const GUIDE_LICENSE_URL_MAX_LEN = 2048;

export function guideLicenseUrlHasHttpScheme(u: string): boolean {
  const t = u.trim();
  if (t.length === 0) return false;
  const isHttp = t.length >= 7 && t.slice(0, 7).toLowerCase() === "http://";
  const isHttps = t.length >= 8 && t.slice(0, 8).toLowerCase() === "https://";
  return isHttp || isHttps;
}
