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
  LogOutIcon,
  LogInIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback } from "./ui/avatar";

function UserAuth() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  if (isUserLoading) {
    return <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex w-full items-center gap-3 rounded-lg bg-primary px-3 py-2 text-primary-foreground transition-all hover:bg-primary/90"
      >
        <LogInIcon className="h-5 w-5" />
        Login
      </Link>
    );
  }

  const handleSignOut = () => {
    signOut(auth);
  };

  const getInitials = () => {
    if (user.isAnonymous) return "AN";
    return user.email?.substring(0, 2).toUpperCase() || "??";
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-2 text-card-foreground">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="truncate text-sm font-medium">
            {user.isAnonymous ? "Anonymous User" : user.email}
          </span>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
        <LogOutIcon className="h-5 w-5" />
      </Button>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/tours", label: "Tours", icon: MountainIcon },
    { href: "/material", label: "Material", icon: TentIcon },
    { href: "/documents", label: "Documents", icon: FileTextIcon },
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
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center gap-2">
              <MountainIcon className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">Alpine Connect</span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex-grow">
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
        <div className="mt-auto">
          <UserAuth />
        </div>
      </SheetContent>
    </Sheet>
  );
}
