"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  CategoryPoint,
  MerchantPoint,
  MerchantReceipt,
  ReportData,
  ReportSeriesPoint,
} from "@/lib/reports";

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
      <h2 className="text-lg font-medium">No structured receipt data yet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload receipts and run OCR to populate the reports dashboard.
      </p>
    </div>
  );
}

function SeriesChart({ data, currency, type }: { data: ReportSeriesPoint[]; currency: string; type: "daily" | "weekly" | "monthly" }) {
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

function CategoryChart({ data, currency }: { data: CategoryPoint[]; currency: string }) {
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

function MerchantInsights({
  data,
  receipts,
  currency,
}: {
  data: MerchantPoint[];
  receipts: MerchantReceipt[];
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const search = query.trim().toLowerCase();
    return data.filter((entry) => entry.merchant.toLowerCase().includes(search));
  }, [data, query]);

  const top = filtered.slice(0, 12);
  const selectedMerchant = selected ?? (top[0]?.merchant ?? null);
  const selectedReceipts = useMemo(() => {
    if (!selectedMerchant) return [];
    return receipts.filter((entry) => entry.merchant === selectedMerchant);
  }, [receipts, selectedMerchant]);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No merchant data yet.</p>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Search merchants"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr] gap-2 text-xs uppercase text-muted-foreground">
          <span>Merchant</span>
          <span className="text-right">Total</span>
          <span className="text-right">Avg</span>
          <span className="text-right">Receipts</span>
          <span className="text-right">Last seen</span>
        </div>
        <div className="space-y-2">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">No merchants match this search.</p>
          ) : (
            top.map((entry) => (
              <button
                key={entry.merchant}
                type="button"
                onClick={() => setSelected(entry.merchant)}
                className={`grid w-full grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr] gap-2 rounded-md px-2 py-1 text-left text-sm transition ${
                  entry.merchant === selectedMerchant
                    ? "bg-slate-100 text-slate-900"
                    : "hover:bg-slate-50"
                }`}
              >
                <span className="truncate" title={entry.merchant}>
                  {entry.merchant}
                </span>
                <span className="text-right font-medium">
                  {formatCurrency(entry.total, currency)}
                </span>
                <span className="text-right text-muted-foreground">
                  {formatCurrency(entry.average, currency)}
                </span>
                <span className="text-right">{entry.count}</span>
                <span className="text-right text-muted-foreground">{entry.lastSeen}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          {selectedMerchant ? `Receipts for ${selectedMerchant}` : "Select a merchant"}
        </div>
        <div className="space-y-2">
          {selectedReceipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No receipts for this merchant.</p>
          ) : (
            selectedReceipts.map((entry) => (
              <div key={entry.fileName} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{formatCurrency(entry.total, currency)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(entry.date)} · {entry.category}
                  </p>
                </div>
                <Link
                  className="text-xs text-blue-600 underline"
                  href={`/receipts/${encodeURIComponent(entry.fileName)}`}
                >
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportsDashboard({ data }: { data: ReportData }) {
  if (data.counts.receipts === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Today" value={formatCurrency(data.totals.day, data.currency)} />
        <Card title="This week" value={formatCurrency(data.totals.week, data.currency)} />
        <Card title="This month" value={formatCurrency(data.totals.month, data.currency)} />
        <Card
          title="All time"
          value={formatCurrency(data.totals.all, data.currency)}
          helper={`Range ${data.range.start ?? "-"} to ${data.range.end ?? "-"}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Daily spend (last 14 days)">
          <SeriesChart data={data.series.daily} currency={data.currency} type="daily" />
        </Section>
        <Section title="Weekly spend (last 8 weeks)">
          <SeriesChart data={data.series.weekly} currency={data.currency} type="weekly" />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Monthly spend (last 6 months)">
          <SeriesChart data={data.series.monthly} currency={data.currency} type="monthly" />
        </Section>
        <Section title="Category breakdown">
          <CategoryChart data={data.categories} currency={data.currency} />
        </Section>
      </div>

      <Section title="Merchant insights (search + drill-down)">
        <MerchantInsights
          data={data.merchants}
          receipts={data.merchantReceipts}
          currency={data.currency}
        />
      </Section>

      {data.counts.skipped > 0 ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          {data.counts.skipped} receipts skipped due to missing date or total.
        </div>
      ) : null}
    </div>
  );
}
