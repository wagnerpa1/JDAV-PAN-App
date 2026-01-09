'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  useDoc,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import { doc, collection, query, limit } from 'firebase/firestore';
import { TourForm } from '../../TourForm';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangleIcon,
  UsersIcon,
} from 'lucide-react';
import type { Tour, UserProfile, Participant } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function ParticipantListItem({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(
    () => (userId ? doc(firestore, 'users', userId) : null),
    [firestore, userId]
  );
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);

  const getInitials = (email?: string) => {
    if (!email) return '??';
    return email.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-48" />
      </div>
    );
  }

  if (!userProfile) {
    return null; // Or some fallback UI for a user not found
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src={userProfile?.profilePictureUrl} />
        <AvatarFallback>{getInitials(userProfile?.email)}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{userProfile?.email}</span>
    </div>
  );
}


function ParticipantList({ tourId }: { tourId: string }) {
  const firestore = useFirestore();

  const participantsQuery = useMemoFirebase(
    () => query(collection(firestore, 'tours', tourId, 'participants'), limit(50)),
    [firestore, tourId]
  );
  const { data: participants, isLoading, error } = useCollection<Participant>(participantsQuery);
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="h-6 w-6" />
          Participants ({participants?.length || 0})
        </CardTitle>
        <CardDescription>Users who have joined this tour.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-10 w-full" />}
        {error && <Alert variant="destructive"><AlertTriangleIcon className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Could not load participants.</AlertDescription></Alert>}
        {!isLoading && participants && (
          <div className="space-y-4">
            {participants.length === 0 ? (
              <p className="text-muted-foreground">No one has joined this tour yet.</p>
            ) : (
              participants.map((p) => (
                <ParticipantListItem key={p.userId} userId={p.userId} />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


export default function EditTourPage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const tourId = id as string;

  const tourDocRef = useMemoFirebase(
    () => doc(firestore, 'tours', tourId),
    [firestore, tourId]
  );

  const { data: tour, isLoading, error } = useDoc<Tour>(tourDocRef);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Tour</h1>
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Could not load tour data. It might not exist or you may not have
              permission to view it.
            </AlertDescription>
          </Alert>
        )}
        {tour && <TourForm existingTour={tour} />}
      </div>
      
      {tour && <div className="max-w-2xl mx-auto"><ParticipantList tourId={tourId} /></div>}
    </div>
  );
}
