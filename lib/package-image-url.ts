/** Accepts URLs, uploaded paths, or relative image paths */
export function isValidPackageImageRef(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  return true;
}
