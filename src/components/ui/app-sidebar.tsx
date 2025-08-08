import * as React from "react"
import { GalleryVerticalEnd, Users, Layers, User, ScrollText, Mail } from "lucide-react"
import Image from "next/image";

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
                <div className="flex items-center justify-center rounded-lg overflow-hidden">
                  <Image
                    src="/grouppot_logo.png"
                    alt="GroupPot logo"
                    width={32}
                    height={32}
                    priority
                  />
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
            href="mailto:info.grouppot@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact Us"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-emerald-500"
          >
            <Mail className="w-5 h-5" />
            <span>Contact Us</span>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
