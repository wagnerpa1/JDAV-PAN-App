'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { TourForm } from '../../TourForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangleIcon } from 'lucide-react';

interface Tour {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  participantLimit: number;
  ageGroupId: string;
  leaderId: string;
}

export default function EditTourPage() {
  const { id } = useParams();
  const firestore = useFirestore();

  const tourDocRef = useMemoFirebase(
    () => doc(firestore, 'tours', id as string),
    [firestore, id]
  );

  const { data: tour, isLoading, error } = useDoc<Tour>(tourDocRef);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Tour</h1>
        {isLoading && (
          <div>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
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
    </div>
  );
}
