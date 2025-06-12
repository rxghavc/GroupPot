"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle"; // Import ThemeToggle

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const knownRoutes = [
    "dashboard", "groups", "bets", "profile", "login", "signup", "users", ""
  ];
  const pathParts = pathname.split("/").filter(Boolean);
  const isKnown = pathParts.length === 0 || knownRoutes.includes(pathParts[0]);
  const pageName =
    isKnown
      ? (pathname === "/" ? "Home" : pathParts.map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(" / "))
      : "Not Found";

  const isLoggedIn = false;

  const handleLoginSignup = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redirectAfterAuth", pathname);
    }
    router.push("/login");
  };

  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-[width,height]">
      <div className="flex w-full items-center gap-3 px-6 py-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-3 h-6" />
        <h1 className="text-xl font-bold tracking-tight text-foreground/90">{pageName}</h1>
        <div className="ml-auto flex items-center gap-2">
          {!isLoggedIn && (
            <Button
              variant="outline"
              className="font-medium"
              onClick={handleLoginSignup}
            >
              Login / Signup
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
