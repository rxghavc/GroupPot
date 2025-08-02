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
  title: "FriendsStake | Bet with Friends, Split Winnings",
  description:
    "FriendsStake lets you create private groups, place bets, and split winnings with friends. Manage your groups, bets, and payouts easily.",
  keywords: [
    "FriendsStake",
    "betting",
    "groups",
    "split winnings",
    "social betting",
    "payouts",
    "dashboard",
    "friends",
  ],
  authors: [{ name: "FriendsStake Team" }],
  creator: "FriendsStake Team",
  openGraph: {
    title: "FriendsStake | Bet with Friends, Split Winnings",
    description:
      "Create private groups, place bets, and split winnings with friends on FriendsStake.",
    url: "https://friendsstake.com",
    siteName: "FriendsStake",
    images: [
      {
        url:
          "data:image/svg+xml,%3Csvg%20fill%3D%22%23059669%22%20viewBox%3D%220%200%20640%20512%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M192%20256c61.9%200%20112-50.1%20112-112S253.9%2032%20192%2032%2080%2082.1%2080%20144s50.1%20112%20112%20112zm76.8%2032h-8.3c-20.8%2010-43.9%2016-68.5%2016s-47.6-6-68.5-16h-8.3C51.6%20288%200%20339.6%200%20403.2V432c0%2026.5%2021.5%2048%2048%2048h288c26.5%200%2048-21.5%2048-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zM480%20256c53%200%2096-43%2096-96s-43-96-96-96-96%2043-96%2096%2043%2096%2096%2096zm48%2032h-3.8c-13.9%204.8-28.6%208-44.2%208s-30.3-3.2-44.2-8H432c-20.4%200-39.2%205.9-55.7%2015.4%2024.4%2026.3%2039.7%2061.2%2039.7%2099.8v38.4c0%202.2-.5%204.3-.6%206.4H592c26.5%200%2048-21.5%2048-48%200-61.9-50.1-112-112-112z%22/%3E%3C/svg%3E",
        width: 1200,
        height: 630,
        alt: "FriendsStake Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FriendsStake | Bet with Friends, Split Winnings",
    description:
      "Create private groups, place bets, and split winnings with friends on FriendsStake.",
    images: [
      "data:image/svg+xml,%3Csvg%20fill%3D%22%23059669%22%20viewBox%3D%220%200%20640%20512%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M192%20256c61.9%200%20112-50.1%20112-112S253.9%2032%20192%2032%2080%2082.1%2080%20144s50.1%20112%20112%20112zm76.8%2032h-8.3c-20.8%2010-43.9%2016-68.5%2016s-47.6-6-68.5-16h-8.3C51.6%20288%200%20339.6%200%20403.2V432c0%2026.5%2021.5%2048%2048%2048h288c26.5%200%2048-21.5%2048-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zM480%20256c53%200%2096-43%2096-96s-43-96-96-96-96%2043-96%2096%2043%2096%2096%2096zm48%2032h-3.8c-13.9%204.8-28.6%208-44.2%208s-30.3-3.2-44.2-8H432c-20.4%200-39.2%205.9-55.7%2015.4%2024.4%2026.3%2039.7%2061.2%2039.7%2099.8v38.4c0%202.2-.5%204.3-.6%206.4H592c26.5%200%2048-21.5%2048-48%200-61.9-50.1-112-112-112z%22/%3E%3C/svg%3E"
    ],
  },
  icons: {
    icon:
      "data:image/svg+xml,%3Csvg%20fill%3D%22%2306b6d4%22%20viewBox%3D%220%200%20640%20512%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M192%20256c61.9%200%20112-50.1%20112-112S253.9%2032%20192%2032%2080%2082.1%2080%20144s50.1%20112%20112%20112zm76.8%2032h-8.3c-20.8%2010-43.9%2016-68.5%2016s-47.6-6-68.5-16h-8.3C51.6%20288%200%20339.6%200%20403.2V432c0%2026.5%2021.5%2048%2048%2048h288c26.5%200%2048-21.5%2048-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zM480%20256c53%200%2096-43%2096-96s-43-96-96-96-96%2043-96%2096%2043%2096%2096%2096zm48%2032h-3.8c-13.9%204.8-28.6%208-44.2%208s-30.3-3.2-44.2-8H432c-20.4%200-39.2%205.9-55.7%2015.4%2024.4%2026.3%2039.7%2061.2%2039.7%2099.8v38.4c0%202.2-.5%204.3-.6%206.4H592c26.5%200%2048-21.5%2048-48%200-61.9-50.1-112-112-112z%22/%3E%3C/svg%3E".replace('%2306b6d4', '%23059669'),
  },
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
