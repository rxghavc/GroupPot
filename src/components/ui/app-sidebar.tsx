import * as React from "react"
import { GalleryVerticalEnd, Users, Layers, User, ScrollText } from "lucide-react"
import { FaUserFriends } from "react-icons/fa";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"


const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: GalleryVerticalEnd,
    },
    {
      title: "Groups",
      url: "/groups",
      icon: Users,
    },
    {
      title: "My Bets",
      url: "/bets",
      icon: Layers,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: User,
    },
    {
      title: "Documentation",
      url: "/documentation",
      icon: ScrollText, //
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="text-emerald-500 flex aspect-square size-8 items-center justify-center rounded-lg">
                  <FaUserFriends className="size-8" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">GroupPot</span>
                  <span className="text-muted-foreground">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton size="lg" asChild>
                  <a href={item.url} className="font-medium flex items-center gap-3 py-3 px-4 text-lg lg:text-base lg:gap-2 lg:py-2 lg:px-3">
                    {item.icon && <item.icon className="w-5 h-5 lg:w-4 lg:h-4" />}
                    {item.title}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 p-2">
          <div className="px-3 py-2 text-xs text-muted-foreground leading-relaxed">
            This app was built as a polling system solution for my father and his friends, I hope you enjoy it!
          </div>
          <a
            href="https://linkedin.com/in/raghavcommandur"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View LinkedIn"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-emerald-500"
          >
            <svg
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.968v5.699h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.036 0 3.6 2 3.6 4.59v5.606z" />
            </svg>
            <span>View LinkedIn</span>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
