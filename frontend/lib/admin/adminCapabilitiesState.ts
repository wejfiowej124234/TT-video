/** ①：capabilities 加载态判别（避免 API 失败误报「无权限」）。 */

export function adminCapabilitiesPermissionsLoaded(loading: boolean, error: boolean): boolean {
  return !loading && !error;
}

export function adminCapabilitiesUnavailable(loading: boolean, error: boolean): boolean {
  return !loading && error;
}
