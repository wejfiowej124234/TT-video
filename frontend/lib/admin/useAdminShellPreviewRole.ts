"use client";



import { useEffect, useState } from "react";

import type { ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";

import {

  ADMIN_SHELL_PREVIEW_CHANGE_EVENT,

  readAdminShellPreviewRole,

} from "@/lib/admin/adminShellPreviewRole";



export function useAdminShellPreviewRole(): ConsoleRole70 | null {

  const [role, setRole] = useState<ConsoleRole70 | null>(null);



  useEffect(() => {

    setRole(readAdminShellPreviewRole());

    const onChange = () => setRole(readAdminShellPreviewRole());

    window.addEventListener(ADMIN_SHELL_PREVIEW_CHANGE_EVENT, onChange);

    return () => window.removeEventListener(ADMIN_SHELL_PREVIEW_CHANGE_EVENT, onChange);

  }, []);



  return role;

}


