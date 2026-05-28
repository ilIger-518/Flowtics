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
  }, []);

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
    } catch (err) {
      console.error(err);
      setStatus("Upload failed.");
    } finally {
      setUploading(false);
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
          <h2 className="text-lg font-medium">Upload CSV exports</h2>
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
