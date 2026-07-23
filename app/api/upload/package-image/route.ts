import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { getAuthFromCookies } from "@/lib/auth-api";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const form = await req.formData();
    const fileEntries = form
      .getAll("files")
      .concat(form.getAll("file"))
      .filter((f): f is File => f instanceof File);

    if (fileEntries.length === 0) {
      return NextResponse.json({ message: "Missing file(s)" }, { status: 400 });
    }

    const dir = join(process.cwd(), "upload");
    await mkdir(dir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of fileEntries) {
      const ext = ALLOWED.get(file.type);
      if (!ext) {
        return NextResponse.json(
          { message: "Only JPEG, PNG, WebP, and GIF images are allowed" },
          { status: 400 }
        );
      }

      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { message: "Each image must be 5 MB or smaller" },
          { status: 400 }
        );
      }

      const buf = Buffer.from(await file.arrayBuffer());
      const name = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
      const fullPath = join(dir, name);
      await writeFile(fullPath, buf);
      uploadedUrls.push(`/upload/${name}`);
    }

    return NextResponse.json({
      url: uploadedUrls[0],
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("POST upload/package-image:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
