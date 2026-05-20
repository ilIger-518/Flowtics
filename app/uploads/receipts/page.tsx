import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";

const receiptsDir = path.join(process.cwd(), "uploads", "receipts");
const structuredDir = path.join(receiptsDir, "structured");

async function listFiles(dir: string) {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((name) => name !== ".gitkeep").sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

export default async function ReceiptsPage() {
  const [rawFiles, structuredFiles] = await Promise.all([
    listFiles(receiptsDir),
    listFiles(structuredDir),
  ]);

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Receipts</h1>
          <Link className="rounded border px-3 py-1 text-sm" href="/">
            Home
          </Link>
        </div>

          <p className="mt-2 text-sm text-gray-600">
            Raw OCR JSON and structured JSON outputs per upload.
          </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="text-lg font-medium">Raw OCR</h2>
            {rawFiles.length === 0 ? (
              <p className="mt-2 text-gray-600">No OCR files yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {rawFiles.map((name) => (
                  <li key={name} className="flex items-center justify-between gap-4">
                    <span className="truncate">{name}</span>
                    <Link className="text-blue-600 underline" href={`/uploads/receipts/${name}`}>
                      Download
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium">Structured</h2>
            {structuredFiles.length === 0 ? (
              <p className="mt-2 text-gray-600">No structured files yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {structuredFiles.map((name) => (
                  <li key={name} className="flex items-center justify-between gap-4">
                    <span className="truncate">{name}</span>
                    <Link
                      className="text-blue-600 underline"
                      href={`/uploads/receipts/structured/${name}`}
                    >
                      Download
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
