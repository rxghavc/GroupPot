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
  onSubmit: (voteData: { optionId: string; stake: number }) => void;
  onCancel: () => void;
  userVote?: { optionId: string; stake: number };
  canVote?: boolean;
  isExpired?: boolean;
}

export function VoteForm({ betId, options, minStake, maxStake, votingType, multiVoteType, onSubmit, onCancel, userVote, canVote, isExpired }: VoteFormProps) {
  const [selectedOption, setSelectedOption] = useState(userVote?.optionId || "");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [stake, setStake] = useState(userVote?.stake ?? Math.max(1, minStake));

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
      // Multi-vote logic
      if (selectedOptions.length === 0) {
        alert("Please select at least one option");
        return;
      }

      const effectiveMinStake = Math.max(1, minStake);
      const effectiveMaxStake = Math.max(1, maxStake);

      // For partial match, stake is per option; for exact match, stake is total split
      let totalStake;
      let stakePerOption;
      
      if (multiVoteType === 'partial_match') {
        // Stake applies to each option individually
        stakePerOption = stake;
        totalStake = stake * selectedOptions.length;
        
        // Check if total stake exceeds max
        if (totalStake > effectiveMaxStake * selectedOptions.length) {
          alert(`With ${selectedOptions.length} options selected, your total stake would be £${totalStake}. Please reduce your stake per option.`);
          return;
        }
      } else {
        // Exact match: stake is split across options
        stakePerOption = stake / selectedOptions.length;
        totalStake = stake;
      }

      if (stake < effectiveMinStake || stake > effectiveMaxStake) {
        alert(`Stake must be between £${effectiveMinStake} and £${effectiveMaxStake}`);
        return;
      }

      // Submit each selected option with calculated stake
      for (const optionId of selectedOptions) {
        onSubmit({
          optionId: optionId,
          stake: stakePerOption,
        });
      }
    }
  }

  function handleOptionChange(optionId: string, checked: boolean) {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionId]);
    } else {
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Place Your Vote</CardTitle>
      </CardHeader>
      <CardContent>
        {userVote && canVote && !isExpired && (
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
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Your Stake (£{Math.max(1, minStake)} - £{Math.max(1, maxStake)})
              {votingType === 'multi' && (
                <span className="text-xs text-muted-foreground block">
                  {multiVoteType === 'partial_match'
                    ? 'Stake per option - total stake will be multiplied by number of selected options'
                    : 'Total stake - will be split across your selected options'
                  }
                </span>
              )}
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
              {votingType === 'multi' && selectedOptions.length > 0 && (
                <span className="block mt-1">
                  {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''} selected - {
                    multiVoteType === 'partial_match'
                      ? `£${stake} per option = £${(stake * selectedOptions.length).toFixed(2)} total stake`
                      : `£${stake} total, split as £${(stake / selectedOptions.length).toFixed(2)} per option`
                  }
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Place Vote{votingType === 'multi' && selectedOptions.length > 1 ? 's' : ''}
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
