import { fetchCommunityFeedInitialSnapshot } from "@/lib/community/communityFeedInitialData.server";
import CommunityPageClient from "./CommunityPageClient";

/** `/community` 主入口：SSR 预取默认 latest Feed，客户端 hydration 后 idle 再校验 */
export default async function CommunityPage() {
  const initialSnapshot = await fetchCommunityFeedInitialSnapshot();
  return <CommunityPageClient initialSnapshot={initialSnapshot} />;
}
