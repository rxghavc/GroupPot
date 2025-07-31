"use client";

import { FaUserFriends } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Trophy, DollarSign, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <FaUserFriends className="w-14 h-14 text-emerald-500 drop-shadow mb-4 mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show dashboard-style landing
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center gap-6 p-4">
        <div className="flex flex-col items-center gap-2">
          <FaUserFriends className="w-14 h-14 text-emerald-500 drop-shadow mb-2" />
          <h1 className="text-4xl font-extrabold tracking-tight text-primary drop-shadow-sm">
            Welcome back, <span className="text-emerald-500">{user.username}</span>
          </h1>
          <p className="text-muted-foreground">Ready to make some bets?</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/groups">
              <Users className="mr-2 h-4 w-4" />
              View Groups
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/bets">
              <Trophy className="mr-2 h-4 w-4" />
              My Bets
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Guest user - show marketing page with clear auth CTAs
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <FaUserFriends className="w-14 h-14 text-emerald-500 drop-shadow mb-2" />
        <h1 className="text-4xl font-extrabold tracking-tight text-primary drop-shadow-sm">
          Welcome to <span className="text-emerald-500">FriendsStake</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          The fun way to make friendly bets with your friends and split winnings fairly
        </p>
      </div>
      
      {/* How it Works Section */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-emerald-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-2 mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle>Create or Join Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start a new group or join your friends with a simple group code.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <div className="bg-emerald-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-2 mx-auto">
              <Trophy className="h-6 w-6" />
            </div>
            <CardTitle>Place Bets Together</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Make friendly wagers on anything you like with transparent voting.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <div className="bg-emerald-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-2 mx-auto">
              <DollarSign className="h-6 w-6" />
            </div>
            <CardTitle>Split Winnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Winnings are calculated and split automatically and fairly among winners.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Simple CTA Section */}
      <div className="flex flex-col items-center gap-4 mt-4">
        <Button asChild size="lg" className="text-lg px-8 bg-emerald-600 hover:bg-emerald-700">
          <Link href="/signup">
            <Users className="mr-2 h-4 w-4" />
            Create Your Free Account
          </Link>
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1">
            Sign in <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
