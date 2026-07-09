"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isGovernancePathVisibleInConvergence } from "@/lib/complexityConvergenceSurface";

/** 收敛期：非 proposals/params 治理子页重定向至 proposals 列表 */
export function GovernanceConvergencePathGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;
    if (isGovernancePathVisibleInConvergence(pathname)) return;
    router.replace("/governance/proposals");
  }, [pathname, router]);

  if (pathname && !isGovernancePathVisibleInConvergence(pathname)) {
    return null;
  }

  return <>{children}</>;
}
