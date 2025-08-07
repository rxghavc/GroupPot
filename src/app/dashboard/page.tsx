"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardTable } from "@/components/ui/dashboard-table"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, TrendingUp, Plus, Search } from "lucide-react"
import { FaUserFriends } from "react-icons/fa"

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

  /* Keeping this code for future use - Recent Bets Table functionality
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
        
        // Determine status based on bet.status first, then bet.result for settled bets
        let displayStatus = 'Open';
        if (bet.status === 'settled') {
          // For settled bets, show the user's result
          const resultMap: { [key: string]: string } = {
            'won': 'Won',
            'lost': 'Lost',
            'refund': 'Refunded'
          };
          displayStatus = resultMap[bet.result] || 'Settled';
        } else if (bet.status === 'closed') {
          displayStatus = 'Closed';
        } else if (bet.status === 'open') {
          displayStatus = 'Open';
        }
        
        return {
          date: new Date(bet.deadline).toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit',
            year: 'numeric' 
          }),
          group: bet.groupName || 'Unknown',
          bet: bet.title || 'Unknown Bet',
          wager: totalWager,
          payout: bet.status === 'settled' ? parseFloat(bet.payout) : (bet.status === 'open' ? totalWager : 0),
          status: displayStatus
        };
      })
    : [];
  */

  // Simplified version without user bets data
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

  const loading = statsLoading;
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
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                Quick Actions
              </CardTitle>
              <p className="text-sm text-muted-foreground">Jump to important areas and get started</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-20 flex-col gap-2 group hover:bg-primary/5 hover:border-primary/20 transition-all duration-200">
                <a href="/groups">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">Browse Groups</div>
                  </div>
                </a>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2 group hover:bg-primary/5 hover:border-primary/20 transition-all duration-200">
                <a href="/bets">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">My Bets</div>
                  </div>
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
        
        {/* Welcome Message Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <FaUserFriends className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Welcome to FriendsSplit!
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 max-w-2xl mx-auto">
                  Ready to test your prediction skills? Join betting groups with your friends, place strategic wagers, and see who comes out on top. 
                  Track your performance, analyze your wins, and enjoy the thrill of friendly competition!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
