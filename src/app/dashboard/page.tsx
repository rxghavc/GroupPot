"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardTable } from "@/components/ui/dashboard-table"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"

interface DashboardStats {
  totalGroups: number;
  activeBets: number;
  totalLifetimeBets: number;
  pendingPayouts: number;
  mostActiveGroup: string;
  lastJoined: string;
  mostRecentBet: string;
  biggestWager: number;
  nextPayout: string;
  unclaimed: number;
}

const fetcher = (url: string, token: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json());

export default function Page() {
  const { user, token, loading: authLoading } = useAuth();

  // Don't make any decisions while auth is loading
  if (authLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-full w-full animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-8 bg-muted rounded w-16 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-32 mb-2"></div>
                <div className="h-3 bg-muted rounded w-48"></div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
            
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-40 mb-2"></div>
                <div className="h-3 bg-muted rounded w-56"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-8"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-muted rounded w-40"></div>
                    <div className="h-3 bg-muted rounded w-12"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-80"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Only show login screen if we're sure the user is not authenticated
  if (!user || !token) {
    return (
      <div className="w-full flex flex-col items-center gap-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Login Required</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Please log in to view your dashboard.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <a href="/login">Login</a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/signup">Create Account</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Now we can safely use SWR hooks since we know user and token exist
  return <DashboardContent user={user} token={token} />;
}

function DashboardContent({ user, token }: { user: any; token: string }) {
  const {
    data: stats,
    isLoading: statsLoading,
  } = useSWR<DashboardStats>(
    [`/api/dashboard/stats`, token],
    ([url, token]: [string, string]) => fetcher(url, token)
  );

  const {
    data: userBets,
    isLoading: userBetsLoading,
  } = useSWR<any[]>(
    [`/api/users/${user.id}/bets`, token],
    ([url, token]: [string, string]) => fetcher(url, token)
  );

  // Calculate profit from user bets data (payout minus stake)
  const totalProfit = userBets 
    ? userBets
        .filter((bet: any) => bet.result === 'won' && bet.status === 'settled')
        .reduce((sum: number, bet: any) => {
          const payout = parseFloat(bet.payout);
          const totalStake = bet.userVotes.reduce((stakeSum: number, vote: any) => stakeSum + vote.stake, 0);
          return sum + (payout - totalStake); // Profit = payout - stake
        }, 0)
    : 0;

  // Transform user bets data to match DashboardTable format
  const dashboardTableData = userBets 
    ? userBets.map((bet: any) => {
        const totalWager = bet.userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0);
        const statusMap: { [key: string]: string } = {
          'won': 'Won',
          'lost': 'Lost',
          'pending': 'Open'
        };
        
        return {
          date: new Date(bet.deadline).toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit',
            year: 'numeric' 
          }),
          group: bet.groupName || 'Unknown',
          bet: bet.title || 'Unknown Bet',
          wager: totalWager,
          payout: bet.result === 'won' ? parseFloat(bet.payout) : (bet.result === 'lost' ? 0 : totalWager),
          status: statusMap[bet.result] || 'Open'
        };
      })
    : [];

  const loading = statsLoading || userBetsLoading;
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card className="h-full w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Total Groups</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">The number of groups you belong to.</p>
              <span className="block text-3xl font-bold text-primary mt-2">
                {loading ? "..." : stats?.totalGroups || 0}
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                  Most active: <span className="font-semibold text-foreground">
                    {loading ? "Loading..." : stats?.mostActiveGroup || "None"}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  Last joined: <span className="font-semibold text-foreground">
                    {loading ? "Loading..." : stats?.lastJoined || "Never"}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="h-full w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Active Bets</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Bets currently open or in progress.</p>
              <span className="block text-3xl font-bold text-green-700 mt-2">
                {loading ? "..." : stats?.activeBets || 0}
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                  Most recent: <span className="font-semibold text-foreground">
                    {loading ? "Loading..." : stats?.mostRecentBet || "None"}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  Biggest wager: <span className="font-semibold text-foreground">
                    £{loading ? "..." : stats?.biggestWager || 0}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="h-full w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Total Profit</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Net winnings from settled bets.</p>
              <span className="block text-3xl font-bold text-yellow-700 mt-2">
                £{loading ? "..." : totalProfit.toFixed(2) || "0.00"}
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                  Best win: <span className="font-semibold text-foreground">
                    {loading ? "Loading..." : "£" + (userBets ? Math.max(...userBets.filter((bet: any) => bet.result === 'won').map((bet: any) => parseFloat(bet.payout) - bet.userVotes.reduce((sum: number, vote: any) => sum + vote.stake, 0)), 0).toFixed(2) : "0.00")}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  Win rate: <span className="font-semibold text-foreground">
                    {loading ? "Loading..." : userBets && userBets.length > 0 ? Math.round((userBets.filter((bet: any) => bet.result === 'won').length / userBets.length) * 100) + "%" : "0%"}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Jump to important areas</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-16 flex-col gap-1">
                <a href="/groups">
                  <div className="text-lg">📊</div>
                  <span className="text-sm">Browse Groups</span>
                </a>
              </Button>
              <Button asChild variant="outline" className="h-16 flex-col gap-1">
                <a href="/bets">
                  <div className="text-lg">💰</div>
                  <span className="text-sm">My Bets</span>
                </a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <p className="text-sm text-muted-foreground">Your recent betting activity</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Lifetime Bets</span>
                  <span className="font-semibold">{loading ? "..." : stats?.totalLifetimeBets || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Groups Joined</span>
                  <span className="font-semibold">{loading ? "..." : stats?.totalGroups || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Biggest Single Wager</span>
                  <span className="font-semibold">£{loading ? "..." : stats?.biggestWager || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="overflow-x-auto">
          <CardHeader>
            <CardTitle>Recent Bets</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">A list of your most recent bets, including wager, payout, and status.</p>
          </CardHeader>
          <CardContent>
            <DashboardTable data={dashboardTableData} loading={userBetsLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
