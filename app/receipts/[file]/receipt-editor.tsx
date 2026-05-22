"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type StructuredReceipt = {
  merchant?: string;
  address?: string;
  date?: string;
  time?: string;
  currency?: string;
  total?: number;
  items?: Array<{ name?: string; price?: number; quantity?: number }>;
};

type ItemForm = {
  name: string;
  price: string;
  quantity: string;
};

type Candidates = {
  merchant: string[];
  address: string[];
  date: string[];
  time: string[];
  currency: string[];
  total: string[];
  items: Array<{ name: string; price: string }>;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function parsePrice(raw: string) {
  const normalized = raw.replace(/,/g, ".");
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : undefined;
}

function buildCandidates(ocrText: string): Candidates {
  const lines = ocrText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const merchantCandidates = [...lines.slice(0, 6)];
  const knownStores = ["REWE", "LIDL", "ALDI", "EDEKA", "NETTO", "KAUFLAND"];
  lines.forEach((line) => {
    const match = knownStores.find((store) => line.toUpperCase().includes(store));
    if (match) merchantCandidates.push(line);
  });

  const addressCandidates: string[] = [];
  const streetRegex = /(str\.|straße|strasse|platz|weg|allee|gasse|ring|street|road)/i;
  const postalRegex = /\b\d{5}\b/;
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (streetRegex.test(lines[i]) && postalRegex.test(lines[i + 1])) {
      addressCandidates.push(`${lines[i]}, ${lines[i + 1]}`);
    }
  }
  lines.forEach((line) => {
    if (postalRegex.test(line) || streetRegex.test(line)) {
      addressCandidates.push(line);
    }
  });

  const dateCandidates: string[] = [];
  const timeCandidates: string[] = [];
  lines.forEach((line) => {
    const dateMatch = line.match(/\b\d{2}[./-]\d{2}[./-]\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/);
    if (dateMatch) dateCandidates.push(dateMatch[0]);
    const timeMatch = line.match(/\b\d{1,2}:\d{2}\b/);
    if (timeMatch) timeCandidates.push(timeMatch[0]);
  });

  const currencyCandidates: string[] = [];
  if (ocrText.includes("EUR") || ocrText.includes("€")) currencyCandidates.push("EUR");
  if (ocrText.includes("USD") || ocrText.includes("$") || ocrText.includes("US$")) {
    currencyCandidates.push("USD");
  }

  const totalCandidates: string[] = [];
  const totalKeywords = /(summe|gesamt|total|betrag)/i;
  lines.forEach((line) => {
    if (!totalKeywords.test(line)) return;
    const match = line.match(/(-?\d+[.,]\d{2})/g);
    if (match) totalCandidates.push(...match);
  });

  const items: Array<{ name: string; price: string }> = [];
  const priceRegex = /(-?\d+[.,]\d{2})/;
  lines.forEach((line) => {
    if (!priceRegex.test(line)) return;
    if (totalKeywords.test(line)) return;
    const match = line.match(priceRegex);
    if (!match) return;
    const price = match[1];
    const name = line.replace(priceRegex, "").trim();
    if (!name) return;
    items.push({ name, price });
  });

  return {
    merchant: unique(merchantCandidates),
    address: unique(addressCandidates),
    date: unique(dateCandidates),
    time: unique(timeCandidates),
    currency: unique(currencyCandidates),
    total: unique(totalCandidates),
    items,
  };
}

function normalizeItems(items?: Array<{ name?: string; price?: number; quantity?: number }>): ItemForm[] {
  if (!items || items.length === 0) return [];
  return items.map((item) => ({
    name: item.name ?? "",
    price: item.price !== undefined ? String(item.price) : "",
    quantity: item.quantity !== undefined ? String(item.quantity) : "",
  }));
}

