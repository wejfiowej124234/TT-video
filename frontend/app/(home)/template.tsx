import { MarketingRouteFadeTemplate } from "@/components/navigation/MarketingRouteFadeTemplate";

export default function HomeTemplate({ children }: { children: React.ReactNode }) {
  return <MarketingRouteFadeTemplate>{children}</MarketingRouteFadeTemplate>;
}
