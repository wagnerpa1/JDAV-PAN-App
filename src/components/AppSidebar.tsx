"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HomeIcon,
  CalendarIcon,
  MountainIcon,
  TentIcon,
  FileTextIcon,
  UserIcon,
  MenuIcon,
  RocketIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/tours", label: "Tours", icon: MountainIcon },
    { href: "/material", label: "Material", icon: TentIcon },
    { href: "/documents", label: "Documents", icon: FileTextIcon },
    { href: "/profile", label: "Profile", icon: UserIcon },
    { href: "/seed", label: "Seed Data", icon: RocketIcon },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center gap-2">
              <MountainIcon className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">Alpine Connect</span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-8">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                    pathname === item.href ? "bg-accent text-primary" : ""
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
