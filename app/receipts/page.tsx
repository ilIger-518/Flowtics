import ReceiptLibrary from "@/components/receipts/receipt-library";
import { getReceiptSummaries } from "@/lib/receipts";

export default async function ReceiptLibraryPage() {
  const data = await getReceiptSummaries();

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Receipt Library</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Filter receipts by date range, amount, and category. Save views for reuse.
          </p>
        </div>
        <ReceiptLibrary data={data} />
      </div>
    </div>
  );
}
