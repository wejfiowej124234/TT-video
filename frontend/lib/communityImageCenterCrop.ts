/** 发帖前本机图片：居中裁切为正方形 JPEG（① PublishDrawer · P1-5 最小可用）。 */
export async function centerSquareCropImageFile(
  file: File,
  quality = 0.92,
  timeoutMs = 4000
): Promise<File> {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return file;
  }
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await Promise.race([
      createImageBitmap(file),
      new Promise<ImageBitmap>((_, reject) => {
        window.setTimeout(() => reject(new Error("crop_timeout")), timeoutMs);
      }),
    ]);
    const side = Math.min(bitmap.width, bitmap.height);
    if (side <= 0) return file;
    const sx = Math.floor((bitmap.width - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, side, side);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}-crop.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
