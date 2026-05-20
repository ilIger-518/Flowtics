import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";

const uploadsDir = path.join(process.cwd(), "uploads");

async function listUploads() {
  try {
    const entries = await fs.readdir(uploadsDir);
    return entries.filter((name) => name !== ".gitkeep").sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

export default async function UploadsPage() {
  const files = await listUploads();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-gray-200 p-6">
        <nav className="flex flex-col gap-3">
          <Link className="text-blue-600" href="/">
            Drop files
          </Link>
          <Link className="font-medium text-gray-900" href="/uploads">
            Uploads
          </Link>
          <Link className="text-blue-600" href="/uploads/receipts">
            Receipts
          </Link>
        </nav>
      </aside>
      <div className="flex-1 p-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Uploads</h1>
            <Link className="rounded border px-3 py-1 text-sm" href="/">
              Home
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Files are saved to the local uploads folder.
          </p>

          {files.length === 0 ? (
            <p className="mt-6 text-gray-600">No uploads yet.</p>
          ) : (
            <ul className="mt-6 space-y-2">
              {files.map((name) => (
                <li key={name} className="flex items-center justify-between gap-4">
                  <span className="truncate">{name}</span>
                  <Link className="text-blue-600 underline" href={`/uploads/${name}`}>
                    Download
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
