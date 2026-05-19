import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const uploadsDir = path.join(process.cwd(), "uploads");

function makeSafeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const safeExt = ext.replace(/[^a-z0-9.]/gi, "");
  return `${crypto.randomUUID()}${safeExt}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const entries = formData.getAll("files");
  const files = entries.filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  await fs.mkdir(uploadsDir, { recursive: true });

  const saved = [] as Array<{
    originalName: string;
    fileName: string;
    size: number;
    type: string;
    path: string;
  }>;

  for (const file of files) {
    const fileName = makeSafeFileName(file.name || "upload");
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    saved.push({
      originalName: file.name,
      fileName,
      size: file.size,
      type: file.type,
      path: `/uploads/${fileName}`,
    });
  }

  return NextResponse.json({ files: saved });
}
