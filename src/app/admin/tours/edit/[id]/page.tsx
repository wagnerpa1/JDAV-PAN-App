'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { TourForm } from '../../TourForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangleIcon } from 'lucide-react';
import type { Tour } from '@/types';


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
    </div>
  );
}

    