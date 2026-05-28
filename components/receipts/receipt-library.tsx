"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ReceiptSummary } from "@/lib/receipts";

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

function parseNumber(value: string) {
  if (!value) return null;
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

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

const defaultFilters: Filters = {
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
  category: "",
};

export default function ReceiptLibrary({ data }: { data: ReceiptSummary[] }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [views, setViews] = useState<SavedView[]>([]);
  const [selectedView, setSelectedView] = useState<string>("");
  const [viewName, setViewName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.category))).sort();
  }, [data]);

  const duplicates = useMemo(() => {
    const groups = new Map<string, ReceiptSummary[]>();
    data.forEach((item) => {
      if (!item.duplicateKey || item.duplicateCount < 2) return;
      const list = groups.get(item.duplicateKey) ?? [];
      list.push(item);
      groups.set(item.duplicateKey, list);
    });
    return [...groups.values()]
      .map((group) => group.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")))
      .sort((a, b) => b.length - a.length);
  }, [data]);

  const filtered = useMemo(() => {
    const minAmount = parseNumber(filters.minAmount);
    const maxAmount = parseNumber(filters.maxAmount);

    return data.filter((item) => {
      if (filters.category && item.category !== filters.category) return false;

      if (filters.dateFrom) {
        if (!item.date || item.date < filters.dateFrom) return false;
      }

      if (filters.dateTo) {
        if (!item.date || item.date > filters.dateTo) return false;
      }

      if (minAmount !== null) {
        if (item.total === null || item.total < minAmount) return false;
      }

      if (maxAmount !== null) {
        if (item.total === null || item.total > maxAmount) return false;
      }

      return true;
    });
  }, [data, filters]);

  const loadViews = async () => {
    try {
      const response = await fetch("/api/receipts/views?scope=receipts", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { views?: SavedView[] };
      setViews(payload.views ?? []);
    } catch {
      setViews([]);
    }
  };

  useEffect(() => {
    loadViews();
  }, []);

  const applyView = (viewId: string) => {
    setSelectedView(viewId);
    const view = views.find((entry) => entry.id === viewId);
    if (!view) return;
    setFilters(view.filters);
  };

  const handleSaveView = async () => {
    if (!viewName.trim()) {
      setStatus("Enter a name for the view.");
      return;
    }

    try {
      const response = await fetch("/api/receipts/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: viewName.trim(), scope: "receipts", filters }),
      });

      if (!response.ok) {
        setStatus("Failed to save view.");
        return;
      }

      const payload = (await response.json()) as { view?: SavedView };
      if (payload.view) {
        setViews((prev) => [payload.view!, ...prev]);
        setSelectedView(payload.view.id);
      }
      setViewName("");
      setStatus("Saved view.");
    } catch {
      setStatus("Failed to save view.");
    }
  };

  const handleDeleteView = async () => {
    if (!selectedView) return;
    try {
      const response = await fetch(`/api/receipts/views?id=${selectedView}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setStatus("Failed to delete view.");
        return;
      }
      setViews((prev) => prev.filter((view) => view.id !== selectedView));
      setSelectedView("");
      setStatus("Deleted view.");
    } catch {
      setStatus("Failed to delete view.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Filters</h2>
          <button
            type="button"
            className="text-xs text-blue-600 underline"
            onClick={() => {
              setFilters(defaultFilters);
              setSelectedView("");
            }}
          >
            Reset filters
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            <span className="text-xs text-muted-foreground">Date from</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs text-muted-foreground">Date to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs text-muted-foreground">Min amount</span>
            <input
              type="number"
              step="0.01"
              value={filters.minAmount}
              onChange={(event) => setFilters((prev) => ({ ...prev, minAmount: event.target.value }))}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs text-muted-foreground">Max amount</span>
            <input
              type="number"
              step="0.01"
              value={filters.maxAmount}
              onChange={(event) => setFilters((prev) => ({ ...prev, maxAmount: event.target.value }))}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs text-muted-foreground">Category</span>
            <select
              value={filters.category}
              onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-medium">Saved views</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <select
            value={selectedView}
            onChange={(event) => applyView(event.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-sm"
          >
            <option value="">Select a view</option>
            {views.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="New view name"
            value={viewName}
            onChange={(event) => setViewName(event.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveView}
              className="rounded bg-primary px-3 py-1 text-sm text-white"
            >
              Save view
            </button>
            <button
              type="button"
              onClick={handleDeleteView}
              className="rounded border border-border px-3 py-1 text-sm"
              disabled={!selectedView}
            >
              Delete
            </button>
          </div>
        </div>
        {status ? <p className="mt-2 text-xs text-muted-foreground">{status}</p> : null}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Filtered receipts</h2>
          <span className="text-sm text-muted-foreground">{filtered.length} results</span>
        </div>
        {filtered.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No receipts match the filters.</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {filtered.map((item) => (
              <div
                key={item.fileName}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{item.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.date ?? "No date"} · {item.category}
                    {item.duplicateCount > 1 ? " · Possible duplicate" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {item.total !== null
                      ? formatCurrency(item.total, item.currency)
                      : "No total"}
                  </p>
                  <Link
                    href={`/receipts/${encodeURIComponent(item.fileName)}`}
                    className="text-xs text-blue-600 underline"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Possible duplicates</h2>
          <span className="text-sm text-muted-foreground">{duplicates.length} group(s)</span>
        </div>
        {duplicates.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No duplicates detected.</p>
        ) : (
          <div className="mt-3 space-y-4 text-sm">
            {duplicates.map((group) => (
              <div key={group[0].duplicateKey ?? group[0].fileName} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  {group[0].merchant} · {group[0].date ?? "No date"} · {group[0].total !== null ? formatCurrency(group[0].total, group[0].currency) : "No total"}
                </p>
                <div className="mt-2 space-y-2">
                  {group.map((item) => (
                    <div key={item.fileName} className="flex items-center justify-between gap-2">
                      <span className="truncate">{item.fileName}</span>
                      <Link
                        href={`/receipts/${encodeURIComponent(item.fileName)}`}
                        className="text-xs text-blue-600 underline"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
