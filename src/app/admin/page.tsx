'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheckIcon,
  FileTextIcon,
  DatabaseZapIcon,
  LockIcon,
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  role: 'user' | 'admin';
}

const adminUtilities = [
  {
    title: 'Document Management',
    href: '/documents',
    icon: <FileTextIcon className="h-6 w-6 text-primary" />,
    description: 'Upload and manage shared documents for all users.',
  },
  {
    title: 'Database Seed Utility',
    href: '/seed',
    icon: <DatabaseZapIcon className="h-6 w-6 text-primary" />,
    description: 'Populate the database with sample tours and materials.',
  },
];

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
      <LockIcon className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      <p className="text-muted-foreground max-w-md">
        You do not have the necessary permissions to view this page. Please
        contact an administrator if you believe this is an error.
      </p>
    </div>
  );
}

function AdminDashboard() {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {adminUtilities.map((item, index) => (
                <Link key={index} href={item.href} className="block hover:no-underline">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                        {item.icon}
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
        </>
    )
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc<UserProfile>(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <ShieldCheckIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Admin Dashboard
        </h1>
      </div>

      {isLoading && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && (
        <>
          {userProfile?.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <AccessDenied />
          )}
        </>
      )}
    </div>
  );
}
