import Link from "next/link";
import TradeRepublicDashboard from "@/components/trade-republic/trade-republic-dashboard";
import { getTradeRepublicReportData } from "@/lib/trade-republic";

export default async function TradeRepublicReportsPage() {
  const data = await getTradeRepublicReportData();

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Trade Republic Reports</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Analytics for Trade Republic CSV exports (kept separate from receipts).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link className="text-sm text-blue-600 underline" href="/trade-republic">
              Back to imports
            </Link>
            <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
              Base currency: <span className="font-medium text-foreground">{data.currency}</span>
            </div>
          </div>
        </div>

        <TradeRepublicDashboard data={data} />
      </div>
    </div>
  );
}
