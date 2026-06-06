"use client";

import { useCallback, useState } from "react";

export function useDisputeDetailPageCopyTx() {
  const [txHashCopied, setTxHashCopied] = useState(false);
  const [copyTxBusy, setCopyTxBusy] = useState(false);

  const copyTxHash = useCallback(async (hash: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    setCopyTxBusy(true);
    try {
      await navigator.clipboard.writeText(hash);
      setTxHashCopied(true);
      setTimeout(() => setTxHashCopied(false), 2000);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("DisputeDetailPage copyTxHash:", err);
      }
    } finally {
      setCopyTxBusy(false);
    }
  }, []);

  return { txHashCopied, copyTxBusy, copyTxHash };
}
