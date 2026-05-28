"use client";

import { useEffect, useState } from "react";

type UploadResult = {
  originalName: string;
  fileName: string;
  size: number;
  type: string;
  path: string;
};

export default function TradeRepublicPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [stored, setStored] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [mappingHeaders, setMappingHeaders] = useState<string[]>([]);
  const [mappingStatus, setMappingStatus] = useState<string | null>(null);
  const [mapping, setMapping] = useState({
    date: "",
    amount: "",
    currency: "",
    type: "",
    description: "",
    isin: "",
    instrument: "",
    quantity: "",
  });

  const loadFiles = async () => {
    try {
      const response = await fetch("/api/trade-republic", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { files?: string[] };
      setStored(data.files ?? []);
    } catch {
      setStored([]);
    }
  };

  useEffect(() => {
    loadFiles();
    loadMapping();
  }, []);

  const loadMapping = async () => {
    try {
      const response = await fetch("/api/trade-republic/mapping", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        headers?: string[];
        mapping?: {
          date?: string;
          amount?: string;
          currency?: string;
          type?: string;
          description?: string;
          isin?: string;
          instrument?: string;
          quantity?: string;
        };
      };
      setMappingHeaders(data.headers ?? []);
      setMapping({
        date: data.mapping?.date ?? "",
        amount: data.mapping?.amount ?? "",
        currency: data.mapping?.currency ?? "",
        type: data.mapping?.type ?? "",
        description: data.mapping?.description ?? "",
        isin: data.mapping?.isin ?? "",
        instrument: data.mapping?.instrument ?? "",
        quantity: data.mapping?.quantity ?? "",
      });
    } catch {
      setMappingHeaders([]);
    }
  };

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(event.target.files ?? []);
    setFiles(list);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setStatus(null);
    const form = new FormData();
    files.forEach((file) => form.append("files", file));

    try {
      const response = await fetch("/api/trade-republic", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setStatus(data.error ?? "Upload failed.");
        return;
      }

      const data = (await response.json()) as { files?: UploadResult[] };
      const uploaded = data.files?.map((entry) => entry.fileName) ?? [];
      setStored((prev) => [...uploaded, ...prev]);
      setFiles([]);
      setStatus("Upload complete.");
      loadMapping();
    } catch (err) {
      console.error(err);
      setStatus("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMapping = async () => {
    setMappingStatus(null);
    try {
      const response = await fetch("/api/trade-republic/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapping),
      });
      if (!response.ok) {
        setMappingStatus("Failed to save mapping.");
        return;
      }
      setMappingStatus("Mapping saved.");
    } catch {
      setMappingStatus("Failed to save mapping.");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Trade Republic Imports</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload Trade Republic CSV exports (trading and card transactions). These files are stored
              separately and are not included in receipt analytics to avoid double counting.
            </p>
          </div>
          <a
            className="rounded border border-border px-3 py-1 text-sm"
            href="/trade-republic/reports"
          >
            View analytics
          </a>
        </div>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                <path d="M10 3l4 4h-3v6H9V7H6l4-4zM4 15h12v2H4v-2z" fill="currentColor" />
              </svg>
            </span>
            Upload CSV exports
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={handleSelect}
              className="text-sm"
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="rounded border border-border px-4 py-2"
            >
              Clear
            </button>
          </div>
          {files.length > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {files.length} file(s) ready to upload.
            </p>
          ) : null}
          {status ? <p className="mt-2 text-sm text-muted-foreground">{status}</p> : null}
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-medium">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                  <path d="M4 6h12v2H4V6zm0 4h8v2H4v-2zm0 4h10v2H4v-2z" fill="currentColor" />
                </svg>
              </span>
              Header mapping
            </h2>
            <button
              type="button"
              onClick={loadMapping}
              className="text-sm text-blue-600 underline"
            >
              Refresh
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            If CSV headers do not match automatically, map them here so analytics can parse the file.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { key: "date", label: "Date" },
              { key: "amount", label: "Amount" },
              { key: "currency", label: "Currency" },
              { key: "type", label: "Type" },
              { key: "description", label: "Description" },
              { key: "isin", label: "ISIN" },
              { key: "instrument", label: "Instrument" },
              { key: "quantity", label: "Quantity" },
            ] as const).map((field) => (
              <label key={field.key} className="text-sm">
                <span className="text-xs text-muted-foreground">{field.label}</span>
                <select
                  value={mapping[field.key]}
                  onChange={(event) =>
                    setMapping((prev) => ({ ...prev, [field.key]: event.target.value }))
                  }
                  className="mt-1 w-full rounded border border-border bg-background px-2 py-1"
                >
                  <option value="">Not mapped</option>
                  {mappingHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveMapping}
              className="rounded bg-primary px-4 py-2 text-sm text-white"
            >
              Save mapping
            </button>
            {mappingStatus ? (
              <span className="text-xs text-muted-foreground">{mappingStatus}</span>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Stored exports</h2>
            <button
              type="button"
              onClick={loadFiles}
              className="text-sm text-blue-600 underline"
            >
              Refresh
            </button>
          </div>
          {stored.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No CSV exports uploaded yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {stored.map((name) => (
                <li key={name} className="flex items-center justify-between gap-2">
                  <span className="truncate">{name}</span>
                  <a
                    className="text-blue-600 underline"
                    href={`/uploads/trade-republic/${encodeURIComponent(name)}`}
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
