import { NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { resolveTradeRepublicDir } from "@/lib/paths";

export const runtime = "nodejs";

const tradeRepublicDir = resolveTradeRepublicDir();

function toSafeName(name: string) {
  return path.basename(name);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const decoded = decodeURIComponent(file);
  const safeName = toSafeName(decoded);
  if (!safeName || safeName !== decoded) {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  const filePath = path.join(tradeRepublicDir, safeName);

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const stream = createReadStream(filePath);
  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}"`,
    },
  });
}
