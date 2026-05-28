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
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            Base currency: <span className="font-medium text-foreground">{data.currency}</span>
          </div>
        </div>

        <ReportsDashboard data={data} />
      </div>
    </div>
  );
}
