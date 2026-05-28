"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  TradeRepublicCategoryPoint,
  TradeRepublicReportData,
  TradeRepublicSeriesPoint,
} from "@/lib/trade-republic";

const chartColors = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`.trim();
  }
}

function formatCompact(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`.trim();
  }
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function formatDateKey(value: string) {
  return value;
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

function buildSeries(
  rows: TradeRepublicReportRow[],
  range: Array<{ key: string; label: string }>,
  keyFn: (row: TradeRepublicReportRow) => string
) {
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

function buildCategoryBreakdown(rows: TradeRepublicReportRow[]) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    if (row.amount >= 0) return;
    totals.set(row.category, (totals.get(row.category) ?? 0) + Math.abs(row.amount));
  });

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function Card({ title, value, helper }: { title: string; value: string; helper?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <h2 className="text-lg font-medium">No Trade Republic data yet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload CSV exports to populate the Trade Republic dashboard.
      </p>
    </div>
  );
}

function SeriesChart({ data, currency, type }: { data: TradeRepublicSeriesPoint[]; currency: string; type: "daily" | "weekly" | "monthly" }) {
  if (type === "daily") {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => formatCompact(value, currency)} />
          <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
          <Line type="monotone" dataKey="total" stroke="#1f77b4" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "weekly") {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} hide={data.length > 6} />
          <YAxis tickFormatter={(value) => formatCompact(value, currency)} />
          <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
          <Bar dataKey="total" fill="#2ca02c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(value) => formatCompact(value, currency)} />
        <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
        <Area type="monotone" dataKey="total" stroke="#ff7f0e" fill="#ff7f0e" fillOpacity={0.25} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CategoryChart({ data, currency }: { data: TradeRepublicCategoryPoint[]; currency: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="category" innerRadius={50} outerRadius={90} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 text-sm">
        {data.map((entry, index) => (
          <div key={entry.category} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <span>{entry.category}</span>
            </div>
            <span className="font-medium">{formatCurrency(entry.total, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TradeRepublicDashboard({ data }: { data: TradeRepublicReportData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<string[]>([]);
  const initialized = useRef(false);

  const categories = ["Buy", "Sell", "Dividend", "Fees", "Card"];
  const activeFilters = filters.length > 0 ? filters : categories;

  useEffect(() => {
    const preset = searchParams.get("tr");
    if (!preset) {
      setFilters([]);
      return;
    }

    if (preset === "card") {
      setFilters(["Card"]);
      return;
    }

    if (preset === "trading") {
      setFilters(["Buy", "Sell", "Dividend", "Fees"]);
      return;
    }

    if (preset.startsWith("custom:")) {
      const raw = preset.replace("custom:", "");
      const list = raw
        .split(",")
        .map((value) => value.trim())
        .filter((value) => categories.includes(value));
      setFilters(list);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (filters.length === 0) {
      params.delete("tr");
    } else if (filters.length === 1 && filters[0] === "Card") {
      params.set("tr", "card");
    } else if (
      filters.length === 4 &&
      ["Buy", "Sell", "Dividend", "Fees"].every((value) => filters.includes(value))
    ) {
      params.set("tr", "trading");
    } else {
      const sorted = [...filters].sort();
      params.set("tr", `custom:${sorted.join(",")}`);
    }

    const query = params.toString();
    const nextUrl = query ? `?${query}` : window.location.pathname;
    router.replace(nextUrl);
  }, [filters, router, searchParams]);

  const filteredRows = useMemo(() => {
    if (data.rows.length === 0) return [];
    return data.rows.filter((row) => activeFilters.includes(row.category));
  }, [data.rows, activeFilters]);

  const cardRows = useMemo(() => data.rows.filter((row) => row.category === "Card"), [data.rows]);
  const tradingRows = useMemo(
    () => data.rows.filter((row) => ["Buy", "Sell", "Dividend", "Fees"].includes(row.category)),
    [data.rows]
  );

  const cardOutflow = useMemo(
    () => cardRows.filter((row) => row.amount < 0).reduce((acc, row) => acc + Math.abs(row.amount), 0),
    [cardRows]
  );
  const tradingOutflow = useMemo(
    () => tradingRows.filter((row) => row.amount < 0).reduce((acc, row) => acc + Math.abs(row.amount), 0),
    [tradingRows]
  );

  const inflow = filteredRows.filter((row) => row.amount > 0).reduce((acc, row) => acc + row.amount, 0);
  const outflow = filteredRows
    .filter((row) => row.amount < 0)
    .reduce((acc, row) => acc + Math.abs(row.amount), 0);

  const today = new Date();
  const weekStart = startOfWeek(today);

  const dailyRange: Array<{ key: string; label: string }> = [];
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    date.setUTCDate(date.getUTCDate() - i);
    const key = formatDateKey(date.toISOString().slice(0, 10));
    dailyRange.push({ key, label: formatShortDate(key) });
  }

  const weeklyRange: Array<{ key: string; label: string }> = [];
  for (let i = 7; i >= 0; i -= 1) {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() - i * 7);
    const key = formatDateKey(date.toISOString().slice(0, 10));
    weeklyRange.push({ key, label: `Week of ${formatShortDate(key)}` });
  }

  const monthlyRange: Array<{ key: string; label: string }> = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    date.setUTCMonth(date.getUTCMonth() - i);
    const key = formatMonthKey(date);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthlyRange.push({ key, label });
  }

  const daily = buildSeries(filteredRows, dailyRange, (row) => row.date);
  const weekly = buildSeries(filteredRows, weeklyRange, (row) => {
    const date = new Date(`${row.date}T00:00:00Z`);
    return formatDateKey(startOfWeek(date).toISOString().slice(0, 10));
  });
  const monthly = buildSeries(filteredRows, monthlyRange, (row) => {
    const date = new Date(`${row.date}T00:00:00Z`);
    return formatMonthKey(date);
  });

  const categoriesData = buildCategoryBreakdown(filteredRows);
  const topOutflows = filteredRows
    .filter((row) => row.amount < 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 8);

  if (data.counts.rows === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Inflow" value={formatCurrency(inflow, data.currency)} />
        <Card title="Outflow" value={formatCurrency(outflow, data.currency)} />
        <Card title="Net" value={formatCurrency(inflow - outflow, data.currency)} />
        <Card
          title="Rows"
          value={`${filteredRows.length}`}
          helper={`Range ${data.range.start ?? "-"} to ${data.range.end ?? "-"}`}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilters(["Card"])}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary"
          >
            Card only
          </button>
          <button
            type="button"
            onClick={() => setFilters(["Buy", "Sell", "Dividend", "Fees"])}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary"
          >
            Trading only
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">
              Card outflow: {formatCurrency(cardOutflow, data.currency)}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              Trading outflow: {formatCurrency(tradingOutflow, data.currency)}
            </span>
          </div>
          {categories.map((category) => {
            const active = activeFilters.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setFilters((prev) =>
                    prev.includes(category)
                      ? prev.filter((item) => item !== category)
                      : [...prev, category]
                  );
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {category}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setFilters([])}
            className="text-xs text-blue-600 underline"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Daily outflow (last 14 days)">
          <SeriesChart data={daily} currency={data.currency} type="daily" />
        </Section>
        <Section title="Weekly outflow (last 8 weeks)">
          <SeriesChart data={weekly} currency={data.currency} type="weekly" />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Monthly outflow (last 6 months)">
          <SeriesChart data={monthly} currency={data.currency} type="monthly" />
        </Section>
        <Section title="Outflow by type">
          <CategoryChart data={categoriesData} currency={data.currency} />
        </Section>
      </div>

      <Section title="Largest outflows">
        {topOutflows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No outflow data yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {topOutflows.map((entry) => (
              <div
                key={`${entry.fileName}-${entry.date}-${entry.amount}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{formatCurrency(Math.abs(entry.amount), data.currency)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(entry.date)} · {entry.category} · {entry.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{entry.fileName}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {data.counts.skipped > 0 ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          {data.counts.skipped} CSV file(s) skipped due to missing headers.
        </div>
      ) : null}
    </div>
  );
}
