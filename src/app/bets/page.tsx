"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PoundSterling, Trophy, XCircle, TrendingUp, TrendingDown, BarChart3, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Line, LineChart } from "recharts";
import useSWR from "swr";

interface UserVote {
  optionId: string;
  optionText: string;
  stake: number;
  result: string;
}

interface UserBet {
  betId: string;
  title: string;
  result: string;
  userVotes: UserVote[];
  payout: string;
  status: string;
  deadline: string;
  groupName: string;
  isRefund?: boolean;
}

const fetcher = (url: string, token: string): Promise<UserBet[]> =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json());

export default function UserBetsPage() {
  const { user, token, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-9 bg-muted rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-5 bg-muted rounded w-96 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
              <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Financial Overview Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-4 w-4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart Skeleton */}
          <Card className="mb-8 animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-64"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] bg-muted rounded"></div>
            </CardContent>
          </Card>

          {/* Active Bets Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-32 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-40 mb-2"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-5 bg-muted rounded w-20"></div>
                      <div className="h-5 bg-muted rounded w-16"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user || !token) {
    return (
      <div className="w-full flex flex-col items-center gap-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Login Required</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Please log in to view your betting portfolio.
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

  // Now we can safely use the component that needs authentication
  return <BetsContent user={user} token={token} />;
}

function BetsContent({ user, token }: { user: any; token: string }) {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"overview" | "history">("overview");
  
  const {
    data: bets = [],
    isLoading: loading,
    mutate,
  } = useSWR<UserBet[]>(
    [`/api/users/${user.id}/bets`, token],
    ([url, token]: [string, string]) => fetcher(url, token)
  );

  const activeBets = bets.filter((bet: UserBet) => bet.status !== "settled");
  const pastBets = bets.filter((bet: UserBet) => bet.status === "settled");
  const uniqueGroups = [...new Set(bets.map(bet => bet.groupName))];

  // Financial calculations
  const totalActiveStake = activeBets.reduce((sum, bet) => 
    sum + bet.userVotes.reduce((voteSum, vote) => voteSum + vote.stake, 0), 0
  );
  
  const totalLifetimeStake = bets.reduce((sum, bet) => 
    sum + bet.userVotes.reduce((voteSum, vote) => voteSum + vote.stake, 0), 0
  );
  
  const totalWinnings = pastBets.reduce((sum, bet) => 
    sum + (bet.result === "won" ? parseFloat(bet.payout) : bet.isRefund ? parseFloat(bet.payout) : 0), 0
  );
  
  const totalLosses = pastBets.reduce((sum, bet) => 
    sum + (bet.result === "lost" ? bet.userVotes.reduce((voteSum, vote) => voteSum + vote.stake, 0) : 0), 0
  );

  const totalPastStakes = pastBets.reduce((sum, bet) => 
    sum + bet.userVotes.reduce((voteSum, vote) => voteSum + vote.stake, 0), 0
  );
  
  const netProfit = totalWinnings - totalPastStakes;
  const winRate = pastBets.filter(bet => bet.result !== 'refund').length > 0 ? (pastBets.filter(bet => bet.result === "won").length / pastBets.filter(bet => bet.result !== 'refund').length) * 100 : 0;

  // Chart data preparation
  const chartData = pastBets
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .map((bet, index) => {
      const stake = bet.userVotes.reduce((sum, vote) => sum + vote.stake, 0);
      const profit = bet.result === "won" 
        ? parseFloat(bet.payout) - stake 
        : bet.isRefund 
          ? 0 
          : -stake;
      
      return {
        bet: bet.title.substring(0, 15) + "...",
        profit: profit,
        stake: stake,
        payout: bet.result === "won" || bet.isRefund ? parseFloat(bet.payout) : 0,
        date: new Date(bet.deadline).toLocaleDateString(),
        group: bet.groupName
      };
    });

  // Filter data based on selected group
  const filteredBets = selectedGroup === "all" ? bets : bets.filter(bet => bet.groupName === selectedGroup);
  const filteredActiveBets = selectedGroup === "all" ? activeBets : activeBets.filter(bet => bet.groupName === selectedGroup);
  const filteredPastBets = selectedGroup === "all" ? pastBets : pastBets.filter(bet => bet.groupName === selectedGroup);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Betting Portfolio</h1>
            <p className="text-muted-foreground mt-1">Track your bets, analyze performance, and manage your stakes</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {uniqueGroups.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "overview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("overview")}
              >
                Overview
              </Button>
              <Button
                variant={viewMode === "history" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("history")}
              >
                History
              </Button>
            </div>
          </div>
        </div>

      {loading ? (
        <div className="text-center py-12">Loading your betting data...</div>
      ) : bets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Trophy className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Bets Yet</h3>
            <p className="text-muted-foreground mb-4">Start betting to see your portfolio analytics here!</p>
            <Button asChild>
              <a href="/groups">Browse Groups</a>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "overview" ? (
        <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Stakes</CardTitle>
                <PoundSterling className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{totalActiveStake.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredActiveBets.length} active bet{filteredActiveBets.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
                {netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}£{netProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((netProfit / totalLifetimeStake) * 100).toFixed(1)}% ROI
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {pastBets.filter(bet => bet.result === "won").length} of {pastBets.length} won
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{totalLifetimeStake.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Across {bets.length} bet{bets.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profit/Loss Chart */}
          {chartData.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Betting Performance Over Time</CardTitle>
                <p className="text-sm text-muted-foreground">Your profit/loss for each completed bet</p>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="bet" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{data.bet}</p>
                                <p className="text-sm text-muted-foreground">Group: {data.group}</p>
                                <p className="text-sm text-muted-foreground">Date: {data.date}</p>
                                <p className="text-sm">Stake: £{data.stake}</p>
                                <p className="text-sm">Payout: £{data.payout}</p>
                                <p className={`text-sm font-medium ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  Profit: {data.profit >= 0 ? '+' : ''}£{data.profit.toFixed(2)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="profit" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Bets Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <PoundSterling className="w-6 h-6" />
              Active Bets
            </h2>
            {filteredActiveBets.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                    <PoundSterling className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-muted-foreground">No active bets in {selectedGroup === "all" ? "any group" : selectedGroup}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActiveBets.map((bet: UserBet) => (
                  <Card key={bet.betId} className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold mb-1">{bet.title}</CardTitle>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {bet.groupName}
                        </Badge>
                        <Badge className="bg-orange-100 text-orange-800">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Your Picks:</p>
                          {bet.userVotes.map((vote) => (
                            <div key={vote.optionId} className="flex justify-between items-center text-sm">
                              <span>{vote.optionText}</span>
                              <span className="font-semibold">£{vote.stake}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-medium">Total Stake:</span>
                          <span className="font-bold">£{bet.userVotes.reduce((sum, v) => sum + v.stake, 0)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Deadline: {new Date(bet.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* History View */
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Betting History
          </h2>
          {filteredPastBets.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-muted-foreground">No betting history in {selectedGroup === "all" ? "any group" : selectedGroup}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPastBets.map((bet: UserBet) => (
                <Card key={bet.betId} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold mb-1">{bet.title}</CardTitle>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {bet.groupName}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Settled</Badge>
                        {bet.isRefund && <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>}
                        {bet.result === "won" && <Trophy className="w-4 h-4 text-green-600" />}
                        {bet.result === "lost" && <XCircle className="w-4 h-4 text-red-600" />}
                        {bet.result === "refund" && <TrendingUp className="w-4 h-4 text-blue-600" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Your Picks:</p>
                        {bet.userVotes.map((vote) => (
                          <div key={vote.optionId} className="flex justify-between items-center text-sm">
                            <span className={vote.result === "won" ? "text-green-600 font-medium" : ""}>
                              {vote.optionText}
                            </span>
                            <span className="font-semibold">£{vote.stake}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1 pt-2 border-t">
                        <div className="flex justify-between items-center text-sm">
                          <span>Total Stake:</span>
                          <span className="font-semibold">£{bet.userVotes.reduce((sum, v) => sum + v.stake, 0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Payout:</span>
                          <span className="font-semibold">£{bet.payout}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium">
                          <span>Net:</span>
                          <span className={
                            bet.result === "refund" 
                              ? "text-blue-600" 
                              : bet.result === "won" 
                                ? "text-green-600" 
                                : "text-red-600"
                          }>
                            {bet.result === "refund" 
                              ? "±£0.00 (Refunded)"
                              : bet.result === "won" 
                                ? "+"
                                : "-"
                            }
                            {bet.result !== "refund" && (
                              <>
                                £{
                                  bet.result === "won" 
                                    ? (parseFloat(bet.payout) - bet.userVotes.reduce((sum, v) => sum + v.stake, 0)).toFixed(2)
                                    : bet.userVotes.reduce((sum, v) => sum + v.stake, 0).toFixed(2)
                                }
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Settled: {new Date(bet.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
} 