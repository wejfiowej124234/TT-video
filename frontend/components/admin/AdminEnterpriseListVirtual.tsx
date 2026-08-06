"use client";

/**
 * V65 Batch3 Cut B · admin list virtualization honesty wrapper (R037 / R054).
 * Uses @tanstack/react-virtual when count ≥ threshold; otherwise plain map.
 */

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ADMIN_ENTERPRISE_HARDENING_MARKERS as M,
  ADMIN_ENTERPRISE_LIST_VIRTUAL_ESTIMATE_PX,
  ADMIN_ENTERPRISE_LIST_VIRTUAL_OVERSCAN,
  shouldVirtualizeAdminEnterpriseList,
} from "@/lib/admin/adminEnterpriseHardeningContract";

export type AdminEnterpriseVirtualRowRender<T> = (args: {
  item: T;
  index: number;
  style: CSSProperties;
}) => ReactNode;

/**
 * Vertical list virtualizer for admin workbench rows.
 * When not virtualizing, renders children via `renderRow` in document flow (no absolute).
 */
export function AdminEnterpriseListVirtualBody<T>({
  items,
  getKey,
  renderRow,
  estimateSize = ADMIN_ENTERPRISE_LIST_VIRTUAL_ESTIMATE_PX,
  className = "",
  role = "rowgroup",
}: {
  items: readonly T[];
  getKey: (item: T, index: number) => string;
  renderRow: AdminEnterpriseVirtualRowRender<T>;
  estimateSize?: number;
  className?: string;
  role?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const count = items.length;
  const virtual = shouldVirtualizeAdminEnterpriseList(count);

  const virtualizer = useVirtualizer({
    count: virtual ? count : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: ADMIN_ENTERPRISE_LIST_VIRTUAL_OVERSCAN,
  });

  if (!virtual) {
    return (
      <div
        {...{ [M.listVirtual]: "0" }}
        {...{ [M.listVirtualCount]: String(count) }}
        className={className}
        role={role}
      >
        {items.map((item, index) => (
          <div key={getKey(item, index)}>{renderRow({ item, index, style: {} })}</div>
        ))}
      </div>
    );
  }

  const totalSize = virtualizer.getTotalSize();
  return (
    <div
      ref={parentRef}
      {...{ [M.listVirtual]: "1" }}
      {...{ [M.listVirtualCount]: String(count) }}
      className={["relative max-h-[min(70vh,720px)] overflow-auto", className].filter(Boolean).join(" ")}
      role={role}
    >
      <div style={{ height: `${totalSize}px`, width: "100%", position: "relative" }}>
        {virtualizer.getVirtualItems().map((vRow) => {
          const item = items[vRow.index]!;
          return (
            <div
              key={getKey(item, vRow.index)}
              data-index={vRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vRow.start}px)`,
              }}
            >
              {renderRow({
                item,
                index: vRow.index,
                style: { minHeight: estimateSize },
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
