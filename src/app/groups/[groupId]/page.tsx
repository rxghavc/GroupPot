"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Users, PoundSterling, Eye, Copy, Check } from "lucide-react";
import { Group, Bet, BetResult } from "@/lib/types";
import { BetCard } from "@/components/ui/BetCard";
import { BetForm } from "@/components/ui/BetForm";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { AutoRefreshIndicator } from "@/components/ui/auto-refresh-indicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GroupDetailsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [results, setResults] = useState<Map<string, BetResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showCreateBet, setShowCreateBet] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"error" | "success">("error");
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [pendingSettleOption, setPendingSettleOption] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Auto-refresh functionality
  const {
    refreshing,
    autoRefreshPaused,
    lastRefresh,
    manualRefresh,
    pauseAutoRefresh,
    resetUserActivity
  } = useAutoRefresh({
    enabled: !authLoading && !!user && !!token && !!groupId,
    onRefresh: fetchGroupData
  });

  useEffect(() => {
    // Await params for Next.js 15 compatibility
    params.then(({ groupId: id }) => {
      setGroupId(id);
      // Trigger fetch immediately if auth is ready
      if (!authLoading && user && token) {
        fetchGroupData();
      }
    });
  }, [params, authLoading, user, token]);

  // Fallback fetch if the above didn't trigger
  useEffect(() => {
    if (!authLoading && user && token && groupId && !group) {
      fetchGroupData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [groupId, user, token, authLoading, group]);

  async function fetchGroupData() {
    if (!groupId) return;
    
    setIsFetching(true);
    try {
      // Fetch group details and bets in parallel
      const [groupResponse, betsResponse] = await Promise.all([
        fetch(`/api/groups/${groupId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`/api/groups/${groupId}/bets`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);
      
      // Handle group response
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroup(groupData.group);
        
        // Check if current user is moderator
        setIsModerator(
          groupData.group.ownerId === user?.id || 
          groupData.group.moderators.includes(user?.id)
        );
      } else if (groupResponse.status === 404) {
        // Group not found - might have been deleted
        router.push('/groups');
        return;
      }

      // Handle bets response
      if (betsResponse.ok) {
        const betsData = await betsResponse.json();
        setBets(betsData.bets);
        
        // Fetch results for settled bets in parallel
        const settledBets = betsData.bets.filter((bet: Bet) => bet.status === 'settled');
        if (settledBets.length > 0) {
          const resultPromises = settledBets.map(async (bet: Bet) => {
            try {
              const resultResponse = await fetch(`/api/bets/${bet.id}/payouts`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (resultResponse.ok) {
                const resultData = await resultResponse.json();
                return { betId: bet.id, result: resultData.result };
              }
            } catch (error) {
              console.error(`Failed to fetch results for bet ${bet.id}:`, error);
            }
            return null;
          });

          const results = await Promise.all(resultPromises);
          const newResults = new Map();
          results.forEach((item) => {
            if (item) {
              newResults.set(item.betId, item.result);
            }
          });
          setResults(newResults);
        }
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }

  // Form handlers that pause auto-refresh
  const handleOpenCreateBet = () => {
    pauseAutoRefresh();
    setShowCreateBet(true);
  };

  const handleCloseCreateBet = () => {
    setShowCreateBet(false);
    resetUserActivity(); // Resume auto-refresh
  };

  const handleOpenMembers = () => {
    pauseAutoRefresh();
    setShowMembers(true);
  };

  const handleCloseMembers = () => {
    setShowMembers(false);
    resetUserActivity(); // Resume auto-refresh
  };

  async function handleCreateBet(betData: {
    title: string;
    description: string;
    options: string[];
    deadline: string;
    minStake: number;
    maxStake: number;
  }) {
    if (!groupId) return;
    
    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...betData,
          groupId: groupId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBets([...bets, data.bet]);
        setShowCreateBet(false);
        resetUserActivity(); // Resume auto-refresh after successful creation
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to create bet');
      }
    } catch (error) {
      console.error('Error creating bet:', error);
      showAlert('Failed to create bet');
    }
  }

  async function handleVote(voteData: { optionId: string; stake: number }) {
    try {
      // Find the bet that contains this option
      const bet = bets.find(b => b.options.some(opt => opt.id === voteData.optionId));
      if (!bet) return;

      const response = await fetch(`/api/bets/${bet.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(voteData),
      });

      if (response.ok) {
        // Refresh the bets to show updated vote counts
        fetchGroupData();
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to place vote');
      }
    } catch (error) {
      console.error('Error placing vote:', error);
      showAlert('Failed to place vote');
    }
  }

  async function handleSettle(winningOptionId: string) {
    try {
      // Find the bet that contains this option
      const bet = bets.find(b => b.options.some(opt => opt.id === winningOptionId));
      if (!bet) return;

      const response = await fetch(`/api/bets/${bet.id}/outcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ winningOptionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => new Map(prev).set(bet.id, data.result));
        // Refresh the bets to show updated status
        fetchGroupData();
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to settle bet');
      }
    } catch (error) {
      console.error('Error settling bet:', error);
      showAlert('Failed to settle bet');
    }
  }

  // Copy group code to clipboard
  const handleCopyCode = async () => {
    if (!group) return;
    
    try {
      await navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy group code:', error);
    }
  };

  // Show alert message
  const showAlert = (message: string, type: "error" | "success" = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => setAlertMessage(""), 5000); // Auto-hide after 5 seconds
  };

  // Handle settle confirmation
  const handleSettleConfirm = (winningOptionId: string) => {
    setPendingSettleOption(winningOptionId);
    setSettleDialogOpen(true);
  };

  const handleSettleConfirmed = async () => {
    if (!pendingSettleOption) return;
    
    setSettleDialogOpen(false);
    await handleSettle(pendingSettleOption);
    setPendingSettleOption(null);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-full mx-auto px-2 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
        </Card>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user || !token) {
    return (
      <div className="w-full mx-auto px-2 flex flex-col gap-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please log in to view this group</p>
            <Button asChild>
              <a href="/login">Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !refreshing && !group) {
    return (
      <div className="w-full mx-auto px-2 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
        </Card>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="w-full mx-auto px-2 flex flex-col gap-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Group not found</p>
            <Button 
              variant="outline" 
              onClick={() => router.push("/groups")}
              className="mt-4"
            >
              Back to Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-2 flex flex-col gap-8">
      {/* Alert Messages */}
      {alertMessage && (
        <Alert variant={alertType === "error" ? "destructive" : "default"}>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      {/* Group Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{group.name}</CardTitle>
              <p className="text-muted-foreground mt-1">{group.description}</p>
              <AutoRefreshIndicator
                refreshing={refreshing || isFetching}
                autoRefreshPaused={autoRefreshPaused}
                lastRefresh={lastRefresh}
                onManualRefresh={manualRefresh}
                showButton={false}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PoundSterling className="w-4 h-4" />
                <span>£{group.minStake}-£{group.maxStake}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">Group Code: </span>
                <span className="font-mono font-bold">{group.code}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-6 w-6 p-0"
                  title="Copy group code"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleOpenMembers}
                className="flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                View Members
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <AutoRefreshIndicator
                refreshing={refreshing || isFetching}
                autoRefreshPaused={autoRefreshPaused}
                lastRefresh={lastRefresh}
                onManualRefresh={manualRefresh}
                showButton={true}
                showStatus={false}
              />
              {isModerator && (
                <Button onClick={handleOpenCreateBet} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Bet
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Members Dialog */}
      <Dialog open={showMembers} onOpenChange={handleCloseMembers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {group.members.map((member: any) => (
              <div key={member._id || member.id} className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium">{member.username}</span>
                <span className="text-sm text-muted-foreground">{member.email}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Bet Dialog */}
      {showCreateBet && (
        <BetForm
          groupId={group.id}
          groupMinStake={group.minStake}
          groupMaxStake={group.maxStake}
          onSubmit={handleCreateBet}
          onCancel={handleCloseCreateBet}
        />
      )}

      {/* Bets Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Bets</h2>
        {loading && !group ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No active bets</p>
            </CardContent>
          </Card>
        ) : (
          bets.map((bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              groupMinStake={group.minStake}
              groupMaxStake={group.maxStake}
              isModerator={isModerator}
              onVote={handleVote}
              onSettle={handleSettleConfirm}
              result={results.get(bet.id)}
            />
          ))
        )}
      </div>

      {/* Bets Table Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Bets</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Title</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Deadline</th>
                    <th className="text-left py-2 font-medium">Total Votes</th>
                    <th className="text-left py-2 font-medium">Total Pool</th>
                    {isModerator && <th className="text-left py-2 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {bets.length === 0 ? (
                    <tr>
                      <td colSpan={isModerator ? 6 : 5} className="text-center py-4 text-muted-foreground">
                        No bets found
                      </td>
                    </tr>
                  ) : (
                    bets.map((bet) => {
                      const totalVotes = bet.options.reduce((total, option) => total + option.votes.length, 0);
                      const totalPool = bet.options.reduce((total, option) => 
                        total + option.votes.reduce((sum, vote) => sum + vote.stake, 0), 0
                      );
                      const isExpired = new Date(bet.deadline) < new Date();
                      const canSettle = bet.status === 'closed' && isModerator;

                      return (
                        <tr key={bet.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">
                            <div>
                              <div className="font-medium">{bet.title}</div>
                              <div className="text-sm text-muted-foreground">{bet.description}</div>
                            </div>
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              bet.status === 'settled' ? 'bg-green-100 text-green-800' :
                              bet.status === 'closed' ? 'bg-yellow-100 text-yellow-800' :
                              isExpired ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {bet.status === 'settled' ? 'Settled' :
                               bet.status === 'closed' ? 'Closed' :
                               isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className="py-2 text-sm">
                            {new Date(bet.deadline).toLocaleDateString()}
                          </td>
                          <td className="py-2 text-sm">{totalVotes}</td>
                          <td className="py-2 text-sm">£{totalPool.toFixed(2)}</td>
                          {isModerator && (
                            <td className="py-2">
                              {canSettle && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    alert('Settle functionality is in the bet card above');
                                  }}
                                >
                                  Settle
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settle Confirmation Dialog */}
      <AlertDialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Settle Bet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to settle this bet? This action cannot be undone and will calculate payouts for all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSettleConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Settle Bet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 