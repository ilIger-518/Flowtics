import { promises as fs } from "fs";
import path from "path";
import { resolveTradeRepublicDir } from "@/lib/paths";

export type TradeRepublicSeriesPoint = {
  label: string;
  total: number;
};

export type TradeRepublicCategoryPoint = {
  category: string;
  total: number;
};

export type TradeRepublicTopMovement = {
  date: string;
  description: string;
  type: string;
  category: string;
  amount: number;
  fileName: string;
};

export type TradeRepublicReportRow = {
  date: string;
  amount: number;
  currency: string;
  type: string;
  description: string;
  category: string;
  fileName: string;
};

export type TradeRepublicReportData = {
  currency: string;
  totals: {
    inflow: number;
    outflow: number;
    net: number;
  };
  counts: {
    rows: number;
    skipped: number;
  };
  range: {
    start: string | null;
    end: string | null;
  };
  series: {
    daily: TradeRepublicSeriesPoint[];
    weekly: TradeRepublicSeriesPoint[];
    monthly: TradeRepublicSeriesPoint[];
  };
  categories: TradeRepublicCategoryPoint[];
  topOutflows: TradeRepublicTopMovement[];
  rows: TradeRepublicReportRow[];
};

type TradeRepublicRow = {
  date: Date;
  amount: number;
  currency: string;
  type: string;
  description: string;
  category: string;
  fileName: string;
};

const tradeRepublicDir = resolveTradeRepublicDir();
const mappingPath = path.join(tradeRepublicDir, "mapping.json");

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

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

