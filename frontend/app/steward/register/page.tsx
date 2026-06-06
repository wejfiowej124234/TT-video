import type { Metadata } from "next";
import StewardRegisterPageMain from "./StewardRegisterPageMain";

export const metadata: Metadata = {
  title: "区域主理人申请 · TravelTrust",
  description: "选择辖区、完成 TTG 质押申报与平台准入费流程",
};

export default function StewardRegisterPage() {
  return <StewardRegisterPageMain />;
}
