/** 简单校验：EVM/Polygon 地址 0x + 40 位十六进制 */
export function isValidWalletAddress(s: string): boolean {
  const t = s.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(t);
}

export const FILE_TOO_LARGE = "FILE_TOO_LARGE";

export function fileToBase64(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(FILE_TOO_LARGE));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result as string;
      resolve(s.startsWith("data:") ? s : `data:${file.type};base64,${s}`);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function passwordStrength(p: string): { labelKey: string; ok: boolean } {
  if (!p) return { labelKey: "", ok: false };
  if (p.length < 8) return { labelKey: "auth_register_password_min", ok: false };
  const hasLetter = /[a-zA-Z]/.test(p);
  const hasNumber = /\d/.test(p);
  if (hasLetter && hasNumber) return { labelKey: "auth_register_password_strength_medium", ok: true };
  return { labelKey: "auth_register_password_hint", ok: p.length >= 8 };
}
