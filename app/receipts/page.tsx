import ReceiptLibrary from "@/components/receipts/receipt-library";
import { getReceiptSummaries } from "@/lib/receipts";

export default async function ReceiptLibraryPage() {
  const data = await getReceiptSummaries();

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
                <path d="M5 3h10l-1 14-2-1-2 1-2-1-2 1-1-14zm2 4h6v2H7V7zm0 4h6v2H7v-2z" fill="currentColor" />
              </svg>
            </span>
            Receipt Library
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Filter receipts by date range, amount, and category. Save views for reuse.
          </p>
        </div>
        <ReceiptLibrary data={data} />
      </div>
    </div>
  );
}
