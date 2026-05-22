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
            <p className="text-sm text-muted-foreground">Uploads</p>
            <p className="mt-2 text-2xl font-semibold">{uploadCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">OCR Files</p>
            <p className="mt-2 text-2xl font-semibold">{ocrCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Structured</p>
            <p className="mt-2 text-2xl font-semibold">{structuredCount}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
