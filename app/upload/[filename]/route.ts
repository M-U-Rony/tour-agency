import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Safety check: only allow safe characters (alphanumeric, dot, hyphen) to prevent path traversal
    if (!/^[a-zA-Z0-9.-]+$/.test(filename)) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = join(process.cwd(), "upload", filename);
    if (!existsSync(filePath)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const ext = extname(filename).toLowerCase();
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";

    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET upload/[filename]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
