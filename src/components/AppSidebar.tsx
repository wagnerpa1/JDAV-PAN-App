"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  HomeIcon,
  CalendarIcon,
  MountainIcon,
  TentIcon,
  FileTextIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/tours", label: "Tours", icon: MountainIcon },
    { href: "/material", label: "Material", icon: TentIcon },
    { href: "/documents", label: "Documents", icon: FileTextIcon },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <MountainIcon className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold">Alpine Connect</h1>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <div>
                    <item.icon />
                    <span>{item.label}</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
