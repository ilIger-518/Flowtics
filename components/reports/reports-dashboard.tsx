"use client";

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
import type { CategoryPoint, MerchantPoint, ReportData, ReportSeriesPoint } from "@/lib/reports";

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

function MerchantInsights({ data, currency }: { data: MerchantPoint[]; currency: string }) {
  const top = data.slice(0, 8);

  if (top.length === 0) {
    return <p className="text-sm text-muted-foreground">No merchant data yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr] gap-2 text-xs uppercase text-muted-foreground">
        <span>Merchant</span>
        <span className="text-right">Total</span>
        <span className="text-right">Avg</span>
        <span className="text-right">Receipts</span>
        <span className="text-right">Last seen</span>
      </div>
      <div className="space-y-2">
        {top.map((entry) => (
          <div key={entry.merchant} className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr] gap-2 text-sm">
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
          </div>
        ))}
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

      <Section title="Merchant insights (top spend)">
        <MerchantInsights data={data.merchants} currency={data.currency} />
      </Section>

      {data.counts.skipped > 0 ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          {data.counts.skipped} receipts skipped due to missing date or total.
        </div>
      ) : null}
    </div>
  );
}
