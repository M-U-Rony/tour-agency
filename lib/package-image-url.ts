/** Accepts https URLs or paths returned by /api/upload/package-image */
export function isValidPackageImageRef(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if ((s.startsWith("/upload/") || s.startsWith("/uploads/packages/")) && !s.includes("..")) return true;
  if (s.startsWith("https://") || s.startsWith("http://")) {
    try {
      return Boolean(new URL(s).hostname);
    } catch {
      return false;
    }
  }
  return false;
}
