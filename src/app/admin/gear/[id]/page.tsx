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
  updateDocumentNonBlocking
} from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageIcon, AlertTriangleIcon, UserIcon, MountainIcon, CalendarIcon, ArrowLeftIcon, CheckIcon, XIcon } from 'lucide-react';
import type { Material, MaterialReservation, Tour, UserProfile } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';

function ReservationStatusUpdater({ reservation }: { reservation: MaterialReservation }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    if (reservation.status !== 'pending') {
        return null; // Don't show buttons if not pending
    }
    
    // We need the original path to update the correct document.
    // The collection group query loses the full path. We must reconstruct it.
    const reservationRef = doc(firestore, 'users', reservation.userId, 'materialReservations', reservation.id);

    const handleUpdateStatus = (newStatus: 'approved' | 'rejected') => {
        updateDocumentNonBlocking(reservationRef, { status: newStatus });

        // If approved, we need to trigger the quantity update.
        // This is now handled by a Cloud Function listening for this status update.
        if (newStatus === 'approved') {
            toast({
                title: 'Reservation Approved',
                description: 'The material quantity will be updated shortly.'
            });
        } else {
             toast({
                title: 'Reservation Rejected',
            });
        }
    }

    return (
        <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateStatus('approved')}>
                <CheckIcon className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleUpdateStatus('rejected')}>
                <XIcon className="h-4 w-4" />
            </Button>
        </div>
    )
}

function ReservationDetails({ reservation }: { reservation: MaterialReservation }) {
  const firestore = useFirestore();

  const userRef = useMemoFirebase(
    () => (reservation.userId ? doc(firestore, 'users', reservation.userId) : null),
    [firestore, reservation.userId]
  );
  const { data: user, isLoading: userLoading } = useDoc<UserProfile>(userRef);

  const formatDateRange = (startDateIso: string, endDateIso: string) => {
    const start = new Date(startDateIso);
    const end = new Date(endDateIso);
    if (isSameDay(start, end)) {
      return format(start, 'PPP');
    }
    return `${format(start, 'PPP')} - ${format(end, 'PPP')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return <Badge variant="secondary">Pending</Badge>;
        case 'approved':
            return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
        case 'rejected':
            return <Badge variant="destructive">Rejected</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
  }


  if (userLoading) {
    return <Skeleton className="h-12 w-full rounded-lg" />;
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-center gap-3 mb-2 sm:mb-0">
        <UserIcon className="h-4 w-4" />
        <span className="font-medium">{user?.name || 'Unknown User'}</span>
      </div>
       <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          <span>{formatDateRange(reservation.startDate, reservation.endDate)}</span>
        </div>
        <div className="font-mono p-1 bg-background rounded">
          <span>{reservation.quantityReserved}x</span>
        </div>
        {getStatusBadge(reservation.status)}
      </div>
      <ReservationStatusUpdater reservation={reservation} />
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
              <h3 className="text-lg font-semibold mb-4">Reservation Requests</h3>
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
