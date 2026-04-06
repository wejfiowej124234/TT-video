import type { Metadata } from "next";
import zh from "@/locales/zh";

function clipTopicLabel(raw: string): string {
  try {
    const d = decodeURIComponent(raw).replace(/[\r\n\u0000]/g, "").trim();
    if (!d) return "—";
    return d.length > 80 ? `${d.slice(0, 77)}…` : d;
  } catch {
    return "—";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const label = clipTopicLabel(tag);
  const title = `${label}${zh.community_topic_meta_title_suffix}`;
  const description = zh.community_topic_meta_description;
  const path = `/community/topic/${tag}`;
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        "zh-CN": path,
        en: path,
        "x-default": path,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function CommunityTopicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
