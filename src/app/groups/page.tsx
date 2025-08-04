"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2, LogIn, Copy, Check, Users, Plus, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Group } from "@/lib/types";
import { Label } from "@/components/ui/label";
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

export default function GroupsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    minStake: 1,
    maxStake: 100,
  });
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"error" | "success">("error");
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingLeaveGroupId, setPendingLeaveGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user && token) {
        fetchGroups();
      } else {
        setLoading(false);
      }
    }
  }, [user, token, authLoading]);

  async function fetchGroups() {
    try {
      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.groups) {
          setGroups(data.groups);
        }
      } else if (response.status === 401) {
        // Token expired or invalid
        console.error('Authentication failed');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setNewGroup({ ...newGroup, [e.target.name]: e.target.value });
  }

  async function handleCreateGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newGroup),
      });

      if (response.ok) {
        const data = await response.json();
        setGroups([...groups, data.group]);
        setDialogOpen(false);
        setNewGroup({ name: "", description: "", minStake: 1, maxStake: 100 });
        showAlert('Successfully created group', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      showAlert('Failed to create group');
    }
  }

  async function handleJoinGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: joinCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setGroups([...groups, data.group]);
        setJoinDialogOpen(false);
        setJoinCode("");
        showAlert('Successfully joined group!', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      showAlert('Failed to join group');
    }
  }

  async function handleLeaveGroup(groupId: string) {
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(groups.filter(group => group.id !== groupId));
        showAlert('Successfully left group', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      showAlert('Failed to leave group');
    }
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-full flex flex-col items-center gap-8">
        <div className="w-full flex flex-row flex-wrap gap-6 justify-center px-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="w-full max-w-md flex-1 min-w-[300px] animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
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
      <div className="w-full flex flex-col items-center gap-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Login Required</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Please log in to view and manage your groups.
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

  // Show loading state while fetching groups
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center gap-8">
        <div className="w-full flex flex-row flex-wrap gap-6 justify-center px-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="w-full max-w-md flex-1 min-w-[300px] animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show alert message
  const showAlert = (message: string, type: "error" | "success" = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => setAlertMessage(""), 5000); // Auto-hide after 5 seconds
  };

  // Handle leave group confirmation
  const handleLeaveGroupConfirm = (groupId: string) => {
    setPendingLeaveGroupId(groupId);
    setLeaveDialogOpen(true);
  };

  const handleLeaveGroupConfirmed = async () => {
    if (!pendingLeaveGroupId) return;
    
    setLeaveDialogOpen(false);
    await handleLeaveGroup(pendingLeaveGroupId);
    setPendingLeaveGroupId(null);
  };

  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* Alert Messages */}
      {alertMessage && (
        <Alert variant={alertType === "error" ? "destructive" : "default"} className="w-full max-w-4xl">
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      {/* Groups grid section */}
      <div className="w-full flex flex-row flex-wrap gap-6 justify-center px-2">
        {groups.length === 0 ? (
          <div className="w-full">
            <Card className="w-full">
              <CardHeader className="text-center py-12">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                  <Users className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl mb-3">No Groups Yet</CardTitle>
                <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
                  You haven't joined any groups yet. Create a new group or join an existing one to start betting with friends!
                </p>
              </CardHeader>
              <CardContent className="text-center pb-6">
                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a New Group</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={handleCreateGroup}
                        className="flex flex-col gap-4 mt-2"
                      >
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Group Name
                          </label>
                          <Input
                            name="name"
                            value={newGroup.name}
                            onChange={handleInputChange}
                            placeholder="Enter group name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={newGroup.description}
                            onChange={handleInputChange}
                            placeholder="Enter group description"
                            required
                            className="border rounded px-2 py-1 w-full min-h-[60px] text-sm"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Min Stake</label>
                            <Input
                              type="number"
                              name="minStake"
                              value={newGroup.minStake}
                              min={1}
                              max={newGroup.maxStake}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Max Stake</label>
                            <Input
                              type="number"
                              name="maxStake"
                              value={newGroup.maxStake}
                              min={newGroup.minStake}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          variant="default"
                          className="w-full mt-2"
                        >
                          Create
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Join Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Join a Group</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleJoinGroup} className="flex flex-col gap-4 mt-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Group Code</label>
                          <Input 
                            name="joinCode" 
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Enter group code" 
                            required 
                          />
                        </div>
                        <Button type="submit" variant="default" className="w-full mt-2">Join</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="w-full max-w-md flex-1 min-w-[300px]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold truncate">
                  {group.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 mb-2 line-clamp-2">
                  {group.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-bold">
                    {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Code: {group.code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(group.code)}
                      className="h-6 w-6 p-0"
                    >
                      {copiedCode === group.code ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/10 hover:border-primary flex items-center gap-1">
                  <a href={`/groups/${group.id}`}>View Group</a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 hover:text-red-600 flex items-center gap-1"
                  onClick={() => handleLeaveGroupConfirm(group.id)}
                >
                  <Trash2 className="w-4 h-4" /> Leave Group
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Controls & Actions Section - Only show when user has groups */}
      {groups.length > 0 && (
        <div className="w-full px-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                Group Controls & Actions
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Create a new group or manage your memberships.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New Group</DialogTitle>
                  </DialogHeader>
                    <form
                      onSubmit={handleCreateGroup}
                      className="flex flex-col gap-4 mt-2"
                    >
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Group Name
                        </label>
                        <Input
                          name="name"
                          value={newGroup.name}
                          onChange={handleInputChange}
                          placeholder="Enter group name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={newGroup.description}
                          onChange={handleInputChange}
                          placeholder="Enter group description"
                          required
                          className="border rounded px-2 py-1 w-full min-h-[60px] text-sm"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Default Min Stake</label>
                          <Input
                            type="number"
                            name="minStake"
                            value={newGroup.minStake}
                            min={1}
                            max={newGroup.maxStake}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Default Max Stake</label>
                          <Input
                            type="number"
                            name="maxStake"
                            value={newGroup.maxStake}
                            min={newGroup.minStake}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        variant="default"
                        className="w-full mt-2"
                      >
                        Create
                      </Button>
                    </form>
                </DialogContent>
              </Dialog>
              
              {/* Join Group Dialog */}
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-primary text-primary flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Join Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join a Group</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleJoinGroup} className="flex flex-col gap-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Group Code</label>
                      <Input 
                        name="joinCode" 
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Enter group code" 
                        required 
                      />
                    </div>
                    <Button type="submit" variant="default" className="w-full mt-2">Join</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave Group Confirmation Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? This will remove your votes from all active bets in the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroupConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}