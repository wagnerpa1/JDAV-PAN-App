'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collectionGroup, query, where, getDocs, collection, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Participant, Tour } from '@/types';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PencilIcon, CalendarIcon, MapPinIcon } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';


function EditNameDialog({ userProfile, userDocRef }: { userProfile: UserProfile, userDocRef: any }) {
    const [name, setName] = useState(userProfile.name);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleSaveChanges = () => {
        if (!userDocRef || name === userProfile.name) {
            setIsOpen(false);
            return;
        };

        updateDocumentNonBlocking(userDocRef, { name });
        toast({
            title: 'Profile Updated',
            description: 'Your name has been successfully updated.'
        });
        setIsOpen(false);
    }

    useEffect(() => {
        if(isOpen) {
            setName(userProfile.name);
        }
    }, [isOpen, userProfile.name])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon">
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit Name</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Display Name</DialogTitle>
                    <DialogDescription>
                        Make changes to your display name here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                        Name
                        </Label>
                        <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                     <Button type="submit" onClick={handleSaveChanges}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function MyTours({ userId }: { userId: string }) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    async function fetchUserTours() {
      if (!userId || !firestore) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const participationsQuery = query(
          collectionGroup(firestore, 'participants'),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(participationsQuery);
        const tourIds = querySnapshot.docs.map(doc => doc.data().tourId);

        if (tourIds.length > 0) {
          const toursData: Tour[] = [];
          for (const tourId of tourIds) {
            const tourDocRef = doc(firestore, 'tours', tourId);
            const tourDocSnap = await getDoc(tourDocRef);
            if (tourDocSnap.exists()) {
              toursData.push({ id: tourDocSnap.id, ...tourDocSnap.data() } as Tour);
            }
          }
          setTours(toursData);
        } else {
          setTours([]);
        }
      } catch (error) {
        console.error("Error fetching user's tours:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserTours();
  }, [userId, firestore]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Registered Tours</h2>
      {tours.length > 0 ? (
        <div className="space-y-4">
          {tours.map(tour => (
             <Link key={tour.id} href={`/tours/${tour.id}`} className="block hover:no-underline group">
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl group-hover:border-primary">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {tour.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{tour.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(new Date(tour.startDate), 'PPP')}</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">You are not registered for any upcoming tours.</p>
      )}
    </div>
  );
}


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

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

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
                <CardContent className="space-y-4 pt-6">
                    <Skeleton className="h-10 w-full" />
                </CardContent>
                 <CardFooter className="mt-6">
                     <Skeleton className="h-24 w-full" />
                </CardFooter>
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
                <div className="flex w-full justify-center items-center gap-2">
                    <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
                    <EditNameDialog userProfile={userProfile} userDocRef={userDocRef}/>
                </div>
                <CardDescription className="capitalize bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                    {userProfile.role}
                </CardDescription>
            </CardHeader>
            <CardContent className="mt-4 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={userProfile.email} disabled />
                    <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
               </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start mt-6">
                 {user && <MyTours userId={user.uid} />}
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
