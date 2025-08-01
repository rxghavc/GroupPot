"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bet, BetResult } from "@/lib/types";
import { VoteForm } from "./VoteForm";
import { 
  Clock, 
  Users, 
  Trophy, 
  PoundSterling,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X
} from "lucide-react";

interface BetCardProps {
  bet: Bet;
  groupMinStake: number;
  groupMaxStake: number;
  isModerator: boolean;
  onVote: (voteData: { optionId: string; stake: number }) => void;
  onSettle: (bet: Bet) => void;
  result?: BetResult;
  user?: { id: string };
  token?: string;
  onBetUpdated?: (updatedBet: Bet) => void;
}

export function BetCard({ 
  bet, 
  groupMinStake, 
  groupMaxStake, 
  isModerator, 
  onVote, 
  onSettle, 
  result,
  user,
  token,
  onBetUpdated
}: BetCardProps) {
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [showSettleForm, setShowSettleForm] = useState(false);
  const [selectedWinningOption, setSelectedWinningOption] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: bet.title,
    description: bet.description,
    deadline: new Date(bet.deadline).toISOString().slice(0, 16),
    minStake: bet.minStake,
    maxStake: bet.maxStake
  });

  const isExpired = new Date(bet.deadline) < new Date();
  const isPending = bet.status === 'pending';
  const canVote = bet.status === 'open' && !isExpired;
  const canSettle = (bet.status === 'closed' || isPending) && isModerator;
  const isSettled = bet.status === 'settled';

  // In BetCard, find the user's current vote for this bet and shape as { optionId, stake }
  const userVote = user
    ? (() => {
        for (const option of bet.options) {
          if (option.votes) {
            const found = option.votes.find(v => v.userId === user.id);
            if (found) {
              return { optionId: option.id, stake: found.stake };
            }
          }
        }
        return undefined;
      })()
    : undefined;

  function getStatusColor() {
    if (isSettled) return "bg-green-100 text-green-800";
    if (isPending) return "bg-orange-100 text-orange-800";
    if (isExpired || bet.status === 'closed') return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  }

  function getStatusText() {
    if (isSettled) return "Settled";
    if (isPending) return "Pending";
    if (isExpired || bet.status === 'closed') return "Closed";
    return "Open";
  }

  function handleVote(voteData: { optionId: string; stake: number }) {
    onVote(voteData);
    setShowVoteForm(false);
  }

  function handleSettle() {
    if (!selectedWinningOption) {
      alert("Please select a winning option");
      return;
    }
    onSettle(bet);
    setShowSettleForm(false);
    setSelectedWinningOption("");
  }

  function handleEdit() {
    setIsEditing(true);
  }

  function handleSave() {
    if (!token) {
      alert('Authentication token not available. Please refresh the page and try again.');
      return;
    }

    // Call API to update the bet
    fetch(`/api/bets/${bet.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(editData),
    })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      return data;
    })
    .then(data => {
      setIsEditing(false);
      // Update local state instead of page refresh
      if (onBetUpdated && data.bet) {
        onBetUpdated(data.bet);
      } else {
        // Fallback to page refresh if callback not provided
        window.location.reload();
      }
    })
    .catch(error => {
      console.error('Error updating bet:', error);
      alert(`Failed to update bet: ${error.message}`);
    });
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditData({
      title: bet.title,
      description: bet.description,
      deadline: new Date(bet.deadline).toISOString().slice(0, 16),
      minStake: bet.minStake,
      maxStake: bet.maxStake
    });
  }

  function getTotalVotes() {
    return bet.options.reduce((total, option) => total + (option.votesCount || 0), 0);
  }

  function getTotalStakes() {
    return bet.options.reduce((total, option) => 
      total + (option.totalStake || 0), 0
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="text-lg font-semibold"
                />
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="w-full text-sm text-muted-foreground border rounded px-2 py-1"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={editData.deadline}
                    onChange={(e) => setEditData({...editData, deadline: e.target.value})}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={editData.minStake || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setEditData({...editData, minStake: 0});
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setEditData({...editData, minStake: numValue});
                        }
                      }
                    }}
                    placeholder="Min Stake"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={editData.maxStake || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setEditData({...editData, maxStake: 0});
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setEditData({...editData, maxStake: numValue});
                        }
                      }
                    }}
                    placeholder="Max Stake"
                    className="text-sm"
                  />
                </div>
              </div>
            ) : (
              <>
                <CardTitle className="text-lg">{bet.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{bet.description}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            {isModerator && bet.status === 'open' && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {isEditing && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="h-8 w-8 p-0"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Deadline: {new Date(bet.deadline).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{getTotalVotes()} votes</span>
          </div>
          <div className="flex items-center gap-1">
            <PoundSterling className="w-4 h-4" />
            <span>£{getTotalStakes().toFixed(2)} total</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Options */}
        <div className="space-y-2">
          <h4 className="font-medium">Options:</h4>
          {bet.options.map((option) => {
            const voteCount = option.votesCount || 0;
            const totalStake = option.totalStake || 0;
            // Check for both single and multi-vote winning conditions
            const isWinning = result?.winningOptionId === option.id || 
                             (result?.winningOptionIds && result.winningOptionIds.some((winId: string) => {
                               // Convert between different ID formats if needed
                               return winId === option.id || winId === option._id?.toString();
                             }));
            const userVoted = user && option.votes && option.votes.some(v => v.userId === user.id);
            
            return (
              <div 
                key={option.id} 
                className={`p-3 border rounded-lg ${
                  isWinning ? 'border-green-500 bg-green-50' : userVoted ? 'border-primary/10 bg-primary/10' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option.text}</span>
                    {isWinning && <Trophy className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {voteCount} votes • £{totalStake.toFixed(2)}
                  </div>
                </div>
                
                {/* Voters List - Show if there are votes */}
                {voteCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-gray-700 list-none">
                        <span className="group-open:hidden">Show {voteCount} voter{voteCount !== 1 ? 's' : ''}</span>
                        <span className="hidden group-open:inline">Hide voters</span>
                      </summary>
                      <div className="mt-2 space-y-1">
                        {option.votes.map((vote, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                            <span className="font-medium">{vote.username || vote.userId}</span>
                            <span className="text-muted-foreground">£{vote.stake.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Multi-vote user combinations - Show for multi-vote bets only */}
        {bet.votingType === 'multi' && getTotalVotes() > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">User Vote Combinations:</h4>
            <div className="bg-blue-50 rounded-lg p-3">
              {(() => {
                // Collect all users and their votes across all options
                const userVoteMap = new Map();
                
                bet.options.forEach(option => {
                  if (option.votes && option.votes.length > 0) {
                    option.votes.forEach(vote => {
                      const userId = vote.userId;
                      const username = vote.username || vote.userId || 'Unknown User';
                      if (!userVoteMap.has(userId)) {
                        userVoteMap.set(userId, {
                          username,
                          options: [],
                          totalStake: 0
                        });
                      }
                      userVoteMap.get(userId).options.push(option.text);
                      userVoteMap.get(userId).totalStake += vote.stake;
                    });
                  }
                });

                if (userVoteMap.size === 0) {
                  return (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No votes recorded yet
                    </div>
                  );
                }

                return Array.from(userVoteMap.values()).map((userVote, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-white px-3 py-2 rounded border">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{userVote.username}</span>
                      <span className="text-muted-foreground">voted on:</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {userVote.options.join(' + ')}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Total: £{userVote.totalStake.toFixed(2)}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {canVote && (
            <Button onClick={() => setShowVoteForm(true)}>
              Place Vote
            </Button>
          )}
          
          {canSettle && (
            <Button 
              variant="outline" 
              onClick={() => setShowSettleForm(true)}
            >
              Settle Bet
            </Button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Results:</h4>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Total Pool:</span> £{result.totalPool.toFixed(2)}
              </div>
              <div className="text-sm">
                <span className="font-medium">Winners:</span> {result.winners.length}
              </div>
              <div className="text-sm">
                <span className="font-medium">Losers:</span> {result.losers.length}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Vote Form Modal */}
      {showVoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <VoteForm
              betId={bet.id}
              options={bet.options}
              minStake={bet.minStake}
              maxStake={bet.maxStake}
              votingType={bet.votingType || 'single'}
              onSubmit={handleVote}
              onCancel={() => setShowVoteForm(false)}
              userVote={userVote}
              canVote={canVote}
              isExpired={isExpired}
            />
          </div>
        </div>
      )}

      {/* Settle Form Modal */}
      {showSettleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <Card>
              <CardHeader>
                <CardTitle>Declare Winner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Winning Option</label>
                  <div className="space-y-2">
                    {bet.options.map((option) => (
                      <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="winningOption"
                          value={option.id}
                          checked={selectedWinningOption === option.id}
                          onChange={(e) => setSelectedWinningOption(e.target.value)}
                          className="text-primary"
                        />
                        <span className="text-sm">{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSettle} className="flex-1">
                    Settle Bet
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSettleForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </Card>
  );
}
