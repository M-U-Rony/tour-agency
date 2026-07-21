export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof value === "object") return value as T;
  return fallback;
}

export function normalizeRow<T extends Record<string, any>>(row: T): T & { _id: number | string } {
  const norm: any = { ...row };
  norm._id = row.id;
  return norm;
}
