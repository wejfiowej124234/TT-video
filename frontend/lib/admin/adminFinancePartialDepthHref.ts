/** FIN-02 · ① partial 深度页 query（枢纽与子页 SSOT）。 */
export function adminFinancePartialDepthHref(
  baseHref: string,
  moduleId: string,
): string {
  const base = baseHref.split("?")[0] ?? baseHref;
  const params = new URLSearchParams({
    fin_suite_depth: "partial",
    fin_suite_module: moduleId,
  });
  return `${base}?${params.toString()}`;
}
