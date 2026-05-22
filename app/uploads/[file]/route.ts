import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resolveUploadsDir } from "@/lib/paths";

export const runtime = "nodejs";

const uploadsDir = resolveUploadsDir();

function toSafeName(name: string) {
  return path.basename(name);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const decoded = decodeURIComponent(file);
  const safeName = toSafeName(decoded);

  if (!safeName || safeName !== decoded) {
    return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
  }

  const filePath = path.join(uploadsDir, safeName);

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not a file." }, { status: 400 });
    }

    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if ((err as NodeJS.ErrnoException).code === "EISDIR") {
      return NextResponse.json({ error: "Not a file." }, { status: 400 });
    }
    throw err;
  }
}
