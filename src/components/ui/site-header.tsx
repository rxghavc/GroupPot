"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  const knownRoutes = [
    "dashboard", "groups", "bets", "profile", "login", "signup", "forgot-password", "reset-password", "users", ""
  ];
  
  const pathParts = pathname.split("/").filter(Boolean);
  const isKnown = pathParts.length === 0 || knownRoutes.includes(pathParts[0]);
  
  const getPageName = (path: string) => {
    // If the path is just /, show Home
    if (pathParts.length === 0) return "Home";

    // If the path is a known static route
    if (pathParts.length === 1 && knownRoutes.includes(pathParts[0])) {
      return getStaticPageName(pathParts[0]);
    }

    // For dynamic routes, filter out any part that looks like an ObjectId (24 hex chars) or is all digits
    const filteredParts = pathParts.filter(
      (part) => !/^([a-f\d]{24}|\d+)$/.test(part)
    );

    // If after filtering, nothing left, show Home
    if (filteredParts.length === 0) return "Home";

    // Capitalize and join the static parts
    return filteredParts.map(str => getStaticPageName(str)).join(" / ");
  };

  // Helper to map static route names to pretty names
  function getStaticPageName(str: string) {
    switch (str) {
      case "":
        return "Home";
      case "login":
        return "Sign In";
      case "signup":
        return "Sign Up";
      case "forgot-password":
        return "Forgot Password";
      case "reset-password":
        return "Reset Password";
      case "dashboard":
        return "Dashboard";
      case "profile":
        return "Profile";
      case "groups":
        return "Groups";
      case "bets":
        return "Bets";
      case "users":
        return "Users";
      default:
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
  }

  const pageName = getPageName(pathname);

  const handleLoginSignup = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redirectAfterAuth", pathname);
    }
    router.push("/login");
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <header className="flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-[width,height]">
        <div className="flex w-full items-center gap-3 px-6 py-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-3 h-6" />
          <h1 className="text-xl font-bold tracking-tight text-foreground/90">{pageName}</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-[width,height]">
      <div className="flex w-full items-center gap-3 px-6 py-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-3 h-6" />
        <h1 className="text-xl font-bold tracking-tight text-foreground/90">{pageName}</h1>
        <div className="ml-auto flex items-center gap-2">
          {!user ? (
            <Button
              variant="outline"
              className="font-medium"
              onClick={handleLoginSignup}
            >
              Login / Signup
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/profile')}
                className="flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                {user.username}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
