"use client";

import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { TT_WORKSPACE_L5, workspaceWorkbenchL5DataAttrs, type WorkspaceL5Kind } from "@/lib/workspace/workspaceWorkbenchL5";

export function WorkspaceL5PageSkeleton({
  t,
  kind,
  ariaLabelKey,
}: {
  t: (k: string) => string;
  kind: WorkspaceL5Kind;
  ariaLabelKey: string;
}) {
  return (
    <main
      className={TT_WORKSPACE_L5.pageShell}
      aria-label={t(ariaLabelKey)}
      {...workspaceWorkbenchL5DataAttrs(kind)}
    >
      <AuthL5PageBackdrop />
      <div className={TT_WORKSPACE_L5.pageColumn}>
        <header className={TT_WORKSPACE_L5.headerCard}>
          <div className="h-3 w-24 bg-ref-sun/15 rounded animate-pulse motion-reduce:animate-none" />
          <div className="min-h-[44px] h-10 w-48 mt-3 bg-ref-sun/10 rounded-lg animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-full max-w-md mt-2 bg-slate-700/40 rounded animate-pulse motion-reduce:animate-none" />
        </header>
        <section className={TT_WORKSPACE_L5.inboxSection}>
          <div className="h-5 w-32 mb-3 bg-ref-sun/10 rounded animate-pulse motion-reduce:animate-none" />
          <div className="flex flex-wrap gap-3">
            {[1, 2].map((i) => (
              <div key={i} className={`${TT_WORKSPACE_L5.statTile} animate-pulse motion-reduce:animate-none`}>
                <div className="h-8 w-10 mx-auto bg-ref-sun/15 rounded" />
                <div className="h-3 w-16 mx-auto mt-2 bg-slate-700/40 rounded" />
              </div>
            ))}
          </div>
        </section>
        <p className="sr-only" role="status" aria-live="polite">
          {t("me_loading")}
        </p>
      </div>
    </main>
  );
}
