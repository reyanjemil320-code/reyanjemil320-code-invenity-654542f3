/**
 * Client-side image compression.
 * The old Supabase storage buckets are gone, so invention photos and avatars
 * are compressed to small data URLs and stored alongside the row in Turso.
 */

export interface CompressedImage {
  dataUrl: string;
}

export async function compressImage(
  file: File,
  opts: { maxSize?: number; maxDimension?: number; maxBytes?: number } = {},
): Promise<CompressedImage> {
  const { maxBytes = 160_000, maxDimension = 1000 } = opts;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`Could not read image "${file.name}"`);

  let width = bitmap.width;
  let height = bitmap.height;
  if (Math.max(width, height) > maxDimension) {
    const ratio = maxDimension / Math.max(width, height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Step quality down until it fits the byte budget
  for (const quality of [0.82, 0.7, 0.55, 0.4, 0.25]) {
    const dataUrl = canvas.toDataURL("image/webp", quality);
    if (dataUrl.length <= maxBytes) return { dataUrl };
  }

  // Last resort: smaller dimensions
  const half = document.createElement("canvas");
  half.width = Math.max(1, Math.round(width / 2));
  half.height = Math.max(1, Math.round(height / 2));
  half.getContext("2d")?.drawImage(canvas, 0, 0, half.width, half.height);
  const dataUrl = half.toDataURL("image/webp", 0.5);
  if (dataUrl.length > maxBytes + 80_000) {
    throw new Error(`"${file.name}" is too detailed — try a smaller photo`);
  }
  return { dataUrl };
}