export default function ReceiptEditor({
  fileName,
  imageUrl,
  ocrText,
  structured,
}: {
  fileName: string;
  imageUrl: string;
  ocrText: string;
  structured: StructuredReceipt;
}) {
  const candidates = useMemo(() => buildCandidates(ocrText), [ocrText]);
  const [form, setForm] = useState({
    merchant: structured.merchant ?? "",
    address: structured.address ?? "",
    date: structured.date ?? "",
    time: structured.time ?? "",
    currency: structured.currency ?? "",
    total: structured.total !== undefined ? String(structured.total) : "",
    items: normalizeItems(structured.items),
  });
  const [customMode, setCustomMode] = useState({
    merchant: false,
    address: false,
    date: false,
    time: false,
    currency: false,
    total: false,
  });
  const [status, setStatus] = useState<string | null>(null);

  const issues = [] as string[];
  if (!form.merchant) issues.push("Missing merchant");
  if (!form.total) issues.push("Missing total");
  if (!form.date) issues.push("Missing date");
  if (!form.currency) issues.push("Missing currency");
  form.items.forEach((item, index) => {
    if (!item.name || !item.price) {
      issues.push(`Item ${index + 1} missing name or price`);
    }
  });

  const applySelect = (field: keyof typeof customMode, value: string) => {
    if (value === "__custom") {
      setCustomMode((prev) => ({ ...prev, [field]: true }));
      return;
    }
    setCustomMode((prev) => ({ ...prev, [field]: false }));
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (index: number, patch: Partial<ItemForm>) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", price: "", quantity: "" }],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setStatus(null);
    const payload = {
      merchant: form.merchant || null,
      address: form.address || null,
      date: form.date || null,
      time: form.time || null,
      currency: form.currency || null,
      total: parsePrice(form.total) ?? null,
      items: form.items
        .filter((item) => item.name || item.price || item.quantity)
        .map((item) => ({
          name: item.name || null,
          price: parsePrice(item.price) ?? null,
          quantity: parsePrice(item.quantity) ?? null,
        })),
    };

    const response = await fetch(`/uploads/receipts/structured/${fileName}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("Save failed. Please retry.");
      return;
    }

    setStatus("Saved.");
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Receipt Review</h1>
            <p className="text-sm text-muted-foreground">{fileName}</p>
          </div>
          <div className="flex gap-2">
            <Link className="rounded border px-3 py-1 text-sm" href="/uploads/receipts">
              Back to receipts
            </Link>
            <button
              className="rounded bg-primary px-4 py-1.5 text-sm text-white"
              onClick={handleSave}
            >
              Save changes
            </button>
          </div>
        </div>

        {issues.length > 0 ? (
          <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
            <p className="font-medium">Needs review</p>
            <ul className="mt-2 list-disc pl-5">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-medium">Receipt Image</h2>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Receipt"
                className="mt-3 w-full rounded-md border border-border"
              />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No image available.</p>
            )}
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-medium">Extracted Fields</h2>

            <div className="grid gap-3">
              <label className="text-sm font-medium">Merchant</label>
              <select
                className="rounded border border-border bg-background px-3 py-2 text-sm"
                value={customMode.merchant ? "__custom" : form.merchant}
                onChange={(event) => applySelect("merchant", event.target.value)}
              >
                <option value="">Select candidate</option>
                {candidates.merchant.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
                <option value="__custom">Custom value</option>
              </select>
              {customMode.merchant ? (
                <input
                  className="rounded border border-border bg-background px-3 py-2 text-sm"
                  value={form.merchant}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, merchant: event.target.value }))
                  }
                />
              ) : null}

              <label className="text-sm font-medium">Address</label>
              <select
                className="rounded border border-border bg-background px-3 py-2 text-sm"
                value={customMode.address ? "__custom" : form.address}
                onChange={(event) => applySelect("address", event.target.value)}
              >
                <option value="">Select candidate</option>
                {candidates.address.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
                <option value="__custom">Custom value</option>
              </select>
              {customMode.address ? (
                <input
                  className="rounded border border-border bg-background px-3 py-2 text-sm"
                  value={form.address}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <select
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    value={customMode.date ? "__custom" : form.date}
                    onChange={(event) => applySelect("date", event.target.value)}
                  >
                    <option value="">Select candidate</option>
                    {candidates.date.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                    <option value="__custom">Custom value</option>
                  </select>
                  {customMode.date ? (
                    <input
                      className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                      value={form.date}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, date: event.target.value }))
                      }
                    />
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <select
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    value={customMode.time ? "__custom" : form.time}
                    onChange={(event) => applySelect("time", event.target.value)}
                  >
                    <option value="">Select candidate</option>
                    {candidates.time.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                    <option value="__custom">Custom value</option>
                  </select>
                  {customMode.time ? (
                    <input
                      className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                      value={form.time}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, time: event.target.value }))
                      }
                    />
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Currency</label>
                  <select
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    value={customMode.currency ? "__custom" : form.currency}
                    onChange={(event) => applySelect("currency", event.target.value)}
                  >
                    <option value="">Select candidate</option>
                    {candidates.currency.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                    <option value="__custom">Custom value</option>
                  </select>
                  {customMode.currency ? (
                    <input
                      className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                      value={form.currency}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, currency: event.target.value }))
                      }
                    />
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-medium">Total</label>
                  <select
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    value={customMode.total ? "__custom" : form.total}
                    onChange={(event) => applySelect("total", event.target.value)}
                  >
                    <option value="">Select candidate</option>
                    {candidates.total.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                    <option value="__custom">Custom value</option>
                  </select>
                  {customMode.total ? (
                    <input
                      className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                      value={form.total}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, total: event.target.value }))
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Items</h3>
                <button
                  className="rounded border border-border px-2 py-1 text-xs"
                  onClick={addItem}
                  type="button"
                >
                  Add item
                </button>
              </div>
              {form.items.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No items yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {form.items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="rounded border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Item {index + 1}
                        </span>
                        <button
                          className="text-xs text-red-600"
                          onClick={() => removeItem(index)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                        <input
                          className="rounded border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Name"
                          value={item.name}
                          onChange={(event) =>
                            updateItem(index, { name: event.target.value })
                          }
                        />
                        <input
                          className="rounded border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Price"
                          value={item.price}
                          onChange={(event) =>
                            updateItem(index, { price: event.target.value })
                          }
                        />
                        <input
                          className="rounded border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, { quantity: event.target.value })
                          }
                        />
                      </div>
                      {candidates.items.length > 0 ? (
                        <select
                          className="mt-2 w-full rounded border border-border bg-background px-3 py-2 text-sm"
                          onChange={(event) => {
                            const [name, price] = event.target.value.split("||");
                            if (name && price) {
                              updateItem(index, { name, price });
                            }
                          }}
                        >
                          <option value="">Pick from OCR candidates</option>
                          {candidates.items.map((candidate) => (
                            <option
                              key={`${candidate.name}-${candidate.price}`}
                              value={`${candidate.name}||${candidate.price}`}
                            >
                              {candidate.name} - {candidate.price}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
