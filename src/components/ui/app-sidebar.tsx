import * as React from "react"
import { GalleryVerticalEnd, Users, Layers, User } from "lucide-react"
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
                  <span className="font-medium">FriendsStake</span>
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
            href="https://github.com/rxghavc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View GitHub"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-emerald-500"
          >
            <svg
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.338 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.479C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" />
            </svg>
            <span>View GitHub</span>
          </a>
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
