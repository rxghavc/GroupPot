"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

interface BetFormProps {
  groupId: string;
  groupMinStake: number;
  groupMaxStake: number;
  open: boolean;
  onSubmit: (betData: {
    title: string;
    description: string;
    options: string[];
    deadline: string;
    minStake: number;
    maxStake: number;
    votingType: 'single' | 'multi';
    multiVoteType?: 'exact_match' | 'partial_match';
  }) => void;
  onCancel: () => void;
}

export function BetForm({ groupId, groupMinStake, groupMaxStake, open, onSubmit, onCancel }: BetFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [deadline, setDeadline] = useState("");
  const [minStake, setMinStake] = useState(Math.max(1, groupMinStake));
  const [maxStake, setMaxStake] = useState(Math.max(1, groupMaxStake));
  const [votingType, setVotingType] = useState<'single' | 'multi'>('single');
  const [multiVoteType, setMultiVoteType] = useState<'exact_match' | 'partial_match'>('exact_match');

  // Reset form when dialog closes
  function resetForm() {
    setTitle("");
    setDescription("");
    setOptions(["", ""]);
    setDeadline("");
    setMinStake(Math.max(1, groupMinStake));
    setMaxStake(Math.max(1, groupMaxStake));
    setVotingType('single');
    setMultiVoteType('exact_match');
  }

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, groupMinStake, groupMaxStake]);

  function addOption() {
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title.trim() || !deadline) {
      alert("Please fill in all required fields");
      return;
    }

    if (options.some(option => !option.trim())) {
      alert("Please fill in all options");
      return;
    }

    if (new Date(deadline) <= new Date()) {
      alert("Deadline must be in the future");
      return;
    }

    if (minStake < 1) {
      alert("Minimum stake must be at least £1");
      return;
    }

    if (maxStake < 1) {
      alert("Maximum stake must be at least £1");
      return;
    }

    if (minStake >= maxStake) {
      alert("Minimum stake must be less than maximum stake");
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      options: options.map(opt => opt.trim()),
      deadline,
      minStake,
      maxStake,
      votingType,
      multiVoteType: votingType === 'multi' ? multiVoteType : undefined,
    });

    // Reset form after submission
    resetForm();
  }

  function handleCancel() {
    resetForm();
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Bet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bet Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Who will win the NBA Finals?"
                  required
                  className="h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the bet... (optional)"
                  className="w-full border rounded-md px-3 py-3 min-h-[120px] text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Stake (£)</label>
                  <Input
                    type="number"
                    min={1}
                    value={minStake || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setMinStake(0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setMinStake(numValue);
                        }
                      }
                    }}
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Maximum Stake (£)</label>
                  <Input
                    type="number"
                    min={1}
                    value={maxStake || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setMaxStake(0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setMaxStake(numValue);
                        }
                      }
                    }}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deadline *</label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Voting Type *</label>
                <ToggleGroup 
                  type="single" 
                  value={votingType} 
                  onValueChange={(value) => value && setVotingType(value as 'single' | 'multi')}
                  className="justify-start"
                >
                  <ToggleGroupItem value="single" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Single Vote
                  </ToggleGroupItem>
                  <ToggleGroupItem value="multi" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Multi Vote
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-xs text-muted-foreground mt-1">
                  {votingType === 'single' 
                    ? 'Members can pick only one option' 
                    : 'Members can pick multiple options'
                  }
                </p>
              </div>

              {/* Multi-vote sub-type selection */}
              {votingType === 'multi' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Multi-Vote Rules *</label>
                  <ToggleGroup 
                    type="single" 
                    value={multiVoteType} 
                    onValueChange={(value) => value && setMultiVoteType(value as 'exact_match' | 'partial_match')}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="exact_match" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      All-or-Nothing
                    </ToggleGroupItem>
                    <ToggleGroupItem value="partial_match" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      Partial Match
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      {multiVoteType === 'exact_match' 
                        ? '🎯 All-or-Nothing: Users must vote on ALL winning options (and no others) to win.' 
                        : '🎲 Partial Match: Users vote on multiple options, but only ONE option wins.'
                      }
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Options *</label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        required
                        className="h-11"
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="px-3 h-11"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="w-full h-11"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <Button type="submit" className="flex-1 h-11">
              Create Bet
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} className="h-11 px-8">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 