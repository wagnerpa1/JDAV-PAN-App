
'use client';

import { useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  where,
  doc,
} from 'firebase/firestore';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageIcon, AlertTriangleIcon, UserIcon, MountainIcon, CalendarIcon } from 'lucide-react';
import type { Material, MaterialReservation, Tour, UserProfile } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';

function ReservationDetails({ reservation }: { reservation: MaterialReservation }) {
  const firestore = useFirestore();

  const userRef = useMemoFirebase(
    () => (reservation.userId ? doc(firestore, 'users', reservation.userId) : null),
    [firestore, reservation.userId]
  );
  const { data: user, isLoading: userLoading } = useDoc<UserProfile>(userRef);

  const tourRef = useMemoFirebase(
    () => (reservation.tourId ? doc(firestore, 'tours', reservation.tourId) : null),
    [firestore, reservation.tourId]
  );
  const { data: tour, isLoading: tourLoading } = useDoc<Tour>(tourRef);
  
  if (userLoading || tourLoading) {
    return <Skeleton className="h-6 w-full" />
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/50 rounded-lg">
       <div className="flex items-center gap-3 mb-2 sm:mb-0">
         <UserIcon className="h-4 w-4" />
         <span className="font-medium">{user?.name || 'Unknown User'}</span>
       </div>
       <div className="flex items-center gap-3 text-sm text-muted-foreground">
         <MountainIcon className="h-4 w-4" />
         <Link href={`/tours/${tour?.id}`} className="hover:underline">{tour?.title || 'Unknown Tour'}</Link>
         <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          <span>{reservation.quantityReserved}x</span>
         </div>
       </div>
    </div>
  )
}

function MaterialReservations({ materialId }: { materialId: string }) {
  const firestore = useFirestore();
  const reservationsQuery = useMemoFirebase(
    () =>
      query(
        collection(firestore, 'tours'), // This is a workaround as we can't query all subcollections
        where('materialReservations', 'array-contains', materialId)
      ),
    [firestore, materialId]
  );

  const reservationsPath = `tours/{tourId}/materialReservations`; // Path is not perfect
  const allReservationsQuery = useMemoFirebase(()=> {
    // A better approach would be to query a root-level `materialReservations` collection
    // Here we query all tours and then get subcollections, which is inefficient.
    // For this prototype, we'll assume a root collection `materialReservations`
    return query(
        collection(firestore, 'materialReservations'), 
        where('materialId', '==', materialId),
        orderBy('reservationDate', 'desc')
    );
  }, [firestore, materialId])

  const {
    data: reservations,
    isLoading,
    error,
  } = useCollection<MaterialReservation>(allReservationsQuery);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    // This query is likely to fail with default rules, but we'll handle it gracefully
    return (
        <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Could not load reservations</AlertTitle>
            <AlertDescription>
                Could not load reservations. Please ensure your firestore rules allow collection group queries on `materialReservations`.
            </AlertDescription>
        </Alert>
    );
  }

  if (!reservations || reservations.length === 0) {
    return <p className="text-muted-foreground text-sm p-4 text-center">No reservations for this item yet.</p>;
  }

  return (
    <div className="space-y-2 p-2">
      {reservations.map((res) => (
        <ReservationDetails key={res.id} reservation={res} />
      ))}
    </div>
  );
}

export default function GearManagementPage() {
  const firestore = useFirestore();

  const materialsQuery = useMemoFirebase(
    () => query(collection(firestore, 'materials'), orderBy('name', 'asc')),
    [firestore]
  );
  const {
    data: materials,
    isLoading,
    error,
  } = useCollection<Material>(materialsQuery);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <PackageIcon className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Gear Management
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Equipment</CardTitle>
          <CardDescription>
            View all available gear and see current reservations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error Loading Gear</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {!isLoading && materials && (
            <Accordion type="single" collapsible className="w-full">
              {materials.length > 0 ? (
                materials.map((material) => (
                  <AccordionItem key={material.id} value={material.id}>
                    <AccordionTrigger>
                      <div className="flex justify-between w-full pr-4">
                        <span className="font-medium">{material.name}</span>
                        <span className="text-muted-foreground">{material.quantityAvailable} available</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                       <MaterialReservations materialId={material.id} />
                    </AccordionContent>
                  </AccordionItem>
                ))
              ) : (
                <p className="text-muted-foreground text-center p-8">
                  No materials found.
                </p>
              )}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
