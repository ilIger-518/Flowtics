import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const uploadsDir = path.join(process.cwd(), "uploads");
const receiptsDir = path.join(uploadsDir, "receipts");
const structuredDir = path.join(receiptsDir, "structured");

function formatTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${yyyy}-${mm}-${dd}:${hh}-${min}-${ss}-${ms}`;
}

function makeSafeFileName(date: Date, uuid: string, originalName: string): string {
  const rawExt = path.extname(originalName || "").toLowerCase();
  const safeExt = rawExt.replace(/[^a-z0-9.]/gi, "");
  const ext = safeExt ? (safeExt.startsWith(".") ? safeExt : `.${safeExt}`) : ".bin";
  return `${formatTimestamp(date)}_${uuid}${ext}`;
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
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
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

type StructuredReceipt = {
  merchant?: string;
  address?: string;
  date?: string;
  time?: string;
  currency?: string;
  total?: number;
  items?: Array<{ name?: string; price?: number; quantity?: number }>;
};

const receiptSchema = {
  type: "object",
  properties: {
    merchant: { type: "string" },
    address: { type: "string" },
    date: { type: "string" },
    time: { type: "string" },
    currency: { type: "string" },
    total: { type: "number" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "number" },
          quantity: { type: "number" },
        },
      },
    },
  },
};

async function parseReceiptWithOllama(ocrText: string): Promise<StructuredReceipt> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5:1.5b";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Extract receipt data as JSON only. Include: merchant name, address, date, time, currency, total, and items (name, price, quantity). Use null when unknown. Only include items that have a price. Do not include headers, addresses, or totals as items.",
        },
        { role: "user", content: ocrText },
      ],
      format: receiptSchema,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const content = data.message?.content ?? "{}";

  try {
    return JSON.parse(content) as StructuredReceipt;
  } catch {
    return {
      merchant: undefined,
      address: undefined,
      date: undefined,
      time: undefined,
      currency: undefined,
      total: undefined,
      items: [],
    };
  }
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
  await fs.mkdir(structuredDir, { recursive: true });

  const saved = [] as Array<{
    originalName: string;
    fileName: string;
    size: number;
    type: string;
    path: string;
    receiptPath: string;
    structuredPath: string;
  }>;

  for (const file of files) {
    const now = new Date();
    const uuid = crypto.randomUUID();
    const fileName = makeSafeFileName(now, uuid, file.name || "upload");
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const receiptText = await readReceiptText(buffer);
    const receiptFileName = `ocr_${formatTimestamp(now)}_${uuid}.json`;
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

    const structuredFileName = `structured_${formatTimestamp(now)}_${uuid}.json`;
    const structured = receiptText
      ? await parseReceiptWithOllama(receiptText)
      : {
          merchant: undefined,
          address: undefined,
          items: [],
          total: undefined,
          currency: undefined,
          date: undefined,
          time: undefined,
        };
    const structuredFilePath = path.join(structuredDir, structuredFileName);
    await fs.writeFile(structuredFilePath, JSON.stringify(structured, null, 2));
    saved.push({
      originalName: file.name,
      fileName,
      size: file.size,
      type: file.type,
      path: `/uploads/${fileName}`,
      receiptPath: `/uploads/receipts/${receiptFileName}`,
      structuredPath: `/uploads/receipts/structured/${structuredFileName}`,
    });
  }

  return NextResponse.json({ files: saved });
}
