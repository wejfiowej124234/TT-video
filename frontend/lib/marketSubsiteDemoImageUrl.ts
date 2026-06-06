/** Unsplash 演示图 URL（子站 demo 列表/详情）。 */
export function marketSubsiteDemoImageUrl(id: string, w = 800): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}
