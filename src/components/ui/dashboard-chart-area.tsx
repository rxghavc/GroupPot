"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Cumulative group wagers and payouts over time"

const chartConfig = {
  wagers: {
    label: "Total Wagers",
    color: "#10b981", // emerald
  },
  payouts: {
    label: "Total Payouts",
    color: "#3b82f6", // blue
  },
} satisfies ChartConfig

export function ChartAreaBets({ wagersList = [], payoutsList = [] }: { wagersList?: { date: string, amount: number }[]; payoutsList?: { date: string, amount: number }[] }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Build a date-indexed map for wagers and payouts
  const wagersByDate: Record<string, number> = {}
  for (const w of wagersList) {
    if (!wagersByDate[w.date]) wagersByDate[w.date] = 0
    wagersByDate[w.date] += w.amount
  }
  const payoutsByDate: Record<string, number> = {}
  for (const p of payoutsList) {
    if (!payoutsByDate[p.date]) payoutsByDate[p.date] = 0
    payoutsByDate[p.date] += p.amount
  }

  // Build a list of all dates in either wagers or payouts
  const allDates = Array.from(new Set([
    ...Object.keys(wagersByDate),
    ...Object.keys(payoutsByDate),
  ])).sort()

  // Build cumulative chart data for each date
  let runningWagers = 0
  let runningPayouts = 0
  const liveChartData = allDates.map(date => {
    runningWagers += wagersByDate[date] || 0
    runningPayouts += payoutsByDate[date] || 0
    return {
      date,
      wagers: runningWagers,
      payouts: runningPayouts,
      net: runningWagers - runningPayouts,
    }
  })

  // Use today as the reference date (ignore future data)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const referenceDate = today
  let daysToSubtract = 90
  if (timeRange === "30d") daysToSubtract = 30
  else if (timeRange === "7d") daysToSubtract = 7
  const startDate = new Date(referenceDate)
  startDate.setDate(startDate.getDate() - daysToSubtract)
  const filteredData = liveChartData.filter(item => {
    const date = new Date(item.date)
    return date >= startDate && date <= referenceDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Cumulative Wagers & Payouts
          <span className="relative group">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block align-middle text-muted-foreground cursor-pointer"><circle cx="12" cy="12" r="10" strokeWidth="2" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text></svg>
            <span className="absolute left-1/2 z-10 hidden w-64 -translate-x-1/2 rounded bg-background px-3 py-2 text-xs text-foreground shadow-lg group-hover:block border border-border top-6">
              This chart shows the cumulative totals for group wagers and payouts over time.
            </span>
          </span>
        </CardTitle>
        <CardDescription>
          {timeRange === "90d" && (
            <>
              <span className="hidden @[540px]/card:block">Last 3 months</span>
              <span className="@[540px]/card:hidden">Last 3 months</span>
            </>
          )}
          {timeRange === "30d" && (
            <>
              <span className="hidden @[540px]/card:block">Last 30 days</span>
              <span className="@[540px]/card:hidden">Last 30 days</span>
            </>
          )}
          {timeRange === "7d" && (
            <>
              <span className="hidden @[540px]/card:block">Last 7 days</span>
              <span className="@[540px]/card:hidden">Last 7 days</span>
            </>
          )}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillWagers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillPayouts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="wagers"
              type="natural"
              fill="url(#fillWagers)"
              stroke="#10b981"
            />
            <Area
              dataKey="payouts"
              type="natural"
              fill="url(#fillPayouts)"
              stroke="#3b82f6"
            />
          </AreaChart>
        </ChartContainer>
        <div className="flex gap-4 mt-2 text-xs items-center">
          <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm" style={{background:'#10b981'}}></span>Wagers</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm" style={{background:'#3b82f6'}}></span>Payouts</span>
        </div>
      </CardContent>
    </Card>
  )
}
