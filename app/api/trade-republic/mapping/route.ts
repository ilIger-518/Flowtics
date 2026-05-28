import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resolveTradeRepublicDir } from "@/lib/paths";

export const runtime = "nodejs";

type MappingPayload = {
  date?: string;
  amount?: string;
  currency?: string;
  type?: string;
  description?: string;
};

const tradeRepublicDir = resolveTradeRepublicDir();
const mappingPath = path.join(tradeRepublicDir, "mapping.json");

function pickDelimiter(line: string) {
  const candidates = [";", ",", "\t"];
  let best = candidates[0];
  let bestCount = 0;
  candidates.forEach((candidate) => {
    const count = line.split(candidate).length;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  });
  return best;
}

function splitCsvLine(line: string, delimiter: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

async function listHeaders() {
  try {
    const entries = await fs.readdir(tradeRepublicDir);
    const files = entries.filter((name) => name.endsWith(".csv"));
    const headers = new Set<string>();

    for (const fileName of files) {
      const raw = await fs.readFile(path.join(tradeRepublicDir, fileName), "utf-8");
      const firstLine = raw.split(/\r?\n/).find((line) => line.trim().length > 0);
      if (!firstLine) continue;
      const delimiter = pickDelimiter(firstLine);
      splitCsvLine(firstLine, delimiter).forEach((header) => {
        if (header) headers.add(header);
      });
    }

    return Array.from(headers).sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [] as string[];
    }
    throw err;
  }
}

async function readMapping(): Promise<MappingPayload> {
  try {
    const raw = await fs.readFile(mappingPath, "utf-8");
    return JSON.parse(raw) as MappingPayload;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw err;
  }
}

async function writeMapping(mapping: MappingPayload) {
  await fs.mkdir(tradeRepublicDir, { recursive: true });
  await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
}

export async function GET() {
  const [headers, mapping] = await Promise.all([listHeaders(), readMapping()]);
  return NextResponse.json({ headers, mapping });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as MappingPayload;
  await writeMapping(payload);
  return NextResponse.json({ ok: true, mapping: payload });
}
