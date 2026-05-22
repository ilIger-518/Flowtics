import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ReceiptEditor from "@/components/receipts/receipt-editor";
import { resolveReceiptsDir, resolveStructuredDir } from "@/lib/paths";

type StructuredReceipt = {
  merchant?: string;
  address?: string;
  date?: string;
  time?: string;
  currency?: string;
  total?: number;
  items?: Array<{ name?: string; price?: number; quantity?: number }>;
};

type OcrReceipt = {
  originalName?: string;
  fileName?: string;
  text?: string;
};

const receiptsDir = resolveReceiptsDir();
const structuredDir = resolveStructuredDir();

function toSafeName(name: string) {
  return path.basename(name);
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

export default async function ReceiptReviewPage({
  params,
}: {
  params: Promise<{ file: string }>;
}) {
  const { file } = await params;
  const decoded = decodeURIComponent(file);
  const safeName = toSafeName(decoded);

  if (!safeName || safeName !== decoded) {
    notFound();
  }

  const structuredPath = path.join(structuredDir, safeName);
  const structured = await readJson<StructuredReceipt>(structuredPath);

  if (!structured) {
    notFound();
  }

  const ocrFileName = safeName.startsWith("structured_")
    ? safeName.replace("structured_", "ocr_")
    : safeName;
  const ocrPath = path.join(receiptsDir, ocrFileName);
  const ocr = await readJson<OcrReceipt>(ocrPath);

  const imageUrl = ocr?.fileName ? `/uploads/${ocr.fileName}` : "";

  return (
    <ReceiptEditor
      fileName={safeName}
      imageUrl={imageUrl}
      ocrText={ocr?.text ?? ""}
      structured={structured}
    />
  );
}
