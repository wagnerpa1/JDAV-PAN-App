'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/types';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const getInitials = () => {
    if (!userProfile?.email) return '??';
    return userProfile.email.substring(0, 2).toUpperCase();
  };

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-8 w-48 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
         <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto text-center">
                <p>User profile not found. It might still be getting created.</p>
                <p>Please wait a moment and then refresh the page.</p>
            </div>
         </div>
    )
  }


  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
            <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 mb-4 text-3xl">
                    <AvatarImage src={userProfile.profilePictureUrl} alt="Profile picture" />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{userProfile.email}</CardTitle>
                <CardDescription className="capitalize bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                    {userProfile.role}
                </CardDescription>
            </CardHeader>
            <CardContent className="mt-4">
               {/* Placeholder for future content */}
               <div className="text-center text-muted-foreground">
                <p>Personal data, emergency contacts, and settings will be displayed here.</p>
               </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    