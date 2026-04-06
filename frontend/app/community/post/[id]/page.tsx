import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

/** B-055：可分享路径，与 `?post=` 深链等价（重定向到 Feed 并由 `useCommunityFeed` 打开详情或中性态） */
export default async function CommunityPostByIdPage({ params }: PageProps) {
  const { id } = await params;
  const trimmed = typeof id === "string" ? id.trim() : "";
  if (!trimmed.length) redirect("/community");
  redirect(`/community?post=${encodeURIComponent(trimmed)}`);
}
