"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface BetFormProps {
  groupId: string;
  groupMinStake: number;
  groupMaxStake: number;
  onSubmit: (betData: {
    title: string;
    description: string;
    options: string[];
    deadline: string;
    minStake: number;
    maxStake: number;
  }) => void;
  onCancel: () => void;
}

export function BetForm({ groupId, groupMinStake, groupMaxStake, onSubmit, onCancel }: BetFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [deadline, setDeadline] = useState("");
  const [minStake, setMinStake] = useState(groupMinStake);
  const [maxStake, setMaxStake] = useState(groupMaxStake);

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
    
    if (!title.trim() || !description.trim() || !deadline) {
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
    });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Bet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bet Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Who will win the NBA Finals?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the bet..."
              className="w-full border rounded-md px-3 py-2 min-h-[80px] text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Options *</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="px-2"
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
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deadline *</label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Stake (£)</label>
              <Input
                type="number"
                min={1}
                value={minStake}
                onChange={(e) => setMinStake(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Maximum Stake (£)</label>
              <Input
                type="number"
                min={1}
                value={maxStake}
                onChange={(e) => setMaxStake(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Create Bet
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