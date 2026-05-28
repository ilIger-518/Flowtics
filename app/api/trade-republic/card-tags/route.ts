import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resolveTradeRepublicDir } from "@/lib/paths";

export const runtime = "nodejs";

type CardTag = {
  key: string;
  merchant: string;
  category: string;
  updatedAt: string;
};

const tradeRepublicDir = resolveTradeRepublicDir();
const tagsPath = path.join(tradeRepublicDir, "card-tags.json");

async function readTags(): Promise<Record<string, CardTag>> {
  try {
    const raw = await fs.readFile(tagsPath, "utf-8");
    return JSON.parse(raw) as Record<string, CardTag>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw err;
  }
}

async function writeTags(tags: Record<string, CardTag>) {
  await fs.mkdir(tradeRepublicDir, { recursive: true });
  await fs.writeFile(tagsPath, JSON.stringify(tags, null, 2));
}

export async function GET() {
  const tags = await readTags();
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    key?: string;
    merchant?: string;
    category?: string;
  };

  if (!payload.key || !payload.merchant || !payload.category) {
    return NextResponse.json({ error: "Missing key, merchant, or category." }, { status: 400 });
  }

  const tags = await readTags();
  const updatedAt = new Date().toISOString();
  tags[payload.key] = {
    key: payload.key,
    merchant: payload.merchant,
    category: payload.category,
    updatedAt,
  };
  await writeTags(tags);
  return NextResponse.json({ ok: true, tag: tags[payload.key] });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key." }, { status: 400 });
  }

  const tags = await readTags();
  delete tags[key];
  await writeTags(tags);
  return NextResponse.json({ ok: true });
}
