import * as React from "react"
import { GalleryVerticalEnd, Users, PlusCircle, LogIn, User, Layers } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Groups",
      url: "/groups",
      icon: Users,
      items: [
        {
          title: "My Groups",
          url: "/groups",
          icon: Users,
        },
        {
          title: "Join Group",
          url: "/groups/join",
          icon: LogIn,
        },
        {
          title: "Create Group",
          url: "/groups/create",
          icon: PlusCircle,
        },
      ],
    },
    {
      title: "Bets",
      url: "/bets",
      icon: Layers,
      items: [
        {
          title: "All Bets",
          url: "/bets",
          icon: Layers,
        },
      ],
    },
    {
      title: "Profile",
      url: "/profile",
      icon: User,
      items: [
        {
          title: "My Profile",
          url: "/profile",
          icon: User,
        },
      ],
    },
    {
      title: "Authentication",
      url: "#",
      icon: LogIn,
      items: [
        {
          title: "Login",
          url: "/login",
          icon: LogIn,
        },
        {
          title: "Signup",
          url: "/signup",
          icon: PlusCircle,
        },
      ],
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
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Documentation</span>
                  <span className="">v1.0.0</span>
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
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium flex items-center gap-2">
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subitem) => (
                      <SidebarMenuSubItem key={subitem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subitem.url} className="flex items-center gap-2">
                            {subitem.icon && <subitem.icon className="w-4 h-4" />}
                            {subitem.title}
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
