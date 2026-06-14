"use client";

import type { ReactNode } from "react";
import {
  ADMIN_TABLE_BASE_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
} from "@/lib/adminUi";

type Props = {
  dataAttr: string;
  children: ReactNode;
  className?: string;
};

export function OfficialOpsDataTable({ dataAttr, children, className = "" }: Props) {
  return (
    <div className={`${ADMIN_TABLE_SECTION_CLASS} ${className}`.trim()} data-tt-admin-official-ops-table={dataAttr}>
      <table className={ADMIN_TABLE_BASE_CLASS}>
        {children}
      </table>
    </div>
  );
}

export function OfficialOpsTableHead({ children }: { children: ReactNode }) {
  return <thead className={ADMIN_TABLE_THEAD_CLASS}>{children}</thead>;
}

export function OfficialOpsTableTh({ children }: { children: ReactNode }) {
  return <th scope="col" className={ADMIN_TABLE_TH_CELL_CLASS}>{children}</th>;
}

export function OfficialOpsTableBody({ children }: { children: ReactNode }) {
  return <tbody className={ADMIN_TABLE_ROW_CLASS}>{children}</tbody>;
}
