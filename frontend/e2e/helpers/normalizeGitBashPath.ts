import { resolve } from "node:path";

/**
 * Git Bash 常把盘符写成 **`/d/foo`**（即 **`D:\\foo`**）。在 Windows 上若直接 **`path.resolve(\"/d/foo\")`**，
 * 会得到 **`D:\\d\\foo`**（把 **`d`** 当成 `D:` 下的目录名），与 MSYS 语义不一致。
 *
 * 将 **`/x/...`** 规范为 **`X:/...`** 后再交给 **`path.resolve`**，与仓库根 **`D:\\TravelTrust\\...`** 对齐。
 */
export function normalizeGitBashUnixStyleDrivePath(input: string): string {
  const t = input.trim().replace(/\\/g, "/");
  const m = /^\/([a-zA-Z])\/(.*)$/.exec(t);
  if (m) return `${m[1].toUpperCase()}:/${m[2]}`;
  return input.trim();
}

export function resolvePathFromGitBashEnv(input: string): string {
  return resolve(normalizeGitBashUnixStyleDrivePath(input));
}
