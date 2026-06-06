import { fetchMarketPageInitialSnapshot } from "@/lib/market/marketPageInitialData.server";
import MarketPageClient from "./MarketPageClient";

/** `/market` 主入口：SSR 并行预取 discover + guides，客户端 hydration 后 idle 再校验 */
export default async function MarketPage() {
  const initialSnapshot = await fetchMarketPageInitialSnapshot();
  return <MarketPageClient initialSnapshot={initialSnapshot} />;
}
