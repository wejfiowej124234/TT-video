import zh from "@/locales/zh";

/** P-OBS2：信任增长控制台占位（与 admin 其它 loading 同构）。 */
export default function AdminTrustGrowthLoading() {
  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <div className="h-8 w-64 max-w-full animate-pulse rounded bg-ink-200" />
      <p className="mt-4 text-body text-ink-600">{zh.admin_trust_growth_loading}</p>
    </main>
  );
}
