import { fetchDidRankPageInitialSnapshot } from "@/lib/did-rank/didRankPageInitialData.server";
import { serverForwardAuthHeaders } from "@/lib/serverForwardAuthHeaders";
import DidRankPageClient from "./DidRankPageClient";

type DidRankPageProps = {
  searchParams?: Promise<{ period?: string; guide_sort?: string }>;
};

/** `/did-rank` 主入口：SSR 并行预取 travelers + guides + prize-pool，客户端 hydration 后 idle 再校验 */
export default async function DidRankPage({ searchParams }: DidRankPageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const forwardAuthHeaders = await serverForwardAuthHeaders();
  const initialSnapshot = await fetchDidRankPageInitialSnapshot({
    period: sp?.period ?? null,
    guideSort: sp?.guide_sort ?? null,
    forwardAuthHeaders,
  });
  return <DidRankPageClient initialSnapshot={initialSnapshot} />;
}
