/** 客户端压缩证件图，尽量压到 maxBytes 以下（① 本地；PDF 不处理） */
export async function compressGuideRegisterImageFile(file: File, maxBytes: number): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= maxBytes) {
    return file;
  }
  const bitmap = await createImageBitmap(file);
  try {
    const maxDim = 1600;
    let w = bitmap.width;
    let h = bitmap.height;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const mime = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
    const qualities = mime === "image/png" ? [undefined] : [0.82, 0.72, 0.62, 0.52];
    for (const q of qualities) {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), mime, q),
      );
      if (!blob) continue;
      if (blob.size <= maxBytes || q === qualities[qualities.length - 1]) {
        const ext = mime.split("/")[1] ?? "jpg";
        return new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: mime });
      }
    }
    return file;
  } finally {
    bitmap.close();
  }
}
