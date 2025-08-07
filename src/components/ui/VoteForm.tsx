"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { BetOption } from "@/lib/types";

interface VoteFormProps {
  betId: string;
  options: BetOption[];
  minStake: number;
  maxStake: number;
  votingType: 'single' | 'multi';
  multiVoteType?: 'exact_match' | 'partial_match';
  onSubmit: (voteData: { optionId: string; stake: number } | { votes: { optionId: string; stake: number }[] }) => void;
  onCancel: () => void;
  userVote?: { optionId: string; stake: number };
  userVotes?: { optionId: string; stake: number }[]; // For multi-vote bets
  canVote?: boolean;
  isExpired?: boolean;
}

export function VoteForm({ betId, options, minStake, maxStake, votingType, multiVoteType, onSubmit, onCancel, userVote, userVotes, canVote, isExpired }: VoteFormProps) {
  const [selectedOption, setSelectedOption] = useState(userVote?.optionId || "");
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    userVotes ? userVotes.map(v => v.optionId) : []
  );
  const [stake, setStake] = useState(userVote?.stake ?? Math.max(1, minStake));
  const [multiStakes, setMultiStakes] = useState<Map<string, number>>(
    new Map(userVotes?.map(v => [v.optionId, v.stake]) || [])
  );

  // Check if user has existing votes
  const hasExistingVotes = votingType === 'single' ? !!userVote : (userVotes && userVotes.length > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (votingType === 'single') {
      if (!selectedOption) {
        alert("Please select an option");
        return;
      }

      const effectiveMinStake = Math.max(1, minStake);
      const effectiveMaxStake = Math.max(1, maxStake);

      if (stake < effectiveMinStake || stake > effectiveMaxStake) {
        alert(`Stake must be between £${effectiveMinStake} and £${effectiveMaxStake}`);
        return;
      }

      onSubmit({
        optionId: selectedOption,
        stake,
      });
    } else {
      // Multi-vote logic - use batch submission
      if (selectedOptions.length === 0) {
        alert("Please select at least one option");
        return;
      }

      const effectiveMinStake = Math.max(1, minStake);
      const effectiveMaxStake = Math.max(1, maxStake);

      // Prepare votes array
      const votes: { optionId: string; stake: number }[] = [];
      
      for (const optionId of selectedOptions) {
        const optionStake = multiStakes.get(optionId) || stake;
        
        if (optionStake <= 0) {
          alert("All stakes must be greater than 0. Please enter a stake for each selected option.");
          return;
        }
        if (optionStake > effectiveMaxStake) {
          alert(`Individual stake cannot exceed £${effectiveMaxStake}`);
          return;
        }

        votes.push({
          optionId: optionId,
          stake: optionStake,
        });
      }

      // Submit as batch
      onSubmit({ votes });
    }
  }

  function handleOptionChange(optionId: string, checked: boolean) {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionId]);
      // Set default stake if not already set
      if (!multiStakes.has(optionId)) {
        setMultiStakes(prev => new Map(prev).set(optionId, stake));
      }
    } else {
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
      // Remove stake when deselecting
      setMultiStakes(prev => {
        const newMap = new Map(prev);
        newMap.delete(optionId);
        return newMap;
      });
    }
  }

  function handleMultiStakeChange(optionId: string, newStake: number) {
    setMultiStakes(prev => new Map(prev).set(optionId, newStake));
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {hasExistingVotes ? 'Change Your Vote' : 'Place Your Vote'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasExistingVotes && canVote && !isExpired && (
          <div className="text-xs text-muted-foreground mb-2">You can change your vote until the deadline.</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Option{votingType === 'multi' ? 's' : ''}
              {votingType === 'multi' && (
                <span className="text-xs text-muted-foreground ml-2">
                  {multiVoteType === 'partial_match' 
                    ? '(Your stake applies to each selected option)'
                    : '(You must get ALL selected options correct to win)'
                  }
                </span>
              )}
            </label>
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.id} className="border rounded-lg p-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    {votingType === 'single' ? (
                      <input
                        type="radio"
                        name="option"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="text-primary"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(option.id)}
                        onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                        className="text-primary"
                      />
                    )}
                    <span className="text-sm flex-1">{option.text}</span>
                  </label>
                  
                  {/* Individual stake input for multi-vote */}
                  {votingType === 'multi' && selectedOptions.includes(option.id) && (
                    <div className="mt-2 ml-6">
                      <Input
                        type="number"
                        min={1}
                        max={Math.max(1, maxStake)}
                        step="0.01"
                        value={multiStakes.get(option.id) || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            // Allow empty field for user to type new value
                            setMultiStakes(prev => new Map(prev).set(option.id, 0));
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              handleMultiStakeChange(option.id, numValue);
                            }
                          }
                        }}
                        placeholder="Stake for this option"
                        className="w-full text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {votingType === 'single' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Your Stake (£{Math.max(1, minStake)} - £{Math.max(1, maxStake)})
              </label>
              <Input
                type="number"
                min={Math.max(1, minStake)}
                max={Math.max(1, maxStake)}
                step="0.01"
                value={stake || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setStake(0);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      setStake(numValue);
                    }
                  }
                }}
                className="w-full"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can stake between £{Math.max(1, minStake)} and £{Math.max(1, maxStake)}
              </p>
            </div>
          )}

          {votingType === 'multi' && selectedOptions.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-1">Summary:</p>
              <p className="text-xs text-blue-600">
                {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-blue-600">
                Total stake: £{Array.from(multiStakes.values()).reduce((sum, stake) => sum + stake, 0).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {hasExistingVotes ? 'Change Vote' : 'Place Vote'}{votingType === 'multi' && selectedOptions.length > 1 ? 's' : ''}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
