import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const uploadsDir = path.join(process.cwd(), "uploads");
const receiptsDir = path.join(uploadsDir, "receipts");

function makeSafeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const safeExt = ext.replace(/[^a-z0-9.]/gi, "");
  return `${crypto.randomUUID()}${safeExt}`;
}

async function readReceiptText(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_CLOUD_VISION_API_KEY");
  }

  const payload = {
    requests: [
      {
        image: { content: buffer.toString("base64") },
        features: [{ type: "TEXT_DETECTION" }],
      },
    ],
  };

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vision API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    responses?: Array<{ fullTextAnnotation?: { text?: string } }>;
  };

  return data.responses?.[0]?.fullTextAnnotation?.text?.trim() ?? "";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const entries = formData.getAll("files");
  const files = entries.filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(receiptsDir, { recursive: true });

  const saved = [] as Array<{
    originalName: string;
    fileName: string;
    size: number;
    type: string;
    path: string;
    receiptPath: string;
  }>;

  for (const file of files) {
    const fileName = makeSafeFileName(file.name || "upload");
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const receiptText = await readReceiptText(buffer);
    const receiptFileName = `${fileName}.json`;
    const receiptFilePath = path.join(receiptsDir, receiptFileName);
    await fs.writeFile(
      receiptFilePath,
      JSON.stringify(
        {
          originalName: file.name,
          fileName,
          size: file.size,
          type: file.type,
          text: receiptText,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
    saved.push({
      originalName: file.name,
      fileName,
      size: file.size,
      type: file.type,
      path: `/uploads/${fileName}`,
      receiptPath: `/uploads/receipts/${receiptFileName}`,
    });
  }

  return NextResponse.json({ files: saved });
}
