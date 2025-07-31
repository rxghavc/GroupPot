"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { PoundSterling, Trophy, XCircle } from "lucide-react";
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
}

const fetcher = (url: string, token: string): Promise<UserBet[]> =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json());

export default function UserBetsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const {
    data: bets = [],
    isLoading: loading,
    mutate,
  } = useSWR<UserBet[]>(
    user && token ? [`/api/users/${user.id}/bets`, token] : null,
    ([url, token]: [string, string]) => fetcher(url, token)
  );

  if (authLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (!user || !token) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">Please log in to view your bets.</p>
        <a href="/login" className="underline text-primary">Login</a>
      </div>
    );
  }

  const activeBets = bets.filter((bet: UserBet) => bet.status !== "settled");
  const pastBets = bets.filter((bet: UserBet) => bet.status === "settled");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Bets</h1>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : bets.length === 0 ? (
        <div className="text-center text-muted-foreground">You haven't placed any bets yet.</div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Active Bets</h2>
          {activeBets.length === 0 ? (
            <div className="text-center text-muted-foreground mb-8">No active bets.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {activeBets.map((bet: UserBet) => (
                <Card key={bet.betId} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold mb-1">{bet.title}</CardTitle>
                    <div className="text-xs text-muted-foreground mb-1">Group: {bet.groupName}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={
                        bet.status === "settled"
                          ? "bg-green-100 text-green-800"
                          : bet.status === "pending"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                      }>
                        {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                      </Badge>
                      {bet.result === "won" && <Trophy className="w-4 h-4 text-green-600" />}
                      {bet.result === "lost" && <XCircle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">Deadline: {new Date(bet.deadline).toLocaleDateString()}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-medium">Your Pick{bet.userVotes.length > 1 ? 's' : ''}:</div>
                      <ul className="mb-2">
                        {bet.userVotes.map((vote) => (
                          <li key={vote.optionId} className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">{vote.optionText}</span>
                            <span className="text-xs text-muted-foreground">(£{vote.stake})</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-2 text-sm">
                        <PoundSterling className="w-4 h-4" />
                        <span>Total Stake: £{bet.userVotes.reduce((sum, v) => sum + v.stake, 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Result: {bet.result.charAt(0).toUpperCase() + bet.result.slice(1)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <h2 className="text-xl font-semibold mb-4">Past Bets</h2>
          {pastBets.length === 0 ? (
            <div className="text-center text-muted-foreground">No past bets.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pastBets.map((bet: UserBet) => (
                <Card key={bet.betId} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold mb-1">{bet.title}</CardTitle>
                    <div className="text-xs text-muted-foreground mb-1">Group: {bet.groupName}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-green-100 text-green-800">Settled</Badge>
                      {bet.result === "won" && <Trophy className="w-4 h-4 text-green-600" />}
                      {bet.result === "lost" && <XCircle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">Deadline: {new Date(bet.deadline).toLocaleDateString()}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-medium">Your Pick{bet.userVotes.length > 1 ? 's' : ''}:</div>
                      <ul className="mb-2">
                        {bet.userVotes.map((vote) => (
                          <li key={vote.optionId} className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">{vote.optionText}</span>
                            <span className="text-xs text-muted-foreground">(£{vote.stake})</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-2 text-sm">
                        <PoundSterling className="w-4 h-4" />
                        <span>Total Stake: £{bet.userVotes.reduce((sum, v) => sum + v.stake, 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4" />
                        <span>Payout: £{bet.payout}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Result: {bet.result.charAt(0).toUpperCase() + bet.result.slice(1)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 