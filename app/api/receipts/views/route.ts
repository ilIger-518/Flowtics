import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { resolveUploadsDir } from "@/lib/paths";

export const runtime = "nodejs";

type Filters = {
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  category: string;
};

type SavedView = {
  id: string;
  name: string;
  scope: string;
  filters: Filters;
  createdAt: string;
  updatedAt: string;
};

const viewsDir = path.join(resolveUploadsDir(), "saved-views");
const viewsPath = path.join(viewsDir, "receipts.json");

async function readViews(): Promise<SavedView[]> {
  try {
    const raw = await fs.readFile(viewsPath, "utf-8");
    const data = JSON.parse(raw) as SavedView[];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function writeViews(views: SavedView[]) {
  await fs.mkdir(viewsDir, { recursive: true });
  await fs.writeFile(viewsPath, JSON.stringify(views, null, 2));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const views = await readViews();
  const filtered = scope ? views.filter((view) => view.scope === scope) : views;
  return NextResponse.json({ views: filtered });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    name?: string;
    scope?: string;
    filters?: Filters;
  };

  if (!payload.name || !payload.scope || !payload.filters) {
    return NextResponse.json({ error: "Missing name, scope, or filters." }, { status: 400 });
  }

  const views = await readViews();
  const now = new Date().toISOString();
  const view: SavedView = {
    id: crypto.randomUUID(),
    name: payload.name,
    scope: payload.scope,
    filters: payload.filters,
    createdAt: now,
    updatedAt: now,
  };

  const next = [view, ...views];
  await writeViews(next);
  return NextResponse.json({ view });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const views = await readViews();
  const next = views.filter((view) => view.id !== id);
  await writeViews(next);
  return NextResponse.json({ ok: true });
}
