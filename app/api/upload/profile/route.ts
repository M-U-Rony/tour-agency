import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { getAuthFromCookies } from "@/lib/auth-api";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const IMAGE_ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);
const PAGE_ALLOWED = new Map<string, string>([
  ["application/pdf", ".pdf"],
]);

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "Missing file" }, { status: 400 });
    }

    const mime = file.type;
    const isImage = IMAGE_ALLOWED.has(mime);
    const isPage = PAGE_ALLOWED.has(mime);
    if (!isImage && !isPage) {
      return NextResponse.json({ message: "Unsupported file type" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: "File too large" }, { status: 400 });
    }

    const ext = (isImage ? IMAGE_ALLOWED.get(mime) : PAGE_ALLOWED.get(mime)) || "";
    const buf = Buffer.from(await file.arrayBuffer());
    const name = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;

    const dir = join(process.cwd(), "public", "uploads", "profiles");
    await mkdir(dir, { recursive: true });
    const fullPath = join(dir, name);
    await writeFile(fullPath, buf);

    return NextResponse.json({ url: `/uploads/profiles/${name}` });
  } catch (err) {
    console.error("POST upload/profile:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
