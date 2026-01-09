'use client';

import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MountainIcon, MapPinIcon, CalendarIcon, AlertTriangleIcon } from 'lucide-react';

// Define the shape of a Tour document
interface Tour {
  id: string;
  title: string;
  location: string;
  date: string; // Stored as ISO string
}

export default function ToursPage() {
  const firestore = useFirestore();

  // Memoize the Firestore query to prevent re-creating it on every render.
  // This is critical for performance and to avoid infinite loops in useCollection.
  const toursQuery = useMemoFirebase(() => {
    const today = new Date().toISOString();
    return query(
      collection(firestore, 'tours'),
      where('date', '>=', today),
      orderBy('date', 'asc')
    );
  }, [firestore]);

  const { data: tours, isLoading, error } = useCollection<Tour>(toursQuery);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <MountainIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Upcoming Tours
        </h1>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not fetch tours. Please check your connection or permissions.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && tours && (
        <div className="space-y-4">
          {tours.length > 0 ? (
            tours.map((tour) => (
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
                      <span>{formatDate(tour.date)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">No upcoming tours found.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back later for new adventures!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
