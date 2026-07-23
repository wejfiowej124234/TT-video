"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "./LocaleProvider";
import { getMeta } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";

/** GET /meta 响应（05 §七点六 版本绑定；与 04 §三 一致） */
export type MetaSnapshot = Record<string, unknown>;

const MetaContext = createContext<{
  meta: MetaSnapshot | null;
  error: string | null;
  loading: boolean;
}>({ meta: null, error: null, loading: true });

export function useMeta() {
  return useContext(MetaContext);
}

/** 启动时调用 GET /meta（默认 compact），供版本绑定与 fail-closed 使用（05 §七点六、38 可观测）
 * 失败策略：仅设置 error 状态、不阻塞渲染；业务可通过 useMeta() 判断后决定是否提示或限制写操作。
 * PERF-001：compact + FE coalesce/TTL，避免首屏 stampede 全量 SSOT 语料。 */
export function MetaProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [meta, setMeta] = useState<MetaSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeta({ compact: true })
      .then((data) => {
        setMeta(data);
        setError(null);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("MetaProvider getMeta:", err);
        }
        setError(mapApiReadError(err, t, "meta_fetchFailed"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <MetaContext.Provider value={{ meta, error, loading }}>
      {children}
    </MetaContext.Provider>
  );
}
