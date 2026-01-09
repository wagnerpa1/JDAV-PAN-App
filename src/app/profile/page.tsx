'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [name, setName] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (userProfile?.name) {
      setName(userProfile.name);
      setIsDirty(false);
    }
  }, [userProfile]);

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setIsDirty(e.target.value !== userProfile?.name);
  };
  
  const handleSaveChanges = () => {
    if (!userDocRef || !isDirty) return;

    updateDocumentNonBlocking(userDocRef, { name });
    toast({
        title: 'Profile Updated',
        description: 'Your name has been successfully updated.'
    });
    setIsDirty(false);
  }

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader className="text-center items-center">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-8 w-48 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
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
                    <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
                <CardDescription className="capitalize bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                    {userProfile.role}
                </CardDescription>
            </CardHeader>
            <CardContent className="mt-4 space-y-6">
               <div className="space-y-2">
                 <Label htmlFor="name">Display Name</Label>
                 <Input 
                   id="name" 
                   value={name} 
                   onChange={handleNameChange}
                   placeholder="Your display name"
                 />
               </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={userProfile.email} disabled />
                    <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
               </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveChanges} disabled={!isDirty}>
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

    