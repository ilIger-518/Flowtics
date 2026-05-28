import ReportsDashboard from "@/components/reports/reports-dashboard";
import { getReportData } from "@/lib/reports";

export default async function ReportsPage() {
  const data = await getReportData();

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Reports</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Spend analytics derived from structured receipts.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                <path d="M5 6h10v2H5V6zm0 6h10v2H5v-2zM4 9h12v2H4V9z" fill="currentColor" />
              </svg>
            </span>
            <span>
              Base currency: <span className="font-medium text-foreground">{data.currency}</span>
            </span>
          </div>
        </div>

        <ReportsDashboard data={data} />
      </div>
    </div>
  );
}
