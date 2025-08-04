import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/ui/site-header";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FriendsSplit | Bet with Friends, Split Winnings",
  description:
    "FriendsSplit lets you create private groups, place bets, and split winnings with friends. Manage your groups, bets, and payouts easily.",
  keywords: [
    "FriendsSplit",
    "betting",
    "groups",
    "split winnings",
    "social betting",
    "payouts",
    "dashboard",
    "friends",
  ],
  authors: [{ name: "FriendsSplit Team" }],
  creator: "Sai Raghavan Commandur",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider>
              <AppSidebar />
              <div className="flex-1 flex flex-col min-h-screen">
                <SiteHeader />
                <main className="flex-1 p-6 sm:p-10">{children}</main>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
