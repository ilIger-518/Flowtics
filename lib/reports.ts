import { promises as fs } from "fs";
import path from "path";
import { resolveStructuredDir } from "@/lib/paths";

type StructuredReceipt = {
  merchant?: string;
  address?: string;
  date?: string;
  time?: string;
  currency?: string;
  total?: number;
  items?: Array<{ name?: string; price?: number; quantity?: number }>;
};

export type ReportSeriesPoint = {
  label: string;
  total: number;
};

export type CategoryPoint = {
  category: string;
  total: number;
};

export type MerchantPoint = {
  merchant: string;
  total: number;
  count: number;
  average: number;
  lastSeen: string;
};

export type MerchantReceipt = {
  merchant: string;
  total: number;
  date: string;
  category: string;
  fileName: string;
};

export type ReportData = {
  currency: string;
  totals: {
    all: number;
    month: number;
    week: number;
    day: number;
  };
  counts: {
    receipts: number;
    skipped: number;
  };
  range: {
    start: string | null;
    end: string | null;
  };
  series: {
    daily: ReportSeriesPoint[];
    weekly: ReportSeriesPoint[];
    monthly: ReportSeriesPoint[];
  };
  categories: CategoryPoint[];
  merchants: MerchantPoint[];
  merchantReceipts: MerchantReceipt[];
};

type NormalizedReceipt = {
  fileName: string;
  date: Date;
  total: number;
  currency: string;
  category: string;
  merchant: string;
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
  if (!value) return "UNK";
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

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = base.getUTCDay();
  const diff = (day + 6) % 7;
  base.setUTCDate(base.getUTCDate() - diff);
  return base;
}

function formatMonthKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatShortLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
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

async function loadStructuredReceipts() {
  const files = await listStructuredFiles();
  const receipts: NormalizedReceipt[] = [];
  let skipped = 0;

  for (const fileName of files) {
    const data = await readStructuredFile(fileName);
    if (!data) {
      skipped += 1;
      continue;
    }

    const date = parseDate(data.date);
    const total = typeof data.total === "number" ? data.total : null;

    if (!date || total === null) {
      skipped += 1;
      continue;
    }

    const merchant = data.merchant?.trim() || "Unknown";
    const currency = normalizeCurrency(data.currency);
    const category = categorizeReceipt(merchant, data.items);

    receipts.push({
      fileName,
      date,
      total,
      currency,
      category,
      merchant,
    });
  }

  return { receipts, skipped };
}

function pickPrimaryCurrency(receipts: NormalizedReceipt[]) {
  if (receipts.length === 0) return "EUR";
  const counts = new Map<string, number>();
  receipts.forEach((receipt) => {
    counts.set(receipt.currency, (counts.get(receipt.currency) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function sumTotals(receipts: NormalizedReceipt[]) {
  return receipts.reduce((acc, receipt) => acc + receipt.total, 0);
}

function buildCategoryBreakdown(receipts: NormalizedReceipt[]) {
  const totals = new Map<string, number>();
  receipts.forEach((receipt) => {
    totals.set(receipt.category, (totals.get(receipt.category) ?? 0) + receipt.total);
  });

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function buildMerchantInsights(receipts: NormalizedReceipt[]): MerchantPoint[] {
  const totals = new Map<
    string,
    {
      total: number;
      count: number;
      lastSeen: Date;
    }
  >();

  receipts.forEach((receipt) => {
    const entry = totals.get(receipt.merchant);
    if (!entry) {
      totals.set(receipt.merchant, {
        total: receipt.total,
        count: 1,
        lastSeen: receipt.date,
      });
      return;
    }

    entry.total += receipt.total;
    entry.count += 1;
    if (receipt.date > entry.lastSeen) {
      entry.lastSeen = receipt.date;
    }
  });

  return [...totals.entries()]
    .map(([merchant, values]) => ({
      merchant,
      total: values.total,
      count: values.count,
      average: values.total / values.count,
      lastSeen: formatDateKey(values.lastSeen),
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getReportData(): Promise<ReportData> {
  const { receipts, skipped } = await loadStructuredReceipts();
  const currency = pickPrimaryCurrency(receipts);
  const filtered = receipts.filter((receipt) => receipt.currency === currency);

  const today = new Date();
  const todayKey = formatDateKey(today);
  const weekStart = startOfWeek(today);
  const weekStartKey = formatDateKey(weekStart);
  const monthKey = formatMonthKey(today);

  const dailyRange: Array<{ key: string; label: string }> = [];
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    date.setUTCDate(date.getUTCDate() - i);
    const key = formatDateKey(date);
    dailyRange.push({ key, label: formatShortLabel(date) });
  }

  const weeklyRange: Array<{ key: string; label: string }> = [];
  for (let i = 7; i >= 0; i -= 1) {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() - i * 7);
    const key = formatDateKey(date);
    weeklyRange.push({ key, label: `Week of ${formatShortLabel(date)}` });
  }

  const monthlyRange: Array<{ key: string; label: string }> = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    date.setUTCMonth(date.getUTCMonth() - i);
    const key = formatMonthKey(date);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthlyRange.push({ key, label });
  }

  const dailyTotals = new Map<string, number>();
  const weeklyTotals = new Map<string, number>();
  const monthlyTotals = new Map<string, number>();

  filtered.forEach((receipt) => {
    const dayKey = formatDateKey(receipt.date);
    const weekKey = formatDateKey(startOfWeek(receipt.date));
    const monthKeyValue = formatMonthKey(receipt.date);

    dailyTotals.set(dayKey, (dailyTotals.get(dayKey) ?? 0) + receipt.total);
    weeklyTotals.set(weekKey, (weeklyTotals.get(weekKey) ?? 0) + receipt.total);
    monthlyTotals.set(monthKeyValue, (monthlyTotals.get(monthKeyValue) ?? 0) + receipt.total);
  });

  const daily = dailyRange.map(({ key, label }) => ({
    label,
    total: dailyTotals.get(key) ?? 0,
  }));

  const weekly = weeklyRange.map(({ key, label }) => ({
    label,
    total: weeklyTotals.get(key) ?? 0,
  }));

  const monthly = monthlyRange.map(({ key, label }) => ({
    label,
    total: monthlyTotals.get(key) ?? 0,
  }));

  const totals = {
    all: sumTotals(filtered),
    month: monthlyTotals.get(monthKey) ?? 0,
    week: weeklyTotals.get(weekStartKey) ?? 0,
    day: dailyTotals.get(todayKey) ?? 0,
  };

  const rangeStart = filtered.length
    ? formatDateKey(new Date(Math.min(...filtered.map((item) => item.date.getTime()))))
    : null;
  const rangeEnd = filtered.length
    ? formatDateKey(new Date(Math.max(...filtered.map((item) => item.date.getTime()))))
    : null;

  return {
    currency,
    totals,
    counts: {
      receipts: filtered.length,
      skipped,
    },
    range: {
      start: rangeStart,
      end: rangeEnd,
    },
    series: {
      daily,
      weekly,
      monthly,
    },
    categories: buildCategoryBreakdown(filtered),
    merchants: buildMerchantInsights(filtered),
    merchantReceipts: filtered
      .map((receipt) => ({
        merchant: receipt.merchant,
        total: receipt.total,
        date: formatDateKey(receipt.date),
        category: receipt.category,
        fileName: receipt.fileName,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
  };
}
