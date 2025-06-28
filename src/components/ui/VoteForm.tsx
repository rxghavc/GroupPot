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
  onSubmit: (voteData: { optionId: string; stake: number }) => void;
  onCancel: () => void;
}

export function VoteForm({ betId, options, minStake, maxStake, onSubmit, onCancel }: VoteFormProps) {
  const [selectedOption, setSelectedOption] = useState("");
  const [stake, setStake] = useState(minStake);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedOption) {
      alert("Please select an option");
      return;
    }

    if (stake < minStake || stake > maxStake) {
      alert(`Stake must be between £${minStake} and £${maxStake}`);
      return;
    }

    onSubmit({
      optionId: selectedOption,
      stake,
    });
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Place Your Vote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Option</label>
            <div className="space-y-2">
              {options.map((option) => (
                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="option"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="text-primary"
                  />
                  <span className="text-sm">{option.text}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Your Stake (£{minStake} - £{maxStake})
            </label>
            <Input
              type="number"
              min={minStake}
              max={maxStake}
              step="0.01"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can stake between £{minStake} and £{maxStake}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Place Vote
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
