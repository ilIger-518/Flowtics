import { promises as fs } from "fs";
import path from "path";
import { resolveStructuredDir } from "@/lib/paths";

type StructuredReceipt = {
  merchant?: string;
  date?: string;
  currency?: string;
  total?: number;
  items?: Array<{ name?: string; price?: number; quantity?: number }>;
};

export type ReceiptSummary = {
  fileName: string;
  merchant: string;
  category: string;
  date: string | null;
  total: number | null;
  currency: string;
  duplicateKey: string | null;
  duplicateCount: number;
};

const structuredDir = resolveStructuredDir();

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [_, year, month, day] = isoMatch;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    return isValidDate(date) ? date : null;
  }

  const dmyMatch = trimmed.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (dmyMatch) {
    const [_, day, month, year] = dmyMatch;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    return isValidDate(date) ? date : null;
  }

  return null;
}

function normalizeCurrency(raw?: string) {
  const value = raw?.trim().toUpperCase();
  if (!value) return "EUR";
  if (value === "EUR" || value === "USD" || value === "GBP" || value === "CHF") return value;
  if (value.includes("€")) return "EUR";
  if (value.includes("$") || value.includes("USD")) return "USD";
  return value.slice(0, 4);
}

const categoryRules = [
  { category: "Food", keywords: ["rewe", "lidl", "aldi", "edeka", "netto", "kaufland", "grocery", "market", "supermarket", "restaurant", "cafe", "pizza", "burger", "bakery"] },
  { category: "Transport", keywords: ["uber", "taxi", "bus", "train", "bahn", "metro", "subway", "fuel", "gas", "shell", "bp", "esso"] },
  { category: "Electronics", keywords: ["media markt", "saturn", "electronics", "apple", "sony", "samsung", "best buy"] },
  { category: "Health", keywords: ["pharmacy", "apotheke", "dm", "rossmann", "hospital", "clinic"] },
  { category: "Entertainment", keywords: ["cinema", "movie", "netflix", "spotify", "ticket", "theater"] },
  { category: "Utilities", keywords: ["electric", "water", "internet", "telekom", "utility", "insurance"] },
  { category: "Travel", keywords: ["hotel", "air", "airline", "flight", "booking", "hostel"] },
  { category: "Retail", keywords: ["amazon", "shop", "store", "mall"] },
];

function categorizeReceipt(merchant: string, items?: StructuredReceipt["items"]) {
  const text = [merchant, ...(items ?? []).map((item) => item.name ?? "")]
    .join(" ")
    .toLowerCase();

  for (const rule of categoryRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.category;
    }
  }

  return "Other";
}

function buildDuplicateKey(merchant: string, date: string | null, total: number | null) {
  if (!date || total === null) return null;
  const keyMerchant = merchant.trim().toLowerCase();
  const keyTotal = total.toFixed(2);
  return `${date}::${keyMerchant}::${keyTotal}`;
}

async function listStructuredFiles() {
  try {
    const entries = await fs.readdir(structuredDir);
    return entries.filter((name) => name.endsWith(".json")).sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function readStructuredFile(fileName: string): Promise<StructuredReceipt | null> {
  try {
    const raw = await fs.readFile(path.join(structuredDir, fileName), "utf-8");
    return JSON.parse(raw) as StructuredReceipt;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    return null;
  }
}

export async function getReceiptSummaries(): Promise<ReceiptSummary[]> {
  const files = await listStructuredFiles();
  const summaries: ReceiptSummary[] = [];

  for (const fileName of files) {
    const data = await readStructuredFile(fileName);
    if (!data) continue;

    const merchant = data.merchant?.trim() || "Unknown";
    const category = categorizeReceipt(merchant, data.items);
    const dateValue = parseDate(data.date);
    const date = dateValue ? dateValue.toISOString().slice(0, 10) : null;

    const total = typeof data.total === "number" ? data.total : null;
    const duplicateKey = buildDuplicateKey(merchant, date, total);

    summaries.push({
      fileName,
      merchant,
      category,
      date,
      total,
      currency: normalizeCurrency(data.currency),
      duplicateKey,
      duplicateCount: 1,
    });
  }

  const duplicateCounts = new Map<string, number>();
  summaries.forEach((summary) => {
    if (!summary.duplicateKey) return;
    duplicateCounts.set(
      summary.duplicateKey,
      (duplicateCounts.get(summary.duplicateKey) ?? 0) + 1
    );
  });

  summaries.forEach((summary) => {
    if (!summary.duplicateKey) return;
    summary.duplicateCount = duplicateCounts.get(summary.duplicateKey) ?? 1;
  });

  return summaries.sort((a, b) => {
    if (!a.date && !b.date) return a.fileName.localeCompare(b.fileName);
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });
}
