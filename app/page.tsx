import { promises as fs } from "fs";
import Link from "next/link";
import {
  resolveUploadsDir,
  resolveReceiptsDir,
  resolveStructuredDir,
} from "@/lib/paths";

const uploadsDir = resolveUploadsDir();
const receiptsDir = resolveReceiptsDir();
const structuredDir = resolveStructuredDir();

async function countFiles(dir: string) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).length;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return 0;
    }
    throw err;
  }
}

export default async function Page() {
  const [uploadCount, ocrCount, structuredCount] = await Promise.all([
    countFiles(uploadsDir),
    countFiles(receiptsDir),
    countFiles(structuredDir),
  ]);

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Receipt pipeline overview and quick actions.
            </p>
          </div>
          <Link className="rounded border px-3 py-1 text-sm" href="/drop">
            Drop files
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Uploads</p>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                  <path d="M10 3l4 4h-3v6H9V7H6l4-4zM4 15h12v2H4v-2z" fill="currentColor" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{uploadCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">OCR Files</p>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                  <path d="M6 3h6l4 4v10H6V3zm6 1.5V8h3.5L12 4.5zM8 11h6v2H8v-2z" fill="currentColor" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{ocrCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Structured</p>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                  <path d="M4 5h12v10H4V5zm2 2v6h2V7H6zm4 0v6h2V7h-2zm4 0v6h2V7h-2z" fill="currentColor" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{structuredCount}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/reports"
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary"
          >
            <h2 className="text-lg font-medium">Reports</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Track spend by day, week, month, and category.
            </p>
          </Link>
          <Link
            href="/receipts"
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary"
          >
            <h2 className="text-lg font-medium">Receipt library</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Filter receipts by date, amount, and category.
            </p>
          </Link>
          <Link
            href="/uploads"
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary"
          >
            <h2 className="text-lg font-medium">Browse uploads</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Download original images and files.
            </p>
          </Link>
          <Link
            href="/uploads/receipts"
            className="rounded-lg border border-border bg-card p-4 transition hover:border-primary"
          >
            <h2 className="text-lg font-medium">Receipt outputs</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              View OCR and structured JSON exports.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
