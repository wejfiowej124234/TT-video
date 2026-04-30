/** 财务页依赖较多 admin 组件与数据拉取；部分 Windows/Next 15 组合在 SSG 预渲染时出现 webpack-runtime chunk 加载失败。强制动态渲染与 Admin 域「noindex」一致。 */
export const dynamic = "force-dynamic";

export default function AdminFinanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
