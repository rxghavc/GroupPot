"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    const success = await forgotPassword(email);
    if (success) {
      setSuccess(true);
    } else {
      setError("Failed to send reset email. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot password</CardTitle>
          <p className="text-center text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  If an account with that email exists, we've sent you a password reset link. 
                  Please check your email and follow the instructions.
                </AlertDescription>
              </Alert>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 