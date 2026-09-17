/**
 * Image optimization via weserv.nl (free image CDN from FMHY)
 *
 * Benefits:
 * - Compresses images on-the-fly (saves bandwidth)
 * - Converts to WebP/AVIF for smaller file sizes
 * - Caches at Cloudflare edge (faster loading)
 * - Resizes on-the-fly (no need for multiple sizes)
 *
 * Usage:
 *   optimizeImage("https://image.tmdb.org/t/p/w342/poster.jpg", { width: 200, format: "webp" })
 */

const WESERV_BASE = "https://images.weserv.nl/";

interface ImageOptions {
  width?: number;
  height?: number;
  format?: "webp" | "avif" | "jpg" | "png";
  quality?: number; // 1-100
  blur?: number; // 0-100
  sharpen?: number; // 0-10
  output?: "webp" | "avif" | "jpg" | "png";
}

/**
 * Wrap any image URL with weserv.nl optimization.
 * Returns the original URL if not an http(s) URL.
 */
export function optimizeImage(url: string, opts: ImageOptions = {}): string {
  if (!url || !url.startsWith("http")) return url;

  // Strip the protocol (weserv.nl uses // prefix)
  const cleanUrl = url.replace(/^https?:\/\//, "");

  const params = new URLSearchParams();
  params.set("url", cleanUrl);

  if (opts.width) params.set("w", String(opts.width));
  if (opts.height) params.set("h", String(opts.height));
  if (opts.format || opts.output) params.set("output", (opts.format || opts.output) as string);
  if (opts.quality) params.set("q", String(opts.quality));
  if (opts.blur) params.set("blur", String(opts.blur));
  if (opts.sharpen) params.set("sharp", String(opts.sharpen));

  // Default to WebP for smaller file size
  if (!opts.format && !opts.output) {
    params.set("output", "webp");
  }

  return `${WESERV_BASE}?${params.toString()}`;
}

/**
 * Generate responsive image srcset for different screen sizes.
 * Returns a comma-separated list of URLs + widths.
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [150, 300, 500, 780, 1000]
): string {
  return widths
    .map((w) => `${optimizeImage(baseUrl, { width: w, format: "webp", quality: 80 })} ${w}w`)
    .join(", ");
}
