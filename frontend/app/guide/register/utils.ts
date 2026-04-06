/** 钱包地址格式：0x + 40 位十六进制（EVM/Polygon） */
export function isValidWalletAddress(s: string): boolean {
  const t = s.trim();
  return !t || /^0x[a-fA-F0-9]{40}$/.test(t);
}

/** 等效 DID：did:ethr 适用于 EVM 链（含 Polygon） */
export function walletToDidEthr(address: string): string {
  const t = address.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(t)) return "";
  return `did:ethr:${t}`;
}

export function fileToBase64(file: File, maxBytes: number, sizeErrorMsg?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(sizeErrorMsg ?? `File must be under ${Math.round(maxBytes / 1024)}KB`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result as string;
      const base64 = s.includes(",") ? s.split(",")[1] ?? "" : s;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
