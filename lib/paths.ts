import fs from "fs";
import path from "path";

function resolveRepoRoot(startDir: string = process.cwd()) {
  let current = startDir;
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return startDir;
}

export function resolveUploadsDir() {
  return path.join(resolveRepoRoot(), "uploads");
}

export function resolveReceiptsDir() {
  return path.join(resolveUploadsDir(), "receipts");
}

export function resolveStructuredDir() {
  return path.join(resolveReceiptsDir(), "structured");
}

export function resolveTradeRepublicDir() {
  return path.join(resolveUploadsDir(), "trade-republic");
}