function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  const value = raw.trim();
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [_, year, month, day] = isoMatch;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dmyMatch = value.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (dmyMatch) {
    const [_, day, month, year] = dmyMatch;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function parseAmount(raw?: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

function normalizeCurrency(raw?: string) {
  const value = raw?.trim().toUpperCase();
  if (!value) return "EUR";
  if (value.includes("€")) return "EUR";
  if (value.includes("$") || value.includes("USD")) return "USD";
  return value.slice(0, 4);
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

type HeaderMapping = {
  date?: string;
  amount?: string;
  currency?: string;
  type?: string;
  description?: string;
};

function resolveHeaderMap(headers: string[], mapping?: HeaderMapping) {
  const map = new Map<string, number>();
  headers.forEach((header, index) => map.set(normalizeHeader(header), index));

  const resolveMappedKey = (value?: string) => {
    if (!value) return null;
    const idx = map.get(normalizeHeader(value));
    return idx !== undefined ? idx : null;
  };

  const resolveKey = (candidates: string[]) => {
    for (const candidate of candidates) {
      const idx = map.get(candidate);
      if (idx !== undefined) return idx;
    }
    return null;
  };

  return {
    dateIndex:
      resolveMappedKey(mapping?.date) ??
      resolveKey(["date", "datum", "buchungstag", "transaction date"]),
    amountIndex:
      resolveMappedKey(mapping?.amount) ??
      resolveKey(["amount", "betrag", "summe", "wert", "transaktionsbetrag"]),
    currencyIndex:
      resolveMappedKey(mapping?.currency) ??
      resolveKey(["currency", "währung", "waehrung", "curr"]),
    typeIndex:
      resolveMappedKey(mapping?.type) ??
      resolveKey(["type", "typ", "transaction type", "buchungstyp", "kategorie"]),
    descriptionIndex:
      resolveMappedKey(mapping?.description) ??
      resolveKey(["description", "verwendungszweck", "details", "beschreibung", "name"]),
  };
}

async function readHeaderMapping(): Promise<HeaderMapping> {
  try {
    const raw = await fs.readFile(mappingPath, "utf-8");
    return JSON.parse(raw) as HeaderMapping;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    return {};
  }
}

async function listTradeRepublicFiles() {
  try {
    const entries = await fs.readdir(tradeRepublicDir);
    return entries.filter((name) => name.endsWith(".csv")).sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function parseCsvFile(fileName: string) {
  const filePath = path.join(tradeRepublicDir, fileName);
  const raw = await fs.readFile(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [] as TradeRepublicRow[];

  const delimiter = pickDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter);
  const mapping = await readHeaderMapping();
  const { dateIndex, amountIndex, currencyIndex, typeIndex, descriptionIndex } =
    resolveHeaderMap(headers, mapping);

  if (dateIndex === null || amountIndex === null) {
    return [] as TradeRepublicRow[];
  }

  const rows: TradeRepublicRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const columns = splitCsvLine(lines[i], delimiter);
    const date = parseDate(columns[dateIndex]);
    const amount = parseAmount(columns[amountIndex]);
    if (!date || amount === null) continue;

    const currency = normalizeCurrency(currencyIndex !== null ? columns[currencyIndex] : "EUR");
    const type = typeIndex !== null ? (columns[typeIndex] || "Unknown") : "Unknown";
    const description = descriptionIndex !== null ? (columns[descriptionIndex] || "") : "";

    rows.push({
      date,
      amount,
      currency,
      type,
      description,
      fileName,
    });
  }

  return rows;
}

function pickPrimaryCurrency(rows: TradeRepublicRow[]) {
  if (rows.length === 0) return "EUR";
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    counts.set(row.currency, (counts.get(row.currency) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function buildCategoryBreakdown(rows: TradeRepublicRow[]) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    if (row.amount >= 0) return;
    const key = row.category || "Other";
    totals.set(key, (totals.get(key) ?? 0) + Math.abs(row.amount));
  });

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function mapTradeRepublicCategory(type: string, description: string) {
  const typeValue = type.toLowerCase();
  const descriptionValue = description.toLowerCase();
  const text = `${typeValue} ${descriptionValue}`;

  if (text.includes("dividend") || text.includes("ausschütt")) return "Dividend";
  if (text.includes("fee") || text.includes("gebühr") || text.includes("commission")) {
    return "Fees";
  }
  if (text.includes("buy") || text.includes("kauf") || text.includes("purchase")) {
    return "Buy";
  }
  if (text.includes("sell") || text.includes("verkauf") || text.includes("sale")) {
    return "Sell";
  }
  if (text.includes("card") || text.includes("karte") || text.includes("card payment")) {
    return "Card";
  }

  return type || "Other";
}

function buildSeries(rows: TradeRepublicRow[], range: Array<{ key: string; label: string }>, keyFn: (row: TradeRepublicRow) => string) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    if (row.amount >= 0) return;
    const key = keyFn(row);
    totals.set(key, (totals.get(key) ?? 0) + Math.abs(row.amount));
  });

  return range.map(({ key, label }) => ({
    label,
    total: totals.get(key) ?? 0,
  }));
}

export async function getTradeRepublicReportData(): Promise<TradeRepublicReportData> {
  const files = await listTradeRepublicFiles();
  const allRows: TradeRepublicRow[] = [];
  let skipped = 0;

  for (const fileName of files) {
    const rows = await parseCsvFile(fileName);
    if (rows.length === 0) {
      skipped += 1;
      continue;
    }
    allRows.push(...rows);
  }

  const currency = pickPrimaryCurrency(allRows);
  const filtered = allRows.filter((row) => row.currency === currency);

  const inflow = filtered.filter((row) => row.amount > 0).reduce((acc, row) => acc + row.amount, 0);
  const outflow = filtered.filter((row) => row.amount < 0).reduce((acc, row) => acc + Math.abs(row.amount), 0);

  const today = new Date();
  const weekStart = startOfWeek(today);

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

  const daily = buildSeries(filtered, dailyRange, (row) => formatDateKey(row.date));
  const weekly = buildSeries(filtered, weeklyRange, (row) => formatDateKey(startOfWeek(row.date)));
  const monthly = buildSeries(filtered, monthlyRange, (row) => formatMonthKey(row.date));

  const rangeStart = filtered.length
    ? formatDateKey(new Date(Math.min(...filtered.map((item) => item.date.getTime()))))
    : null;
  const rangeEnd = filtered.length
    ? formatDateKey(new Date(Math.max(...filtered.map((item) => item.date.getTime()))))
    : null;

  const topOutflows = filtered
    .filter((row) => row.amount < 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 8)
    .map((row) => ({
      date: formatDateKey(row.date),
      description: row.description || row.type,
      type: row.type,
      category: row.category,
      amount: Math.abs(row.amount),
      fileName: row.fileName,
    }));

  return {
    currency,
    totals: {
      inflow,
      outflow,
      net: inflow - outflow,
    },
    counts: {
      rows: filtered.length,
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
    topOutflows,
    rows: filtered.map((row) => ({
      date: formatDateKey(row.date),
      amount: row.amount,
      currency: row.currency,
      type: row.type,
      description: row.description,
      category: row.category,
      fileName: row.fileName,
    })),
  };
}
