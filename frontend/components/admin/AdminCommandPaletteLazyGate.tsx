"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import {
  ADMIN_COMMAND_PALETTE_OPEN_EVENT,
  requestAdminCommandPaletteOpen,
} from "@/lib/admin/adminCommandPaletteBus";
import { scheduleAdminDeferredShellWork } from "@/lib/admin/adminDeferredShellWork";

const AdminCommandPalette = dynamic(
  () =>
    import("@/components/admin/AdminCommandPalette").then((mod) => ({
      default: mod.AdminCommandPalette,
    })),
  { ssr: false, loading: () => null },
);

/** 空闲后再挂载命令面板 chunk；⌘K / 顶栏按钮触发时立即挂载并打开。 */
export function AdminCommandPaletteLazyGate() {
  const [mounted, setMounted] = useState(false);
  const pendingOpenRef = useRef(false);

  useEffect(() => {
    const queueOpen = () => {
      pendingOpenRef.current = true;
      setMounted(true);
    };

    const onOpen = () => queueOpen();

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        queueOpen();
      }
    };

    window.addEventListener(ADMIN_COMMAND_PALETTE_OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    const cancelIdle = scheduleAdminDeferredShellWork(() => setMounted(true), { timeoutMs: 2800 });
    return () => {
      window.removeEventListener(ADMIN_COMMAND_PALETTE_OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
      cancelIdle();
    };
  }, []);

  useEffect(() => {
    if (!mounted || !pendingOpenRef.current) return;
    pendingOpenRef.current = false;
    window.requestAnimationFrame(() => requestAdminCommandPaletteOpen());
  }, [mounted]);

  if (!mounted) return null;
  return <AdminCommandPalette />;
}
