import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="grid auto-rows-min gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">4</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Bets</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">12</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">$150</span>
              </CardContent>
            </Card>
          </div>
          <div className="bg-muted/50 min-h-[200px] flex-1 rounded-xl md:min-h-min flex items-center justify-center">
            <span className="text-muted-foreground">
              More dashboard content coming soon...
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
