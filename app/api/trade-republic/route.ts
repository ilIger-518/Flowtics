import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { resolveTradeRepublicDir } from "@/lib/paths";

export const runtime = "nodejs";

const tradeRepublicDir = resolveTradeRepublicDir();

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
  const ext = safeExt ? (safeExt.startsWith(".") ? safeExt : `.${safeExt}`) : ".csv";
  return `tr_${formatTimestamp(date)}_${uuid}${ext}`;
}

export async function GET() {
  try {
    const entries = await fs.readdir(tradeRepublicDir);
    const files = entries.filter((name) => name.endsWith(".csv")).sort();
    return NextResponse.json({ files });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ files: [] });
    }
    throw err;
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const entries = formData.getAll("files");
  const files = entries.filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  await fs.mkdir(tradeRepublicDir, { recursive: true });

  const saved = [] as Array<{
    originalName: string;
    fileName: string;
    size: number;
    type: string;
    path: string;
  }>;

  for (const file of files) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only .csv files are supported." },
        { status: 400 }
      );
    }

    const now = new Date();
    const uuid = crypto.randomUUID();
    const fileName = makeSafeFileName(now, uuid, file.name || "trade-republic.csv");
    const filePath = path.join(tradeRepublicDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    saved.push({
      originalName: file.name,
      fileName,
      size: file.size,
      type: file.type,
      path: `/uploads/trade-republic/${fileName}`,
    });
  }

  return NextResponse.json({ files: saved });
}
