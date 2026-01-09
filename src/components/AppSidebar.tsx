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
  UserIcon,
  MenuIcon,
  LogOutIcon,
  LogInIcon,
  ShieldCheckIcon,
  NewspaperIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import type { UserProfile } from "@/types";
import { doc } from 'firebase/firestore';


function UserAuth() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return <Skeleton className="h-12 w-full rounded-lg" />
  }

  if (!user) {
    return (
      <Button asChild className="w-full">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-lg bg-primary px-3 py-2 text-primary-foreground transition-all hover:bg-primary/90"
        >
          <LogInIcon className="h-5 w-5" />
          Login
        </Link>
      </Button>
    );
  }

  const handleSignOut = () => {
    signOut(auth);
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  const displayName = userProfile?.name || (user.isAnonymous ? "Anonymous User" : user.email);

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-2 text-card-foreground">
      <Link href="/profile" className="flex items-center gap-3 hover:no-underline text-card-foreground">
        <Avatar>
          {userProfile?.profilePictureUrl && <AvatarImage src={userProfile.profilePictureUrl} alt="User profile picture" />}
          <AvatarFallback>{getInitials(userProfile?.name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-sm font-medium">
            {displayName}
          </span>
        </div>
      </Link>
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
    { href: "/news", label: "News", icon: NewspaperIcon },
    { href: "/profile", label: "Profile", icon: UserIcon },
    { href: "/admin", label: "Admin", icon: ShieldCheckIcon },
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

    