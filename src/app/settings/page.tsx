"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"
import { Settings, User, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const { user, token, loading } = useAuth();

  // Show skeleton loading while auth is loading
  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-muted rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        </div>

        {/* Account Information Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
              <div className="h-6 w-40 bg-muted rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
              </div>
            </div>
            <div className="pt-2">
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Skeleton */}
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-64 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full flex flex-col items-center gap-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Login Required</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Please log in to access your settings.
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

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert("Account deleted successfully");
        // Redirect to home or login page
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete account");
      }
    } catch (error) {
      alert("Failed to delete account");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={user.username}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/forgot-password'}
            >
              Reset Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
