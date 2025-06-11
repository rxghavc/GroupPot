import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartAreaBets } from "@/components/ui/dashboard-chart-area"
import { DashboardTable } from "@/components/ui/dashboard-table"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card className="h-full w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Total Groups</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">The number of groups you belong to.</p>
              <span className="block text-3xl font-bold text-primary mt-2">4</span>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Most active: <span className="font-semibold text-foreground">NBA Finals</span></span>
                <span className="text-sm text-muted-foreground">Last joined: <span className="font-semibold text-foreground">May 2025</span></span>
              </div>
            </CardContent>
          </Card>
          <Card className="h-full w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Active Bets</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Bets currently open or in progress.</p>
              <span className="block text-3xl font-bold text-green-700 mt-2">12</span>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Most recent: <span className="font-semibold text-foreground">Lakers vs Celtics</span></span>
                <span className="text-sm text-muted-foreground">Biggest wager: <span className="font-semibold text-foreground">$100</span></span>
              </div>
            </CardContent>
          </Card>
          <Card className="h-full w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Pending Payouts</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Total value of payouts awaiting claim.</p>
              <span className="block text-3xl font-bold text-yellow-700 mt-2">$150</span>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Next payout: <span className="font-semibold text-foreground">June 15, 2025</span></span>
                <span className="text-sm text-muted-foreground">Unclaimed: <span className="font-semibold text-foreground">$50</span></span>
              </div>
            </CardContent>
          </Card>
        </div>
        <ChartAreaBets 
          wagersList={[
            { date: "2025-04-01", amount: 50 },
            { date: "2025-04-03", amount: 20 },
            { date: "2025-04-10", amount: 100 },
            { date: "2025-04-15", amount: 40 },
            { date: "2025-04-20", amount: 60 },
            { date: "2025-05-01", amount: 80 },
            { date: "2025-05-10", amount: 30 },
            { date: "2025-05-20", amount: 90 },
            { date: "2025-06-01", amount: 70 },
          ]}
          payoutsList={[
            { date: "2025-04-05", amount: 10 },
            { date: "2025-04-12", amount: 30 },
            { date: "2025-04-18", amount: 20 },
            { date: "2025-05-05", amount: 50 },
            { date: "2025-05-15", amount: 40 },
            { date: "2025-06-03", amount: 60 },
            { date: "2025-06-10", amount: 80 },
            { date: "2025-06-20", amount: 90 },
            { date: "2025-09-01", amount: 100 },
          ]}
        />
        <Card className="overflow-x-auto">
          <CardHeader>
            <CardTitle>Recent Bets</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">A list of your most recent bets, including wager, payout, and status.</p>
          </CardHeader>
          <CardContent>
            <DashboardTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
