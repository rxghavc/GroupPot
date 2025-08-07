"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Users, PoundSterling, Eye, Copy, Check, Trophy, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Files } from "lucide-react";
import { Group, Bet, BetResult } from "@/lib/types";
import { BetCard } from "@/components/ui/BetCard";
import { BetForm } from "@/components/ui/BetForm";
import { PayoutTable } from "@/components/ui/PayoutTable";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useSWR, { mutate } from 'swr';

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
  const [pendingSettleOptions, setPendingSettleOptions] = useState<string[]>([]);
  const [pendingSettleBet, setPendingSettleBet] = useState<Bet | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [selectedBetResult, setSelectedBetResult] = useState<{ bet: Bet; result: BetResult } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteBet, setPendingDeleteBet] = useState<Bet | null>(null);
  const [memberProfits, setMemberProfits] = useState<Map<string, any>>(new Map());
  const [loadingProfits, setLoadingProfits] = useState(false);
  const [cloneBetData, setCloneBetData] = useState<any>(null);

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
              // Debug token before API call
              console.log(`Fetching payouts for bet ${bet.id}, token exists:`, !!token);
              
              const resultResponse = await fetch(`/api/bets/${bet.id}/payouts`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              console.log(`Payouts response for bet ${bet.id}:`, resultResponse.status);
              
              if (resultResponse.ok) {
                const resultData = await resultResponse.json();
                return { betId: bet.id, result: resultData.result };
              } else {
                console.error(`Payouts failed for bet ${bet.id}:`, await resultResponse.text());
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
    setCloneBetData(null); // Clear clone data when closing
    resetUserActivity(); // Resume auto-refresh
  };

  const handleOpenMembers = async () => {
    pauseAutoRefresh();
    setShowMembers(true);
    
    // Load profit data for all members
    if (group) {
      setLoadingProfits(true);
      const profitPromises = group.members.map(async (member: any) => {
        const memberId = member._id || member.id;
        const profitData = await calculateMemberProfit(memberId);
        return { memberId, profitData };
      });
      
      try {
        const results = await Promise.all(profitPromises);
        const profitMap = new Map();
        results.forEach(({ memberId, profitData }) => {
          profitMap.set(memberId, profitData);
        });
        setMemberProfits(profitMap);
      } catch (error) {
        console.error('Error loading member profits:', error);
      } finally {
        setLoadingProfits(false);
      }
    }
  };

  const handleCloseMembers = () => {
    setShowMembers(false);
    resetUserActivity(); // Resume auto-refresh
  };

  async function handleCreateBet(betData: {
    title: string;
    description?: string;
    options: string[];
    deadline: string;
    minStake: number;
    maxStake: number;
    votingType: 'single' | 'multi';
    multiVoteType?: 'exact_match' | 'partial_match';
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
        // Do not append the new bet; always refresh from backend
        fetchGroupData();
        setShowCreateBet(false);
        setCloneBetData(null); // Clear clone data after successful creation
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

  // State for handling multi-vote debouncing
  const [voteTimeout, setVoteTimeout] = useState<NodeJS.Timeout | null>(null);

  async function handleVote(voteData: { optionId: string; stake: number } | { votes: { optionId: string; stake: number }[] }) {
    try {
      // Check if this is a batch vote
      if ('votes' in voteData) {
        // Batch voting for multi-vote bets
        const votes = voteData.votes;
        if (votes.length === 0) return;
        
        // Find the bet that contains these options
        const bet = bets.find(b => votes.some(vote => b.options.some(opt => opt.id === vote.optionId)));
        if (!bet) {
          showAlert('Bet not found for these options');
          return;
        }

        const response = await fetch(`/api/bets/${bet.id}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ votes: votes }),
        });

        if (response.ok) {
          // Refresh the bets to show updated vote counts
          fetchGroupData();
          // Also refresh the user's bets page
          if (user && token) {
            mutate([`/api/users/${user.id}/bets`, token]);
          }
          showAlert('Votes placed successfully!', 'success');
        } else {
          const error = await response.json();
          console.error('Batch vote failed:', error);
          showAlert(error.error || 'Failed to place votes');
        }
        return;
      }

      // Single vote logic (existing code)
      const singleVoteData = voteData as { optionId: string; stake: number };
      
      // Find the bet that contains this option
      const bet = bets.find(b => b.options.some(opt => opt.id === singleVoteData.optionId));
      if (!bet) {
        showAlert('Bet not found for this option');
        return;
      }

      const response = await fetch(`/api/bets/${bet.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(singleVoteData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // For multi-vote bets, debounce the refresh to avoid multiple rapid updates
        if (voteTimeout) {
          clearTimeout(voteTimeout);
        }
        
        const newTimeout = setTimeout(() => {
          // Refresh the bets to show updated vote counts
          fetchGroupData();
          // Also refresh the user's bets page
          if (user && token) {
            mutate([`/api/users/${user.id}/bets`, token]);
          }
          showAlert('Vote(s) placed successfully!', 'success');
          setVoteTimeout(null);
        }, 500); // Wait 500ms for any additional votes
        
        setVoteTimeout(newTimeout);
      } else {
        const error = await response.json();
        console.error('Vote failed:', error);
        showAlert(error.error || 'Failed to place vote');
      }
    } catch (error) {
      console.error('Error placing vote:', error);
      showAlert('Failed to place vote');
    }
  }

  async function handleSettle(winningOptionId: string | string[]) {
    try {
      // Find the bet that contains this option
      const optionIds = Array.isArray(winningOptionId) ? winningOptionId : [winningOptionId];
      const bet = bets.find(b => 
        optionIds.some(id => b.options.some(opt => opt.id === id))
      );
      
      if (!bet) {
        showAlert('Bet not found for this option');
        return;
      }

      const requestBody = Array.isArray(winningOptionId) 
        ? { winningOptionIds: winningOptionId }
        : { winningOptionId: winningOptionId };

      const response = await fetch(`/api/bets/${bet.id}/outcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => new Map(prev).set(bet.id, data.result));
        // Refresh the bets to show updated status
        fetchGroupData();
        // Show appropriate message based on whether it was a refund or normal settlement
        showAlert(data.message || 'Bet settled successfully!', 'success');
      } else {
        const error = await response.json();
        console.error('Settle failed:', error);
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
  const handleSettleConfirm = (bet: Bet) => {
    setPendingSettleBet(bet);
    setSettleDialogOpen(true);
  };

  const handleSettleConfirmed = async () => {
    if (!pendingSettleBet) return;
    
    let optionsToSettle: string[];
    
    if (pendingSettleBet.votingType === 'multi') {
      // Multi-vote: Use multiple options for both exact and partial match
      optionsToSettle = pendingSettleOptions;
    } else {
      // Single vote: Use single option
      optionsToSettle = pendingSettleOption ? [pendingSettleOption] : [];
    }
    
    if (optionsToSettle.length === 0) return;
    
    setSettleDialogOpen(false);
    await handleSettle(optionsToSettle.length > 1 ? optionsToSettle : optionsToSettle[0]);
    setPendingSettleOption(null);
    setPendingSettleOptions([]);
    setPendingSettleBet(null);
  };

  // Handle bet update from edit
  const handleBetUpdated = (updatedBet: Bet) => {
    setBets(prevBets => 
      prevBets.map(bet => 
        bet.id === updatedBet.id ? updatedBet : bet
      )
    );
    showAlert('Bet updated successfully!', 'success');
  };

  // Handle viewing bet results
  const handleViewResults = (bet: Bet) => {
    const result = results.get(bet.id);
    if (result) {
      setSelectedBetResult({ bet, result });
      setShowResultsDialog(true);
    }
  };

  // Pagination helpers
  const totalBets = bets.length;
  const totalPages = Math.ceil(totalBets / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentBets = bets.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Calculate member profit/loss for this group
  const calculateMemberProfit = async (memberId: string) => {
    try {
      // Debug token before API call
      console.log('Token for calculateMemberProfit:', token ? 'exists' : 'missing');
      console.log('User ID:', user?.id);
      
      const response = await fetch(`/api/users/${memberId}/bets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Member profit response status:', response.status);
      
      if (response.ok) {
        const userBets = await response.json();
        
        // Filter bets for this specific group
        const groupBets = userBets.filter((bet: any) => bet.groupId === groupId);
        
        // Calculate profit/loss using the accurate API data
        const totalStakes = groupBets.reduce((sum: number, bet: any) => 
          sum + bet.userVotes.reduce((voteSum: number, vote: any) => voteSum + vote.stake, 0), 0
        );
        
        const totalPayouts = groupBets.reduce((sum: number, bet: any) => {
          // Only count payouts for settled bets, using the calculated payout from API
          return sum + (bet.status === 'settled' ? parseFloat(bet.payout) : 0);
        }, 0);
        
        const netProfit = totalPayouts - totalStakes;
        
        return {
          totalStakes,
          totalPayouts,
          netProfit,
          totalBets: groupBets.length,
          settledBets: groupBets.filter((bet: any) => bet.status === 'settled').length
        };
      }
    } catch (error) {
      console.error('Error calculating member profit:', error);
    }
    
    return {
      totalStakes: 0,
      totalPayouts: 0,
      netProfit: 0,
      totalBets: 0,
      settledBets: 0
    };
  };

  // Handle member removal
  const handleRemoveMember = async (memberId: string) => {
    if (!group || removingMemberId) return;
    
    setRemovingMemberId(memberId);
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh group data to update member list
        await fetchGroupData();
        showAlert('Member removed successfully!', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      showAlert('Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  // Handle moderator promotion/demotion
  const handleToggleModerator = async (memberId: string, isCurrentlyModerator: boolean) => {
    if (!group) return;
    
    try {
      const response = await fetch(`/api/groups/${groupId}/moderators`, {
        method: isCurrentlyModerator ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: memberId }),
      });

      if (response.ok) {
        // Refresh group data to update moderator list
        await fetchGroupData();
        showAlert(
          `Member ${isCurrentlyModerator ? 'demoted from' : 'promoted to'} moderator!`, 
          'success'
        );
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to update moderator status');
      }
    } catch (error) {
      console.error('Error updating moderator status:', error);
      showAlert('Failed to update moderator status');
    }
  };

  // Handle force closing bet early
  const handleForceCloseBet = async (betId: string) => {
    try {
      const response = await fetch(`/api/bets/${betId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchGroupData();
        showAlert('Bet closed successfully!', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to close bet');
      }
    } catch (error) {
      console.error('Error closing bet:', error);
      showAlert('Failed to close bet');
    }
  };

  // Handle bet deletion
  const handleDeleteBet = async (betId: string) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;
    
    setPendingDeleteBet(bet);
    setDeleteDialogOpen(true);
  };

  // Handle bet cloning
  const handleCloneBet = (bet: Bet) => {
    setCloneBetData({
      title: `${bet.title} (Copy)`,
      description: bet.description || "",
      options: bet.options.map(option => option.text),
      minStake: bet.minStake,
      maxStake: bet.maxStake,
      votingType: bet.votingType,
      multiVoteType: bet.multiVoteType
    });
    setShowCreateBet(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteBet) return;
    
    setDeleteDialogOpen(false);
    
    try {
      const response = await fetch(`/api/bets/${pendingDeleteBet.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchGroupData();
        showAlert('Bet deleted successfully!', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to delete bet');
      }
    } catch (error) {
      console.error('Error deleting bet:', error);
      showAlert('Failed to delete bet');
    } finally {
      setPendingDeleteBet(null);
    }
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
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Group Members ({group.members.length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Member</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-center py-3 px-4 font-medium">Total Bets</th>
                  <th className="text-center py-3 px-4 font-medium">Total Staked</th>
                  <th className="text-center py-3 px-4 font-medium">Net P&L</th>
                  {isModerator && (
                    <th className="text-center py-3 px-4 font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {group.members.map((member: any) => {
                  const memberId = member._id || member.id;
                  const isOwner = group.ownerId === memberId;
                  const isMod = group.moderators.includes(memberId);
                  const canManage = isModerator && !isOwner && memberId !== user?.id;
                  const profitData = memberProfits.get(memberId);
                  
                  return (
                    <tr key={memberId} className="border-b hover:bg-muted/50">
                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{member.username}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </td>
                      
                      {/* Role */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {isOwner && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                              Owner
                            </span>
                          )}
                          {isMod && !isOwner && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                              Moderator
                            </span>
                          )}
                          {!isOwner && !isMod && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full font-medium">
                              Member
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Stats */}
                      {loadingProfits ? (
                        <>
                          <td className="py-3 px-4 text-center">
                            <div className="h-4 w-8 bg-muted rounded animate-pulse mx-auto"></div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="h-4 w-16 bg-muted rounded animate-pulse mx-auto"></div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="h-4 w-16 bg-muted rounded animate-pulse mx-auto"></div>
                          </td>
                        </>
                      ) : profitData ? (
                        <>
                          <td className="py-3 px-4 text-center font-medium">
                            {profitData.totalBets}
                          </td>
                          <td className="py-3 px-4 text-center font-medium">
                            £{profitData.totalStakes.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className={`font-medium flex items-center justify-center gap-1 ${
                              profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {profitData.netProfit >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {profitData.netProfit >= 0 ? '+' : ''}£{profitData.netProfit.toFixed(2)}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                        </>
                      )}
                      
                      {/* Actions */}
                      {isModerator && (
                        <td className="py-3 px-4">
                          {canManage ? (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleModerator(memberId, isMod)}
                                className="text-xs"
                              >
                                {isMod ? 'Demote' : 'Promote'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveMember(memberId)}
                                disabled={removingMemberId === memberId}
                                className="text-xs"
                              >
                                {removingMemberId === memberId ? 'Removing...' : 'Remove'}
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground text-xs">-</div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Bet Dialog */}
      <BetForm
        groupId={group.id}
        groupMinStake={group.minStake}
        groupMaxStake={group.maxStake}
        open={showCreateBet}
        onSubmit={handleCreateBet}
        onCancel={handleCloseCreateBet}
        initialValues={cloneBetData}
      />

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
        ) : bets.filter(bet => bet.status === 'open' && new Date(bet.deadline) >= new Date()).length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">No Active Bets</h3>
                  <p className="text-muted-foreground max-w-md">
                    There are currently no active bets in this group. 
                    {isModerator 
                      ? " Create the first bet to get everyone started!" 
                      : " Check back later or ask a moderator to create one!"
                    }
                  </p>
                </div>
                {isModerator && (
                  <Button 
                    onClick={handleOpenCreateBet}
                    className="mt-4 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Bet
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          bets.filter(bet => bet.status === 'open' && new Date(bet.deadline) >= new Date()).map((bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              groupMinStake={group.minStake}
              groupMaxStake={group.maxStake}
              isModerator={isModerator}
              onVote={handleVote}
              onSettle={handleSettleConfirm}
              result={results.get(bet.id)}
              user={user}
              token={token}
              onBetUpdated={handleBetUpdated}
            />
          ))
        )}
      </div>

      {/* Bets Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Bets</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            {totalBets === 0 ? (
              <div className="pt-12 pb-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                    <PoundSterling className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">No Betting History</h3>
                    <p className="text-muted-foreground max-w-md">
                      This group has no betting history yet. Once bets are created and completed, they'll appear here with full details and results.
                      {isModerator 
                        ? " Start by creating your first bet!" 
                        : " Ask a moderator to create the first bet!"
                      }
                    </p>
                  </div>
                  {isModerator && (
                    <Button 
                      onClick={handleOpenCreateBet}
                      className="mt-4 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Bet
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Title</th>
                        <th className="text-left py-2 font-medium">Status</th>
                        <th className="text-left py-2 font-medium">Deadline</th>
                        <th className="text-left py-2 font-medium">Total Votes</th>
                        <th className="text-left py-2 font-medium">Total Pool</th>
                        <th className="text-left py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBets.map((bet) => {
                        const totalVotes = bet.options.reduce((total, option) => total + (option.votesCount || 0), 0);
                        const totalPool = bet.options.reduce((total, option) => 
                          total + (option.totalStake || 0), 0
                        );
                        const isExpired = new Date(bet.deadline) < new Date();
                        const canSettle = isModerator && (
                          bet.status === 'closed' || 
                          bet.status === 'pending' || 
                          (bet.status === 'open' && isExpired)
                        );

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
                              {new Date(bet.deadline).toLocaleDateString('en-GB')}
                            </td>
                            <td className="py-2 text-sm">{totalVotes}</td>
                            <td className="py-2 text-sm">£{totalPool.toFixed(2)}</td>
                            <td className="py-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {bet.status === 'settled' && results.get(bet.id) && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewResults(bet)}
                                  >
                                    View Results
                                  </Button>
                                )}
                                {isModerator && canSettle && bet.status !== 'settled' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleSettleConfirm(bet)}
                                  >
                                    Settle
                                  </Button>
                                )}
                                {isModerator && bet.status === 'open' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleForceCloseBet(bet.id)}
                                    className="text-orange-600 hover:text-orange-700"
                                  >
                                    Close Early
                                  </Button>
                                )}
                                {isModerator && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCloneBet(bet)}
                                      className="text-blue-600 hover:text-blue-700"
                                      title="Clone this bet"
                                    >
                                      <Files className="w-3 h-3 mr-1" />
                                      Clone
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => handleDeleteBet(bet.id)}
                                    >
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {totalBets > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalBets)} of {totalBets} bets
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => handlePageChange(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bet Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold">
              {selectedBetResult?.bet.title} - Results
            </DialogTitle>
          </DialogHeader>
          <div className="pr-2">
            {selectedBetResult && (
              <PayoutTable 
                bet={selectedBetResult.bet} 
                result={selectedBetResult.result} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settle Confirmation Dialog */}
      <AlertDialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Settle Bet
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <div className="font-medium text-foreground">{pendingSettleBet?.title}</div>
                <div className="text-sm">
                  {pendingSettleBet?.votingType === 'multi' 
                    ? pendingSettleBet?.multiVoteType === 'partial_match'
                      ? 'Select one or more winning options for this partial-match bet. Users win based on stakes on any selected option.'
                      : 'Select all winning options for this all-or-nothing bet.'
                    : 'Select the winning option. This will calculate payouts for all participants.'
                  }
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {pendingSettleBet && (
            <div className="space-y-4">
              <div className="space-y-3">
                {pendingSettleBet.options.map((option) => {
                  const isSelected = pendingSettleBet.votingType === 'multi'
                    ? pendingSettleOptions.includes(option.id)
                    : pendingSettleOption === option.id;
                  
                  return (
                    <label 
                      key={option.id} 
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted/50 ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type={pendingSettleBet.votingType === 'multi' ? 'checkbox' : 'radio'}
                        name={pendingSettleBet.votingType === 'multi' ? 'winningOptions' : 'winningOption'}
                        value={option.id}
                        checked={isSelected}
                        onChange={(e) => {
                          if (pendingSettleBet.votingType === 'multi') {
                            // Multi-vote: Allow multiple selections (checkboxes) for both exact and partial match
                            if (e.target.checked) {
                              setPendingSettleOptions(prev => [...prev, option.id]);
                            } else {
                              setPendingSettleOptions(prev => prev.filter(id => id !== option.id));
                            }
                          } else {
                            // Single vote: Only one selection (radio)
                            setPendingSettleOption(e.target.value);
                            setPendingSettleOptions([]); // Clear multi-selections for consistency
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                        )}
                      </div>
                      <span className="font-medium flex-1">{option.text}</span>
                      <div className="text-sm text-muted-foreground">
                        {option.votesCount || 0} vote{(option.votesCount || 0) !== 1 ? 's' : ''}
                      </div>
                    </label>
                  );
                })}
              </div>
              
              {pendingSettleBet.votingType === 'multi' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    {pendingSettleBet.multiVoteType === 'partial_match' ? (
                      <>
                        <strong>Partial Match rule:</strong> Users who voted on ANY of the selected winning options will receive payouts based on their stakes on those options. Stakes on non-winning options will be redistributed to winners.
                      </>
                    ) : (
                      <>
                        <strong>All-or-Nothing rule:</strong> Users must have voted on ALL selected options (and no others) to win.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingSettleOption(null);
              setPendingSettleOptions([]);
              setPendingSettleBet(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSettleConfirmed} 
              disabled={
                pendingSettleBet?.votingType === 'multi'
                  ? pendingSettleOptions.length === 0
                  : !pendingSettleOption
              }
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Settle Bet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Bet Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bet: {pendingDeleteBet?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteBet?.status === 'settled' 
                ? 'Are you sure you want to delete this settled bet? This action cannot be undone and will permanently remove the bet from the group.'
                : 'Are you sure you want to delete this bet? This action cannot be undone and will refund all participants.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingDeleteBet(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirmed} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Bet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 