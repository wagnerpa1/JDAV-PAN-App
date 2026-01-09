'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  collectionGroup,
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageIcon, AlertTriangleIcon, UserIcon, MountainIcon, CalendarIcon, ArrowLeftIcon } from 'lucide-react';
import type { Material, MaterialReservation, Tour, UserProfile } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    return <Skeleton className="h-12 w-full rounded-lg" />;
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-center gap-3 mb-2 sm:mb-0">
        <UserIcon className="h-4 w-4" />
        <span className="font-medium">{user?.name || 'Unknown User'}</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <MountainIcon className="h-4 w-4" />
        <Link href={`/tours/${tour?.id}`} className="hover:underline">{tour?.title || 'Unknown Tour'}</Link>
        <div className="flex items-center gap-1 font-mono p-1 bg-background rounded">
          <CalendarIcon className="h-4 w-4" />
          <span>{reservation.quantityReserved}x</span>
        </div>
      </div>
    </div>
  );
}

function MaterialReservationsList({ materialId }: { materialId: string }) {
  const firestore = useFirestore();

  const allReservationsQuery = useMemoFirebase(() => {
    return query(
      collectionGroup(firestore, 'materialReservations'),
      where('materialId', '==', materialId),
      orderBy('reservationDate', 'desc')
    );
  }, [firestore, materialId]);

  const {
    data: reservations,
    isLoading,
    error,
  } = useCollection<MaterialReservation>(allReservationsQuery);

  if (isLoading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Could not load reservations</AlertTitle>
        <AlertDescription>
          Ensure your Firestore security rules allow admins to query the 'materialReservations' collection group.
        </AlertDescription>
      </Alert>
    );
  }

  if (!reservations || reservations.length === 0) {
    return <p className="text-muted-foreground text-sm p-8 text-center border-2 border-dashed rounded-lg">No reservations for this item yet.</p>;
  }

  return (
    <div className="space-y-2">
      {reservations.map((res) => (
        <ReservationDetails key={res.id} reservation={res} />
      ))}
    </div>
  );
}

export default function GearDetailPage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const router = useRouter();
  const materialId = id as string;

  const materialDocRef = useMemoFirebase(
    () => (materialId ? doc(firestore, 'materials', materialId) : null),
    [firestore, materialId]
  );
  const { data: material, isLoading, error } = useDoc<Material>(materialDocRef);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeftIcon className="mr-2 h-4 w-4"/>
                Back to Gear List
            </Button>
        </div>

        {isLoading && (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-48 w-full mt-4" />
            </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error Loading Material</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {material && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <PackageIcon className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl font-bold">{material.name}</CardTitle>
                  <CardDescription>{material.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-4">Current Reservations</h3>
              <MaterialReservationsList materialId={material.id} />
            </CardContent>
          </Card>
        )}
        
        {!isLoading && !material && (
            <Alert>
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle>Material Not Found</AlertTitle>
                <AlertDescription>The requested gear item could not be found.</AlertDescription>
            </Alert>
        )}
      </div>
    </div>
  );
}
